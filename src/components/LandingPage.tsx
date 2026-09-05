import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { AirMagicLogo } from './AirMagicLogo';

interface LandingPageProps {
  onLaunch: () => void;
}

// Clean Static Section Divider
const StaticSectionDivider: React.FC = () => (
  <div className="w-full h-[1px] bg-white/[0.05] my-16 md:my-24" />
);

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const gestures = [
    { emoji: '☝️', name: 'POINT', action: 'Air Drawing' },
    { emoji: '🤏', name: 'PINCH', action: 'Portal' },
    { emoji: '🖐️', name: 'OPEN PALM', action: 'Shockwave' },
    { emoji: '✊', name: 'FIST', action: 'Gravity' },
    { emoji: '✌️', name: 'TWO FINGERS', action: 'SMILE' },
    { emoji: '3️⃣', name: 'THREE FINGERS', action: 'Dispel' },
    { emoji: '🤞', name: 'CROSSED FINGERS', action: 'Perch' },
  ];

  const steps = [
    {
      num: '01',
      title: 'SHOW YOUR HAND',
      desc: 'Allow the camera to see your hand clearly in normal ambient lighting.',
      tag: 'OPTICAL SENSING',
    },
    {
      num: '02',
      title: 'MAKE A GESTURE',
      desc: 'Client-side AI neural tracking recognizes your movements and joint geometry in real time.',
      tag: 'NEURAL TRACKING',
    },
    {
      num: '03',
      title: 'EXPERIENCE THE MAGIC',
      desc: 'Your natural gesture becomes an expressive 3D visual effect, portal, or spatial spell.',
      tag: 'SPATIAL FX',
    },
  ];

  const pillars = [
    {
      title: 'Natural Interaction',
      desc: 'Interact with software using natural human movement instead of relying strictly on keyboards, mice, or game controllers.',
    },
    {
      title: 'Spatial Computing',
      desc: 'Bring responsive digital effects directly into your physical space with depth, velocity, and fluid physical simulation.',
    },
    {
      title: 'AI + Creativity',
      desc: 'Unite high-speed computer vision neural models with hardware-accelerated WebGL graphics in a unified browser pipeline.',
    },
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#000000] text-[#F5F5F5] selection:bg-[#D6FF3F]/25 selection:text-white font-sans overflow-x-hidden">
      {/* Minimal Static Background Grid */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━ */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#000000]/85 border-b border-white/[0.06] transition-colors">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 text-sm font-semibold tracking-wider text-[#F5F5F5] hover:text-[#D6FF3F] transition-colors group"
          >
            <AirMagicLogo size={28} className="text-white group-hover:text-[#D6FF3F] transition-colors" />
            <span className="tracking-[0.22em] font-bold text-xs sm:text-sm text-[#F5F5F5]">
              AIR MAGIC
            </span>
          </a>

          <nav className="flex items-center gap-6 md:gap-8">
            {/* Nav links with separated left-to-right underline effect */}
            <div className="hidden sm:flex items-center gap-7">
              <a href="#about" className="nav-item-link">
                About
              </a>
              <a href="#how-it-works" className="nav-item-link">
                How it works
              </a>
              <a href="#gestures" className="nav-item-link">
                Gestures
              </a>
              <a href="#purpose" className="nav-item-link">
                Purpose
              </a>
            </div>

            {/* Navbar Launch Button */}
            <button
              onClick={onLaunch}
              className="relative px-4 py-2 rounded-lg text-xs font-semibold tracking-wider text-[#000000] bg-[#D6FF3F] hover:bg-[#cbf732] shadow-[0_0_15px_rgba(214,255,63,0.25)] hover:shadow-[0_0_22px_rgba(214,255,63,0.45)] transition-all duration-200 cursor-pointer flex items-center gap-2"
            >
              <span>LAUNCH</span>
              <ArrowRight size={13} className="stroke-[2.5]" />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-16 md:pt-24 pb-28 flex flex-col items-center">
        {/* HERO SECTION (Clean, static) */}
        <section className="w-full text-center flex flex-col items-center pt-6 md:pt-10 pb-16">
          {/* Custom Geometric Logo */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="relative w-18 h-18 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] flex items-center justify-center shadow-[0_0_25px_rgba(214,255,63,0.08)]">
              <AirMagicLogo size={44} className="text-[#F5F5F5]" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-[0.2em] text-[#F5F5F5] uppercase mb-4">
            AIR MAGIC
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-semibold tracking-[0.28em] text-[#8A8A8A] uppercase mb-8">
            REAL-TIME HAND CONTROLLED MAGIC
          </p>

          {/* Descriptions */}
          <p className="text-base sm:text-lg text-[#F5F5F5] max-w-xl font-normal leading-relaxed mb-4">
            Turn your hands into a controller for real-time digital experiences.
          </p>
          <p className="text-sm sm:text-base text-[#8A8A8A] max-w-2xl font-light leading-relaxed mb-12">
            AIR MAGIC uses AI-powered hand tracking to transform natural gestures into interactive
            visual effects, portals, particles and magical experiences.
          </p>

          {/* Primary CTA Button with Lime Accent */}
          <div className="mb-18 flex flex-col items-center">
            <button
              onClick={onLaunch}
              className="relative px-9 sm:px-11 py-4 rounded-xl bg-[#D6FF3F] text-[#000000] font-bold text-sm sm:text-base tracking-[0.12em] uppercase shadow-[0_0_25px_rgba(214,255,63,0.25)] hover:shadow-[0_0_40px_rgba(214,255,63,0.45)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-3"
            >
              <span>LAUNCH AIR MAGIC</span>
              <ArrowRight size={16} className="stroke-[2.5]" />
            </button>
            <p className="text-[11px] text-[#8A8A8A] tracking-[0.16em] uppercase mt-4">
              Runs in browser • Zero external hardware
            </p>
          </div>

          {/* Clean Static Hero Pipeline Visual */}
          <div className="w-full max-w-md mx-auto p-5 rounded-2xl bg-[#0A0A0A] border border-white/[0.06]">
            <div className="flex flex-col items-center gap-2 text-xs tracking-widest uppercase">
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[#000000] border border-white/[0.06] text-[#F5F5F5] font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D6FF3F]" />
                <span>HAND DETECTION</span>
              </div>
              <ArrowDown size={13} className="text-[#8A8A8A]/60 my-0.5" />
              <div className="px-3.5 py-1 rounded bg-[#000000] border border-white/[0.04] text-[#8A8A8A] text-[10px] font-mono">
                AI VISION PIPELINE
              </div>
              <ArrowDown size={13} className="text-[#8A8A8A]/60 my-0.5" />
              <div className="px-3.5 py-1 rounded bg-[#000000] border border-white/[0.04] text-[#8A8A8A] text-[10px] font-mono">
                GESTURE INFERENCE
              </div>
              <ArrowDown size={13} className="text-[#8A8A8A]/60 my-0.5" />
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#D6FF3F]/10 border border-[#D6FF3F]/30 text-[#D6FF3F] font-mono text-[11px] font-semibold">
                <span className="tracking-[0.18em]">SPATIAL MAGIC FX</span>
              </div>
            </div>
          </div>
        </section>

        {/* STATIC SECTION DIVIDER */}
        <StaticSectionDivider />

        {/* ━━━━━━━━━━━━━━━━━━━━ CARDS: WHAT IS AIR MAGIC? ━━━━━━━━━━━━━━━━━━━━ */}
        <section id="about" className="w-full max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-[10px] font-mono font-semibold tracking-[0.3em] uppercase text-[#D6FF3F] mb-3 block">
              01 / OVERVIEW
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.12em] text-[#F5F5F5] uppercase">
              What is AIR MAGIC?
            </h2>
          </div>

          {/* Card with subtle border glow on touch/hover */}
          <div className="interactive-card p-8 sm:p-10 text-center sm:text-left space-y-5 cursor-default">
            <p className="text-[#F5F5F5] text-base sm:text-lg font-normal leading-relaxed">
              AIR MAGIC is an experimental spatial-computing experience that lets you interact
              with digital effects using natural hand gestures.
            </p>
            <p className="text-[#8A8A8A] text-sm sm:text-base leading-relaxed font-light">
              By processing your webcam feed with client-side AI computer vision, the system maps
              your fingertips, joints, and palms in real time, translating natural human movements
              into expressive 3D particles, dimensional portals, and responsive spells.
            </p>
            <p className="text-[#8A8A8A] text-sm leading-relaxed font-light">
              No controllers, gloves, or sensory hardware needed — just your hands, your camera,
              and pure imagination.
            </p>
          </div>
        </section>

        {/* STATIC SECTION DIVIDER */}
        <StaticSectionDivider />

        {/* ━━━━━━━━━━━━━━━━━━━━ CARDS: HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━ */}
        <section id="how-it-works" className="w-full">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono font-semibold tracking-[0.3em] uppercase text-[#D6FF3F] mb-3 block">
              02 / PROCESS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.12em] text-[#F5F5F5] uppercase">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div
                key={step.num}
                className="interactive-card p-8 flex flex-col justify-between cursor-default group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold tracking-widest text-[#D6FF3F]">
                      {step.num}
                    </span>
                    <span className="text-[9px] font-mono tracking-widest uppercase text-[#8A8A8A] px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.04]">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#F5F5F5] tracking-[0.08em] mb-3 uppercase group-hover:text-[#D6FF3F] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#8A8A8A] leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STATIC SECTION DIVIDER */}
        <StaticSectionDivider />

        {/* ━━━━━━━━━━━━━━━━━━━━ CARDS: GESTURES ━━━━━━━━━━━━━━━━━━━━ */}
        <section id="gestures" className="w-full">
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono font-semibold tracking-[0.3em] uppercase text-[#D6FF3F] mb-3 block">
              03 / CONTROLS
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.12em] text-[#F5F5F5] uppercase">
              Your hands are the controller
            </h2>
            <p className="text-xs sm:text-sm text-[#8A8A8A] max-w-md mx-auto mt-2 font-light">
              Natural hand configurations mapped directly to visual magic.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
            {gestures.map((gesture) => (
              <div
                key={gesture.name}
                className="interactive-card-sm p-5 flex flex-col items-center text-center cursor-default group"
              >
                <div className="text-2xl mb-3">{gesture.emoji}</div>
                <div className="text-xs font-semibold text-[#F5F5F5] tracking-wider mb-1 group-hover:text-[#D6FF3F] transition-colors">
                  {gesture.name}
                </div>
                <div className="text-[11px] text-[#8A8A8A] font-mono tracking-tight">
                  {gesture.action}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STATIC SECTION DIVIDER */}
        <StaticSectionDivider />

        {/* ━━━━━━━━━━━━━━━━━━━━ CARDS: PURPOSE (Why AIR MAGIC?) ━━━━━━━━━━━━━━━━━━━━ */}
        <section id="purpose" className="w-full">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-[10px] font-mono font-semibold tracking-[0.3em] uppercase text-[#D6FF3F] mb-3 block">
              04 / PHILOSOPHY
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-[0.12em] text-[#F5F5F5] uppercase mb-4">
              Why AIR MAGIC?
            </h2>
            <p className="text-sm sm:text-base text-[#8A8A8A] leading-relaxed font-light">
              AIR MAGIC explores a future where computers respond to natural human movement instead
              of relying only on traditional input devices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="interactive-card p-7 flex flex-col justify-between cursor-default group"
              >
                <div>
                  <h3 className="text-base font-bold text-[#F5F5F5] tracking-wide mb-3 group-hover:text-[#D6FF3F] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#8A8A8A] leading-relaxed font-light">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* STATIC SECTION DIVIDER */}
        <StaticSectionDivider />

        {/* FINAL CTA SECTION (Clean, static) */}
        <section className="w-full text-center flex flex-col items-center">
          <div className="max-w-xl mx-auto flex flex-col items-center">
            <div className="mb-4">
              <AirMagicLogo size={32} className="text-[#D6FF3F]" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[0.1em] text-[#F5F5F5] uppercase mb-4">
              Ready to try it?
            </h2>
            <p className="text-sm sm:text-base text-[#8A8A8A] mb-10 max-w-md font-light leading-relaxed">
              Step in front of your camera and turn your hands into magic.
            </p>

            <button
              onClick={onLaunch}
              className="relative px-11 py-4.5 rounded-xl bg-[#D6FF3F] text-[#000000] font-bold text-base tracking-[0.14em] uppercase shadow-[0_0_30px_rgba(214,255,63,0.3)] hover:shadow-[0_0_45px_rgba(214,255,63,0.5)] transition-all duration-300 transform hover:scale-105 cursor-pointer flex items-center justify-center gap-3"
            >
              <span>LAUNCH AIR MAGIC</span>
              <ArrowRight size={17} className="stroke-[2.5]" />
            </button>
          </div>
        </section>
      </main>

      {/* FOOTER (Clean, static) */}
      <footer className="relative z-10 w-full border-t border-white/[0.06] py-10 px-6 bg-[#000000]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <AirMagicLogo size={18} className="text-[#D6FF3F]" />
            <span className="text-xs font-bold tracking-[0.2em] text-[#F5F5F5] uppercase">
              AIR MAGIC
            </span>
          </div>
          <p className="text-[11px] text-[#8A8A8A] tracking-wider font-mono">
            Real-time hand tracking • Spatial interaction • GPU visual effects
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
