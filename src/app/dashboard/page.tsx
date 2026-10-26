'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Trophy, 
  Clock, 
  BookOpen, 
  Play, 
  Zap, 
  Layers, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  ArrowRight, 
  GraduationCap, 
  Sparkles, 
  ChevronRight, 
  Award, 
  PlusCircle, 
  RotateCcw,
  CheckCircle,
  FileCheck2,
  Calendar,
  Filter,
  FileText
} from 'lucide-react';
import Pagination from '@/components/Pagination';

interface Stats {
  totalQuestions: number;
  totalExams: number;
  totalSubmissions: number;
  subjects: { subject: string; count: number }[];
}

interface Exam {
  id: string;
  title: string;
  description: string;
  mode: string;
  subject: string;
  grade_filter: string;
  duration_minutes: number;
  negative_marking: number;
  total_questions: number;
}

interface Submission {
  id: string;
  exam_id: string;
  exam_title: string;
  exam_mode: string;
  grade_filter: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  negative_deduction: number;
  time_taken_seconds: number;
  submitted_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [stats, setStats] = useState<Stats | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const c = sessionStorage.getItem('liveexam_cache_stats');
        if (c) return JSON.parse(c);
      } catch {}
    }
    return null;
  });
  const [exams, setExams] = useState<Exam[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const c = sessionStorage.getItem('liveexam_cache_exams');
        if (c) return JSON.parse(c);
      } catch {}
    }
    return [];
  });
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [examStatusMap, setExamStatusMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem('liveexam_cache_exams');
      } catch {}
    }
    return true;
  });

  // Filter States
  const [mainTab, setMainTab] = useState<'all' | 'history'>('all');
  const [selectedGrade, setSelectedGrade] = useState<'all' | '10-13' | '13-16' | 'bcs'>('all');
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'গণিত' | 'English' | 'সাধারণ জ্ঞান' | 'বাংলা'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'attended'>('all');
  const [search, setSearch] = useState('');

  // Restore filters from sessionStorage
  useEffect(() => {
    try {
      const g = sessionStorage.getItem('liveexam_filter_grade');
      if (g) setSelectedGrade(g as any);
      const s = sessionStorage.getItem('liveexam_filter_subject');
      if (s) setSelectedSubject(s as any);
      const st = sessionStorage.getItem('liveexam_filter_status');
      if (st) setSelectedStatus(st as any);
    } catch {}
  }, []);

  const handleGradeChange = (val: 'all' | '10-13' | '13-16' | 'bcs') => {
    setSelectedGrade(val);
    try { sessionStorage.setItem('liveexam_filter_grade', val); } catch {}
  };

  const handleSubjectChange = (val: 'all' | 'গণিত' | 'English' | 'সাধারণ জ্ঞান' | 'বাংলা') => {
    setSelectedSubject(val);
    try { sessionStorage.setItem('liveexam_filter_subject', val); } catch {}
  };

  const handleStatusChange = (val: 'all' | 'new' | 'attended') => {
    setSelectedStatus(val);
    try { sessionStorage.setItem('liveexam_filter_status', val); } catch {}
  };

  // Pagination State - Max 20 exams per page
  const [currentPage, setCurrentPage] = useState(1);
  const EXAMS_PER_PAGE = 20;

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedGrade, selectedSubject, selectedStatus, search, mainTab]);

  // Quick test state - Top placed
  const [quickGrade, setQuickGrade] = useState('10-13');
  const [quickSubject, setQuickSubject] = useState('all');
  const [quickCount, setQuickCount] = useState(15);
  const [creatingQuick, setCreatingQuick] = useState(false);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const queryName = user?.display_name || user?.username || '';
        const [statsRes, examsRes, subRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/exams'),
          fetch(`/api/user/submissions?userName=${encodeURIComponent(queryName)}`)
        ]);

        const sData = await statsRes.json();
        const eData = await examsRes.json();
        const subData = await subRes.json();

        setStats(sData);
        const examList = Array.isArray(eData) ? eData : [];
        setExams(examList);
        setUserSubmissions(subData.submissions || []);
        setExamStatusMap(subData.examMap || {});

        try {
          if (sData) sessionStorage.setItem('liveexam_cache_stats', JSON.stringify(sData));
          sessionStorage.setItem('liveexam_cache_exams', JSON.stringify(examList));
        } catch {}
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      loadDashboardData();
    }
  }, [user, authLoading]);

  const handleCreateQuickExam = async () => {
    setCreatingQuick(true);
    try {
      const subjectName = quickSubject === 'all' ? 'সম্মিলিত' : quickSubject;
      const gradeLabel = quickGrade === '10-13' ? '১০-১৩তম গ্রেড' : quickGrade === '13-16' ? '১৩-১৬তম গ্রেড' : quickGrade === 'bcs' ? 'বিসিএস' : 'সকল গ্রেড';
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `কুইক টেস্ট: ${subjectName} (${gradeLabel})`,
          description: `স্বয়ংক্রিয়ভাবে তৈরি করা ${quickCount} টি প্রশ্ন`,
          mode: 'practice',
          subject: quickSubject,
          grade_filter: quickGrade === 'bcs' ? 'Grade 9' : quickGrade,
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

  const displayName = user?.display_name || 'পরীক্ষার্থী';
  const roleName = user?.role === 'ADMIN' ? 'এডমিন (Full Access)' : 'পরীক্ষার্থী (Study Group)';
  const avatarIcon = user?.username === 'admin' ? '👑' : user?.username === 'kona' ? '👩' : '👨';

  // Multi-level filtering of exams
  const filteredExams = exams.filter((exam) => {
    // 1. Grade Match
    let matchesGrade = true;
    if (selectedGrade === '10-13') {
      matchesGrade = exam.grade_filter === '10-13' || exam.title.includes('১০ম-১৩তম') || exam.title.includes('১০ম') || Boolean(exam.description?.includes('10-13'));
    } else if (selectedGrade === '13-16') {
      matchesGrade = exam.grade_filter === '13-16' || exam.title.includes('১৩তম-১৬তম') || exam.title.includes('১৩-১৬') || Boolean(exam.description?.includes('13-16'));
    } else if (selectedGrade === 'bcs') {
      matchesGrade = exam.grade_filter === 'Grade 9' || exam.title.includes('বিসিএস') || Boolean(exam.description?.includes('বিসিএস'));
    }

    // 2. Subject Match
    let matchesSubject = true;
    if (selectedSubject !== 'all') {
      matchesSubject = exam.subject === selectedSubject || exam.title.includes(selectedSubject);
    }

    // 3. Status Match (New vs Attended)
    const isAttended = !!examStatusMap[exam.id];
    let matchesStatus = true;
    if (selectedStatus === 'new') {
      matchesStatus = !isAttended;
    } else if (selectedStatus === 'attended') {
      matchesStatus = isAttended;
    }

    // 4. Search text
    const matchesSearch =
      !search.trim() ||
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      (exam.description && exam.description.toLowerCase().includes(search.toLowerCase()));

    return matchesGrade && matchesSubject && matchesStatus && matchesSearch;
  });

  // Pagination Calculations (20 exams per page)
  const totalPages = Math.max(1, Math.ceil(filteredExams.length / EXAMS_PER_PAGE));
  const startIndex = (currentPage - 1) * EXAMS_PER_PAGE;
  const paginatedExams = filteredExams.slice(startIndex, startIndex + EXAMS_PER_PAGE);

  return (
    <div className="space-y-6 pb-20">
      {/* 1. TOP HERO GREETING BAR */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl shadow-inner shrink-0">
              {avatarIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/25 border border-emerald-300/30 text-emerald-100">
                  {roleName}
                </span>
                <span className="text-[11px] text-emerald-200 hidden xs:inline">• স্টাডি গ্রুপ ড্যাশবোর্ড</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">
                স্বাগতম, {displayName}!
              </h1>
              <p className="text-[11px] sm:text-xs text-emerald-100/80 font-medium">
                ১২,৮৯৭টি প্রশ্ন ও ১৬৭টি পরীক্ষার মধ্যে আপনার আজকের প্রস্তুতি শুরু করুন।
              </p>
            </div>
          </div>

          {/* Quick Counter Badges */}
          <div className="flex gap-2">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-center border border-white/10 min-w-[75px]">
              <span className="text-[10px] text-emerald-200 block">দেওয়া পরীক্ষা</span>
              <span className="text-lg sm:text-xl font-black">{userSubmissions.length}টি</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 text-center border border-white/10 min-w-[75px]">
              <span className="text-[10px] text-emerald-200 block">মোট পরীক্ষা</span>
              <span className="text-lg sm:text-xl font-black">{exams.length}টি</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TOP PROMINENT QUICK TEST BAR (Right near top as requested) */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-gray-900">
              ⚡ তাত্ক্ষণিক কুইক টেস্ট (Instant 1-Click Test)
            </h2>
          </div>
          <span className="text-[11px] text-gray-500 font-semibold hidden sm:inline">
            গ্রেড ও বিষয় নির্ধারণ করে এখনই পরীক্ষা দিন
          </span>
        </div>

        {/* 1-Row Mobile-Friendly Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Grade Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1">গ্রেড নির্বাচন</label>
            <select
              value={quickGrade}
              onChange={(e) => setQuickGrade(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="10-13">১০ম-১৩তম গ্রেড (নন-ক্যাডার/শিক্ষক)</option>
              <option value="13-16">১৩তম-১৬তম গ্রেড (সহকারী/অপারেটর)</option>
              <option value="bcs">বিসিএস ও ১ম শ্রেণি (৯ম গ্রেড)</option>
              <option value="all">সকল গ্রেড মিশ্রিত</option>
            </select>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1">বিষয় নির্বাচন</label>
            <select
              value={quickSubject}
              onChange={(e) => setQuickSubject(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl px-2.5 py-2 font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">সকল বিষয় (মিশ্রিত প্রশ্ন)</option>
              <option value="গণিত">গণিত (Math)</option>
              <option value="English">English</option>
              <option value="সাধারণ জ্ঞান">সাধারণ জ্ঞান (GK)</option>
              <option value="বাংলা">বাংলা (Bangla)</option>
            </select>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-[10px] font-bold text-gray-600 mb-1">প্রশ্ন সংখ্যা</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[10, 15, 25].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuickCount(n)}
                  className={`py-2 rounded-xl border text-[11px] font-bold transition ${
                    quickCount === n
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {n} টি
                </button>
              ))}
            </div>
          </div>

          {/* Start Test Button */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleCreateQuickExam}
              disabled={creatingQuick}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black rounded-xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{creatingQuick ? 'তৈরি হচ্ছে...' : 'কুইক টেস্ট শুরু'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD TABS: "সকল পরীক্ষা ব্রাউজার" vs "আমার পূর্বের পরীক্ষার ফলাফল" */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          type="button"
          onClick={() => setMainTab('all')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
            mainTab === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Play className="w-4 h-4" />
          <span>পরীক্ষা ও অনুশীলন সেটসমূহ ({exams.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMainTab('history')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition ${
            mainTab === 'history'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>আমার পূর্বের পরীক্ষাসমূহ ({userSubmissions.length})</span>
        </button>
      </div>

      {/* TAB 1: ALL EXAMS WITH MULTI-LEVEL FILTERING */}
      {mainTab === 'all' && (
        <div className="space-y-4">
          {/* Multi-level Filter Box */}
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
                    onClick={() => handleGradeChange(g.id as any)}
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
                    onClick={() => handleSubjectChange(s.id as any)}
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
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleStatusChange('all')}
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
                  onClick={() => handleStatusChange('new')}
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
                  onClick={() => handleStatusChange('attended')}
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
          <div id="exams-list-container" className="flex items-center justify-between text-xs font-bold text-gray-500 px-1 scroll-mt-20">
            <span>
              প্রদর্শিত হচ্ছে: <strong className="text-gray-900">{filteredExams.length > 0 ? `${startIndex + 1}–${Math.min(startIndex + EXAMS_PER_PAGE, filteredExams.length)}` : 0}</strong> (মোট <strong className="text-emerald-700">{filteredExams.length}টি পরীক্ষা</strong>)
            </span>
            {(selectedGrade !== 'all' || selectedSubject !== 'all' || selectedStatus !== 'all' || search) && (
              <button
                type="button"
                onClick={() => {
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

          {/* Exam Cards Grid */}
          {loading ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 text-gray-500">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              পরীক্ষাসমূহ লোড হচ্ছে...
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-6 space-y-2">
              <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
              <h3 className="font-bold text-gray-800 text-base">কোনো পরীক্ষা পাওয়া যায়নি</h3>
              <p className="text-xs text-gray-500">অন্য কোনো ফিল্টার বা কিওয়ার্ড নির্বাচন করুন।</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedExams.map((exam, index) => {
                const attendedInfo = examStatusMap[exam.id];
                const serialNo = startIndex + index + 1;

                return (
                  <div
                    key={exam.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-emerald-300 transition-all shadow-xs hover:shadow-md group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Serial Number Badge */}
                      <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-black text-xs flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:text-emerald-800 transition">
                        #{serialNo}
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                          {attendedInfo ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 font-extrabold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>দেওয়া হয়েছে • স্কোর: {attendedInfo.score}/{attendedInfo.total_questions}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              🆕 নতুন পরীক্ষা
                            </span>
                          )}

                          {exam.grade_filter && exam.grade_filter !== 'all' && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                              {exam.grade_filter === '10-13' ? '১০ম-১৩তম গ্রেড' : exam.grade_filter === '13-16' ? '১৩তম-১৬তম গ্রেড' : exam.grade_filter}
                            </span>
                          )}

                          {exam.subject && exam.subject !== 'all' && (
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold">
                              {exam.subject}
                            </span>
                          )}

                          <span className="text-gray-400 font-normal">
                            {exam.mode === 'live' ? '🔴 লাইভ টেস্ট' : '📖 প্র্যাকটিস'}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 group-hover:text-emerald-700 transition leading-snug">
                          {exam.title}
                        </h3>

                        <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                          <span>প্রশ্ন: <strong className="text-gray-800">{exam.total_questions} টি</strong></span>
                          <span>•</span>
                          <span>সময়সীমা: <strong className="text-gray-800">{exam.duration_minutes} মিনিট</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: If attended, can View Result AND Retake Exam */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
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
                        className="px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden xs:inline">র‌্যাঙ্ক</span>
                      </Link>

                      <Link
                        href={`/exam/${exam.id}`}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95 ${
                          attendedInfo
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        }`}
                      >
                        {attendedInfo ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>পুনরায় দিন (Retake)</span>
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
                );
              })}
            </div>
          )}

          {/* Bottom Pagination Controls */}
          {!loading && filteredExams.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredExams.length}
              itemsPerPage={EXAMS_PER_PAGE}
              onPageChange={setCurrentPage}
              scrollTargetId="exams-list-container"
            />
          )}
        </div>
      )}

      {/* TAB 2: MY ATTENDED EXAM HISTORY & PERFORMANCE */}
      {mainTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-xs space-y-2">
            <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <span>আমার সম্পন্নকৃত পরীক্ষাসমূহ ({userSubmissions.length}টি পরীক্ষা)</span>
            </h3>
            <p className="text-xs text-gray-500">
              আপনার অতীতের সকল পরীক্ষার ফলাফল, প্রাপ্ত নম্বর ও বিস্তারিত সমাধান দেখুন অথবা পুনরায় পরীক্ষা দিন।
            </p>
          </div>

          {userSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 p-6 space-y-3">
              <FileText className="w-12 h-12 text-gray-300 mx-auto" />
              <h4 className="font-bold text-gray-800 text-base">আপনি এখনো কোনো পরীক্ষা সম্পন্ন করেননি</h4>
              <p className="text-xs text-gray-500">যে কোনো পরীক্ষা শুরু করুন, ফলাফল স্বয়ংক্রিয়ভাবে এখানে জমা হবে।</p>
              <button
                type="button"
                onClick={() => setMainTab('all')}
                className="px-5 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs shadow hover:bg-emerald-700 transition"
              >
                পরীক্ষাসমূহ দেখুন
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {userSubmissions.map((sub) => {
                const percentage = Math.round((sub.score / sub.total_questions) * 100);
                const isPass = percentage >= 40;

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                        <span className={`px-2 py-0.5 rounded-full ${isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {isPass ? 'উত্তীর্ণ' : 'অনুত্তীর্ণ'} ({percentage}%)
                        </span>
                        {sub.grade_filter && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            {sub.grade_filter}
                          </span>
                        )}
                        <span className="text-gray-400 font-medium">
                          তারিখ: {new Date(sub.submitted_at).toLocaleDateString('bn-BD')}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-base text-gray-900 truncate">
                        {sub.exam_title}
                      </h4>

                      {/* Performance breakdown */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <span className="font-bold text-emerald-700">
                          স্কোর: {sub.score} / {sub.total_questions}
                        </span>
                        <span>•</span>
                        <span className="text-gray-600">সঠিক: {sub.correct_count}টি</span>
                        <span>•</span>
                        <span className="text-rose-600">ভুল: {sub.wrong_count}টি</span>
                        <span>•</span>
                        <span className="text-gray-500">সময়: {Math.round(sub.time_taken_seconds / 60)} মিনিট</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                      <Link
                        href={`/exam/${sub.exam_id}/result/${sub.id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition"
                      >
                        বিস্তারিত সমাধান
                      </Link>

                      <Link
                        href={`/exam/${sub.exam_id}`}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition shadow-xs flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>পুনরায় দিন</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
