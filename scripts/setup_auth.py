import sys
import hashlib
import pymysql

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
cursor = conn.cursor()

# Create users table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
''')

# 3 Accounts specified by user:
# 1. admin : admin321 (ADMIN)
# 2. kona : kona123 (STUDENT)
# 3. hasan : hasan123 (STUDENT)
accounts = [
    ('admin', hashlib.sha256('admin321'.encode('utf-8')).hexdigest(), 'ADMIN', 'এডমিন (Admin)'),
    ('kona', hashlib.sha256('kona123'.encode('utf-8')).hexdigest(), 'STUDENT', 'কণা (Kona)'),
    ('hasan', hashlib.sha256('hasan123'.encode('utf-8')).hexdigest(), 'STUDENT', 'হাসান (Hasan)')
]

for username, pwd_hash, role, display_name in accounts:
    cursor.execute('''
        INSERT INTO users (username, password_hash, role, display_name)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            password_hash = VALUES(password_hash),
            role = VALUES(role),
            display_name = VALUES(display_name);
    ''', (username, pwd_hash, role, display_name))

conn.commit()

cursor.execute('SELECT id, username, role, display_name FROM users;')
for row in cursor.fetchall():
    print(f"User: ID={row[0]} | Username={row[1]} | Role={row[2]} | Name={row[3]}")

conn.close()
print("Auth users initialized successfully!")

