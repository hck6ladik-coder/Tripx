import { ChatMessage as ChatMessageType, FileNode } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  User,
  Bot,
  Copy,
  Check,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Save,
  FileCode,
  ExternalLink,
  Loader2,
  FolderCheck,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '../ui/Button';
import { useAppStore } from '@/store/useAppStore';

interface ChatMessageProps {
  message: ChatMessageType;
  onRegenerate?: () => void;
}

function extractFilePath(code: string, language: string): { filePath: string | null; cleanCode: string } {
  // Check language tag e.g. typescript:src/index.ts
  if (language.includes(':')) {
    const parts = language.split(':');
    if (parts[1]?.trim()) {
      return { filePath: parts[1].trim(), cleanCode: code };
    }
  }

  // Check first few lines for filepath comment
  const lines = code.split('\n');
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i].trim();
    const match = line.match(/^(?:\/\/|#|\/\*|<!--)\s*(?:filepath|file|filename):\s*([^\s*#\/>]+)/i);
    if (match && match[1]) {
      const filePath = match[1].trim();
      return { filePath, cleanCode: code };
    }
  }

  return { filePath: null, cleanCode: code };
}

export function ChatMessage({ message, onRegenerate }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [batchSaving, setBatchSaving] = useState(false);
  const [showThink, setShowThink] = useState(false);
  const { createLocalFile } = useAppStore();

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract <think> reasoning if present
  let thinkContent = '';
  let displayContent = message.content || '';
  if (!isUser && displayContent.includes('<think>')) {
    const thinkMatch = displayContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/i);
    if (thinkMatch) {
      thinkContent = thinkMatch[1].trim();
      displayContent = displayContent.replace(/<think>[\s\S]*?(?:<\/think>|$)/i, '').trim();
    }
  }

  // Find all file paths detected in code blocks
  const detectedFiles: { path: string; code: string }[] = [];
  if (!isUser && message.content) {
    const codeBlockRegex = /```(?:[a-zA-Z0-9_\-\:]+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      const blockCode = match[1];
      const { filePath, cleanCode } = extractFilePath(blockCode, '');
      if (filePath) {
        detectedFiles.push({ path: filePath, code: cleanCode });
      }
    }
  }

  const handleSaveAll = async () => {
    setBatchSaving(true);
    for (const f of detectedFiles) {
      await createLocalFile(f.path, f.code);
    }
    setBatchSaving(false);
  };

  return (
    <div
      className={cn(
        'px-4 py-5 transition-colors',
        isUser ? 'bg-background' : 'bg-surface/30'
      )}
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={cn(
              'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
              isUser ? 'bg-accent/20' : 'bg-success/20'
            )}
          >
            {isUser ? (
              <User className="w-4 h-4 text-accent" />
            ) : (
              <Bot className="w-4 h-4 text-success" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary">
              {isUser ? 'Vy' : 'CodeSpace AI'}
            </span>
            <span className="text-xs text-text-secondary">
              {formatDate(message.timestamp)}
            </span>
            {message.model && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-surface-elevated text-text-secondary">
                {message.model}
              </span>
            )}
          </div>
        </div>

        {/* Batch action banner if multiple files are ready */}
        {!isUser && detectedFiles.length > 0 && (
          <div className="pl-10 mb-3">
            <div className="flex items-center justify-between p-2.5 bg-accent/10 border border-accent/30 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-text-primary">
                <FolderCheck className="w-4 h-4 text-accent flex-shrink-0" />
                <span>
                  Detekováno <strong>{detectedFiles.length}</strong> souborů připravených k zápisu na disk.
                </span>
              </div>
              <button
                onClick={handleSaveAll}
                disabled={batchSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-white text-xs font-medium rounded-lg hover:bg-accent/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {batchSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                {batchSaving ? 'Zapisuji na disk...' : 'Vytvořit všechny soubory'}
              </button>
            </div>
          </div>
        )}

        {/* Attachments if any */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="pl-10 mb-3 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-elevated border border-border rounded-lg text-xs text-text-primary"
              >
                {att.type === 'image' ? (
                  <ImageIcon className="w-3.5 h-3.5 text-accent" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-accent" />
                )}
                <span className="truncate max-w-[200px]">{att.name}</span>
                {att.size && (
                  <span className="text-[10px] text-text-secondary">
                    ({Math.round(att.size / 1024)} KB)
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="pl-10">
          {isUser ? (
            <p className="text-sm text-text-primary whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose-chat">
              {thinkContent && (
                <div className="mb-3 rounded-xl border border-purple-500/30 bg-purple-500/5 overflow-hidden shadow-sm">
                  <button
                    onClick={() => setShowThink(!showThink)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium text-purple-300 hover:bg-purple-500/10 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Myšlenkový pochod modelu (Reasoning)</span>
                    </span>
                    <span className="text-[11px] text-purple-400/80 bg-purple-500/10 px-2 py-0.5 rounded">
                      {showThink ? 'Skrýt ▲' : 'Zobrazit ▼'}
                    </span>
                  </button>
                  {showThink && (
                    <div className="px-3.5 py-2.5 border-t border-purple-500/20 text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed bg-black/30 max-h-80 overflow-y-auto">
                      {thinkContent}
                    </div>
                  )}
                </div>
              )}
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code(props) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    const rawLang = className?.replace('language-', '') || '';
                    const language = match ? match[1] : 'text';
                    const code = String(children).replace(/\n$/, '');

                    // Check if this is inline code (no language class and short)
                    const isInline = !match && !code.includes('\n');

                    if (isInline) {
                      return (
                        <code
                          className="px-1.5 py-0.5 bg-surface-elevated rounded text-sm text-accent font-mono"
                          {...rest}
                        >
                          {children}
                        </code>
                      );
                    }

                    return (
                      <CodeBlock code={code} language={language} rawLang={rawLang} />
                    );
                  },
                  pre({ children }) {
                    return <>{children}</>;
                  },
                }}
              >
                {displayContent}
              </ReactMarkdown>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-3 py-2 bg-surface-elevated border border-border rounded-lg text-xs text-text-secondary"
                >
                  {att.type === 'image' ? '🖼️' : '📄'} {att.name}
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {message.error && (
            <div className="mt-3 px-3 py-2 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
              {message.error}
            </div>
          )}

          {/* Actions */}
          {!isUser && !message.streaming && (
            <div className="mt-3 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(message.content)}
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copied ? 'Zkopírováno' : 'Kopírovat'}
              </Button>
              {onRegenerate && (
                <Button variant="ghost" size="sm" onClick={onRegenerate}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Znovu
                </Button>
              )}
            </div>
          )}

          {/* Streaming cursor */}
          {message.streaming && (
            <span className="inline-block w-2 h-4 bg-accent animate-pulse ml-0.5" />
          )}
        </div>
      </div>
    </div>
  );
}

function CodeBlock({
  code,
  language,
  rawLang,
}: {
  code: string;
  language: string;
  rawLang?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [customPath, setCustomPath] = useState('');

  const { createLocalFile, openFile } = useAppStore();

  const { filePath, cleanCode } = extractFilePath(code, rawLang || language);
  const effectivePath = filePath || customPath;

  const copy = async () => {
    await navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToDisk = async (targetPath: string) => {
    if (!targetPath.trim()) {
      setShowInput(true);
      return;
    }
    setSaving(true);
    const success = await createLocalFile(targetPath.trim(), cleanCode);
    setSaving(false);
    if (success) {
      setSaved(true);
      setShowInput(false);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const handleOpenInEditor = () => {
    const filename = effectivePath ? effectivePath.split(/[\/\\]/).pop() || 'kód' : `soubor.${language}`;
    const fileNode: FileNode = {
      id: effectivePath || `temp-${Date.now()}`,
      name: filename,
      path: effectivePath || filename,
      type: 'file',
      language,
      content: cleanCode,
    };
    openFile(fileNode);
  };

  return (
    <div className="my-3 rounded-xl border border-border overflow-hidden shadow-sm bg-surface">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-surface-elevated border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          {effectivePath ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-accent/15 border border-accent/30 rounded-md text-xs font-mono text-accent truncate">
              <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{effectivePath}</span>
            </div>
          ) : (
            <span className="text-xs text-text-secondary font-mono uppercase tracking-wider">
              {language}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick inline path prompt if not defined */}
          {showInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                placeholder="cesta k souboru (např. src/app.js)"
                value={customPath}
                onChange={(e) => setCustomPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveToDisk(customPath);
                  if (e.key === 'Escape') setShowInput(false);
                }}
                className="h-7 px-2 text-xs bg-surface border border-accent rounded text-text-primary focus:outline-none"
              />
              <button
                onClick={() => handleSaveToDisk(customPath)}
                disabled={saving || !customPath.trim()}
                className="px-2 py-1 text-xs bg-accent text-white rounded hover:bg-accent/90 disabled:opacity-50"
              >
                {saving ? 'Ukládám...' : 'Vytvořit'}
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="px-1.5 py-1 text-xs text-text-secondary hover:text-text-primary"
              >
                ✕
              </button>
            </div>
          ) : (
            <>
              {/* Save / Create on Disk button */}
              <button
                onClick={() => handleSaveToDisk(effectivePath || '')}
                disabled={saving}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg font-medium transition-colors shadow-sm',
                  saved
                    ? 'bg-success/20 text-success border border-success/40'
                    : 'bg-accent text-white hover:bg-accent/90'
                )}
                title={effectivePath ? `Uložit do ${effectivePath}` : 'Zadat název a vytvořit soubor na disku'}
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saved ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>
                  {saving
                    ? 'Zapisuji...'
                    : saved
                    ? 'Vytvořeno na disku!'
                    : effectivePath
                    ? 'Vytvořit na disk'
                    : 'Vytvořit soubor'}
                </span>
              </button>

              {/* Open in Editor button */}
              <button
                onClick={handleOpenInEditor}
                className="flex items-center gap-1 px-2 py-1 text-xs bg-surface border border-border text-text-secondary hover:text-text-primary hover:border-accent/50 rounded-lg transition-colors"
                title="Otevřít v editoru kódu"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Editor</span>
              </button>
            </>
          )}

          {/* Copy button */}
          <button
            onClick={copy}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition-colors"
            title="Kopírovat kód"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: '#161A23',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
      >
        {cleanCode}
      </SyntaxHighlighter>
    </div>
  );
}
