import pymysql
import json
import sys

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

cur = conn.cursor()

def create_or_update_exam(exam_data, question_query, query_params, limit):
    cur.execute(f"SELECT id FROM questions WHERE {question_query} ORDER BY RAND() LIMIT %s", (*query_params, limit))
    rows = cur.fetchall()
    q_ids = [r['id'] for r in rows]

    if not q_ids:
        print(f"No questions found for exam: {exam_data['title']}")
        return

    cur.execute("""
        INSERT INTO exams (
            id, title, description, mode, subject, exam_type_filter, grade_filter,
            duration_minutes, negative_marking, marks_per_question, scheduled_start_time,
            question_ids, is_active
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, 1
        ) ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            duration_minutes = VALUES(duration_minutes),
            question_ids = VALUES(question_ids)
    """, (
        exam_data['id'],
        exam_data['title'],
        exam_data['description'],
        exam_data['mode'],
        exam_data['subject'],
        exam_data['exam_type_filter'],
        exam_data['grade_filter'],
        exam_data['duration_minutes'],
        exam_data['negative_marking'],
        1.0,
        None,
        json.dumps(q_ids)
    ))
    print(f"Created/Updated Exam: {exam_data['title']} with {len(q_ids)} questions")

preset_exams = [
    {
        "exam": {
            "id": "bcs-mega-preli-100",
            "title": "৪৭তম ও ৪৮তম বিসিএস প্রিলিমিনারি পূর্ণাঙ্গ মেগা মডেল টেস্ট",
            "description": "বাংলা, ইংরেজি, গণিত, বিজ্ঞান ও সাধারণ জ্ঞানের ১০০ নম্বরের পূর্ণাঙ্গ বিসিএস প্রস্তুতি পরীক্ষা",
            "mode": "live",
            "subject": "all",
            "exam_type_filter": "BCS",
            "grade_filter": "Grade 9",
            "duration_minutes": 60,
            "negative_marking": 0.25
        },
        "query": "grade = 'Grade 9' AND (subject IN ('বাংলা', 'English', 'গণিত', 'সাধারণ জ্ঞান', 'বিজ্ঞান'))",
        "params": (),
        "limit": 100
    },
    {
        "exam": {
            "id": "bank-senior-officer-50",
            "title": "কম্বাইন্ড ব্যাংক অফিসার ও সিনিয়র অফিসার স্পেশাল মডেল টেস্ট",
            "description": "ইংলিশ ও গণিত প্রাধান্য দিয়ে ৫০ নম্বরের ব্যাংক নিয়োগ প্রস্তুতি পরীক্ষা",
            "mode": "live",
            "subject": "all",
            "exam_type_filter": "Bank",
            "grade_filter": "Grade 9",
            "duration_minutes": 45,
            "negative_marking": 0.50
        },
        "query": "(exam_type = 'Bank' OR subject IN ('English', 'গণিত'))",
        "params": (),
        "limit": 50
    },
    {
        "exam": {
            "id": "primary-teacher-80",
            "title": "প্রাথমিক সহকারী শিক্ষক নিয়োগ স্পেশাল মডেল টেস্ট - ০১",
            "description": "১৩তম গ্রেড প্রাথমিক শিক্ষক নিয়োগ পরীক্ষার পূর্ণাঙ্গ সিলেবাসভিত্তিক ৮০ নম্বরের পরীক্ষা",
            "mode": "live",
            "subject": "all",
            "exam_type_filter": "Primary",
            "grade_filter": "Grade 13",
            "duration_minutes": 60,
            "negative_marking": 0.25
        },
        "query": "(grade = 'Grade 13' OR exam_type = 'Primary' OR grade = 'Grade 10')",
        "params": (),
        "limit": 80
    },
    {
        "exam": {
            "id": "khairul-math-speed-30",
            "title": "খায়রুলস বেসিক ম্যাথ স্পিড টেস্ট (বাস্তব সংখ্যা ও ঐকিক নিয়ম)",
            "description": "গণিতের দক্ষতা বৃদ্ধির জন্য ৩০ নম্বরের সময়ভিত্তিক বিশেষ পরীক্ষা",
            "mode": "practice",
            "subject": "গণিত",
            "exam_type_filter": "all",
            "grade_filter": "all",
            "duration_minutes": 30,
            "negative_marking": 0.25
        },
        "query": "subject = 'গণিত'",
        "params": (),
        "limit": 30
    },
    {
        "exam": {
            "id": "master-english-vocab-grammar-35",
            "title": "মাস্টার ইংলিশ গ্রামার, পার্টস অব স্পিচ ও ভোকাবুলারি টেস্ট",
            "description": "বিসিএস ও ব্যাংক পরীক্ষার বিগত বছরের বাছাইকৃত ৩৫টি ইংরেজি প্রশ্ন",
            "mode": "practice",
            "subject": "English",
            "exam_type_filter": "all",
            "grade_filter": "all",
            "duration_minutes": 25,
            "negative_marking": 0.25
        },
        "query": "subject = 'English'",
        "params": (),
        "limit": 35
    },
    {
        "exam": {
            "id": "bangla-sahitya-shaon-40",
            "title": "বাংলা ভাষা ও সাহিত্য অন্বেষণ স্পেশাল টেস্ট",
            "description": "চর্যাপদ, মধ্যযুগ ও আধুনিক যুগের বিশিষ্ট সাহিত্যিকদের ওপর ৪০ নম্বরের টেস্ট",
            "mode": "practice",
            "subject": "বাংলা",
            "exam_type_filter": "all",
            "grade_filter": "all",
            "duration_minutes": 30,
            "negative_marking": 0.25
        },
        "query": "subject = 'বাংলা'",
        "params": (),
        "limit": 40
    },
    {
        "exam": {
            "id": "noncadre-10th-grade-50",
            "title": "১০ম গ্রেড সাব-ইন্সপেক্টর (SI) ও নন-ক্যাডার মডেল টেস্ট",
            "description": "দ্বিতীয় শ্রেণির সরকারি চাকরি পরীক্ষার ৫০ নম্বরের মডেল টেস্ট",
            "mode": "live",
            "subject": "all",
            "exam_type_filter": "Non-Cadre",
            "grade_filter": "Grade 10",
            "duration_minutes": 40,
            "negative_marking": 0.25
        },
        "query": "grade = 'Grade 10' OR exam_type = 'Non-Cadre'",
        "params": (),
        "limit": 50
    },
    {
        "exam": {
            "id": "bcs-gk-digest-50",
            "title": "১০ম থেকে ৪৫তম বিসিএস বিগত বছরের সাধারণ জ্ঞান ডাইজেস্ট",
            "description": "বাংলাদেশ ও আন্তর্জাতিক বিষয়াবলির ৫০ নম্বরের বিগত বছরের বাছাইকৃত প্রশ্ন সমাধান পরীক্ষা",
            "mode": "live",
            "subject": "সাধারণ জ্ঞান",
            "exam_type_filter": "BCS",
            "grade_filter": "Grade 9",
            "duration_minutes": 35,
            "negative_marking": 0.50
        },
        "query": "subject = 'সাধারণ জ্ঞান' AND exam_type = 'BCS'",
        "params": (),
        "limit": 50
    },
    {
        "exam": {
            "id": "weekly-math-english-special-50",
            "title": "সাপ্তাহিক লাইভ টেস্ট: গণিত ও ইংরেজি স্পেশাল (ব্যাংক ও বিসিএস)",
            "description": "গণিত ও ইংরেজির গুরুত্বপূর্ণ অধ্যায়সমূহের ওপর ৫০ নম্বরের সমন্বিত টেস্ট",
            "mode": "live",
            "subject": "all",
            "exam_type_filter": "all",
            "grade_filter": "Grade 9",
            "duration_minutes": 45,
            "negative_marking": 0.25
        },
        "query": "subject IN ('গণিত', 'English')",
        "params": (),
        "limit": 50
    },
    {
        "exam": {
            "id": "bcs-bangla-literature-grammar-35",
            "title": "বিসিএস প্রিলিমিনারি বাংলা ভাষা ও সাহিত্য লাইভ টেস্ট",
            "description": "বাংলা ব্যাকরণ ও প্রাচীন-মধ্য-আধুনিক যুগের সাহিত্যের ৩৫ নম্বরের স্পেশাল লাইভ টেস্ট",
            "mode": "live",
            "subject": "বাংলা",
            "exam_type_filter": "BCS",
            "grade_filter": "Grade 9",
            "duration_minutes": 30,
            "negative_marking": 0.25
        },
        "query": "subject = 'বাংলা'",
        "params": (),
        "limit": 35
    }
]

for p in preset_exams:
    create_or_update_exam(p['exam'], p['query'], p['params'], p['limit'])

conn.commit()
conn.close()
print("All preset exams initialized successfully!")
