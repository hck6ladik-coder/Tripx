// AI Provider a Model
export interface AIProvider {
  id: string;
  name: string;
  icon?: string;
  connected: boolean;
  requiresAuth: boolean;
}

export interface AIModel {
  id: string;
  name: string;
  providerId: string;
  contextWindow?: number;
  capabilities: ('chat' | 'vision' | 'tools' | 'coding' | 'reasoning')[];
  favorite?: boolean;
  recent?: boolean;
}

// Zprávy v chatu
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export type AgentStatus =
  | 'idle'
  | 'thinking'
  | 'planning'
  | 'reading_files'
  | 'editing_files'
  | 'running_commands'
  | 'waiting_approval'
  | 'completed'
  | 'failed';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  model?: string;
  provider?: string;
  attachments?: Attachment[];
  toolCalls?: ToolCall[];
  agentStatus?: AgentStatus;
  streaming?: boolean;
  error?: string;
}

export interface Attachment {
  id: string;
  type: 'file' | 'image';
  name: string;
  size?: number;
  url?: string;
  content?: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: 'pending' | 'running' | 'completed' | 'error';
}

// Konverzace
export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  projectId?: string;
  modelId?: string;
  providerId?: string;
  agentMode: AgentMode;
  favorite?: boolean;
}

export type AgentMode = 'chat' | 'plan' | 'agent';

// Souborový systém
export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  parentId?: string;
  children?: FileNode[];
  isOpen?: boolean;
  isModified?: boolean;
  language?: string;
  content?: string;
  gitStatus?: 'modified' | 'added' | 'deleted' | 'untracked' | 'committed';
}

// Editor
export interface EditorTab {
  id: string;
  fileId: string;
  fileName: string;
  filePath: string;
  language: string;
  content: string;
  originalContent: string;
  isModified: boolean;
  isActive: boolean;
}

// Terminal
export interface TerminalSession {
  id: string;
  name: string;
  isActive: boolean;
  history: string[];
  currentCommand?: string;
  status: 'idle' | 'running' | 'error';
}

// Projekt
export interface Project {
  id: string;
  name: string;
  path: string;
  rootFiles: FileNode[];
  lastOpened: Date;
  gitBranch?: string;
}

// Uživatelské nastavení
export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  language: 'cs' | 'en';
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  autoSave: boolean;
  sidebarCollapsed: boolean;
  activePanels: {
    chat: boolean;
    editor: boolean;
    terminal: boolean;
    preview: boolean;
  };
  apiKeys: {
    kimi?: string;
    openrouter?: string;
    openai?: string;
    anthropic?: string;
    groq?: string;
    deepseek?: string;
    custom?: string;
  };
  kimiEndpoint?: string;
  customEndpoint?: string;
  systemPrompt?: string;
  temperature?: number;
}

// Toast notifikace
export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  duration?: number;
}
