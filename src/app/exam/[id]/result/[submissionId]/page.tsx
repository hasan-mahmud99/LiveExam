'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RotateCcw, 
  ArrowLeft,
  Share2,
  BookOpen,
  Award,
  ChevronDown,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import FormattedExplanation from '@/components/FormattedExplanation';
import MathText from '@/components/MathText';

interface Submission {
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
}

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  explanation?: string;
  subject: string;
  exam_source?: string;
}

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  negative_marking: number;
  questions: Question[];
}

export default function ResultPage({
  params
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = use(params);

  const [data, setData] = useState<{
    submission: Submission;
    exam: Exam;
    userAnswers: Record<string, string>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});

  const toggleExplanation = (qid: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qid]: !prev[qid]
    }));
  };

  const toggleAllExplanations = () => {
    if (!data) return;
    const hasAnyExpanded = Object.values(expandedExplanations).some(Boolean);
    if (hasAnyExpanded) {
      setExpandedExplanations({});
    } else {
      const allExpanded: Record<number, boolean> = {};
      data.exam.questions.forEach((q) => {
        if (q.explanation) allExpanded[q.id] = true;
      });
      setExpandedExplanations(allExpanded);
    }
  };

  useEffect(() => {
    async function loadResult() {
      try {
        const res = await fetch(`/api/submissions/${submissionId}`);
        if (!res.ok) throw new Error('Result not found');
        const resData = await res.json();
        setData(resData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadResult();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500">ফলাফল তৈরি হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">কোনো ফলাফল পাওয়া যায়নি।</p>
      </div>
    );
  }

  const { submission, exam, userAnswers } = data;
  const accuracy = submission.total_questions > 0
    ? Math.round((submission.correct_count / (submission.correct_count + submission.wrong_count || 1)) * 100)
    : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} মিনিট ${s} সেকেন্ড`;
  };

  const optionLabels: Record<string, string> = {
    A: 'ক',
    B: 'খ',
    C: 'গ',
    D: 'ঘ'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Top Banner & Quick Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          হোমে ফিরে যান
        </Link>
        <Link
          href={`/exam/${id}/leaderboard`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-1.5 rounded-lg shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          গ্রুপ লিডারবোর্ড দেখুন
        </Link>
      </div>

      {/* Main Score Card */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-6 sm:p-8 text-white text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
            <Award className="w-6 h-6 text-amber-300" />
          </div>
          <span className="text-xs uppercase tracking-wider font-bold text-emerald-200">
            পরীক্ষার ফলাফল
          </span>
          <h1 className="text-xl sm:text-2xl font-black">{exam.title}</h1>
          <p className="text-emerald-100 text-sm">
            পরীক্ষার্থী: <strong className="text-white">{submission.user_name}</strong>
          </p>

          <div className="pt-4">
            <div className="inline-block bg-white text-emerald-900 rounded-2xl px-8 py-3 shadow-lg">
              <span className="block text-xs font-semibold text-gray-500 uppercase">মোট প্রাপ্ত নম্বর</span>
              <span className="text-4xl font-black tracking-tight">{submission.score}</span>
              <span className="text-xs text-gray-500 block">/ {submission.total_questions}</span>
            </div>
          </div>
        </div>

        {/* Detailed Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-gray-50 border-t border-gray-100 text-center text-xs">
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-center gap-1 text-emerald-600 font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>সঠিক</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{submission.correct_count}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-center gap-1 text-rose-600 font-bold">
              <XCircle className="w-4 h-4" />
              <span>ভুল উত্তর</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{submission.wrong_count}</div>
            <span className="text-[10px] text-rose-500 font-medium">কাটা গেছে: -{submission.negative_deduction}</span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-center gap-1 text-gray-500 font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>অনাবৃত/বাদ</span>
            </div>
            <div className="text-2xl font-black text-gray-900">{submission.skipped_count}</div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm space-y-1">
            <div className="flex items-center justify-center gap-1 text-blue-600 font-bold">
              <Clock className="w-4 h-4" />
              <span>সময় লেগেছে</span>
            </div>
            <div className="text-base font-black text-gray-900 pt-1">
              {formatTime(submission.time_taken_seconds)}
            </div>
          </div>
        </div>
      </div>

      {/* Answer Review Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              প্রশ্নভিত্তিক ব্যাখ্যা ও উত্তরমালা
            </h2>
            <span className="text-xs text-gray-500">মোট {exam.questions.length} টি প্রশ্নের বিশদ সমাধান</span>
          </div>

          {/* Quick toggle all explanations button */}
          <button
            type="button"
            onClick={toggleAllExplanations}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs font-bold transition self-start sm:self-auto active:scale-95 shadow-2xs"
          >
            {Object.values(expandedExplanations).some(Boolean) ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-gray-500" />
                <span>সকল ব্যাখ্যা লুকান</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>সকল ব্যাখ্যা একসাথে দেখুন</span>
              </>
            )}
          </button>
        </div>

        <div className="space-y-4">
          {exam.questions.map((q, idx) => {
            const userChoice = userAnswers[q.id.toString()];
            const isCorrect = userChoice && userChoice.toUpperCase() === q.correct_option.toUpperCase();
            const isSkipped = !userChoice;
            const isExpanded = !!expandedExplanations[q.id];

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-gray-100 text-gray-800 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                      {q.subject}
                    </span>
                    {q.exam_source && (
                      <span className="text-xs text-gray-500">[{q.exam_source}]</span>
                    )}
                  </div>

                  <div>
                    {isSkipped ? (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                        উত্তর দেননি
                      </span>
                    ) : isCorrect ? (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        সঠিক উত্তর (+1.0)
                      </span>
                    ) : (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        ভুল উত্তর (-{exam.negative_marking})
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <div className="font-bold text-gray-900 text-base">
                  <MathText text={q.question_text} />
                </div>

                {/* Options Review */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'A', text: q.option_a, label: 'ক' },
                    { key: 'B', text: q.option_b, label: 'খ' },
                    { key: 'C', text: q.option_c, label: 'গ' },
                    { key: 'D', text: q.option_d, label: 'ঘ' },
                  ].map((opt) => {
                    const isRightAnswer = opt.key.toUpperCase() === q.correct_option.toUpperCase();
                    const wasChosenByUser = userChoice && userChoice.toUpperCase() === opt.key.toUpperCase();

                    let borderClass = 'border-gray-200 bg-white text-gray-700';
                    if (isRightAnswer) {
                      borderClass = 'border-emerald-500 bg-emerald-50 font-bold text-emerald-900 ring-1 ring-emerald-500';
                    } else if (wasChosenByUser && !isRightAnswer) {
                      borderClass = 'border-rose-400 bg-rose-50 font-medium text-rose-900';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border flex items-center gap-2.5 ${borderClass}`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                            isRightAnswer
                              ? 'bg-emerald-600 text-white'
                              : wasChosenByUser
                              ? 'bg-rose-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <MathText text={opt.text} className="flex-1" />
                        {isRightAnswer && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            সঠিক উত্তর
                          </span>
                        )}
                        {wasChosenByUser && !isRightAnswer && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            আপনার উত্তর
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Toggle Button & Box */}
                {q.explanation && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => toggleExplanation(q.id)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
                        isExpanded
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isExpanded ? 'ব্যাখ্যা লুকান' : 'ব্যাখ্যা দেখুন'}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:p-4 text-xs text-slate-800 animate-fadeIn">
                        <FormattedExplanation explanation={q.explanation} subject={q.subject} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
