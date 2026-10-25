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

# Fetch questions
cursor.execute("SELECT id, subject, topic, grade, exam_type FROM questions")
questions = cursor.fetchall()

q_10_13 = [q['id'] for q in questions if q['grade'] in ['Grade 10', 'Grade 11', 'Grade 12', 'Grade 13']]
q_13_16 = [q['id'] for q in questions if q['grade'] in ['Grade 13', 'Grade 14', 'Grade 15', 'Grade 16', 'Grade 13-16'] or q['exam_type'] in ['Primary', 'Ministry', 'Non-Cadre']]
q_bcs = [q['id'] for q in questions if q['grade'] == 'Grade 9' or q['exam_type'] == 'BCS']
q_math = [q['id'] for q in questions if q['subject'] == 'গণিত']
q_eng = [q['id'] for q in questions if q['subject'] == 'English']
q_bangla = [q['id'] for q in questions if q['subject'] == 'বাংলা']
q_gk = [q['id'] for q in questions if q['subject'] == 'সাধারণ জ্ঞান']

def sample(pool, n):
    if len(pool) >= n:
        return random.sample(pool, n)
    return random.sample([q['id'] for q in questions], n)

new_live_exams = [
    # 1. 10th-13th Grade
    {
        'id': 'grade10-13-mega-80',
        'title': '১০ম-১৩তম গ্রেড সমন্বিত মেগা মডেল টেস্ট - ০১',
        'description': 'নন-ক্যাডার ১০ম-১৩তম গ্রেড, প্রাথমিক শিক্ষক ও সহকারী অফিসারদের জন্য ৮০টি পূর্ণাঙ্গ প্রশ্ন।',
        'grade_filter': '10-13',
        'duration_minutes': 60,
        'negative_marking': 0.25,
        'question_ids': sample(q_10_13, 80)
    },
    {
        'id': 'grade10-13-math-gk-50',
        'title': '১০ম-১৩তম গ্রেড গণিত ও সাধারণ জ্ঞান স্পেশাল টেস্ট',
        'description': 'নন-ক্যাডার ও শিক্ষক নিয়োগের গুরুত্বপূর্ণ ২৫টি গণিত ও ২৫টি সাধারণ জ্ঞান প্রশ্ন।',
        'grade_filter': '10-13',
        'duration_minutes': 45,
        'negative_marking': 0.25,
        'question_ids': sample([qid for qid in q_10_13 if qid in q_math or qid in q_gk], 50)
    },
    {
        'id': 'primary-assistant-teacher-02',
        'title': 'প্রাথমিক সহকারী শিক্ষক ও ১০ম-১৩তম গ্রেড মডেল টেস্ট - ০২',
        'description': 'ডিপিই ও প্রাথমিক শিক্ষা অধিদপ্তরের পরীক্ষার অনুরূপ ৮০টি প্রশ্ন সংবলিত পূর্ণাঙ্গ সেট।',
        'grade_filter': '10-13',
        'duration_minutes': 60,
        'negative_marking': 0.25,
        'question_ids': sample(q_10_13, 80)
    },
    {
        'id': 'sub-inspector-si-100',
        'title': '১০ম গ্রেড সাব-ইন্সপেক্টর (SI) ও নন-ক্যাডার পূর্ণাঙ্গ টেস্ট',
        'description': 'পুলিশ সাব-ইন্সপেক্টর ও মন্ত্রণালয় নন-ক্যাডার অফিসার পদের জন্য ১০০টি বাছাইকৃত প্রশ্ন।',
        'grade_filter': '10-13',
        'duration_minutes': 75,
        'negative_marking': 0.25,
        'question_ids': sample(q_10_13, 100)
    },

    # 2. 13th-16th Grade
    {
        'id': 'grade13-16-full-test-01',
        'title': '১৩তম-১৬তম গ্রেড অফিস সহকারী ও কম্পিউটার অপারেটর মডেল টেস্ট - ০১',
        'description': 'অফিস সহকারী-কাম-কম্পিউটার মুদ্রাক্ষরিক ও ডাটা এন্ট্রি পদের জন্য ৫০টি এমসিকিউ প্রশ্ন।',
        'grade_filter': '13-16',
        'duration_minutes': 40,
        'negative_marking': 0.25,
        'question_ids': sample(q_13_16, 50)
    },
    {
        'id': 'grade13-16-full-test-02',
        'title': '১৩তম-১৬তম গ্রেড মন্ত্রণালয় ও অধিদপ্তর নিয়োগ স্পেশাল টেস্ট',
        'description': 'বিভিন্ন অধিদপ্তর ও সরকারি প্রতিষ্ঠানের ৩য় শ্রেণির পদের উপযোগী ৫০টি প্রশ্ন।',
        'grade_filter': '13-16',
        'duration_minutes': 40,
        'negative_marking': 0.25,
        'question_ids': sample(q_13_16, 50)
    },
    {
        'id': 'grade13-16-arithmetic-bangla-40',
        'title': '১৩তম-১৬তম গ্রেড সহজ পাটিগণিত ও বাংলা ব্যাকরণ স্পিড টেস্ট',
        'description': 'ঐকিক নিয়ম, লাভ-ক্ষতি, শতকরা ও বাংলা বানান-সন্ধির ৪০টি প্রশ্ন।',
        'grade_filter': '13-16',
        'duration_minutes': 35,
        'negative_marking': 0.25,
        'question_ids': sample([qid for qid in q_13_16 if qid in q_math or qid in q_bangla], 40)
    },
    {
        'id': 'grade13-16-gk-english-40',
        'title': '১৩তম-১৬তম গ্রেড সাধারণ জ্ঞান ও মৌলিক ইংরেজি টেস্ট',
        'description': 'বাংলাদেশ বিষয়াবলি ও বেসিক ইংলিশ গ্রামারের ৪০টি গুরুত্বপূর্ণ প্রশ্ন।',
        'grade_filter': '13-16',
        'duration_minutes': 35,
        'negative_marking': 0.25,
        'question_ids': sample([qid for qid in q_13_16 if qid in q_gk or qid in q_eng], 40)
    },

    # 3. 17th-20th Grade
    {
        'id': 'grade17-20-support-staff-30',
        'title': '১৭তম-২০তম গ্রেড অফিস সহায়ক ও সহায়ক কর্মী মডেল টেস্ট',
        'description': '৪র্থ শ্রেণির সরকারি পদের সাধারণ জ্ঞান, বাংলা ও সহজ গণিত ৩০টি প্রশ্ন।',
        'grade_filter': '17-20',
        'duration_minutes': 25,
        'negative_marking': 0.20,
        'question_ids': sample(q_13_16, 30)
    },

    # 4. Grade 9 / BCS
    {
        'id': 'bcs-47-48-full-model-100',
        'title': '৪৭তম ও ৪৮তম বিসিএস প্রিলিমিনারি পূর্ণাঙ্গ মেগা টেস্ট - ০২',
        'description': 'বিসিএস প্রিলিমিনারি সিলেবাস অনুযায়ী বাংলা, ইংরেজি, গণিত ও সাধারণ জ্ঞানের ১০০টি প্রশ্ন।',
        'grade_filter': 'Grade 9',
        'duration_minutes': 80,
        'negative_marking': 0.50,
        'question_ids': sample(q_bcs, 100)
    },
    {
        'id': 'bcs-math-mental-ability-50',
        'title': 'বিসিএস গণিত ও মানসিক দক্ষতা স্পেশাল স্পিড টেস্ট',
        'description': 'বিসিএস প্রিলিমিনারি ও ব্যাংক সিনিয়র অফিসারের কঠিন ৫০টি গণিত প্রশ্ন।',
        'grade_filter': 'Grade 9',
        'duration_minutes': 45,
        'negative_marking': 0.50,
        'question_ids': sample([qid for qid in q_bcs if qid in q_math], 50)
    },
    {
        'id': 'bcs-english-mastery-50',
        'title': 'বিসিএস ও ব্যাংক ইংরেজি গ্রামার, লিটারেচার ও ভোকাবুলারি টেস্ট',
        'description': 'বিসিএস ক্যাডার ও সরকারি ব্যাংকের উচ্চমানের ৫০টি ইংরেজি প্রশ্ন।',
        'grade_filter': 'Grade 9',
        'duration_minutes': 40,
        'negative_marking': 0.50,
        'question_ids': sample([qid for qid in q_bcs if qid in q_eng], 50)
    },
    {
        'id': 'bcs-bangla-mastery-50',
        'title': 'বিসিএস বাংলা ভাষা, সাহিত্য ও ব্যাকরণ পূর্ণাঙ্গ টেস্ট',
        'description': 'প্রাচীন, মধ্য ও আধুনিক যুগ সাহিত্য এবং শুদ্ধ ব্যাকরণের ৫০টি প্রশ্ন।',
        'grade_filter': 'Grade 9',
        'duration_minutes': 40,
        'negative_marking': 0.50,
        'question_ids': sample([qid for qid in q_bcs if qid in q_bangla], 50)
    },
    {
        'id': 'bank-officer-cash-combined-60',
        'title': 'কম্বাইন্ড ৮ ব্যাংক অফিসার ও ক্যাশ অফিসার স্পেশাল টেস্ট',
        'description': 'ব্যাংকার্স সিলেকশন কমিটির নিয়োগ পরীক্ষার অনুরূপ ৬০টি প্রশ্ন।',
        'grade_filter': 'Grade 9',
        'duration_minutes': 50,
        'negative_marking': 0.25,
        'question_ids': sample([qid for qid in q_bcs if qid in q_math or qid in q_eng], 60)
    }
]

