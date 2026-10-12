import { useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useAppStore } from '@/store/useAppStore';
import { useTheme } from '@/hooks/useTheme';
import { Loader2 } from 'lucide-react';

export function MonacoEditor() {
  const { openTabs, activeTabId, updateTabContent, saveTab } = useAppStore();
  const { isDark } = useTheme();

  const activeTab = openTabs.find((t) => t.id === activeTabId);

  const handleChange = useCallback(
    (value: string | undefined) => {
      if (activeTabId && value !== undefined) {
        updateTabContent(activeTabId, value);
      }
    },
    [activeTabId, updateTabContent]
  );

  const handleSave = useCallback(() => {
    if (activeTabId) {
      saveTab(activeTabId);
    }
  }, [activeTabId, saveTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  if (!activeTab) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        <p className="text-sm">Vyberte soubor k úpravě</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      <Editor
        height="100%"
        language={activeTab.language}
        value={activeTab.content}
        theme={isDark ? 'vs-dark' : 'vs-light'}
        onChange={handleChange}
        loading={
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-accent" />
          </div>
        }
        options={{
          fontSize: 14,
          fontFamily: 'JetBrains Mono, monospace',
          lineNumbers: 'on',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          bracketPairColorization: { enabled: true },
          renderWhitespace: 'selection',
          folding: true,
          foldingHighlight: true,
          showFoldingControls: 'always',
        }}
      />
    </div>
  );
}
