import sys
import json
import random
import pymysql

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

conn = pymysql.connect(
    host='127.0.0.1',
    port=3306,
    user='root',
    password='',
    database='liveexam_db',
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)
cursor = conn.cursor()

print("Fetching question pools from liveexam_db...")

# 1. Fetch pools
cursor.execute("SELECT id, subject, topic, grade, exam_type FROM questions")
all_questions = cursor.fetchall()
print(f"Total questions available: {len(all_questions)}")

# Categorize questions into pools
grade_10_13_pool = [q['id'] for q in all_questions if q['grade'] in ['Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']]
grade_13_16_pool = [q['id'] for q in all_questions if q['grade'] in ['Grade 13', 'Grade 14', 'Grade 15', 'Grade 16', 'Grade 13-16'] or q['exam_type'] in ['Primary', 'Ministry', 'Non-Cadre']]
bcs_pool = [q['id'] for q in all_questions if q['grade'] == 'Grade 9' or q['exam_type'] == 'BCS']
math_pool = [q['id'] for q in all_questions if q['subject'] == 'গণিত']
english_pool = [q['id'] for q in all_questions if q['subject'] == 'English']
bangla_pool = [q['id'] for q in all_questions if q['subject'] == 'বাংলা']
gk_pool = [q['id'] for q in all_questions if q['subject'] == 'সাধারণ জ্ঞান']

# Topic-specific pools
math_percent_profit = [q['id'] for q in all_questions if q['subject'] == 'গণিত' and any(k in (q['topic'] or '') for k in ['শতকরা', 'লাভ-ক্ষতি'])]
math_interest = [q['id'] for q in all_questions if q['subject'] == 'গণিত' and any(k in (q['topic'] or '') for k in ['মুনাফা', 'সুদ', 'আসল'])]
math_fraction = [q['id'] for q in all_questions if q['subject'] == 'গণিত' and any(k in (q['topic'] or '') for k in ['ভগ্নাংশ', 'দশমিক', 'অনুপাত'])]
math_speed_work = [q['id'] for q in all_questions if q['subject'] == 'গণিত' and any(k in (q['topic'] or '') for k in ['ঐকিক', 'গতিবেগ', 'দূরত্ব', 'কাজ', 'নল'])]
math_algebra_geo = [q['id'] for q in all_questions if q['subject'] == 'গণিত' and any(k in (q['topic'] or '') for k in ['বীজগণিত', 'মান নির্ণয়', 'সূচক', 'লগারিদম', 'জ্যামিতি', 'ত্রিভুজ'])]

eng_preposition = [q['id'] for q in all_questions if q['subject'] == 'English' and 'Preposition' in (q['topic'] or '')]
eng_parts = [q['id'] for q in all_questions if q['subject'] == 'English' and any(k in (q['topic'] or '') for k in ['Parts of Speech', 'Noun', 'Pronoun', 'Adjective', 'Adverb'])]
eng_verb_tense = [q['id'] for q in all_questions if q['subject'] == 'English' and any(k in (q['topic'] or '') for k in ['Tense', 'Verb', 'Agreement', 'Subject-Verb'])]
eng_voice_narration = [q['id'] for q in all_questions if q['subject'] == 'English' and any(k in (q['topic'] or '') for k in ['Voice', 'Narration', 'Correction', 'Sentence'])]

bangla_sandhi_samas = [q['id'] for q in all_questions if q['subject'] == 'বাংলা' and any(k in (q['topic'] or '') for k in ['সন্ধি', 'সমাস', 'কারক'])]
bangla_spelling_phonetics = [q['id'] for q in all_questions if q['subject'] == 'বাংলা' and any(k in (q['topic'] or '') for k in ['বানান', 'ধ্বনি', 'বর্ণ', 'শব্দ'])]

print(f"Pool sizes -> 10-13: {len(grade_10_13_pool)}, 13-16: {len(grade_13_16_pool)}, BCS: {len(bcs_pool)}, Math: {len(math_pool)}, English: {len(english_pool)}, Bangla: {len(bangla_pool)}")

practice_sets = []

# Helper to pick N items
def sample_from_pool(pool, n=20):
    if len(pool) >= n:
        return random.sample(pool, n)
    elif pool:
        return random.choices(pool, k=n)
    return random.sample([q['id'] for q in all_questions], n)

