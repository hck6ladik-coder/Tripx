import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  Conversation,
  ChatMessage,
  FileNode,
  EditorTab,
  TerminalSession,
  Project,
  UserSettings,
  Toast,
  AgentMode,
  AIModel,
  SavedPrompt,
  LiveArtifact,
} from '@/types';
import { generateId } from '@/lib/utils';
import { DEFAULT_SETTINGS, MOCK_MODELS } from '@/lib/constants';

interface AppState {
  // Nastavení
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;

  // Konverzace
  conversations: Conversation[];
  activeConversationId: string | null;
  createConversation: () => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>
  ) => void;
  setAgentMode: (conversationId: string, mode: AgentMode) => void;

  // Modely
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;

  // Projekt a soubory
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  fileTree: FileNode[];
  setFileTree: (files: FileNode[]) => void;
  toggleDirectory: (fileId: string) => void;
  refreshFileTree: () => Promise<void>;
  createLocalFile: (filePath: string, content: string) => Promise<boolean>;

  // Editor
  openTabs: EditorTab[];
  activeTabId: string | null;
  openFile: (file: FileNode) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => void;

  // Terminal
  terminals: TerminalSession[];
  activeTerminalId: string | null;
  addTerminal: () => void;
  setActiveTerminal: (id: string) => void;
  closeTerminal: (id: string) => void;
  updateTerminal: (id: string, updates: Partial<TerminalSession>) => void;

  // UI
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  settingsModalOpen: boolean;
  settingsModalTab: 'ai' | 'editor' | 'workspace' | 'memory';
  setSettingsModalOpen: (open: boolean, tab?: 'ai' | 'editor' | 'workspace' | 'memory') => void;
  selfHealingAgentModalOpen: boolean;
  setSelfHealingAgentModalOpen: (open: boolean) => void;
  modelArenaOpen: boolean;
  setModelArenaOpen: (open: boolean) => void;
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  loadLocalFolder: (folderName: string, files: FileNode[]) => void;

  // Bezpečnost / Zámek & Loading
  isLocked: boolean;
  setLocked: (locked: boolean) => void;

  // Paměť agenta
  memoryFacts: string[];
  addMemoryFact: (fact: string) => void;
  removeMemoryFact: (index: number) => void;
  clearMemory: () => void;

  // Prompt Manager + Voice chat (nové funkce, zachovány)
  promptManagerOpen: boolean;
  setPromptManagerOpen: (open: boolean) => void;
  voiceChatOpen: boolean;
  setVoiceChatOpen: (open: boolean) => void;
  savedPrompts: SavedPrompt[];
  addSavedPrompt: (prompt: SavedPrompt) => void;
  updateSavedPrompt: (id: string, updates: Partial<SavedPrompt>) => void;
  deleteSavedPrompt: (id: string) => void;
  togglePromptFavorite: (id: string) => void;

  // Live Artifacts & Canvas (nová funkce, zachována)
  activeArtifact: LiveArtifact | null;
  setActiveArtifact: (artifact: LiveArtifact | null) => void;

  // Interface & Layout Customizer (nová funkce, zachována)
  interfaceCustomizerOpen: boolean;
  setInterfaceCustomizerOpen: (open: boolean) => void;
  setLayoutPreset: (preset: 'full' | 'chat-only' | 'editor-only' | 'web-studio' | 'zen') => void;
}

function createNewConversation(): Conversation {
  return {
    id: generateId(),
    title: 'Nový chat',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    agentMode: 'chat',
  };
}

function toggleNodeRecursive(nodes: FileNode[], targetId: string): FileNode[] {
  return nodes.map((node) => {
    if (node.id === targetId && node.type === 'directory') {
      return { ...node, isOpen: !node.isOpen };
    }
    if (node.children) {
      return { ...node, children: toggleNodeRecursive(node.children, targetId) };
    }
    return node;
  });
}

