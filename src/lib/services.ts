import pool, { Question, Exam, Submission } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface QuestionFilter {
  subject?: string;
  exam_type?: string;
  grade?: string;
  topic?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

let defaultQuestionsCache: { data?: { questions: Question[]; total: number }; time: number } = { time: 0 };
const DEFAULT_QUESTIONS_TTL = 3 * 60 * 1000; // 3 minutes

export async function getQuestions(filter: QuestionFilter = {}): Promise<{ questions: Question[]; total: number }> {
  let whereClauses: string[] = [];
  let params: any[] = [];

  const isDefaultQuery = 
    (!filter.subject || filter.subject === 'all') &&
    (!filter.exam_type || filter.exam_type === 'all') &&
    (!filter.grade || filter.grade === 'all') &&
    (!filter.topic || filter.topic === 'all') &&
    (!filter.search || !filter.search.trim()) &&
    (!filter.offset || filter.offset === 0) &&
    (Number(filter.limit || 50) === 50);

  const now = Date.now();
  if (isDefaultQuery && defaultQuestionsCache.data && now - defaultQuestionsCache.time < DEFAULT_QUESTIONS_TTL) {
    return defaultQuestionsCache.data;
  }

  if (filter.subject && filter.subject !== 'all') {
    whereClauses.push('subject = ?');
    params.push(filter.subject);
  }

  if (filter.exam_type && filter.exam_type !== 'all') {
    whereClauses.push('exam_type = ?');
    params.push(filter.exam_type);
  }

  if (filter.grade && filter.grade !== 'all') {
    if (filter.grade === '10-13' || filter.grade === 'Grade 10-13') {
      whereClauses.push("grade IN ('Grade 10', 'Grade 11', 'Grade 12', 'Grade 13')");
    } else if (filter.grade === '13-16' || filter.grade === 'Grade 13-16') {
      whereClauses.push("grade IN ('Grade 13', 'Grade 14', 'Grade 15', 'Grade 16', 'Grade 13-16')");
    } else if (filter.grade === '17-20') {
      whereClauses.push("grade IN ('Grade 17', 'Grade 18', 'Grade 19', 'Grade 20')");
    } else {
      whereClauses.push('grade = ?');
      params.push(filter.grade);
    }
  }

  if (filter.topic && filter.topic !== 'all') {
    whereClauses.push('topic = ?');
    params.push(filter.topic);
  }

  if (filter.search && filter.search.trim()) {
    whereClauses.push('(question_text LIKE ? OR explanation LIKE ? OR exam_source LIKE ?)');
    const term = `%${filter.search.trim()}%`;
    params.push(term, term, term);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  let total = 0;
  if (whereClauses.length === 0 && cachedStats?.totalQuestions) {
    total = cachedStats.totalQuestions;
  } else {
    const [countRows] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as count FROM questions ${whereSql}`,
      params
    );
    total = Number(countRows[0]?.count || 0);
  }

  const limit = Number(filter.limit || 50);
  const offset = Number(filter.offset || 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM questions ${whereSql} ORDER BY id ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const result = { questions: rows as Question[], total };

  if (isDefaultQuery) {
    defaultQuestionsCache = { data: result, time: now };
  }

  return result;
}

export async function insertQuestionsBatch(questions: Omit<Question, 'id' | 'created_at'>[]): Promise<number> {
  if (!questions || questions.length === 0) return 0;

  const values: any[] = [];
  const placeholders: string[] = [];

  for (const q of questions) {
    placeholders.push('(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    values.push(
      q.question_text,
      q.option_a,
      q.option_b,
      q.option_c,
      q.option_d,
      q.correct_option,
      q.explanation || null,
      q.subject,
      q.topic || null,
      q.exam_type,
      q.grade,
      q.exam_source || null,
      q.year || null
    );
  }

  const sql = `
    INSERT INTO questions (
      question_text, option_a, option_b, option_c, option_d,
      correct_option, explanation, subject, topic,
      exam_type, grade, exam_source, year
    ) VALUES ${placeholders.join(', ')}
  `;

  const [result] = await pool.query<ResultSetHeader>(sql, values);
  invalidateQuestionsCache();
  return result.affectedRows;
}

// Server-side In-Memory Caching for Blazing Fast Instant Responses
let cachedStats: any = null;
let lastStatsFetchTime = 0;
const STATS_CACHE_TTL = 3 * 60 * 1000; // 3 minutes

export async function getStats() {
  const now = Date.now();
  if (cachedStats && now - lastStatsFetchTime < STATS_CACHE_TTL) {
    return cachedStats;
  }

  const [totalQ] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM questions');
  const [totalE] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM exams');
  const [totalS] = await pool.query<RowDataPacket[]>('SELECT COUNT(*) as c FROM submissions');

  const [subjects] = await pool.query<RowDataPacket[]>(
    'SELECT subject, COUNT(*) as count FROM questions GROUP BY subject ORDER BY count DESC'
  );
  const [examTypes] = await pool.query<RowDataPacket[]>(
    'SELECT exam_type, COUNT(*) as count FROM questions GROUP BY exam_type ORDER BY count DESC'
  );
  const [grades] = await pool.query<RowDataPacket[]>(
    'SELECT grade, COUNT(*) as count FROM questions GROUP BY grade ORDER BY count DESC'
  );

  const stats = {
    totalQuestions: Number(totalQ[0]?.c || 0),
    totalExams: Number(totalE[0]?.c || 0),
    totalSubmissions: Number(totalS[0]?.c || 0),
    subjects: subjects as { subject: string; count: number }[],
    examTypes: examTypes as { exam_type: string; count: number }[],
    grades: grades as { grade: string; count: number }[],
  };

  cachedStats = stats;
  lastStatsFetchTime = now;
  return stats;
}

export async function createExam(data: {
  title: string;
  description?: string;
  mode: 'live' | 'practice';
  subject?: string;
  topic_filter?: string;
  exam_type_filter?: string;
  grade_filter?: string;
  duration_minutes: number;
  negative_marking: number;
  marks_per_question: number;
  scheduled_start_time?: string;
  question_count?: number;
  question_ids?: number[];
}): Promise<Exam> {
  let chosenIds: number[] = [];

  if (data.question_ids && data.question_ids.length > 0) {
    chosenIds = data.question_ids;
  } else {
    let whereClauses: string[] = [];
    let params: any[] = [];

    if (data.subject && data.subject !== 'all') {
      whereClauses.push('subject = ?');
      params.push(data.subject);
    }
    if (data.topic_filter && data.topic_filter !== 'all') {
      whereClauses.push('topic = ?');
      params.push(data.topic_filter);
    }
    if (data.exam_type_filter && data.exam_type_filter !== 'all') {
      whereClauses.push('exam_type = ?');
      params.push(data.exam_type_filter);
    }
    if (data.grade_filter && data.grade_filter !== 'all') {
      if (data.grade_filter === '10-13' || data.grade_filter === 'Grade 10-13') {
        whereClauses.push("grade IN ('Grade 10', 'Grade 11', 'Grade 12', 'Grade 13')");
      } else if (data.grade_filter === '13-16' || data.grade_filter === 'Grade 13-16') {
        whereClauses.push("grade IN ('Grade 13', 'Grade 14', 'Grade 15', 'Grade 16', 'Grade 13-16')");
      } else if (data.grade_filter === '17-20') {
        whereClauses.push("grade IN ('Grade 17', 'Grade 18', 'Grade 19', 'Grade 20')");
      } else {
        whereClauses.push('grade = ?');
        params.push(data.grade_filter);
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const limit = Number(data.question_count || 20);

    // Deduplicate by question_text so no repeated questions ever appear in the same exam
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT MIN(id) as id FROM questions ${whereSql} GROUP BY TRIM(LOWER(question_text)) ORDER BY RAND() LIMIT ?`,
      [...params, limit]
    );
    chosenIds = rows.map((r: any) => r.id);
  }

  const id = `exam-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  await pool.query(
    `INSERT INTO exams (
      id, title, description, mode, subject, exam_type_filter, grade_filter,
      duration_minutes, negative_marking, marks_per_question,
      scheduled_start_time, question_ids
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.title,
      data.description || null,
      data.mode,
      data.subject || null,
      data.exam_type_filter || null,
      data.grade_filter || null,
      data.duration_minutes,
      data.negative_marking,
      data.marks_per_question,
      data.scheduled_start_time || null,
      JSON.stringify(chosenIds),
    ]
  );

  const created = await getExamById(id);
  invalidateExamsCache();
  return created!;
}

