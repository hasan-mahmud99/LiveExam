'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Filter, 
  BookOpen, 
  HelpCircle, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Layers,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Hash
} from 'lucide-react';
import FormattedExplanation from '@/components/FormattedExplanation';
import MathText from '@/components/MathText';

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
  topic?: string;
  exam_type: string;
  grade: string;
  exam_source?: string;
  year?: number;
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [subject, setSubject] = useState('all');
  const [topic, setTopic] = useState('all');
  const [availableTopics, setAvailableTopics] = useState<{ topic: string; count: number }[]>([]);
  const [examType, setExamType] = useState('all');
  const [grade, setGrade] = useState('all');
  const [search, setSearch] = useState('');

  // Fetch topics whenever subject changes
  useEffect(() => {
    async function loadTopics() {
      try {
        const url = subject !== 'all' ? `/api/topics?subject=${encodeURIComponent(subject)}` : '/api/topics';
        const res = await fetch(url);
        const data = await res.json();
        setAvailableTopics(data.topics || []);
      } catch (err) {
        console.error('Failed to load topics', err);
      }
    }
    loadTopics();
    setTopic('all');
  }, [subject]);

  // Pagination & Range States
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [jumpInput, setJumpInput] = useState('');

  // Expanded explanations state
  const [expandedSolutions, setExpandedSolutions] = useState<Record<number, boolean>>({});

  const fetchQuestions = async (targetPage = page, targetPageSize = pageSize) => {
    setLoading(true);
    try {
      const offset = (targetPage - 1) * targetPageSize;
      const params = new URLSearchParams();
      if (subject !== 'all') params.append('subject', subject);
      if (topic !== 'all') params.append('topic', topic);
      if (examType !== 'all') params.append('exam_type', examType);
      if (grade !== 'all') params.append('grade', grade);
      if (search.trim()) params.append('search', search.trim());
      params.append('limit', targetPageSize.toString());
      params.append('offset', offset.toString());

      const res = await fetch(`/api/questions?${params.toString()}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchQuestions(1, pageSize);
  }, [subject, topic, examType, grade]);

  useEffect(() => {
    fetchQuestions(page, pageSize);
  }, [page, pageSize]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchQuestions(1, pageSize);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const handleJumpToQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    const qNum = parseInt(jumpInput.trim());
    if (isNaN(qNum) || qNum < 1) return;
    const targetP = Math.min(totalPages, Math.max(1, Math.ceil(qNum / pageSize)));
    setPage(targetP);
    setJumpInput('');
  };

  const toggleSolution = (id: number) => {
    setExpandedSolutions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const resetFilters = () => {
    setSubject('all');
    setTopic('all');
    setExamType('all');
    setGrade('all');
    setSearch('');
    setPage(1);
  };

  const optionLabels: Record<string, string> = {
    A: 'ক',
    B: 'খ',
    C: 'গ',
    D: 'ঘ'
  };

  const startIndex = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            প্রশ্নব্যাংক ও আর্কাইভ
          </h1>
          <p className="text-xs text-gray-500">
            বিষয়, পরীক্ষার ধরণ ও গ্রেড অনুযায়ী প্রশ্ন ও সমাধান খুঁজুন (মোট {total} টি প্রশ্ন)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/create-exam"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            এই প্রশ্ন দিয়ে পরীক্ষা তৈরি
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="প্রশ্ন, বিষয় বা সাল লিখে খুঁজুন (যেমন: মৌলিক সংখ্যা, BCS, মুক্তিযুদ্ধ)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold"
          >
            অনুসন্ধান
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-medium text-gray-600 mb-1">বিষয় (Subject)</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="all">সকল বিষয়</option>
              <option value="গণিত">গণিত (Math)</option>
              <option value="English">English</option>
              <option value="সাধারণ জ্ঞান">সাধারণ জ্ঞান (GK)</option>
              <option value="বাংলা">বাংলা (Bangla)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-600 mb-1">টপিক / অধ্যায় (Topic)</label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="all">সকল অধ্যায় ({availableTopics.length} টি ক্যাটাগরি)</option>
              {availableTopics.map(t => (
                <option key={t.topic} value={t.topic}>
                  {t.topic} ({t.count})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-600 mb-1">পরীক্ষার ধরণ (Exam Type)</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="all">সকল পরীক্ষা</option>
              <option value="BCS">বিসিএস (BCS)</option>
              <option value="Bank">ব্যাংক (Bank)</option>
              <option value="Primary">প্রাথমিক শিক্ষক (Primary)</option>
              <option value="Ministry">মন্ত্রণালয়/অধিদপ্তর (Ministry)</option>
              <option value="Non-Cadre">নন-ক্যাডার (PSC Non-Cadre)</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-600 mb-1">পদমর্যাদা / গ্রেড (Grade)</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="all">সকল গ্রেড</option>
              <option value="Grade 9">৯ম গ্রেড (১ম শ্রেণি / BCS ও সমমান)</option>
              <option value="10-13">১০ম-১৩তম গ্রেড (নন-ক্যাডার, শিক্ষক ও অফিসার)</option>
              <option value="13-16">১৩তম-১৬তম গ্রেড (অফিস সহকারী ও কম্পিউটার অপারেটর)</option>
              <option value="17-20">১৭তম-২০তম গ্রেড (সহায়ক স্টাফ)</option>
              <option value="Grade 10">Grade 10 (২য় শ্রেণি)</option>
              <option value="Grade 13">Grade 13 (৩য় শ্রেণি)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              className="w-full py-2 px-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 font-medium flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ফিল্টার রিসেট
            </button>
          </div>
        </div>
      </div>

      {/* Pagination & Range Control Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Range Display */}
        <div className="flex items-center gap-2 text-gray-600 font-medium">
          <span>প্রদর্শিত হচ্ছে:</span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg border border-emerald-200">
            প্রশ্ন {startIndex} – {endIndex}
          </span>
          <span>(মোট {total} টির মধ্যে)</span>
        </div>

        {/* Jump To Question Range Form */}
        <form onSubmit={handleJumpToQuestion} className="flex items-center gap-2">
          <div className="relative">
            <Hash className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="number"
              min="1"
              max={total}
              placeholder="প্রশ্ন নং..."
              value={jumpInput}
              onChange={(e) => setJumpInput(e.target.value)}
              className="w-24 pl-7 pr-2 py-1.5 rounded-lg border border-gray-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg border border-gray-300 transition"
          >
            যান
          </button>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-gray-500">প্রতি পেজে:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setPage(1);
              }}
              className="bg-gray-50 border border-gray-300 rounded-lg px-2 py-1 font-bold text-gray-800 outline-none"
            >
              <option value="25">২৫</option>
              <option value="50">৫০</option>
              <option value="100">১০০</option>
              <option value="200">২০০</option>
            </select>
          </div>
        </form>

        {/* Prev / Next Pagination Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40"
            title="প্রথম পেজ"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40"
            title="পূর্ববর্তী পেজ"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 font-bold text-gray-800 bg-gray-50 rounded-lg border border-gray-200">
            পেজ {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40"
            title="পরবর্তী পেজ"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 disabled:opacity-40"
            title="শেষ পেজ"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Questions Feed */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500">
          প্রশ্ন লোড হচ্ছে...
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500 space-y-2">
          <HelpCircle className="w-8 h-8 mx-auto text-gray-400" />
          <p>কোনো প্রশ্ন পাওয়া যায়নি। অন্য ফিল্টার দিয়ে চেষ্টা করুন।</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isExpanded = !!expandedSolutions[q.id];
            const globalNumber = (page - 1) * pageSize + idx + 1;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3 hover:border-emerald-200 transition"
              >
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="px-2 h-6 rounded bg-gray-100 text-gray-800 font-bold flex items-center justify-center">
                      #{globalNumber}
                    </span>
                    <span className="font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-100">
                      {q.subject}
                    </span>
                    {q.grade && (
                      <span className="font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {q.grade}
                      </span>
                    )}
                    {q.exam_type && (
                      <span className="font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                        {q.exam_type}
                      </span>
                    )}
                    {q.topic && (
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        {q.topic}
                      </span>
                    )}
                  </div>

                  {q.exam_source && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2.5 py-0.5 rounded-full border border-gray-100">
                      {q.exam_source}
                    </span>
                  )}
                </div>

                {/* Question */}
                <div className="text-gray-900 font-bold text-base leading-snug">
                  <MathText text={q.question_text} />
                </div>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'A', text: q.option_a, label: 'ক' },
                    { key: 'B', text: q.option_b, label: 'খ' },
                    { key: 'C', text: q.option_c, label: 'গ' },
                    { key: 'D', text: q.option_d, label: 'ঘ' },
                  ].map((opt) => {
                    const isRightAnswer = isExpanded && opt.key.toUpperCase() === q.correct_option.toUpperCase();
                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                          isRightAnswer
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-400'
                            : 'bg-white border-gray-200 text-gray-700'
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                            isRightAnswer
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <MathText text={opt.text} className="flex-1" />
                        {isRightAnswer && (
                          <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded">
                            সঠিক উত্তর
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Toggle Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => toggleSolution(q.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isExpanded ? 'উত্তর ও সমাধান লুকান' : 'উত্তর ও সমাধান দেখুন'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Explanation Card */}
                {isExpanded && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 space-y-1.5 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        সঠিক উত্তর: <strong className="text-emerald-700">{optionLabels[q.correct_option.toUpperCase()] || q.correct_option}</strong>
                      </span>
                    </div>
                    {q.explanation && (
                      <div className="border-t border-slate-200 pt-2.5">
                        <FormattedExplanation explanation={q.explanation} subject={q.subject} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(1)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold disabled:opacity-40"
          >
            প্রথম পেজ
          </button>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold disabled:opacity-40"
          >
            পূর্ববর্তী
          </button>

          <span className="text-xs font-bold text-gray-700 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">
            পেজ {page} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold disabled:opacity-40"
          >
            পরবর্তী
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage(totalPages)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-semibold disabled:opacity-40"
          >
            শেষ পেজ
          </button>
        </div>
      )}
    </div>
  );
}
