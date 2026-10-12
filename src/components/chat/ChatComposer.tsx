import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ChatMessage, AgentMode, Attachment } from '@/types';
import { generateId, cn } from '@/lib/utils';
import { sendMessageStream } from '@/lib/api';
import { Button } from '../ui/Button';
import {
  Send,
  Paperclip,
  Image,
  Square,
  AtSign,
  Command,
  ChevronDown,
  X,
  FileText,
  Mic,
  MicOff,
  BookOpen,
  Headphones,
} from 'lucide-react';
import { useSpeechToText } from '@/hooks/useSpeech';
import { AGENT_MODES } from '@/lib/constants';

interface ChatComposerProps {
  conversationId?: string;
  prefill?: string;
  onClearPrefill?: () => void;
}

export function ChatComposer({
  conversationId,
  prefill,
  onClearPrefill,
}: ChatComposerProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const contentRef = useRef('');

  // Voice speech-to-text
  const { isListening, toggleListening, error: speechError } = useSpeechToText((transcriptText) => {
    if (transcriptText) {
      setInput((prev) => {
        const spacer = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + spacer + transcriptText;
      });
    }
  });

  useEffect(() => {
    if (prefill) {
      setInput(prefill);
      onClearPrefill?.();
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [prefill, onClearPrefill]);

  // Naslouchat na vložení z Prompt Manageru
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{ text: string }>).detail.text;
      if (text) {
        setInput(text);
        setTimeout(() => {
          textareaRef.current?.focus();
          adjustHeight();
        }, 50);
      }
    };
    window.addEventListener('prompt-manager-insert', handler);
    return () => window.removeEventListener('prompt-manager-insert', handler);
  }, []);

  const {
    conversations,
    addMessage,
    updateMessage,
    selectedModel: model,
    addToast,
    setPromptManagerOpen,
    setVoiceChatOpen,
  } = useAppStore();

  const conversation = conversations.find((c) => c.id === conversationId);

  const handleFiles = async (fileList: FileList | null, isImage = false) => {
    if (!fileList || fileList.length === 0) return;
    const newAttachments: Attachment[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        if (isImage || file.type.startsWith('image/')) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const url = await base64Promise;
          newAttachments.push({
            id: generateId(),
            name: file.name,
            type: 'image',
            size: file.size,
            url,
          });
        } else {
          const text = await file.text();
          newAttachments.push({
            id: generateId(),
            name: file.name,
            type: 'file',
            size: file.size,
            content: text,
          });
        }
      } catch (err: any) {
        addToast({
          type: 'error',
          title: `Nelze načíst ${file.name}`,
          message: err.message,
        });
      }
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSend = useCallback(async () => {
    if ((!input.trim() && attachments.length === 0) || !conversationId || isLoading) return;

    const trimmedInput = input.trim();

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: input.trim() || '(Přiložené soubory)',
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const assistantMessageId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      model: model?.name,
      provider: model?.providerId,
      streaming: true,
      agentStatus: 'thinking',
    };

    setInput('');
    setAttachments([]);
    setIsLoading(true);
    contentRef.current = '';

    addMessage(conversationId, userMessage);
    addMessage(conversationId, assistantMessage);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const result = await sendMessageStream(conversation!, userMessage, {
      onChunk: (chunk) => {
        contentRef.current += chunk;
        updateMessage(conversationId, assistantMessageId, {
          content: contentRef.current,
        });
      },
      onStatusChange: (status) => {
        updateMessage(conversationId, assistantMessageId, {
          agentStatus: status as ChatMessage['agentStatus'],
        });
      },
      onComplete: () => {
        updateMessage(conversationId, assistantMessageId, {
          streaming: false,
          agentStatus: 'completed',
        });
        setIsLoading(false);
      },
      onError: (error) => {
        updateMessage(conversationId, assistantMessageId, {
          streaming: false,
          error,
          agentStatus: 'failed',
        });
        setIsLoading(false);
      },
    });

    abortRef.current = result.abort;
  }, [
    input,
    attachments,
    conversationId,
    isLoading,
    conversation,
    model,
    addMessage,
    updateMessage,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Mode selector */}
      <div className="flex items-center gap-2 mb-2">
        <ModeSelector currentMode={conversation?.agentMode || 'chat'} />
        <div className="flex-1" />
        <span className="text-xs text-text-secondary">
          {model?.name || 'Žádný model'}
        </span>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, false);
          e.target.value = '';
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files, true);
          e.target.value = '';
        }}
      />

      {/* Input area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'relative bg-surface border rounded-xl transition-all',
          isDragging
            ? 'border-accent ring-2 ring-accent/30 bg-accent/5'
            : 'border-border focus-within:border-accent/50 focus-within:ring-1 focus-within:ring-accent/20'
        )}
      >
        {/* Attached files chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {attachments.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary"
              >
                {file.type === 'image' ? (
                  <Image className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-accent" />
                )}
                <span className="max-w-[180px] truncate">{file.name}</span>
                {file.size && (
                  <span className="text-[10px] text-text-secondary">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(file.id)}
                  className="p-0.5 ml-1 text-text-secondary hover:text-error rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustHeight();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Zeptej se, zadej úkol nebo přetáhni lokální soubory sem..."
          className="w-full px-4 py-3 bg-transparent text-sm text-text-primary placeholder:text-text-secondary/50 resize-none outline-none min-h-[56px] max-h-[200px]"
          rows={1}
        />

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/50">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              title="Připojit lokální soubor"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              title="Připojit obrázek"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              title="Odkázat soubor (@)"
              onClick={() => setInput((prev) => prev + '@')}
            >
              <AtSign className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
              title="Příkazy (/)"
              onClick={() => setShowCommands(!showCommands)}
            >
              <Command className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={cn(
                'p-1.5 rounded-lg transition-all relative',
                isListening
                  ? 'text-red-400 bg-red-500/20 animate-pulse ring-2 ring-red-500/50'
                  : 'text-text-secondary hover:text-accent hover:bg-surface-elevated'
              )}
              title={isListening ? 'Zastavit nahrávání hlasu (mluvíte česky)' : 'Mluvit do chatu (Hlasový vstup v češtině)'}
              onClick={toggleListening}
            >
              {isListening ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4" />}
            </button>
            <div className="w-px h-4 bg-border mx-0.5" />
            <button
              type="button"
              onClick={() => setPromptManagerOpen(true)}
              className="p-1.5 rounded-lg text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
              title="Prompt Manager (Ctrl+Shift+P)"
            >
              <BookOpen className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setVoiceChatOpen(true)}
              className="relative p-1.5 rounded-lg text-text-secondary hover:text-indigo-400 hover:bg-indigo-400/10 transition-all group"
              title="Živý hlasový chat jako ChatGPT (Ctrl+Shift+V)"
            >
              <Headphones className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary hidden sm:inline">
              Enter ↵ odeslat · Shift+Enter nový řádek
            </span>
            {isLoading ? (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => abortRef.current?.()}
              >
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() && attachments.length === 0}
              >
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Slash commands dropdown */}
      {showCommands && (
        <div className="mt-2 bg-surface-elevated border border-border rounded-lg shadow-xl overflow-hidden">
          <CommandItem
            text="/explain"
            desc="Vysvětli vybraný kód"
            onSelect={() => {
              setInput('/explain ');
              setShowCommands(false);
              textareaRef.current?.focus();
            }}
          />
          <CommandItem
            text="/refactor"
            desc="Refactoruj kód"
            onSelect={() => {
              setInput('/refactor ');
              setShowCommands(false);
              textareaRef.current?.focus();
            }}
          />
          <CommandItem
            text="/test"
            desc="Vygeneruj testy"
            onSelect={() => {
              setInput('/test ');
              setShowCommands(false);
              textareaRef.current?.focus();
            }}
          />
          <CommandItem
            text="/fix"
            desc="Oprav chyby v kódu"
            onSelect={() => {
              setInput('/fix ');
              setShowCommands(false);
              textareaRef.current?.focus();
            }}
          />
          <CommandItem
            text="/doc"
            desc="Přidej dokumentaci"
            onSelect={() => {
              setInput('/doc ');
              setShowCommands(false);
              textareaRef.current?.focus();
            }}
          />
        </div>
      )}
    </div>
  );
}

