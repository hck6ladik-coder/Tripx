import { useAppStore } from '@/store/useAppStore';
import { GitBranch, Circle, Zap, Keyboard, Lock, Layout, EyeOff } from 'lucide-react';

export function StatusBar() {
  const {
    currentProject,
    selectedModel,
    setLocked,
    setInterfaceCustomizerOpen,
    updateSettings,
  } = useAppStore();

  return (
    <div className="h-6 flex items-center px-3 bg-accent/10 border-t border-border text-xs select-none">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Project */}
        {currentProject && (
          <div className="flex items-center gap-1.5 text-text-secondary truncate">
            <GitBranch className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{currentProject.name}</span>
            {currentProject.gitBranch && (
              <span className="text-accent flex-shrink-0">{currentProject.gitBranch}</span>
            )}
          </div>
        )}

        {/* Model */}
        <div className="flex items-center gap-1.5 text-text-secondary truncate">
          <Zap className="w-3 h-3 text-accent flex-shrink-0" />
          <span className="truncate">{selectedModel?.name || 'Žádný model'}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Interface Customizer Trigger */}
        <button
          onClick={() => setInterfaceCustomizerOpen(true)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
          title="Přizpůsobit panely & lišty (Ctrl+Shift+L)"
        >
          <Layout className="w-3 h-3 text-accent" />
          <span className="text-[11px] font-medium hidden sm:inline">Rozhraní</span>
        </button>

        {/* Lock Screen Trigger */}
        <button
          onClick={() => setLocked(true)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          title="Zamknout obrazovku (Kód: 666)"
        >
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] font-mono hidden md:inline">Zámek (666)</span>
        </button>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <Circle className="w-2 h-2 fill-success text-success" />
          <span className="text-text-secondary hidden sm:inline">Připraven</span>
        </div>

        {/* Shortcut hint */}
        <div className="flex items-center gap-1 text-text-secondary/60 hidden lg:flex">
          <Keyboard className="w-3 h-3" />
          <span>Ctrl+K</span>
        </div>

        {/* Quick Hide Status Bar button */}
        <button
          onClick={() => updateSettings({ showStatusBar: false })}
          className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
          title="Skrýt tuto spodní lištu (znovu otevřeš přes Ctrl+Shift+L)"
        >
          <EyeOff className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
