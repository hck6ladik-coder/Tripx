import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { sendMessageStream } from '@/lib/api';
import { generateId } from '@/lib/utils';
import { Conversation, ChatMessage } from '@/types';
import {
  X,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Sparkles,
  Zap,
} from 'lucide-react';

// ─── local speech types ──────────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type Phase = 'connecting' | 'listening' | 'thinking' | 'speaking' | 'interrupted' | 'ended';

interface VoiceTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

// ─── Web Audio Tone Synthesizer for natural feedback ─────────────
function playChime(type: 'connect' | 'disconnect' | 'tap') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'connect') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } else if (type === 'disconnect') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.exponentialRampToValueAtTime(330, now + 0.16);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    } else if (type === 'tap') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  } catch {
    // audio context may fail without interaction
  }
}

// ─── ChatGPT-style Organic Liquid Mesh Orb ───────────────────────
function ChatGPTFluidOrb({
  phase,
  level,
  onTap,
}: {
  phase: Phase;
  level: number;
  onTap: () => void;
}) {
  const dynamicScale = Math.min(1.4, 1 + level * 0.45);

  // Gradient themes matching ChatGPT Mobile Advanced Voice
  const themes: Record<Phase, {
    c1: string;
    c2: string;
    c3: string;
    glow: string;
    shadow: string;
  }> = {
    connecting: {
      c1: '#6366f1',
      c2: '#8b5cf6',
      c3: '#3b82f6',
      glow: 'rgba(99, 102, 241, 0.4)',
      shadow: '0 0 60px rgba(99, 102, 241, 0.5)',
    },
    listening: {
      c1: '#38bdf8',
      c2: '#818cf8',
      c3: '#c084fc',
      glow: 'rgba(56, 189, 248, 0.5)',
      shadow: '0 0 80px rgba(129, 140, 248, 0.6)',
    },
    thinking: {
      c1: '#f59e0b',
      c2: '#fb923c',
      c3: '#ef4444',
      glow: 'rgba(245, 158, 11, 0.45)',
      shadow: '0 0 70px rgba(251, 146, 60, 0.55)',
    },
    speaking: {
      c1: '#10b981',
      c2: '#06b6d4',
      c3: '#3b82f6',
      glow: 'rgba(16, 185, 129, 0.55)',
      shadow: '0 0 90px rgba(6, 182, 212, 0.65)',
    },
    interrupted: {
      c1: '#f43f5e',
      c2: '#e11d48',
      c3: '#be123c',
      glow: 'rgba(244, 63, 94, 0.5)',
      shadow: '0 0 60px rgba(225, 29, 72, 0.5)',
    },
    ended: {
      c1: '#475569',
      c2: '#334155',
      c3: '#1e293b',
      glow: 'rgba(71, 85, 105, 0.2)',
      shadow: 'none',
    },
  };

  const theme = themes[phase];

  return (
    <div
      onClick={onTap}
      role="button"
      tabIndex={0}
      className="relative flex items-center justify-center cursor-pointer select-none transition-transform duration-300 active:scale-95 group"
      style={{ width: 280, height: 280 }}
    >
      {/* Outer ambient blur background aura */}
      <div
        className="absolute rounded-full pointer-events-none transition-all duration-700"
        style={{
          width: 320,
          height: 320,
          background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
          filter: 'blur(35px)',
          transform: `scale(${dynamicScale * 1.1})`,
        }}
      />

      {/* Ripple Sound Waves */}
      {(phase === 'listening' || phase === 'speaking') &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 220 + i * 50,
              height: 220 + i * 50,
              border: `1.5px solid ${theme.c1}33`,
              background: `radial-gradient(circle, ${theme.c2}10 0%, transparent 70%)`,
              animation: `gptVoicePulse ${2 + i * 0.5}s cubic-bezier(0.2, 0.8, 0.2, 1) infinite`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}

      {/* The Liquid Fluid Blob */}
      <div
        className="relative rounded-full transition-transform duration-200"
        style={{
          width: 220,
          height: 220,
          transform: `scale(${dynamicScale})`,
          boxShadow: theme.shadow,
        }}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full overflow-visible"
          style={{
            animation: phase === 'thinking' ? 'gptSpin 6s linear infinite' : 'none',
          }}
        >
          <defs>
            <linearGradient id="orbGradient" x1="15%" y1="10%" x2="85%" y2="90%">
              <stop offset="0%" stopColor={theme.c1} />
              <stop offset="50%" stopColor={theme.c2} />
              <stop offset="100%" stopColor={theme.c3} />
            </linearGradient>

            <filter id="softGlow">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
            </filter>
          </defs>

          {/* Morphing Blob Path */}
          <path
            fill="url(#orbGradient)"
            style={{
              transformOrigin: '100px 100px',
            }}
          >
            <animate
              attributeName="d"
              dur={phase === 'speaking' ? '2.8s' : phase === 'listening' ? '3.5s' : '5s'}
              repeatCount="indefinite"
              values="
                M 100,20 C 145,20 180,55 180,100 C 180,145 145,180 100,180 C 55,180 20,145 20,100 C 20,55 55,20 100,20 Z;
                M 100,16 C 152,24 186,60 178,104 C 170,148 140,184 96,178 C 52,172 16,140 22,96 C 28,52 48,8 100,16 Z;
                M 100,24 C 140,16 174,50 182,94 C 190,138 152,174 104,182 C 56,190 24,152 18,104 C 12,56 60,32 100,24 Z;
                M 100,20 C 145,20 180,55 180,100 C 180,145 145,180 100,180 C 55,180 20,145 20,100 C 20,55 55,20 100,20 Z
              "
            />
          </path>

          {/* Organic Core Highlight */}
          <circle
            cx="75"
            cy="70"
            r="36"
            fill="white"
            opacity="0.18"
            filter="url(#softGlow)"
          />
        </svg>
      </div>

      {/* Floating Center Icon / Micro hint */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {phase === 'speaking' && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Klepni pro přerušení</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sound Bar Visualizer for Listening Phase ───────────────────
function AudioWaveBars({ level }: { level: number }) {
  const bars = 24;
  return (
    <div className="flex items-center justify-center gap-1 h-9 px-4">
      {Array.from({ length: bars }).map((_, i) => {
        const factor = Math.sin((i / (bars - 1)) * Math.PI);
        const dynamicH = Math.max(5, 8 + level * 28 * factor);
        return (
          <div
            key={i}
            className="w-[3px] rounded-full transition-all duration-75 bg-gradient-to-t from-sky-500/50 via-indigo-400 to-white/90"
            style={{
              height: `${dynamicH}px`,
              opacity: 0.35 + factor * 0.65,
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Main Modal Component ────────────────────────────────────────
export function VoiceChatModal() {
  const {
    voiceChatOpen,
    setVoiceChatOpen,
    selectedModel,
    memoryFacts,
    activeConversationId,
    conversations,
  } = useAppStore();

  const [phase, setPhase] = useState<Phase>('connecting');
  const [turns, setTurns] = useState<VoiceTurn[]>([]);
  const [interimText, setInterimText] = useState('');
  const [currentAIText, setCurrentAIText] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.05);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animRef = useRef<number>(0);
  const abortedRef = useRef(false);
  const accRef = useRef('');
  const turnsEndRef = useRef<HTMLDivElement | null>(null);

  // ── Audio Analyser ──────────────────────────────────────────────
  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const tick = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const avg = data.reduce((s, v) => s + v, 0) / data.length;
        setAudioLevel(avg / 128);
        animRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // microphone access denied or not available
    }
  }, []);

  const stopAnalyser = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    analyserRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    setAudioLevel(0);
  }, []);

  // ── Text-to-Speech Output ───────────────────────────────────────
  const speak = useCallback(
    (text: string, onEnd?: () => void) => {
      if (!('speechSynthesis' in window) || muted) {
        onEnd?.();
        return;
      }
      const synth = window.speechSynthesis;
      synth.cancel();

      // Clean speech text from Markdown & code blocks for clear speech synthesis
      const clean = text
        .replace(/```[\s\S]*?```/g, 'zde je kód')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/[*#_~>]/g, '')
        .trim();

      if (!clean) {
        onEnd?.();
        return;
      }

      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = 'cs-CZ';
      utt.rate = speechRate;

      const voices = synth.getVoices();
      const czechVoice = voices.find((v) => v.lang.startsWith('cs') || v.lang.startsWith('sk'));
      if (czechVoice) utt.voice = czechVoice;

      utt.onend = () => {
        onEnd?.();
      };
      utt.onerror = () => {
        onEnd?.();
      };

      synth.speak(utt);
    },
    [muted, speechRate]
  );

  // ── Send User Utterance to AI ───────────────────────────────────
  const sendToAI = useCallback(
    async (userText: string) => {
      if (!userText.trim()) return;

      // Add to conversation history turn list
      const userTurn: VoiceTurn = {
        id: generateId(),
        role: 'user',
        text: userText,
        timestamp: new Date(),
      };
      setTurns((prev) => [...prev, userTurn]);

      const storeState = useAppStore.getState();
      const activeConvId = storeState.activeConversationId;
      if (activeConvId) {
        storeState.addMessage(activeConvId, {
          id: userTurn.id,
          role: 'user',
          content: userText,
          timestamp: userTurn.timestamp,
        });
      }

      setPhase('thinking');
      setCurrentAIText('');

      const model = storeState.selectedModel;
      const facts = storeState.memoryFacts || [];

      const systemPrompt = `Jsi prémiový hlasový AI asistent pro hck6lada CodeSpace. Mluvíš přirozeně, energicky a VÝHRADNĚ česky. Protože tě uživatel poslouchá nahlas v živém rozhovoru, odpovídej stručně, lidsky, úderně a bez jakéhokoliv formátování markdown. Maximálně 2 až 3 věty. Když jde o kód, popiš ho jednoduše v jedné větě.${
        facts.length ? `\nPoznámka o uživateli: ${facts.join(', ')}` : ''
      }`;

      // Build context including recent turns
      const recentTurnMessages: ChatMessage[] = turns.slice(-4).map((t) => ({
        id: t.id,
        role: t.role,
        content: t.text,
        timestamp: t.timestamp,
      }));

      const fakeConv: Conversation = {
        id: `voice-${generateId()}`,
        title: 'Hlasový chat',
        agentMode: 'chat',
        createdAt: new Date(),
        updatedAt: new Date(),
        messages: [
          { id: 's', role: 'system', content: systemPrompt, timestamp: new Date() },
          ...recentTurnMessages,
          { id: 'u', role: 'user', content: userText, timestamp: new Date() },
        ],
        modelId: model?.id,
        providerId: model?.providerId,
      };

      const fakeMsg: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };

      let fullResponse = '';

      try {
        await sendMessageStream(fakeConv, fakeMsg, {
          onChunk: (chunk) => {
            fullResponse += chunk;
            setCurrentAIText(fullResponse);
          },
          onStatusChange: () => {},
          onComplete: () => {
            if (abortedRef.current) return;
            setCurrentAIText(fullResponse);
            setPhase('speaking');

            // Save assistant turn
            const aiTurn: VoiceTurn = {
              id: generateId(),
              role: 'assistant',
              text: fullResponse,
              timestamp: new Date(),
            };
            setTurns((prev) => [...prev, aiTurn]);

            const currentStore = useAppStore.getState();
            if (currentStore.activeConversationId) {
              currentStore.addMessage(currentStore.activeConversationId, {
                id: aiTurn.id,
                role: 'assistant',
                content: fullResponse,
                timestamp: aiTurn.timestamp,
                model: currentStore.selectedModel?.name,
              });
            }

            speak(fullResponse, () => {
              if (!abortedRef.current) {
                startListeningCycle();
              }
            });
          },
          onError: () => {
            if (!abortedRef.current) startListeningCycle();
          },
        });
      } catch {
        if (!abortedRef.current) startListeningCycle();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [turns, speak]
  );

  // ── Speech-To-Text Recognition Cycle ────────────────────────────
  const startListeningCycle = useCallback(() => {
    if (abortedRef.current || micMuted) return;

    const SpeechRecognitionClass =
      window.SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setPhase('ended');
      return;
    }

    setPhase('listening');
    setInterimText('');
    accRef.current = '';

    const rec = new (SpeechRecognitionClass as unknown as new () => ISpeechRecognition)();
    rec.lang = 'cs-CZ';
    rec.continuous = false;
    rec.interimResults = true;
    recognitionRef.current = rec;

    let hasHandledEnd = false;

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let finalStr = '';
      let interimStr = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalStr += e.results[i][0].transcript;
        } else {
          interimStr += e.results[i][0].transcript;
        }
      }
      if (finalStr) {
        accRef.current += finalStr;
        setInterimText('');
      } else {
        setInterimText(interimStr);
      }
    };

    rec.onerror = () => {
      if (!abortedRef.current && !micMuted) {
        startListeningCycle();
      }
    };

    rec.onend = () => {
      if (abortedRef.current || hasHandledEnd || micMuted) return;
      hasHandledEnd = true;
      const text = accRef.current.trim();
      setInterimText('');
      if (text) {
        sendToAI(text);
      } else {
        startListeningCycle();
      }
    };

    try {
      rec.start();
    } catch {
      // Already running or permission prompt
    }
  }, [micMuted, sendToAI]);

  // ── Interrupt function ──────────────────────────────────────────
  const interrupt = useCallback(() => {
    playChime('tap');
    window.speechSynthesis?.cancel();
    setPhase('interrupted');
    setTimeout(() => {
      if (!abortedRef.current) {
        startListeningCycle();
      }
    }, 250);
  }, [startListeningCycle]);

  // ── Start / Stop Voice Session ──────────────────────────────────
  const startSession = useCallback(async () => {
    abortedRef.current = false;
    playChime('connect');
    setPhase('connecting');
    await startAnalyser();
    setTimeout(() => {
      if (!abortedRef.current) {
        startListeningCycle();
      }
    }, 400);
  }, [startAnalyser, startListeningCycle]);

  const endSession = useCallback(() => {
    abortedRef.current = true;
    playChime('disconnect');
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    window.speechSynthesis?.cancel();
    stopAnalyser();
    setPhase('ended');
    setVoiceChatOpen(false);
  }, [stopAnalyser, setVoiceChatOpen]);

  // Auto-connect when modal opens like ChatGPT Mobile
  useEffect(() => {
    if (voiceChatOpen) {
      startSession();
    } else {
      abortedRef.current = true;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
      stopAnalyser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceChatOpen]);

  // Auto scroll transcript
  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, currentAIText]);

  if (!voiceChatOpen) return null;

  // Status badge config
  const statusConfig: Record<Phase, { text: string; color: string; badge: string }> = {
    connecting: { text: 'PŘIPOJOVÁNÍ…', color: 'text-indigo-400', badge: 'bg-indigo-500/20 border-indigo-500/30' },
    listening: { text: 'POSLOUCHÁM…', color: 'text-sky-400', badge: 'bg-sky-500/20 border-sky-500/30' },
    thinking: { text: 'PŘEMÝŠLÍM…', color: 'text-amber-400', badge: 'bg-amber-500/20 border-amber-500/30' },
    speaking: { text: 'MLUVÍM…', color: 'text-emerald-400', badge: 'bg-emerald-500/20 border-emerald-500/30' },
    interrupted: { text: 'PŘERUŠENO', color: 'text-rose-400', badge: 'bg-rose-500/20 border-rose-500/30' },
    ended: { text: 'UKONČENO', color: 'text-slate-400', badge: 'bg-slate-500/20 border-slate-500/30' },
  };

  const status = statusConfig[phase];

  return (
    <>
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes gptVoicePulse {
          0% { transform: scale(0.92); opacity: 0.65; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gptSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes floatGlow {
          0%, 100% { opacity: 0.4; transform: translateY(0px); }
          50% { opacity: 0.7; transform: translateY(-6px); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Fullscreen ChatGPT Mobile Layout ── */}
      <div className="fixed inset-0 z-[70] flex flex-col bg-[#08080f] text-white select-none overflow-hidden font-sans">
        {/* Subtle Ambient Backlight */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />

        {/* ── TOP HEADER (Mobile Style) ── */}
        <header className="relative z-10 flex items-center justify-between px-6 py-5">
          {/* Active Model Indicator */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-medium tracking-wide text-white/80">
              {selectedModel?.name || 'CodeSpace AI'}
            </span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            {/* Speed Toggle */}
            <button
              onClick={() => {
                setSpeechRate((r) => (r === 1.05 ? 1.25 : r === 1.25 ? 0.9 : 1.05));
              }}
              title="Rychlost hlasu"
              className="px-2.5 py-1.5 rounded-full text-xs font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            >
              {speechRate}x
            </button>

            {/* Speaker Sound Mute */}
            <button
              onClick={() => {
                setMuted((m) => !m);
                if (!muted) window.speechSynthesis?.cancel();
              }}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
              title={muted ? 'Zapnout zvuk' : 'Ztlumit zvuk'}
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Transcript Sheet Toggle */}
            <button
              onClick={() => setShowHistory((h) => !h)}
              className={`p-2.5 rounded-full border transition-all ${
                showHistory
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white'
              }`}
              title="Zobrazit přepis konverzace"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={endSession}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* ── CENTER STAGE ── */}
        <main className="relative flex-1 flex flex-col items-center justify-center px-6">
          {!showHistory ? (
            /* Minimalist ChatGPT Orb View */
            <div className="flex flex-col items-center justify-center gap-8 w-full max-w-md">
              {/* Status Pill */}
              <div
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md transition-all duration-300 ${status.badge}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    phase === 'listening'
                      ? 'bg-sky-400 animate-ping'
                      : phase === 'speaking'
                      ? 'bg-emerald-400 animate-pulse'
                      : phase === 'thinking'
                      ? 'bg-amber-400 animate-bounce'
                      : 'bg-indigo-400'
                  }`}
                />
                <span className={`text-xs font-semibold tracking-wider ${status.color}`}>
                  {status.text}
                </span>
              </div>

              {/* Liquid Orb */}
              <ChatGPTFluidOrb
                phase={phase}
                level={audioLevel}
                onTap={() => {
                  if (phase === 'speaking') {
                    interrupt();
                  } else if (phase === 'listening') {
                    // Tap to force process
                    recognitionRef.current?.stop();
                  }
                }}
              />

              {/* Waveform when listening */}
              <div className="h-9 flex items-center justify-center">
                {phase === 'listening' ? (
                  <AudioWaveBars level={audioLevel} />
                ) : (
                  <div className="h-1 w-12 rounded-full bg-white/10" />
                )}
              </div>

              {/* Floating Real-time Transcript Bubble */}
              <div className="w-full min-h-[90px] flex flex-col items-center justify-center text-center px-4">
                {interimText && (
                  <p className="text-white/50 text-sm font-light leading-relaxed animate-pulse">
                    „{interimText}“
                  </p>
                )}
                {!interimText && phase === 'speaking' && currentAIText && (
                  <p
                    className="text-white text-base font-normal leading-relaxed line-clamp-3"
                    style={{ animation: 'slideInUp 0.3s ease' }}
                  >
                    {currentAIText}
                  </p>
                )}
                {!interimText && phase === 'thinking' && (
                  <p className="text-white/40 text-xs tracking-wide flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    AI tvoří odpověď…
                  </p>
                )}
                {!interimText && phase === 'listening' && turns.length > 0 && !currentAIText && (
                  <p className="text-white/30 text-xs line-clamp-2">
                    Poslední: {turns[turns.length - 1].text}
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Live Transcript Sheet View */
            <div className="w-full max-w-xl h-full flex flex-col justify-between py-2">
              <div className="flex-1 overflow-y-auto px-2 space-y-4 pr-3 custom-scrollbar">
                <div className="text-center py-2">
                  <span className="text-xs uppercase font-medium tracking-widest text-white/30">
                    Živý přepis konverzace
                  </span>
                </div>

                {turns.length === 0 && !interimText && (
                  <div className="text-center py-12 text-white/30 text-sm">
                    Začni mluvit a text se zde objeví…
                  </div>
                )}

                {turns.map((turn) => (
                  <div
                    key={turn.id}
                    className={`flex flex-col ${turn.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        turn.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-none'
                          : 'bg-white/10 text-white/95 rounded-bl-none border border-white/10'
                      }`}
                    >
                      {turn.text}
                    </div>
                    <span className="text-[10px] text-white/30 mt-1 px-1">
                      {turn.role === 'user' ? 'Ty' : selectedModel?.name || 'AI'}
                    </span>
                  </div>
                ))}

                {/* Real-time speaking chunk */}
                {phase === 'speaking' && currentAIText && (
                  <div className="flex flex-col items-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-white/10 text-white/95 rounded-bl-none border border-white/10">
                      {currentAIText}
                    </div>
                    <span className="text-[10px] text-emerald-400 mt-1 px-1 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Právě mluví…
                    </span>
                  </div>
                )}

                {/* Real-time speech input */}
                {interimText && (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed bg-indigo-600/40 border border-indigo-400/40 text-white/70 italic rounded-br-none">
                      {interimText}…
                    </div>
                  </div>
                )}

                <div ref={turnsEndRef} />
              </div>
            </div>
          )}
        </main>

        {/* ── BOTTOM CONTROL BAR (Mobile Call Interface) ── */}
        <footer className="relative z-10 flex flex-col items-center pb-10 pt-4 px-6 gap-5 bg-gradient-to-t from-black via-black/80 to-transparent">
          <div className="flex items-center gap-7">
            {/* Mic Mute/Unmute */}
            <button
              onClick={() => {
                const nextMuted = !micMuted;
                setMicMuted(nextMuted);
                if (nextMuted) {
                  recognitionRef.current?.abort();
                  setPhase('ended');
                } else {
                  startListeningCycle();
                }
              }}
              className={`p-4 rounded-full border transition-all duration-200 active:scale-95 ${
                micMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                  : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'
              }`}
              title={micMuted ? 'Zapnout mikrofon' : 'Vypnout mikrofon'}
            >
              {micMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* End Call Button (Large Glowing Red Phone) */}
            <button
              onClick={endSession}
              className="flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                boxShadow: '0 0 35px rgba(239, 68, 68, 0.5)',
              }}
              title="Ukončit hlasový hovor"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>

            {/* Switch View (Orb / Chat) */}
            <button
              onClick={() => setShowHistory((h) => !h)}
              className="p-4 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all duration-200 active:scale-95"
              title="Přepnout zobrazení"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
          </div>

          {/* Subtitle helper */}
          <p className="text-white/30 text-[11px] font-medium tracking-wide">
            Klepnutím na červené tlačítko hovor ukončíš
          </p>
        </footer>
      </div>
    </>
  );
}
