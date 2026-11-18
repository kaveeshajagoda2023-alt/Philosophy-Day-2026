import React, { useState } from 'react';
import { ArrowRight, UserCheck, Shield, AlertCircle, ArrowLeft, Sparkles, BookOpen } from 'lucide-react';
import { startQuizSession } from '../services/quizService';

export default function ParticipantEntryPage({ onSessionStarted, navigateTo }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();

    if (!cleanFirst) {
      setError('Please enter your First Name.');
      return;
    }
    if (!cleanLast) {
      setError('Please enter your Surname.');
      return;
    }

    setIsLoading(true);

    try {
      const sessionData = await startQuizSession(cleanFirst, cleanLast);
      onSessionStarted(sessionData);
    } catch (err) {
      if (err.isAttemptBlocked || err.message.includes('already completed')) {
        setError(`Participant "${cleanFirst} ${cleanLast}" has already completed the quiz. Under symposium rules, each participant has one official attempt.`);
      } else {
        setError(err.message || 'Unable to start quiz session. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <button
          onClick={() => navigateTo('welcome')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to Overview
        </button>

        {/* Entry Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          {/* Top Decorative Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400" />

          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30 mb-3">
              🏛️
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
              Participant Entry
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter your name to initiate your official symposium session
            </p>
          </div>

          {/* Privacy & No-Account Reassurance Callout */}
          <div className="mb-6 p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex items-start gap-3">
            <Shield className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <p className="text-xs text-purple-200/90 leading-relaxed">
              <strong>Open Access:</strong> No email, password, or account needed. Your name is only used to display your score on the public leaderboard.
            </p>
          </div>

          {/* Error Message Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label 
                htmlFor="firstName" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                First Name <span className="text-pink-400">*</span>
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Maya, David, Aisha"
                disabled={isLoading}
                autoFocus
                maxLength={40}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <div>
              <label 
                htmlFor="lastName" 
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Surname <span className="text-pink-400">*</span>
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Chen, Taylor, Okafor"
                disabled={isLoading}
                maxLength={40}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3.5 text-base font-semibold mt-4 shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Preparing Quiz Session...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-5 h-5" />
                  <span>Start Philosophy Challenge</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Session Rules Summary */}
          <div className="mt-6 pt-4 border-t border-white/5 text-center text-[11px] text-slate-500 flex items-center justify-center gap-3">
            <span>⏱️ 20s / Question</span>
            <span>•</span>
            <span>⚡ 20 Questions</span>
            <span>•</span>
            <span>🎯 100 Max Score</span>
          </div>
        </div>
      </div>
    </div>
  );
}
