import { useState, useEffect } from 'react';
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

  const [activeTab, setActiveTab] = useState<'editor' | 'workspace' | 'memory'>('editor');
  const [newFact, setNewFact] = useState('');
  // Local state for editing
  const [systemPrompt, setSystemPrompt] = useState(settings.systemPrompt || '');
  const [temperature, setTemperature] = useState(settings.temperature ?? 0.7);
  const [fontSize, setFontSize] = useState(settings.fontSize || 14);
  const [tabSize, setTabSize] = useState(settings.tabSize || 2);
  const [wordWrap, setWordWrap] = useState(settings.wordWrap ?? true);
  const [minimap, setMinimap] = useState(settings.minimap ?? true);

  // Sync tab with external trigger
  useEffect(() => {
    if (settingsModalTab && ['editor', 'workspace', 'memory'].includes(settingsModalTab)) {
      setActiveTab(settingsModalTab as 'editor' | 'workspace' | 'memory');
    }
  }, [settingsModalTab, settingsModalOpen]);

  // Folder browser state
  const [customFolderPath, setCustomFolderPath] = useState(currentProject?.path || 'd:/trip');
  const [browserPath, setBrowserPath] = useState(currentProject?.path || 'D:\\trip');
  const [directoryList, setDirectoryList] = useState<{ name: string; path: string }[]>([]);
  const [parentDir, setParentDir] = useState<string | null>(null);
  const [loadingDirs, setLoadingDirs] = useState(false);

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
    });

    addToast({
      type: 'success',
      title: 'Nastavení uloženo',
      message: 'Konfigurace byla úspěšně aktualizována.',
    });

    setSettingsModalOpen(false);
  };

  const handleOpenLocalFolderWithPicker = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        const files: any[] = [];

        async function readDir(handle: any, currentPath = '') {
          for await (const entry of handle.values()) {
            const itemPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
              const file = await entry.getFile();
              const text = await file.text().catch(() => '');
              const ext = entry.name.split('.').pop() || '';
              files.push({
                id: itemPath,
                name: entry.name,
                type: 'file',
                path: itemPath,
                language: ext,
                content: text,
              });
            } else if (entry.kind === 'directory') {
              if (
                entry.name === 'node_modules' ||
                entry.name === '.git' ||
                entry.name === 'dist'
              ) {
                continue;
              }
              const children: any[] = [];
              files.push({
                id: itemPath,
                name: entry.name,
                type: 'directory',
                path: itemPath,
                children,
                isOpen: false,
              });
              await readDir(entry, itemPath);
            }
          }
        }

        await readDir(dirHandle);
        loadLocalFolder(dirHandle.name, files);
        setSettingsModalOpen(false);
      } else {
        addToast({
          type: 'warning',
          title: 'Prohlížeč nepodporuje File System Picker',
          message: 'Použijte prosím prohlížeč Chrome, Edge nebo Opera.',
        });
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        addToast({
          type: 'error',
          title: 'Chyba při otevírání složky',
          message: err.message,
        });
      }
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

          {activeTab === 'workspace' && (
            <div className="space-y-5">
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

              {/* Sekce 3: Alternativa přes dialog prohlížeče */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenLocalFolderWithPicker}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs text-text-secondary hover:text-text-primary border border-dashed border-border hover:border-accent/50 rounded-xl transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Nebo použít dialog prohlížeče (File System Access)</span>
                </button>
              </div>
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
