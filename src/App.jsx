import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WelcomePage from './pages/WelcomePage';
import ParticipantEntryPage from './pages/ParticipantEntryPage';
import QuizPage from './pages/QuizPage';
import ResultsPage from './pages/ResultsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage from './pages/AdminPage';
import { isSupabaseConfigured } from './services/supabase';
import { Info, Sparkles } from 'lucide-react';

export default function App() {
  const [currentPage, setCurrentPage] = useState('welcome');
  const [sessionData, setSessionData] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  // Handle Session Started from ParticipantEntryPage
  const handleSessionStarted = (data) => {
    setSessionData(data);
    setCurrentPage('quiz');
  };

  // Handle Quiz Completed from QuizPage
  const handleQuizCompleted = (result) => {
    setResultData(result);
    setCurrentPage('results');
  };

  // Handle Play Again
  const handlePlayAgain = () => {
    setSessionData(null);
    setResultData(null);
    setCurrentPage('entry');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0b0f19] text-slate-100 selection:bg-purple-500 selection:text-white">
      {/* Simulation / Production Indicator Banner */}
      {!isSupabaseConfigured && !bannerDismissed && (
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border-b border-purple-500/30 px-4 py-2 text-xs text-purple-200 flex items-center justify-between z-50">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
            <span>
              <strong>Local Interactive Mode Active:</strong> Full quiz engine, 20s timers, backend scoring logic, leaderboard & organiser dashboard are working locally. To connect your live Supabase database, paste your credentials in <code className="bg-purple-900/40 px-1 py-0.5 rounded border border-purple-400/30 text-purple-200">.env</code>.
            </span>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            className="text-slate-400 hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Navigation */}
      <Navbar currentPage={currentPage} navigateTo={setCurrentPage} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentPage === 'welcome' && (
          <WelcomePage navigateTo={setCurrentPage} />
        )}

        {currentPage === 'entry' && (
          <ParticipantEntryPage 
            onSessionStarted={handleSessionStarted} 
            navigateTo={setCurrentPage} 
          />
        )}

        {currentPage === 'quiz' && sessionData && (
          <QuizPage
            sessionData={sessionData}
            onQuizCompleted={handleQuizCompleted}
            onAbort={() => setCurrentPage('welcome')}
          />
        )}

        {currentPage === 'results' && (
          <ResultsPage
            resultData={resultData}
            onPlayAgain={handlePlayAgain}
            navigateTo={setCurrentPage}
          />
        )}

        {currentPage === 'leaderboard' && (
          <LeaderboardPage navigateTo={setCurrentPage} />
        )}

        {currentPage === 'admin' && (
          <AdminPage navigateTo={setCurrentPage} />
        )}
      </main>

      {/* Footer */}
      <Footer navigateTo={setCurrentPage} />
    </div>
  );
}