print(f"Adding {len(new_live_exams)} grade-compatible live tests...")

for ex in new_live_exams:
    cursor.execute("""
        INSERT INTO exams (
            id, title, description, mode, subject, exam_type_filter, grade_filter,
            duration_minutes, negative_marking, marks_per_question, question_ids, is_active
        ) VALUES (%s, %s, %s, 'live', NULL, NULL, %s, %s, %s, 1.0, %s, 1)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            description = VALUES(description),
            mode = 'live',
            grade_filter = VALUES(grade_filter),
            duration_minutes = VALUES(duration_minutes),
            negative_marking = VALUES(negative_marking),
            question_ids = VALUES(question_ids),
            is_active = 1;
    """, (
        ex['id'],
        ex['title'],
        ex['description'],
        ex['grade_filter'],
        ex['duration_minutes'],
        ex['negative_marking'],
        json.dumps(ex['question_ids'])
    ))

conn.commit()

cursor.execute("SELECT COUNT(*) as c FROM exams WHERE mode = 'live'")
print(f"Total live exams now: {cursor.fetchone()['c']}")

cursor.execute("SELECT grade_filter, COUNT(*) as c FROM exams WHERE mode = 'live' GROUP BY grade_filter")
for r in cursor.fetchall():
    print(f"Grade: {r['grade_filter']} -> {r['c']} live exams")

conn.close()
print("Grade-compatible exams added successfully!")

