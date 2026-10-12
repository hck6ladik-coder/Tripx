import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { executeTerminalCommand } from '@/lib/api';
import {
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileCode,
  Terminal,
  Sparkles,
  Loader2,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface Step {
  title: string;
  desc: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  details?: string;
}

export function SelfHealingAgentModal() {
  const {
    selfHealingAgentModalOpen,
    setSelfHealingAgentModalOpen,
    currentProject,
    createLocalFile,
    refreshFileTree,
    addToast,
  } = useAppStore();

  const [command, setCommand] = useState('python moje_funkce.py');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState('');
  const [fixedFile, setFixedFile] = useState<string | null>(null);
  const [fixExplanation, setFixExplanation] = useState<string | null>(null);

  const [steps, setSteps] = useState<Step[]>([
    { title: '1. Spuštění v PowerShellu', desc: 'Spustí se příkaz v lokálním prostředí', status: 'pending' },
    { title: '2. Diagnostika & Hledání chyby', desc: 'AI analyzuje stack trace a nalezne vadný kód', status: 'pending' },
    { title: '3. Oprava souboru na disku', desc: 'Automatický přepis souboru s opraveným kódem', status: 'pending' },
    { title: '4. Ověření v terminálu', desc: 'Opětovné spuštění pro kontrolu funkčnosti', status: 'pending' },
  ]);

  const abortRef = useRef(false);

  if (!selfHealingAgentModalOpen) return null;

  const updateStepStatus = (index: number, status: Step['status'], details?: string) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, status, details: details || s.details } : s))
    );
  };

  const handleRunAgent = async () => {
    if (!command.trim() || isRunning) return;

    abortRef.current = false;
    setIsRunning(true);
    setTerminalOutput('');
    setFixedFile(null);
    setFixExplanation(null);

    // Reset steps
    setSteps([
      { title: '1. Spuštění v PowerShellu', desc: 'Spustí se příkaz v lokálním prostředí', status: 'running' },
      { title: '2. Diagnostika & Hledání chyby', desc: 'AI analyzuje stack trace a nalezne vadný kód', status: 'pending' },
      { title: '3. Oprava souboru na disku', desc: 'Automatický přepis souboru s opraveným kódem', status: 'pending' },
      { title: '4. Ověření v terminálu', desc: 'Opětovné spuštění pro kontrolu funkčnosti', status: 'pending' },
    ]);

    const cwd = currentProject?.path || 'd:\\trip';

    try {
      // KROK 1: Spustit příkaz v terminálu
      setTerminalOutput(`[AGENT] Spouštím v ${cwd}:\n> ${command}\n\n`);
      const run1 = await executeTerminalCommand(command, cwd);

      if (abortRef.current) return;

      const output1 = (run1.stdout + '\n' + run1.stderr).trim();
      setTerminalOutput((prev) => prev + output1 + '\n');

      if (run1.exitCode === 0 && !run1.stderr.trim()) {
        updateStepStatus(0, 'success', 'Příkaz proběhl bez chyb! Kód je funkční.');
        updateStepStatus(1, 'skipped', 'Žádná chyba nenalezena.');
        updateStepStatus(2, 'skipped', 'Není potřeba žádná oprava.');
        updateStepStatus(3, 'success', 'Hotovo.');
        setIsRunning(false);
        addToast({ type: 'success', title: 'Skript je v pořádku', message: 'Nebyly nalezeny žádné chyby.' });
        return;
      }

      updateStepStatus(0, 'failed', `Chyba (Exit code: ${run1.exitCode})`);
      updateStepStatus(1, 'running', 'Analyzuji stack trace a hledám soubor k opravě...');

      // KROK 2: Požádat AI o diagnostiku a opravený kód
      const agentPrompt = `
Jsi Autonomní Self-Healing Agent.
Spustil jsem v PowerShellu příkaz: \`${command}\`
V terminálu nastala následující chyba:

\`\`\`
${output1}
\`\`\`

ÚKOL:
1. Proveď analýzu chyby (Root Cause).
2. Urči konkrétní soubor, který chybu způsobuje.
3. Poskytni KOMPLETNÍ opravený kód tohoto souboru.
4. Na prvním řádku bloku kódu uveď: // filepath: relativni/cesta/k/souboru.pripona
(nebo # filepath: soubor.py pro Python).
5. V úvodu stručně jednou větou česky vysvětli, v čem byla chyba.
`;

      const aiRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'fcc',
          model: 'claude-fable-5',
          messages: [{ role: 'user', content: agentPrompt }],
          apiKeys: useAppStore.getState().settings.apiKeys || {},
          fccEndpoint: useAppStore.getState().settings.fccEndpoint || 'http://127.0.0.1:8082',
        }),
      });

      if (!aiRes.ok) {
        throw new Error('AI asistent neodpověděl');
      }

      // Read SSE stream
      const reader = aiRes.body?.getReader();
      const decoder = new TextDecoder();
      let aiFullResponse = '';

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
                aiFullResponse += parsed.choices?.[0]?.delta?.content || '';
              } catch {}
            }
          }
        }
      }

      if (abortRef.current) return;

      // Extract file path & code
      const codeBlockMatch = aiFullResponse.match(/```[a-zA-Z0-9_\-\:]*\n([\s\S]*?)```/);
      if (!codeBlockMatch) {
        throw new Error('AI nedodalo kód k opravě');
      }

      const rawCode = codeBlockMatch[1];
      let targetFile = '';
      const filepathMatch = rawCode.match(/(?:\/\/|#)\s*(?:filepath|file):\s*([^\r\n]+)/i);

      if (filepathMatch) {
        targetFile = filepathMatch[1].trim();
      } else {
        // Fallback: guess from command e.g. python moje_funkce.py -> moje_funkce.py
        const cmdParts = command.split(' ');
        targetFile = cmdParts.find((p) => p.endsWith('.py') || p.endsWith('.ts') || p.endsWith('.js')) || 'opraveno.txt';
      }

      setFixedFile(targetFile);
      setFixExplanation(aiFullResponse.slice(0, 300) + '...');
      updateStepStatus(1, 'success', `Chyba diagnostikována v: ${targetFile}`);
      updateStepStatus(2, 'running', `Zapisuji opravený soubor: ${targetFile}...`);

      // KROK 3: Zapsat opravený kód na disk
      const writeSuccess = await createLocalFile(targetFile, rawCode);
      if (!writeSuccess) {
        throw new Error(`Nepodařilo se zapsat opravený kód do ${targetFile}`);
      }

      await refreshFileTree();
      updateStepStatus(2, 'success', `Soubor ${targetFile} byl úspěšně opraven na disku!`);
      updateStepStatus(3, 'running', 'Znovu spouštím příkaz pro ověření...');

      // KROK 4: Znovuspuštění pro ověření
      setTerminalOutput((prev) => prev + `\n[AGENT] Opětovné spuštění pro ověření opravy:\n> ${command}\n\n`);
      const run2 = await executeTerminalCommand(command, cwd);
      const output2 = (run2.stdout + '\n' + run2.stderr).trim();
      setTerminalOutput((prev) => prev + output2 + '\n');

      if (run2.exitCode === 0) {
        updateStepStatus(3, 'success', '✓ Skript proběhl bez chyb! Kód byl úspěšně uzdraven.');
        addToast({
          type: 'success',
          title: '🎉 Kód byl úspěšně opraven!',
          message: `Soubor ${targetFile} byl uzdraven a test prošel na 100%.`,
        });
      } else {
        updateStepStatus(3, 'failed', `Skript stále vykazuje varování (Exit code ${run2.exitCode}).`);
      }
    } catch (err: any) {
      setTerminalOutput((prev) => prev + `\n[AGENT CHYBA]: ${err.message}\n`);
      addToast({ type: 'error', title: 'Agent selhal', message: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-surface-elevated border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center ring-1 ring-purple-500/40">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
                Autonomní Self-Healing Agent
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  FULL-AUTO LOOP
                </span>
              </h2>
              <p className="text-xs text-text-secondary">
                Spustí příkaz, odchytí chybu v terminálu, zanalyzuje ji, automaticky opraví soubor na disku a ověří funkčnost.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelfHealingAgentModalOpen(false)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Command Input & Presets */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-text-primary">
              Příkaz ke spuštění a otestování v PowerShellu:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent" />
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="např. python moje_funkce.py nebo npx tsc --noEmit"
                  className="w-full h-10 pl-9 pr-4 bg-background border border-border rounded-xl text-sm font-mono text-text-primary focus:outline-none focus:border-accent/60"
                  disabled={isRunning}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleRunAgent}
                disabled={isRunning || !command.trim()}
                className="gap-2 px-5 h-10 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25"
              >
                {isRunning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                {isRunning ? 'Agent pracuje...' : 'Spustit Self-Healing'}
              </Button>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-[11px] text-text-secondary self-center mr-1">Rychlé šablony:</span>
              <button
                onClick={() => setCommand('python moje_funkce.py')}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-border hover:border-purple-500/50 text-text-secondary hover:text-text-primary transition-colors font-mono"
              >
                🐍 python moje_funkce.py
              </button>
              <button
                onClick={() => setCommand('npx tsc --noEmit')}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-border hover:border-purple-500/50 text-text-secondary hover:text-text-primary transition-colors font-mono"
              >
                ⚡ npx tsc --noEmit
              </button>
              <button
                onClick={() => setCommand('npm run build')}
                className="px-2.5 py-1 text-xs rounded-lg bg-surface border border-border hover:border-purple-500/50 text-text-secondary hover:text-text-primary transition-colors font-mono"
              >
                📦 npm run build
              </button>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div className="bg-surface/50 border border-border rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Průběh autonomního cyklu
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border transition-all ${
                    step.status === 'running'
                      ? 'bg-purple-500/10 border-purple-500/40 ring-1 ring-purple-500/20'
                      : step.status === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : step.status === 'failed'
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-background/50 border-border/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-text-primary">
                      {step.title}
                    </span>
                    {step.status === 'running' && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    )}
                    {step.status === 'success' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                    {step.status === 'failed' && (
                      <XCircle className="w-3.5 h-3.5 text-red-400" />
                    )}
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    {step.details || step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Terminal Logs & Output */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent" />
                Živý výstup terminálu & opravy
              </span>
              {fixedFile && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Opravený soubor: <strong>{fixedFile}</strong>
                </span>
              )}
            </div>
            <pre className="p-3.5 bg-black/60 border border-border rounded-xl text-xs font-mono text-emerald-400/90 whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed shadow-inner">
              {terminalOutput || 'Čeká se na spuštění příkazu...'}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface/50 text-xs text-text-secondary">
          <span>Pracovní adresář: <strong>{currentProject?.path || 'd:\\trip'}</strong></span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelfHealingAgentModalOpen(false)}
          >
            Zavřít
          </Button>
        </div>
      </div>
    </div>
  );
}