const examsCache: Map<string, { data: Exam[]; time: number }> = new Map();
const EXAMS_CACHE_TTL = 60 * 1000; // 1 minute in-memory cache

export function invalidateExamsCache() {
  examsCache.clear();
  examByIdCache.clear();
  cachedStats = null;
}

export function invalidateQuestionsCache() {
  defaultQuestionsCache = { time: 0 };
  topicsCache.clear();
  cachedStats = null;
}

export async function getExams(filter: { mode?: string; subject?: string } = {}): Promise<Exam[]> {
  const cacheKey = `${filter.mode || 'all'}_${filter.subject || 'all'}`;
  const now = Date.now();
  const cached = examsCache.get(cacheKey);
  if (cached && now - cached.time < EXAMS_CACHE_TTL) {
    return cached.data;
  }

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (filter.mode && filter.mode !== 'all') {
    whereClauses.push('mode = ?');
    params.push(filter.mode);
  }

  if (filter.subject && filter.subject !== 'all') {
    whereClauses.push('subject = ?');
    params.push(filter.subject);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM exams ${whereSql} ORDER BY created_at DESC`, params);
  const result: Exam[] = rows.map((row: any) => {
    let ids: number[] = [];
    try {
      ids = typeof row.question_ids === 'string' ? JSON.parse(row.question_ids) : row.question_ids;
    } catch {}
    return {
      ...row,
      duration_minutes: Number(row.duration_minutes),
      negative_marking: Number(row.negative_marking),
      marks_per_question: Number(row.marks_per_question),
      total_questions: Array.isArray(ids) ? ids.length : 0,
    };
  });

  examsCache.set(cacheKey, { data: result, time: now });
  return result;
}

const examByIdCache = new Map<string, { data: any; time: number }>();
const EXAM_BY_ID_TTL = 3 * 60 * 1000; // 3 minutes

export async function getExamById(id: string): Promise<(Exam & { questions?: Question[] }) | null> {
  const now = Date.now();
  const cached = examByIdCache.get(id);
  if (cached && now - cached.time < EXAM_BY_ID_TTL) {
    return cached.data;
  }

  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM exams WHERE id = ?', [id]);
  const exam = rows[0] as any;
  if (!exam) return null;

  let ids: number[] = [];
  try {
    ids = typeof exam.question_ids === 'string' ? JSON.parse(exam.question_ids) : exam.question_ids;
  } catch {}

  let questions: Question[] = [];
  if (Array.isArray(ids) && ids.length > 0) {
    const placeholders = ids.map(() => '?').join(',');
    const [qRows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM questions WHERE id IN (${placeholders})`,
      ids
    );
    const qMap = new Map((qRows as Question[]).map(q => [q.id, q]));
    questions = ids.map(qid => qMap.get(qid)).filter(Boolean) as Question[];
  }

  const result = {
    ...exam,
    duration_minutes: Number(exam.duration_minutes),
    negative_marking: Number(exam.negative_marking),
    marks_per_question: Number(exam.marks_per_question),
    total_questions: ids.length,
    questions,
  };

  examByIdCache.set(id, { data: result, time: now });
  return result;
}

