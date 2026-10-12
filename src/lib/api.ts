import { Conversation, ChatMessage, FileNode, Project, AIProvider, AIModel } from '@/types';
import { generateId } from './utils';
import { MOCK_PROVIDERS, MOCK_MODELS } from './constants';
import { useAppStore } from '@/store/useAppStore';

// ===== PROVIDERS & MODELS =====

export async function fetchProviders(): Promise<AIProvider[]> {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_PROVIDERS), 100));
}

export async function fetchModels(): Promise<AIModel[]> {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_MODELS), 100));
}

// ===== CHAT & STREAMING =====

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onToolCall?: (toolCall: { name: string; arguments: Record<string, unknown> }) => void;
  onStatusChange?: (status: string) => void;
  onComplete: () => void;
  onError: (error: string) => void;
}

export async function sendMessageStream(
  conversation: Conversation,
  message: ChatMessage,
  callbacks: StreamCallbacks
): Promise<{ abort: () => void }> {
  const abortController = new AbortController();

  (async () => {
    try {
      callbacks.onStatusChange?.('thinking');

      const settings = useAppStore.getState().settings;
      const selectedModel = useAppStore.getState().selectedModel;

      const providerId = conversation.providerId || selectedModel?.providerId || 'fcc';
      const modelId = conversation.modelId || selectedModel?.id || 'fcc/claude-3-5-sonnet-20241022';

      // Determine API key and endpoint based on provider
      let apiKey = '';
      let endpoint = '';

      if (providerId === 'kimi') {
        apiKey = settings.apiKeys?.kimi || '';
        endpoint = settings.kimiEndpoint || 'https://api.moonshot.cn/v1';
      } else if (providerId === 'openrouter') {
        apiKey = settings.apiKeys?.openrouter || '';
      } else if (providerId === 'openai') {
        apiKey = settings.apiKeys?.openai || '';
      } else if (providerId === 'anthropic') {
        apiKey = settings.apiKeys?.anthropic || '';
      } else if (providerId === 'deepseek') {
        apiKey = settings.apiKeys?.deepseek || '';
      } else if (providerId === 'groq') {
        apiKey = settings.apiKeys?.groq || '';
      } else if (providerId === 'custom') {
        apiKey = settings.apiKeys?.custom || '';
        endpoint = settings.customEndpoint || 'http://localhost:8080/v1';
      }

      // Format attachments into message content
      let fullUserContent = message.content;
      if (message.attachments && message.attachments.length > 0) {
        const fileSnippets = message.attachments
          .filter((f) => f.content)
          .map((f) => `### 📁 [Připojený soubor: ${f.name}]\n\`\`\`${f.type === 'file' ? 'text' : ''}\n${f.content}\n\`\`\``)
          .join('\n\n');

        if (fileSnippets) {
          fullUserContent = `${fileSnippets}\n\n---\n**Uživatelská zpráva:**\n${message.content}`;
        }
      }

      // Construct message history
      const formattedMessages: { role: string; content: string }[] = [];

      // Memory facts from store
      const memoryFacts = useAppStore.getState().memoryFacts || [];
      const memoryBlock = memoryFacts.length > 0
        ? `\n\n## 🧠 PAMĚŤ (fakta o uživateli a projektu):\n${memoryFacts.map((f, i) => `${i + 1}. ${f}`).join('\n')}`
        : '';

      // System Prompt & Senior Architect Capabilities
      const fileSystemPrompt = `
Jsi **TripxCZ-Twitch AI asistent** — elitní Senior Full-Stack Softwarový Inženýr, Tech Lead a Softwarový Architekt (15+ let zkušeností), integrovaný přímo do lokálního vývojového prostředí Tripa (TripxCZ na Twitchi).

🇨🇿 JAZYK & KOMUNIKACE:
- Odpovídáš VÝHRADNĚ v češtině. Nikdy nepíšeš v jiném jazyce, i kdyby se uživatel ptal anglicky nebo jiným jazykem.
- Žádné interní meta-myšlenky ani uvažování o volbě jazyka nevypisuj do chatu – komunikuj přirozeně, stručně a s vysokou technickou hodnotou.
- Angličtinu používej pouze pro standardní technické termíny, názvy proměnných, funkcí, knihoven a v kódu samotném.

🏛️ SENIOR ARCHITEKT & INŽENÝRSKÉ STANDARDY:
1. **Architektura & Návrhové principy:**
   - Důsledně uplatňuj SOLID, DRY, KISS, YAGNI, Clean Architecture, Separation of Concerns a Domain-Driven Design (DDD).
   - Navrhuj systémy modulárně, rozšiřitelně a bez zbytečného over-engineeringu. Vol vhodné návrhové vzory (Factory, Strategy, Repository, Observer, Dependency Injection).

2. **Výkon & Škálovatelnost:**
   - Analyzuj asymptotickou složitost (Big-O), paměťové nároky a minimalizuj I/O overhead.
   - Používej efektivní asynchronní vzory (async/await, promises), správné znovupoužití spojení, cachování a vyvaruj se paměťových úniků (memory leaks) i zbytečných re-renderů ve frontendu.

3. **Produkční kvalita kódu (Production-Ready):**
   - NIKDY nepředávej polovičatý kód, pseudokódy, ani zkratky typu \`// sem doplň zbytek\` nebo \`// TODO\`. Vždy dodávej kompletní, plně funkční a syntakticky bezchybný kód.
   - Striktní typová bezpečnost: V TypeScriptu striktní typy (žádné líné \`any\`), přesná rozhraní, generiky a unie. V Pythonu striktní type hints, dataclasses/Pydantic a dodržování PEP 8.
   - Defenzivní programování: Ošetřuj hraniční stavy (edge cases), validuj vstupy a implementuj robustní error handling.

4. **Root Cause Analysis & Debugging:**
   - Při odstraňování chyb nikdy nelep jen povrchové záplaty na symptomy. Hledej skutečnou kořenovou příčinu (Root Cause) a zvažuj veškeré vedlejší vlivy (side-effects) na celou aplikaci.

💾 PŘÍSTUP K SOUBOROVÉMU SYSTÉMU PROJEKTU:
Máš PLNÝ PŘÍSTUP k souborovému systému. Nikdy neříkej, že nemůžeš vytvářet nebo upravovat soubory lokálně. Uživatelské IDE automaticky detekuje tvoje bloky kódu a ukládá je přímo na disk.

PRAVIDLO PRO TVORBU A ÚPRAVU SOUBORŮ:
Kdykoliv vytváříš nový soubor nebo navrhuješ úpravu, VŽDY na prvním řádku bloku kódu uveď přesnou relativní cestu k souboru v tomto formátu:
\`\`\`jazyk
// filepath: cesta/k/souboru.pripona
...kompletní kód souboru...
\`\`\`
Pro Python, Shell nebo konfigurační soubory použij:
\`\`\`python
# filepath: cesta/k/souboru.py
...kód souboru...
\`\`\`
Před blok kódu můžeš také uvést nadpis: **Soubor: \`cesta/k/souboru.ext\`**.
Uživatel má přímo v rozhraní tlačítko "Uložit na disk", kterým soubor jedním kliknutím vytvoří nebo v režimu Agent se vytvoří automaticky.${memoryBlock}`;

      formattedMessages.push({
        role: 'system',
        content: (settings.systemPrompt || '') + '\n\n' + fileSystemPrompt,
      });

      // Context mode instruction
      if (conversation.agentMode === 'plan') {
        formattedMessages.push({
          role: 'system',
          content: 'Mód: PLÁNOVAČ. Jako senior softwarový architekt navrhni podrobný krok-za-krokem plán realizace, architekturu komponent, datový tok, zvaž dopady a uveď seznam dotčených souborů před samotným zápisem.',
        });
      } else if (conversation.agentMode === 'agent') {
        formattedMessages.push({
          role: 'system',
          content: 'Mód: AGENT. Jako senior inženýr a architekt poskytuj kompletní, robustní řešení včetně produkčního kódu a konkrétních cest k souborům připravených k přímému zápisu na disk projektu. VŽDY použij // filepath: cesta/k/souboru na prvním řádku kódu!',
        });
      }

      // Past messages
      const pastMessages = conversation.messages.slice(0, -1);
      for (const m of pastMessages) {
        if (m.role === 'user' || m.role === 'assistant') {
          formattedMessages.push({
            role: m.role,
            content: m.content,
          });
        }
      }

      // Current message
      formattedMessages.push({
        role: 'user',
        content: fullUserContent,
      });

      // Send to /api/chat proxy
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal,
        body: JSON.stringify({
          provider: providerId,
          model: modelId,
          messages: formattedMessages,
          apiKey,
          endpoint,
          temperature: settings.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      callbacks.onStatusChange?.('completed');

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Nelze číst odpověď serveru (stream reader unavailable)');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;

          const dataStr = trimmed.replace(/^data:\s*/, '');
          if (dataStr === '[DONE]') {
            callbacks.onComplete();
            return;
          }

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta;
            if (delta) {
              if (delta.reasoning_content) {
                // Thinking/reasoning — pouze jako stavový indikátor, NEZOBRAZOVAT v chatu
                callbacks.onStatusChange?.('thinking');
                // reasoning_content se NEZAPISUJE do zprávy
              } else if (delta.content) {
                callbacks.onStatusChange?.('completed');
                callbacks.onChunk(delta.content);
              }
            }
          } catch {
            // Non-JSON SSE line, ignore
          }
        }
      }

      callbacks.onComplete();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        callbacks.onComplete();
        return;
      }
      callbacks.onError(err.message || 'Chyba při komunikaci');
    }
  })();

  return {
    abort: () => {
      abortController.abort();
    },
  };
}

