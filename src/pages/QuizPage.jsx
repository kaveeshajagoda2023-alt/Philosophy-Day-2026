import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, AlertCircle, ShieldAlert, Sparkles, Send } from 'lucide-react';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import { submitQuizAnswers } from '../services/quizService';

export default function QuizPage({ sessionData, onQuizCompleted, onAbort }) {
  const { sessionToken, participantName, questions = [] } = sessionData;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [recordedAnswers, setRecordedAnswers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Track start time of each individual question to accurately calculate time_taken
  const questionStartTimeRef = useRef(Date.now());

  // Current question object
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  // Reset selected option and reset start time whenever currentIndex changes
  useEffect(() => {
    setSelectedOption(null);
    questionStartTimeRef.current = Date.now();
  }, [currentIndex]);

  // Handle advancing to next question (or submitting if last)
  const handleAdvance = async (forcedAnswer = null) => {
    const timeSpentSeconds = Math.min(
      20,
      parseFloat(((Date.now() - questionStartTimeRef.current) / 1000).toFixed(2))
    );

    const answerToRecord = {
      question_id: currentQuestion.id,
      selected_answer: forcedAnswer !== null ? forcedAnswer : selectedOption,
      time_taken: timeSpentSeconds
    };

    const updatedAnswers = [...recordedAnswers, answerToRecord];
    setRecordedAnswers(updatedAnswers);

    if (isLastQuestion) {
      // Completed all questions, submit to backend
      setIsSubmitting(true);
      setSubmitError('');

      try {
        const result = await submitQuizAnswers(sessionToken, updatedAnswers);
        onQuizCompleted(result);
      } catch (err) {
        console.error('Quiz submission error:', err);
        setSubmitError(err.message || 'Submission failed. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      // Advance to next question
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Called automatically when the 20s question timer hits 0
  const handleTimerExpired = () => {
    // If timer runs out without user selection, selectedOption is null (unanswered)
    handleAdvance(selectedOption);
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">No Active Questions Found</h2>
        <p className="text-sm text-slate-400 mb-6">The organizer has not published active questions yet.</p>
        <button onClick={onAbort} className="btn-primary">Return to Home</button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-between py-6 px-4 sm:px-6 max-w-4xl mx-auto w-full">
      {/* Quiz Top Navigation Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Participant Name Badge */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-300">
            {participantName ? participantName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div className="text-xs text-slate-400">Participant</div>
            <div className="text-sm font-semibold text-white tracking-wide">{participantName}</div>
          </div>
        </div>

        {/* 20-Second Countdown Timer Component */}
        <div>
          <Timer
            duration={currentQuestion.time_limit || 20}
            questionIndex={currentIndex}
            onExpire={handleTimerExpired}
          />
        </div>

        {/* Anti-cheat status banner */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Server Verified Session</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <ProgressBar current={currentIndex + 1} total={totalQuestions} />
      </div>

      {/* Main Question Card Container */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <QuestionCard
          question={currentQuestion}
          selectedOption={selectedOption}
          onSelectOption={setSelectedOption}
          disabled={isSubmitting}
        />

        {/* Submission Error Alert */}
        {submitError && (
          <div className="mt-6 p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3 text-rose-200 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Submission Warning</p>
              <p className="text-xs text-rose-300 mt-0.5">{submitError}</p>
            </div>
            <button
              onClick={() => handleAdvance(selectedOption)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded text-xs font-semibold text-white"
            >
              Retry Submit
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
        <div className="text-xs text-slate-400">
          {selectedOption ? (
            <span className="text-purple-300 font-medium">
              Option {selectedOption} selected • Ready to proceed
            </span>
          ) : (
            <span className="italic text-slate-500">
              Select an answer or wait for the 20s timer
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => handleAdvance(selectedOption)}
          className="btn-primary flex items-center gap-2 py-3 px-6 text-sm sm:text-base font-semibold shadow-lg shadow-purple-600/30"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying & Calculating Score...</span>
            </>
          ) : isLastQuestion ? (
            <>
              <span>Submit Final Quiz</span>
              <Send className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              <span>Next Question</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
