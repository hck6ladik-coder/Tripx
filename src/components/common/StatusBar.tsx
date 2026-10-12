import { useAppStore } from '@/store/useAppStore';
import { GitBranch, Circle, Zap, Keyboard, Lock } from 'lucide-react';

export function StatusBar() {
  const { currentProject, selectedModel, setLocked } = useAppStore();

  return (
    <div className="h-6 flex items-center px-3 bg-accent/10 border-t border-border text-xs">
      <div className="flex items-center gap-4 flex-1">
        {/* Project */}
        {currentProject && (
          <div className="flex items-center gap-1.5 text-text-secondary">
            <GitBranch className="w-3 h-3" />
            <span>{currentProject.name}</span>
            {currentProject.gitBranch && (
              <span className="text-accent">{currentProject.gitBranch}</span>
            )}
          </div>
        )}

        {/* Model */}
        <div className="flex items-center gap-1.5 text-text-secondary">
          <Zap className="w-3 h-3" />
          <span>{selectedModel?.name || 'Žádný model'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Lock Screen Trigger */}
        <button
          onClick={() => setLocked(true)}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
          title="Zamknout obrazovku (Kód: 666)"
        >
          <Lock className="w-3 h-3 text-amber-400" />
          <span className="text-[11px] font-mono">Zámek (666)</span>
        </button>

        {/* Status */}
        <div className="flex items-center gap-1.5">
          <Circle className="w-2 h-2 fill-success text-success" />
          <span className="text-text-secondary">Připraven</span>
        </div>

        {/* Shortcut hint */}
        <div className="flex items-center gap-1 text-text-secondary/60">
          <Keyboard className="w-3 h-3" />
          <span>Ctrl+K pro příkazy</span>
        </div>
      </div>
    </div>
  );
}
