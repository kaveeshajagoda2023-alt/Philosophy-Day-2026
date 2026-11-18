import React from 'react';
import { ArrowRight, Trophy, Sparkles, Clock, CheckCircle2, Shield, Users, Brain, HelpCircle } from 'lucide-react';
import AristotleFloatingAnimation from '../components/AristotleFloatingAnimation';

export default function WelcomePage({ navigateTo }) {
  const rules = [
    {
      icon: <HelpCircle className="w-5 h-5 text-purple-400" />,
      title: "20 Thought-Provoking Questions",
      desc: "Covering Epistemology, Socrates, Plato, Aristotle, Descartes, Existentialism, Sri Aurobindo, Ethics, AI, and Contemporary Philosophy."
    },
    {
      icon: <Clock className="w-5 h-5 text-amber-400" />,
      title: "20 Seconds Per Question",
      desc: "Each question has a countdown timer. Think swiftly—questions advance automatically when time expires."
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
      title: "100 Points Maximum",
      desc: "+5 points per correct answer. 0 for incorrect or unanswered. Tied scores are broken by fastest completion time."
    },
    {
      icon: <Shield className="w-5 h-5 text-pink-400" />,
      title: "Zero Registration Required",
      desc: "No password, no email, no signup! Just enter your first name and surname to enter the live leaderboard."
    }
  ];

  return (
    <div className="relative min-h-[calc(100vh-140px)] flex flex-col justify-center py-8 sm:py-14 overflow-hidden">
      {/* Background Glow Spheres */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[350px] h-[350px] bg-pink-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 text-center">
        {/* Event Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-medium mb-6 shadow-lg shadow-purple-900/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-500">
          <Sparkles className="w-4 h-4 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Philosophy Club Presents</span>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span className="font-semibold text-white">Annual Symposium 2026</span>
        </div>

        {/* Main Branding Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-extrabold tracking-tight text-white mb-4 leading-[1.1] animate-in fade-in slide-in-from-bottom-3 duration-700">
          PHILOSOPHY DAY <span className="gradient-text">2026</span>
        </h1>

        {/* Tagline */}
        <p className="text-xl sm:text-2xl md:text-3xl font-serif italic text-purple-200/90 font-light mb-4 tracking-wide">
          "Think. Question. Discover."
        </p>

        {/* Animated Aristotle (Moving Down to Up with Wisdom Ascent) */}
        <AristotleFloatingAnimation />

        {/* Short Welcome Narrative */}
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Welcome to the ultimate intellectual arena. Test your understanding of existence,
          ethics, dialectics, and ancient wisdom in this rapid 20-question challenge.
          Will you ascend to the top of the symposium leaderboard?
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <button
            onClick={() => navigateTo('entry')}
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-3 text-base sm:text-lg py-4 px-8 group font-semibold"
          >
            <span>Enter Quiz Challenge</span>
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1.5" />
          </button>

          <button
            onClick={() => navigateTo('leaderboard')}
            className="w-full sm:w-auto px-6 py-4 rounded-xl font-semibold text-slate-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-400/40 transition-all flex items-center justify-center gap-2 text-base shadow-sm"
          >
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>View Leaderboard</span>
          </button>
        </div>

        {/* Interactive Rules & Instructions Cards */}
        <div className="text-left mt-6">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              Challenge Rules & Instructions
            </h3>
            <span className="text-xs text-slate-500">Public & Mobile Friendly</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule, idx) => (
              <div 
                key={idx} 
                className="glass-card p-5 rounded-2xl flex items-start gap-4 border border-white/5 hover:border-purple-500/30"
              >
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-white/10 shrink-0 mt-0.5">
                  {rule.icon}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {rule.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {rule.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Philosophy Quotation Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-900/60 to-pink-950/40 border border-purple-500/20 text-center">
          <p className="text-sm sm:text-base italic text-slate-300 font-serif mb-1">
            "The mind is not a vessel to be filled, but a fire to be kindled."
          </p>
          <span className="text-xs font-semibold uppercase tracking-widest text-purple-400">
            — Plutarch
          </span>
        </div>
      </div>
    </div>
  );
}
