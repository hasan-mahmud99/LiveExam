const fs = require('fs');
const readline = require('readline');
const mysql = require('mysql2/promise');

async function askPassword() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question('Enter your TiDB password: ', (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  const password = process.argv[2] || process.env.TIDB_PASSWORD || await askPassword();

  if (!password) {
    console.error('Error: Password cannot be empty.');
    process.exit(1);
  }

  const host = 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com';
  const port = 4000;
  const user = '3LNRyzdpuApyP4b.root';

  console.log(`\nConnecting to TiDB Cloud at ${host}:${port}...`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: false,
      },
      multipleStatements: true,
      charset: 'utf8mb4',
    });
    console.log('✓ Successfully connected to TiDB Cloud!');
  } catch (err) {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  }

  try {
    // 1. Create and use database
    console.log('Setting up database "liveexam_db"...');
    await connection.query('CREATE DATABASE IF NOT EXISTS liveexam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;');
    await connection.query('USE liveexam_db;');
    console.log('✓ Database "liveexam_db" ready.');

    // 2. Read SQL backup
    const sqlFilePath = 'liveexam_backup_utf8.sql';
    console.log(`Reading ${sqlFilePath}...`);
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`File ${sqlFilePath} not found!`);
    }

    const rawSql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`✓ Read ${(rawSql.length / (1024 * 1024)).toFixed(2)} MB of SQL data.`);

    // 3. Clean and parse statements
    // We split on semicolons followed by newline
    console.log('Parsing SQL statements...');
    
    // Disable foreign key checks for clean import
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');

    // Parse statements line by line or by delimiter
    const lines = rawSql.split(/\r?\n/);
    let currentStmt = '';
    const statements = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip pure comments or directives that TiDB might reject
      if (trimmed.startsWith('--') || trimmed.startsWith('/*M!') || (trimmed.startsWith('/*') && trimmed.endsWith('*/;'))) {
        continue;
      }

      currentStmt += line + '\n';

      if (trimmed.endsWith(';')) {
        statements.push(currentStmt);
        currentStmt = '';
      }
    }

    if (currentStmt.trim()) {
      statements.push(currentStmt);
    }

    console.log(`Found ${statements.length} statements to execute.`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (!stmt) continue;

      // Print progress for big operations
      const preview = stmt.substring(0, 60).replace(/\s+/g, ' ');
      process.stdout.write(`Executing [${i + 1}/${statements.length}]: ${preview}... `);

      try {
        await connection.query(stmt);
        console.log('✓');
        successCount++;
      } catch (err) {
        console.log(`✗`);
        console.warn(`  Warning on statement: ${err.message}`);
        errorCount++;
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 4. Verification
    console.log('\n--- VERIFYING IMPORT ---');
    const [qRows] = await connection.query('SELECT COUNT(*) as cnt FROM questions');
    const [eRows] = await connection.query('SELECT COUNT(*) as cnt FROM exams');
    const [uRows] = await connection.query('SELECT COUNT(*) as cnt FROM users');

    console.log(`Questions imported: ${qRows[0].cnt}`);
    console.log(`Exams imported:     ${eRows[0].cnt}`);
    console.log(`Users imported:     ${uRows[0].cnt}`);

    console.log('\n=============================================');
    console.log('🎉 TiDB Cloud Database Import COMPLETED!');
    console.log('=============================================');
  } catch (err) {
    console.error('Error during execution:', err);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();

