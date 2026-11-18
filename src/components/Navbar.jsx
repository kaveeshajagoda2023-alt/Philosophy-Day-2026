import React, { useState } from 'react';
import { Sparkles, Trophy, ShieldCheck, Home, Menu, X, BookOpen } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

export default function Navbar({ currentPage, navigateTo }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (page) => {
    navigateTo(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/10 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => handleNav('welcome')} 
          className="flex items-center gap-3 cursor-pointer group py-2"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-500 to-amber-400 p-[2px] transition-transform group-hover:scale-105 shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-[#0d1322] rounded-[10px] flex items-center justify-center text-lg">
              🏛️
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base sm:text-lg bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                PHILOSOPHY DAY 2026
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Philosophy Club
              </span>
            </div>
            <p className="text-[11px] text-slate-400 italic hidden sm:block tracking-wide">
              "Think. Question. Discover."
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => handleNav('welcome')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === 'welcome'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>

          <button
            onClick={() => handleNav('entry')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === 'entry' || currentPage === 'quiz'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            Play Quiz
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-2" />

          <button
            onClick={() => handleNav('admin')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              currentPage === 'admin'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Organisers Only"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Organiser Login
          </button>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-5 space-y-2 bg-[#0e1628] border-b border-white/10 shadow-2xl animate-in slide-in-from-top-2">
          <button
            onClick={() => handleNav('welcome')}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium text-slate-200 hover:bg-purple-500/10 hover:text-purple-300"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
          <button
            onClick={() => handleNav('entry')}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium text-pink-300 hover:bg-pink-500/10"
          >
            <Sparkles className="w-4 h-4 text-pink-400" />
            Play Quiz
          </button>
          <button
            onClick={() => handleNav('admin')}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-left text-sm font-medium text-blue-300 hover:bg-blue-500/10"
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            Organiser Dashboard
          </button>
        </div>
      )}
    </header>
  );
}
