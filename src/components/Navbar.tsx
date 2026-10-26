'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BookOpen, 
  PlayCircle, 
  PlusCircle, 
  Layers, 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  GraduationCap,
  LayoutDashboard,
  Menu,
  X,
  Heart,
  ChevronRight,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: number | null;
  highlight?: boolean;
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const { favoritesCount } = useFavorites();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Hide global navbar during active exam taking so timer has 100% focus and perfect sticky behavior
  const isExamActive = pathname.startsWith('/exam/') && !pathname.includes('/result') && !pathname.includes('/leaderboard');
  if (isExamActive) {
    return null;
  }

  // Navigation items
  const mainLinks: NavItem[] = [
    { name: 'ড্যাশবোর্ড', href: user ? '/dashboard' : '/login', icon: LayoutDashboard },
    { name: 'পরীক্ষাসমূহ', href: '/', icon: PlayCircle },
    { name: 'অনুশীলন সেট', href: '/practice', icon: GraduationCap },
    { name: 'প্রশ্নব্যাংক', href: '/questions', icon: BookOpen },
    { 
      name: 'প্রিয় প্রশ্নসমূহ', 
      href: '/favorites', 
      icon: Heart, 
      badge: favoritesCount > 0 ? favoritesCount : null,
      highlight: true 
    },
  ];

  // Admin-only links
  const adminLinks: NavItem[] = [
    { name: 'পরীক্ষা তৈরি', href: '/create-exam', icon: PlusCircle },
    { name: 'প্রশ্ন আপলোড', href: '/import', icon: Layers },
  ];

  const visibleLinks: NavItem[] = isAdmin ? [...mainLinks, ...adminLinks] : mainLinks;

  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-2">
            
            {/* Left Section: 3-bar Hamburger Button + Logo */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* App-Style 3-Bar Menu Button */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                title="মেনু খুলুন"
                className="p-2 -ml-1 text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition border border-transparent hover:border-emerald-200 active:scale-95 flex items-center justify-center"
              >
                <Menu className="w-6 h-6 stroke-[2.2]" />
              </button>

              {/* Logo */}
              <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 sm:gap-2.5 group min-w-0">
                <img
                  src="/logo.png"
                  alt="LiveExam Badge"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform flex-shrink-0 bg-white p-0.5 border border-gray-100"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900">
                      Live<span className="text-emerald-600">Exam</span>
                    </span>
                    <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold hidden md:inline-block">
                      Study Group
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate hidden xs:block">
                    বিসিএস, ব্যাংক ও সরকারি চাকরি প্রস্তুতি
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {visibleLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    } ${link.highlight && !isActive ? 'text-rose-600 hover:text-rose-700' : ''}`}
                  >
                    <Icon className={`w-4 h-4 ${link.highlight ? (isActive ? 'fill-emerald-700' : 'fill-rose-500 text-rose-500') : ''}`} />
                    <span>{link.name}</span>
                    {link.badge !== null && link.badge !== undefined && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white leading-tight">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Action / Auth Menu */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Quick Favorite Icon on Mobile & Desktop */}
              <Link
                href="/favorites"
                title="প্রিয় প্রশ্নসমূহ"
                className={`relative p-2 rounded-xl border transition ${
                  pathname === '/favorites'
                    ? 'bg-rose-50 border-rose-300 text-rose-600'
                    : 'bg-white hover:bg-rose-50/60 border-gray-200 text-gray-500 hover:text-rose-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                    {favoritesCount}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* User Profile Pill */}
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2 bg-gray-50 hover:bg-emerald-50/50 border border-gray-200 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 transition"
                  >
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-inner">
                      {user.username === 'admin' ? '👑' : user.username === 'kona' ? '👩' : '👨'}
                    </div>
                    <div className="text-left hidden md:block">
                      <div className="text-xs font-bold text-gray-800 leading-tight">
                        {user.display_name}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-medium">
                        {user.role === 'ADMIN' ? 'এডমিন' : 'পরীক্ষার্থী'}
                      </div>
                    </div>
                  </Link>

                  {/* Create Exam shortcut for Admin */}
                  {isAdmin && (
                    <Link
                      href="/create-exam"
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition shadow-sm active:scale-95"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>নতুন পরীক্ষা</span>
                    </Link>
                  )}

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={() => logout()}
                    title="লগআউট করুন"
                    className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-gray-200 hover:bg-rose-50 hover:border-rose-200 text-gray-500 hover:text-rose-600 text-xs font-medium transition flex items-center gap-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">লগআউট</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 transition shadow-sm active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>লগইন</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* App-Style Slide-Out Drawer (Sidebar) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeDrawer}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-full flex">
            <div className="w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-left duration-300 border-r border-gray-200">
              
              {/* Drawer Top Header */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-800 text-white">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/logo.png"
                      alt="LiveExam"
                      className="w-10 h-10 object-contain rounded-xl shadow-xs bg-white p-0.5"
                    />
                    <div>
                      <h2 className="font-extrabold text-base leading-tight">LiveExam App</h2>
                      <p className="text-[11px] text-emerald-100 font-medium">স্মার্ট বিসিএস ও ব্যাংক প্রস্তুতি</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* User Section in Drawer */}
                <div className="p-3 bg-gray-50 border-b border-gray-100">
                  {user ? (
                    <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-xs">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg font-bold">
                        {user.username === 'admin' ? '👑' : user.username === 'kona' ? '👩' : '👨'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-gray-900 truncate">
                          {user.display_name}
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <UserCheck className="w-3 h-3" />
                          {user.role === 'ADMIN' ? 'সিস্টেম এডমিন' : 'সদস্য পরীক্ষার্থী'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={closeDrawer}
                      className="flex items-center justify-between bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-xl font-bold text-xs shadow-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <LogIn className="w-4 h-4" />
                        <span>লগইন করুন (পরীক্ষা সংরক্ষণ ও লিডারবোর্ড)</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>

                {/* Main Navigation Items */}
                <div className="p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 block">
                    মেনু ও সেকশন
                  </span>

                  {visibleLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeDrawer}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 shadow-xs'
                            : 'text-gray-700 hover:bg-gray-100'
                        } ${item.highlight && !isActive ? 'text-rose-600 hover:bg-rose-50' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${
                            isActive 
                              ? 'bg-emerald-600 text-white' 
                              : item.highlight 
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className={`w-4 h-4 ${item.highlight ? 'fill-current' : ''}`} />
                          </div>
                          <span>{item.name}</span>
                        </div>

                        {item.badge !== null && item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Quick Shortcuts */}
                <div className="p-3 border-t border-gray-100 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-3 py-1 block">
                    কুইক ক্যাটাগরি
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 px-1">
                    <Link
                      href="/practice?grade=bcs"
                      onClick={closeDrawer}
                      className="px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-[11px] font-semibold text-gray-700 hover:text-emerald-700 border border-gray-200 text-center"
                    >
                      🏛️ বিসিএস টেস্ট
                    </Link>
                    <Link
                      href="/practice?grade=bank"
                      onClick={closeDrawer}
                      className="px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-[11px] font-semibold text-gray-700 hover:text-emerald-700 border border-gray-200 text-center"
                    >
                      🏦 ব্যাংক নিয়োগ
                    </Link>
                    <Link
                      href="/practice?grade=10-13"
                      onClick={closeDrawer}
                      className="px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-[11px] font-semibold text-gray-700 hover:text-emerald-700 border border-gray-200 text-center"
                    >
                      📋 ১০ম-১৩তম গ্রেড
                    </Link>
                    <Link
                      href="/practice?grade=13-16"
                      onClick={closeDrawer}
                      className="px-2.5 py-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-[11px] font-semibold text-gray-700 hover:text-emerald-700 border border-gray-200 text-center"
                    >
                      📝 ১৩-১৬তম গ্রেড
                    </Link>
                  </div>
                </div>
              </div>

              {/* Drawer Bottom Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs">
                {user ? (
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      closeDrawer();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition shadow-xs"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>লগআউট করুন</span>
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={closeDrawer}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-xs"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>লগইন পেইজে যান</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
