import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  Search,
  FileCode,
  MessageSquare,
  Terminal,
  FolderOpen,
  Settings,
  Bot,
  Swords,
} from 'lucide-react';

const commands = [
  {
    id: 'new-chat',
    label: 'Nový chat',
    icon: <MessageSquare className="w-4 h-4" />,
    shortcut: 'Ctrl+N',
  },
  {
    id: 'open-file',
    label: 'Otevřít soubor',
    icon: <FileCode className="w-4 h-4" />,
    shortcut: 'Ctrl+O',
  },
  {
    id: 'open-project',
    label: 'Otevřít projekt',
    icon: <FolderOpen className="w-4 h-4" />,
    shortcut: 'Ctrl+Shift+O',
  },
  {
    id: 'new-terminal',
    label: 'Nový terminál',
    icon: <Terminal className="w-4 h-4" />,
    shortcut: 'Ctrl+`',
  },
  {
    id: 'settings',
    label: 'Nastavení',
    icon: <Settings className="w-4 h-4" />,
    shortcut: 'Ctrl+,',
  },
  {
    id: 'self-healing-agent',
    label: 'Autonomní Self-Healing Agent',
    icon: <Bot className="w-4 h-4 text-purple-400" />,
    shortcut: 'Ctrl+Shift+A',
  },
  {
    id: 'model-arena',
    label: 'AI Model Arena (Souboj modelů)',
    icon: <Swords className="w-4 h-4 text-amber-400" />,
    shortcut: 'Ctrl+Shift+M',
  },
  {
    id: 'toggle-sidebar',
    label: 'Přepnout sidebar',
    icon: <MessageSquare className="w-4 h-4" />,
    shortcut: 'Ctrl+B',
  },
];

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    createConversation,
    addTerminal,
    setSidebarVisible,
    sidebarVisible,
    setSelfHealingAgentModalOpen,
    setModelArenaOpen,
  } = useAppStore();

  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleSelect = (commandId: string) => {
    switch (commandId) {
      case 'new-chat':
        createConversation();
        break;
      case 'new-terminal':
        addTerminal();
        break;
      case 'toggle-sidebar':
        setSidebarVisible(!sidebarVisible);
        break;
      case 'self-healing-agent':
        setSelfHealingAgentModalOpen(true);
        break;
      case 'model-arena':
        setModelArenaOpen(true);
        break;
    }
    setCommandPaletteOpen(false);
    setSearch('');
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setCommandPaletteOpen(false)}
      />

      {/* Palette */}
      <div className="relative w-full max-w-xl bg-surface-elevated border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
          <Search className="w-5 h-5 text-text-secondary" />
          <input
            autoFocus
            type="text"
            placeholder="Zadej příkaz nebo hledej..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) =>
                  Math.min(prev + 1, filteredCommands.length - 1)
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
              } else if (e.key === 'Enter') {
                const cmd = filteredCommands[selectedIndex];
                if (cmd) handleSelect(cmd.id);
              }
            }}
          />
          <kbd className="px-2 py-1 text-xs bg-surface border border-border rounded text-text-secondary">
            ESC
          </kbd>
        </div>

        {/* Commands */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-text-secondary">
              Žádné výsledky pro &quot;{search}&quot;
            </div>
          ) : (
            filteredCommands.map((cmd, index) => (
              <button
                key={cmd.id}
                onClick={() => handleSelect(cmd.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  index === selectedIndex
                    ? 'bg-accent/10'
                    : 'hover:bg-surface'
                )}
              >
                <span className="text-text-secondary">{cmd.icon}</span>
                <span className="flex-1 text-sm text-text-primary">
                  {cmd.label}
                </span>
                {cmd.shortcut && (
                  <kbd className="px-2 py-0.5 text-xs bg-surface border border-border rounded text-text-secondary">
                    {cmd.shortcut}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
