import sys
import json
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

# Find invalid questions
query = """
SELECT id, question_text, option_a, grade FROM questions 
WHERE option_a = 'N/A' OR option_b = 'N/A' OR option_c = 'N/A' OR option_d = 'N/A'
   OR option_a IS NULL OR option_b IS NULL OR option_c IS NULL OR option_d IS NULL
   OR TRIM(option_a) = '' OR TRIM(option_b) = '' OR TRIM(option_c) = '' OR TRIM(option_d) = ''
   OR grade = 'N/A' OR grade IS NULL OR TRIM(grade) = ''
   OR exam_type = 'N/A'
   OR question_text LIKE 'Model Test-%';
"""
cursor.execute(query)
invalid_rows = cursor.fetchall()
invalid_ids = set([r['id'] for r in invalid_rows])
print(f"Total invalid / unparsed / N/A questions found: {len(invalid_ids)}")

if invalid_ids:
    id_list_str = ','.join(str(i) for i in invalid_ids)
    cursor.execute(f"DELETE FROM questions WHERE id IN ({id_list_str})")
    conn.commit()
    print(f"Successfully deleted {len(invalid_ids)} invalid questions from questions table.")

# Clean exams question_ids
cursor.execute("SELECT id, question_ids FROM exams")
exams = cursor.fetchall()

updated_exams = 0
for ex in exams:
    try:
        qids = json.loads(ex['question_ids'])
        cleaned_qids = [qid for qid in qids if qid not in invalid_ids]
        if len(cleaned_qids) != len(qids):
            cursor.execute("UPDATE exams SET question_ids = %s WHERE id = %s", (json.dumps(cleaned_qids), ex['id']))
            updated_exams += 1
    except Exception as e:
        pass

conn.commit()
print(f"Updated question_ids in {updated_exams} exams.")

cursor.execute("SELECT COUNT(*) as c FROM questions")
total_clean = cursor.fetchone()['c']
print(f"Total 100% valid questions remaining in database: {total_clean}")

conn.close()

