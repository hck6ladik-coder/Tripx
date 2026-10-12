import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';
import { X, FileCode, Circle } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export function FileTabs() {
  const { openTabs, activeTabId, setActiveTab, closeTab } = useAppStore();

  return (
    <div className="flex items-center h-9 bg-background-secondary border-b border-border overflow-x-auto">
      {openTabs.map((tab) => (
        <Tooltip key={tab.id} content={tab.filePath} side="bottom">
          <button
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'group flex items-center gap-2 px-3 h-full min-w-[120px] max-w-[200px] border-r border-border text-xs transition-colors relative',
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
  );
}
