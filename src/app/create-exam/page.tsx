'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Clock, BookOpen, AlertCircle, CheckCircle, Zap, ShieldAlert, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function CreateExamPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'live' | 'practice'>('live');
  const [subject, setSubject] = useState('all');
  const [topic, setTopic] = useState('all');
  const [topicsList, setTopicsList] = useState<{ topic: string; count: number }[]>([]);
  const [examType, setExamType] = useState('all');
  const [grade, setGrade] = useState('all');
  const [questionCount, setQuestionCount] = useState(15);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch topics whenever subject changes
  const [loadingTopics, setLoadingTopics] = useState(false);
  useEffect(() => {
    async function fetchTopics() {
      setLoadingTopics(true);
      try {
        const url = subject !== 'all' ? `/api/topics?subject=${encodeURIComponent(subject)}` : '/api/topics';
        const res = await fetch(url);
        const data = await res.json();
        setTopicsList(data.topics || []);
      } catch (err) {
        console.error('Failed to load topics', err);
      } finally {
        setLoadingTopics(false);
      }
    }
    fetchTopics();
    setTopic('all');
  }, [subject]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('অনুগ্রহ করে পরীক্ষার শিরোনাম লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          mode,
          subject,
          topic_filter: topic !== 'all' ? topic : undefined,
          exam_type_filter: examType,
          grade_filter: grade,
          question_count: questionCount,
          duration_minutes: durationMinutes,
          negative_marking: negativeMarking,
          marks_per_question: 1.0
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create exam');
      }

      const exam = await res.json();
      router.push(`/exam/${exam.id}`);
    } catch (e: any) {
      alert('পরীক্ষা তৈরি করতে সমস্যা হয়েছে: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!authLoading && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">এডমিন অনুমতি প্রয়োজন</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          শুধুমাত্র <strong>এডমিন (Admin)</strong> একাউন্ট থেকে নতুন পরীক্ষা তৈরি করা যাবে।
          {user ? (
            <span className="block mt-1 text-xs text-gray-500">
              আপনি বর্তমানে <strong>{user.display_name}</strong> হিসেবে লগইন আছেন। আপনি সকল পরীক্ষা দিতে পারবেন।
            </span>
          ) : (
            <span className="block mt-1 text-xs text-gray-500">
              অনুগ্রহ করে এডমিন ক্রেডেনশিয়াল দিয়ে লগইন করুন।
            </span>
          )}
        </p>
        <div className="flex gap-2 justify-center pt-2">
          <Link
            href="/"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition"
          >
            হোমে ফিরে যান
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            লগইন পেজে যান
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <PlusCircle className="w-6 h-6 text-emerald-600" />
          নতুন মডেল টেস্ট তৈরি করুন
        </h1>
        <p className="text-xs text-gray-500">
          আপনার ৪-৫ জন বন্ধুর স্টাডি গ্রুপের জন্য কাস্টম লাইভ অথবা প্র্যাকটিস পরীক্ষা সাজান
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            পরীক্ষার নাম / শিরোনাম <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="যেমন: ৪৭তম বিসিএস গণিত ও সাধারণ জ্ঞান লাইভ টেস্ট"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">
            বিবরণ / সিলেবাস (ঐচ্ছিক)
          </label>
          <textarea
            rows={2}
            placeholder="যেমন: বাস্তব সংখ্যা, চর্যাপদ ও বাংলাদেশ বিষয়াবলীর প্রশ্ন..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {/* Mode: Live vs Practice */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            পরীক্ষার ধরণ (Mode)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('live')}
              className={`p-3.5 rounded-xl border text-left transition ${
                mode === 'live'
                  ? 'bg-rose-50 border-rose-500 text-rose-900 ring-1 ring-rose-500'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                লাইভ পরীক্ষা (Live Exam)
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                নির্দিষ্ট সময়ে সবাই একসাথে অংশ নেবে এবং তাৎক্ষণিক র‍্যাঙ্কিং দেখতে পাবে
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode('practice')}
              className={`p-3.5 rounded-xl border text-left transition ${
                mode === 'practice'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="font-bold text-xs text-emerald-900">
                প্র্যাকটিস টেস্ট (Self Practice)
              </div>
              <p className="text-[11px] text-gray-500 mt-1">
                যে কোনো সময় যে কেউ স্ব-উদ্যোগে অনুশীলন করতে পারবে
              </p>
            </button>
          </div>
        </div>

        {/* Filter Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">বিষয় ফিল্টার</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="all">সকল বিষয় (মিশ্রিত)</option>
              <option value="গণিত">গণিত (Math)</option>
              <option value="English">English</option>
              <option value="সাধারণ জ্ঞান">সাধারণ জ্ঞান (GK)</option>
              <option value="বাংলা">বাংলা (Bangla)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              টপিক / অধ্যায় <span className="text-gray-400 font-normal">(ঐচ্ছিক)</span>
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={loadingTopics}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium text-gray-800 outline-none disabled:opacity-50"
            >
              <option value="all">সকল অধ্যায় ({topicsList.length} টি ক্যাটাগরি)</option>
              {topicsList.map(t => (
                <option key={t.topic} value={t.topic}>
                  {t.topic} ({t.count} টি প্রশ্ন)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">পরীক্ষার ধরণ</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="all">সকল পরীক্ষা</option>
              <option value="BCS">বিসিএস (BCS)</option>
              <option value="Bank">ব্যাংক (Bank)</option>
              <option value="Primary">প্রাথমিক শিক্ষক (Primary)</option>
              <option value="Ministry">মন্ত্রণালয় (Ministry)</option>
              <option value="Non-Cadre">নন-ক্যাডার</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">গ্রেড / পদমর্যাদা</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium text-gray-800 outline-none"
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
        </div>

        {/* Exam Parameters: Question count, duration, negative marking */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-gray-100">
          <div>
            <label className="block font-bold text-gray-700 mb-1">প্রশ্ন সংখ্যা</label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="10">১০ টি প্রশ্ন</option>
              <option value="15">১৫ টি প্রশ্ন</option>
              <option value="20">২০ টি প্রশ্ন</option>
              <option value="30">৩০ টি প্রশ্ন</option>
              <option value="50">৫০ টি প্রশ্ন</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">সময়সীমা (মিনিট)</label>
            <input
              type="number"
              min="1"
              max="180"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 font-medium text-gray-800 outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">নেগেটিভ মার্কিং</label>
            <select
              value={negativeMarking}
              onChange={(e) => setNegativeMarking(parseFloat(e.target.value))}
              className="w-full bg-white border border-gray-300 rounded-lg p-2 font-medium text-gray-800 outline-none"
            >
              <option value="0.25">-0.25 (BCS স্ট্যান্ডার্ড)</option>
              <option value="0.5">-0.5 (ব্যাংক স্ট্যান্ডার্ড)</option>
              <option value="0">0.0 (কোনো নেগেটিভ মার্ক নেই)</option>
            </select>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md transition active:scale-98 disabled:opacity-50"
        >
          {isSubmitting ? 'পরীক্ষা তৈরি হচ্ছে...' : 'মডেল টেস্ট তৈরি করুন এবং শুরু করুন'}
        </button>
      </form>
    </div>
  );
}
