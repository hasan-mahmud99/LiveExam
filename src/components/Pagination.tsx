'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  scrollTargetId?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage = 20,
  onPageChange,
  scrollTargetId
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageSelect = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);

    if (scrollTargetId) {
      const el = document.getElementById(scrollTargetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers with ellipsis windowing
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200/80">
      {/* Information text */}
      <div className="text-xs font-semibold text-gray-500 order-2 sm:order-1 text-center sm:text-left">
        দেখাচ্ছে <strong className="text-gray-900 font-bold">{startItem}–{endItem}</strong> (মোট <strong className="text-emerald-700 font-bold">{totalItems}টি</strong> পরীক্ষার মধ্যে)
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2 flex-wrap justify-center">
        {/* First page button */}
        <button
          type="button"
          onClick={() => handlePageSelect(1)}
          disabled={currentPage === 1}
          title="প্রথম পৃষ্ঠা"
          className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:hover:bg-white disabled:cursor-not-allowed transition"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous button */}
        <button
          type="button"
          onClick={() => handlePageSelect(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-35 disabled:hover:bg-white disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden xs:inline">পূর্ববর্তী</span>
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-gray-400 font-bold text-xs select-none"
                >
                  •••
                </span>
              );
            }

            const pageNum = p as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => handlePageSelect(pageNum)}
                className={`min-w-[36px] h-9 px-2.5 rounded-xl text-xs font-extrabold transition active:scale-95 flex items-center justify-center ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next button */}
        <button
          type="button"
          onClick={() => handlePageSelect(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-35 disabled:hover:bg-white disabled:cursor-not-allowed transition"
        >
          <span className="hidden xs:inline">পরবর্তী</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last page button */}
        <button
          type="button"
          onClick={() => handlePageSelect(totalPages)}
          disabled={currentPage === totalPages}
          title="শেষ পৃষ্ঠা"
          className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-35 disabled:hover:bg-white disabled:cursor-not-allowed transition"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

