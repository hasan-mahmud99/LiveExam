import os
import sys
import json
import time
import re
import pymupdf
import pymysql
from google import genai
from google.genai import types

# Fix Windows stdout encoding for Bengali characters
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# MySQL connection
def get_mysql_conn():
    return pymysql.connect(
        host=os.getenv('MYSQL_HOST', '127.0.0.1'),
        port=int(os.getenv('MYSQL_PORT', 3306)),
        user=os.getenv('MYSQL_USER', 'root'),
        password=os.getenv('MYSQL_PASSWORD', ''),
        database=os.getenv('MYSQL_DATABASE', 'liveexam_db'),
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

PROGRESS_FILE = 'extraction_checkpoint.json'

def load_checkpoint():
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return {}

def save_checkpoint(ckpt):
    with open(PROGRESS_FILE, 'w', encoding='utf-8') as f:
        json.dump(ckpt, f, ensure_ascii=False, indent=2)

def extract_questions_from_page(client, img_bytes, default_subject, default_source):
    prompt = f"""
You are an expert exam question extractor for Bangladesh competitive exams (BCS, Bank, Primary Teacher, Ministry, Non-Cadre).
Examine this scanned book page and extract ALL multiple choice questions into a clean JSON array.

CRITICAL INSTRUCTION - SKIP WRITTEN QUESTIONS:
- ONLY extract Multiple Choice Questions (MCQs) that have options (ক/খ/গ/ঘ or a/b/c/d).
- STRICTLY SKIP all written exam questions (লিখিত প্রশ্ন, লিখিত পরীক্ষার প্রশ্নাবলি, Descriptive/Subjective questions) that do not have multiple-choice options.
- If a page contains theoretical discussion, written math problems, or no MCQs, return [].

For each valid MCQ question:
- question_text: Exact question in original Bengali/English.
- option_a: Option ক or A text
- option_b: Option খ or B text
- option_c: Option গ or C text
- option_d: Option ঘ or D text
- correct_option: 'A', 'B', 'C', or 'D' (from উত্তর: ক/খ/গ/ঘ or Ans: a/b/c/d)
- explanation: Comprehensive solution, grammar rule, and math shortcuts.
  CRITICAL INSTRUCTIONS BY SUBJECT:
  1. For Math (গণিত - Khairul's Basic Math):
     - Step 1: Detailed calculation (✍️ সমাধান: each equation and unitary step on its own line using \n).
     - Step 2: ALWAYS extract the shortcut formula if present on its own line (■ শর্টকাট সূত্র: e.g. '(বাড়া অথবা কমা × ১০০) / (১০০ ± বাড়া অথবা কমা) %').
     - Step 3: ALWAYS include boxed notes / memory points (e.g. 'যে বিষয়টা মনে রাখতে হবে: ...' or 'টিপস: ...').
     - FORMATTING: Never squish math steps into one continuous paragraph. Separate steps with clean line breaks (\n) like in the printed book.
  2. For English (Master English):
     - Capture the EXACT Bengali grammatical rule printed under black square (■), bullet, or note (e.g. '■ কোনো কিছু বা কাউকে খোঁজা বুঝাতে look, search, seek ইত্যাদি এর পরে for ব্যবহৃত হয়।').
     - Clearly explain WHY the correct option is right and why other options are incorrect, formatting option breakdowns with (a), (b), (c), (d) on separate lines.
     - Include word meanings/translations of options if printed.
  3. For Bangla & GK:
     - Include context, grammatical rules (সন্ধি, সমাস, কারক ইত্যাদি), and reference explanations.
- subject: '{default_subject}' or detected subject ('গণিত', 'English', 'সাধারণ জ্ঞান', 'বাংলা')
- topic: specific topic (e.g. 'মৌলিক সংখ্যা', 'Subject-Verb Agreement', 'প্রাচীন যুগ', 'আন্তর্জাতিক')
- exam_type: 'BCS', 'Bank', 'Primary', 'Ministry', or 'Non-Cadre' (detect from question bracket e.g. [৪০তম বিসিএস], [সোনালী ব্যাংক])
- grade: Grade/Class based on post:
  * 'Grade 9' for BCS Cadre, Senior Officer, Assistant Director
  * 'Grade 10' for 2nd Class, Bank Officer, Sub-Inspector, Senior Staff Nurse
  * 'Grade 13' for Primary Assistant Teacher
- exam_source: Source tag e.g. '৪০তম বিসিএস' or '{default_source}'
- year: 4-digit year if mentioned, else null

Return ONLY a valid JSON array of question objects.
"""
    # Model fallback hierarchy with active working models
    models_to_try = [
        'gemini-3.1-flash-lite',
        'gemini-3.7-flash',
        'gemini-3.8-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash'
    ]
    for m in models_to_try:
        max_attempts = 3
        for attempt in range(max_attempts):
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=[
                        types.Part.from_bytes(data=img_bytes, mime_type='image/jpeg'),
                        prompt
                    ],
                    config=types.GenerateContentConfig(
                        response_mime_type='application/json',
                        temperature=0.1
                    )
                )
                parsed = json.loads(response.text)
                return parsed, False
            except Exception as e:
                err_str = str(e)
                if '429' in err_str or 'RESOURCE_EXHAUSTED' in err_str:
                    print(f"[{m} Quota reached, trying next model...]")
                    break # try next model
                elif '503' in err_str or 'UNAVAILABLE' in err_str:
                    if attempt < max_attempts - 1:
                        time.sleep(3)
                        continue
                    else:
                        print(f"[{m} 503 high demand after retries]")
                        break
                else:
                    print(f"Extraction error with {m}: {err_str[:120]}")
                    return [], False

    return [], True