// ===== FILESYSTEM =====

export async function fetchProjectFiles(projectPath: string): Promise<FileNode[]> {
  try {
    const res = await fetch(`/api/fs/tree?path=${encodeURIComponent(projectPath || '')}`);
    if (res.ok) {
      const data = await res.json();
      if (data.tree && data.tree.length > 0) {
        return data.tree;
      }
    }
  } catch {
    // fallback if API not available
  }

  // Fallback demo files if disk access fails
  return [
    {
      id: 'src',
      name: 'src',
      type: 'directory',
      path: 'src',
      isOpen: true,
      children: [
        {
          id: 'App.tsx',
          name: 'App.tsx',
          type: 'file',
          path: 'src/App.tsx',
          language: 'typescript',
          content: `export default function App() {\n  return <div>Vítejte v CodeSpace AI</div>;\n}`,
        },
      ],
    },
    {
      id: 'package.json',
      name: 'package.json',
      type: 'file',
      path: 'package.json',
      language: 'json',
      content: `{\n  "name": "codespace-ai",\n  "version": "1.0.0"\n}`,
    },
  ];
}

export async function readFileContent(filePath: string): Promise<string> {
  try {
    const res = await fetch(`/api/fs/read?file=${encodeURIComponent(filePath)}`);
    if (res.ok) {
      const data = await res.json();
      return data.content || '';
    }
  } catch {
    // fallback
  }
  return '';
}

