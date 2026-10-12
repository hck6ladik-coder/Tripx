import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { Plus, X, Terminal } from 'lucide-react';
import { Button } from '../ui/Button';

export function TerminalTabs() {
  const {
    terminals,
    activeTerminalId,
    setActiveTerminal,
    addTerminal,
    closeTerminal,
  } = useAppStore();

  return (
    <div className="flex items-center h-8 bg-background-secondary border-b border-border">
      <div className="flex-1 flex items-center overflow-x-auto">
        {terminals.map((term) => (
          <button
            key={term.id}
            onClick={() => setActiveTerminal(term.id)}
            className={cn(
              'group flex items-center gap-2 px-3 h-full text-xs border-r border-border transition-colors min-w-[100px]',
              activeTerminalId === term.id
                ? 'bg-surface text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
            )}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="flex-1 truncate text-left">{term.name}</span>
            {term.status === 'running' && (
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            )}
            {terminals.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(term.id);
                }}
                className="p-0.5 rounded hover:bg-surface-elevated opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={addTerminal}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}
