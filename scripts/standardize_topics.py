import pymysql
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

conn = pymysql.connect(
    host='127.0.0.1',
    port=3306,
    user='root',
    password='',
    database='liveexam_db',
    charset='utf8mb4'
)
cur = conn.cursor()

normalizations = [
    # English
    ("English", ["Articles", "Article", "Articles / Determiners", "Determiner", "Determiners", "Determiners and Quantifiers", "Determiners & Nouns"], "Article & Determiner"),
    ("English", ["Prepositions", "Preposition", "Appropriate Preposition"], "Preposition"),
    ("English", ["Degree", "Degrees of Comparison", "Degree of Comparison", "Double Comparative", "Comparisons", "Comparatives and Superlatives", "Comparison"], "Degree & Comparison"),
    ("English", ["Verb", "Verb forms", "Verbs and Forms of Verbs", "Right form of verbs", "Verb forms and Confusing Verbs", "Semi-modal verb", "Intransitive verb"], "Verb & Tense"),
    ("English", ["Participle", "Gerund", "Gerund and Participle", "Present and Past Participle", "Gerund/Non-finite Verbs", "Verbal Noun"], "Gerund & Participle"),
    ("English", ["Noun", "Parts of Speech - Noun", "Countable and Uncountable noun", "Collective Noun", "Compound Noun", "Transformation of Nouns"], "Noun"),
    ("English", ["Pronoun", "Relative pronoun"], "Pronoun"),
    ("English", ["Adjective", "Adjectives", "Parts of Speech - Adjective", "Parts of Speech (Adjective)", "Numeral Adjective"], "Adjective"),
    ("English", ["Conjunction", "Conjunctions", "Conjunction / Co-relatives"], "Conjunction"),
    ("English", ["Number", "Number (Singular and Plural)", "Number (Plural Form)", "English Plurals", "Foreign Plurals"], "Number (Singular/Plural)"),
    ("English", ["Gender", "Gender of Noun", "Feminine Gender"], "Gender"),
    ("English", ["Subject-Verb Agreement", "Subject Verb Agreement"], "Subject-Verb Agreement"),
    ("English", ["Vocabulary", "Synonym", "Antonym", "Derivatives", "Spelling"], "Vocabulary & Spelling"),
    ("English", ["Sentence Structure", "Transformation of Sentences", "Clause"], "Sentence & Clauses"),
    ("English", ["Idioms and Phrases", "Idioms", "Phrases"], "Idioms & Phrases"),

    # Math
    ("গণিত", ["ল.সা.গু ও গ.সা.গু", "ল.সা.উ ও গ.সা.উ", "ল.সা.গু এবং গ.সা.গু", "ল.সা.ও এবং গ.সা.ও", "ল.সা.ও ও গ.সা.উ", "লসাগু ও গসাগু"], "ল.সা.গু ও গ.সা.গু"),
    ("গণিত", ["নল-চৌবাচ্চা", "নল-চৌবাচ্চা এবং কাজ", "নল-চৌবাচ্চা ও কাজ", "নল ও চৌবাচ্চা"], "নল ও চৌবাচ্চা"),
    ("গণিত", ["সরল সুদ", "সরল মুনাফা", "সরল ও যৌগিক মুনাফা", "মুনাফা"], "মুনাফা ও সুদ"),
    ("গণিত", ["ট্রেন ও গতিবেগ", "ট্রেণ ও গতিবেগ", "সময়, দূরত্ব ও গতিবেগ", "গতিবেগ"], "গতিবেগ ও দূরত্ব"),
    ("গণিত", ["মৌলিক সংখ্যা", "বাস্তব সংখ্যা (মৌলিক সংখ্যা)", "ভাজক সংখ্যা", "সংখ্যা", "সংখ্যা সম্পর্কিত সমস্যা"], "বাস্তব সংখ্যা ও মৌলিক সংখ্যা"),
    ("গণিত", ["ভগ্নাংশ", "দশমিক ভগ্নাংশ", "দশমিক ভগ্নাংশের গুণ"], "ভগ্নাংশ ও দশমিক"),
    ("গণিত", ["ঐকিক নিয়ম", "ঐকিক নিয়ম"], "ঐকিক নিয়ম"),
    ("গণিত", ["শতকরা ও লাভ-ক্ষতি"], "শতকরা"),
    ("গণিত", ["গড়", "Average"], "গড়"),

    # Bangla
    ("বাংলা", ["বানান", "বানান শুদ্ধি", "বানান ও শুদ্ধিকরণ", "বানান শুদ্ধিকরণ"], "বানান শুদ্ধি"),
    ("বাংলা", ["ণত্ব ও ষত্ব বিধান", "ণ-ত্ব বিধান", "ণত্ব-ষত্ব বিধান"], "ণত্ব ও ষত্ব বিধান"),
    ("বাংলা", ["পদ প্রকরণ", "পদ প্রকরণ - অব্যয়", "অব্যয় পদ", "বিশেষণ পদ", "ক্রিয়াপদ"], "পদ প্রকরণ"),
    ("বাংলা", ["কারক ও বিভক্তি", "কারক"], "কারক ও বিভক্তি"),
    ("বাংলা", ["সমাস"], "সমাস"),
    ("বাংলা", ["সন্ধি"], "সন্ধি"),
    ("বাংলা", ["ধ্বনি ও বর্ণ", "ধ্বনি", "বর্ণ"], "ধ্বনি ও বর্ণ"),
    ("বাংলা", ["লিঙ্গান্তর", "লিঙ্গ"], "লিঙ্গান্তর"),

    # GK
    ("সাধারণ জ্ঞান", ["আন্তর্জাতিক সংস্থা", "আন্তর্জাতিক সংগঠন", "জাতিসংঘ"], "আন্তর্জাতিক সংস্থা ও সংগঠন"),
    ("সাধারণ জ্ঞান", ["আন্তর্জাতিক", "আন্তর্জাতিক বিষয়াবলি", "আন্তর্জাতিক বিষয়াবলী", "আন্তর্জাতিক সম্পর্ক", "আন্তর্জাতিক রাজনীতি"], "আন্তর্জাতিক বিষয়াবলি"),
    ("সাধারণ জ্ঞান", ["বাংলাদেশ বিষয়াবলী", "বাংলাদেশ বিষয়াবলি", "বাংলাদেশ পরিচিতি"], "বাংলাদেশ বিষয়াবলি"),
    ("সাধারণ জ্ঞান", ["বিজ্ঞান", "বিজ্ঞান ও প্রযুক্তি", "সাধারণ বিজ্ঞান", "তথ্যপ্রযুক্তি"], "বিজ্ঞান ও প্রযুক্তি"),
    ("সাধারণ জ্ঞান", ["মুক্তিযুদ্ধ", "ভাষা আন্দোলন", "বাংলাদেশের ইতিহাস"], "মুক্তিযুদ্ধ ও ইতিহাস")
]

updated_count = 0
for subject, old_topics, canonical in normalizations:
    for old in old_topics:
        cur.execute(
            "UPDATE questions SET topic = %s WHERE subject = %s AND topic = %s",
            (canonical, subject, old)
        )
        updated_count += cur.rowcount

conn.commit()
print(f"Standardized {updated_count} question topics!")

# Show top 5 topics per subject
print("\n=== Current Top Topics by Subject ===")
for subj in ["English", "গণিত", "বাংলা", "সাধারণ জ্ঞান"]:
    print(f"\n[{subj}]")
    cur.execute("SELECT topic, COUNT(*) as c FROM questions WHERE subject = %s AND topic IS NOT NULL AND topic != '' GROUP BY topic ORDER BY c DESC LIMIT 8", (subj,))
    for row in cur.fetchall():
        print(f"  - {row[0]}: {row[1]} questions")

conn.close()

