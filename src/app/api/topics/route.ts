import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');

    let sql = `
      SELECT subject, topic, COUNT(*) as count 
      FROM questions 
      WHERE topic IS NOT NULL AND topic != '' 
    `;
    const params: any[] = [];

    if (subject && subject !== 'all') {
      sql += ' AND subject = ?';
      params.push(subject);
    }

    sql += ' GROUP BY subject, topic ORDER BY count DESC';

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);

    return NextResponse.json({ topics: rows });
  } catch (error: any) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

