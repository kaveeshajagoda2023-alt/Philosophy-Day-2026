import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Users, 
  Trophy, 
  Clock, 
  Download, 
  Search, 
  CheckCircle, 
  XCircle, 
  HelpCircle, 
  Lock, 
  LogOut, 
  Settings, 
  BookOpen, 
  ToggleLeft, 
  ToggleRight,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { 
  adminLogin, 
  adminLogout, 
  getAdminSession, 
  fetchAdminMetrics, 
  fetchAdminResults, 
  fetchAdminQuestions, 
  toggleQuestionActive,
  resetParticipantAttempt
} from '../services/quizService';
import { isSupabaseConfigured } from '../services/supabase';

export default function AdminPage({ navigateTo }) {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dashboard Data State
  const [metrics, setMetrics] = useState({
    total_participants: 0,
    total_completed: 0,
    highest_score: 0,
    average_score: 0,
    average_time: 0
  });
  const [results, setResults] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('score_desc');
  const [activeTab, setActiveTab] = useState('results'); // 'results' | 'questions' | 'settings'
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');

  // Check initial session
  useEffect(() => {
    const existing = getAdminSession();
    if (existing) {
      setSession(existing);
    }
  }, []);

  // Fetch admin dashboard data once logged in
  const loadAdminData = async () => {
    setIsLoadingData(true);
    try {
      const [metricsData, resultsData, questionsData] = await Promise.all([
        fetchAdminMetrics(),
        fetchAdminResults(),
        fetchAdminQuestions()
      ]);
      setMetrics(metricsData);
      setResults(resultsData || []);
      setQuestions(questionsData || []);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadAdminData();
    }
  }, [session]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      const authResult = await adminLogin(email, password);
      setSession(authResult);
    } catch (err) {
      setAuthError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await adminLogout();
    setSession(null);
  };

  // Handle Question Toggle
  const handleToggleQuestion = async (id, currentStatus) => {
    try {
      await toggleQuestionActive(id, !currentStatus);
      setQuestions(prev => 
        prev.map(q => q.id === id ? { ...q, is_active: !currentStatus } : q)
      );
      setActionSuccess('Question status updated successfully.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      alert('Failed to update question: ' + err.message);
    }
  };

  // Export Results to CSV
  const handleExportCSV = () => {
    if (!results || results.length === 0) {
      alert('No results available to export.');
      return;
    }

    const headers = ['Rank', 'Participant Name', 'Total Score', 'Correct Answers', 'Incorrect Answers', 'Unanswered', 'Completion Time (seconds)', 'Submission Timestamp'];
    const rows = results.map((r, idx) => [
      r.rank || idx + 1,
      `"${r.participant_name.replace(/"/g, '""')}"`,
      r.total_score,
      r.correct_answers,
      r.incorrect_answers,
      r.unanswered_questions,
      r.completion_time,
      `"${r.completed_at || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `philosophy_day_2026_results_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sort results
  const filteredResults = results
    .filter(r => r.participant_name.toLowerCase().includes(searchTerm.toLowerCase().trim()))
    .sort((a, b) => {
      if (sortBy === 'score_desc') return b.total_score - a.total_score || a.completion_time - b.completion_time;
      if (sortBy === 'score_asc') return a.total_score - b.total_score;
      if (sortBy === 'time_asc') return a.completion_time - b.completion_time;
      if (sortBy === 'name_asc') return a.participant_name.localeCompare(b.participant_name);
      return 0;
    });

  // -------------------------------------------------------------
  // VIEW 1: ORGANISER AUTHENTICATION SCREEN
  // -------------------------------------------------------------
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center py-12 px-4 sm:px-6">
        <div className="w-full max-w-md">
          <div className="glass-panel p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/30 mb-3">
                <Lock className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white mb-1">
                Organiser Portal
              </h2>
              <p className="text-xs text-slate-400">
                Philosophy Club Committee & Quiz Administrators
              </p>
            </div>

            {/* Supabase status badge */}
            <div className="mb-5 p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Authentication Engine:</span>
              <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isSupabaseConfigured ? '● Supabase Auth' : '● Local Admin Auth'}
              </span>
            </div>

            {authError && (
              <div className="mb-5 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Organiser Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@philosophyday.edu"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isAuthenticating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authenticate Dashboard</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <button
                onClick={() => navigateTo('welcome')}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← Return to Public Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: AUTHENTICATED ORGANISER DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-[calc(100vh-140px)] py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white">
              Organiser Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
              Admin Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Philosophy Day 2026 Event Administration & Real-Time Monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadAdminData}
            disabled={isLoadingData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-xs font-semibold text-emerald-300 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-xs font-medium text-rose-300 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-medium animate-in fade-in">
          ✓ {actionSuccess}
        </div>
      )}

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-8">
        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Total Participants</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.total_participants}
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Completed Quizzes</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics.total_completed}
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Highest Score</span>
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {metrics.highest_score} <span className="text-xs text-slate-500">/ 100</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <Award className="w-3.5 h-3.5 text-purple-400" />
            <span>Average Score</span>
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {metrics.average_score} <span className="text-xs text-slate-500">pts</span>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-white/5 col-span-2 lg:col-span-1">
          <div className="text-slate-400 text-xs font-medium flex items-center gap-1.5 mb-1">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Avg Completion Time</span>
          </div>
          <div className="text-2xl font-bold text-cyan-300">
            {metrics.average_time}s
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-white/10 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('results')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'results'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participant Results ({results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'questions'
              ? 'border-purple-500 text-purple-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Question Manager ({questions.length})</span>
        </button>
      </div>

      {/* TAB 1: RESULTS TABLE */}
      {activeTab === 'results' && (
        <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-2xl">
          {/* Controls: Search & Sort */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search participant name..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-400">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="score_desc">Highest Score First</option>
                <option value="score_asc">Lowest Score First</option>
                <option value="time_asc">Fastest Completion Time</option>
                <option value="name_asc">Participant Name (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-3 text-center">Rank</th>
                  <th className="py-3 px-4">Participant</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center text-emerald-400">Correct</th>
                  <th className="py-3 px-3 text-center text-rose-400">Incorrect</th>
                  <th className="py-3 px-3 text-center text-amber-400">Unanswered</th>
                  <th className="py-3 px-4 text-right">Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500 text-sm">
                      No matching participant results found.
                    </td>
                  </tr>
                ) : (
                  filteredResults.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-white/[0.03]">
                      <td className="py-3.5 px-3 text-center font-bold text-slate-400">
                        #{r.rank || idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white">
                        {r.participant_name}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-purple-300 text-base">
                        {r.total_score}
                      </td>
                      <td className="py-3.5 px-3 text-center text-emerald-400 font-medium">
                        {r.correct_answers}
                      </td>
                      <td className="py-3.5 px-3 text-center text-rose-400 font-medium">
                        {r.incorrect_answers}
                      </td>
                      <td className="py-3.5 px-3 text-center text-amber-400 font-medium">
                        {r.unanswered_questions}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs sm:text-sm text-slate-300">
                        {r.completion_time}s
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={async () => {
                            if (window.confirm(`Reset attempt for "${r.participant_name}" to permit retaking?`)) {
                              await resetParticipantAttempt(r.participant_name);
                              await loadAdminData();
                              setActionSuccess(`Attempt reset for ${r.participant_name}`);
                            }
                          }}
                          className="text-[11px] text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20"
                        >
                          Reset Attempt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION MANAGER */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 text-xs text-purple-200">
            <strong>Security Notice:</strong> Correct answers are stored securely and never transmitted to participants during active quizzes. Organisers can activate or deactivate questions below.
          </div>

          <div className="grid grid-cols-1 gap-4">
            {questions.map((q) => (
              <div 
                key={q.id}
                className={`glass-panel p-5 rounded-2xl border transition-all ${
                  q.is_active !== false 
                    ? 'border-white/10' 
                    : 'border-slate-800 opacity-60 bg-slate-950/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-purple-500/20 text-purple-300 font-bold text-xs flex items-center justify-center">
                      #{q.order_num}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {q.category}
                    </span>
                    <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {q.points || 10} pts • {q.time_limit || 20}s
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleQuestion(q.id, q.is_active !== false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      q.is_active !== false
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}
                  >
                    {q.is_active !== false ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
                  {q.question_text}
                </h3>

                {/* Options List with Correct Answer Highlight */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                  {['A', 'B', 'C', 'D']
                    .filter((key) => {
                      const text = q[`option_${key.toLowerCase()}`];
                      return text && text.trim() !== '';
                    })
                    .map((key) => {
                      const optText = q[`option_${key.toLowerCase()}`];
                      const isCorrect = q.correct_answer === key;
                      return (
                        <div
                          key={key}
                          className={`p-2 rounded-lg flex items-center gap-2 border ${
                            isCorrect
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 font-medium'
                              : 'bg-slate-900/40 border-white/5 text-slate-300'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] ${
                            isCorrect ? 'bg-emerald-500 text-emerald-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {key}
                          </span>
                          <span className="truncate">{optText}</span>
                          {isCorrect && <span className="ml-auto text-[10px] text-emerald-400 uppercase font-bold">Correct</span>}
                        </div>
                      );
                    })}
                </div>

                {q.explanation && (
                  <p className="text-xs text-slate-400 italic bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                    💡 <strong>Explanation:</strong> {q.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