const topicsCache = new Map<string, { data: any; time: number }>();
const TOPICS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getTopics(subject?: string) {
  const cacheKey = subject || 'all';
  const now = Date.now();
  const cached = topicsCache.get(cacheKey);
  if (cached && now - cached.time < TOPICS_CACHE_TTL) {
    return cached.data;
  }

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
  topicsCache.set(cacheKey, { data: rows, time: now });
  return rows;
}

export async function submitExam(submissionData: {
  exam_id: string;
  user_name: string;
  user_id?: number | null;
  time_taken_seconds: number;
  answers: Record<string, string>;
  allow_negative?: boolean;
}) {
  const exam = await getExamById(submissionData.exam_id);
  if (!exam || !exam.questions) {
    throw new Error('Exam not found');
  }

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;

  for (const q of exam.questions) {
    const userAns = submissionData.answers[q.id.toString()];
    if (!userAns) {
      skippedCount++;
    } else if (userAns.trim().toUpperCase() === q.correct_option.trim().toUpperCase()) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  const marksPerQ = Number(exam.marks_per_question);
  const isPractice = exam.mode === 'practice';
  const negMark = isPractice && submissionData.allow_negative === false ? 0 : Number(exam.negative_marking);
  const positiveMarks = correctCount * marksPerQ;
  const negativeDeduction = wrongCount * negMark;
  const netScore = Math.max(0, Number((positiveMarks - negativeDeduction).toFixed(2)));

  const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  await pool.query(
    `INSERT INTO submissions (
      id, exam_id, user_name, user_id, score, total_questions,
      correct_count, wrong_count, skipped_count, negative_deduction,
      time_taken_seconds, answers
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      submissionId,
      submissionData.exam_id,
      submissionData.user_name.trim(),
      submissionData.user_id || null,
      netScore,
      exam.questions.length,
      correctCount,
      wrongCount,
      skippedCount,
      negativeDeduction,
      submissionData.time_taken_seconds,
      JSON.stringify(submissionData.answers),
    ]
  );

  return {
    submission_id: submissionId,
    user_name: submissionData.user_name,
    score: netScore,
    total_questions: exam.questions.length,
    correct_count: correctCount,
    wrong_count: wrongCount,
    skipped_count: skippedCount,
    negative_deduction: negativeDeduction,
    time_taken_seconds: submissionData.time_taken_seconds,
  };
}

export async function getUserSubmissions(userName: string, userId?: number | null) {
  let query = 'SELECT s.*, e.title as exam_title, e.mode as exam_mode, e.grade_filter FROM submissions s JOIN exams e ON s.exam_id = e.id WHERE ';
  let params: any[] = [];
  if (userId) {
    query += '(s.user_id = ? OR s.user_name = ?) ';
    params.push(userId, userName);
  } else {
    query += 's.user_name = ? ';
    params.push(userName);
  }
  query += 'ORDER BY s.submitted_at DESC';

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows.map((r: any) => ({
    ...r,
    score: Number(r.score),
    negative_deduction: Number(r.negative_deduction),
  }));
}

export async function getLeaderboard(examId: string): Promise<(Submission & { rank: number })[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM submissions
     WHERE exam_id = ?
     ORDER BY score DESC, time_taken_seconds ASC, submitted_at ASC`,
    [examId]
  );

  return (rows as Submission[]).map((r, index) => ({
    ...r,
    score: Number(r.score),
    negative_deduction: Number(r.negative_deduction),
    rank: index + 1,
  }));
}

export async function getSubmissionDetails(submissionId: string) {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM submissions WHERE id = ?', [submissionId]);
  const submission = rows[0] as any;
  if (!submission) return null;

  const exam = await getExamById(submission.exam_id);
  const userAnswers: Record<string, string> =
    typeof submission.answers === 'string' ? JSON.parse(submission.answers || '{}') : submission.answers || {};

  return {
    submission: {
      ...submission,
      score: Number(submission.score),
      negative_deduction: Number(submission.negative_deduction),
    },
    exam,
    userAnswers,
  };
}
