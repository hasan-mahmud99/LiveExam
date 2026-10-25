'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Trophy, 
  Clock, 
  BookOpen, 
  Play, 
  Zap, 
  Layers, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  BarChart3, 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  ChevronRight, 
  Award,
  RotateCcw,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Pagination from '@/components/Pagination';

interface Exam {
  id: string;
  title: string;
  description: string;
  mode: string;
  subject: string;
  exam_type_filter: string;
  grade_filter: string;
  duration_minutes: number;
  negative_marking: number;
  total_questions: number;
}

interface Stats {
  totalQuestions: number;
  totalExams: number;
  totalSubmissions: number;
  subjects: { subject: string; count: number }[];
  grades: { grade: string; count: number }[];
  examTypes: { exam_type: string; count: number }[];
}

export default function Home() {
  const { user, isAdmin } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'live' | 'practice'>('all');
  const [selectedGrade, setSelectedGrade] = useState<'all' | '10-13' | '13-16' | 'bcs'>('all');
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'গণিত' | 'English' | 'সাধারণ জ্ঞান' | 'বাংলা'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'attended'>('all');
  const [search, setSearch] = useState('');
  const [examStatusMap, setExamStatusMap] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const EXAMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedGrade, selectedSubject, selectedStatus, search]);

  // Quick test state
  const [quickSubject, setQuickSubject] = useState('all');
  const [quickGrade, setQuickGrade] = useState('all');
  const [quickCount, setQuickCount] = useState(15);
  const [creatingQuick, setCreatingQuick] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const queryName = user?.display_name || user?.username || '';
        const fetches: Promise<any>[] = [
          fetch('/api/exams'),
          fetch('/api/stats')
        ];
        if (queryName) {
          fetches.push(fetch(`/api/user/submissions?userName=${encodeURIComponent(queryName)}`));
        }

        const [examsRes, statsRes, subRes] = await Promise.all(fetches);
        const examsData = await examsRes.json();
        const statsData = await statsRes.json();

        setExams(Array.isArray(examsData) ? examsData : []);
        setStats(statsData);

        if (subRes) {
          const subData = await subRes.json();
          setExamStatusMap(subData.examMap || {});
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleCreateQuickExam = async () => {
    setCreatingQuick(true);
    try {
      const subjectName = quickSubject === 'all' ? 'সম্মিলিত' : quickSubject;
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `দ্রুত প্র্যাকটিস টেস্ট - ${subjectName}`,
          description: `স্বয়ংক্রিয়ভাবে জেনারেট করা ${quickCount} টি প্রশ্ন`,
          mode: 'practice',
          subject: quickSubject,
          grade_filter: quickGrade,
          duration_minutes: Math.ceil(quickCount * 0.8),
          negative_marking: 0.25,
          question_count: quickCount
        })
      });

      const newExam = await res.json();
      if (newExam && newExam.id) {
        window.location.href = `/exam/${newExam.id}`;
      }
    } catch (e) {
      alert('পরীক্ষা তৈরি করতে সমস্যা হয়েছে');
    } finally {
      setCreatingQuick(false);
    }
  };

  // Multi-level filtering just like in Dashboard
  const filteredExams = exams.filter((exam) => {
    // 0. Mode match
    if (activeTab === 'live' && exam.mode !== 'live') return false;
    if (activeTab === 'practice' && exam.mode !== 'practice') return false;

    // 1. Grade match
    let matchesGrade = true;
    if (selectedGrade === '10-13') {
      matchesGrade = exam.grade_filter === '10-13' || exam.title.includes('১০ম-১৩তম') || exam.title.includes('১০ম') || Boolean(exam.description?.includes('10-13'));
    } else if (selectedGrade === '13-16') {
      matchesGrade = exam.grade_filter === '13-16' || exam.title.includes('১৩তম-১৬তম') || exam.title.includes('১৩-১৬') || Boolean(exam.description?.includes('13-16'));
    } else if (selectedGrade === 'bcs') {
      matchesGrade = exam.grade_filter === 'Grade 9' || exam.title.includes('বিসিএস') || Boolean(exam.description?.includes('বিসিএস'));
    }

    // 2. Subject match
    let matchesSubject = true;
    if (selectedSubject !== 'all') {
      matchesSubject = exam.subject === selectedSubject || exam.title.includes(selectedSubject);
    }

    // 3. Status match
    const isAttended = !!examStatusMap[exam.id];
    let matchesStatus = true;
    if (selectedStatus === 'new') {
      matchesStatus = !isAttended;
    } else if (selectedStatus === 'attended') {
      matchesStatus = isAttended;
    }

    // 4. Search match
    const matchesSearch =
      !search.trim() ||
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      (exam.description && exam.description.toLowerCase().includes(search.toLowerCase()));

    return matchesGrade && matchesSubject && matchesStatus && matchesSearch;
  });

  const liveExams = exams.filter((e) => e.mode === 'live');
  const practiceExams = exams.filter((e) => e.mode === 'practice');
  const liveCount = liveExams.length;
  const practiceCount = practiceExams.length;

  // Pagination Calculations (20 exams per page)
  const totalPages = Math.max(1, Math.ceil(filteredExams.length / EXAMS_PER_PAGE));
  const startIndex = (currentPage - 1) * EXAMS_PER_PAGE;
  const paginatedExams = filteredExams.slice(startIndex, startIndex + EXAMS_PER_PAGE);

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/25 border border-emerald-400/30 text-emerald-200 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              লাইভ এমসিকিউ স্টাডি প্ল্যাটফর্ম
            </span>
            {user && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-white/15 text-emerald-100 font-medium">
                স্বাগতম, {user.display_name}!
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            বিসিএস, ব্যাংক ও সরকারি চাকরির <br />
            <span className="text-emerald-300">রিয়েল-টাইম লাইভ পরীক্ষা ও প্র্যাকটিস</span>
          </h1>

          <p className="text-emerald-100/90 text-xs sm:text-sm leading-relaxed max-w-2xl">
            খায়রুলস বেসিক ম্যাথ, মাস্টার ইংলিশ, শাওন স্যারের অন্বেষণ বাংলা এবং ১০ম-৫০তম বিসিএস জিকে থেকে 
            <strong> ১৩,০০০+ প্রশ্ন সংবলিত সম্পূর্ণ প্রশ্নব্যাংক</strong>। ১০ম-১৩তম গ্রেড, ১৩তম-১৬তম গ্রেড ও বিসিএস প্রস্তুতিতে বন্ধুদের সাথে প্রতিযোগিতা করুন।
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <a
              href="#exams-section"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-black text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition active:scale-95"
            >
              পরীক্ষা দিন
            </a>
            <Link
              href="/practice"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm border border-emerald-400/40 transition active:scale-95 flex items-center gap-1.5 shadow-xs"
            >
              <GraduationCap className="w-4 h-4" />
              <span>অনুশীলন সেটসমূহ (১৪০+ সেট)</span>
            </Link>
            <Link
              href="/questions"
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm border border-white/20 transition active:scale-95"
            >
              প্রশ্নব্যাংক ({stats?.totalQuestions || 0})
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{stats?.totalQuestions ?? 0}</div>
            <div className="text-[11px] sm:text-xs text-gray-500 font-medium">মোট প্রশ্নব্যাংক</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{practiceExams.length}টি</div>
            <div className="text-[11px] sm:text-xs text-gray-500 font-medium">অনুশীলন সেট</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Play className="w-5 h-5 fill-rose-600 text-rose-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{liveExams.length}টি</div>
            <div className="text-[11px] sm:text-xs text-gray-500 font-medium">লাইভ মডেল টেস্ট</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Trophy className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900">{stats?.totalSubmissions ?? 0}</div>
            <div className="text-[11px] sm:text-xs text-gray-500 font-medium">অংশগ্রহণ সংখ্যা</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left 2 Cols: Active Live Exams & Practice Sets */}
        <div id="exams-section" className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <Play className="w-5 h-5 text-emerald-600 fill-emerald-600" />
                পরীক্ষা ও মডেল টেস্টসমূহ
              </h2>
              <p className="text-xs text-gray-500">লাইভ পরীক্ষা অথবা সেলফ প্র্যাকটিস সেট বেছে নিন</p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                সকল ({exams.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('live')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'live'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔴 লাইভ ({liveCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('practice')}
                className={`px-3 py-1.5 rounded-lg transition ${
                  activeTab === 'practice'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📖 অনুশীলন ({practiceCount})
              </button>
            </div>
          </div>

          {/* Multi-level Filter Box - Identical to Dashboard */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-xs space-y-3.5">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="পরীক্ষার নাম বা অধ্যায় লিখে সার্চ করুন..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
              />
            </div>

            {/* Level 1: Grade Filters (Main category) */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                ১. গ্রেড নির্বাচন (Grade Selection):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {[
                  { id: 'all', label: 'সকল গ্রেড' },
                  { id: '10-13', label: '🎯 ১০ম-১৩তম গ্রেড' },
                  { id: '13-16', label: '🏢 ১৩তম-১৬তম গ্রেড' },
                  { id: 'bcs', label: '🎓 বিসিএস ও ৯ম গ্রেড' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrade(g.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                      selectedGrade === g.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level 2: Subject Sub-Filters (English, GK, Math, Bangla) */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                ২. বিষয়ভিত্তিক সাব-ফিল্টার (Subject Sub-Filter):
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                {[
                  { id: 'all', label: 'সকল বিষয়' },
                  { id: 'গণিত', label: 'গণিত (Math)' },
                  { id: 'English', label: 'English' },
                  { id: 'সাধারণ জ্ঞান', label: 'সাধারণ জ্ঞান (GK)' },
                  { id: 'বাংলা', label: 'বাংলা (Bangla)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSubject(s.id as any)}
                    className={`px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition active:scale-95 text-xs ${
                      selectedSubject === s.id
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Level 3: Status Filter (All vs New vs Attended) */}
            <div className="space-y-1 pt-1 border-t border-gray-100">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                ৩. স্ট্যাটাস ফিল্টার (পরীক্ষা দেওয়া হয়েছে কি না):
              </span>
              <div className="flex items-center gap-1.5 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition ${
                    selectedStatus === 'all'
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  সকল পরীক্ষা ({exams.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('new')}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    selectedStatus === 'new'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  <span>🆕 নতুন পরীক্ষা</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('attended')}
                  className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                    selectedStatus === 'attended'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>পূর্বে দেওয়া পরীক্ষা ({Object.keys(examStatusMap).length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Summary Header */}
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 px-1">
            <span>
              প্রদর্শিত হচ্ছে: <strong className="text-gray-900">{filteredExams.length > 0 ? `${startIndex + 1}–${Math.min(startIndex + EXAMS_PER_PAGE, filteredExams.length)}` : 0}</strong> (মোট <strong className="text-emerald-700">{filteredExams.length}টি পরীক্ষা</strong>)
            </span>
            {(selectedGrade !== 'all' || selectedSubject !== 'all' || selectedStatus !== 'all' || activeTab !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSelectedGrade('all');
                  setSelectedSubject('all');
                  setSelectedStatus('all');
                  setSearch('');
                }}
                className="text-emerald-700 hover:underline font-semibold"
              >
                ফিল্টার রিসেট করুন
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 text-gray-500">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              লোড হচ্ছে...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 space-y-3">
              <BookOpen className="w-10 h-10 text-gray-400 mx-auto" />
              <p className="text-gray-600 font-medium">কোনো পরীক্ষা পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedExams.map((exam, index) => {
                const serialNo = startIndex + index + 1;
                const attendedInfo = examStatusMap[exam.id];

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Serial Number Badge */}
                        <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:text-emerald-800 transition">
                          #{serialNo}
                        </div>

                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {attendedInfo ? (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-extrabold text-[10px]">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>দেওয়া হয়েছে • স্কোর: {attendedInfo.score}/{attendedInfo.total_questions}</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
                                🆕 নতুন পরীক্ষা
                              </span>
                            )}

                            {exam.mode === 'live' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                                লাইভ মেগা টেস্ট
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                অনুশীলন সেট
                              </span>
                            )}

                            {exam.grade_filter && exam.grade_filter !== 'all' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                {exam.grade_filter === '10-13' ? '১০ম-১৩তম গ্রেড' : exam.grade_filter === '13-16' ? '১৩তম-১৬তম গ্রেড' : exam.grade_filter}
                              </span>
                            )}

                            {exam.subject && exam.subject !== 'all' && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-700">
                                {exam.subject}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
                            {exam.title}
                          </h3>
                          {exam.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{exam.description.replace(/^\[.*?\]\s*/, '')}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 pt-1 font-medium">
                            <span className="flex items-center gap-1 text-gray-700">
                              <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                              {exam.total_questions} টি প্রশ্ন
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-gray-400" />
                              {exam.duration_minutes} মিনিট
                            </span>
                            <span>নেগেটিভ মার্ক: -{exam.negative_marking}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                        {attendedInfo && (
                          <Link
                            href={`/exam/${exam.id}/result/${attendedInfo.submission_id}`}
                            className="px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center justify-center gap-1"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ফলাফল</span>
                          </Link>
                        )}

                        <Link
                          href={`/exam/${exam.id}/leaderboard`}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                        >
                          <Trophy className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden xs:inline">লিডারবোর্ড</span>
                        </Link>
                        <Link
                          href={`/exam/${exam.id}`}
                          className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition ${
                            attendedInfo
                              ? 'bg-amber-600 hover:bg-amber-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {attendedInfo ? (
                            <>
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>পুনরায় দিন</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5 fill-white" />
                              <span>পরীক্ষা দিন</span>
                            </>
                          )}
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bottom Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredExams.length}
                itemsPerPage={EXAMS_PER_PAGE}
                onPageChange={setCurrentPage}
                scrollTargetId="exams-section"
              />
            </div>
          )}
        </div>

        {/* Right Col: Instant Quick Test & Subject Breakdown */}
        <div className="space-y-6">
          {/* Quick Exam Box with 10-13 & 13-16 grade options */}
          <div className="bg-gradient-to-br from-white to-emerald-50/50 rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-sm">তাত্ক্ষণিক কুইক টেস্ট</h3>
                <p className="text-[11px] text-gray-500">বিষয় ও গ্রেড সিলেক্ট করে সাথে সাথে পরীক্ষা দিন</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">বিষয় নির্বাচন</label>
                <select
                  value={quickSubject}
                  onChange={(e) => setQuickSubject(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">সকল বিষয় (মিশ্রিত প্রশ্ন)</option>
                  <option value="গণিত">গণিত (Khairul's Math)</option>
                  <option value="English">English (Master English)</option>
                  <option value="সাধারণ জ্ঞান">সাধারণ জ্ঞান (BCS GK)</option>
                  <option value="বাংলা">বাংলা ভাষা ও সাহিত্য (অন্বেষণ)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">গ্রেড নির্বাচন</label>
                <select
                  value={quickGrade}
                  onChange={(e) => setQuickGrade(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="all">সকল গ্রেড</option>
                  <option value="Grade 9">৯ম গ্রেড (১ম শ্রেণি / BCS ও সমমান)</option>
                  <option value="10-13">১০ম-১৩তম গ্রেড (নন-ক্যাডার ও শিক্ষক)</option>
                  <option value="13-16">১৩তম-১৬তম গ্রেড (অফিস সহকারী ও অপারেটর)</option>
                  <option value="17-20">১৭তম-২০তম গ্রেড (সহায়ক স্টাফ)</option>
                  <option value="Grade 10">Grade 10 (২য় শ্রেণি)</option>
                  <option value="Grade 13">Grade 13 (৩য় শ্রেণি)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">প্রশ্ন সংখ্যা</label>
                <div className="grid grid-cols-3 gap-2">
                  {[10, 15, 25].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuickCount(num)}
                      className={`py-2 rounded-xl border text-xs font-bold transition ${
                        quickCount === num
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {num} টি
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateQuickExam}
                disabled={creatingQuick}
                className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                {creatingQuick ? 'টেস্ট তৈরি হচ্ছে...' : 'টেস্ট শুরু করুন'}
              </button>
            </div>
          </div>

          {/* Practice Sets Quick Link Box */}
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-700" />
              <h3 className="font-extrabold text-sm text-emerald-950">১৪০+ অনুশীলন সেট লাইব্রেরি</h3>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed font-medium">
              ১০ম-১৩তম গ্রেড, ১৩তম-১৬তম গ্রেড, বিসিএস, পাটিগণিত, প্রিপজিশন ও বাংলা ব্যাকরণের সম্পূর্ণ ক্যাটাগরিভিত্তিক সেট তৈরি আছে।
            </p>
            <Link
              href="/practice"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline pt-1"
            >
              <span>অনুশীলন সেট ব্রাউজ করুন</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Subject Breakdown Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              বিষয়ভিত্তিক প্রশ্ন বিশ্লেষণ
            </h3>
            <div className="space-y-2 text-xs">
              {stats?.subjects?.map((sub) => (
                <Link
                  key={sub.subject}
                  href={`/questions?subject=${encodeURIComponent(sub.subject)}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50 transition border border-transparent hover:border-emerald-100 group"
                >
                  <span className="font-medium text-gray-700 group-hover:text-emerald-800">
                    {sub.subject}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 group-hover:bg-emerald-200 text-gray-600 group-hover:text-emerald-800 text-[11px] font-bold">
                    {sub.count} টি
                  </span>
                </Link>
              ))}
            </div>

            <Link
              href="/questions"
              className="block text-center pt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              সম্পূর্ণ প্রশ্নব্যাংক দেখুন &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
