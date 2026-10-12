import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Sidebar } from './Sidebar';
import { ChatPanel } from './ChatPanel';
import { EditorPanel } from './EditorPanel';
import { TerminalPanel } from './TerminalPanel';
import { PreviewPanel } from './PreviewPanel';
import { CommandPalette } from '../common/CommandPalette';
import { SettingsModal } from '../common/SettingsModal';
import { StatusBar } from '../common/StatusBar';
import { ToastContainer } from '../ui/Toast';
import { LoadingLockScreen } from '../common/LoadingLockScreen';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { ChevronRight, Layout } from 'lucide-react';

import { SelfHealingAgentModal } from '../agent/SelfHealingAgentModal';
import { ModelArenaModal } from '../arena/ModelArenaModal';
import { PromptManagerModal } from '../prompts/PromptManagerModal';
import { VoiceChatModal } from '../voice/VoiceChatModal';
import { InterfaceCustomizerModal } from '../common/InterfaceCustomizerModal';

export function AppLayout() {
  const {
    settings,
    sidebarVisible,
    setSidebarVisible,
    setPromptManagerOpen,
    setVoiceChatOpen,
    setInterfaceCustomizerOpen,
  } = useAppStore();

  // Ref/callback pro vložení promptu do aktivního ChatComposeru
  const handlePromptInsert = (text: string) => {
    // Dispatch custom event – ChatComposer naslouchá
    window.dispatchEvent(new CustomEvent('prompt-manager-insert', { detail: { text } }));
  };

  // Keyboard shortcuts: Ctrl+Shift+P, Ctrl+Shift+V, Ctrl+Shift+L, Ctrl+B
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setPromptManagerOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault();
        setVoiceChatOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        setInterfaceCustomizerOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarVisible(!sidebarVisible);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setPromptManagerOpen, setVoiceChatOpen, setInterfaceCustomizerOpen, setSidebarVisible, sidebarVisible]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden relative">
      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 flex-shrink-0 border-r border-border bg-background-secondary">
            <Sidebar />
          </div>
        )}

        {/* Floating Mini Tab to expand sidebar if hidden */}
        {!sidebarVisible && (
          <button
            onClick={() => setSidebarVisible(true)}
            className="absolute top-3 left-0 z-30 flex items-center justify-center w-6 h-8 bg-surface-elevated border border-l-0 border-border rounded-r-lg text-text-secondary hover:text-text-primary hover:bg-surface shadow-md transition-all group"
            title="Zobrazit boční panel (Ctrl+B)"
          >
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Center area */}
        <div className="flex-1 flex flex-col min-w-0">
          <PanelGroup direction="vertical">
            {/* Top: Chat + Editor */}
            <Panel defaultSize={70} minSize={30}>
              <PanelGroup direction="horizontal">
                {/* Chat Panel */}
                {settings.activePanels.chat && (
                  <>
                    <Panel defaultSize={45} minSize={25}>
                      <ChatPanel />
                    </Panel>
                    <PanelResizeHandle className="w-1 bg-border hover:bg-accent/50 transition-colors cursor-col-resize" />
                  </>
                )}

                {/* Editor Panel */}
                {settings.activePanels.editor && (
                  <Panel defaultSize={55} minSize={25}>
                    <EditorPanel />
                  </Panel>
                )}
              </PanelGroup>
            </Panel>

            {/* Bottom: Terminal + Preview */}
            {(settings.activePanels.terminal ||
              settings.activePanels.preview) && (
              <>
                <PanelResizeHandle className="h-1 bg-border hover:bg-accent/50 transition-colors cursor-row-resize" />
                <Panel defaultSize={30} minSize={15}>
                  <PanelGroup direction="horizontal">
                    {settings.activePanels.terminal && (
                      <Panel defaultSize={70} minSize={20}>
                        <TerminalPanel />
                      </Panel>
                    )}
                    {settings.activePanels.terminal &&
                      settings.activePanels.preview && (
                        <PanelResizeHandle className="w-1 bg-border hover:bg-accent/50 transition-colors cursor-col-resize" />
                      )}
                    {settings.activePanels.preview && (
                      <Panel defaultSize={30} minSize={15}>
                        <PreviewPanel />
                      </Panel>
                    )}
                  </PanelGroup>
                </Panel>
              </>
            )}
          </PanelGroup>
        </div>
      </div>

      {/* Status Bar (Conditionally rendered) */}
      {settings.showStatusBar !== false ? (
        <StatusBar />
      ) : (
        /* Floating mini-button if status bar is hidden */
        <button
          onClick={() => setInterfaceCustomizerOpen(true)}
          className="absolute bottom-2 right-2 z-30 p-1.5 rounded-lg bg-surface/80 hover:bg-surface border border-border text-text-secondary hover:text-text-primary backdrop-blur-md shadow-lg transition-all"
          title="Upravit rozhraní (Ctrl+Shift+L)"
        >
          <Layout className="w-3.5 h-3.5 text-accent" />
        </button>
      )}

      {/* Overlays */}
      <CommandPalette />
      <SettingsModal />
      <ToastContainer />
      <LoadingLockScreen />
      <SelfHealingAgentModal />
      <ModelArenaModal />
      <PromptManagerModal onInsert={handlePromptInsert} />
      <VoiceChatModal />
      <InterfaceCustomizerModal />
    </div>
  );
}
