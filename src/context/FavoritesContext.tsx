'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteQuestion {
  id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option?: string | null;
  explanation?: string | null;
  subject: string;
  grade?: string | null;
  topic?: string | null;
  exam_type?: string | null;
  exam_source?: string | null;
  year?: number | null;
  added_at?: string;
}

interface FavoritesContextType {
  favorites: FavoriteQuestion[];
  favoritesCount: number;
  isFavorite: (questionId: number) => boolean;
  toggleFavorite: (question: FavoriteQuestion) => boolean; // returns new isFavorite state
  removeFavorite: (questionId: number) => void;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'liveexam_favorite_questions_v1';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load favorites from localStorage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveFavorites = (updated: FavoriteQuestion[]) => {
    setFavorites(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to persist favorites to localStorage:', e);
    }
  };

  const isFavorite = (questionId: number): boolean => {
    return favorites.some((q) => q.id === questionId);
  };

  const toggleFavorite = (question: FavoriteQuestion): boolean => {
    const exists = isFavorite(question.id);
    if (exists) {
      const updated = favorites.filter((q) => q.id !== question.id);
      saveFavorites(updated);
      return false;
    } else {
      const updated = [
        {
          ...question,
          added_at: new Date().toISOString(),
        },
        ...favorites,
      ];
      saveFavorites(updated);
      return true;
    }
  };

  const removeFavorite = (questionId: number) => {
    const updated = favorites.filter((q) => q.id !== questionId);
    saveFavorites(updated);
  };

  const clearFavorites = () => {
    saveFavorites([]);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        favoritesCount: favorites.length,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

