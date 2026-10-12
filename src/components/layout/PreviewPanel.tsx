import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '../ui/Button';
import {
  Globe,
  RefreshCw,
  ExternalLink,
  Code2,
  Eye,
  Columns,
  Smartphone,
  Tablet,
  Monitor,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Terminal,
  Sparkles,
  AlertTriangle,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CanvasViewMode = 'preview' | 'code' | 'split';
type DeviceMode = 'desktop' | 'tablet' | 'mobile';

interface ConsoleLog {
  id: string;
  type: 'log' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export function PreviewPanel() {
  const { activeArtifact, setActiveArtifact } = useAppStore();

  const [activeTab, setActiveTab] = useState<'canvas' | 'browser'>(
    activeArtifact ? 'canvas' : 'browser'
  );

  // When activeArtifact changes, automatically switch to canvas tab
  useEffect(() => {
    if (activeArtifact) {
      setActiveTab('canvas');
    }
  }, [activeArtifact]);

  // Browser state
  const [url, setUrl] = useState('http://localhost:3000');
  const [browserKey, setBrowserKey] = useState(0);
  const [browserLoading, setBrowserLoading] = useState(false);

  // Canvas state
  const [viewMode, setViewMode] = useState<CanvasViewMode>('preview');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editableCode, setEditableCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<ConsoleLog[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [sandboxKey, setSandboxKey] = useState(0);

  // Update local code when activeArtifact changes
  useEffect(() => {
    if (activeArtifact) {
      setEditableCode(activeArtifact.code);
      setConsoleLogs([]);
    }
  }, [activeArtifact]);

  // Listen to messages from sandbox iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'codespace-canvas-console') {
        const newLog: ConsoleLog = {
          id: Math.random().toString(),
          type: e.data.level || 'log',
          message: e.data.args ? e.data.args.join(' ') : String(e.data.message || ''),
          timestamp: new Date().toLocaleTimeString(),
        };
        setConsoleLogs((prev) => [...prev.slice(-49), newLog]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRefreshBrowser = () => {
    setBrowserLoading(true);
    setBrowserKey((k) => k + 1);
    setTimeout(() => setBrowserLoading(false), 500);
  };

  const handleRestartSandbox = () => {
    setConsoleLogs([]);
    setSandboxKey((k) => k + 1);
  };

  const handleCopyCode = async () => {
    const textToCopy = editableCode || activeArtifact?.code || '';
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHtml = () => {
    const content = generatedHtmlDoc;
    const blob = new Blob([content], { type: 'text/html' });
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u;
    a.download = `${activeArtifact?.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'artifact'}.html`;
    a.click();
    URL.revokeObjectURL(u);
  };

  // Generate full HTML Document with sandbox runner
  const generatedHtmlDoc = useMemo(() => {
    const code = editableCode || activeArtifact?.code || '';
    const lang = (activeArtifact?.language || 'html').toLowerCase();

    // Console intercepter script
    const consoleBridgeScript = `
      <script>
        (function() {
          const sendLog = (level, args) => {
            try {
              window.parent.postMessage({
                type: 'codespace-canvas-console',
                level: level,
                args: Array.from(args).map(a => {
                  if (typeof a === 'object') {
                    try { return JSON.stringify(a); } catch(e) { return String(a); }
                  }
                  return String(a);
                })
              }, '*');
            } catch(e) {}
          };
          const origLog = console.log;
          const origWarn = console.warn;
          const origError = console.error;
          console.log = function() { origLog.apply(console, arguments); sendLog('log', arguments); };
          console.warn = function() { origWarn.apply(console, arguments); sendLog('warn', arguments); };
          console.error = function() { origError.apply(console, arguments); sendLog('error', arguments); };
          window.onerror = function(msg, url, line) {
            sendLog('error', ['Chyba na řádku ' + line + ': ' + msg]);
          };
        })();
      </script>
    `;

    // 1. If pure SVG
    if (lang === 'svg' || (code.trim().startsWith('<svg') && code.trim().endsWith('</svg>'))) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SVG Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 24px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0f111a;
      background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 0);
      background-size: 20px 20px;
    }
    svg {
      max-width: 90vw;
      max-height: 85vh;
      filter: drop-shadow(0 10px 25px rgba(0,0,0,0.5));
    }
  </style>
  ${consoleBridgeScript}
</head>
<body>
  ${code}
</body>
</html>`;
    }

    // 2. If React / JSX / TSX
    const isReact =
      lang.includes('react') ||
      lang.includes('jsx') ||
      lang.includes('tsx') ||
      code.includes('import React') ||
      code.includes('export default') ||
      code.includes('useState(') ||
      code.includes('useEffect(');

    if (isReact) {
      // Clean up export and import statements for in-browser Babel execution
      const sanitizedReactCode = code
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, '')
        .replace(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/g, 'function App')
        .replace(/export\s+default\s+([a-zA-Z0-9_]+);?/g, 'const App = $1;')
        .replace(/export\s+/g, '');

      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>React Live Canvas</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0a0b10;
      color: #f3f4f6;
      min-height: 100vh;
    }
  </style>
  ${consoleBridgeScript}
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect, useRef, useMemo, useCallback } = React;

    ${sanitizedReactCode}

    // Auto-mount App or first component
    try {
      const TargetComponent = typeof App !== 'undefined' ? App : null;
      if (TargetComponent) {
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<TargetComponent />);
      } else {
        document.getElementById('root').innerHTML = '<div style="padding: 24px; color: #f87171;">Chyba: Komponenta App nebyla nalezena. Definujte function App() nebo export default.</div>';
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div style="padding: 24px; color: #f87171;">Chyba při spuštění komponenty: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
    }

    // 3. Default HTML/CSS/JS
    // Check if code already contains <html>
    if (code.toLowerCase().includes('<html') || code.toLowerCase().includes('<!doctype')) {
      // Inject Tailwind & console bridge into existing html
      return code.replace(
        /<head[^>]*>/i,
        `<head><script src="https://cdn.tailwindcss.com"></script>${consoleBridgeScript}`
      );
    }

    // Wrap bare HTML/JS in boilerplate
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Live Canvas</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0d0e15;
      color: #e5e7eb;
      min-height: 100vh;
    }
  </style>
  ${consoleBridgeScript}
</head>
<body>
  ${code}
</body>
</html>`;
  }, [editableCode, activeArtifact]);

  // Viewport width styling for device simulator
  const viewportStyles: Record<DeviceMode, string> = {
    desktop: 'w-full h-full rounded-none',
    tablet: 'w-[768px] h-full max-h-[92%] my-auto shadow-2xl rounded-2xl border-4 border-white/10',
    mobile: 'w-[375px] h-full max-h-[92%] my-auto shadow-2xl rounded-3xl border-8 border-white/10',
  };

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-background select-none',
        isFullscreen && 'fixed inset-0 z-[80] bg-background'
      )}
    >
      {/* ── TOP HEADER / TAB SELECTOR ── */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border bg-background-secondary flex-shrink-0">
        {/* Left Tabs */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('canvas')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              activeTab === 'canvas'
                ? 'bg-accent/15 text-accent border border-accent/30 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Živý Canvas (Artifacts)</span>
            {activeArtifact && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('browser')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              activeTab === 'browser'
                ? 'bg-accent/15 text-accent border border-accent/30 shadow-sm'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Prohlížeč (URL)</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5">
          {activeTab === 'canvas' && activeArtifact && (
            <>
              {/* View Mode Toggle */}
              <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('preview')}
                  className={cn(
                    'p-1 rounded text-xs transition-colors',
                    viewMode === 'preview'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                  title="Pouze náhled"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={cn(
                    'p-1 rounded text-xs transition-colors',
                    viewMode === 'split'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                  title="Rozdělené zobrazení (Kód & Náhled)"
                >
                  <Columns className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('code')}
                  className={cn(
                    'p-1 rounded text-xs transition-colors',
                    viewMode === 'code'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                  title="Pouze kód"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Device Selector */}
              {viewMode !== 'code' && (
                <div className="flex items-center bg-surface border border-border rounded-lg p-0.5">
                  <button
                    onClick={() => setDeviceMode('desktop')}
                    className={cn(
                      'p-1 rounded text-xs transition-colors',
                      deviceMode === 'desktop'
                        ? 'bg-surface-elevated text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                    title="Desktop náhled"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeviceMode('tablet')}
                    className={cn(
                      'p-1 rounded text-xs transition-colors',
                      deviceMode === 'tablet'
                        ? 'bg-surface-elevated text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                    title="Tablet náhled (768px)"
                  >
                    <Tablet className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeviceMode('mobile')}
                    className={cn(
                      'p-1 rounded text-xs transition-colors',
                      deviceMode === 'mobile'
                        ? 'bg-surface-elevated text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                    title="Mobil náhled (375px)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Refresh Sandbox */}
              <button
                onClick={handleRestartSandbox}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                title="Restartovat aplikaci"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Copy Code */}
              <button
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                title="Kopírovat kód"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Download HTML */}
              <button
                onClick={handleDownloadHtml}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                title="Stáhnout jako .html soubor"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Console */}
              <button
                onClick={() => setShowConsole((c) => !c)}
                className={cn(
                  'relative p-1.5 rounded-lg transition-colors',
                  showConsole
                    ? 'bg-accent/20 text-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                )}
                title="Konzole aplikace"
              >
                <Terminal className="w-3.5 h-3.5" />
                {consoleLogs.some((l) => l.type === 'error') && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500" />
                )}
              </button>

              {/* Fullscreen Toggle */}
              <button
                onClick={() => setIsFullscreen((f) => !f)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                title={isFullscreen ? 'Zmenšit' : 'Celá obrazovka'}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close Canvas Artifact */}
              <button
                onClick={() => setActiveArtifact(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Zavřít Canvas"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 relative overflow-hidden">
        {activeTab === 'browser' ? (
          /* ── BROWSER MODE (URL) ── */
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 px-3 h-9 border-b border-border bg-surface">
              <Globe className="w-4 h-4 text-text-secondary" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRefreshBrowser();
                }}
                className="flex-1 h-7 px-2 bg-background border border-border rounded text-xs text-text-primary focus:outline-none focus:border-accent"
              />
              <Button variant="ghost" size="icon" onClick={handleRefreshBrowser}>
                <RefreshCw className={cn('w-4 h-4', browserLoading && 'animate-spin')} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.open(url, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 relative">
              <iframe
                key={browserKey}
                src={url}
                className="w-full h-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            </div>
          </div>
        ) : (
          /* ── CANVAS ARTIFACTS MODE ── */
          <div className="h-full flex flex-col">
            {activeArtifact ? (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Artifact title bar */}
                <div className="flex items-center justify-between px-3 h-8 border-b border-border bg-surface/50 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-semibold text-text-primary truncate">
                      {activeArtifact.title}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-accent/15 text-accent text-[10px] font-mono uppercase">
                      {activeArtifact.language}
                    </span>
                  </div>
                  <span className="text-[11px] text-text-secondary">
                    {new Date(activeArtifact.updatedAt ?? Date.now()).toLocaleTimeString()}
                  </span>
                </div>

                {/* Viewport Area */}
                <div className="flex-1 flex min-h-0 bg-[#07080d]">
                  {/* Code editor view (split or code mode) */}
                  {(viewMode === 'code' || viewMode === 'split') && (
                    <div
                      className={cn(
                        'flex flex-col border-r border-border bg-[#0d0e15]',
                        viewMode === 'split' ? 'w-1/2' : 'w-full'
                      )}
                    >
                      <div className="px-3 py-1.5 bg-surface-elevated/40 border-b border-border text-[11px] text-text-secondary flex items-center justify-between">
                        <span>Zdrojový kód</span>
                        <span>{editableCode.split('\n').length} řádků</span>
                      </div>
                      <textarea
                        value={editableCode}
                        onChange={(e) => setEditableCode(e.target.value)}
                        className="flex-1 p-3 bg-transparent text-text-primary font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-accent/30"
                        spellCheck={false}
                      />
                    </div>
                  )}

                  {/* Preview Render Area */}
                  {(viewMode === 'preview' || viewMode === 'split') && (
                    <div
                      className={cn(
                        'flex-1 flex flex-col items-center justify-center relative p-3 overflow-hidden bg-[#0c0d14]',
                        deviceMode !== 'desktop' && 'p-6'
                      )}
                    >
                      <iframe
                        key={sandboxKey}
                        srcDoc={generatedHtmlDoc}
                        title="Artifact Live Sandbox"
                        sandbox="allow-scripts allow-modals"
                        className={cn('transition-all duration-300 border-0 bg-black', viewportStyles[deviceMode])}
                      />
                    </div>
                  )}
                </div>

                {/* ── INLINE CONSOLE DRAWER ── */}
                {showConsole && (
                  <div className="h-44 border-t border-border bg-[#0a0a10] flex flex-col flex-shrink-0">
                    <div className="flex items-center justify-between px-3 h-7 bg-surface-elevated border-b border-border text-xs">
                      <div className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="font-semibold text-text-primary">Konzole Canvasu</span>
                        <span className="text-[10px] text-text-secondary">({consoleLogs.length})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setConsoleLogs([])}
                          className="px-2 py-0.5 text-[10px] text-text-secondary hover:text-text-primary rounded hover:bg-surface"
                        >
                          Vymazat
                        </button>
                        <button
                          onClick={() => setShowConsole(false)}
                          className="p-1 text-text-secondary hover:text-text-primary rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
                      {consoleLogs.length === 0 ? (
                        <p className="text-white/20 text-xs italic p-1">Žádné výstupy z konzole zatím…</p>
                      ) : (
                        consoleLogs.map((log) => (
                          <div
                            key={log.id}
                            className={cn(
                              'px-2 py-1 rounded text-[11px] flex items-start gap-2 leading-relaxed',
                              log.type === 'error'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : log.type === 'warn'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : 'text-text-secondary hover:bg-white/5'
                            )}
                          >
                            <span className="text-white/30 text-[10px] flex-shrink-0">{log.timestamp}</span>
                            <span className="flex-1 break-words">{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ── EMPTY CANVAS STATE / STARTER TEMPLATES ── */
              <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-background to-surface/20">
                <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-4 text-accent shadow-lg shadow-accent/10">
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-1">
                  Živý Canvas & Artifacts Preview
                </h3>
                <p className="text-xs text-text-secondary max-w-md mb-6 leading-relaxed">
                  Spusť libovolnou HTML, React/TSX nebo SVG komponentu z chatu nebo editoru
                  přímo v živém interaktivním sandboxy s Tailwind CSS!
                </p>

                {/* Quick launch cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full text-left">
                  <button
                    onClick={() => {
                      setActiveArtifact({
                        id: 'demo-card',
                        title: 'Tailwind Glassmorphic Karta',
                        language: 'html',
                        code: `<div class="max-w-sm mx-auto my-12 p-6 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl text-white">
  <div class="flex items-center gap-3 mb-4">
    <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-xl shadow-lg">✨</div>
    <div>
      <h4 class="font-bold text-lg">CodeSpace AI</h4>
      <p class="text-xs text-indigo-300">Živý Artifact Canvas</p>
    </div>
  </div>
  <p class="text-sm text-gray-300 mb-6 leading-relaxed">
    Tato komponenta se vykresluje v živém sandboxy. Můžeš upravit její kód v záložce vlevo a ihned vidět změny!
  </p>
  <button onclick="alert('Funguje to skvěle!')" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 font-medium text-sm hover:opacity-90 active:scale-95 transition-all shadow-lg">
    Vyzkoušet interakci
  </button>
</div>`,
                        updatedAt: new Date(),
                      });
                    }}
                    className="p-3.5 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated transition-all group"
                  >
                    <div className="text-xs font-semibold text-text-primary group-hover:text-accent flex items-center gap-1.5 mb-1">
                      <Play className="w-3 h-3 text-accent" />
                      <span>Tailwind Karta</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      Interaktivní glassmorphic karta s tlačítkem.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setActiveArtifact({
                        id: 'demo-counter',
                        title: 'React Živé Počítadlo',
                        language: 'tsx',
                        code: `export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
      <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl max-w-sm w-full">
        <h2 className="text-xl font-bold text-white mb-2">React Live State</h2>
        <p className="text-xs text-slate-400 mb-6">useState & reaktivní UI</p>
        <div className="text-6xl font-extrabold text-indigo-400 font-mono mb-6">
          {count}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setCount(c => c - 1)}
            className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg transition-all"
          >
            -
          </button>
          <button
            onClick={() => setCount(0)}
            className="px-4 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition-all"
          >
            Reset
          </button>
          <button
            onClick={() => setCount(c => c + 1)}
            className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all shadow-lg shadow-indigo-500/30"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}`,
                        updatedAt: new Date(),
                      });
                    }}
                    className="p-3.5 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated transition-all group"
                  >
                    <div className="text-xs font-semibold text-text-primary group-hover:text-accent flex items-center gap-1.5 mb-1">
                      <Play className="w-3 h-3 text-accent" />
                      <span>React Komponenta</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      Živé počítadlo se stavem v Reactu 18.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      setActiveArtifact({
                        id: 'demo-svg',
                        title: 'Animovaná SVG Grafika',
                        language: 'svg',
                        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" width="260" height="260">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#38bdf8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#818cf8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="150" cy="150" r="110" fill="none" stroke="url(#grad1)" stroke-width="8" stroke-dasharray="10 15">
    <animateTransform attributeName="transform" type="rotate" from="0 150 150" to="360 150 150" dur="20s" repeatCount="indefinite"/>
  </circle>
  <circle cx="150" cy="150" r="80" fill="#6366f1" opacity="0.8">
    <animate attributeName="r" values="75;88;75" dur="3s" repeatCount="indefinite"/>
  </circle>
  <polygon points="150,90 180,180 120,180" fill="#ffffff" opacity="0.9" />
  <circle cx="150" cy="150" r="15" fill="#f43f5e" />
</svg>`,
                        updatedAt: new Date(),
                      });
                    }}
                    className="p-3.5 rounded-xl border border-border bg-surface hover:border-accent/40 hover:bg-surface-elevated transition-all group"
                  >
                    <div className="text-xs font-semibold text-text-primary group-hover:text-accent flex items-center gap-1.5 mb-1">
                      <Play className="w-3 h-3 text-accent" />
                      <span>SVG Animace</span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">
                      Čisté SVG s rotujícími animacemi.
                    </p>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