def insert_questions_to_db(conn, questions):
    if not questions:
        return 0

    try:
        conn.ping(reconnect=True)
    except Exception:
        pass

    inserted = 0
    with conn.cursor() as cur:
        for q in questions:
            q_text = (q.get('question_text') or '').strip()
            # Strip leading chapter question numbers from printed books (e.g. "32. ", "৫৪. ", "(12) ")
            q_text = re.sub(r'^(?:\([0-9০-৯]+\)|[0-9০-৯]+[\.\)])\s+', '', q_text).strip()
            if not q_text or len(q_text) < 5:
                continue

            # Check duplicate by checking first 40 characters
            cur.execute(
                "SELECT id FROM questions WHERE question_text LIKE %s LIMIT 1",
                (q_text[:40] + '%',)
            )
            if cur.fetchone():
                continue

            opt_a = (q.get('option_a') or '').strip()
            opt_b = (q.get('option_b') or '').strip()
            opt_c = (q.get('option_c') or '').strip()
            opt_d = (q.get('option_d') or '').strip()

            # Strictly skip written questions that do not have multiple choice options
            if not opt_a or not opt_b or (not opt_c and not opt_d):
                continue
            corr = (q.get('correct_option') or 'A').strip().upper()
            if corr not in ['A', 'B', 'C', 'D']:
                corr = 'A'

            expl = q.get('explanation') or ''
            subj = q.get('subject') or 'সাধারণ জ্ঞান'
            topic = q.get('topic') or ''
            exam_type = q.get('exam_type') or 'BCS'
            grade = q.get('grade') or 'Grade 9'
            exam_src = q.get('exam_source') or ''
            year = q.get('year')
            if year:
                try:
                    year = int(year)
                except:
                    year = None

            cur.execute("""
                INSERT INTO questions (
                    question_text, option_a, option_b, option_c, option_d,
                    correct_option, explanation, subject, topic,
                    exam_type, grade, exam_source, year
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                q_text, opt_a, opt_b, opt_c, opt_d,
                corr, expl, subj, topic,
                exam_type, grade, exam_src, year
            ))
            inserted += 1

    conn.commit()
    return inserted

def run_extraction(target_pages_per_book=50, max_questions_target=300):
    print("="*60)
    print(f"Starting Extraction Pipeline (Target: Stop after {max_questions_target} questions)")
    print("="*60)

    client = genai.Client()
    conn = get_mysql_conn()
    checkpoint = load_checkpoint()

    books = [
        {
            "file": "Master English [bdniyog.com].pdf",
            "subject": "English",
            "source": "Master English - Jahangir Alam",
            "start_page": 14, # collective noun / questions
            "max_pages": target_pages_per_book
        },
        {
            "file": "Khairul Basic Math 2020.pdf",
            "subject": "গণিত",
            "source": "খায়রুলস বেসিক ম্যাথ",
            "start_page": 24, # prime numbers chapter
            "max_pages": target_pages_per_book
        },
        {
            "file": "অন্বেষণ by শাওন স্যার.pdf",
            "subject": "বাংলা",
            "source": "অন্বেষণ - বাংলা ভাষা ও সাহিত্য",
            "start_page": 10, # Charyapada questions
            "max_pages": target_pages_per_book
        },
        {
            "file": "BCS GK 10th to 50th exambd.net-Copy.pdf",
            "subject": "সাধারণ জ্ঞান",
            "source": "বিসিএস প্রিলিমিনারি প্রশ্ন সমাধান",
            "start_page": 4, # questions start here
            "max_pages": target_pages_per_book
        }
    ]

    total_extracted_session = 0
    quota_exhausted = False

    for book in books:
        if quota_exhausted or total_extracted_session >= max_questions_target:
            break

        pdf_path = book["file"]
        if not os.path.exists(pdf_path):
            print(f"Skipping {pdf_path}: file not found")
            continue

        doc = pymupdf.open(pdf_path)
        book_key = os.path.basename(pdf_path)
        last_processed = checkpoint.get(book_key, book["start_page"] - 1)

        print(f"\nProcessing book: {book_key} (Subject: {book['subject']})")
        print(f"Total pages in PDF: {len(doc)} | Resuming from page: {last_processed + 1}")

        start = last_processed + 1
        end = min(start + book["max_pages"], len(doc))

        book_inserted = 0
        # Calculate target per book dynamically based on remaining active books
        active_books_count = sum(1 for b in books if checkpoint.get(os.path.basename(b["file"]), 0) < len(pymupdf.open(b["file"])) - 1)
        book_target = max(100, max_questions_target // max(1, active_books_count))

        for p_idx in range(start, end):
            if total_extracted_session >= max_questions_target:
                print(f"\n[TARGET REACHED] Reached {total_extracted_session} questions for this batch (Target: {max_questions_target}). Stopping batch.")
                break

            if book_inserted >= book_target and total_extracted_session < (max_questions_target - 50):
                print(f"\n[BALANCED BATCH] Reached {book_inserted} questions for {book['subject']}. Switching to next subject for balanced growth.")
                break

            print(f"  Rendering page {p_idx + 1}/{len(doc)}...", end=" ", flush=True)
            page = doc[p_idx]
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("jpeg")

            questions, is_quota_error = extract_questions_from_page(
                client, img_bytes, book["subject"], book["source"]
            )

            if is_quota_error:
                print("\n[!] Daily API quota reached across all available Gemini models. Pausing extraction safely.")
                quota_exhausted = True
                save_checkpoint(checkpoint)
                break

            inserted = insert_questions_to_db(conn, questions)
            book_inserted += inserted
            total_extracted_session += inserted

            print(f"Found {len(questions)} Qs -> Inserted {inserted} new into MySQL (Session Total: {total_extracted_session}/{max_questions_target})")
            checkpoint[book_key] = p_idx
            save_checkpoint(checkpoint)
            time.sleep(1) # respectful rate pacing

        print(f"Finished section for {book_key}: Added {book_inserted} questions")

    # Update sample exam to include all latest question IDs
    with conn.cursor() as cur:
        cur.execute("SELECT id FROM questions ORDER BY id ASC")
        all_ids = [r['id'] for r in cur.fetchall()]
        cur.execute("""
            UPDATE exams 
            SET question_ids = %s 
            WHERE id = 'exam-bcs-mega-1'
        """, (json.dumps(all_ids),))
    conn.commit()

    # Print summary
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) as total FROM questions")
        total_in_db = cur.fetchone()['total']

        cur.execute("SELECT subject, COUNT(*) as c FROM questions GROUP BY subject")
        sub_counts = cur.fetchall()

    conn.close()

    # Re-run preset exams creation and topic standardization to incorporate new questions
    try:
        import subprocess
        subprocess.run([sys.executable, "scripts/standardize_topics.py"], check=False)
        subprocess.run([sys.executable, "scripts/create_preset_exams.py"], check=False)
        subprocess.run([sys.executable, "scripts/export_db.py"], check=False)
    except Exception as e:
        print(f"Failed to update preset exams, topics or backup: {e}")

    print("\n" + "="*60)
    print(f"Extraction Batch Completed!")
    print(f"New questions added this session: {total_extracted_session} (Target: {max_questions_target})")
    print(f"Total questions now in MySQL liveexam_db: {total_in_db}")
    print("Subject breakdown in MySQL:")
    for s in sub_counts:
        print(f"  - {s['subject']}: {s['c']} questions")
    print("="*60)

if __name__ == "__main__":
    target = 300 # default stop at 300 questions
    if len(sys.argv) > 1:
        target = int(sys.argv[1])
    run_extraction(target_pages_per_book=100, max_questions_target=target)