# -------------------------------------------------------------
# 1. ১০ম-১৩তম গ্রেড প্র্যাকটিস সেট (25 Sets)
# -------------------------------------------------------------
for i in range(1, 11):
    q_ids = sample_from_pool([qid for qid in grade_10_13_pool if qid in math_pool], 20)
    practice_sets.append({
        'id': f'practice-grade10-13-math-{i}',
        'title': f'১০ম-১৩তম গ্রেড: গণিত ও মানসিক দক্ষতা স্পিড টেস্ট - সেট {i:02d}',
        'description': f'নন-ক্যাডার ১০ম-১৩তম গ্রেড ও শিক্ষক নিয়োগ উপযোগী ২০টি গুরুত্বপূর্ণ গণিত প্রশ্নের অনুশীলন।',
        'category': '১০-১৩ গ্রেড',
        'subject': 'গণিত',
        'grade_filter': '10-13',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 11):
    sub_pool = [qid for qid in grade_10_13_pool if qid in english_pool or qid in bangla_pool]
    q_ids = sample_from_pool(sub_pool, 20)
    practice_sets.append({
        'id': f'practice-grade10-13-lang-{i}',
        'title': f'১০ম-১৩তম গ্রেড: ইংরেজি ও বাংলা ব্যাকরণ অনুশীলন - সেট {i:02d}',
        'description': f'১০ম-১৩তম গ্রেড পদের জন্য ইংরেজি গ্রামার ও বাংলা ব্যাকরণ থেকে ২০টি প্রশ্ন।',
        'category': '১০-১৩ গ্রেড',
        'subject': 'ইংরেজি ও বাংলা',
        'grade_filter': '10-13',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(grade_10_13_pool, 25)
    practice_sets.append({
        'id': f'practice-grade10-13-full-{i}',
        'title': f'১০ম-১৩তম গ্রেড: পূর্ণাঙ্গ প্রস্তুতি মিনি টেস্ট - সেট {i:02d}',
        'description': f'গণিত, ইংরেজি, বাংলা ও সাধারণ জ্ঞানের সমন্বয়ে ২৫টি মডেল প্রশ্নের সেট।',
        'category': '১০-১৩ গ্রেড',
        'subject': 'সম্মিলিত',
        'grade_filter': '10-13',
        'duration_minutes': 20,
        'question_ids': q_ids
    })

# -------------------------------------------------------------
# 2. ১৩তম-১৬তম গ্রেড প্র্যাকটিস সেট (25 Sets)
# -------------------------------------------------------------
for i in range(1, 11):
    q_ids = sample_from_pool(grade_13_16_pool, 20)
    practice_sets.append({
        'id': f'practice-grade13-16-office-{i}',
        'title': f'১৩তম-১৬তম গ্রেড: অফিস সহকারী ও কম্পিউটার অপারেটর স্পেশাল - সেট {i:02d}',
        'description': f'মন্ত্রণালয় ও অধিদপ্তরের ১৩-১৬তম গ্রেড নিয়োগ পরীক্ষার জন্য নির্বাচিত ২০টি প্রশ্ন।',
        'category': '১৩-১৬ গ্রেড',
        'subject': 'সম্মিলিত',
        'grade_filter': '13-16',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 9):
    sub_pool = [qid for qid in grade_13_16_pool if qid in math_pool] or math_pool
    q_ids = sample_from_pool(sub_pool, 20)
    practice_sets.append({
        'id': f'practice-grade13-16-math-{i}',
        'title': f'১৩তম-১৬তম গ্রেড: সহজ পাটিগণিত ও বেসিক ম্যাথ - সেট {i:02d}',
        'description': f'ঐকিক নিয়ম, শতকরা ও লাভ-ক্ষতির সহজ নিয়মাবলী সংবলিত ২০টি প্রশ্ন।',
        'category': '১৩-১৬ গ্রেড',
        'subject': 'গণিত',
        'grade_filter': '13-16',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 8):
    sub_pool = [qid for qid in grade_13_16_pool if qid in gk_pool or qid in bangla_pool] or gk_pool
    q_ids = sample_from_pool(sub_pool, 20)
    practice_sets.append({
        'id': f'practice-grade13-16-gk-{i}',
        'title': f'১৩তম-১৬তম গ্রেড: সাধারণ জ্ঞান ও বাংলা ডাইজেস্ট - সেট {i:02d}',
        'description': f'বাংলাদেশ বিষয়াবলি, আন্তর্জাতিক ও বাংলা ব্যাকরণ অনুশীলন।',
        'category': '১৩-১৬ গ্রেড',
        'subject': 'সাধারণ জ্ঞান ও বাংলা',
        'grade_filter': '13-16',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

# -------------------------------------------------------------
# 3. বিসিএস ও ৯ম গ্রেড (BCS & 9th Grade) প্র্যাকটিস সেট (25 Sets)
# -------------------------------------------------------------
for i in range(1, 7):
    sub_pool = [qid for qid in bcs_pool if qid in math_pool] or math_pool
    q_ids = sample_from_pool(sub_pool, 20)
    practice_sets.append({
        'id': f'practice-bcs-math-{i}',
        'title': f'বিসিএস ও ৯ম গ্রেড: গণিত ও জ্যামিতি মাস্টারি - সেট {i:02d}',
        'description': f'বিসিএস প্রিলিমিনারি মানের কঠিন ও মানসম্মত ২০টি গণিত প্রশ্ন।',
        'category': 'বিসিএস (৯ম গ্রেড)',
        'subject': 'গণিত',
        'grade_filter': 'Grade 9',
        'duration_minutes': 20,
        'question_ids': q_ids
    })

for i in range(1, 7):
    sub_pool = [qid for qid in bcs_pool if qid in english_pool] or english_pool
    q_ids = sample_from_pool(sub_pool, 20)
    practice_sets.append({
        'id': f'practice-bcs-english-{i}',
        'title': f'বিসিএস ও ৯ম গ্রেড: ইংলিশ গ্রামার ও ভোকাবুলারি - সেট {i:02d}',
        'description': f'বিসিএস ও সরকারি ব্যাংকের উচ্চমানের ২০টি ইংরেজি প্রশ্ন।',
        'category': 'বিসিএস (৯ম গ্রেড)',
        'subject': 'English',
        'grade_filter': 'Grade 9',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 7):
    sub_pool = [qid for qid in bcs_pool if qid in bangla_pool] or bangla_pool
    q_ids = sample_from_pool(sub_pool, 20)
    practice_sets.append({
        'id': f'practice-bcs-bangla-{i}',
        'title': f'বিসিএস ও ৯ম গ্রেড: বাংলা ভাষা ও সাহিত্য অন্বেষণ - সেট {i:02d}',
        'description': f'বিসিএস প্রিলিমিনারি বাংলা সাহিত্যের প্রাচীন, মধ্য ও আধুনিক যুগ এবং ব্যাকরণ।',
        'category': 'বিসিএস (৯ম গ্রেড)',
        'subject': 'বাংলা',
        'grade_filter': 'Grade 9',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 7):
    sub_pool = [qid for qid in bcs_pool if qid in gk_pool] or gk_pool
    q_ids = sample_from_pool(sub_pool, 20)
    practice_sets.append({
        'id': f'practice-bcs-gk-{i}',
        'title': f'বিসিএস ও ৯ম গ্রেড: সাধারণ জ্ঞান ও আন্তর্জাতিক বিষয়াবলি - সেট {i:02d}',
        'description': f'মুক্তিযুদ্ধ, সংবিধান, অর্থনৈতিক সমীক্ষা ও আন্তর্জাতিক সংস্থা সম্পর্কিত প্রশ্নাবলী।',
        'category': 'বিসিএস (৯ম গ্রেড)',
        'subject': 'সাধারণ জ্ঞান',
        'grade_filter': 'Grade 9',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

# -------------------------------------------------------------
# 4. গণিত অধ্যায়ভিত্তিক স্পিড প্র্যাকটিস সেট (25 Sets)
# -------------------------------------------------------------
for i in range(1, 6):
    q_ids = sample_from_pool(math_percent_profit or math_pool, 20)
    practice_sets.append({
        'id': f'practice-math-percent-{i}',
        'title': f'গণিত স্পেশাল: শতকরা ও লাভ-ক্ষতি শর্টকাট টেস্ট - সেট {i:02d}',
        'description': f'খায়রুলস বেসিক ম্যাথের শতকরা এবং লাভ-ক্ষতি অধ্যায় থেকে ২০টি শর্টকাট ভিত্তিক প্রশ্ন।',
        'category': 'গণিত (Math)',
        'subject': 'গণিত',
        'grade_filter': 'all',
        'duration_minutes': 18,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(math_interest or math_pool, 20)
    practice_sets.append({
        'id': f'practice-math-interest-{i}',
        'title': f'গণিত স্পেশাল: সরল ও চক্রবৃদ্ধি মুনাফা (সুদকষা) - সেট {i:02d}',
        'description': f'সরল মুনাফা ও চক্রবৃদ্ধি মুনাফার গুরুত্বপূর্ণ টেকনিক ও সমীকরণ।',
        'category': 'গণিত (Math)',
        'subject': 'গণিত',
        'grade_filter': 'all',
        'duration_minutes': 18,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(math_fraction or math_pool, 20)
    practice_sets.append({
        'id': f'practice-math-fraction-{i}',
        'title': f'গণিত স্পেশাল: ভগ্নাংশ, অনুপাত ও দশমিক - সেট {i:02d}',
        'description': f'অনুপাত-সমানুপাত ও জটিল ভগ্নাংশের সমাধান টেকনিক।',
        'category': 'গণিত (Math)',
        'subject': 'গণিত',
        'grade_filter': 'all',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(math_speed_work or math_pool, 20)
    practice_sets.append({
        'id': f'practice-math-speed-{i}',
        'title': f'গণিত স্পেশাল: গতিবেগ, দূরত্ব ও ঐকিক নিয়ম - সেট {i:02d}',
        'description': f'নৌকা-স্রোত, ট্রেন ও সময়-দূরত্বের ২০টি গুরুত্বপূর্ণ প্রশ্ন।',
        'category': 'গণিত (Math)',
        'subject': 'গণিত',
        'grade_filter': 'all',
        'duration_minutes': 18,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(math_algebra_geo or math_pool, 20)
    practice_sets.append({
        'id': f'practice-math-algebra-{i}',
        'title': f'গণিত স্পেশাল: বীজগণিত, সূচক, লগ ও জ্যামিতি - সেট {i:02d}',
        'description': f'বীজগণিতীয় সূত্রাবলি, ত্রিভুজ ও চতুর্ভুজের জ্যামিতিক সমাধান।',
        'category': 'গণিত (Math)',
        'subject': 'গণিত',
        'grade_filter': 'all',
        'duration_minutes': 20,
        'question_ids': q_ids
    })

# -------------------------------------------------------------
# 5. ইংরেজি গ্রামার ও ভোকাবুলারি স্পেশাল সেট (20 Sets)
# -------------------------------------------------------------
for i in range(1, 6):
    q_ids = sample_from_pool(eng_preposition or english_pool, 20)
    practice_sets.append({
        'id': f'practice-eng-prep-{i}',
        'title': f'Master English: Appropriate Preposition Mastery - সেট {i:02d}',
        'description': f'মাস্টার ইংলিশ বই থেকে বাছাইকৃত ২০টি Appropriate Preposition।',
        'category': 'ইংরেজি (English)',
        'subject': 'English',
        'grade_filter': 'all',
        'duration_minutes': 12,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(eng_parts or english_pool, 20)
    practice_sets.append({
        'id': f'practice-eng-parts-{i}',
        'title': f'Master English: Parts of Speech & Identification - সেট {i:02d}',
        'description': f'Noun, Pronoun, Adjective, Adverb ও অন্যান্য Parts of Speech শনাক্তকরণ।',
        'category': 'ইংরেজি (English)',
        'subject': 'English',
        'grade_filter': 'all',
        'duration_minutes': 12,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(eng_verb_tense or english_pool, 20)
    practice_sets.append({
        'id': f'practice-eng-tense-{i}',
        'title': f'Master English: Right Form of Verbs & Tense - সেট {i:02d}',
        'description': f'Subject-Verb Agreement, Conditionals ও Tense-এর ২০টি প্রশ্ন।',
        'category': 'ইংরেজি (English)',
        'subject': 'English',
        'grade_filter': 'all',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(eng_voice_narration or english_pool, 20)
    practice_sets.append({
        'id': f'practice-eng-voice-{i}',
        'title': f'Master English: Voice, Narration & Correction - সেট {i:02d}',
        'description': f'Active-Passive Voice, Direct-Indirect Narration এবং Sentence Correction।',
        'category': 'ইংরেজি (English)',
        'subject': 'English',
        'grade_filter': 'all',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

# -------------------------------------------------------------
# 6. বাংলা ব্যাকরণ ও সাহিত্য অনুশীলন সেট (15 Sets)
# -------------------------------------------------------------
for i in range(1, 6):
    q_ids = sample_from_pool(bangla_sandhi_samas or bangla_pool, 20)
    practice_sets.append({
        'id': f'practice-bangla-sandhi-{i}',
        'title': f'বাংলা অন্বেষণ: সন্ধি, সমাস ও কারক প্র্যাকটিস - সেট {i:02d}',
        'description': f'শাওন স্যারের অন্বেষণ বই থেকে সন্ধি, সমাস ও কারক-বিভক্তির ২০টি প্রশ্ন।',
        'category': 'বাংলা (Bangla)',
        'subject': 'বাংলা',
        'grade_filter': 'all',
        'duration_minutes': 15,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(bangla_spelling_phonetics or bangla_pool, 20)
    practice_sets.append({
        'id': f'practice-bangla-spelling-{i}',
        'title': f'বাংলা অন্বেষণ: বানান শুদ্ধি ও ধ্বনি পরিবর্তন - সেট {i:02d}',
        'description': f'ণ-ত্ব ও ষ-ত্ব বিধান, বানান শুদ্ধি ও ধ্বনি পরিবর্তনের ২০টি প্রশ্ন।',
        'category': 'বাংলা (Bangla)',
        'subject': 'বাংলা',
        'grade_filter': 'all',
        'duration_minutes': 12,
        'question_ids': q_ids
    })

for i in range(1, 6):
    q_ids = sample_from_pool(bangla_pool, 25)
    practice_sets.append({
        'id': f'practice-bangla-full-{i}',
        'title': f'বাংলা অন্বেষণ: পূর্ণাঙ্গ ভাষা ও সাহিত্য স্পেশাল - সেট {i:02d}',
        'description': f'বাংলা ব্যাকরণ ও প্রাচীন-আধুনিক সাহিত্যের ২৫টি প্রশ্ন সংবলিত পূর্ণাঙ্গ সেট।',
        'category': 'বাংলা (Bangla)',
        'subject': 'বাংলা',
        'grade_filter': 'all',
        'duration_minutes': 18,
        'question_ids': q_ids
    })

print(f"\nGenerated {len(practice_sets)} practice sets across all categories!")

# Insert / Update into MySQL exams table
inserted_count = 0
for p in practice_sets:
    # We tag category directly in description or title
    desc_with_cat = f"[{p['category']}] {p['description']}"
    cursor.execute("""
        INSERT INTO exams (
            id, title, description, mode, subject, exam_type_filter, grade_filter,
            duration_minutes, negative_marking, marks_per_question, question_ids, is_active
        ) VALUES (%s, %s, %s, 'practice', %s, NULL, %s, %s, 0.25, 1.0, %s, 1)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            mode = 'practice',
            subject = VALUES(subject),
            grade_filter = VALUES(grade_filter),
            duration_minutes = VALUES(duration_minutes),
            question_ids = VALUES(question_ids),
            is_active = 1;
    """, (
        p['id'],
        p['title'],
        desc_with_cat,
        p['subject'],
        p['grade_filter'],
        p['duration_minutes'],
        json.dumps(p['question_ids'])
    ))
    inserted_count += 1

conn.commit()
print(f"Successfully inserted/updated {inserted_count} practice sets in MySQL liveexam_db!")

cursor.execute("SELECT COUNT(*) as c FROM exams WHERE mode = 'practice'")
print(f"Total practice sets now in database: {cursor.fetchone()['c']}")

cursor.execute("SELECT COUNT(*) as c FROM exams WHERE mode = 'live'")
print(f"Total live exams in database: {cursor.fetchone()['c']}")

conn.close()

