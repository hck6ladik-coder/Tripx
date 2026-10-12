import { useAppStore } from '@/store/useAppStore';
import { ChatMessage as ChatMessageComponent } from '../chat/ChatMessage';
import { ChatComposer } from '../chat/ChatComposer';
import { ModelSelector } from '../chat/ModelSelector';
import { AgentActivity } from '../chat/AgentActivity';
import { Button } from '../ui/Button';
import { Bot, PanelLeftClose, MessageSquare } from 'lucide-react';
import { useEffect, useRef } from 'react';

export function ChatPanel() {
  const {
    conversations,
    activeConversationId,
    createConversation,
    sidebarVisible,
    setSidebarVisible,
  } = useAppStore();

  const conversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages.length, conversation?.messages[conversation?.messages.length - 1]?.content]);

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
        <div className="flex items-center gap-2">
          <ModelSelector />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {conversation && conversation.messages.length > 0 ? (
          <div className="divide-y divide-border/50">
            {conversation.messages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
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
          <EmptyChatState onNewChat={() => createConversation()} />
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border p-4">
        <ChatComposer conversationId={conversation?.id} />
      </div>
    </div>
  );
}

function EmptyChatState({ onNewChat }: { onNewChat: () => void }) {
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
        <SuggestionButton text="Vytvoř moderní přihlašovací stránku." />
        <SuggestionButton text="Vysvětli mi React hooks" />
        <SuggestionButton text="Refactoruj tento kód na TypeScript" />
      </div>
    </div>
  );
}

function SuggestionButton({ text }: { text: string }) {
  return (
    <button
      className="px-4 py-3 text-left text-sm text-text-secondary bg-surface border border-border rounded-lg hover:border-accent/50 hover:text-text-primary transition-all"
    >
      {text}
    </button>
  );
}