export async function saveFile(filePath: string, content: string): Promise<void> {
  try {
    await fetch('/api/fs/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: filePath, content }),
    });
  } catch {
    // fallback
  }
}

export async function createFile(parentPath: string, name: string): Promise<FileNode> {
  const fullPath = `${parentPath}/${name}`.replace(/^\/+/, '');
  await saveFile(fullPath, '');
  return {
    id: generateId(),
    name,
    type: 'file',
    path: fullPath,
    language: name.split('.').pop() || 'plaintext',
    content: '',
  };
}

export async function createDirectory(parentPath: string, name: string): Promise<FileNode> {
  return {
    id: generateId(),
    name,
    type: 'directory',
    path: `${parentPath}/${name}`.replace(/^\/+/, ''),
    isOpen: false,
    children: [],
  };
}

export async function deleteFile(_filePath: string): Promise<void> {
  // Can be extended with /api/fs/delete
}

export async function renameFile(_oldPath: string, _newPath: string): Promise<void> {
  // Can be extended with /api/fs/rename
}

// ===== PROJECTS =====

export async function fetchRecentProjects(): Promise<Project[]> {
  return [
    {
      id: 'proj-codespace',
      name: 'codespace-ai',
      path: 'd:/trip/codespace-ai',
      rootFiles: [],
      lastOpened: new Date(),
      gitBranch: 'main',
    },
  ];
}

export async function openProject(projectPath: string): Promise<Project> {
  const files = await fetchProjectFiles(projectPath);
  return {
    id: generateId(),
    name: projectPath.split(/[/\\]/).pop() || 'Projekt',
    path: projectPath,
    rootFiles: files,
    lastOpened: new Date(),
  };
}

// ===== TERMINAL =====

export function createTerminalWebSocket(_terminalId: string): WebSocket {
  const handlers: {
    onopen: ((e: Event) => void) | null;
    onmessage: ((e: MessageEvent) => void) | null;
    onclose: ((e: CloseEvent) => void) | null;
    onerror: ((e: Event) => void) | null;
  } = {
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null,
  };

  let readyState: number = WebSocket.CONNECTING;

  const mockWS = {
    get readyState() {
      return readyState;
    },
    get onopen() {
      return handlers.onopen;
    },
    set onopen(fn) {
      handlers.onopen = fn;
    },
    get onmessage() {
      return handlers.onmessage;
    },
    set onmessage(fn) {
      handlers.onmessage = fn;
    },
    get onclose() {
      return handlers.onclose;
    },
    set onclose(fn) {
      handlers.onclose = fn;
    },
    get onerror() {
      return handlers.onerror;
    },
    set onerror(fn) {
      handlers.onerror = fn;
    },
    send: (data: string) => {
      setTimeout(() => {
        handlers.onmessage?.(
          new MessageEvent('message', { data: `$ ${data}\r\n` })
        );
      }, 50);
    },
    close: () => {
      readyState = WebSocket.CLOSED;
      handlers.onclose?.(new CloseEvent('close'));
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    url: '',
    protocol: '',
    extensions: '',
    bufferedAmount: 0,
    binaryType: 'blob' as BinaryType,
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  } as unknown as WebSocket;

  setTimeout(() => {
    readyState = WebSocket.OPEN;
    handlers.onopen?.(new Event('open'));
    handlers.onmessage?.(
      new MessageEvent('message', {
        data: 'CodeSpace AI Terminal připraven\r\n$ ',
      })
    );
  }, 100);

  return mockWS;
}
