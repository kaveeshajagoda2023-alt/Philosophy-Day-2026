import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, AlertCircle, Sparkles, Send, Infinity as InfinityIcon, PenLine, CheckCircle2 } from 'lucide-react';
import Timer from '../components/Timer';
import ProgressBar from '../components/ProgressBar';
import QuestionCard from '../components/QuestionCard';
import { LEVEL_2_QUESTION } from '../data/sampleQuestions';
import { submitQuizAnswers } from '../services/quizService';

export default function QuizPage({ sessionData, onQuizCompleted, onAbort }) {
  const { sessionToken, participantName, questions = [] } = sessionData;

  const [stage, setStage] = useState('level1'); // 'level1' | 'level2'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [recordedAnswers, setRecordedAnswers] = useState([]);
  const [level2Answer, setLevel2Answer] = useState('');
  const [level2Error, setLevel2Error] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Track start time of each individual Level 1 question to accurately calculate time_taken
  const questionStartTimeRef = useRef(Date.now());

  // Current Level 1 question object
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const isLastLevel1Question = currentIndex === totalQuestions - 1;

  // Reset selected option and reset start time whenever currentIndex changes in Level 1
  useEffect(() => {
    if (stage === 'level1') {
      setSelectedOption(null);
      questionStartTimeRef.current = Date.now();
    }
  }, [currentIndex, stage]);

  // Handle advancing through Level 1 questions -> transitions to Level 2 after final MCQ
  const handleAdvanceLevel1 = (forcedAnswer = null) => {
    const timeSpentSeconds = Math.min(
      currentQuestion?.time_limit || 20,
      parseFloat(((Date.now() - questionStartTimeRef.current) / 1000).toFixed(2))
    );

    const answerToRecord = {
      question_id: currentQuestion.id,
      selected_answer: forcedAnswer !== null ? forcedAnswer : selectedOption,
      time_taken: timeSpentSeconds
    };

    const updatedAnswers = [...recordedAnswers, answerToRecord];
    setRecordedAnswers(updatedAnswers);

    if (isLastLevel1Question) {
      // Level 1 complete -> Enter Level 2 (No time limit typing question)
      setStage('level2');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  // Called automatically when the 20s Level 1 question timer hits 0
  const handleTimerExpired = () => {
    if (stage !== 'level1') return;
    handleAdvanceLevel1(selectedOption);
  };

  // Final submission after completing Level 2 (Typing Question)
  const handleFinalSubmit = async () => {
    const trimmed = level2Answer.trim();
    if (!trimmed) {
      setLevel2Error('කරුණාකර ඔබගේ පිළිතුර ලියන්න. (Please type your answer before submitting.)');
      return;
    }

    setLevel2Error('');
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const result = await submitQuizAnswers(sessionToken, recordedAnswers, trimmed);
      onQuizCompleted(result);
    } catch (err) {
      console.error('Quiz submission error:', err);
      setSubmitError(err.message || 'Submission failed. Please try again.');
      setIsSubmitting(false);
    }
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

  // Word count helper for Level 2
  const wordCount = level2Answer.trim() ? level2Answer.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col justify-between py-6 px-4 sm:px-6 max-w-4xl mx-auto w-full">
      {/* Quiz Top Navigation Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Participant Name & Level Badge */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-sm font-bold text-purple-300">
            {participantName ? participantName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white tracking-wide">{participantName}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  stage === 'level1'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                {stage === 'level1' ? 'Level 1' : 'Level 2'}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {stage === 'level1' ? 'Multiple Choice Challenge' : 'Philosophical Reflection'}
            </div>
          </div>
        </div>

        {/* Timer (Level 1 ONLY) OR No Time Limit Badge (Level 2) */}
        <div>
          {stage === 'level1' ? (
            <Timer
              duration={currentQuestion.time_limit || 20}
              questionIndex={currentIndex}
              onExpire={handleTimerExpired}
            />
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/40 bg-emerald-950/40 text-emerald-300 text-xs sm:text-sm font-bold tracking-wide shadow-md shadow-emerald-900/20">
              <InfinityIcon className="w-4 h-4 text-emerald-400" />
              <span>No Time Limit</span>
            </div>
          )}
        </div>

        {/* Session Status */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Server Verified Session</span>
        </div>
      </div>

      {/* ================================================================ */}
      {/* LEVEL 1: 20 TIMED MULTIPLE-CHOICE QUESTIONS                      */}
      {/* ================================================================ */}
      {stage === 'level1' && (
        <>
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
              onClick={() => handleAdvanceLevel1(selectedOption)}
              className="btn-primary flex items-center gap-2 py-3 px-6 text-sm sm:text-base font-semibold shadow-lg shadow-purple-600/30"
            >
              {isLastLevel1Question ? (
                <>
                  <span>Continue to Level 2</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ================================================================ */}
      {/* LEVEL 2: UNTIMED OPEN-ENDED TYPING QUESTION                      */}
      {/* ================================================================ */}
      {stage === 'level2' && (
        <>
          {/* Level 1 Complete Banner */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-purple-950/40 to-amber-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-in fade-in slide-in-from-top-3 duration-500">
            <div className="flex items-center gap-2.5 text-emerald-300 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Level 1 Completed! Welcome to Level 2 — Final Reflection Question.</span>
            </div>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
              ∞ Take Your Time
            </span>
          </div>

          {/* Level 2 Typing Question Card */}
          <div className="glass-panel p-6 sm:p-9 rounded-3xl border border-amber-500/25 shadow-2xl relative overflow-hidden mb-8 animate-in fade-in duration-500">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Category & Untimed Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{LEVEL_2_QUESTION.category}</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/25">
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>කාල සීමාවක් නොමැත (No Time Limit)</span>
              </span>
            </div>

            {/* Level 2 Question Text */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-semibold text-white leading-relaxed">
                {LEVEL_2_QUESTION.question_text}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                මෙම ප්‍රශ්නය සඳහා කාල සීමාවක් නොමැත. නිදහසේ සිතා ඔබේ අදහස පහත කොටුවේ සටහන් කරන්න.
              </p>
            </div>

            {/* Typing Textarea */}
            <div className="space-y-2">
              <label
                htmlFor="level2Answer"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-300"
              >
                <PenLine className="w-4 h-4 text-pink-400" />
                <span>ඔබගේ පිළිතුර (Your Answer)</span>
              </label>

              <textarea
                id="level2Answer"
                rows={7}
                value={level2Answer}
                onChange={(e) => {
                  setLevel2Answer(e.target.value);
                  if (level2Error) setLevel2Error('');
                }}
                disabled={isSubmitting}
                autoFocus
                placeholder={LEVEL_2_QUESTION.placeholder}
                className="w-full p-4 rounded-2xl bg-slate-900/80 border-2 border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all text-sm sm:text-base leading-relaxed resize-y min-h-[180px]"
              />

              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>You can write in Sinhala or English</span>
                <span className="font-mono">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} • {level2Answer.length} chars
                </span>
              </div>
            </div>

            {/* Validation Warning */}
            {level2Error && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/40 flex items-center gap-2.5 text-amber-200 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{level2Error}</span>
              </div>
            )}

            {/* Submission Error Alert */}
            {submitError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-3 text-rose-200 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Submission Warning</p>
                  <p className="text-xs text-rose-300 mt-0.5">{submitError}</p>
                </div>
                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-500 rounded text-xs font-semibold text-white"
                >
                  Retry Submit
                </button>
              </div>
            )}
          </div>

          {/* Level 2 Final Submit Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/5">
            <div className="text-xs text-slate-400 text-center sm:text-left">
              Your Level 1 score and Level 2 reflection will both be recorded securely.
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinalSubmit}
              className="w-full sm:w-auto btn-primary flex items-center justify-center gap-2 py-3.5 px-7 text-sm sm:text-base font-semibold shadow-lg shadow-purple-600/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Level 1 & Level 2...</span>
                </>
              ) : (
                <>
                  <span>Submit Final Quiz</span>
                  <Send className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
