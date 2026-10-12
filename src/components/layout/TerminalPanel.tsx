import { useAppStore } from '@/store/useAppStore';
import { TerminalTabs } from '../terminal/TerminalTabs';
import { Terminal } from '../terminal/Terminal';

export function TerminalPanel() {
  const { terminals, activeTerminalId } = useAppStore();
  const activeTerminal = terminals.find((t) => t.id === activeTerminalId);

  return (
    <div className="h-full flex flex-col bg-background">
      <TerminalTabs />
      <div className="flex-1 min-h-0">
        {activeTerminal ? (
          <Terminal
            key={activeTerminal.id}
            terminalId={activeTerminal.id}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-text-secondary">
            <p className="text-sm">Žádný aktivní terminál</p>
          </div>
        )}
      </div>
    </div>
  );
}
