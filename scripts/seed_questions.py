import sqlite3
import os
import json

db_path = os.path.join("data", "liveexam.db")
os.makedirs("data", exist_ok=True)
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Create table if not exists (same schema as in src/lib/db.ts)
cur.executescript("""
  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option TEXT NOT NULL,
    explanation TEXT,
    subject TEXT NOT NULL,
    topic TEXT,
    exam_type TEXT NOT NULL,
    grade TEXT NOT NULL,
    exam_source TEXT,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    mode TEXT NOT NULL DEFAULT 'practice',
    subject TEXT,
    exam_type_filter TEXT,
    grade_filter TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 15,
    negative_marking REAL NOT NULL DEFAULT 0.25,
    marks_per_question REAL NOT NULL DEFAULT 1.0,
    scheduled_start_time TEXT,
    question_ids TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    score REAL NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    wrong_count INTEGER NOT NULL,
    skipped_count INTEGER NOT NULL,
    negative_deduction REAL NOT NULL,
    time_taken_seconds INTEGER NOT NULL,
    answers TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
""")

questions = [
  # --- MATHEMATICS (Khairul's Basic Math) ---
  {
    "question_text": "২৫ থেকে ৫৫ এর মধ্যে মৌলিক সংখ্যা কয়টি?",
    "option_a": "৭টি",
    "option_b": "৪টি",
    "option_c": "৬টি",
    "option_d": "৫টি",
    "correct_option": "A",
    "explanation": "২৫ থেকে ৫৫ এর মধ্যে মোট মৌলিক সংখ্যা আছে ৭টি। যথা: ২৯, ৩১, ৩৭, ৪১, ৪৩, ৪৭ ও ৫৩।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "Ministry",
    "grade": "Grade 10",
    "exam_source": "একটি বাড়ি একটি খামার (উপজেলা সমন্বয়কারী) - ২০১৭",
    "year": 2017
  },
  {
    "question_text": "নিচের কোনটি মৌলিক সংখ্যা?",
    "option_a": "৯১",
    "option_b": "৮৭",
    "option_c": "৬৩",
    "option_d": "৫৯",
    "correct_option": "D",
    "explanation": "৫৯ একটি মৌলিক সংখ্যা যার ১ ও ৫৯ ব্যতীত অন্য কোনো গুণনীয়ক নেই। অপরদিকে ৯১ = ৭ × ১৩, ৮৭ = ৩ × ২৯, ৬৩ = ৩ × ২১।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৩০তম বিসিএস",
    "year": 2010
  },
  {
    "question_text": "নিচের কোন সংখ্যাটি মৌলিক?",
    "option_a": "৪৯",
    "option_b": "৫১",
    "option_c": "৫৩",
    "option_d": "৫৫",
    "correct_option": "C",
    "explanation": "৫৩ একটি মৌলিক সংখ্যা। ৪৯ = ৭ × ৭, ৫১ = ৩ × ১৭, ৫৫ = ৫ × ১১।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "Bank",
    "grade": "Grade 9",
    "exam_source": "রাষ্ট্রায়ত্ব ব্যাংক সিনিয়র অফিসার - ২০০০",
    "year": 2000
  },
  {
    "question_text": "৬০ থেকে ৮০ এর মধ্যবর্তী বৃহত্তম ও ক্ষুদ্রতম মৌলিক সংখ্যার অন্তর কত?",
    "option_a": "৮",
    "option_b": "১২",
    "option_c": "১৮",
    "option_d": "১৪",
    "correct_option": "C",
    "explanation": "৬০ থেকে ৮০ এর মধ্যবর্তী ক্ষুদ্রতম মৌলিক সংখ্যা ৬১ এবং বৃহত্তম মৌলিক সংখ্যা ৭৯। সুতরাং অন্তর = ৭৯ - ৬১ = ১৮।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "২৭তম বিসিএস",
    "year": 2007
  },
  {
    "question_text": "৩০ থেকে ৯০ এর মধ্যবর্তী বৃহত্তম ও ক্ষুদ্রতম মৌলিক সংখ্যার অন্তর কত?",
    "option_a": "৪৬",
    "option_b": "৪৮",
    "option_c": "৫২",
    "option_d": "৫৮",
    "correct_option": "D",
    "explanation": "৩০ থেকে ৯০ এর মধ্যে ক্ষুদ্রতম মৌলিক সংখ্যা ৩১ এবং বৃহত্তম মৌলিক সংখ্যা ৮৯। এদের অন্তর = ৮৯ - ৩১ = ৫৮।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "Ministry",
    "grade": "Grade 10",
    "exam_source": "উপজেলা পোস্ট মাস্টার - ২০০৯",
    "year": 2009
  },
  {
    "question_text": "নিচের কোনটি মৌলিক সংখ্যা?",
    "option_a": "৭২",
    "option_b": "৮৭",
    "option_c": "৬৩",
    "option_d": "কোনোটিই নয়",
    "correct_option": "D",
    "explanation": "৭২ জোড় সংখ্যা (ভাজ্য), ৮৭ = ৩ × ২৯ (ভাজ্য), ৬৩ = ৩ × ২১ (ভাজ্য)। সুতরাং কোনোটিই মৌলিক সংখ্যা নয়।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "Primary",
    "grade": "Grade 13",
    "exam_source": "প্রাথমিক সহকারী শিক্ষক নিয়োগ - ২০১৫",
    "year": 2015
  },
  {
    "question_text": "নিচের কোন সংখ্যাটি মৌলিক?",
    "option_a": "৯১",
    "option_b": "১৪৩",
    "option_c": "৪৭",
    "option_d": "৮৭",
    "correct_option": "C",
    "explanation": "৪৭ একটি মৌলিক সংখ্যা। ৯১ = ৭ × ১৩, ১৪৩ = ১১ × ১৩, ৮৭ = ৩ × ২৯।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "১০ম বিসিএস",
    "year": 1989
  },
  {
    "question_text": "নিচের কোনটি মৌলিক সংখ্যা?",
    "option_a": "৯",
    "option_b": "৮",
    "option_c": "৪",
    "option_d": "২",
    "correct_option": "D",
    "explanation": "২ একমাত্র জোড় মৌলিক সংখ্যা এবং বিশ্বের ক্ষুদ্রতম মৌলিক সংখ্যা।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "Non-Cadre",
    "grade": "Grade 10",
    "exam_source": "সিনিয়র স্টাফ নার্স নিয়োগ - ২০১৮",
    "year": 2018
  },
  {
    "question_text": "১ হতে ৩০ পর্যন্ত কয়টি মৌলিক সংখ্যা আছে?",
    "option_a": "১৩টি",
    "option_b": "১২টি",
    "option_c": "১১টি",
    "option_d": "১০টি",
    "correct_option": "D",
    "explanation": "১ থেকে ৩০ পর্যন্ত ১০টি মৌলিক সংখ্যা রয়েছে: ২, ৩, ৫, ৭, ১১, ১৩, ১৭, ১৯, ২৩, ২৯।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (মৌলিক সংখ্যা)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "১০ম বিসিএস",
    "year": 1989
  },
  {
    "question_text": "নিচের কোন সংখ্যা দুটি সহ-মৌলিক (Co-prime) সংখ্যা?",
    "option_a": "২৭, ৫৪",
    "option_b": "৬৩, ৯১",
    "option_c": "১৮৯, ২১০",
    "option_d": "৫২, ৯৭",
    "correct_option": "D",
    "explanation": "৫২ ও ৯৭ এর মধ্যে ১ ছাড়া অন্য কোনো সাধারণ গুণনীয়ক নেই, অর্থাৎ গ.সা.গু = ১। তাই এরা পরস্পর সহ-মৌলিক।",
    "subject": "গণিত",
    "topic": "বাস্তব সংখ্যা (সহ-মৌলিক সংখ্যা)",
    "exam_type": "Non-Cadre",
    "grade": "Grade 10",
    "exam_source": "৮ম শ্রেণি পাঠ্যবই / নিবন্ধন",
    "year": 2018
  },

  # --- GENERAL KNOWLEDGE (BCS GK 10th to 50th) ---
  {
    "question_text": "কোন দেশের গৃহযুদ্ধের কারণে ইউরোপজুড়ে অভিবাসী সংকট সৃষ্টি হয়েছে?",
    "option_a": "সিরিয়া",
    "option_b": "লেবানন",
    "option_c": "আলবেনিয়া",
    "option_d": "ইরাক",
    "correct_option": "A",
    "explanation": "২০১১ সালে সিরিয়ায় শুরু হওয়া গৃহযুদ্ধের ফলে লাখ লাখ সিরীয় শরণার্থী ইউরোপে আশ্রয় নেয়, যা ইউরোপীয় অভিবাসী সংকটের প্রধান কারণ।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "আন্তর্জাতিক বিষয়াবলী (মধ্যপ্রাচ্য)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "কোন ঘটনার কারণে ধরিত্রী দিবসের (Earth Day) সূচনা হয়?",
    "option_a": "ব্যাপক বায়ু দূষণ",
    "option_b": "জলবায়ু পরিবর্তন",
    "option_c": "ব্যাপক তেল নিঃসরণ",
    "option_d": "পারমাণবিক বিস্ফোরণ",
    "correct_option": "C",
    "explanation": "১৯৬৯ সালে যুক্তরাষ্ট্রের ক্যালিফোর্নিয়ার সান্তা বারবারা উপকূলে ব্যাপক তেল নিঃসরণ (Santa Barbara oil spill) বিপর্যয়ের প্রেক্ষাপটে ১৯৭০ সালের ২২ এপ্রিল প্রথম ধরিত্রী দিবস পালিত হয়।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "পরিবেশ ও ভূগোল",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "টেকসই উন্নয়ন লক্ষ্য (এসডিজি) অর্জনে নিচের কোনটির গুরুত্ব সবচেয়ে বেশি?",
    "option_a": "সক্ষমতা তৈরি",
    "option_b": "অংশীদারিত্ব",
    "option_c": "সমতা বিধান",
    "option_d": "উপরের সবগুলো",
    "correct_option": "B",
    "explanation": "এসডিজির ১৭তম ও মূল লক্ষ্য হলো টেকসই উন্নয়নের জন্য বৈশ্বিক অংশীদারিত্ব জোরদার করা (Partnerships for the Goals)।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "আন্তর্জাতিক সংস্থা ও চুক্তি",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "নিচের কোন প্রতিষ্ঠান বাংলাদেশের ২১শে ফেব্রুয়ারির শহীদ দিবসকে 'আন্তর্জাতিক মাতৃভাষা দিবস' হিসেবে স্বীকৃতি প্রদান করে?",
    "option_a": "ইউনিসেফ (UNICEF)",
    "option_b": "ইউনেস্কো (UNESCO)",
    "option_c": "জাতিসংঘ সাধারণ পরিষদ (UNGA)",
    "option_d": "এডিবি (ADB)",
    "correct_option": "B",
    "explanation": "১৯৯৯ সালের ১৭ নভেম্বর ইউনেস্কো ২১শে ফেব্রুয়ারিকে আন্তর্জাতিক মাতৃভাষা দিবস হিসেবে ঐতিহাসিক স্বীকৃতি প্রদান করে।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "ভাষা আন্দোলন ও মুক্তিযুদ্ধ",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "বাংলাদেশের প্রাচীনতম জনপদ কোনটি?",
    "option_a": "মহাস্থানগড় (পুন্ড্র)",
    "option_b": "পাহাড়পুর",
    "option_c": "ময়নামতি",
    "option_d": "উয়ারী-বটেশ্বর",
    "correct_option": "A",
    "explanation": "বগুড়া জেলার করতোয়া নদীর তীরে অবস্থিত মহাস্থানগড় (প্রাচীন পুন্ড্রনগর) বাংলাদেশের প্রাচীনতম নগর জনপদ।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "বাংলাদেশের ইতিহাস ও প্রাচীন জনপদ",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "বাংলাদেশের কর্ণফুলি নদীর উৎপত্তিস্থল কোথায়?",
    "option_a": "লুসাই পাহাড়",
    "option_b": "সিকিমের পার্বত্য অঞ্চল",
    "option_c": "তিব্বতের মানস সরোবর",
    "option_d": "নাগা-মণিপুর অঞ্চলের বরাক নদী",
    "correct_option": "A",
    "explanation": "কর্ণফুলি নদী ভারতের মিজোরাম রাজ্যের লুসাই পাহাড় থেকে উৎপন্ন হয়ে পার্বত্য চট্টগ্রাম দিয়ে বাংলাদেশে প্রবেশ করেছে।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "বাংলাদেশের নদী ও ভূগোল",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "মার্কিন যুক্তরাষ্ট্রের আইনসভার নাম কি?",
    "option_a": "পার্লামেন্ট",
    "option_b": "কংগ্রেস",
    "option_c": "সিনেট",
    "option_d": "ডায়েট",
    "correct_option": "B",
    "explanation": "যুক্তরাষ্ট্রের আইনসভার নাম কংগ্রেস (Congress), যা দুটি কক্ষ নিয়ে গঠিত: সিনেট (উচ্চকক্ষ) এবং হাউস অব রিপ্রেজেন্টেটিভস (নিম্নকক্ষ)।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "আন্তর্জাতিক সরকার ব্যবস্থা",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "'টঙ্ক (tonk) আন্দোলন' মূলত কী ধরনের আন্দোলন ছিল?",
    "option_a": "সাঁওতাল বিদ্রোহ",
    "option_b": "কৃষক আন্দোলন",
    "option_c": "প্রাকৃতিক সম্পদ রক্ষার আন্দোলন",
    "option_d": "স্বদেশী আন্দোলন",
    "correct_option": "B",
    "explanation": "ময়মনসিংহের সুসং দুর্গাপুর ও সংলগ্ন অঞ্চলে ধান দিয়ে খাজনা পরিশোধের অন্যায় টঙ্ক প্রথার বিরুদ্ধে হাজং ও গারো কৃষকদের রক্তক্ষয়ী আন্দোলন ছিল টঙ্ক আন্দোলন।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "বাংলাদেশের ঐতিহাসিক আন্দোলন",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },
  {
    "question_text": "Demographic Dividend বলতে কী বুঝায়?",
    "option_a": "শিশু মৃত্যুর হার হ্রাস",
    "option_b": "জন্মহার শূন্যের কোটায় আনা",
    "option_c": "জনসংখ্যার অধিকাংশ বেকার থাকা",
    "option_d": "কর্মক্ষম বয়স গোষ্ঠীর অনুপাত বৃদ্ধি",
    "correct_option": "D",
    "explanation": "যখন কোনো দেশে নির্ভরশীল জনগোষ্ঠীর (শিশু ও বৃদ্ধ) তুলনায় কর্মক্ষম বয়সের (১৫-৬৪ বছর) মানুষের অনুপাত সর্বোচ্চ পর্যায়ে পৌঁছায়, তাকে ডেমোগ্রাফিক ডিভিডেন্ড বলে।",
    "subject": "সাধারণ জ্ঞান",
    "topic": "অর্থনীতি ও জনসংখ্যা",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৮তম বিসিএস (বিশেষ)",
    "year": 2025
  },

  # --- BANGLA (অন্বেষণ by শাওন স্যার) ---
  {
    "question_text": "বাংলা সাহিত্যের আদি নিদর্শন 'চর্যাপদ' কত সালে এবং কোথা থেকে আবিষ্কৃত হয়?",
    "option_a": "১৯০৭ সালে, নেপালের রাজদরবারের রয়েল লাইব্রেরি থেকে",
    "option_b": "১৯০৯ সালে, শান্তিনিকেতন থেকে",
    "option_c": "১৯১৬ সালে, বঙ্গীয় সাহিত্য পরিষদ থেকে",
    "option_d": "১৯২১ সালে, ঢাকা বিশ্ববিদ্যালয় গ্রন্থাগার থেকে",
    "correct_option": "A",
    "explanation": "মহামহোপাধ্যায় হরপ্রসাদ শাস্ত্রী ১৯০৭ সালে নেপালের রাজদরবারের রয়েল লাইব্রেরি থেকে চর্যাপদের মূল পুথি আবিষ্কার করেন।",
    "subject": "বাংলা",
    "topic": "প্রাচীন যুগ (চর্যাপদ)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪০তম ও ৪১তম বিসিএস",
    "year": 2020
  },
  {
    "question_text": "বাংলা সাহিত্যের মধ্যযুগের প্রথম কাব্য কোনটি?",
    "option_a": "পদ্মাবতী",
    "option_b": "শ্রীকৃষ্ণকীর্তন",
    "option_c": "মনসামঙ্গল",
    "option_d": "ইউসুফ-জোলেখা",
    "correct_option": "B",
    "explanation": "মধ্যযুগের প্রথম একক কবি বড়ু চণ্ডীদাস রচিত 'শ্রীকৃষ্ণকীর্তন' কাব্যটি ১৯০৯ সালে বসন্তরঞ্জন রায় বিদ্বদ্বল্লভ বাঁকুড়ার এক গৃহস্থের গোয়ালঘর থেকে আবিষ্কার করেন।",
    "subject": "বাংলা",
    "topic": "মধ্যযুগ (শ্রীকৃষ্ণকীর্তন)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৩৮তম বিসিএস",
    "year": 2018
  },
  {
    "question_text": "'সকল অহংকার হে আমার ডুবাও চোখের জলে'- এটি রবীন্দ্রনাথ ঠাকুরের কোন ধরনের রচনা?",
    "option_a": "নাটক",
    "option_b": "উপন্যাস",
    "option_c": "গীতাঞ্জলি কাব্যের গান",
    "option_d": "ছোটগল্প",
    "correct_option": "C",
    "explanation": "এটি রবীন্দ্রনাথ ঠাকুরের বিশ্ববিখ্যাত নোবেলজয়ী কাব্যগ্রন্থ 'গীতাঞ্জলি'র একটি অবিস্মরণীয় প্রার্থনা সঙ্গীত।",
    "subject": "বাংলা",
    "topic": "রবীন্দ্রনাথ ঠাকুর",
    "exam_type": "Bank",
    "grade": "Grade 9",
    "exam_source": "বাংলাদেশ ব্যাংক সহকারী পরিচালক - ২০১৯",
    "year": 2019
  },
  {
    "question_text": "কাজী নজরুল ইসলামের 'অগ্নি-বীণা' কাব্যের প্রথম কবিতা কোনটি?",
    "option_a": "বিদ্রোহী",
    "option_b": "প্রলয়োল্লাস",
    "option_c": "রক্তাম্বর-ধারিণী মা",
    "option_d": "ধূমকেতু",
    "correct_option": "B",
    "explanation": "১৯২২ সালে প্রকাশিত নজরুল ইসলামের প্রথম কাব্যগ্রন্থ 'অগ্নি-বীণা'র প্রথম কবিতা হলো 'প্রলয়োল্লাস' ('তোরা সব জয়ধ্বনি কর!') এবং দ্বিতীয় কবিতা হলো বিখ্যাত 'বিদ্রোহী'।",
    "subject": "বাংলা",
    "topic": "কাজী নজরুল ইসলাম",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৪তম বিসিএস",
    "year": 2022
  },
  {
    "question_text": "'শুদ্ধ বানান' কোনটি?",
    "option_a": "মুমূর্ষু",
    "option_b": "মুর্মূষু",
    "option_c": "মুমুর্ষূ",
    "option_d": "মূমর্ষু",
    "correct_option": "A",
    "explanation": "সঠিক বানান হলো 'মুমূর্ষু' (হ্রস্ব উ-কার, দীর্ঘ ঊ-কার, হ্রস্ব উ-কার)।",
    "subject": "বাংলা",
    "topic": "বানান ও বাক্য শুদ্ধি",
    "exam_type": "Primary",
    "grade": "Grade 13",
    "exam_source": "প্রাথমিক শিক্ষক নিয়োগ - ২০১৯",
    "year": 2019
  },

  # --- ENGLISH (Master English - Jahangir Alam) ---
  {
    "question_text": "Choose the correct sentence:",
    "option_a": "Each of the boys have got a prize.",
    "option_b": "Each of the boys has got a prize.",
    "option_c": "Each of the boys were given prize.",
    "option_d": "Each of the boy has got a prize.",
    "correct_option": "B",
    "explanation": "'Each of' takes a plural noun ('the boys') followed by a singular verb ('has'). Hence 'Each of the boys has got a prize' is grammatically correct.",
    "subject": "English",
    "topic": "Subject-Verb Agreement",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৪৩তম বিসিএস",
    "year": 2021
  },
  {
    "question_text": "The phrase 'Achilles' heel' means:",
    "option_a": "A strong point",
    "option_b": "A vulnerable spot / weak point",
    "option_c": "A secret weapon",
    "option_d": "A fast runner",
    "correct_option": "B",
    "explanation": "'Achilles' heel' originates from Greek mythology and signifies a weakness or vulnerable point in an otherwise strong situation.",
    "subject": "English",
    "topic": "Idioms and Phrases",
    "exam_type": "Bank",
    "grade": "Grade 9",
    "exam_source": "সোনালী ব্যাংক অফিসার - ২০২০",
    "year": 2020
  },
  {
    "question_text": "What is the synonym of 'Competent'?",
    "option_a": "Capable",
    "option_b": "Clumsy",
    "option_c": "Lazy",
    "option_d": "Ordinary",
    "correct_option": "A",
    "explanation": "'Competent' means having the necessary ability, knowledge, or skill to do something successfully. Synonym: Capable, Qualified, Efficient.",
    "subject": "English",
    "topic": "Vocabulary & Synonyms",
    "exam_type": "Non-Cadre",
    "grade": "Grade 10",
    "exam_source": "সাব-ইন্সপেক্টর (SI) নিয়োগ পরীক্ষা - ২০১৮",
    "year": 2018
  },
  {
    "question_text": "Who is known as the 'Poet of Nature' in English literature?",
    "option_a": "John Keats",
    "option_b": "William Wordsworth",
    "option_c": "P. B. Shelley",
    "option_d": "Lord Byron",
    "correct_option": "B",
    "explanation": "William Wordsworth is renowned as the 'Poet of Nature' and 'Worshipper of Nature' in English romantic poetry.",
    "subject": "English",
    "topic": "English Literature (Romantic Period)",
    "exam_type": "BCS",
    "grade": "Grade 9",
    "exam_source": "৩৮তম ও ৪৫তম বিসিএস",
    "year": 2023
  },
  {
    "question_text": "Fill in the blank: 'He is proficient _____ Mathematics.'",
    "option_a": "at",
    "option_b": "in",
    "option_c": "with",
    "option_d": "for",
    "correct_option": "B",
    "explanation": "Appropriate preposition: 'proficient in' something (expert/skilled in a subject). Note: 'good at' takes 'at', but 'proficient' takes 'in'.",
    "subject": "English",
    "topic": "Appropriate Preposition",
    "exam_type": "Ministry",
    "grade": "Grade 10",
    "exam_source": "মন্ত্রণালয় সহকারী পরিচালক - ২০২১",
    "year": 2021
  }
]

for q in questions:
  cur.execute("""
    INSERT INTO questions (
      question_text, option_a, option_b, option_c, option_d,
      correct_option, explanation, subject, topic,
      exam_type, grade, exam_source, year
    ) VALUES (
      :question_text, :option_a, :option_b, :option_c, :option_d,
      :correct_option, :explanation, :subject, :topic,
      :exam_type, :grade, :exam_source, :year
    )
  """, q)

conn.commit()

# Create a sample Live Model Test
cur.execute("SELECT id FROM questions ORDER BY id ASC")
all_ids = [r[0] for r in cur.fetchall()]

sample_exam_id = "exam-bcs-mega-1"
cur.execute("""
  INSERT OR REPLACE INTO exams (
    id, title, description, mode, subject, exam_type_filter, grade_filter,
    duration_minutes, negative_marking, marks_per_question, scheduled_start_time,
    question_ids, is_active
  ) VALUES (
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?,
    ?, 1
  )
""", (
  sample_exam_id,
  "বিসিএস ও ব্যাংক মেগা লাইভ মডেল টেস্ট - ০১",
  "গণিত, ইংরেজি, বাংলা এবং সাধারণ জ্ঞানের বাছাইকৃত প্রশ্নাবলি",
  "live",
  "all",
  "BCS",
  "Grade 9",
  15,
  0.25,
  1.0,
  None,
  json.dumps(all_ids)
))

conn.commit()
conn.close()

print(f"Successfully seeded {len(questions)} questions and created default Live Exam!")
