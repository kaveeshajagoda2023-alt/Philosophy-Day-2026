import React, { useState } from 'react';
import { Trophy, Clock, CheckCircle2, XCircle, HelpCircle, Share2, RotateCcw, ArrowRight, Sparkles, Award } from 'lucide-react';
import ConfettiLauncher from '../components/Confetti';

export default function ResultsPage({ resultData, onPlayAgain, navigateTo }) {
  const [copied, setCopied] = useState(false);

  const {
    participant_name = 'Philosophical Inquirer',
    total_score = 0,
    max_possible_score = 100,
    correct_answers = 0,
    incorrect_answers = 0,
    unanswered_questions = 0,
    completion_time = 0,
    level2_answer = '',
    rank = null
  } = resultData || {};

  // Calculate philosophical archetype & motivational message
  const percentage = Math.round((total_score / max_possible_score) * 100);

  let archetype = {
    title: "The Socratic Inquirer",
    quote: "“The unexamined life is not worth living.” — Socrates",
    badge: "🦉 Socratic Scholar",
    message: "Excellent! You have a truly acute philosophical mind, probing assumptions and reasoning with analytical clarity.",
    color: "from-purple-500 to-pink-500"
  };

  if (percentage >= 90) {
    archetype = {
      title: "Philosopher King / Queen",
      quote: "“Until philosophers rule as kings, or those now called kings philosophy sincerely... cities will have no rest from evils.” — Plato",
      badge: "👑 Supreme Metaphysician",
      message: "Magnificent! A flawless display of philosophical acumen. You possess the dialectical mastery to govern the ideal Republic!",
      color: "from-amber-400 via-pink-500 to-purple-600"
    };
  } else if (percentage >= 70) {
    archetype = {
      title: "The Dialectical Thinker",
      quote: "“It is the mark of an educated mind to be able to entertain a thought without accepting it.” — Aristotle",
      badge: "🏛️ Enlightened Thinker",
      message: "Brilliant effort! You navigate ethical dilemmas and epistemological inquiries with impressive depth.",
      color: "from-blue-400 via-purple-500 to-pink-500"
    };
  } else if (percentage >= 50) {
    archetype = {
      title: "The Contemplative Seeker",
      quote: "“Cogito, ergo sum.” — René Descartes",
      badge: "📜 Seeking Reason",
      message: "Commendable! You grasp foundational questions of philosophy and possess a budding contemplative spirit.",
      color: "from-cyan-400 to-blue-500"
    };
  } else {
    archetype = {
      title: "The Curious Wonderer",
      quote: "“Wonder is the feeling of a philosopher, and philosophy begins in wonder.” — Plato",
      badge: "🌱 Seed of Wisdom",
      message: "Good beginning! True wisdom starts with knowing that you know nothing. Keep questioning everything!",
      color: "from-slate-400 to-purple-400"
    };
  }

  // Handle WhatsApp Sharing
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🏛️ Philosophy Day 2026 Quiz Challenge!\n\nI scored ${total_score}/100 as a "${archetype.title}" in ${completion_time}s!\n\nCan you beat my philosophical score? Test your wisdom here: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Copy results to clipboard
  const handleCopyLink = () => {
    const text = `Philosophy Day 2026: I scored ${total_score}/100 (${archetype.title}) in ${completion_time}s! Test your wisdom: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-10 px-4 sm:px-6">
      {/* Confetti burst for scores >= 70 */}
      <ConfettiLauncher trigger={percentage >= 70} />

      <div className="w-full max-w-2xl">
        {/* Main Result Card */}
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden text-center">
          {/* Decorative Top Gradient */}
          <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${archetype.color}`} />

          {/* Archetype Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-200 mb-6">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{archetype.badge}</span>
          </div>

          {/* Participant Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-2">
            {participant_name}
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto mb-6">
            {archetype.message}
          </p>

          {/* Big Score Display */}
          <div className="my-8 p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 max-w-sm mx-auto shadow-inner">
            <div className="text-xs uppercase tracking-widest text-slate-400 mb-1 font-semibold">
              Official Symposium Score
            </div>
            <div className="flex items-baseline justify-center gap-2">
              <span className={`text-6xl sm:text-7xl font-extrabold bg-gradient-to-r ${archetype.color} bg-clip-text text-transparent`}>
                {total_score}
              </span>
              <span className="text-2xl sm:text-3xl font-medium text-slate-500">
                / {max_possible_score}
              </span>
            </div>
            {rank && (
              <div className="mt-2 text-xs font-semibold text-amber-300 flex items-center justify-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Current Standing: Rank #{rank}</span>
              </div>
            )}
          </div>

          {/* Performance Breakdown Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 text-left">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Correct</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {correct_answers}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-1">
                <XCircle className="w-4 h-4" />
                <span>Incorrect</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {incorrect_answers}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-semibold mb-1">
                <HelpCircle className="w-4 h-4" />
                <span>Unanswered</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {unanswered_questions}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5">
              <div className="flex items-center gap-1.5 text-blue-400 text-xs font-semibold mb-1">
                <Clock className="w-4 h-4" />
                <span>Time Taken</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white">
                {completion_time}s
              </div>
            </div>
          </div>

          {/* Level 2 Submitted Reflection */}
          {level2_answer && (
            <div className="mb-8 p-5 rounded-2xl bg-slate-900/70 border border-amber-500/25 text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  ✨ Level 2 Reflection Submitted
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">Recorded ✓</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                “ඔබට අනුව, දර්ශනය මිනිසාගේ ජීවිතයට වැදගත් වන්නේ ඇයි?”
              </p>
              <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
                {level2_answer}
              </p>
            </div>
          )}

          {/* Philosophical Quote */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/20 italic text-xs sm:text-sm text-purple-200/90 font-serif mb-8">
            {archetype.quote}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('leaderboard')}
              className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm sm:text-base font-semibold"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>View Leaderboard</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-3 rounded-xl font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Summary'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
