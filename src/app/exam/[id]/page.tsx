'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  User, 
  Bookmark, 
  ChevronRight, 
  ChevronDown,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowDownCircle,
  FileCheck2,
  Lock,
  Unlock,
  Sliders,
  Edit2
} from 'lucide-react';
import MathText from '@/components/MathText';
import FavoriteButton from '@/components/FavoriteButton';
import { useAuth } from '@/context/AuthContext';

interface Question {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  subject: string;
  topic?: string;
  exam_type: string;
  grade: string;
  exam_source?: string;
  year?: number;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  mode: string;
  duration_minutes: number;
  negative_marking: number;
  marks_per_question: number;
  questions: Question[];
}

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { user } = useAuth();

  const [exam, setExam] = useState<Exam | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const c = sessionStorage.getItem(`liveexam_cache_exam_${id}`);
        if (c) return JSON.parse(c);
      } catch {}
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        return !sessionStorage.getItem(`liveexam_cache_exam_${id}`);
      } catch {}
    }
    return true;
  });
  const [userName, setUserName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Practice exam custom settings
  const [enableNegativeMarking, setEnableNegativeMarking] = useState<boolean>(true);
  const [allowAnswerChange, setAllowAnswerChange] = useState<boolean>(true);

  // Exam state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const c = sessionStorage.getItem(`liveexam_cache_exam_${id}`);
        if (c) {
          const parsed = JSON.parse(c);
          return (Number(parsed.duration_minutes) || 0) * 60;
        }
      } catch {}
    }
    return 0;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If logged in, prioritize user display_name
    if (user?.display_name) {
      setUserName(user.display_name);
      setNameInput(user.display_name);
    } else {
      const savedName = localStorage.getItem('liveexam_user_name');
      if (savedName) {
        setUserName(savedName);
        setNameInput(savedName);
      }
    }

    // Check if this exam was already completed in this session and user is not retaking
    const isRetake = typeof window !== 'undefined' && window.location.search.includes('retake=true');
    if (isRetake) {
      try {
        sessionStorage.removeItem(`liveexam_submitted_${id}`);
      } catch {}
    } else {
      try {
        const prevSubId = sessionStorage.getItem(`liveexam_submitted_${id}`);
        if (prevSubId) {
          router.replace(`/exam/${id}/result/${prevSubId}`);
          return;
        }
      } catch {}
    }

    async function fetchExam() {
      try {
        const res = await fetch(`/api/exams/${id}`);
        if (!res.ok) throw new Error('Exam not found');
        const data = await res.json();
        setExam(data);
        if (!hasStarted) {
          setTimeLeft(data.duration_minutes * 60);
        }
        try {
          sessionStorage.setItem(`liveexam_cache_exam_${id}`, JSON.stringify(data));
        } catch {}
      } catch (e) {
        console.error('Failed to load exam:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchExam();
  }, [id, user]);

  // Timer logic
  useEffect(() => {
    if (!hasStarted || timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleSubmitExam(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted]);

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = nameInput.trim() || user?.display_name || 'পরীক্ষার্থী';

    localStorage.setItem('liveexam_user_name', finalName);
    setUserName(finalName);
    setHasStarted(true);
    setStartTime(Date.now());
  };

  const handleOptionSelect = (questionId: number, option: string) => {
    const qStr = questionId.toString();
    const current = answers[qStr];
    const isLockedMode = exam?.mode === 'live' || !allowAnswerChange;

    if (isLockedMode && current && current !== '') {
      // Locked: cannot change answer once chosen
      return;
    }

    setAnswers((prev) => ({
      ...prev,
      [qStr]: prev[qStr] === option ? (isLockedMode ? option : '') : option
    }));
  };

  const toggleReviewMark = (questionId: number) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [questionId.toString()]: !prev[questionId.toString()]
    }));
  };

  const handleSubmitExam = async (autoSubmit: boolean = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setShowConfirmModal(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    try {
      const res = await fetch(`/api/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: userName || user?.display_name || 'পরীক্ষার্থী',
          time_taken_seconds: timeTaken,
          answers,
          allow_negative: exam?.mode === 'practice' ? enableNegativeMarking : true
        })
      });

      const result = await res.json();
      if (result.submission_id) {
        try {
          sessionStorage.setItem(`liveexam_submitted_${id}`, result.submission_id);
        } catch {}
        // Replace current history entry so hitting "Back" from result page doesn't return to the exam screen
        router.replace(`/exam/${id}/result/${result.submission_id}`);
      } else {
        alert('ফলাফল তৈরি করতে সমস্যা হয়েছে');
        setIsSubmitting(false);
      }
    } catch (e) {
      console.error(e);
      alert('পরীক্ষা সাবমিট করতে সমস্যা হয়েছে');
      setIsSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    const el = document.getElementById('submit-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-500 font-medium">পরীক্ষা লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!exam || !exam.questions || exam.questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-gray-800">পরীক্ষা পাওয়া যায়নি বা কোনো প্রশ্ন নেই</h2>
        <p className="text-sm text-gray-500">অন্য কোনো পরীক্ষা নির্বাচন করুন অথবা নতুন প্রশ্ন যোগ করুন।</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold"
        >
          হোমে ফিরে যান
        </button>
      </div>
    );
  }

  // Pre-exam Start Modal
  if (!hasStarted) {
    return (
      <div className="max-w-xl mx-auto py-4 sm:py-8 px-2 sm:px-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 sm:p-8 space-y-5">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {exam.mode === 'live' ? '🔴 লাইভ পরীক্ষা' : '📖 প্র্যাকটিস টেস্ট'}
              </span>
              {exam.duration_minutes && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                  ⏱️ {exam.duration_minutes} মিনিট
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
              {exam.title}
            </h1>
            {exam.description && (
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{exam.description}</p>
            )}
          </div>

          {/* Exam Rules Breakdown */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-100">
              <span className="text-[11px] text-gray-500 block">মোট প্রশ্ন</span>
              <span className="font-extrabold text-sm sm:text-base text-gray-900">{exam.questions.length} টি</span>
            </div>
            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-100">
              <span className="text-[11px] text-gray-500 block">সময়সীমা</span>
              <span className="font-extrabold text-sm sm:text-base text-gray-900">{exam.duration_minutes} মিনিট</span>
            </div>
            <div className="bg-gray-50 p-2.5 sm:p-3 rounded-xl border border-gray-100">
              <span className="text-[11px] text-gray-500 block">নেগেটিভ মার্ক</span>
              <span className="font-extrabold text-sm sm:text-base text-rose-600">-{exam.negative_marking}</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-xl p-3.5 sm:p-4 border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <Sparkles className="w-4 h-4 text-amber-600" />
              নির্দেশনাবলি:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-900/90 pl-1 leading-relaxed">
              <li>প্রতিটি সঠিক উত্তরের জন্য পাবেন {exam.marks_per_question} নম্বর।</li>
              <li>প্রতিটি ভুল উত্তরের জন্য কাটা যাবে {exam.negative_marking} নম্বর।</li>
              <li>নিচে স্ক্রল করে প্রশ্নের উত্তর দিন। <strong>সাবমিট বাটনটি একদম নিচে রয়েছে।</strong></li>
              <li>সময় শেষ হলে খাতা স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।</li>
            </ul>
          </div>

          <form onSubmit={handleStartExam} className="space-y-4 pt-1">
            {/* Candidate Name Card */}
            {(userName || user?.display_name) && !isEditingName ? (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block leading-tight">পরীক্ষার্থী:</span>
                    <span className="text-sm font-extrabold text-gray-900">{userName || user?.display_name}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 bg-white border border-emerald-200 px-2.5 py-1 rounded-lg"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>নাম পরিবর্তন</span>
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                  আপনার নাম (লিডারবোর্ড ও ফলাফলের জন্য):
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="যেমন: কণা / হাসান / সাকিব"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 font-semibold text-gray-900 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
              </div>
            )}

            {/* Practice Exam Customizable Options */}
            {exam.mode === 'practice' ? (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3.5">
                <div className="flex items-center gap-2 text-xs font-black text-gray-800">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  <span>অনুশীলন টেস্ট কাস্টমাইজেশন:</span>
                </div>

                {/* Negative marking option */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-gray-600 block">১. নেগেটিভ মার্কিং নির্বাচন:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEnableNegativeMarking(true)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                        enableNegativeMarking
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${enableNegativeMarking ? 'border-emerald-600' : 'border-gray-400'}`}>
                          {enableNegativeMarking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                        </span>
                        <span>চালু (-{exam.negative_marking})</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block pl-5 font-normal">আসল পরীক্ষার মতো মার্ক কাটা</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEnableNegativeMarking(false)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                        !enableNegativeMarking
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${!enableNegativeMarking ? 'border-emerald-600' : 'border-gray-400'}`}>
                          {!enableNegativeMarking && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                        </span>
                        <span>বন্ধ (0.00)</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block pl-5 font-normal">ভুলে কোনো নম্বর কাটা যাবে না</span>
                    </button>
                  </div>
                </div>

                {/* Answer re-selection option */}
                <div className="space-y-1.5 pt-1 border-t border-gray-200/60">
                  <span className="text-[11px] font-bold text-gray-600 block">২. উত্তর পরিবর্তন সুবিধা:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAllowAnswerChange(true)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                        allowAnswerChange
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                        <span>পরিবর্তনযোগ্য</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block pl-5 font-normal">অন্য অপশনে ক্লিক করে উত্তর বদলাতে পারবেন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAllowAnswerChange(false)}
                      className={`p-2.5 rounded-xl text-xs font-bold border text-left transition ${
                        !allowAnswerChange
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-600" />
                        <span>এক ক্লিকে লক</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block pl-5 font-normal">একবার সিলেক্ট করলে আর পরিবর্তন হবে না</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-950">
                  <Lock className="w-4 h-4 text-rose-600" />
                  <span>লাইভ পরীক্ষা নিয়মাবলি:</span>
                </div>
                <p className="text-[11px] text-rose-800">
                  এটি একটি লাইভ পরীক্ষা। এতে নেগেটিভ মার্কিং (-{exam.negative_marking}) এবং এক ক্লিকে উত্তর লক নীতি অপরিবর্তনীয়।
                </p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm sm:text-base shadow-md transition active:scale-98 flex items-center justify-center gap-2"
            >
              পরীক্ষা শুরু করুন
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const unansweredCount = exam.questions.length - answeredCount;
  const reviewCount = Object.values(markedForReview).filter(Boolean).length;
  const isUrgent = timeLeft < 120; // less than 2 mins

  const handleExitExam = () => {
    const confirmExit = window.confirm('আপনি কি পরীক্ষা স্থগিত করে ফিরে যেতে চান? জমা না দিলে কোনো ফলাফল সংরক্ষিত হবে না।');
    if (confirmExit) {
      if (timerRef.current) clearInterval(timerRef.current);
      router.push('/dashboard');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto pb-28">
      {/* 1. STICKY TOP TIMER BAR - Stays locked at top while scrolling */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-md -mt-6 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 transition-all mb-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Exam title & progress */}
          <div className="min-w-0 flex-1">
            <h2 className="font-extrabold text-xs sm:text-sm text-gray-900 truncate">
              {exam.title}
            </h2>
            <div className="text-[11px] sm:text-xs text-gray-500 flex items-center gap-2 mt-0.5">
              <span>উত্তর: <strong className="text-emerald-700 font-bold">{answeredCount}/{exam.questions.length}</strong></span>
              <span className="text-gray-300">•</span>
              <span>বাকি: <strong className="text-amber-700 font-bold">{unansweredCount}</strong></span>
            </div>
          </div>

          {/* Right: Sticky Countdown Timer (Prominent, High Contrast) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 sm:px-3.5 sm:py-2 rounded-xl font-mono font-black text-xs sm:text-base tracking-wider transition-all shadow-sm ${
                isUrgent
                  ? 'bg-rose-100 text-rose-700 border-2 border-rose-400 animate-pulse'
                  : 'bg-emerald-50 text-emerald-900 border border-emerald-300'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isUrgent ? 'text-rose-600 animate-spin' : 'text-emerald-700'}`} />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            {/* Mobile quick scroll-to-bottom button */}
            <button
              type="button"
              onClick={scrollToBottom}
              title="একদম নিচে সাবমিট বাটনে যান"
              className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 text-xs font-semibold flex items-center gap-1 transition active:scale-95"
            >
              <ArrowDownCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
              <span className="hidden sm:inline">নিচে যান</span>
            </button>

            {/* Exit button */}
            <button
              type="button"
              onClick={handleExitExam}
              title="পরীক্ষা ত্যাগ করুন"
              className="p-1.5 sm:p-2 rounded-xl border border-gray-200 hover:bg-rose-50 hover:border-rose-300 text-gray-400 hover:text-rose-600 transition text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Linear Progress Bar below timer */}
        <div className="max-w-4xl mx-auto w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
          <div
            className="bg-emerald-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(answeredCount / exam.questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* 2. QUESTIONS FEED - Focused on Mobile View */}
      <div className="space-y-4 sm:space-y-5">
        {exam.questions.map((q, index) => {
          const currentSelected = answers[q.id.toString()] || '';
          const isMarked = markedForReview[q.id.toString()];

          return (
            <div
              key={q.id}
              id={`q-${q.id}`}
              className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all ${
                isMarked
                  ? 'border-amber-400 ring-2 ring-amber-100 shadow-sm'
                  : currentSelected
                  ? 'border-emerald-300 shadow-sm'
                  : 'border-gray-200 shadow-xs'
              }`}
            >
              {/* Question Header & Meta Tags */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 text-gray-800 font-bold flex items-center justify-center text-xs">
                    {index + 1}
                  </span>
                  <span className="px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                    {q.subject}
                  </span>
                  {q.grade && (
                    <span className="px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-800 border border-amber-200">
                      {q.grade}
                    </span>
                  )}
                  {q.topic && (
                    <span className="px-2 py-0.5 rounded font-normal bg-gray-50 text-gray-600 hidden xs:inline-block">
                      {q.topic}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <FavoriteButton question={q} size="sm" showLabel={false} />
                  {/* Bookmark / Review Button */}
                  <button
                    type="button"
                    onClick={() => toggleReviewMark(q.id)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition active:scale-95 ${
                      isMarked
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isMarked ? 'fill-amber-600 text-amber-600' : ''}`} />
                    <span>{isMarked ? 'রিভিউ মার্কড' : 'রিভিউ'}</span>
                  </button>
                </div>
              </div>

              {/* Question Text with MathText formatting */}
              <div className="text-gray-900 font-bold text-sm sm:text-base mb-3.5 leading-relaxed break-words">
                <MathText text={q.question_text} />
              </div>

              {/* Options: Large, Thumb-Friendly Mobile Touch Targets */}
              <div className="grid grid-cols-1 gap-2.5">
                {[
                  { label: 'ক', key: 'A', text: q.option_a },
                  { label: 'খ', key: 'B', text: q.option_b },
                  { label: 'গ', key: 'C', text: q.option_c },
                  { label: 'ঘ', key: 'D', text: q.option_d },
                ].map((opt) => {
                  const isSelected = currentSelected === opt.key;
                  const isLockedOther = Boolean((exam.mode === 'live' || !allowAnswerChange) && currentSelected && !isSelected);

                  return (
                    <button
                      key={opt.key}
                      type="button"
                      disabled={isLockedOther}
                      onClick={() => handleOptionSelect(q.id, opt.key)}
                      className={`w-full text-left p-3 sm:p-3.5 rounded-xl border flex items-center gap-3 transition-all min-h-[48px] ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-xs ring-1 ring-emerald-500'
                          : isLockedOther
                          ? 'bg-gray-50 border-gray-150 text-gray-400 cursor-not-allowed opacity-60'
                          : 'bg-white border-gray-200 text-gray-800 hover:border-gray-300 hover:bg-gray-50/70 active:scale-[0.99]'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : isLockedOther
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="text-xs sm:text-sm leading-snug flex-1 break-words font-medium">
                        <MathText text={opt.text} />
                      </span>
                      {isSelected && (exam.mode === 'live' || !allowAnswerChange) && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold shrink-0">
                          লকড
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reset/Clear Choice (Only allowed when answer change is enabled) */}
              {currentSelected && allowAnswerChange && exam.mode !== 'live' && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => handleOptionSelect(q.id, currentSelected)}
                    className="text-[11px] text-gray-400 hover:text-rose-600 font-medium inline-flex items-center gap-1 active:scale-95"
                  >
                    <RotateCcw className="w-3 h-3" />
                    উত্তর মুছুন
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. SUBMIT BUTTON - Clean & Compact (Just Submit) */}
      <div id="submit-section" className="pt-6 pb-12 flex flex-col items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setShowConfirmModal(true)}
          disabled={isSubmitting}
          className="px-10 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold rounded-xl text-sm sm:text-base shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'সাবমিট হচ্ছে...' : 'Submit'}</span>
        </button>
        <p className="text-xs text-gray-400 font-medium">
          উত্তর দিয়েছেন: <strong className="text-gray-700">{answeredCount}/{exam.questions.length}</strong> • বাকি: <strong className="text-amber-700">{unansweredCount}</strong>
        </p>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-gray-200 animate-scaleUp">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Send className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-black text-gray-900">আপনি কি খাতা জমা দিতে প্রস্তুত?</h4>
              <p className="text-xs text-gray-500">
                একবার জমা দিলে আর উত্তর পরিবর্তন করা যাবে না।
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">মোট প্রশ্ন:</span>
                <span className="font-bold text-gray-800">{exam.questions.length} টি</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700 font-semibold">উত্তর দিয়েছেন:</span>
                <span className="font-black text-emerald-800">{answeredCount} টি</span>
              </div>
              <div className="flex justify-between">
                <span className="text-rose-700 font-semibold">বাকি আছে:</span>
                <span className="font-black text-rose-800">{unansweredCount} টি</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">বাকি সময়:</span>
                <span className="font-bold font-mono text-gray-800">{formatTimer(timeLeft)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition"
              >
                পরীক্ষায় ফিরে যান
              </button>
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-sm"
              >
                {isSubmitting ? 'জমা হচ্ছে...' : 'হ্যাঁ, নিশ্চিত জমা দিন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
