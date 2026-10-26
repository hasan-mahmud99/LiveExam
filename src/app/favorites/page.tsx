'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  BookOpen, 
  Search, 
  Trash2, 
  Play, 
  Sparkles, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Layers, 
  ArrowLeft 
} from 'lucide-react';
import { useFavorites, FavoriteQuestion } from '@/context/FavoritesContext';
import MathText from '@/components/MathText';
import FormattedExplanation from '@/components/FormattedExplanation';
import Pagination from '@/components/Pagination';

const SUBJECTS = ['all', 'বাংলা', 'English', 'গণিত', 'সাধারণ জ্ঞান'];
const GRADES = [
  { id: 'all', name: 'সকল গ্রেড' },
  { id: 'bcs', name: 'BCS / ৯ম-১০ম গ্রেড' },
  { id: '10-13', name: '১০ম-১৩তম গ্রেড' },
  { id: '13-16', name: '১৩-১৬তম গ্রেড' },
];

const ITEMS_PER_PAGE = 20;

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, favoritesCount, removeFavorite, clearFavorites } = useFavorites();

  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [revealedAnswers, setRevealedAnswers] = useState<Record<number, boolean>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Toggle reveal answer
  const toggleRevealAnswer = (id: number) => {
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle explanation
  const toggleExplanation = (id: number) => {
    setExpandedExplanations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter questions
  const filteredQuestions = useMemo(() => {
    return favorites.filter((q) => {
      // Subject filter
      if (selectedSubject !== 'all') {
        const qSub = (q.subject || '').toLowerCase();
        const selSub = selectedSubject.toLowerCase();
        if (selSub === 'english' && !qSub.includes('english') && !qSub.includes('ইংরেজি')) return false;
        if (selSub === 'বাংলা' && !qSub.includes('বাংলা') && !qSub.includes('bangla')) return false;
        if (selSub === 'গণিত' && !qSub.includes('গণিত') && !qSub.includes('math')) return false;
        if (selSub === 'সাধারণ জ্ঞান' && !qSub.includes('সাধারণ জ্ঞান') && !qSub.includes('gk') && !qSub.includes('general knowledge')) return false;
      }

      // Grade filter
      if (selectedGrade !== 'all') {
        const qGrade = (q.grade || '').toLowerCase();
        if (selectedGrade === 'bcs' && !qGrade.includes('bcs') && !qGrade.includes('grade 9') && !qGrade.includes('grade 10')) return false;
        if (selectedGrade === '10-13' && !qGrade.includes('10-13') && !qGrade.includes('10') && !qGrade.includes('11') && !qGrade.includes('12') && !qGrade.includes('13')) return false;
        if (selectedGrade === '13-16' && !qGrade.includes('13-16') && !qGrade.includes('14') && !qGrade.includes('15') && !qGrade.includes('16')) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase();
        const textMatch = (q.question_text || '').toLowerCase().includes(term);
        const explMatch = (q.explanation || '').toLowerCase().includes(term);
        const topicMatch = (q.topic || '').toLowerCase().includes(term);
        if (!textMatch && !explMatch && !topicMatch) return false;
      }

      return true;
    });
  }, [favorites, selectedSubject, selectedGrade, searchQuery]);

  // Paginated slice
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const displayedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);

  const optionLabels: Record<string, string> = {
    A: 'ক',
    B: 'খ',
    C: 'গ',
    D: 'ঘ',
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-rose-600 text-white rounded-3xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>বুকমার্ক ও সেলফ-রিভিশন</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              আমার প্রিয় প্রশ্নসমূহ
            </h1>
            <p className="text-rose-100 text-xs sm:text-sm">
              পরীক্ষা বা প্রশ্নব্যাংক থেকে আপনার সেভ করা মোট {favoritesCount} টি গুরুত্বপূর্ণ প্রশ্ন।
            </p>
          </div>

          {favoritesCount > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm('আপনি কি নিশ্চিত যে সকল প্রিয় প্রশ্ন তালিকা থেকে মুছে ফেলতে চান?')) {
                  clearFavorites();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition active:scale-95"
            >
              <Trash2 className="w-4 h-4" />
              <span>সকল ক্লিয়ার করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="প্রশ্ন বা ব্যাখ্যার মধ্যে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        {/* Multi-Level Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-gray-100">
          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              বিষয় ফিল্টার:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECTS.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => {
                    setSelectedSubject(sub);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedSubject === sub
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {sub === 'all' ? 'সকল বিষয়' : sub}
                </button>
              ))}
            </div>
          </div>

          {/* Grade Filter */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
              গ্রেড ফিল্টার:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    setSelectedGrade(g.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    selectedGrade === g.id
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {favorites.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center max-w-lg mx-auto space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <Heart className="w-8 h-8 stroke-[1.5]" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">কোনো প্রিয় প্রশ্ন সেভ করা নেই</h2>
          <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
            পরীক্ষা দেওয়ার সময় বা প্রশ্নব্যাংক পড়ার সময় যেকোনো প্রশ্নের পাশে থাকা ছোট ❤️ (লাভ) বাটনে ক্লিক করে প্রিয় প্রশ্ন তালিকায় যুক্ত করতে পারেন।
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <Link
              href="/questions"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>প্রশ্নব্যাংক ব্রাউজ করুন</span>
            </Link>
            <Link
              href="/practice"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition"
            >
              <span>অনুশীলন সেটসমূহ</span>
            </Link>
          </div>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-2">
          <p className="text-gray-500 font-medium text-sm">
            নির্বাচিত ফিল্টারের সাথে মিলে এমন কোনো প্রিয় প্রশ্ন পাওয়া যায়নি।
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedSubject('all');
              setSelectedGrade('all');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            ফিল্টার রিসেট করুন
          </button>
        </div>
      ) : (
        /* Question List */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              ফিল্টারকৃত প্রশ্ন: <strong>{filteredQuestions.length}</strong> টি
            </span>
            <span>পৃষ্ঠা {currentPage} / {totalPages || 1}</span>
          </div>

          <div className="space-y-3">
            {displayedQuestions.map((q, idx) => {
              const serialNo = (currentPage - 1) * ITEMS_PER_PAGE + idx + 1;
              const isAnswerRevealed = !!revealedAnswers[q.id];
              const isExplanationOpen = !!expandedExplanations[q.id];

              return (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3 transition hover:border-gray-300"
                >
                  {/* Top Bar: Subject, Grade, Remove from favorites */}
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="w-6 h-6 rounded-md bg-rose-100 text-rose-700 font-extrabold text-[11px] flex items-center justify-center">
                        #{serialNo}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                        {q.subject}
                      </span>
                      {q.grade && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold">
                          {q.grade}
                        </span>
                      )}
                      {q.exam_source && (
                        <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                          • {q.exam_source}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFavorite(q.id)}
                      title="প্রিয় তালিকা থেকে বাদ দিন"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-[11px] font-bold transition"
                    >
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      <span className="hidden sm:inline">তালিকায় আছে</span>
                    </button>
                  </div>

                  {/* Question Text */}
                  <div className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed">
                    <MathText text={q.question_text} />
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    {(['A', 'B', 'C', 'D'] as const).map((optKey) => {
                      const optText = (q as any)[`option_${optKey.toLowerCase()}`];
                      if (!optText) return null;
                      const isCorrect = q.correct_option?.trim().toUpperCase() === optKey;

                      return (
                        <div
                          key={optKey}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition ${
                            isAnswerRevealed && isCorrect
                              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                              : 'bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                        >
                          <span
                            className={`w-5 h-5 rounded-md text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                              isAnswerRevealed && isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {optionLabels[optKey] || optKey}
                          </span>
                          <span className="pt-0.5">
                            <MathText text={optText} />
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Bar: Reveal Answer + Explanation Toggle */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => toggleRevealAnswer(q.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        isAnswerRevealed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {isAnswerRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{isAnswerRevealed ? 'উত্তর লুকান' : 'সঠিক উত্তর দেখুন'}</span>
                    </button>

                    {q.explanation && (
                      <button
                        type="button"
                        onClick={() => toggleExplanation(q.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          isExplanationOpen
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        <span>💡 {isExplanationOpen ? 'ব্যাখ্যা লুকান' : 'ব্যাখ্যা দেখুন'}</span>
                      </button>
                    )}
                  </div>

                  {/* Explanation Block */}
                  {isExplanationOpen && q.explanation && (
                    <div className="mt-2 p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200">
                      <FormattedExplanation explanation={q.explanation} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredQuestions.length}
                onPageChange={(p) => {
                  setCurrentPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

