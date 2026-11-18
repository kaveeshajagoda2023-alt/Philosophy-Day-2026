import React, { useState, useEffect } from 'react';
import { Trophy, Clock, RefreshCw, Search, Sparkles, Medal, Award, Crown, ArrowRight, User } from 'lucide-react';
import { fetchLeaderboard } from '../services/quizService';

export default function LeaderboardPage({ navigateTo }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadLeaderboardData = async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard(20);
      setLeaderboard(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  const filteredEntries = leaderboard.filter(entry => 
    entry.participant_name.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  // Top 3 Podium
  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  return (
    <div className="min-h-[calc(100vh-140px)] py-10 px-4 sm:px-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold mb-3">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Official Hall of Fame</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-display font-bold text-white mb-2">
          Symposium Leaderboard
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto">
          Ranked by highest score. Tied scores are decided by the fastest completion time.
        </p>
      </div>

      {/* Top 3 Podium Display */}
      {leaderboard.length >= 3 && !searchTerm && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 items-end">
          {/* 2nd Place */}
          {top2 && (
            <div className="order-2 sm:order-1 glass-card p-5 rounded-2xl border border-slate-400/20 text-center relative pt-8 bg-gradient-to-b from-slate-800/40 to-slate-900/60 sm:h-64 flex flex-col justify-end">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#0b0f19]">
                2
              </div>
              <Medal className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-white text-base truncate mb-1">
                {top2.participant_name}
              </h3>
              <div className="text-2xl font-extrabold text-slate-200 mb-1">
                {top2.total_score} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{top2.completion_time}s</span>
              </div>
            </div>
          )}

          {/* 1st Place (Gold / Champion) */}
          {top1 && (
            <div className="order-1 sm:order-2 glass-card p-6 rounded-3xl border border-amber-500/40 text-center relative pt-10 bg-gradient-to-b from-amber-500/10 via-slate-900/80 to-slate-900/90 shadow-2xl shadow-amber-500/10 sm:h-76 flex flex-col justify-end">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 flex items-center justify-center font-extrabold text-base shadow-lg ring-4 ring-[#0b0f19]">
                <Crown className="w-5 h-5 text-amber-950" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2 mx-auto">
                First Place
              </div>
              <h3 className="font-bold text-white text-lg sm:text-xl truncate mb-1">
                {top1.participant_name}
              </h3>
              <div className="text-4xl font-extrabold text-amber-400 mb-2">
                {top1.total_score} <span className="text-sm font-normal text-slate-400">pts</span>
              </div>
              <div className="text-xs text-amber-200/80 flex items-center justify-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Fastest: {top1.completion_time}s</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {top3 && (
            <div className="order-3 sm:order-3 glass-card p-5 rounded-2xl border border-amber-700/30 text-center relative pt-8 bg-gradient-to-b from-amber-950/20 to-slate-900/60 sm:h-56 flex flex-col justify-end">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-amber-700 text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-[#0b0f19]">
                3
              </div>
              <Award className="w-8 h-8 text-amber-600 mx-auto mb-2" />
              <h3 className="font-bold text-white text-base truncate mb-1">
                {top3.participant_name}
              </h3>
              <div className="text-2xl font-extrabold text-amber-500 mb-1">
                {top3.total_score} <span className="text-xs font-normal text-slate-400">pts</span>
              </div>
              <div className="text-xs text-slate-400 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{top3.completion_time}s</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table Container */}
      <div className="glass-panel p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl">
        {/* Controls Bar: Search & Refresh */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by participant name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-[11px] text-slate-400">
              Refreshed: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <button
              onClick={loadLeaderboardData}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-medium transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3 text-center w-16">Rank</th>
                <th className="py-3 px-4">Participant</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-500 text-sm">
                    {searchTerm ? `No participants matching "${searchTerm}"` : 'No quiz records recorded yet. Be the first!'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => {
                  const rankNum = entry.rank || index + 1;
                  const isTop1 = rankNum === 1;
                  const isTop2 = rankNum === 2;
                  const isTop3 = rankNum === 3;

                  let rankBadge = (
                    <span className="font-semibold text-slate-400">#{rankNum}</span>
                  );

                  if (isTop1) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-bold text-xs shadow-md">
                        🥇 1
                      </span>
                    );
                  } else if (isTop2) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-bold text-xs shadow-md">
                        🥈 2
                      </span>
                    );
                  } else if (isTop3) {
                    rankBadge = (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-bold text-xs shadow-md">
                        🥉 3
                      </span>
                    );
                  }

                  return (
                    <tr 
                      key={entry.id || `${entry.participant_name}-${index}`}
                      className="hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 px-3 text-center">
                        {rankBadge}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-400/60" />
                        <span>{entry.participant_name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-base text-purple-300">
                          {entry.total_score}
                        </span>
                        <span className="text-xs text-slate-500"> / 100</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs sm:text-sm text-slate-300">
                        {entry.completion_time}s
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer CTA */}
        <div className="mt-8 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Have you tested your philosophical knowledge yet?
          </p>
          <button
            onClick={() => navigateTo('entry')}
            className="btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-5"
          >
            <span>Play Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
