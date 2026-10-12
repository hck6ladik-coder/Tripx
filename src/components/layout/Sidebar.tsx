import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import {
  MessageSquarePlus,
  Search,
  History,
  FolderOpen,
  Star,
  Settings,
  ChevronLeft,
  Trash2,
  Pencil,
  Bot,
  Lock,
  Layout,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';

export function Sidebar() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    setActiveConversation,
    deleteConversation,
    renameConversation,
    setSidebarVisible,
    currentProject,
    setSettingsModalOpen,
    setLocked,
    setInterfaceCustomizerOpen,
  } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRename = (id: string) => {
    if (editTitle.trim()) {
      renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-accent" />
          </div>
          <span className="font-semibold text-sm text-text-primary">
            hck6lada
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Tooltip content="Rozvržení & Panely (Ctrl+Shift+L)">
            <button
              onClick={() => setInterfaceCustomizerOpen(true)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
            >
              <Layout className="w-3.5 h-3.5 text-accent" />
            </button>
          </Tooltip>
          <Tooltip content="Zamknout obrazovku (kód: 666)">
            <button
              onClick={() => setLocked(true)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
          <Tooltip content="Skrýt sidebar (Ctrl+B)">
            <button
              onClick={() => setSidebarVisible(false)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          variant="primary"
          className="w-full gap-2"
          onClick={() => createConversation()}
        >
          <MessageSquarePlus className="w-4 h-4" />
          Nový chat
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            type="text"
            placeholder="Hledat konverzace..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50"
          />
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* Projects */}
        <div className="mb-4">
          <div className="px-2 py-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center justify-between">
            <span>Projekt</span>
            <button
              onClick={() => setSettingsModalOpen(true, 'workspace')}
              className="text-accent hover:underline text-[11px] font-normal"
              title="Vybrat lokální složku z disku"
            >
              Změnit
            </button>
          </div>
          <button
            onClick={() => setSettingsModalOpen(true, 'workspace')}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <FolderOpen className="w-4 h-4 text-accent" />
            <span className="truncate">{currentProject?.name || 'Otevřít složku...'}</span>
          </button>
        </div>

        {/* Recent Conversations */}
        <div>
          <div className="px-2 py-1.5 text-xs font-medium text-text-secondary uppercase tracking-wider flex items-center justify-between">
            <span>Historie</span>
            <History className="w-3 h-3" />
          </div>

          {filteredConversations.length === 0 && (
            <div className="px-2 py-4 text-center text-xs text-text-secondary">
              Žádné konverzace
            </div>
          )}

          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                'group flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors cursor-pointer',
                activeConversationId === conv.id
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
              )}
              onClick={() => setActiveConversation(conv.id)}
            >
              {conv.agentMode === 'agent' ? (
                <Bot className="w-4 h-4 flex-shrink-0" />
              ) : (
                <MessageSquarePlus className="w-4 h-4 flex-shrink-0" />
              )}

              {editingId === conv.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleRename(conv.id)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleRename(conv.id)
                  }
                  className="flex-1 min-w-0 bg-transparent text-text-primary outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 min-w-0 truncate">{conv.title}</span>
              )}

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(conv.id);
                    setEditTitle(conv.title);
                  }}
                  className="p-1 rounded hover:bg-surface"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Opravdu smazat tuto konverzaci?')) {
                      deleteConversation(conv.id);
                    }
                  }}
                  className="p-1 rounded hover:bg-surface text-error"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-1">
        <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors">
          <Star className="w-4 h-4" />
          Oblíbené
        </button>
        <button
          onClick={() => setInterfaceCustomizerOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <Layout className="w-4 h-4 text-accent" />
          Rozvržení & Panely
        </button>
        <button
          onClick={() => setSettingsModalOpen(true)}
          className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
        >
          <Settings className="w-4 h-4" />
          Nastavení
        </button>
      </div>
    </div>
  );
}
