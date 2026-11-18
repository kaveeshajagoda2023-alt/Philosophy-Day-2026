import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, X, Star } from 'lucide-react';

const GIFT_MESSAGE =
  'ඔබේ ගමනේ අඳුරුම කාලවලට බිය නොවන්න. මන්ද, තාරකාවලට පවා තම ආලෝකය විහිදුවීමට අඳුර අවශ්‍යයයි';

export default function GiftBoxPopup({ isOpen, onClose, participantName }) {
  const [isOpened, setIsOpened] = useState(false);

  if (!isOpen) return null;

  const handleOpenGift = () => {
    if (isOpened) return;
    setIsOpened(true);

    // Starry gold & purple confetti burst when gift opens
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#fde047', '#f59e0b', '#a855f7', '#ec4899', '#38bdf8']
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={isOpened ? onClose : undefined}
    >
      <div
        className="relative max-w-md w-full rounded-3xl border border-amber-400/35 bg-gradient-to-b from-[#151c32] via-[#101628] to-[#0a0f1d] p-7 sm:p-9 text-center shadow-[0_0_60px_rgba(168,85,247,0.35)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Starry Background Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button (visible once opened) */}
        {isOpened && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close gift popup"
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* STATE 1: CLOSED GIFT BOX */}
        {!isOpened ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Philosophy Day 2026 Special Gift</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-2">
              A Gift For You{participantName ? `, ${participantName.split(' ')[0]}` : ''}!
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 mb-7">
              Thank you for completing the quiz. Tap the gift box below to open your special philosophical message!
            </p>

            {/* Interactive Animated Gift Box */}
            <button
              type="button"
              onClick={handleOpenGift}
              className="group relative focus:outline-none cursor-pointer my-2"
              aria-label="Open Gift Box"
            >
              {/* Pulsing aura behind gift */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/40 via-pink-500/40 to-purple-500/40 rounded-full blur-2xl scale-125 group-hover:scale-150 transition-transform duration-500 animate-pulse" />

              {/* Custom SVG Gift Box with Wiggle / Bounce */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center animate-gift-bounce group-hover:scale-110 active:scale-95 transition-transform duration-300">
                <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-[0_14px_25px_rgba(245,158,11,0.45)]">
                  <defs>
                    <linearGradient id="boxBody" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="boxLid" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F43F5E" />
                    </linearGradient>
                    <linearGradient id="ribbonGold" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FEF08A" />
                      <stop offset="50%" stopColor="#FACC15" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                  </defs>

                  {/* Bow Loops */}
                  <path d="M80 48 C58 18, 28 32, 46 52 C56 62, 72 56, 80 50 Z" fill="url(#ribbonGold)" />
                  <path d="M80 48 C102 18, 132 32, 114 52 C104 62, 88 56, 80 50 Z" fill="url(#ribbonGold)" />
                  <circle cx="80" cy="48" r="8" fill="#FEF08A" />

                  {/* Box Lid */}
                  <rect x="22" y="48" width="116" height="24" rx="7" fill="url(#boxLid)" />
                  {/* Box Body */}
                  <rect x="30" y="72" width="100" height="72" rx="10" fill="url(#boxBody)" />

                  {/* Vertical Gold Ribbon */}
                  <rect x="70" y="48" width="20" height="96" fill="url(#ribbonGold)" />
                  {/* Horizontal Gold Ribbon */}
                  <rect x="30" y="98" width="100" height="16" fill="url(#ribbonGold)" opacity="0.9" />

                  {/* Sparkle Stars */}
                  <circle cx="24" cy="34" r="3" fill="#FDE047" />
                  <circle cx="138" cy="40" r="2.5" fill="#FDE047" />
                  <circle cx="142" cy="110" r="2" fill="#E879F9" />
                </svg>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenGift}
              className="mt-6 btn-primary px-7 py-3 text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>🎁 Click to Open Gift Box</span>
            </button>
          </div>
        ) : (
          /* STATE 2: OPENED GIFT MESSAGE */
          <div className="relative z-10 flex flex-col items-center animate-in zoom-in-90 fade-in duration-500">
            {/* Twinkling Stars Row */}
            <div className="flex items-center justify-center gap-3 mb-4 text-amber-300">
              <Star className="w-4 h-4 fill-amber-300 animate-pulse" />
              <Star className="w-6 h-6 fill-yellow-300 animate-bounce" />
              <Star className="w-4 h-4 fill-amber-300 animate-pulse" />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-4">
              ✨ Philosophy Club • Special Message
            </span>

            {/* The Sinhala Philosophical Quote */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-950/70 via-slate-900/90 to-indigo-950/80 border border-amber-400/40 shadow-inner mb-6">
              <p className="text-lg sm:text-xl font-semibold text-amber-100 leading-relaxed">
                “{GIFT_MESSAGE}”
              </p>
            </div>

            <p className="text-xs text-slate-400 mb-6">
              PHILOSOPHY DAY 2026 • Think. Question. Discover.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="w-full btn-primary py-3 text-sm font-semibold"
            >
              Continue to My Summary
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
