import React from 'react';
import { Heart, Sparkles, Shield, Compass } from 'lucide-react';

export default function Footer({ navigateTo }) {
  return (
    <footer className="w-full border-t border-white/5 bg-[#080c14] py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 text-center md:text-left">
            <span className="text-2xl">🏛️</span>
            <div>
              <h4 className="text-sm font-bold tracking-wider text-slate-200">
                PHILOSOPHY DAY 2026
              </h4>
              <p className="text-xs text-slate-400">
                Organized by the Philosophy Club • Annual Symposium & Challenge
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
            <button 
              onClick={() => navigateTo('welcome')}
              className="hover:text-purple-400 transition-colors"
            >
              Event Overview
            </button>
            <button 
              onClick={() => navigateTo('leaderboard')}
              className="hover:text-amber-400 transition-colors"
            >
              Leaderboard
            </button>
            <button 
              onClick={() => navigateTo('admin')}
              className="hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              Organiser Portal
            </button>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right">
            <p className="flex items-center justify-center md:justify-end gap-1.5">
              <span>"Wonder is the beginning of wisdom"</span>
              <Compass className="w-3.5 h-3.5 text-purple-400" />
            </p>
            <p className="mt-1 text-[11px] text-slate-600">
              © 2026 Philosophy Club. Built with React, Vite & Supabase.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
