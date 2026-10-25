'use client';

import React from 'react';
import { Zap, BookOpen, Lightbulb, CheckCircle2, ChevronRight } from 'lucide-react';
import MathText from '@/components/MathText';

interface FormattedExplanationProps {
  explanation?: string | null;
  subject?: string;
  compact?: boolean;
}

interface ParsedExplanation {
  steps: string[];
  shortcut: string | null;
  rules: string[];
  options: { key: string; text: string }[];
}

export function parseExplanation(text: string): ParsedExplanation {
  if (!text || typeof text !== 'string') {
    return { steps: [], shortcut: null, rules: [], options: [] };
  }

  let remaining = text.trim();
  let shortcut: string | null = null;
  const rules: string[] = [];
  const options: { key: string; text: string }[] = [];

  // 1. Extract Shortcut (শর্টকাট সূত্র, শর্টকাট টেকনিক, শর্টকাট:, Shortcut:)
  const shortcutRegex = /(?:■\s*)?(?:শর্টকাট(?:\s*(?:সূত্র|টেকনিক|নিয়ম|পদ্ধতি))?|Shortcut(?:\s*formula|\s*technique)?)[\s:：-]+([\s\S]*?)(?=(?:■|যে\s*বিষয়টা\s*মনে\s*রাখতে\s*হবে|টিপস|নোট|\([a-dক-ঘ]\)|$))/i;
  const scMatch = remaining.match(shortcutRegex);
  if (scMatch && scMatch[1].trim()) {
    shortcut = scMatch[1].trim();
    remaining = remaining.replace(scMatch[0], '').trim();
  }

  // 2. Extract Key Rules / Book Box / Conceptual Notes (■ or যে বিষয়টা মনে রাখতে হবে or নোট)
  const ruleRegex = /(?:■\s*|যে\s*বিষয়টা\s*মনে\s*রাখতে\s*হবে[\s:：-]|নোট[\s:：-]|টিপস[\s:：-])([\s\S]*?)(?=(?:■|যে\s*বিষয়টা\s*মনে\s*রাখতে\s*হবে|টিপস|নোট|\([a-dক-ঘ]\)|$))/gi;
  let ruleMatch: RegExpExecArray | null;
  const matchedRules: string[] = [];
  while ((ruleMatch = ruleRegex.exec(remaining)) !== null) {
    if (ruleMatch[0].trim()) {
      matchedRules.push(ruleMatch[0].trim());
    }
  }
  for (const r of matchedRules) {
    rules.push(r.replace(/^■\s*/, '').trim());
    remaining = remaining.replace(r, '').trim();
  }

  // 3. Extract Option Breakdowns e.g. (a) ... (b) ... (c) ... (d) ...
  const optRegex = /\(([a-dক-ঘ])\)\s*([\s\S]*?)(?=(?:\([a-dক-ঘ]\)|$))/gi;
  const optionMatches: { key: string; text: string; full: string }[] = [];
  let optMatch: RegExpExecArray | null;
  while ((optMatch = optRegex.exec(remaining)) !== null) {
    if (optMatch[2].trim()) {
      optionMatches.push({
        key: optMatch[1].toUpperCase(),
        text: optMatch[2].trim(),
        full: optMatch[0],
      });
    }
  }

  if (optionMatches.length >= 2) {
    for (const om of optionMatches) {
      options.push({ key: om.key, text: om.text });
      remaining = remaining.replace(om.full, '').trim();
    }
  }

  // 4. Clean up remaining text into step-by-step lines
  remaining = remaining.replace(/^(?:✍️\s*)?(?:সমাধান|Solution|ব্যাখ্যা)[\s:：-]*/i, '').trim();

  const rawSteps: string[] = [];
  if (remaining) {
    if (remaining.includes('\n')) {
      const lines = remaining.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed) rawSteps.push(trimmed);
      }
    } else {
      const sentences = remaining.split(/(?<=[।;])\s+/);
      for (const s of sentences) {
        const trimmed = s.trim();
        if (trimmed) rawSteps.push(trimmed);
      }
    }
  }

  return {
    steps: rawSteps,
    shortcut,
    rules,
    options,
  };
}

export default function FormattedExplanation({
  explanation,
  subject,
}: FormattedExplanationProps) {
  if (!explanation || !explanation.trim()) {
    return null;
  }

  const parsed = parseExplanation(explanation);
  const isMath = subject === 'গণিত';
  const isEnglish = subject === 'English';

  return (
    <div className="space-y-3 pt-1 text-slate-800 animate-fadeIn">
      {/* 1. Solution Section (Step-by-Step only for Math; clean '✍️ সমাধান:' for others) */}
      {parsed.steps.length > 0 && (
        <div className="bg-white/95 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-sm space-y-2">
          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
            <span>{isMath ? '✍️ বিস্তারিত সমাধান (Step-by-Step):' : '✍️ সমাধান:'}</span>
          </div>
          {isMath ? (
            <div className="space-y-2 pl-0.5">
              {parsed.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-baseline gap-2 text-xs sm:text-[13px] leading-relaxed text-slate-700"
                >
                  <span className="text-emerald-600 flex-shrink-0 self-center">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex-1 break-words font-medium">
                    <MathText text={step} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs sm:text-[13px] leading-relaxed text-slate-700 pl-1 font-medium space-y-1.5">
              {parsed.steps.map((step, idx) => (
                <p key={idx} className="break-words">
                  <MathText text={step} />
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Special Dedicated Shortcut Box (With Vertical Division Bar & Powers) */}
      {parsed.shortcut && (
        <div className="bg-gradient-to-r from-amber-50 via-amber-50/80 to-orange-50 border-2 border-amber-300 rounded-xl p-3 sm:p-4 shadow-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              ⚡
            </span>
            <span className="font-bold text-xs sm:text-[13px] text-amber-950 uppercase tracking-wide">
              শর্টকাট টেকনিক ও সূত্র (Shortcut Technique)
            </span>
          </div>
          <div className="pl-0 sm:pl-7">
            <div className="text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed break-words bg-white/80 p-3 rounded-lg border border-amber-200 shadow-inner inline-block w-full">
              <MathText text={parsed.shortcut} />
            </div>
          </div>
        </div>
      )}

      {/* 4. Book Rules / Key Concept Takeaways (বইয়ের বক্স নিয়মাবলী / বিশেষ দ্রষ্টব্য) */}
      {parsed.rules.length > 0 && (
        <div className="space-y-2">
          {parsed.rules.map((rule, idx) => (
            <div
              key={idx}
              className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 sm:p-3.5 shadow-sm space-y-1"
            >
              <div className="flex items-center gap-1.5 text-blue-950 font-bold text-xs">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>বিশেষ দ্রষ্টব্য:</span>
              </div>
              <div className="text-xs sm:text-[13px] text-blue-900 leading-relaxed pl-5 font-medium whitespace-pre-line break-words">
                <MathText text={rule} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Option-by-Option Breakdown (বিকল্প বিশ্লেষণ a/b/c/d) */}
      {parsed.options.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-3.5 shadow-sm space-y-2">
          <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>অপশনভিত্তিক বিশ্লেষণ (Option Analysis):</span>
          </div>
          <div className="grid grid-cols-1 gap-2 pt-0.5">
            {parsed.options.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 p-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-[13px] leading-relaxed"
              >
                <span className="w-5 h-5 rounded-md bg-slate-100 border border-slate-300 text-slate-800 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {opt.key}
                </span>
                <div className="flex-1 text-slate-700 font-medium break-words">
                  <MathText text={opt.text} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
