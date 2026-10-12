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

export function AppLayout() {
  const { settings, sidebarVisible } = useAppStore();

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Main workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <div className="w-64 flex-shrink-0 border-r border-border bg-background-secondary">
            <Sidebar />
          </div>
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

      {/* Status Bar */}
      <StatusBar />

      {/* Overlays */}
      <CommandPalette />
      <SettingsModal />
      <ToastContainer />
      <LoadingLockScreen />
    </div>
  );
}
