import React, { useEffect } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function QuestionCard({ question, selectedOption, onSelectOption, disabled = false }) {
  const options = [
    { key: 'A', text: question.option_a, keyNum: '1' },
    { key: 'B', text: question.option_b, keyNum: '2' },
    { key: 'C', text: question.option_c, keyNum: '3' },
    { key: 'D', text: question.option_d, keyNum: '4' },
  ].filter(opt => opt.text && opt.text.trim() !== '');

  // Optional keyboard shortcuts for accessibility & rapid gameplay
  useEffect(() => {
    const validKeys = options.map(o => o.key);
    const validNums = options.map(o => o.keyNum);

    const handleKeyDown = (e) => {
      if (disabled) return;
      const key = e.key.toUpperCase();
      if (validKeys.includes(key)) {
        onSelectOption(key);
      } else if (validNums.includes(key)) {
        const matched = options.find(o => o.keyNum === key);
        if (matched) onSelectOption(matched.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onSelectOption, question]);

  return (
    <div className="w-full space-y-6">
      {/* Category & Points header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
          <span>📜</span>
          <span>{question.category || 'Philosophical Inquiry'}</span>
        </span>
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
          +{question.points || 5} Points
        </span>
      </div>

      {/* Question Text */}
      <div className="py-2">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-medium text-white leading-relaxed tracking-tight">
          {question.question_text}
        </h2>
      </div>

      {/* Answer Options Grid */}
      <div className="grid grid-cols-1 gap-3.5 pt-2">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.key;

          return (
            <button
              key={opt.key}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(opt.key)}
              className={`group w-full text-left quiz-option-card ${
                isSelected ? 'selected' : ''
              } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              {/* Option Key Badge */}
              <div
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm sm:text-base mr-3.5 transition-all duration-200 shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-md shadow-pink-500/30'
                    : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700 group-hover:text-white border border-white/10'
                }`}
              >
                {opt.key}
              </div>

              {/* Option Text */}
              <div className="flex-1 text-sm sm:text-base text-slate-200 group-hover:text-white leading-snug">
                {opt.text}
              </div>

              {/* Radio Check Indicator */}
              <div className="ml-3 shrink-0">
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 text-pink-400 animate-in zoom-in-50 duration-200" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-right text-[11px] text-slate-500 hidden sm:block">
        Tip: You can also press keys <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300">A</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300">B</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300">C</kbd> <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300">D</kbd>
      </div>
    </div>
  );
}
