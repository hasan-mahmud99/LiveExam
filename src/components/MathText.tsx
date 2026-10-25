'use client';

import React from 'react';

interface MathTextProps {
  text?: string | null;
  className?: string;
  stripLeadingNumber?: boolean;
}

export function cleanLeadingBookNumber(str: string): string {
  if (!str) return str;
  return str.replace(/^(?:\([0-9০-৯]+\)|[0-9০-৯]+[\.\)])\s+/, '').trim();
}

/**
 * MathInline handles powers (x^2, aq^(r-1)), subscripts (log_x, a_1), operators (* -> ×)
 */
export function MathInline({ text }: { text: string }) {
  if (!text) return null;

  // Replace multiplication and inequality operators
  const formatted = text.replace(/\*/g, ' × ');

  // Regex matching:
  // 1. Subscript base_sub e.g. log_x, a_1, log_10
  // 2. Superscript base^exp e.g. x^2, (x^2)^3, 2^(7-1), aq^(r-1)
  const tokenRegex = /(?:([a-zA-Z0-9০-৯]+)_(\([^)]+\)|[a-zA-Z0-9০-৯]+)|([a-zA-Z0-9০-৯\)]+)\^(\([^)]+\)|[a-zA-Z0-9০-৯\+\-\*×]+))/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(formatted)) !== null) {
    if (match.index > lastIndex) {
      elements.push(formatted.substring(lastIndex, match.index));
    }

    if (match[1] !== undefined) {
      // Subscript (base_sub)
      const base = match[1];
      const sub = match[2].replace(/^\(|\)$/g, '');
      elements.push(
        <span key={`sub-${match.index}`} className="inline-block">
          <span>{base}</span>
          <sub className="font-semibold text-[0.72em] -bottom-[0.22em] relative ml-0.5">{sub}</sub>
        </span>
      );
    } else if (match[3] !== undefined) {
      // Superscript (base^exp)
      const base = match[3];
      const exp = match[4].replace(/^\(|\)$/g, '');
      elements.push(
        <span key={`sup-${match.index}`} className="inline-block">
          <span>{base}</span>
          <sup className="font-semibold text-[0.72em] -top-[0.45em] relative ml-0.5">{exp}</sup>
        </span>
      );
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < formatted.length) {
    elements.push(formatted.substring(lastIndex));
  }

  return elements.length > 0 ? <>{elements}</> : <>{formatted}</>;
}

/**
 * MathFraction component renders a vertical stacked fraction with horizontal bar
 */
export function MathFraction({ num, den }: { num: string; den: string }) {
  return (
    <span className="inline-flex flex-col items-center justify-center align-middle mx-1 my-0.5 text-center leading-none">
      <span className="border-b-2 border-current px-1.5 pb-0.5 text-[0.9em] font-semibold tracking-tight">
        <MathInline text={num} />
      </span>
      <span className="pt-0.5 px-1.5 text-[0.9em] font-semibold tracking-tight">
        <MathInline text={den} />
      </span>
    </span>
  );
}

/**
 * Top-level MathText: handles fractions first, then inline math (powers, subscripts, operators)
 */
export default function MathText({ text, className = '', stripLeadingNumber = true }: MathTextProps) {
  if (!text) return null;
  const processedText = stripLeadingNumber ? cleanLeadingBookNumber(text) : text;

  // Fraction regex: matches parenthesized or numerical fractions
  const fractionRegex = /(?:(\([^)]+\))|([0-9a-zA-Z০-৯ক-হ]+))\s*\/\s*(?:(\([^)]+\))|([0-9a-zA-Z০-৯ক-হ]+))/g;

  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fractionRegex.exec(processedText)) !== null) {
    const rawMatch = match[0];
    const num = (match[1] || match[2]).replace(/^\(|\)$/g, '').trim();
    const den = (match[3] || match[4]).replace(/^\(|\)$/g, '').trim();

    const isMath =
      /[\*\+\-\×\÷=]/.test(num) ||
      /[\*\+\-\×\÷=]/.test(den) ||
      (/[0-9০-৯]/.test(num) && /[0-9০-৯]/.test(den)) ||
      (/[0-9০-৯]/.test(num) && /^[a-zA-Zক-হ]$/.test(den)) ||
      (/^[a-zA-Zক-হ]$/.test(num) && /[0-9০-৯]/.test(den)) ||
      (/^[a-zA-Zক-হ]$/.test(num) && /^[a-zA-Zক-হ]$/.test(den) && !/^[a-zA-Z]{2,}\/[a-zA-Z]{2,}$/.test(rawMatch)) ||
      /(বাড়া|কমা|লাভ|ক্ষতি|মূল্য|আসল|সুদ|সময়)/.test(num) ||
      /(বাড়া|কমা|লাভ|ক্ষতি|মূল্য|আসল|সুদ|সময়)/.test(den);

    if (isMath) {
      if (match.index > lastIndex) {
        elements.push(
          <MathInline key={`txt-${lastIndex}`} text={processedText.substring(lastIndex, match.index)} />
        );
      }
      elements.push(<MathFraction key={`frac-${match.index}`} num={num} den={den} />);
      lastIndex = fractionRegex.lastIndex;
    }
  }

  if (lastIndex < processedText.length) {
    elements.push(
      <MathInline key={`txt-${lastIndex}`} text={processedText.substring(lastIndex)} />
    );
  }

  return <span className={className}>{elements.length > 0 ? elements : <MathInline text={processedText} />}</span>;
}

