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

with open('liveexam_backup_utf8.sql', 'w', encoding='utf-8') as f:
    f.write("-- LiveExam MySQL Dump (Clean UTF-8)\n")
    f.write("SET NAMES utf8mb4;\n")
    f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")

    for table in ['exams', 'questions', 'submissions']:
        cur.execute(f"SHOW CREATE TABLE {table}")
        create_stmt = cur.fetchone()[1]
        f.write(f"DROP TABLE IF EXISTS `{table}`;\n")
        f.write(f"{create_stmt};\n\n")

        cur.execute(f"SELECT * FROM {table}")
        rows = cur.fetchall()
        if rows:
            cur.execute(f"DESCRIBE {table}")
            cols = [f"`{col[0]}`" for col in cur.fetchall()]
            col_list = ", ".join(cols)

            f.write(f"LOCK TABLES `{table}` WRITE;\n")
            batch_size = 500
            for i in range(0, len(rows), batch_size):
                batch = rows[i:i+batch_size]
                val_strings = []
                for row in batch:
                    vals = []
                    for v in row:
                        if v is None:
                            vals.append("NULL")
                        elif isinstance(v, (int, float)):
                            vals.append(str(v))
                        else:
                            escaped = str(v).replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("\r", "\\r")
                            vals.append(f"'{escaped}'")
                    val_strings.append(f"({', '.join(vals)})")
                f.write(f"INSERT INTO `{table}` ({col_list}) VALUES \n{', ' .join(val_strings)};\n")
            f.write(f"UNLOCK TABLES;\n\n")

    f.write("SET FOREIGN_KEY_CHECKS = 1;\n")

cur.execute("SELECT COUNT(*) FROM questions")
q_count = cur.fetchone()[0]
cur.close()
conn.close()

print(f"Export completed: {q_count} questions backed up to liveexam_backup_utf8.sql")

