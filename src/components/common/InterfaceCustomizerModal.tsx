import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  X,
  Layout,
  Maximize2,
  Columns,
  MessageSquare,
  FileCode,
  Terminal,
  Sparkles,
  Sidebar as SidebarIcon,
  Check,
  Zap,
  Sliders,
  Eye,
  EyeOff,
  SunMoon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function InterfaceCustomizerModal() {
  const {
    interfaceCustomizerOpen,
    setInterfaceCustomizerOpen,
    settings,
    updateSettings,
    sidebarVisible,
    setSidebarVisible,
    setLayoutPreset,
  } = useAppStore();

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && interfaceCustomizerOpen) {
        setInterfaceCustomizerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [interfaceCustomizerOpen, setInterfaceCustomizerOpen]);

  if (!interfaceCustomizerOpen) return null;

  const showStatusBar = settings.showStatusBar !== false;
  const isCompact = !!settings.compactMode;
  const { chat, editor, terminal, preview } = settings.activePanels;

  const togglePanel = (panel: 'chat' | 'editor' | 'terminal' | 'preview') => {
    updateSettings({
      activePanels: {
        ...settings.activePanels,
        [panel]: !settings.activePanels[panel],
      },
    });
  };

  const toggleStatusBar = () => {
    updateSettings({
      showStatusBar: !showStatusBar,
    });
  };

  const toggleCompactMode = () => {
    updateSettings({
      compactMode: !isCompact,
    });
  };

  const toggleMinimap = () => {
    updateSettings({
      minimap: !settings.minimap,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setInterfaceCustomizerOpen(false)}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface-elevated border border-border rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
              <Layout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">
                Přizpůsobení rozhraní & panelů
              </h2>
              <p className="text-xs text-text-secondary">
                Zapínej a vypínej jednotlivé lišty, panely nebo vyber hotové rozvržení
              </p>
            </div>
          </div>
          <button
            onClick={() => setInterfaceCustomizerOpen(false)}
            className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ── 1. INTERACTIVE LAYOUT BLUEPRINT ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Vizuální plánek (Klepnutím přepneš panel)
              </span>
              <span className="text-[11px] text-text-secondary">
                Klikni na kteroukoli část pro zapnutí / vypnutí
              </span>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border flex flex-col gap-2 h-44 select-none">
              <div className="flex-1 flex gap-2 min-h-0">
                {/* Sidebar miniature */}
                <button
                  type="button"
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className={cn(
                    'w-16 rounded-lg border text-[10px] font-medium transition-all flex flex-col items-center justify-center gap-1',
                    sidebarVisible
                      ? 'bg-accent/15 border-accent/40 text-accent'
                      : 'bg-surface/30 border-dashed border-border text-text-secondary/40 hover:border-accent/30'
                  )}
                  title="Boční panel (Sidebar)"
                >
                  <SidebarIcon className="w-3.5 h-3.5" />
                  <span>Sidebar</span>
                </button>

                {/* Main grid miniature */}
                <div className="flex-1 flex flex-col gap-2 min-h-0">
                  {/* Top row: Chat & Editor */}
                  <div className="flex-1 flex gap-2 min-h-0">
                    <button
                      type="button"
                      onClick={() => togglePanel('chat')}
                      className={cn(
                        'flex-1 rounded-lg border text-[11px] font-medium transition-all flex items-center justify-center gap-1.5',
                        chat
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-400'
                          : 'bg-surface/30 border-dashed border-border text-text-secondary/40 hover:border-indigo-500/30'
                      )}
                      title="Chat panel"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePanel('editor')}
                      className={cn(
                        'flex-1 rounded-lg border text-[11px] font-medium transition-all flex items-center justify-center gap-1.5',
                        editor
                          ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                          : 'bg-surface/30 border-dashed border-border text-text-secondary/40 hover:border-blue-500/30'
                      )}
                      title="Editor kódu"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Editor</span>
                    </button>
                  </div>

                  {/* Bottom row: Terminal & Preview */}
                  <div className="h-14 flex gap-2">
                    <button
                      type="button"
                      onClick={() => togglePanel('terminal')}
                      className={cn(
                        'flex-1 rounded-lg border text-[11px] font-medium transition-all flex items-center justify-center gap-1.5',
                        terminal
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : 'bg-surface/30 border-dashed border-border text-text-secondary/40 hover:border-emerald-500/30'
                      )}
                      title="Terminál"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Terminál</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => togglePanel('preview')}
                      className={cn(
                        'flex-1 rounded-lg border text-[11px] font-medium transition-all flex items-center justify-center gap-1.5',
                        preview
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                          : 'bg-surface/30 border-dashed border-border text-text-secondary/40 hover:border-purple-500/30'
                      )}
                      title="Živý Canvas (Artifacts)"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Canvas</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Status bar strip miniature */}
              <button
                type="button"
                onClick={toggleStatusBar}
                className={cn(
                  'h-6 rounded-md border text-[10px] font-medium transition-all flex items-center justify-center gap-1.5',
                  showStatusBar
                    ? 'bg-accent/15 border-accent/40 text-accent'
                    : 'bg-surface/30 border-dashed border-border text-text-secondary/40 hover:border-accent/30'
                )}
                title="Spodní stavová lišta (Status Bar)"
              >
                <span>Spodní lišta (Status Bar)</span>
              </button>
            </div>
          </div>

          {/* ── 2. 1-CLICK LAYOUT PRESETS ── */}
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-3">
              Rychlé předvolby rozvržení
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => setLayoutPreset('full')}
                className="p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-elevated transition-all text-left group"
              >
                <div className="flex items-center gap-2 font-medium text-xs text-text-primary group-hover:text-accent mb-1">
                  <Columns className="w-3.5 h-3.5 text-accent" />
                  <span>Plné IDE</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Všechny panely: Chat, Editor, Terminál i lišty.
                </p>
              </button>

              <button
                onClick={() => setLayoutPreset('chat-only')}
                className="p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-elevated transition-all text-left group"
              >
                <div className="flex items-center gap-2 font-medium text-xs text-text-primary group-hover:text-accent mb-1">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Focus Chat</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Pouze AI chat na celou šířku obrazovky.
                </p>
              </button>

              <button
                onClick={() => setLayoutPreset('editor-only')}
                className="p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-elevated transition-all text-left group"
              >
                <div className="flex items-center gap-2 font-medium text-xs text-text-primary group-hover:text-accent mb-1">
                  <FileCode className="w-3.5 h-3.5 text-blue-400" />
                  <span>Čistý Editor</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Plný prostor na Monaco editor a soubory.
                </p>
              </button>

              <button
                onClick={() => setLayoutPreset('web-studio')}
                className="p-3 rounded-xl border border-border bg-surface hover:border-accent hover:bg-surface-elevated transition-all text-left group"
              >
                <div className="flex items-center gap-2 font-medium text-xs text-text-primary group-hover:text-accent mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Web Studio</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Editor kódu a živý Artifact Canvas vedle sebe.
                </p>
              </button>

              <button
                onClick={() => setLayoutPreset('zen')}
                className="p-3 rounded-xl border border-border bg-surface hover:border-amber-400/60 hover:bg-surface-elevated transition-all text-left group col-span-2 sm:col-span-1"
              >
                <div className="flex items-center gap-2 font-medium text-xs text-amber-400 mb-1">
                  <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ultra Zen Mode</span>
                </div>
                <p className="text-[11px] text-text-secondary">
                  Skryje sidebar, spodní lištu i všechny okolní panely.
                </p>
              </button>
            </div>
          </div>

          {/* ── 3. DETAILED TOGGLE SWITCHES ── */}
          <div>
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider block mb-3">
              Přepínače jednotlivých lišt a prvků
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Status bar toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center text-text-secondary">
                    {showStatusBar ? <Eye className="w-3.5 h-3.5 text-accent" /> : <EyeOff className="w-3.5 h-3.5 text-text-secondary/50" />}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-primary block">
                      Spodní stavová lišta
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      Zobrazuje model, stav, zámek a zkratky
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleStatusBar}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                    showStatusBar ? 'bg-accent' : 'bg-surface-elevated border border-border'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                      showStatusBar ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Sidebar toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center text-text-secondary">
                    <SidebarIcon className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-primary block">
                      Boční panel (Sidebar)
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      Historie chatů a navigace (Ctrl+B)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarVisible(!sidebarVisible)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                    sidebarVisible ? 'bg-accent' : 'bg-surface-elevated border border-border'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                      sidebarVisible ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Minimap toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center text-text-secondary">
                    <Sliders className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-primary block">
                      Minimapa v editoru
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      Přehled kódu na pravé straně editoru
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleMinimap}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                    settings.minimap ? 'bg-accent' : 'bg-surface-elevated border border-border'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                      settings.minimap ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              {/* Compact Mode toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-surface-elevated flex items-center justify-center text-text-secondary">
                    <Maximize2 className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-text-primary block">
                      Kompaktní režim (Více místa)
                    </span>
                    <span className="text-[10px] text-text-secondary">
                      Zmenší paddingy a lišty pro maximální plochu
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleCompactMode}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5',
                    isCompact ? 'bg-accent' : 'bg-surface-elevated border border-border'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200',
                      isCompact ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-surface text-xs text-text-secondary">
          <span className="font-mono text-[11px]">
            Zkratka: <span className="text-text-primary font-bold">Ctrl+Shift+L</span> kdykoliv otevře toto menu
          </span>
          <button
            onClick={() => setInterfaceCustomizerOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-accent text-white font-medium hover:bg-accent/90 transition-colors shadow-sm"
          >
            Hotovo
          </button>
        </div>
      </div>
    </div>
  );
}
