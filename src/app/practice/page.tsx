'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  GraduationCap, 
  Search, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  Layers, 
  Zap, 
  Sparkles,
  Award,
  Filter,
  CheckCircle,
  RotateCcw,
  FileCheck2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Pagination from '@/components/Pagination';

interface Exam {
  id: string;
  title: string;
  description: string;
  mode: string;
  subject: string;
  grade_filter: string;
  duration_minutes: number;
  total_questions: number;
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('category');
  const { user } = useAuth();

  const [exams, setExams] = useState<Exam[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const c = sessionStorage.getItem('liveexam_cache_exams_practice');
        if (c) return JSON.parse(c);
      } catch {}
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem('liveexam_cache_exams_practice');
      } catch {}
    }
    return true;
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState<'all' | '10-13' | '13-16' | 'bcs'>('all');
  const [selectedSubject, setSelectedSubject] = useState<'all' | 'গণিত' | 'English' | 'সাধারণ জ্ঞান' | 'বাংলা'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'new' | 'attended'>('all');
  const [examStatusMap, setExamStatusMap] = useState<Record<string, any>>({});
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const EXAMS_PER_PAGE = 20;

  // Restore filters from sessionStorage so practice filters remain intact across exams & tabs
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

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedGrade, selectedSubject, selectedStatus, search]);

  const categories = [
    { id: 'all', name: 'সকল সেট', icon: Layers },
    { id: '১০-১৩ গ্রেড', name: '১০ম-১৩তম গ্রেড', icon: Award },
    { id: '১৩-১৬ গ্রেড', name: '১৩তম-১৬তম গ্রেড', icon: Award },
    { id: 'বিসিএস (৯ম গ্রেড)', name: 'বিসিএস ও ১ম শ্রেণি', icon: Sparkles },
    { id: 'গণিত (Math)', name: 'গণিত স্পেশাল', icon: Zap },
    { id: 'ইংরেজি (English)', name: 'ইংরেজি গ্রামার', icon: BookOpen },
    { id: 'বাংলা (Bangla)', name: 'বাংলা সাহিত্য ও ব্যাকরণ', icon: GraduationCap },
  ];

  useEffect(() => {
    if (catParam === '10-13') setSelectedCategory('১০-১৩ গ্রেড');
    else if (catParam === '13-16') setSelectedCategory('১৩-১৬ গ্রেড');
    else if (catParam === 'bcs') setSelectedCategory('বিসিএস (৯ম গ্রেড)');
    else if (catParam === 'math') setSelectedCategory('গণিত (Math)');
    else if (catParam === 'english') setSelectedCategory('ইংরেজি (English)');
    else if (catParam === 'bangla') setSelectedCategory('বাংলা (Bangla)');
  }, [catParam]);

  useEffect(() => {
    async function loadPracticeExams() {
      try {
        const queryName = user?.display_name || user?.username || '';
        const fetches: Promise<any>[] = [fetch('/api/exams?mode=practice')];
        if (queryName) {
          fetches.push(fetch(`/api/user/submissions?userName=${encodeURIComponent(queryName)}`));
        }

        const [res, subRes] = await Promise.all(fetches);
        const data = await res.json();
        const examList = Array.isArray(data) ? data : [];
        setExams(examList);
        try {
          sessionStorage.setItem('liveexam_cache_exams_practice', JSON.stringify(examList));
        } catch {}

        if (subRes) {
          const subData = await subRes.json();
          setExamStatusMap(subData.examMap || {});
        }
      } catch (err) {
        console.error('Failed to load practice exams:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPracticeExams();
  }, [user]);

  const filteredExams = exams.filter((exam) => {
    // 1. Category match
    const matchesCategory =
      selectedCategory === 'all' ||
      (exam.description && exam.description.includes(`[${selectedCategory}]`)) ||
      (selectedCategory === '১০-১৩ গ্রেড' && (exam.grade_filter === '10-13' || exam.title.includes('১০ম-১৩তম'))) ||
      (selectedCategory === '১৩-১৬ গ্রেড' && (exam.grade_filter === '13-16' || exam.title.includes('১৩তম-১৬তম'))) ||
      (selectedCategory === 'বিসিএস (৯ম গ্রেড)' && (exam.grade_filter === 'Grade 9' || exam.title.includes('বিসিএস'))) ||
      (selectedCategory === 'গণিত (Math)' && (exam.subject === 'গণিত' || exam.title.includes('গণিত'))) ||
      (selectedCategory === 'ইংরেজি (English)' && (exam.subject === 'English' || exam.title.includes('English') || exam.title.includes('ইংরেজি'))) ||
      (selectedCategory === 'বাংলা (Bangla)' && (exam.subject === 'বাংলা' || exam.title.includes('বাংলা')));

    // 2. Grade match
    let matchesGrade = true;
    if (selectedGrade === '10-13') {
      matchesGrade = exam.grade_filter === '10-13' || exam.title.includes('১০ম-১৩তম') || exam.title.includes('১০ম') || Boolean(exam.description?.includes('10-13'));
    } else if (selectedGrade === '13-16') {
      matchesGrade = exam.grade_filter === '13-16' || exam.title.includes('১৩তম-১৬তম') || exam.title.includes('১৩-১৬') || Boolean(exam.description?.includes('13-16'));
    } else if (selectedGrade === 'bcs') {
      matchesGrade = exam.grade_filter === 'Grade 9' || exam.title.includes('বিসিএস') || Boolean(exam.description?.includes('বিসিএস'));
    }

    // 3. Subject match
    let matchesSubject = true;
    if (selectedSubject !== 'all') {
      matchesSubject = exam.subject === selectedSubject || exam.title.includes(selectedSubject);
    }

    // 4. Status match
    const isAttended = !!examStatusMap[exam.id];
    let matchesStatus = true;
    if (selectedStatus === 'new') {
      matchesStatus = !isAttended;
    } else if (selectedStatus === 'attended') {
      matchesStatus = isAttended;
    }

    // 5. Search match
    const matchesSearch =
      !search.trim() ||
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      (exam.description && exam.description.toLowerCase().includes(search.toLowerCase()));

    return matchesCategory && matchesGrade && matchesSubject && matchesStatus && matchesSearch;
  });

  // Pagination Calculations (20 exams per page)
  const totalPages = Math.max(1, Math.ceil(filteredExams.length / EXAMS_PER_PAGE));
  const startIndex = (currentPage - 1) * EXAMS_PER_PAGE;
  const paginatedExams = filteredExams.slice(startIndex, startIndex + EXAMS_PER_PAGE);

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-emerald-100">
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span>১৩,০০০+ প্রশ্নের বিশাল ভাণ্ডার থেকে সংকলিত</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              বিষয় ও গ্রেডভিত্তিক অনুশীলন সেট (Practice Sets)
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed font-medium">
              লাইভ পরীক্ষার চাপ ছাড়া নিজের গতিতে প্র্যাকটিস করুন। ১০ম-১৩তম গ্রেড, ১৩তম-১৬তম গ্রেড, বিসিএস, 
              গণিত শর্টকাট, ইংরেজি ও বাংলা সাহিত্যের ১৪০+ ক্যাটাগরিভিত্তিক সেট।
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/10 min-w-[90px]">
              <span className="text-[11px] text-emerald-200 block">মোট সেট</span>
              <span className="text-xl sm:text-2xl font-black">{exams.length}টি</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 text-center border border-white/10 min-w-[90px]">
              <span className="text-[11px] text-emerald-200 block">প্রশ্ন ব্যাংক</span>
              <span className="text-xl sm:text-2xl font-black">১৩.১k+</span>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-level Filter Box - Matching Dashboard & Exams */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-3.5">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="অনুশীলন সেটের নাম অথবা বিষয় লিখে খুঁজুন (যেমন: শতকরা, Preposition, ১০ম-১৩তম, সন্ধি)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
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
            ৩. স্ট্যাটাস ফিল্টার (অনুশীলন সম্পন্ন হয়েছে কি না):
          </span>
          <div className="flex items-center gap-1.5 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => handleStatusChange('all')}
              className={`px-3 py-1 rounded-lg font-bold transition ${
                selectedStatus === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              সকল সেট ({exams.length})
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
              <span>🆕 নতুন অনুশীলন</span>
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
              <span>পূর্বে সম্পন্ন করা ({Object.keys(examStatusMap).length})</span>
            </button>
          </div>
        </div>

        {/* Quick Category Pills */}
        <div className="pt-1 border-t border-gray-100">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            ৪. ক্যাটাগরি পিলস (Quick Topics):
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div id="practice-list-top" className="flex items-center justify-between text-xs font-bold text-gray-500 px-1 scroll-mt-20">
        <span>
          প্রদর্শিত হচ্ছে: <strong className="text-gray-900">{filteredExams.length > 0 ? `${startIndex + 1}–${Math.min(startIndex + EXAMS_PER_PAGE, filteredExams.length)}` : 0}</strong> (মোট <strong className="text-emerald-700">{filteredExams.length}টি সেট</strong>)
        </span>
        {(selectedCategory !== 'all' || selectedGrade !== 'all' || selectedSubject !== 'all' || selectedStatus !== 'all' || search) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedGrade('all');
              setSelectedSubject('all');
              setSelectedStatus('all');
              setSearch('');
            }}
            className="text-emerald-600 hover:underline font-semibold"
          >
            ফিল্টার রিসেট
          </button>
        )}
      </div>

      {/* Practice Sets Grid (Mobile-Focused Responsive Grid) */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs text-gray-500 font-medium">অনুশীলন সেটসমূহ লোড হচ্ছে...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-6 space-y-2">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto" />
          <h3 className="font-bold text-gray-800 text-base">কোনো অনুশীলন সেট পাওয়া যায়নি</h3>
          <p className="text-xs text-gray-500">অন্য কোনো ক্যাটাগরি বা ভিন্ন কিওয়ার্ড দিয়ে সার্চ করুন।</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {paginatedExams.map((exam, index) => {
              // Extract category tag from description if exists
              const catMatch = exam.description ? exam.description.match(/^\[(.*?)\]/) : null;
              const categoryBadge = catMatch ? catMatch[1] : exam.subject || 'সাধারণ';
              const cleanDescription = exam.description ? exam.description.replace(/^\[.*?\]\s*/, '') : '';
              const serialNo = startIndex + index + 1;
              const attendedInfo = examStatusMap[exam.id];

              return (
                <div
                  key={exam.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 hover:border-emerald-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-black text-[10px] flex items-center justify-center border border-gray-200 group-hover:bg-emerald-50 group-hover:border-emerald-300 group-hover:text-emerald-800 transition">
                          #{serialNo}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {categoryBadge}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        {exam.duration_minutes} মিনিট
                      </span>
                    </div>

                    {attendedInfo && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-extrabold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>দেওয়া হয়েছে • স্কোর: {attendedInfo.score}/{attendedInfo.total_questions}</span>
                      </span>
                    )}

                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 group-hover:text-emerald-700 transition leading-snug line-clamp-2">
                      {exam.title}
                    </h3>

                    {cleanDescription && (
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {cleanDescription}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-gray-500 font-semibold">
                      প্রশ্ন: <strong className="text-gray-900">{exam.total_questions || 20} টি</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {attendedInfo && (
                        <Link
                          href={`/exam/${exam.id}/result/${attendedInfo.submission_id}`}
                          className="px-2.5 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition flex items-center gap-1"
                        >
                          <FileCheck2 className="w-3 h-3 text-emerald-600" />
                          <span>ফলাফল</span>
                        </Link>
                      )}

                      <Link
                        href={`/exam/${exam.id}`}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl active:scale-95 text-white text-xs font-bold transition shadow-xs ${
                          attendedInfo
                            ? 'bg-amber-600 hover:bg-amber-700'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                      >
                        {attendedInfo ? (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>পুনরায় দিন</span>
                          </>
                        ) : (
                          <>
                            <span>অনুশীলন শুরু</span>
                            <ChevronRight className="w-3 h-3" />
                          </>
                        )}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredExams.length}
            itemsPerPage={EXAMS_PER_PAGE}
            onPageChange={setCurrentPage}
            scrollTargetId="practice-list-top"
          />
        </div>
      )}
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-gray-500">অনুশীলন সেটসমূহ লোড হচ্ছে...</div>}>
      <PracticeContent />
    </Suspense>
  );
}

