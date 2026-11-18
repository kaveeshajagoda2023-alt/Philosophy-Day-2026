import React from 'react';

export default function ProgressBar({ current, total }) {
  const percentage = Math.round((current / total) * 100);

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-xs sm:text-sm font-medium text-slate-300">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          <span className="font-semibold text-white">Question {current}</span>
          <span className="text-slate-500">of {total}</span>
        </span>
        <span className="font-bold text-purple-400">{percentage}%</span>
      </div>

      <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-all duration-500 ease-out shadow-lg shadow-purple-500/50"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Question step indicator dots */}
      <div className="flex items-center justify-between pt-1 px-1">
        {Array.from({ length: total }, (_, i) => {
          const stepNum = i + 1;
          const isDone = stepNum < current;
          const isCurrent = stepNum === current;

          return (
            <div
              key={stepNum}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-purple-500 scale-100'
                  : isCurrent
                  ? 'bg-pink-400 ring-2 ring-pink-400/40 scale-125'
                  : 'bg-slate-700/60'
              }`}
              title={`Question ${stepNum}`}
            />
          );
        })}
      </div>
    </div>
  );
}
