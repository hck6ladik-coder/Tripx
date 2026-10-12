import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { X, FileCode, Circle, Play } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export function FileTabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab, setActiveArtifact } = useAppStore();

  const activeTab = openTabs.find((t) => t.id === activeTabId);
  const isVisual =
    activeTab &&
    ['html', 'svg', 'tsx', 'jsx', 'javascript', 'js', 'css'].some(
      (ext) =>
        activeTab.language?.toLowerCase().includes(ext) ||
        activeTab.fileName.toLowerCase().endsWith(`.${ext}`)
    );

  const handleRunInCanvas = () => {
    if (!activeTab) return;
    setActiveArtifact({
      id: `tab-${activeTab.id}`,
      title: activeTab.fileName,
      language: activeTab.language || 'html',
      code: activeTab.content,
      updatedAt: new Date(),
    });
  };

  return (
    <div className="flex items-center justify-between h-9 bg-background-secondary border-b border-border">
      <div className="flex items-center h-full overflow-x-auto flex-1">
        {openTabs.map((tab) => (
          <Tooltip key={tab.id} content={tab.filePath} side="bottom">
            <button
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'group flex items-center gap-2 px-3 h-full min-w-[120px] max-w-[200px] border-r border-border text-xs transition-colors relative flex-shrink-0',
                activeTabId === tab.id
                  ? 'bg-surface text-text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface/50'
              )}
            >
              {activeTabId === tab.id && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
              )}
              <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="flex-1 truncate text-left">{tab.fileName}</span>
              {tab.isModified && (
                <Circle className="w-2 h-2 fill-text-secondary text-text-secondary flex-shrink-0" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-surface-elevated transition-all"
              >
                <X className="w-3 h-3" />
              </button>
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Quick Run in Canvas button for active file */}
      {isVisual && (
        <div className="px-2 flex-shrink-0 border-l border-border">
          <button
            onClick={handleRunInCanvas}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 rounded-md transition-colors font-medium"
            title="Spustit aktivní soubor v živém Canvas Preview"
          >
            <Play className="w-3 h-3 fill-indigo-400" />
            <span className="hidden sm:inline">Canvas</span>
          </button>
        </div>
      )}
    </div>
  );
}
