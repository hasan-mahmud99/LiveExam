import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, parseCookie } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

function getAuthUser(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const token = parseCookie(cookieHeader, 'liveexam_auth');
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/favorites - Fetch all favorites for the logged-in user
export async function GET(request: NextRequest) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT q.*, f.created_at as favorited_at
       FROM user_favorites f
       JOIN questions q ON f.question_id = q.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`,
      [authUser.id]
    );

    return NextResponse.json({ favorites: rows });
  } catch (error: any) {
    console.error('Error fetching user favorites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/favorites - Toggle favorite for a question
export async function POST(request: NextRequest) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const questionId = Number(body.question_id);
    if (!questionId) {
      return NextResponse.json({ error: 'question_id is required' }, { status: 400 });
    }

    // Check if already favorited
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM user_favorites WHERE user_id = ? AND question_id = ?',
      [authUser.id, questionId]
    );

    if (existing.length > 0) {
      // Remove from favorites
      await pool.query(
        'DELETE FROM user_favorites WHERE user_id = ? AND question_id = ?',
        [authUser.id, questionId]
      );
      return NextResponse.json({ isFavorite: false, question_id: questionId });
    } else {
      // Add to favorites
      await pool.query(
        'INSERT INTO user_favorites (user_id, question_id) VALUES (?, ?)',
        [authUser.id, questionId]
      );
      return NextResponse.json({ isFavorite: true, question_id: questionId });
    }
  } catch (error: any) {
    console.error('Error toggling favorite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/favorites - Clear all favorites for this user
export async function DELETE(request: NextRequest) {
  const authUser = getAuthUser(request);
  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await pool.query('DELETE FROM user_favorites WHERE user_id = ?', [authUser.id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error clearing favorites:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
