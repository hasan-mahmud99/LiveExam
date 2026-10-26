'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

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
  toggleFavorite: (question: FavoriteQuestion) => boolean;
  removeFavorite: (questionId: number) => void;
  clearFavorites: () => void;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);

  // Function to load favorites from the database
  const loadFavoritesFromDb = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.favorites)) {
          setFavorites(data.favorites);
          // Also sync to user-specific localStorage for instant offline access
          try {
            localStorage.setItem(`liveexam_fav_${user.id}`, JSON.stringify(data.favorites));
          } catch {}
        }
      }
    } catch (e) {
      console.error('Failed to load favorites from database:', e);
      // Fallback to user-scoped localStorage
      try {
        const local = localStorage.getItem(`liveexam_fav_${user.id}`);
        if (local) setFavorites(JSON.parse(local));
      } catch {}
    }
  }, [user]);

  // When user logs in or out, sync state
  useEffect(() => {
    if (user) {
      // 1. Immediately show cached user favorites if available
      try {
        const cached = localStorage.getItem(`liveexam_fav_${user.id}`);
        if (cached) setFavorites(JSON.parse(cached));
      } catch {}

      // 2. Refresh from DB
      loadFavoritesFromDb();
    } else {
      // User logged out: strictly clear favorites from screen & state
      setFavorites([]);
    }
  }, [user, loadFavoritesFromDb]);

  const isFavorite = (questionId: number): boolean => {
    return favorites.some((q) => q.id === questionId);
  };

  const toggleFavorite = (question: FavoriteQuestion): boolean => {
    const exists = isFavorite(question.id);
    let updated: FavoriteQuestion[];

    if (exists) {
      updated = favorites.filter((q) => q.id !== question.id);
      setFavorites(updated);
    } else {
      updated = [
        {
          ...question,
          added_at: new Date().toISOString(),
        },
        ...favorites,
      ];
      setFavorites(updated);
    }

    // Persist to user-scoped local storage
    if (user) {
      try {
        localStorage.setItem(`liveexam_fav_${user.id}`, JSON.stringify(updated));
      } catch {}

      // Sync to cloud database
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: question.id }),
      }).catch((err) => console.error('Failed to sync favorite to database:', err));
    }

    return !exists;
  };

  const removeFavorite = (questionId: number) => {
    const updated = favorites.filter((q) => q.id !== questionId);
    setFavorites(updated);

    if (user) {
      try {
        localStorage.setItem(`liveexam_fav_${user.id}`, JSON.stringify(updated));
      } catch {}

      // Remove from database
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId }),
      }).catch((err) => console.error('Failed to remove favorite from database:', err));
    }
  };

  const clearFavorites = () => {
    setFavorites([]);

    if (user) {
      try {
        localStorage.removeItem(`liveexam_fav_${user.id}`);
      } catch {}

      fetch('/api/favorites', { method: 'DELETE' }).catch((err) =>
        console.error('Failed to clear favorites from database:', err)
      );
    }
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
        refreshFavorites: loadFavoritesFromDb,
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
