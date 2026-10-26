import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';

export const metadata: Metadata = {
  title: 'LiveExam - BCS, Bank & Job Exam Platform',
  description: 'Live Model Tests, Practice Question Bank, and Real-time Study Group Leaderboards',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'LiveExam',
  },
};

export const viewport = {
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="bn" className="h-full antialiased bg-gray-50 text-gray-900" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <AuthProvider>
          <FavoritesProvider>
            <Suspense fallback={<div className="h-16 bg-white border-b border-gray-200" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <Suspense fallback={<div className="p-8 text-center text-gray-500">লোড হচ্ছে...</div>}>
                {children}
              </Suspense>
            </main>
            <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
              <p>LiveExam Platform • Study Group Edition • Math, English, GK, Bangla</p>
            </footer>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
