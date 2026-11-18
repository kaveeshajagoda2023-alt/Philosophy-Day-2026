import React, { useState } from 'react';
import { CheckCircle2, HelpCircle, Share2, Home, Sparkles, ShieldCheck, BookOpen } from 'lucide-react';
import ConfettiLauncher from '../components/Confetti';

export default function ResultsPage({ resultData, navigateTo }) {
  const [copied, setCopied] = useState(false);

  const {
    participant_name = 'Philosophy Participant',
    total_questions = 20,
    answered_questions = 0,
    unanswered_questions = 0,
    level2_answer = ''
  } = resultData || {};

  // Invite friends without revealing any score
  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🏛️ Philosophy Day 2026 – Philosophy Club Quiz Challenge!\n\nI just completed Level 1 & Level 2 of the Philosophy Day 2026 quiz.\n\nTry it yourself here: ${window.location.origin}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-10 px-4 sm:px-6">
      <ConfettiLauncher trigger={true} />

      <div className="w-full max-w-2xl">
        <div className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden text-center">
          {/* Decorative Top Gradient */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-xs sm:text-sm font-semibold text-emerald-300 mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Submission Recorded Successfully</span>
          </div>

          {/* Participant Name */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-2">
            Thank you, {participant_name}!
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
            Your Level 1 and Level 2 responses for <strong>Philosophy Day 2026</strong> have been securely recorded. Official results will be reviewed and announced by the <strong>Philosophy Club</strong>.
          </p>

          {/* Participant's Own Participation Summary (NO Score Revealed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-emerald-500/25">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Questions Answered</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">
                  {answered_questions}
                </span>
                <span className="text-base text-slate-400 font-medium">
                  / {total_questions}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Level 1 questions you submitted an answer for
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-amber-500/25">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <HelpCircle className="w-4 h-4" />
                <span>Questions Not Answered</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">
                  {unanswered_questions}
                </span>
                <span className="text-base text-slate-400 font-medium">
                  / {total_questions}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Level 1 questions left unanswered or timed out
              </p>
            </div>
          </div>

          {/* Participant's Own Level 2 Reflection */}
          {level2_answer && (
            <div className="mb-8 p-5 rounded-2xl bg-slate-900/70 border border-purple-500/25 text-left">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-pink-400" />
                  <span>Your Level 2 Reflection</span>
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold">Saved ✓</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">
                “ඔබට අනුව, දර්ශනය මිනිසාගේ ජීවිතයට වැදගත් වන්නේ ඇයි?”
              </p>
              <p className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
                {level2_answer}
              </p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="mb-8 p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-center justify-center gap-2.5 text-xs text-purple-200/90">
            <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Scores and rankings are kept private and visible only to the Philosophy Club organisers.</span>
          </div>

          {/* Philosophical Closing Quote */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 italic text-xs sm:text-sm text-slate-300 font-serif mb-8">
            “Wonder is the beginning of wisdom.” — Socrates
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigateTo('welcome')}
              className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3 px-6 text-sm sm:text-base font-semibold"
            >
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="w-full sm:w-auto px-5 py-3 rounded-xl font-semibold text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 transition-all flex items-center justify-center gap-2 text-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Quiz on WhatsApp</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="w-full sm:w-auto px-4 py-3 rounded-xl font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm"
            >
              {copied ? 'Link Copied!' : 'Copy Quiz Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
