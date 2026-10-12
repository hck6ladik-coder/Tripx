import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { FileTabs } from '../editor/FileTabs';
import { MonacoEditor } from '../editor/MonacoEditor';
import { FileTree } from '../explorer/FileTree';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { FolderTree, Plus, RefreshCw, FilePlus } from 'lucide-react';

export function EditorPanel() {
  const { currentProject, openTabs, refreshFileTree, createLocalFile } = useAppStore();
  const [newFileInputOpen, setNewFileInputOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleCreateNewFile = async () => {
    if (!newFileName.trim()) return;
    await createLocalFile(newFileName.trim(), '');
    setNewFileName('');
    setNewFileInputOpen(false);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* File Explorer (always available) */}
          <Panel defaultSize={22} minSize={15} maxSize={40}>
            <div className="h-full bg-background-secondary border-r border-border flex flex-col">
              <div className="flex items-center justify-between px-3 h-9 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    Explorer
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setNewFileInputOpen(!newFileInputOpen)}
                    className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                    title="Vytvořit nový soubor"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => refreshFileTree()}
                    className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors"
                    title="Obnovit strom souborů"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Inline input for creating a new file */}
              {newFileInputOpen && (
                <div className="p-2 border-b border-border bg-surface flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="např. test.py nebo src/novy.ts"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateNewFile();
                      if (e.key === 'Escape') setNewFileInputOpen(false);
                    }}
                    className="flex-1 h-7 px-2 text-xs bg-background border border-accent rounded text-text-primary focus:outline-none"
                  />
                  <button
                    onClick={handleCreateNewFile}
                    className="px-2 py-1 text-xs bg-accent text-white rounded font-medium hover:bg-accent/90"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setNewFileInputOpen(false)}
                    className="px-1 text-xs text-text-secondary hover:text-text-primary"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                <FileTree />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-border hover:bg-accent/50 transition-colors cursor-col-resize" />

          {/* Editor Area (Tabs + Monaco or Empty state) */}
          <Panel defaultSize={78}>
            <div className="h-full flex flex-col">
              {openTabs.length > 0 && <FileTabs />}
              <div className="flex-1 min-h-0">
                {openTabs.length > 0 ? (
                  <MonacoEditor />
                ) : (
                  <EmptyEditorState onNewFile={() => setNewFileInputOpen(true)} />
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

function EmptyEditorState({ onNewFile }: { onNewFile?: () => void }) {
  const { currentProject } = useAppStore();

  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
        <FolderTree className="w-8 h-8 text-text-secondary" />
      </div>
      <h3 className="text-lg font-semibold text-text-primary mb-2">
        {currentProject ? 'Vyberte soubor k úpravě' : 'Žádný otevřený projekt'}
      </h3>
      <p className="text-sm text-text-secondary max-w-sm mb-4">
        {currentProject
          ? 'Klikněte na soubor v levém exploreru nebo vytvořte nový soubor.'
          : 'Otevřete projekt pro začátek práce s kódem.'}
      </p>
      {onNewFile && (
        <button
          onClick={onNewFile}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/20 text-accent hover:bg-accent/30 rounded-lg text-xs font-medium transition-colors"
        >
          <FilePlus className="w-3.5 h-3.5" />
          <span>Vytvořit nový soubor</span>
        </button>
      )}
    </div>
  );
}
