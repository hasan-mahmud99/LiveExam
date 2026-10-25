import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'liveexam_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

export interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string | null;
  subject: string;
  topic?: string | null;
  exam_type: string;
  grade: string;
  exam_source?: string | null;
  year?: number | null;
  created_at?: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string | null;
  mode: 'live' | 'practice';
  subject?: string | null;
  exam_type_filter?: string | null;
  grade_filter?: string | null;
  duration_minutes: number;
  negative_marking: number;
  marks_per_question: number;
  scheduled_start_time?: string | null;
  question_ids: string | number[]; // JSON string or parsed array
  is_active: number;
  created_at?: string;
  total_questions?: number;
}

export interface Submission {
  id: string;
  exam_id: string;
  user_name: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  negative_deduction: number;
  time_taken_seconds: number;
  answers: string | Record<string, string>;
  submitted_at?: string;
}

export default pool;
