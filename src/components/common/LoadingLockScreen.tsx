import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  Lock,
  Unlock,
  Flame,
  Terminal,
  Cpu,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Tv,
} from 'lucide-react';

export function LoadingLockScreen() {
  const { isLocked, setLocked } = useAppStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoadingSequence, setIsLoadingSequence] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const BOOT_STEPS = [
    { text: '🔑 Ověřování hesla 666... PŘÍSTUP POVOLEN!', icon: Flame, color: 'text-amber-400' },
    { text: '⚡ Připojování k fcc-server (Claude Fable 5 na portu 8082)... ONLINE', icon: Cpu, color: 'text-accent' },
    { text: '📂 Připojování lokálního pracovního prostoru d:/trip... PŘIPRAVENO', icon: Terminal, color: 'text-blue-400' },
    { text: '🧠 Aktivace Senior Software Architect & Programmer schopností... 100%', icon: Sparkles, color: 'text-purple-400' },
    { text: '🚀 Všechny subsystémy online! Vítej v TripxCZ-Twitch CodeSpace!', icon: CheckCircle2, color: 'text-emerald-400' },
  ];

  // Handle pin submit
  const handleCheckCode = (codeToCheck: string) => {
    if (codeToCheck === '666') {
      setError(false);
      setIsSuccess(true);
      setIsLoadingSequence(true);
      setProgress(5);
    } else {
      setError(true);
      setIsSuccess(false);
      // Auto reset po chybě
      setTimeout(() => {
        setPin('');
        setError(false);
      }, 700);
    }
  };

  // Keyboard input listener
  useEffect(() => {
    if (!isLocked || isLoadingSequence) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setPin((prev) => {
          if (prev.length >= 3) return prev;
          const next = prev + e.key;
          if (next.length === 3) {
            setTimeout(() => handleCheckCode(next), 150);
          }
          return next;
        });
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setError(false);
      } else if (e.key === 'Enter') {
        if (pin.length > 0) {
          handleCheckCode(pin);
        }
      } else if (e.key === 'Escape') {
        setPin('');
        setError(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, isLoadingSequence, pin]);

  // Loading animation sequence
  useEffect(() => {
    if (!isLoadingSequence) return;

    let currentProgress = 5;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 4;
      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        setCurrentStep(4);
        clearInterval(interval);

        // Fade out transition
        setTimeout(() => {
          setFadingOut(true);
          setTimeout(() => {
            setLocked(false);
            setIsLoadingSequence(false);
            setIsSuccess(false);
            setPin('');
            setProgress(0);
            setCurrentStep(0);
            setFadingOut(false);
          }, 600);
        }, 800);
      } else {
        setProgress(currentProgress);
        if (currentProgress > 80) setCurrentStep(3);
        else if (currentProgress > 55) setCurrentStep(2);
        else if (currentProgress > 30) setCurrentStep(1);
        else setCurrentStep(0);
      }
    }, 120);

    return () => clearInterval(interval);
  }, [isLoadingSequence, setLocked]);

  if (!isLocked) return null;

  const handleDigitPress = (digit: string) => {
    if (isLoadingSequence || pin.length >= 3) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 3) {
      setTimeout(() => handleCheckCode(next), 150);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#07090E] transition-opacity duration-500 select-none overflow-hidden ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none animate-cyber-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[120px] pointer-events-none animate-cyber-glow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#7C8CFF 1px, transparent 1px), linear-gradient(to right, #7C8CFF 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Top stream banner */}
      <div className="absolute top-6 flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-surface-elevated/60 border border-white/10 backdrop-blur-md shadow-lg">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <Tv className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-xs font-semibold tracking-wider text-text-primary">
          TRIPXCZ-TWITCH
        </span>
        <span className="text-[10px] text-text-secondary/80 border-l border-white/10 pl-2">
          DEV SYSTEM OS v2.0
        </span>
      </div>

      {/* Main card */}
      <div className="relative w-full max-w-md mx-4 p-8 rounded-3xl bg-surface/80 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl text-center space-y-6">
        {/* Header Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
              isSuccess
                ? 'bg-amber-500/20 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                : error
                ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                : 'bg-accent/15 border-accent/30 shadow-[0_0_30px_rgba(124,140,255,0.25)]'
            }`}
          >
            {isSuccess ? (
              <Flame className="w-10 h-10 text-amber-400 animate-bounce" />
            ) : error ? (
              <AlertTriangle className="w-10 h-10 text-red-400 animate-shake" />
            ) : (
              <Lock className="w-9 h-9 text-accent" />
            )}
          </div>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <span>CodeSpace AI</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
              TripxCZ
            </span>
          </h1>
          <p className="text-xs text-text-secondary">
            {isLoadingSequence
              ? 'Inicializace vývojového prostředí a modelů...'
              : 'Zadej přístupový kód pro odemčení systému'}
          </p>
        </div>

        {!isLoadingSequence ? (
          /* ================= PHASE 1: PIN ENTRY ================= */
          <div className="space-y-6">
            {/* PIN Slots Visualizer */}
            <div
              className={`flex justify-center gap-4 py-2 ${
                error ? 'animate-shake' : ''
              }`}
            >
              {[0, 1, 2].map((idx) => {
                const filled = pin.length > idx;
                const char = pin[idx] || '';
                return (
                  <div
                    key={idx}
                    className={`w-14 h-16 rounded-2xl flex items-center justify-center text-2xl font-mono font-bold transition-all duration-200 border ${
                      error
                        ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                        : filled
                        ? 'bg-amber-500/10 border-amber-500/60 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-105'
                        : 'bg-surface-elevated/40 border-border/80 text-text-secondary'
                    }`}
                  >
                    {filled ? (
                      char === '6' ? (
                        <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
                      ) : (
                        char
                      )
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-border" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Error / Hint feedback */}
            <div className="h-5 flex items-center justify-center text-xs">
              {error ? (
                <span className="text-red-400 font-medium flex items-center gap-1.5 animate-shake">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Špatné heslo! Zkus to znovu.
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPin('666');
                    setTimeout(() => handleCheckCode('666'), 200);
                  }}
                  className="text-[11px] text-text-secondary/60 hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  <span>Nápověda pro stream: heslo je</span>
                  <span className="font-mono font-semibold text-amber-400/90 underline">
                    666
                  </span>
                  <span>:D</span>
                </button>
              )}
            </div>

            {/* Sci-fi Numpad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(digit)}
                  className={`h-12 rounded-xl text-lg font-mono font-semibold transition-all duration-150 flex items-center justify-center border border-border/60 bg-surface-elevated/30 hover:bg-surface-elevated hover:border-accent/50 text-text-primary active:scale-95 hover:shadow-[0_0_12px_rgba(124,140,255,0.2)] ${
                    digit === '6' ? 'hover:border-amber-500/60 hover:text-amber-400' : ''
                  }`}
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handleClear}
                className="h-12 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-center border border-border/60 bg-surface-elevated/20 hover:bg-red-500/20 hover:border-red-500/50 text-text-secondary hover:text-red-400 active:scale-95"
                title="Smazat"
              >
                C
              </button>
              <button
                onClick={() => handleDigitPress('0')}
                className="h-12 rounded-xl text-lg font-mono font-semibold transition-all duration-150 flex items-center justify-center border border-border/60 bg-surface-elevated/30 hover:bg-surface-elevated hover:border-accent/50 text-text-primary active:scale-95 hover:shadow-[0_0_12px_rgba(124,140,255,0.2)]"
              >
                0
              </button>
              <button
                onClick={() => handleCheckCode(pin)}
                className="h-12 rounded-xl text-sm font-semibold transition-all duration-150 flex items-center justify-center border border-accent/40 bg-accent/20 hover:bg-accent hover:text-white text-accent active:scale-95 shadow-[0_0_15px_rgba(124,140,255,0.25)]"
                title="Odemknout"
              >
                <Unlock className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* ================= PHASE 2: BOOT & LOADING SEQUENCE ================= */
          <div className="space-y-6 pt-2">
            {/* Beast Mode Activated Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>REŽIM 666 AKTIVOVÁN</span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-text-secondary">Inicializace systému</span>
                <span className="text-amber-400 font-bold">{progress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-surface-elevated overflow-hidden border border-border/60 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent via-purple-500 to-amber-500 transition-all duration-150 shadow-[0_0_15px_rgba(245,158,11,0.6)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Console Boot Steps */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 text-left font-mono text-[11px] space-y-2 min-h-[140px] flex flex-col justify-center">
              {BOOT_STEPS.slice(0, currentStep + 1).map((step, idx) => {
                const IconComponent = step.icon;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 ${step.color} transition-all duration-200 animate-fadeIn`}
                  >
                    <IconComponent className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span className="leading-tight">{step.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-text-secondary/60">
          <span>TripxCZ twitch.tv/tripxcz</span>
          <span>Claude Fable 5 :8082</span>
        </div>
      </div>
    </div>
  );
}
