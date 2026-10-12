import { useAppStore } from '@/store/useAppStore';
import { ChatMessage as ChatMessageComponent } from '../chat/ChatMessage';
import { ChatComposer } from '../chat/ChatComposer';
import { ModelSelector } from '../chat/ModelSelector';
import { AgentActivity } from '../chat/AgentActivity';
import { Button } from '../ui/Button';
import { Bot, PanelLeftClose, MessageSquare, Swords } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { sendMessageStream } from '@/lib/api';

export function ChatPanel() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    updateMessage,
    sidebarVisible,
    setSidebarVisible,
    setSelfHealingAgentModalOpen,
    setModelArenaOpen,
  } = useAppStore();

  const [prefillPrompt, setPrefillPrompt] = useState('');
  const conversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages.length, conversation?.messages[conversation?.messages.length - 1]?.content]);

  const handleSelectPrompt = (promptText: string) => {
    if (!activeConversationId || !conversation) {
      createConversation();
    }
    setPrefillPrompt(promptText);
  };

  const handleRegenerate = async () => {
    if (!conversation || conversation.messages.length < 2) return;
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (lastMsg.role !== 'assistant') return;

    // Find preceding user message
    const userMsg = conversation.messages[conversation.messages.length - 2];
    if (!userMsg || userMsg.role !== 'user') return;

    updateMessage(conversation.id, lastMsg.id, {
      content: '',
      streaming: true,
      error: undefined,
      agentStatus: 'thinking',
    });

    let currentContent = '';
    await sendMessageStream(conversation, userMsg, {
      onChunk: (chunk) => {
        currentContent += chunk;
        updateMessage(conversation.id, lastMsg.id, {
          content: currentContent,
        });
      },
      onStatusChange: (status) => {
        updateMessage(conversation.id, lastMsg.id, {
          agentStatus: status as any,
        });
      },
      onComplete: () => {
        updateMessage(conversation.id, lastMsg.id, {
          streaming: false,
          agentStatus: 'completed',
        });
      },
      onError: (err) => {
        updateMessage(conversation.id, lastMsg.id, {
          streaming: false,
          error: err,
          agentStatus: 'failed',
        });
      },
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          {!sidebarVisible && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarVisible(true)}
            >
              <PanelLeftClose className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-text-primary">
              {conversation?.title || 'AI Chat'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSelfHealingAgentModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all shadow-sm cursor-pointer"
            title="Spustit Autonomního Self-Healing Agenta"
          >
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline font-semibold">Agent</span>
          </button>
          <button
            onClick={() => setModelArenaOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all shadow-sm cursor-pointer"
            title="Spustit AI Model Arenu (Souboj modelů vedle sebe)"
          >
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline font-semibold">Arena</span>
          </button>
          <ModelSelector />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {conversation && conversation.messages.length > 0 ? (
          <div className="divide-y divide-border/50">
            {conversation.messages.map((message, idx) => (
              <ChatMessageComponent
                key={message.id}
                message={message}
                onRegenerate={
                  message.role === 'assistant' && idx === conversation.messages.length - 1
                    ? handleRegenerate
                    : undefined
                }
              />
            ))}
            {conversation.messages[conversation.messages.length - 1]
              ?.agentStatus &&
              conversation.messages[conversation.messages.length - 1]
                ?.agentStatus !== 'completed' &&
              conversation.messages[conversation.messages.length - 1]
                ?.agentStatus !== 'failed' && (
                <AgentActivity
                  status={
                    conversation.messages[conversation.messages.length - 1]
                      .agentStatus!
                  }
                />
              )}
          </div>
        ) : (
          <EmptyChatState onSelectPrompt={handleSelectPrompt} />
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-4">
        <ChatComposer
          conversationId={conversation?.id}
          prefill={prefillPrompt}
          onClearPrefill={() => setPrefillPrompt('')}
        />
      </div>
    </div>
  );
}

function EmptyChatState({
  onSelectPrompt,
}: {
  onSelectPrompt: (text: string) => void;
}) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        CodeSpace AI
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-6">
        Váš AI programovací asistent. Zeptejte se na cokoli, nebo mi dejte
        úkol upravit váš kód.
      </p>
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        <SuggestionButton
          text="Vytvoř moderní přihlašovací stránku."
          onClick={() => onSelectPrompt('Vytvoř moderní přihlašovací stránku.')}
        />
        <SuggestionButton
          text="Vysvětli mi React hooks"
          onClick={() => onSelectPrompt('Vysvětli mi React hooks')}
        />
        <SuggestionButton
          text="Refactoruj tento kód na TypeScript"
          onClick={() => onSelectPrompt('Refactoruj tento kód na TypeScript')}
        />
      </div>
    </div>
  );
}

function SuggestionButton({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-3 text-left text-sm text-text-secondary bg-surface border border-border rounded-lg hover:border-accent/50 hover:text-text-primary transition-all cursor-pointer"
    >
      {text}
    </button>
  );
}
