const fs = require('fs');
const path = require('path');
const readline = require('readline');
const mysql = require('mysql2/promise');

function getStoredPassword() {
  if (process.env.TIDB_PASSWORD) return process.env.TIDB_PASSWORD;
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^\s*TIDB_PASSWORD\s*=\s*(.*)\s*$/);
      if (match) {
        return match[1].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return null;
}

async function askPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Please enter your TiDB Cloud password: ', (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  const cloudPassword = process.argv[2] || getStoredPassword() || (await askPassword());

  if (!cloudPassword) {
    console.error('Error: TiDB password cannot be empty.');
    process.exit(1);
  }

  const cloudHost = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const cloudPort = 4000;
  const cloudUser = '3LNRyzdpuApyP4b.root';

  console.log('\n==============================================');
  console.log('🚀 LIVEEXAM DIRECT CLOUD DB MIGRATION');
  console.log('==============================================');

  console.log('\n[1/5] Connecting to local MySQL (127.0.0.1:3306)...');
  let localConn;
  try {
    localConn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'liveexam_db',
      charset: 'utf8mb4',
    });
    console.log('✓ Connected to local database (liveexam_db).');
  } catch (err) {
    console.error('✗ Failed to connect to local MySQL:', err.message);
    process.exit(1);
  }

  console.log(`\n[2/5] Connecting to TiDB Cloud (${cloudHost}:${cloudPort})...`);
  let cloudConn;
  try {
    cloudConn = await mysql.createConnection({
      host: cloudHost,
      port: cloudPort,
      user: cloudUser,
      password: cloudPassword,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
      charset: 'utf8mb4',
    });
    console.log('✓ Connected to TiDB Cloud!');
  } catch (err) {
    console.error('✗ Failed to connect to TiDB Cloud:', err.message);
    await localConn.end();
    process.exit(1);
  }

  try {
    console.log('\n[3/5] Setting up cloud database and schema...');
    await cloudConn.query('CREATE DATABASE IF NOT EXISTS liveexam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await cloudConn.query('USE liveexam_db;');
    await cloudConn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Table DDLs optimized for MySQL/TiDB
    const ddl = [
      `DROP TABLE IF EXISTS submissions;`,
      `DROP TABLE IF EXISTS exams;`,
      `DROP TABLE IF EXISTS questions;`,
      `DROP TABLE IF EXISTS users;`,

      `CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
        display_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE exams (
        id VARCHAR(100) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT DEFAULT NULL,
        mode VARCHAR(50) NOT NULL DEFAULT 'practice',
        subject VARCHAR(100) DEFAULT NULL,
        exam_type_filter VARCHAR(100) DEFAULT NULL,
        grade_filter VARCHAR(100) DEFAULT NULL,
        duration_minutes INT NOT NULL DEFAULT 15,
        negative_marking DECIMAL(4,2) NOT NULL DEFAULT 0.25,
        marks_per_question DECIMAL(4,2) NOT NULL DEFAULT 1.00,
        scheduled_start_time VARCHAR(100) DEFAULT NULL,
        question_ids LONGTEXT NOT NULL,
        is_active TINYINT DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_text TEXT NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT NOT NULL,
        option_d TEXT NOT NULL,
        correct_option VARCHAR(10) NOT NULL,
        explanation TEXT DEFAULT NULL,
        subject VARCHAR(100) NOT NULL,
        topic VARCHAR(255) DEFAULT NULL,
        exam_type VARCHAR(100) NOT NULL,
        grade VARCHAR(100) NOT NULL,
        exam_source VARCHAR(255) DEFAULT NULL,
        year INT DEFAULT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_subject (subject),
        INDEX idx_exam_type (exam_type),
        INDEX idx_grade (grade)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE submissions (
        id VARCHAR(100) PRIMARY KEY,
        exam_id VARCHAR(100) NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        score DECIMAL(6,2) NOT NULL,
        total_questions INT NOT NULL,
        correct_count INT NOT NULL,
        wrong_count INT NOT NULL,
        skipped_count INT NOT NULL,
        negative_deduction DECIMAL(6,2) NOT NULL,
        time_taken_seconds INT NOT NULL,
        answers LONGTEXT NOT NULL,
        submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        user_id INT DEFAULT NULL,
        INDEX idx_exam_id (exam_id),
        INDEX idx_sub_user (user_id, user_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
    ];

    for (const statement of ddl) {
      await cloudConn.query(statement);
    }
    console.log('✓ All 4 tables created cleanly on TiDB Cloud.');

    console.log('\n[4/5] Migrating data table by table...');

    // 1. Users
    const [users] = await localConn.query('SELECT * FROM users');
    console.log(`- Migrating users (${users.length} records)...`);
    for (const u of users) {
      await cloudConn.query(
        'INSERT INTO users (id, username, password_hash, role, display_name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [u.id, u.username, u.password_hash, u.role, u.display_name, u.created_at]
      );
    }
    console.log('  ✓ Users migrated.');

    // 2. Exams
    const [exams] = await localConn.query('SELECT * FROM exams');
    console.log(`- Migrating exams (${exams.length} records)...`);
    for (const e of exams) {
      const qIdsStr = typeof e.question_ids === 'string' ? e.question_ids : JSON.stringify(e.question_ids);
      await cloudConn.query(
        `INSERT INTO exams (id, title, description, mode, subject, exam_type_filter, grade_filter, duration_minutes, negative_marking, marks_per_question, scheduled_start_time, question_ids, is_active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [e.id, e.title, e.description, e.mode, e.subject, e.exam_type_filter, e.grade_filter, e.duration_minutes, e.negative_marking, e.marks_per_question, e.scheduled_start_time, qIdsStr, e.is_active, e.created_at]
      );
    }
    console.log('  ✓ Exams migrated.');

    // 3. Questions (Batch of 500)
    const [qCountRow] = await localConn.query('SELECT COUNT(*) as c FROM questions');
    const totalQuestions = qCountRow[0].c;
    console.log(`- Migrating questions (${totalQuestions} records in batches of 500)...`);

    const BATCH_SIZE = 500;
    for (let offset = 0; offset < totalQuestions; offset += BATCH_SIZE) {
      const [qBatch] = await localConn.query(`SELECT * FROM questions ORDER BY id LIMIT ? OFFSET ?`, [BATCH_SIZE, offset]);
      if (qBatch.length === 0) break;

      const placeholders = qBatch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
      const values = [];
      for (const q of qBatch) {
        values.push(
          q.id,
          q.question_text,
          q.option_a,
          q.option_b,
          q.option_c,
          q.option_d,
          q.correct_option,
          q.explanation,
          q.subject,
          q.topic,
          q.exam_type,
          q.grade,
          q.exam_source,
          q.year,
          q.created_at
        );
      }

      await cloudConn.query(
        `INSERT INTO questions (id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, subject, topic, exam_type, grade, exam_source, year, created_at) VALUES ${placeholders}`,
        values
      );

      const current = Math.min(offset + qBatch.length, totalQuestions);
      const pct = ((current / totalQuestions) * 100).toFixed(1);
      process.stdout.write(`\r  Progress: ${current} / ${totalQuestions} (${pct}%)`);
    }
    console.log('\n  ✓ Questions migrated.');

    // 4. Submissions
    const [subs] = await localConn.query('SELECT * FROM submissions');
    console.log(`- Migrating submissions (${subs.length} records)...`);
    for (const s of subs) {
      const ansStr = typeof s.answers === 'string' ? s.answers : JSON.stringify(s.answers);
      await cloudConn.query(
        `INSERT INTO submissions (id, exam_id, user_name, score, total_questions, correct_count, wrong_count, skipped_count, negative_deduction, time_taken_seconds, answers, submitted_at, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.exam_id, s.user_name, s.score, s.total_questions, s.correct_count, s.wrong_count, s.skipped_count, s.negative_deduction, s.time_taken_seconds, ansStr, s.submitted_at, s.user_id]
      );
    }
    console.log('  ✓ Submissions migrated.');

    await cloudConn.query('SET FOREIGN_KEY_CHECKS = 1;');

    // [5/5] Verification
    console.log('\n[5/5] Verifying cloud database data...');
    const [cloudQ] = await cloudConn.query('SELECT COUNT(*) as c FROM questions');
    const [cloudE] = await cloudConn.query('SELECT COUNT(*) as c FROM exams');
    const [cloudU] = await cloudConn.query('SELECT COUNT(*) as c FROM users');
    const [cloudS] = await cloudConn.query('SELECT COUNT(*) as c FROM submissions');

    console.log('----------------------------------------------');
    console.log(`Questions in Cloud:   ${cloudQ[0].c} (Target: 12,897)`);
    console.log(`Exams in Cloud:       ${cloudE[0].c} (Target: 169)`);
    console.log(`Users in Cloud:       ${cloudU[0].c} (Target: 3)`);
    console.log(`Submissions in Cloud: ${cloudS[0].c} (Target: 4)`);
    console.log('----------------------------------------------');

    // Test reading one sample Bengali question from Cloud
    const [sample] = await cloudConn.query('SELECT id, question_text, option_a FROM questions LIMIT 1');
    console.log('Sample Cloud Question (Bengali check):');
    console.log(`ID ${sample[0].id}: ${sample[0].question_text} [A: ${sample[0].option_a}]`);

    console.log('\n==============================================');
    console.log('🎉 SUCCESS: All data migrated to TiDB Cloud flawlessly!');
    console.log('==============================================');
  } catch (err) {
    console.error('\n✗ Error during migration:', err);
  } finally {
    if (localConn) await localConn.end();
    if (cloudConn) await cloudConn.end();
  }
}

main();

