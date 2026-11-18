import React, { useState, useEffect } from 'react';
import AristotleBust from './AristotleBust';
import { Sparkles, MessageCircle, ArrowUp, RefreshCw } from 'lucide-react';

const ARISTOTLE_QUOTES = [
  "“Knowing yourself is the beginning of all wisdom.”",
  "“We are what we repeatedly do. Excellence, then, is not an act, but a habit.”",
  "“It is the mark of an educated mind to be able to entertain a thought without accepting it.”",
  "“Educating the mind without educating the heart is no education at all.”",
  "“Hope is a waking dream.”",
  "“Happiness depends upon ourselves.”"
];

export default function AristotleFloatingAnimation({ mode = "interactive" }) {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [showQuote, setShowQuote] = useState(true);
  const [isAscending, setIsAscending] = useState(false);
  const [ascentKey, setAscentKey] = useState(0);

  const quote = ARISTOTLE_QUOTES[currentQuoteIndex];

  // Rotate quotes periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % ARISTOTLE_QUOTES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Trigger dedicated "Down to Up" flight animation
  const handleTriggerAscent = () => {
    setIsAscending(true);
    setAscentKey((prev) => prev + 1);
    setCurrentQuoteIndex((prev) => (prev + 1) % ARISTOTLE_QUOTES.length);
    setTimeout(() => {
      setIsAscending(false);
    }, 4000);
  };

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. BACKGROUND ETHEREAL RISING ARISTOTLE SILHOUETTES (DOWN TO UP) */}
      {/* ------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Subtle rising Aristotle 1 (Left side, moving down to up) */}
        <div 
          className="absolute left-[5%] bottom-[-150px] opacity-15 animate-aristotle-stream"
          style={{ animationDuration: '18s', animationDelay: '0s' }}
        >
          <div className="scale-75">
            <AristotleBust glow={false} />
          </div>
        </div>

        {/* Subtle rising Aristotle 2 (Right side, moving down to up) */}
        <div 
          className="absolute right-[8%] bottom-[-150px] opacity-20 animate-aristotle-stream"
          style={{ animationDuration: '22s', animationDelay: '6s' }}
        >
          <div className="scale-90">
            <AristotleBust glow={false} />
          </div>
        </div>

        {/* Subtle rising Aristotle 3 (Center-right, slower ascent) */}
        <div 
          className="absolute left-[70%] bottom-[-150px] opacity-10 animate-aristotle-stream"
          style={{ animationDuration: '28s', animationDelay: '12s' }}
        >
          <div className="scale-50">
            <AristotleBust glow={false} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. FULL-SCREEN ASCENDING ARISTOTLE (TRIGGERED DOWN-TO-UP FLIGHT) */}
      {/* ------------------------------------------------------------- */}
      {isAscending && (
        <div 
          key={ascentKey}
          className="fixed left-1/2 -translate-x-1/2 pointer-events-none z-50 animate-aristotle-full-ascent"
        >
          <div className="flex flex-col items-center">
            {/* Ethereal Glow Trail */}
            <div className="w-32 h-44 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/50 via-purple-600/40 to-transparent rounded-full blur-2xl animate-pulse" />
              <AristotleBust className="w-32 h-44" glow={true} />
            </div>
            {/* Ascending Wisdom Banner */}
            <div className="mt-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-900/90 via-slate-900/95 to-amber-900/90 border border-amber-400/50 text-amber-200 text-xs sm:text-sm font-serif italic shadow-2xl backdrop-blur-md max-w-xs text-center">
              🏛️ Aristotle ascends: "Excellence is a habit!"
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. HERO / INTERACTIVE ARISTOTLE FLOATING WIDGET (DOWN TO UP LEVITATION) */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-10 flex flex-col items-center my-6 group">
        {/* Aristotle Speech Bubble (Interactive Quote) */}
        {showQuote && (
          <div className="mb-4 max-w-sm px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900/90 to-indigo-950/80 border border-purple-400/30 text-center shadow-xl backdrop-blur-md relative animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-xs sm:text-sm text-purple-200 font-serif italic leading-relaxed">
              {quote}
            </p>
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 mt-1">
              — Aristotle (Αριστοτέλης)
            </div>
            {/* Speech Bubble Arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-b border-r border-purple-400/30 transform rotate-45" />
          </div>
        )}

        {/* Floating Aristotle Figure (Down to Up Continuous Levitation) */}
        <div 
          onClick={handleTriggerAscent}
          className="relative cursor-pointer transition-transform duration-300 hover:scale-110 active:scale-95 animate-aristotle-down-to-up"
          title="Click Aristotle to watch him ascend!"
        >
          {/* Ethereal Platform Glow */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-28 h-6 bg-purple-500/30 rounded-[100%] blur-md animate-pulse" />
          
          <AristotleBust className="w-36 h-44 sm:w-44 sm:h-52" glow={true} />

          {/* Interactive Floating Sparkle Pill */}
          <div className="absolute -top-2 -right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-bold shadow-lg shadow-purple-500/40 animate-bounce">
            <ArrowUp className="w-3 h-3 animate-pulse" />
            <span>Click to Ascend</span>
          </div>
        </div>

        {/* Mini Trigger Control */}
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerAscent}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-400/40 text-[11px] font-medium text-purple-300 transition-all shadow-sm"
          >
            <ArrowUp className="w-3 h-3 text-amber-400" />
            <span>Aristotle Rise Animation (Down to Up)</span>
          </button>
        </div>
      </div>
    </>
  );
}
