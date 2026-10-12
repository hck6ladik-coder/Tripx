import { AIProvider, AIModel, AgentMode, UserSettings } from '@/types';

export const APP_NAME = 'TripxCZ-Twitch';

export const AGENT_MODES: { id: AgentMode; label: string; description: string }[] = [
  {
    id: 'chat',
    label: 'Chat',
    description:
      'Odpovídej na otázky, vysvětluj koncepty, recenzuj kód. Bez automatických změn souborů.',
  },
  {
    id: 'plan',
    label: 'Plán',
    description:
      'Analyzuj projekt, navrhni implementaci, zobraz ovlivněné soubory. Čeká na schválení.',
  },
  {
    id: 'agent',
    label: 'Agent',
    description:
      'Prováděj úkoly, upravuj soubory, spouštěj příkazy. Zobrazuje diffy ke schválení.',
  },
];

export const AGENT_STATUS_LABELS: Record<string, string> = {
  idle: 'Nečinný',
  thinking: 'Přemýšlí...',
  planning: 'Plánuje...',
  reading_files: 'Čte soubory...',
  editing_files: 'Upravuje soubory...',
  running_commands: 'Spouští příkazy...',
  waiting_approval: 'Čeká na schválení',
  completed: 'Dokončeno',
  failed: 'Selhalo',
};

export const LANGUAGE_MAP: Record<string, string> = {
  ts: 'typescript',
  tsx: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  html: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  zsh: 'shell',
  dockerfile: 'dockerfile',
};

export const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  language: 'cs',
  fontSize: 14,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: false,
  sidebarCollapsed: false,
  activePanels: {
    chat: true,
    editor: true,
    terminal: true,
    preview: false,
  },
  apiKeys: {
    kimi: '',
    openrouter: '',
    openai: '',
    anthropic: '',
    groq: '',
    deepseek: '',
    custom: '',
  },
  kimiEndpoint: 'https://api.moonshot.cn/v1',
  customEndpoint: 'http://localhost:8082',
  systemPrompt: '',
  temperature: 0.7,
};

export const MOCK_PROVIDERS: AIProvider[] = [
  { id: 'fcc', name: 'fcc-server (free-claude-code :8082)', connected: true, requiresAuth: false },
];

export const MOCK_MODELS: AIModel[] = [
  {
    id: 'fcc/claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    providerId: 'fcc',
    contextWindow: 200000,
    capabilities: ['chat', 'coding', 'tools', 'reasoning'],
    favorite: true,
    recent: true,
  },
];
