'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites, FavoriteQuestion } from '@/context/FavoritesContext';

interface FavoriteButtonProps {
  question: FavoriteQuestion;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function FavoriteButton({
  question,
  size = 'md',
  showLabel = false,
  className = '',
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(question.id);

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(question);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={favorited ? 'প্রিয় তালিকা থেকে বাদ দিন' : 'প্রিয় প্রশ্ন হিসেবে সেভ করুন'}
      className={`inline-flex items-center gap-1.5 rounded-lg transition-all duration-150 active:scale-90 ${
        favorited
          ? 'text-rose-500 hover:text-rose-600 bg-rose-50 border border-rose-200'
          : 'text-gray-400 hover:text-rose-500 hover:bg-gray-100 border border-transparent hover:border-gray-200'
      } ${
        size === 'sm'
          ? 'p-1 text-[11px]'
          : size === 'lg'
          ? 'px-3 py-1.5 text-xs font-semibold'
          : 'p-1.5 text-xs font-medium'
      } ${className}`}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform ${
          favorited ? 'fill-rose-500 scale-105' : 'stroke-[2]'
        }`}
      />
      {showLabel && (
        <span>{favorited ? 'সংরক্ষিত' : 'প্রিয় করুন'}</span>
      )}
    </button>
  );
}

