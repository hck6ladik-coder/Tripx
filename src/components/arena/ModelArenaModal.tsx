import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  Swords,
  Play,
  RotateCcw,
  Check,
  Copy,
  Save,
  Trophy,
  Clock,
  Sparkles,
  Bot,
  X,
  Loader2,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface ArenaCandidate {
  id: string;
  name: string;
  modelId: string;
  badge: string;
  color: string;
  output: string;
  isLoading: boolean;
  timeMs: number;
  votes: number;
}

export function ModelArenaModal() {
  const {
    modelArenaOpen,
    setModelArenaOpen,
    createLocalFile,
    addToast,
  } = useAppStore();

  const [prompt, setPrompt] = useState(
    'Implementuj v TypeScriptu robustní LRU Cache třídu s O(1) složitostí pro get/put, kapacitou a unit testy.'
  );

  const [candidates, setCandidates] = useState<ArenaCandidate[]>([
    {
      id: 'fable5',
      name: 'Claude Fable 5',
      modelId: 'fcc/claude-fable-5',
      badge: '👑 Vlajková loď 2026',
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-300',
      output: '',
      isLoading: false,
      timeMs: 0,
      votes: 0,
    },
    {
      id: 'r1',
      name: 'DeepSeek R1',
      modelId: 'fcc/deepseek-r1',
      badge: '🧠 Reasoning Engine',
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30 text-purple-300',
      output: '',
      isLoading: false,
      timeMs: 0,
      votes: 0,
    },
    {
      id: 'qwen',
      name: 'Qwen 2.5 Coder',
      modelId: 'fcc/qwen-coder',
      badge: '💻 Full-Stack Specialist',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-300',
      output: '',
      isLoading: false,
      timeMs: 0,
      votes: 0,
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isBattleRunning, setIsBattleRunning] = useState(false);

  if (!modelArenaOpen) return null;

  const handleStartBattle = async () => {
    if (!prompt.trim() || isBattleRunning) return;

    setIsBattleRunning(true);
    setWinnerId(null);

    // Reset outputs
    setCandidates((prev) =>
      prev.map((c) => ({
        ...c,
        output: '',
        isLoading: true,
        timeMs: 0,
      }))
    );

    const startTime = Date.now();

    // Stream function for a single candidate
    const runCandidate = async (candidate: ArenaCandidate) => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'fcc',
            model: candidate.modelId,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullOutput = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                try {
                  const parsed = JSON.parse(line.replace('data: ', ''));
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  fullOutput += content;
                  setCandidates((prev) =>
                    prev.map((c) =>
                      c.id === candidate.id ? { ...c, output: fullOutput } : c
                    )
                  );
                } catch {}
              }
            }
          }
        }

        const duration = Date.now() - startTime;
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidate.id
              ? { ...c, isLoading: false, timeMs: duration }
              : c
          )
        );
      } catch (err: any) {
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candidate.id
              ? {
                  ...c,
                  isLoading: false,
                  output: `Chyba při generování: ${err.message}`,
                }
              : c
          )
        );
      }
    };

    // Run all 3 concurrently in parallel
    await Promise.all(candidates.map((c) => runCandidate(c)));
    setIsBattleRunning(false);
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToDisk = async (candidate: ArenaCandidate) => {
    const codeBlockMatch = candidate.output.match(/```[a-zA-Z0-9_\-\:]*\n([\s\S]*?)```/);
    const codeToSave = codeBlockMatch ? codeBlockMatch[1] : candidate.output;
    const fileName = `arena_${candidate.id}_solution.ts`;

    const success = await createLocalFile(fileName, codeToSave);
    if (success) {
      addToast({
        type: 'success',
        title: 'Kód byl uložen do projektu',
        message: fileName,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-7xl h-[94vh] bg-surface-elevated border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center ring-1 ring-amber-500/40">
              <Swords className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                AI Model Arena
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  3-WAY BATTLE
                </span>
              </h2>
              <p className="text-xs text-text-secondary">
                Souboj špičkových modelů vedle sebe v reálném čase: porovnej kód, uvažování a rychlost.
              </p>
            </div>
          </div>
          <button
            onClick={() => setModelArenaOpen(false)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prompt Input */}
        <div className="p-4 border-b border-border bg-background/50 flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Zadej úkol pro všechny modely..."
              className="flex-1 h-10 px-4 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-amber-500/60"
              disabled={isBattleRunning}
            />
            <Button
              variant="primary"
              onClick={handleStartBattle}
              disabled={isBattleRunning || !prompt.trim()}
              className="gap-2 px-6 h-10 bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/25"
            >
              {isBattleRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Swords className="w-4 h-4" />
              )}
              {isBattleRunning ? 'Souboj probíhá...' : 'Spustit souboj'}
            </Button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <span className="text-[11px] text-text-secondary self-center mr-1">Rychlá témata:</span>
            <button
              onClick={() => setPrompt('Napiš v TypeScriptu LRU Cache s get/put v O(1) a unit testy.')}
              className="px-2.5 py-0.5 text-xs rounded-lg bg-surface border border-border hover:border-amber-500/50 text-text-secondary hover:text-text-primary transition-colors font-mono"
            >
              ⚡ LRU Cache O(1)
            </button>
            <button
              onClick={() => setPrompt('Napiš v Pythonu A* Pathfinding algoritmus pro 2D bludiště s vizualizací v konzoli.')}
              className="px-2.5 py-0.5 text-xs rounded-lg bg-surface border border-border hover:border-amber-500/50 text-text-secondary hover:text-text-primary transition-colors font-mono"
            >
              🧭 A* Pathfinding
            </button>
            <button
              onClick={() => setPrompt('Navrhni architekturu pro Twitch bot s WebSocketem, pub/sub a reconnect logikou.')}
              className="px-2.5 py-0.5 text-xs rounded-lg bg-surface border border-border hover:border-amber-500/50 text-text-secondary hover:text-text-primary transition-colors font-mono"
            >
              🎮 Twitch Bot Architektura
            </button>
          </div>
        </div>

        {/* 3 Arena Columns */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border min-h-0 overflow-hidden">
          {candidates.map((c) => (
            <div
              key={c.id}
              className={`flex flex-col h-full overflow-hidden bg-background/30 transition-all ${
                winnerId === c.id ? 'ring-2 ring-amber-400/80 bg-amber-500/5' : ''
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-border bg-surface/30 flex items-center justify-between flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-text-primary">
                      {c.name}
                    </span>
                    {winnerId === c.id && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Trophy className="w-3 h-3" /> VÍTĚZ
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${c.color}`}>
                    {c.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {c.timeMs > 0 && (
                    <span className="text-[11px] font-mono text-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(c.timeMs / 1000).toFixed(1)}s
                    </span>
                  )}
                  {c.isLoading && (
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  )}
                </div>
              </div>

              {/* Output Content */}
              <div className="flex-1 p-3.5 overflow-y-auto font-mono text-xs leading-relaxed text-text-primary whitespace-pre-wrap selection:bg-accent/20">
                {c.output ? (
                  c.output
                ) : (
                  <div className="h-full flex items-center justify-center text-text-secondary/50 text-xs italic">
                    {c.isLoading ? 'Generuji odpověď...' : 'Čeká se na spuštění souboje...'}
                  </div>
                )}
              </div>

              {/* Column Footer Actions */}
              {c.output && (
                <div className="p-2.5 border-t border-border bg-surface/40 flex items-center justify-between gap-1 flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(c.id, c.output)}
                      className="text-xs h-7 px-2"
                    >
                      {copiedId === c.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedId === c.id ? 'Zkopírováno' : 'Kopírovat'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSaveToDisk(c)}
                      className="text-xs h-7 px-2"
                    >
                      <Save className="w-3 h-3" />
                      Uložit na disk
                    </Button>
                  </div>

                  <button
                    onClick={() => {
                      setWinnerId(c.id);
                      addToast({
                        type: 'success',
                        title: `🏆 ${c.name} zvolen jako vítěz!`,
                        message: 'Skvělá volba pro tento typ úlohy.',
                      });
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      winnerId === c.id
                        ? 'bg-amber-500 text-black font-bold shadow-md'
                        : 'bg-surface hover:bg-amber-500/20 text-text-secondary hover:text-amber-300 border border-border hover:border-amber-500/40'
                    }`}
                  >
                    <Trophy className="w-3 h-3" />
                    Vybrat vítěze
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
