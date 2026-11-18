import React, { useEffect, useState } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export default function Timer({ duration = 20, onExpire, questionIndex }) {
  const [timeLeft, setTimeLeft] = useState(duration);

  // Reset timer whenever question changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [questionIndex, duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onExpire]);

  // Color dynamic states
  const percent = (timeLeft / duration) * 100;
  const isDanger = timeLeft <= 5;
  const isWarning = timeLeft > 5 && timeLeft <= 10;

  let colorClasses = 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30';
  let barGradient = 'from-cyan-500 to-blue-500';

  if (isDanger) {
    colorClasses = 'text-rose-400 border-rose-500/60 bg-rose-950/40 animate-pulse';
    barGradient = 'from-rose-500 to-red-600';
  } else if (isWarning) {
    colorClasses = 'text-amber-400 border-amber-500/50 bg-amber-950/30';
    barGradient = 'from-amber-400 to-orange-500';
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-bold tracking-wider transition-all duration-300 ${colorClasses}`}>
        {isDanger ? (
          <AlertTriangle className="w-4 h-4 animate-bounce" />
        ) : (
          <Clock className="w-4 h-4" />
        )}
        <span>{timeLeft}s</span>
      </div>

      {/* Micro progress line */}
      <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden border border-white/5">
        <div 
          className={`h-full bg-gradient-to-r ${barGradient} transition-all duration-1000 ease-linear rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
