'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Plus, CheckCircle, AlertCircle, Sparkles, FileText, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ImportPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [jsonText, setJsonText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!authLoading && !isAdmin) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">এডমিন অনুমতি প্রয়োজন</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          শুধুমাত্র <strong>এডমিন (Admin)</strong> একাউন্ট থেকে প্রশ্ন আপলোড বা ইমপোর্ট করা যাবে।
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

  const sampleTemplate = [
    {
      "question_text": "কোনটি মৌলিক সংখ্যা?",
      "option_a": "৯১",
      "option_b": "৮৭",
      "option_c": "৪৭",
      "option_d": "৬৩",
      "correct_option": "C",
      "explanation": "৪৭ একটি মৌলিক সংখ্যা।",
      "subject": "গণিত",
      "topic": "বাস্তব সংখ্যা",
      "exam_type": "BCS",
      "grade": "Grade 9",
      "exam_source": "১০ম বিসিএস",
      "year": 1989
    }
  ];

  const handleFillSample = () => {
    setJsonText(JSON.stringify(sampleTemplate, null, 2));
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jsonText.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const parsed = JSON.parse(jsonText);
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });

      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: `সফলভাবে ${data.inserted} টি নতুন প্রশ্ন ডাটাবেজে যুক্ত হয়েছে!`
        });
        setJsonText('');
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: 'ভুল ফরম্যাট: ' + err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-600" />
          প্রশ্ন যোগ ও বাল্ক ইমপোর্ট
        </h1>
        <p className="text-xs text-gray-500">
          জেসন (JSON) অথবা এক্সট্রাক্ট করা ডেটা থেকে সরাসরি প্রশ্ন ডাটাবেজে সংরক্ষণ করুন
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Extractor Helper Banner */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            পিডিএফ থেকে সরাসরি এক্সট্রাকশন চালু আছে
          </div>
          <p className="text-[11px] text-emerald-700">
            আপনার দেওয়া ৪টি বইয়ের পিডিএফ (গণিত, ইংরেজি, জিকে, বাংলা) ব্যাকগ্রাউন্ডে রেডি রয়েছে।
          </p>
        </div>
        <button
          type="button"
          onClick={handleFillSample}
          className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-50 shadow-sm transition whitespace-nowrap"
        >
          নমুনা ফরম্যাট দেখুন
        </button>
      </div>

      <form onSubmit={handleImport} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700">
              প্রশ্নের তালিকা (JSON Array Format):
            </label>
            <span className="text-[11px] text-gray-400">একাধিক প্রশ্ন একসাথে পেস্ট করা যাবে</span>
          </div>

          <textarea
            rows={12}
            required
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`[\n  {\n    "question_text": "...",\n    "option_a": "...",\n    "option_b": "...",\n    "option_c": "...",\n    "option_d": "...",\n    "correct_option": "A",\n    "explanation": "...",\n    "subject": "গণিত",\n    "exam_type": "BCS",\n    "grade": "Grade 9"\n  }\n]`}
            className="w-full font-mono text-xs p-3.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !jsonText.trim()}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {loading ? 'সংরক্ষণ হচ্ছে...' : 'প্রশ্ন ডাটাবেজে সংরক্ষণ করুন'}
        </button>
      </form>
    </div>
  );
}