function ModeSelector({ currentMode }: { currentMode: AgentMode }) {
  const [open, setOpen] = useState(false);
  const { setAgentMode, activeConversationId } = useAppStore();

  const mode = AGENT_MODES.find((m) => m.id === currentMode) || AGENT_MODES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-surface-elevated border border-border rounded-lg hover:border-accent/50 transition-colors"
      >
        <span
          className={
            mode.id === 'chat'
              ? 'text-accent'
              : mode.id === 'plan'
                ? 'text-warning'
                : 'text-success'
          }
        >
          {mode.label}
        </span>
        <ChevronDown className="w-3 h-3 text-text-secondary" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute bottom-full mb-1 left-0 w-64 bg-surface-elevated border border-border rounded-lg shadow-xl z-20 overflow-hidden">
            {AGENT_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if (activeConversationId) {
                    setAgentMode(activeConversationId, m.id);
                  }
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 hover:bg-surface transition-colors ${
                  m.id === currentMode ? 'bg-accent/10' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium ${
                      m.id === 'chat'
                        ? 'text-accent'
                        : m.id === 'plan'
                          ? 'text-warning'
                          : 'text-success'
                    }`}
                  >
                    {m.label}
                  </span>
                  {m.id === currentMode && (
                    <span className="text-xs text-success">●</span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">
                  {m.description}
                </p>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CommandItem({
  text,
  desc,
  onSelect,
}: {
  text: string;
  desc: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface transition-colors text-left"
    >
      <span className="text-sm font-mono text-accent">{text}</span>
      <span className="text-xs text-text-secondary">{desc}</span>
    </button>
  );
}
