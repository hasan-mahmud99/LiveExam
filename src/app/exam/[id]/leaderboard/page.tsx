'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Medal, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Play, 
  Users,
  Award
} from 'lucide-react';

interface LeaderboardItem {
  id: string;
  exam_id: string;
  user_name: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  skipped_count: number;
  time_taken_seconds: number;
  submitted_at: string;
  rank: number;
}

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  total_questions: number;
}

export default function LeaderboardPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [lbRes, examRes] = await Promise.all([
          fetch(`/api/exams/${id}/leaderboard`),
          fetch(`/api/exams/${id}`)
        ]);

        const lbData = await lbRes.json();
        const examData = await examRes.json();

        setLeaderboard(Array.isArray(lbData) ? lbData : []);
        setExam(examData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}মি ${s}সে`;
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500">লিডারবোর্ড লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          হোমে ফিরে যান
        </Link>
        <Link
          href={`/exam/${id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm transition"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          এই পরীক্ষা দিন
        </Link>
      </div>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg text-center space-y-3 relative overflow-hidden">
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto shadow-inner">
          <Trophy className="w-8 h-8 text-amber-100" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black">{exam?.title || 'মডেল টেস্ট'}</h1>
        <p className="text-amber-100 text-xs sm:text-sm font-medium">
          স্টাডি গ্রুপ মেধা তালিকা ও রিয়েল-টাইম র‍্যাঙ্কিং
        </p>

        {/* Podium for Top 3 */}
        {topThree.length > 0 && (
          <div className="pt-6 grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto items-end">
            {/* 2nd Place */}
            {topThree[1] && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/20 order-1">
                <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-800 font-black text-xs inline-flex items-center justify-center shadow mb-1">
                  2
                </span>
                <div className="font-bold text-xs sm:text-sm truncate">{topThree[1].user_name}</div>
                <div className="text-lg font-black text-white">{topThree[1].score}</div>
                <div className="text-[10px] text-amber-200">{formatTime(topThree[1].time_taken_seconds)}</div>
              </div>
            )}

            {/* 1st Place */}
            {topThree[0] && (
              <div className="bg-white text-gray-900 rounded-2xl p-4 text-center shadow-2xl border-2 border-yellow-200 order-2 scale-105">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm inline-flex items-center justify-center shadow mb-1">
                  👑 1
                </div>
                <div className="font-black text-sm sm:text-base text-gray-900 truncate">
                  {topThree[0].user_name}
                </div>
                <div className="text-2xl font-black text-amber-600">{topThree[0].score}</div>
                <div className="text-[10px] text-gray-500 font-semibold">{formatTime(topThree[0].time_taken_seconds)}</div>
              </div>
            )}

            {/* 3rd Place */}
            {topThree[2] && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 text-center border border-white/20 order-3">
                <span className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs inline-flex items-center justify-center shadow mb-1">
                  3
                </span>
                <div className="font-bold text-xs sm:text-sm truncate">{topThree[2].user_name}</div>
                <div className="text-lg font-black text-white">{topThree[2].score}</div>
                <div className="text-[10px] text-amber-200">{formatTime(topThree[2].time_taken_seconds)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            সকল পরীক্ষার্থীর মেধা তালিকা ({leaderboard.length} জন)
          </h2>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm space-y-2">
            <Trophy className="w-8 h-8 text-gray-300 mx-auto" />
            <p>এখনো কেউ পরীক্ষা সম্পন্ন করেনি।</p>
            <Link
              href={`/exam/${id}`}
              className="inline-block text-xs font-bold text-emerald-600 hover:underline"
            >
              প্রথম পরীক্ষা দিন
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-600 uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-center">মেধাক্রম</th>
                  <th className="py-3 px-4">নাম</th>
                  <th className="py-3 px-4 text-center">মোট নম্বর</th>
                  <th className="py-3 px-4 text-center">সঠিক / ভুল</th>
                  <th className="py-3 px-4 text-center">সময়</th>
                  <th className="py-3 px-4 text-right">বিশদ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaderboard.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 text-center font-bold">
                      {item.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500 text-white inline-flex items-center justify-center font-bold text-xs shadow-sm">
                          1
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 inline-flex items-center justify-center font-bold text-xs shadow-sm">
                          2
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center font-bold text-xs shadow-sm">
                          3
                        </span>
                      ) : (
                        <span className="text-gray-500">{item.rank}</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-bold text-gray-900">
                      {item.user_name}
                    </td>

                    <td className="py-3 px-4 text-center font-black text-sm text-emerald-700">
                      {item.score}
                    </td>

                    <td className="py-3 px-4 text-center text-gray-600">
                      <span className="text-emerald-600 font-semibold">{item.correct_count}</span>
                      {' / '}
                      <span className="text-rose-500 font-semibold">{item.wrong_count}</span>
                    </td>

                    <td className="py-3 px-4 text-center text-gray-500 font-medium">
                      {formatTime(item.time_taken_seconds)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/exam/${id}/result/${item.id}`}
                        className="text-emerald-600 hover:text-emerald-800 font-semibold hover:underline"
                      >
                        খাতা দেখুন &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
