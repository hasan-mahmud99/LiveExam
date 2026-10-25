'use client';

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
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();

  // Hide global navbar during active exam taking so timer has 100% focus and perfect sticky behavior
  const isExamActive = pathname.startsWith('/exam/') && !pathname.includes('/result') && !pathname.includes('/leaderboard');
  if (isExamActive) {
    return null;
  }

  // Navigation items
  const baseLinks = [
    { name: 'ড্যাশবোর্ড', href: user ? '/dashboard' : '/login', icon: LayoutDashboard },
    { name: 'পরীক্ষাসমূহ', href: '/', icon: PlayCircle },
    { name: 'অনুশীলন সেট', href: '/practice', icon: GraduationCap },
    { name: 'প্রশ্নব্যাংক', href: '/questions', icon: BookOpen },
  ];

  // Admin-only links
  const adminLinks = [
    { name: 'পরীক্ষা তৈরি', href: '/create-exam', icon: PlusCircle },
    { name: 'প্রশ্ন আপলোড', href: '/import', icon: Layers },
  ];

  const visibleLinks = isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-gray-900">
                  Live<span className="text-emerald-600">Exam</span>
                </span>
                <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold hidden xs:inline-block">
                  Study Group
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium truncate">
                বিসিএস, ব্যাংক ও সরকারি চাকরি প্রস্তুতি
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth Menu */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                {/* User Info Badge */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-gray-50 hover:bg-emerald-50/50 border border-gray-200 rounded-xl px-2.5 py-1 sm:px-3 sm:py-1.5 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-inner">
                    {user.username === 'admin' ? '👑' : user.username === 'kona' ? '👩' : '👨'}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-gray-800 leading-tight">
                      {user.display_name}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium">
                      {user.role === 'ADMIN' ? 'এডমিন (All Access)' : 'পরীক্ষার্থী (Student)'}
                    </div>
                  </div>
                </Link>

                {/* Create Exam shortcut for Admin only */}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-bold hover:bg-emerald-700 transition shadow-sm active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span>লগইন করুন</span>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-around py-2 border-t border-gray-100 overflow-x-auto text-xs">
          {visibleLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md font-medium text-[11px] ${
                  isActive ? 'text-emerald-600 font-bold bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
