import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import {
  X,
  Key,
  Sliders,
  Sparkles,
  Check,
  Eye,
  EyeOff,
  Globe,
  Save,
  Server,
  FolderOpen,
  Folder,
  HardDrive,
  ArrowUp,
  ChevronRight,
  Loader2,
  RefreshCw,
  Brain,
  Plus,
  Trash2,
  Layout,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '@/lib/utils';

export function SettingsModal() {
  const {
    settingsModalOpen,
    setSettingsModalOpen,
    settingsModalTab,
    settings,
    updateSettings,
    addToast,
    loadLocalFolder,
    currentProject,
    memoryFacts,
    addMemoryFact,
    removeMemoryFact,
    clearMemory,
    setInterfaceCustomizerOpen,
  } = useAppStore();

  const { loadProject } = useFileSystem();

  const [activeTab, setActiveTab] = useState<'editor' | 'workspace' | 'memory' | 'ai'>('editor');
  const [newFact, setNewFact] = useState('');
  // Local state for editing
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt || '');
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);
  const [fontSize, setFontSize] = useState(settings.fontSize || 14);
  const [tabSize, setTabSize] = useState(settings.tabSize || 2);
  const [wordWrap, setWordWrap] = useState(settings.wordWrap ?? true);
  const [minimap, setMinimap] = useState(settings.minimap ?? true);
  // AI klice (ukladaji se do localStorage, nikdy se necommituji do gitu)
  const [apiKeysForm, setApiKeysForm] = useState({ ...(settings.apiKeys || {}) });
  const [showKeys, setShowKeys] = useState(false);
  const [kimiEndpointForm, setKimiEndpointForm] = useState(
    settings.kimiEndpoint || 'https://api.moonshot.cn/v1'
  );
  const [customEndpointForm, setCustomEndpointForm] = useState(
    settings.customEndpoint || 'http://localhost:8082'
  );
  const [fccEndpointForm, setFccEndpointForm] = useState(
    settings.fccEndpoint || 'http://127.0.0.1:8082'
  );

  // Sync tab with external trigger
  useEffect(() => {
    if (settingsModalTab && ['editor', 'workspace', 'memory', 'ai'].includes(settingsModalTab)) {
      setActiveTab(settingsModalTab as 'editor' | 'workspace' | 'memory' | 'ai');
    }
  }, [settingsModalTab, settingsModalOpen]);

  // Folder browser state
  const [customFolderPath, setCustomFolderPath] = useState(currentProject?.path || 'd:/trip');
  const [browserPath, setBrowserPath] = useState(currentProject?.path || 'D:\\trip');
  const [directoryList, setDirectoryList] = useState<{ name: string; path: string }[]>([]);
  const [parentDir, setParentDir] = useState<string | null>(null);
  const [loadingDirs, setLoadingDirs] = useState(false);
  const [pickingFolder, setPickingFolder] = useState(false);
  // Skrytý input pro výběr složky ve prohlížečích bez File System Access API (Firefox)
  const dirInputRef = useRef<HTMLInputElement>(null);

  const fetchDirectories = async (targetPath: string) => {
    setLoadingDirs(true);
    try {
      const res = await fetch(`/api/fs/directories?path=${encodeURIComponent(targetPath || '')}`);
      if (res.ok) {
        const data = await res.json();
        setBrowserPath(data.current || targetPath);
        setDirectoryList(data.directories || []);
        setParentDir(data.parent);
      }
    } catch {
      // ignore
    } finally {
      setLoadingDirs(false);
    }
  };

  useEffect(() => {
    if (settingsModalOpen && activeTab === 'workspace') {
      fetchDirectories(browserPath);
    }
  }, [settingsModalOpen, activeTab]);

  const handleOpenCustomPath = async (targetPath: string) => {
    if (!targetPath.trim()) return;
    try {
      await loadProject(targetPath.trim());
      setSettingsModalOpen(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Chyba při otevírání složky',
        message: err.message || 'Složku se nepodařilo načíst',
      });
    }
  };

  if (!settingsModalOpen) return null;

  const handleSave = () => {
    updateSettings({
      systemPrompt,
      temperature,
      fontSize,
      tabSize,
      wordWrap,
      minimap,
      apiKeys: { ...settings.apiKeys, ...apiKeysForm },
      kimiEndpoint: kimiEndpointForm,
      customEndpoint: customEndpointForm,
      fccEndpoint: fccEndpointForm,
    });

    addToast({
      type: 'success',
      title: 'Nastavení uloženo',
      message: 'Konfigurace byla úspěšně aktualizována.',
    });

    setSettingsModalOpen(false);
  };

  const SKIP_DIRS = ['node_modules', '.git', 'dist', '.next', 'out', 'build', 'coverage'];

  const sortNodes = (nodes: any[]) => {
    nodes.sort((a, b) =>
      a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'directory' ? -1 : 1
    );
    nodes.forEach((n) => {
      if (n.type === 'directory' && Array.isArray(n.children)) sortNodes(n.children);
    });
    return nodes;
  };

  // Klasický nativní výběr složky (otevře okno systému)
  const handleOpenLocalFolderWithPicker = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore - File System Access API
        const dirHandle = await window.showDirectoryPicker();
        setPickingFolder(true);
        const rootName: string = dirHandle.name || 'lokální složka';

        async function readDir(handle: any, currentPath: string): Promise<any[]> {
          const nodes: any[] = [];
          for await (const entry of handle.values()) {
            const itemPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
              try {
                const file = await entry.getFile();
                let content = '';
                if (file.size < 2 * 1024 * 1024) {
                  content = await file.text().catch(() => '');
                }
                const ext = entry.name.includes('.') ? entry.name.split('.').pop() || '' : '';
                nodes.push({
                  id: itemPath,
                  name: entry.name,
                  type: 'file',
                  path: itemPath,
                  language: ext,
                  content,
                });
              } catch {
                // nečitelný soubor přeskočit
              }
            } else if (entry.kind === 'directory') {
              if (SKIP_DIRS.includes(entry.name)) continue;
              const children = await readDir(entry, itemPath);
              nodes.push({
                id: itemPath,
                name: entry.name,
                type: 'directory',
                path: itemPath,
                children,
                isOpen: false,
              });
            }
          }
          return nodes;
        }

        const files = sortNodes(await readDir(dirHandle, rootName));
        loadLocalFolder(rootName, files);
        setPickingFolder(false);
        setSettingsModalOpen(false);
      } else {
        // Fallback pro Firefox a starší prohlížeče
        dirInputRef.current?.click();
      }
    } catch (err: any) {
      setPickingFolder(false);
      if (err?.name !== 'AbortError') {
        addToast({
          type: 'error',
          title: 'Chyba při otevírání složky',
          message: err.message,
        });
      }
    }
  };

  // Fallback: čtení složky přes <input webkitdirectory>
  const handleDirInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;
    setPickingFolder(true);
    try {
      const firstRel = (list[0] as any).webkitRelativePath as string;
      const rootName = firstRel?.split('/')[0] || 'lokální složka';
      const map = new Map<string, any>();
      const roots: any[] = [];
      const ensureDir = (path: string, name: string) => {
        if (!map.has(path)) {
          const node = { id: path, name, type: 'directory', path, children: [] as any[], isOpen: false };
          map.set(path, node);
          const parentPath = path.split('/').slice(0, -1).join('/');
          if (parentPath && map.has(parentPath)) map.get(parentPath).children.push(node);
          else if (!parentPath) roots.push(node);
        }
        return map.get(path);
      };
      for (const f of Array.from(list)) {
        const rel = (f as any).webkitRelativePath as string;
        if (!rel) continue;
        const parts = rel.split('/');
        if (parts.length < 2) continue;
        if (parts.some((p) => SKIP_DIRS.includes(p))) continue;
        let acc = '';
        for (let i = 0; i < parts.length - 1; i++) {
          acc = acc ? `${acc}/${parts[i]}` : parts[i];
          ensureDir(acc, parts[i]);
        }
        const fileName = parts[parts.length - 1];
        const ext = fileName.includes('.') ? fileName.split('.').pop() || '' : '';
        let content = '';
        if (f.size < 2 * 1024 * 1024) content = await f.text().catch(() => '');
        map.get(acc)?.children.push({
          id: rel,
          name: fileName,
          type: 'file',
          path: rel,
          language: ext,
          content,
        });
      }
      loadLocalFolder(rootName, sortNodes(roots));
      setSettingsModalOpen(false);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Chyba při čtení složky',
        message: err?.message || 'Složku se nepodařilo načíst',
      });
    } finally {
      setPickingFolder(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated/40">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold text-text-primary">Nastavení hck6lada</h2>
          </div>
          <button
            onClick={() => setSettingsModalOpen(false)}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6 bg-surface-elevated/20">
          <button
            onClick={() => setActiveTab('editor')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'editor'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            <Sliders className="w-4 h-4" />
            Editor & Prompt
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'ai'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            <Key className="w-4 h-4" />
            AI klíče
          </button>
          <button
            onClick={() => setActiveTab('workspace')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'workspace'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            <FolderOpen className="w-4 h-4" />
            Lokální složky
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'memory'
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            <Brain className="w-4 h-4" />
            Paměť AI
          </button>
          <button
            onClick={() => {
              setSettingsModalOpen(false);
              setInterfaceCustomizerOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 border-transparent text-text-secondary hover:text-accent transition-colors"
          >
            <Layout className="w-4 h-4 text-accent" />
            Rozvržení & Panely
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  Výchozí systémový prompt (instrukce pro AI):
                </label>
                <textarea
                  rows={4}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Instrukce pro AI asistenta..."
                  className="w-full p-3 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-text-primary">
                    Kreativita / Teplota (Temperature):
                  </label>
                  <span className="text-xs text-accent font-semibold">{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-accent"
                />
                <div className="flex justify-between text-[11px] text-text-secondary">
                  <span>0.0 (Přesný a deterministický)</span>
                  <span>1.0 (Kreativní)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-text-secondary block mb-1">
                    Velikost písma v editoru (px):
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="28"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value) || 14)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary block mb-1">
                    Velikost tabulátoru (mezery):
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={tabSize}
                    onChange={(e) => setTabSize(parseInt(e.target.value) || 2)}
                    className="w-full h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={wordWrap}
                    onChange={(e) => setWordWrap(e.target.checked)}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <span>Automatické zalamování řádků (Word Wrap)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-text-primary">
                  <input
                    type="checkbox"
                    checked={minimap}
                    onChange={(e) => setMinimap(e.target.checked)}
                    className="rounded text-accent focus:ring-accent"
                  />
                  <span>Zobrazit minimapu v editoru</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-xl">
                <Key className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-text-primary">API klíče poskytovatelů</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Stačí jeden klíč a chat funguje všude – i s vybraným <span className="font-mono">fcc/*</span> modelem.
                    Klíče se ukládají jen do prohlížeče (localStorage), nikdy do gitu.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeys(!showKeys)}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                  title={showKeys ? 'Skrýt klíče' : 'Zobrazit klíče'}
                >
                  {showKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  Sdílený fcc-server (bez klíče):
                </label>
                <input
                  type="text"
                  value={fccEndpointForm}
                  onChange={(e) => setFccEndpointForm(e.target.value)}
                  placeholder="např. https://fcc.tvojedomena.cz (prázdné = jen localhost)"
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent font-mono"
                />
                <p className="text-[11px] text-text-secondary mt-1">
                  Veřejná adresa tvého fcc-serveru – kdokoliv s touto adresou v nastavení jede bez vlastního klíče.
                </p>
              </div>

              {[
                { id: 'zenmux', label: 'ZenMux', placeholder: 'ZenMux klíč (doporučeno – umí všechny fcc/* modely)…' },
                { id: 'openrouter', label: 'OpenRouter', placeholder: 'sk-or-…' },
                { id: 'kimi', label: 'Kimi (Moonshot)', placeholder: 'Kimi klíč…' },
                { id: 'openai', label: 'OpenAI', placeholder: 'sk-…' },
                { id: 'anthropic', label: 'Anthropic', placeholder: 'sk-ant-…' },
                { id: 'deepseek', label: 'DeepSeek', placeholder: 'DeepSeek klíč…' },
                { id: 'groq', label: 'Groq', placeholder: 'gsk_…' },
                { id: 'custom', label: 'Vlastní (custom)', placeholder: 'Klíč pro vlastní endpoint…' },
              ].map((f) => (
                <div key={f.id}>
                  <label className="text-sm font-medium text-text-primary block mb-1">
                    {f.label}:
                  </label>
                  <input
                    type={showKeys ? 'text' : 'password'}
                    value={(apiKeysForm as any)[f.id] || ''}
                    onChange={(e) =>
                      setApiKeysForm((prev) => ({ ...prev, [f.id]: e.target.value }))
                    }
                    placeholder={f.placeholder}
                    className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  Kimi endpoint:
                </label>
                <input
                  type="text"
                  value={kimiEndpointForm}
                  onChange={(e) => setKimiEndpointForm(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-primary block mb-1">
                  Vlastní endpoint:
                </label>
                <input
                  type="text"
                  value={customEndpointForm}
                  onChange={(e) => setCustomEndpointForm(e.target.value)}
                  className="w-full p-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                />
              </div>
            </div>
          )}

          {activeTab === 'workspace' && (
            <div className="space-y-5">
              {/* Hlavní: klasický výběr složky (nativní okno systému) */}
              <div className="p-5 bg-surface-elevated/40 border border-border rounded-xl space-y-3 text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    Vybrat složku z počítače
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Otevře se klasické okno systému a vyberete složku lokálně
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleOpenLocalFolderWithPicker}
                  disabled={pickingFolder}
                  className="gap-2 w-full sm:w-auto justify-center"
                >
                  {pickingFolder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FolderOpen className="w-4 h-4" />
                  )}
                  {pickingFolder ? 'Načítám složku…' : 'Vybrat složku…'}
                </Button>
                {currentProject && (
                  <p className="text-xs text-text-secondary">
                    Aktuálně otevřeno:{' '}
                    <span className="font-mono text-text-primary">{currentProject.name}</span>
                  </p>
                )}
                {/* Skrytý input pro prohlížeče bez File System Access API */}
                <input
                  ref={dirInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleDirInputChange}
                  {...({ webkitdirectory: '' } as any)}
                />
              </div>

              {/* Pokročilé: ruční cesta a procházení přes server */}
              <details className="group bg-surface-elevated/20 border border-border rounded-xl">
                <summary className="px-4 py-2.5 text-xs text-text-secondary hover:text-text-primary cursor-pointer transition-colors list-none flex items-center gap-2">
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-open:rotate-90" />
                  <span>Pokročilé – zadat cestu ručně / procházet disk přes server</span>
                </summary>
                <div className="px-4 pb-4 space-y-5">
              {/* Sekce 1: Přímé zadání cesty ke složce na disku */}
              <div className="p-4 bg-surface-elevated/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <FolderOpen className="w-5 h-5 text-accent flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">
                      Zadat libovolnou složku na počítači
                    </h3>
                    <p className="text-xs text-text-secondary">
                      Zadejte nebo vložte přesnou cestu ke složce na vašem disku
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customFolderPath}
                    onChange={(e) => setCustomFolderPath(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleOpenCustomPath(customFolderPath);
                    }}
                    placeholder="např. D:\trip nebo C:\Users\Node.dev\Desktop\muj-projekt"
                    className="flex-1 h-9 px-3 bg-surface border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-accent font-mono"
                  />
                  <Button
                    variant="primary"
                    onClick={() => handleOpenCustomPath(customFolderPath)}
                    className="gap-1.5 flex-shrink-0"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Otevřít složku
                  </Button>
                </div>

                {/* Rychlé předvolby */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-text-secondary mr-1">Rychlé volby:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFolderPath('d:/trip');
                      handleOpenCustomPath('d:/trip');
                    }}
                    className="px-2 py-1 bg-surface-elevated hover:bg-surface border border-border rounded text-xs text-text-primary font-mono transition-colors"
                  >
                    D:\trip
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomFolderPath('d:/trip/codespace-ai');
                      handleOpenCustomPath('d:/trip/codespace-ai');
                    }}
                    className="px-2 py-1 bg-surface-elevated hover:bg-surface border border-border rounded text-xs text-text-primary font-mono transition-colors"
                  >
                    D:\trip\codespace-ai
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchDirectories('D:\\');
                    }}
                    className="px-2 py-1 bg-surface-elevated hover:bg-surface border border-border rounded text-xs text-text-secondary hover:text-text-primary font-mono transition-colors"
                  >
                    Disk D:\
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      fetchDirectories('C:\\');
                    }}
                    className="px-2 py-1 bg-surface-elevated hover:bg-surface border border-border rounded text-xs text-text-secondary hover:text-text-primary font-mono transition-colors"
                  >
                    Disk C:\
                  </button>
                </div>
              </div>

              {/* Sekce 2: Interaktivní procházení složek na disku */}
              <div className="p-4 bg-surface-elevated/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                      Procházet disky a složky
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {parentDir && (
                      <button
                        type="button"
                        onClick={() => fetchDirectories(parentDir)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-surface border border-border rounded text-text-secondary hover:text-text-primary transition-colors"
                        title="O úroveň výše"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        <span>Nahoru</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => fetchDirectories(browserPath)}
                      className="p-1 text-text-secondary hover:text-text-primary"
                      title="Obnovit"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 bg-surface rounded-lg border border-border text-xs font-mono text-text-primary">
                  <span className="truncate flex-1">{browserPath || 'Dostupné disky'}</span>
                  {browserPath && (
                    <button
                      type="button"
                      onClick={() => handleOpenCustomPath(browserPath)}
                      className="ml-2 px-2.5 py-1 bg-accent/20 hover:bg-accent/30 text-accent rounded font-sans font-medium text-xs transition-colors flex-shrink-0"
                    >
                      Otevřít tuto složku
                    </button>
                  )}
                </div>

                {/* Seznam podsložek */}
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg bg-surface/50 p-1 space-y-0.5">
                  {loadingDirs ? (
                    <div className="flex items-center justify-center py-6 text-xs text-text-secondary gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span>Načítám složky...</span>
                    </div>
                  ) : directoryList.length === 0 ? (
                    <div className="py-6 text-center text-xs text-text-secondary">
                      Žádné další podsložky
                    </div>
                  ) : (
                    directoryList.map((dir) => (
                      <div
                        key={dir.path}
                        className="flex items-center justify-between p-2 hover:bg-surface rounded-md cursor-pointer transition-colors group"
                        onClick={() => fetchDirectories(dir.path)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder className="w-4 h-4 text-accent flex-shrink-0" />
                          <span className="text-xs text-text-primary truncate">{dir.name}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCustomPath(dir.path);
                            }}
                            className="px-2 py-0.5 text-[11px] bg-accent/15 hover:bg-accent text-accent hover:text-white rounded transition-colors"
                          >
                            Otevřít
                          </button>
                          <ChevronRight className="w-3.5 h-3.5 text-text-secondary" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
                </div>
                </div>
              </details>
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-accent/10 border border-accent/30 rounded-xl">
                <Brain className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Paměť asistenta hck6lada</p>
                  <p className="text-xs text-text-secondary mt-1">
                    Fakta uložená v paměti jsou automaticky vkládána do každé konverzace — asistent si je bude pamatovat vždy.
                  </p>
                </div>
              </div>

              {/* Add new fact */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFact.trim()) {
                      addMemoryFact(newFact);
                      setNewFact('');
                    }
                  }}
                  placeholder="Nové faktum (Enter pro přidání)..."
                  className="flex-1 bg-surface-elevated border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent/60 transition-colors"
                />
                <button
                  onClick={() => {
                    if (newFact.trim()) {
                      addMemoryFact(newFact);
                      setNewFact('');
                    }
                  }}
                  className="px-3 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors flex items-center gap-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Přidat
                </button>
              </div>

              {/* Memory list */}
              <div className="space-y-2">
                {(memoryFacts || []).length === 0 ? (
                  <div className="text-center py-8 text-text-muted text-sm">
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Paměť je prázdná. Přidejte fakta, která si má asistent pamatovat.
                  </div>
                ) : (
                  (memoryFacts || []).map((fact, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-surface-elevated/50 border border-border rounded-lg group"
                    >
                      <span className="text-xs text-accent font-mono mt-0.5 w-5 flex-shrink-0">{index + 1}.</span>
                      <span className="text-sm text-text-primary flex-1">{fact}</span>
                      <button
                        onClick={() => removeMemoryFact(index)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-text-secondary hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {(memoryFacts || []).length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Opravdu vymazat celou paměť?')) clearMemory();
                  }}
                  className="w-full text-xs text-red-400 hover:text-red-300 border border-red-400/30 hover:border-red-400/60 rounded-lg py-2 transition-colors"
                >
                  🗑️ Vymazat celou paměť ({(memoryFacts || []).length} faktů)
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-surface-elevated/30">
          <Button
            variant="ghost"
            onClick={() => setSettingsModalOpen(false)}
          >
            Zrušit
          </Button>

          <Button
            variant="primary"
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Uložit nastavení
          </Button>
        </div>
      </div>
    </div>
  );
}