function expandPathRecursive(nodes: FileNode[], targetPath: string): FileNode[] {
  const normTarget = targetPath.replace(/\\/g, '/').toLowerCase();
  return nodes.map((node) => {
    if (node.type === 'directory') {
      const normNode = (node.path || '').replace(/\\/g, '/').toLowerCase();
      const isParent = normTarget.startsWith(normNode);
      return {
        ...node,
        isOpen: isParent ? true : node.isOpen,
        children: node.children ? expandPathRecursive(node.children, targetPath) : [],
      };
    }
    return node;
  });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Nastavení
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      // Konverzace
      conversations: [],
      activeConversationId: null,

      createConversation: () => {
        const newConv = createNewConversation();
        set((state) => ({
          conversations: [newConv, ...state.conversations],
          activeConversationId: newConv.id,
        }));
        return newConv.id;
      },

      setActiveConversation: (id) => set({ activeConversationId: id }),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id
              ? state.conversations.find((c) => c.id !== id)?.id || null
              : state.activeConversationId,
        })),

      renameConversation: (id, title) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title } : c
          ),
        })),

      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  updatedAt: new Date(),
                  title:
                    c.messages.length === 0 && message.role === 'user'
                      ? message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '')
                      : c.title,
                }
              : c
          ),
        })),

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === messageId ? { ...m, ...updates } : m
                  ),
                }
              : c
          ),
        })),

      setAgentMode: (conversationId, mode) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, agentMode: mode } : c
          ),
        })),

      // Modely
      selectedModel: MOCK_MODELS[0],
      setSelectedModel: (model) => set({ selectedModel: model }),

      // Projekt
      currentProject: null,
      setCurrentProject: (project) =>
        set({ currentProject: project, fileTree: project?.rootFiles || [] }),
      fileTree: [],
      setFileTree: (files) => set({ fileTree: files }),
      toggleDirectory: (fileId) =>
        set((state) => ({
          fileTree: toggleNodeRecursive(state.fileTree, fileId),
        })),

      refreshFileTree: async () => {
        const curPath = get().currentProject?.path || 'd:/trip';
        try {
          const res = await fetch(`/api/fs/tree?path=${encodeURIComponent(curPath)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.tree) {
              set({ fileTree: data.tree });
            }
          }
        } catch {
          // ignore
        }
      },

      createLocalFile: async (filePath: string, content: string) => {
        try {
          const projectPath = get().currentProject?.path || 'd:/trip';
          const res = await fetch('/api/fs/write', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: filePath, projectPath, content }),
          });

          if (res.ok) {
            const data = await res.json();
            const resolvedPath = data.path || filePath;
            const fileName = resolvedPath.split(/[\/\\]/).pop() || filePath;
            const ext = fileName.split('.').pop() || 'plaintext';

            // Ensure editor panel is visible
            set((state) => ({
              settings: {
                ...state.settings,
                activePanels: {
                  ...state.settings.activePanels,
                  editor: true,
                },
              },
            }));

            // Refresh tree and auto-expand containing folders
            await get().refreshFileTree();
            set((state) => ({
              fileTree: expandPathRecursive(state.fileTree, resolvedPath),
            }));

            // Open or activate file tab in editor
            const newFileNode: FileNode = {
              id: resolvedPath,
              name: fileName,
              path: resolvedPath,
              type: 'file',
              language: ext,
              content,
            };
            get().openFile(newFileNode);

            get().addToast({
              type: 'success',
              title: 'Soubor vytvořen na disku',
              message: resolvedPath,
            });
            return true;
          } else {
            const err = await res.json().catch(() => ({ error: 'Chyba zápisu na disk' }));
            get().addToast({
              type: 'error',
              title: 'Chyba při zápisu souboru',
              message: err.error || 'Soubor se nepodařilo vytvořit',
            });
            return false;
          }
        } catch (err: any) {
          get().addToast({
            type: 'error',
            title: 'Chyba spojení se serverem',
            message: err.message,
          });
          return false;
        }
      },

      // Editor
      openTabs: [],
      activeTabId: null,

      openFile: async (file) => {
        if (file.type === 'directory') return;
        const { openTabs } = get();
        const existingTab = openTabs.find((t) => t.fileId === file.id);

        if (existingTab) {
          set({
            openTabs: openTabs.map((t) => ({
              ...t,
              isActive: t.id === existingTab.id,
            })),
            activeTabId: existingTab.id,
          });
          return;
        }

        let content = file.content ?? '';
        if (!content && file.path) {
          try {
            const res = await fetch(`/api/fs/read?file=${encodeURIComponent(file.path)}`);
            if (res.ok) {
              const data = await res.json();
              content = data.content || '';
            }
          } catch {
            // fallback
          }
        }

        const newTab: EditorTab = {
          id: generateId(),
          fileId: file.id,
          fileName: file.name,
          filePath: file.path,
          language: file.language || 'plaintext',
          content,
          originalContent: content,
          isModified: false,
          isActive: true,
        };

        set({
          openTabs: [
            ...openTabs.map((t) => ({ ...t, isActive: false })),
            newTab,
          ],
          activeTabId: newTab.id,
        });
      },

      closeTab: (tabId) => {
        const { openTabs, activeTabId } = get();
        const filtered = openTabs.filter((t) => t.id !== tabId);

        if (activeTabId === tabId && filtered.length > 0) {
          const lastTab = filtered[filtered.length - 1];
          set({
            openTabs: filtered.map((t) => ({
              ...t,
              isActive: t.id === lastTab.id,
            })),
            activeTabId: lastTab.id,
          });
        } else {
          set({
            openTabs: filtered,
            activeTabId: filtered.length > 0 ? activeTabId : null,
          });
        }
      },

      setActiveTab: (tabId) =>
        set((state) => ({
          openTabs: state.openTabs.map((t) => ({
            ...t,
            isActive: t.id === tabId,
          })),
          activeTabId: tabId,
        })),

      updateTabContent: (tabId, content) =>
        set((state) => ({
          openTabs: state.openTabs.map((t) =>
            t.id === tabId
              ? { ...t, content, isModified: t.originalContent !== content }
              : t
          ),
        })),

      saveTab: async (tabId) => {
        const { openTabs } = get();
        const tab = openTabs.find((t) => t.id === tabId);
        if (tab && tab.filePath) {
          try {
            await fetch('/api/fs/write', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path: tab.filePath, content: tab.content }),
            });
            get().addToast({
              type: 'success',
              title: 'Soubor uložen',
              message: tab.fileName,
            });
          } catch {
            // fallback
          }
          set((state) => ({
            openTabs: state.openTabs.map((t) =>
              t.id === tabId
                ? { ...t, originalContent: t.content, isModified: false }
                : t
            ),
          }));
        }
      },

      // Terminal
      terminals: [
        {
          id: 'default',
          name: 'Terminal 1',
          isActive: true,
          history: [],
          status: 'idle',
        },
      ],
      activeTerminalId: 'default',

      addTerminal: () => {
        const id = generateId();
        const count = get().terminals.length + 1;
        set((state) => ({
          terminals: [
            ...state.terminals.map((t) => ({ ...t, isActive: false })),
            {
              id,
              name: `Terminal ${count}`,
              isActive: true,
              history: [],
              status: 'idle' as const,
            },
          ],
          activeTerminalId: id,
        }));
      },

      setActiveTerminal: (id) =>
        set((state) => ({
          terminals: state.terminals.map((t) => ({
            ...t,
            isActive: t.id === id,
          })),
          activeTerminalId: id,
        })),

      closeTerminal: (id) => {
        const { terminals, activeTerminalId } = get();
        if (terminals.length <= 1) return;
        const filtered = terminals.filter((t) => t.id !== id);

        if (activeTerminalId === id && filtered.length > 0) {
          const last = filtered[filtered.length - 1];
          set({
            terminals: filtered.map((t) => ({
              ...t,
              isActive: t.id === last.id,
            })),
            activeTerminalId: last.id,
          });
        } else {
          set({
            terminals: filtered,
            activeTerminalId:
              filtered.length > 0 ? activeTerminalId : null,
          });
        }
      },

      updateTerminal: (id, updates) =>
        set((state) => ({
          terminals: state.terminals.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      // UI
      toasts: [],
      addToast: (toast) => {
        const id = generateId();
        const duration = toast.duration ?? 4000;
        set((state) => ({
          toasts: [...state.toasts, { ...toast, id, duration }],
        }));
        setTimeout(() => {
          get().removeToast(id);
        }, duration);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

      settingsModalOpen: false,
      settingsModalTab: 'ai' as 'ai' | 'editor' | 'workspace' | 'memory',
      setSettingsModalOpen: (open, tab) =>
        set((state) => ({
          settingsModalOpen: open,
          settingsModalTab: tab || state.settingsModalTab,
        })),

      selfHealingAgentModalOpen: false,
      setSelfHealingAgentModalOpen: (open) => set({ selfHealingAgentModalOpen: open }),

      modelArenaOpen: false,
      setModelArenaOpen: (open) => set({ modelArenaOpen: open }),

      sidebarVisible: true,
      setSidebarVisible: (visible) => set({ sidebarVisible: visible }),

      // Zámek / Loading screen (heslo 666)
      isLocked: true,
      setLocked: (locked) => set({ isLocked: locked }),

      loadLocalFolder: (folderName, files) => {
        const project: Project = {
          id: generateId(),
          name: folderName,
          path: folderName,
          rootFiles: files,
          lastOpened: new Date(),
        };
        set({
          currentProject: project,
          fileTree: files,
        });
        get().addToast({
          type: 'success',
          title: 'Složka otevřena',
          message: `Načtena lokální složka ${folderName} (${files.length} položek)`,
        });
      },

      // Paměť agenta
      memoryFacts: [],
      addMemoryFact: (fact) =>
        set((state) => ({
          memoryFacts: [...(state.memoryFacts || []), fact.trim()].filter(Boolean),
        })),
      removeMemoryFact: (index) =>
        set((state) => ({
          memoryFacts: (state.memoryFacts || []).filter((_, i) => i !== index),
        })),
      clearMemory: () => set({ memoryFacts: [] }),

      // Prompt Manager
      promptManagerOpen: false,
      setPromptManagerOpen: (open) => set({ promptManagerOpen: open }),
      voiceChatOpen: false,
      setVoiceChatOpen: (open) => set({ voiceChatOpen: open }),
      savedPrompts: [],
      addSavedPrompt: (prompt) =>
        set((state) => ({ savedPrompts: [...state.savedPrompts, prompt] })),
      updateSavedPrompt: (id, updates) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteSavedPrompt: (id) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.filter((p) => p.id !== id),
        })),
      togglePromptFavorite: (id) =>
        set((state) => ({
          savedPrompts: state.savedPrompts.map((p) =>
            p.id === id ? { ...p, favorite: !p.favorite } : p
          ),
        })),

      // Live Artifacts & Canvas
      activeArtifact: null,
      setActiveArtifact: (artifact) =>
        set((state) => ({
          activeArtifact: artifact,
          settings: {
            ...state.settings,
            activePanels: {
              ...state.settings.activePanels,
              preview: true,
            },
          },
        })),

      // Interface & Layout Customizer
      interfaceCustomizerOpen: false,
      setInterfaceCustomizerOpen: (open) => set({ interfaceCustomizerOpen: open }),
      setLayoutPreset: (preset) => {
        set((state) => {
          let sidebar = state.sidebarVisible;
          let statusBar = state.settings.showStatusBar !== false;
          let activePanels = { ...state.settings.activePanels };

          if (preset === 'full') {
            sidebar = true;
            statusBar = true;
            activePanels = { chat: true, editor: true, terminal: true, preview: false };
          } else if (preset === 'chat-only') {
            sidebar = true;
            statusBar = true;
            activePanels = { chat: true, editor: false, terminal: false, preview: false };
          } else if (preset === 'editor-only') {
            sidebar = true;
            statusBar = true;
            activePanels = { chat: false, editor: true, terminal: false, preview: false };
          } else if (preset === 'web-studio') {
            sidebar = true;
            statusBar = true;
            activePanels = { chat: false, editor: true, terminal: false, preview: true };
          } else if (preset === 'zen') {
            sidebar = false;
            statusBar = false;
            activePanels = { chat: false, editor: true, terminal: false, preview: false };
          }

          return {
            sidebarVisible: sidebar,
            settings: {
              ...state.settings,
              showStatusBar: statusBar,
              activePanels,
            },
          };
        });
      },
    }),
    {
      name: 'codespace-ai-storage',
      version: 4,
      migrate: (persistedState: any) => {
        const validIds = new Set(MOCK_MODELS.map((m) => m.id));
        if (!persistedState?.selectedModel?.id || !validIds.has(persistedState.selectedModel.id)) {
          return {
            ...persistedState,
            selectedModel: MOCK_MODELS[0],
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          const isValid = MOCK_MODELS.some((m) => m.id === state.selectedModel?.id);
          if (!isValid) {
            state.setSelectedModel(MOCK_MODELS[0]);
          }
        }
      },
      partialize: (state) => ({
        settings: state.settings,
        selectedModel: state.selectedModel,
        memoryFacts: state.memoryFacts,
        savedPrompts: state.savedPrompts,
      }),
    }
  )
);
