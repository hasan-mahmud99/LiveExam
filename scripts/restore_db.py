import pymysql
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

print("Connecting to MySQL...")
conn = pymysql.connect(
    host='127.0.0.1',
    port=3306,
    user='root',
    password='',
    charset='utf8mb4'
)
cur = conn.cursor()
cur.execute('CREATE DATABASE IF NOT EXISTS liveexam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;')
cur.execute('USE liveexam_db;')
cur.execute('SET FOREIGN_KEY_CHECKS = 0;')
cur.execute('DROP TABLE IF EXISTS submissions;')
cur.execute('DROP TABLE IF EXISTS questions;')
cur.execute('DROP TABLE IF EXISTS exams;')
cur.execute('SET FOREIGN_KEY_CHECKS = 1;')
conn.commit()

print("Reading liveexam_backup.sql and recovering UTF-8 encoding...")
cleaned_lines = []
with open('liveexam_backup.sql', 'r', encoding='utf-16') as f:
    for line in f:
        # Re-encode cp437 -> utf-8 to reverse PowerShell redirection
        try:
            fixed_line = line.encode('cp437').decode('utf-8')
        except Exception:
            # Fallback if there are any unmapped characters
            fixed_line = line.encode('cp437', errors='replace').decode('utf-8', errors='replace')
        cleaned_lines.append(fixed_line)

sql_content = ''.join(cleaned_lines)

# Split by ;\n
statements = sql_content.split(';\n')
print(f"Total statements to execute: {len(statements)}")

success_count = 0
error_count = 0
for stmt in statements:
    s = stmt.strip()
    if not s or s.startswith('/*') or s.startswith('--'):
        continue
    try:
        cur.execute(s)
        success_count += 1
    except Exception as e:
        print(f"Error on stmt: {str(e)[:120]}")
        error_count += 1

conn.commit()

cur.execute("SELECT COUNT(*) FROM questions")
q_count = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM exams")
e_count = cur.fetchone()[0]

print(f"Restore finished! Questions: {q_count}, Exams: {e_count}, Successful stmts: {success_count}, Errors: {error_count}")
cur.close()
conn.close()

