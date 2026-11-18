import React from 'react';

/**
 * Aristotle Classical Greek Bust SVG
 * Inspired by the classical Roman marble bust of Aristotle (384–322 BCE)
 */
export default function AristotleBust({ className = "w-32 h-40", glow = true }) {
  return (
    <div className={`relative inline-block ${className}`}>
      {glow && (
        <div className="absolute inset-0 bg-gradient-to-t from-purple-600/30 via-pink-500/20 to-amber-400/30 rounded-full blur-2xl -z-10 animate-pulse pointer-events-none" />
      )}
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_15px_25px_rgba(121,40,202,0.45)] select-none"
      >
        <defs>
          <linearGradient id="marbleGradient" x1="40" y1="20" x2="160" y2="220" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F8FAFC" />
            <stop offset="0.4" stopColor="#E2E8F0" />
            <stop offset="0.75" stopColor="#CBD5E1" />
            <stop offset="1" stopColor="#94A3B8" />
          </linearGradient>

          <linearGradient id="hairGradient" x1="60" y1="10" x2="140" y2="120" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E2E8F0" />
            <stop offset="0.5" stopColor="#94A3B8" />
            <stop offset="1" stopColor="#64748B" />
          </linearGradient>

          <linearGradient id="robeGradient" x1="30" y1="140" x2="170" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A855F7" />
            <stop offset="0.5" stopColor="#6366F1" />
            <stop offset="1" stopColor="#312E81" />
          </linearGradient>

          <linearGradient id="goldLaurel" x1="50" y1="40" x2="150" y2="70" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE047" />
            <stop offset="0.5" stopColor="#EAB308" />
            <stop offset="1" stopColor="#CA8A04" />
          </linearGradient>

          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ethereal Head Halo / Light of Reason */}
        <ellipse cx="100" cy="85" rx="72" ry="75" fill="url(#marbleGradient)" fillOpacity="0.08" />
        <circle cx="100" cy="85" r="68" stroke="url(#goldLaurel)" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />

        {/* Head Silhouette Base */}
        <path
          d="M68 62 C65 35, 135 35, 132 62 C138 80, 136 115, 126 135 C116 150, 84 150, 74 135 C64 115, 62 80, 68 62 Z"
          fill="url(#marbleGradient)"
        />

        {/* Aristotle's Characteristic Curly Hair */}
        <g fill="url(#hairGradient)">
          <circle cx="70" cy="42" r="14" />
          <circle cx="85" cy="34" r="15" />
          <circle cx="100" cy="30" r="16" />
          <circle cx="115" cy="34" r="15" />
          <circle cx="130" cy="42" r="14" />
          <circle cx="62" cy="56" r="13" />
          <circle cx="138" cy="56" r="13" />
          <circle cx="60" cy="72" r="12" />
          <circle cx="140" cy="72" r="12" />
          <circle cx="62" cy="88" r="10" />
          <circle cx="138" cy="88" r="10" />
        </g>

        {/* Golden Laurel Wreath (Crown of Philosophy & Virtue) */}
        <g fill="url(#goldLaurel)" opacity="0.95">
          <path d="M72 48 Q64 42 70 38 Q78 40 76 46 Z" />
          <path d="M84 42 Q78 34 84 32 Q90 36 88 42 Z" />
          <path d="M98 38 Q95 28 102 28 Q105 34 102 40 Z" />
          <path d="M112 42 Q118 34 124 36 Q122 44 116 44 Z" />
          <path d="M124 48 Q132 42 136 46 Q130 52 126 50 Z" />
          <circle cx="100" cy="34" r="3" fill="#FEF08A" />
        </g>

        {/* Facial Contours & Features (Philosophic Gaze) */}
        {/* Forehead wrinkles (contemplation) */}
        <path d="M82 58 Q100 55 118 58" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M85 64 Q100 61 115 64" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

        {/* Strong Greek Eyebrows */}
        <path d="M76 75 C82 72, 90 73, 94 76" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
        <path d="M106 76 C110 73, 118 72, 124 75" stroke="#475569" strokeWidth="3" strokeLinecap="round" />

        {/* Eyes (Reflective) */}
        <ellipse cx="85" cy="82" rx="5" ry="3" fill="#334155" />
        <ellipse cx="115" cy="82" rx="5" ry="3" fill="#334155" />
        <circle cx="86" cy="81" r="1" fill="#FFFFFF" />
        <circle cx="116" cy="81" r="1" fill="#FFFFFF" />

        {/* Classic Aquiline Greek Nose */}
        <path d="M100 74 L97 98 L104 98" stroke="#64748B" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Aristotle's Dense Greek Beard */}
        <g fill="url(#hairGradient)">
          <path d="M74 102 C68 118, 70 148, 86 160 C96 168, 104 168, 114 160 C130 148, 132 118, 126 102 C120 115, 115 110, 100 110 C85 110, 80 115, 74 102 Z" />
          {/* Beard Curls Texture */}
          <circle cx="82" cy="120" r="7" />
          <circle cx="95" cy="124" r="8" />
          <circle cx="108" cy="124" r="8" />
          <circle cx="118" cy="120" r="7" />
          <circle cx="88" cy="138" r="8" />
          <circle cx="100" cy="144" r="9" />
          <circle cx="112" cy="138" r="8" />
          <circle cx="100" cy="158" r="7" />
        </g>

        {/* Mustache */}
        <path
          d="M86 104 C92 108, 98 107, 100 109 C102 107, 108 108, 114 104 C118 108, 114 116, 100 115 C86 116, 82 108, 86 104 Z"
          fill="#64748B"
        />

        {/* Classical Greek Draped Robe (Himation / Toga) */}
        <path
          d="M50 165 C38 178, 30 200, 25 230 L175 230 C170 200, 162 178, 150 165 C135 155, 125 152, 112 158 C100 162, 88 158, 75 155 C62 152, 55 158, 50 165 Z"
          fill="url(#robeGradient)"
        />

        {/* Robe Folds / Classical Drapery */}
        <path d="M52 175 Q85 195 100 230" stroke="#C084FC" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" fill="none" />
        <path d="M148 175 Q115 195 100 230" stroke="#818CF8" strokeWidth="2" opacity="0.6" strokeLinecap="round" fill="none" />
        <path d="M68 190 Q95 210 115 230" stroke="#C084FC" strokeWidth="1.8" opacity="0.5" strokeLinecap="round" fill="none" />
        <path d="M132 190 Q105 210 85 230" stroke="#818CF8" strokeWidth="1.8" opacity="0.5" strokeLinecap="round" fill="none" />

        {/* Golden Clasp / Brooch */}
        <circle cx="62" cy="172" r="5" fill="url(#goldLaurel)" />
        <circle cx="62" cy="172" r="2.5" fill="#FEF08A" />

        {/* Pedestal Base with Classical Inscription */}
        <rect x="35" y="224" width="130" height="14" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1.5" />
        <text
          x="100"
          y="234"
          textAnchor="middle"
          fontSize="7.5"
          fontWeight="bold"
          letterSpacing="1.8"
          fill="#F59E0B"
          fontFamily="serif"
        >
          ΑΡΙΣΤΟΤΕΛΗΣ • ARISTOTLE
        </text>
      </svg>
    </div>
  );
}
