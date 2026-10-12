import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

function codeSpaceBackendPlugin(): Plugin {
  const FCC_URL = 'http://127.0.0.1:8082';

  return {
    name: 'codespace-backend-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';

        // 0. FCC SERVER HEALTH & MODELS
        if (url.startsWith('/api/fcc/status') && req.method === 'GET') {
          try {
            const fccRes = await fetch(`${FCC_URL}/health`, { signal: AbortSignal.timeout(1500) });
            if (fccRes.ok) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ connected: true, port: 8082 }));
              return;
            }
          } catch {
            // not running
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ connected: false }));
          return;
        }

        if (url.startsWith('/api/fcc/models') && req.method === 'GET') {
          try {
            const fccRes = await fetch(`${FCC_URL}/v1/models`, { signal: AbortSignal.timeout(3000) });
            if (fccRes.ok) {
              const data = await fccRes.json();
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(data));
              return;
            }
          } catch {
            // fallback
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ data: [] }));
          return;
        }

        // 1. CHAT COMPLETIONS API
        if (url.startsWith('/api/chat') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const data = JSON.parse(body || '{}');
              const {
                provider = 'fcc',
                model = 'claude-fable-5',
                messages = [],
                apiKey = '',
                endpoint = '',
                temperature = 0.7,
              } = data;

              // Check if local FCC-SERVER (free-claude-code) is reachable
              let fccAvailable = false;
              try {
                const check = await fetch(`${FCC_URL}/health`, { signal: AbortSignal.timeout(1000) });
                fccAvailable = check.ok;
              } catch {
                fccAvailable = false;
              }

              // Route to FCC if server is running AND (user selected fcc OR has no external API key OR targets localhost)
              const routeToFCC = fccAvailable && (
                provider === 'fcc' ||
                !apiKey ||
                endpoint.includes('8082') ||
                endpoint.includes('8080') ||
                provider === 'custom' ||
                model.toLowerCase().includes('nemotron')
              );

              // --- CASE A: ROUTE TO FCC-SERVER (Anthropic Messages API /v1/messages) ---
              if (routeToFCC) {
                // Prepare Anthropic Messages payload
                let systemPrompt = '';
                const anthropicMessages: { role: string; content: string }[] = [];

                for (const m of messages) {
                  if (m.role === 'system') {
                    systemPrompt += (systemPrompt ? '\n\n' : '') + m.content;
                  } else {
                    anthropicMessages.push({
                      role: m.role === 'assistant' ? 'assistant' : 'user',
                      content: m.content,
                    });
                  }
                }

                // If first message is assistant, prepend empty user message (Anthropic requirement)
                if (anthropicMessages.length > 0 && anthropicMessages[0].role === 'assistant') {
                  anthropicMessages.unshift({ role: 'user', content: 'Pokračuj' });
                }

                // Clean and normalize model name for fcc-server
                let targetModel = model || 'claude-fable-5';
                if (targetModel.includes('fcc/')) {
                  targetModel = targetModel.replace(/^fcc\//, '');
                }

                let effectiveSystem = systemPrompt || '';
                if (targetModel.includes('deepseek-r1')) {
                  effectiveSystem = `[MÓD: DeepSeek R1 Reasoning Engine]\nJsi DeepSeek R1 – špičkový reasoning model specializovaný na hluboké logické uvažování krok za krokem, matematickou přesnost a detailní analýzu problému.\n\n` + effectiveSystem;
                  targetModel = 'claude-fable-5';
                } else if (targetModel.includes('deepseek-coder')) {
                  effectiveSystem = `[MÓD: DeepSeek Coder Specialist]\nJsi DeepSeek Coder – elitní programátorský model zaměřený na čistý, vysoce optimalizovaný, modulární a robustní kód s důrazem na edge cases a best practices.\n\n` + effectiveSystem;
                  targetModel = 'claude-fable-5';
                } else if (targetModel.includes('qwen-coder') || targetModel.includes('qwen')) {
                  effectiveSystem = `[MÓD: Qwen 2.5 Coder Full-Stack]\nJsi Qwen 2.5 Coder od Alibaby – expert na moderní webový i systémový full-stack vývoj, rychlé skriptování a architekturu aplikací.\n\n` + effectiveSystem;
                  targetModel = 'claude-fable-5';
                } else if (!targetModel.startsWith('claude-') && !targetModel.startsWith('anthropic/')) {
                  targetModel = 'claude-fable-5';
                }

                const fccResponse = await fetch(`${FCC_URL}/v1/messages`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey || 'fcc-token',
                    'anthropic-version': '2023-06-01',
                  },
                  body: JSON.stringify({
                    model: targetModel || 'claude-fable-5',
                    max_tokens: 4096,
                    system: effectiveSystem || undefined,
                    messages: anthropicMessages,
                    stream: true,
                    temperature: temperature ?? 0.7,
                  }),
                });

                if (!fccResponse.ok) {
                  const errText = await fccResponse.text();
                  res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                  });
                  const payload = JSON.stringify({
                    choices: [
                      {
                        delta: {
                          content: `❌ **Chyba od fcc-serveru (${fccResponse.status})**:\n\n\`\`\`\n${errText}\n\`\`\``,
                        },
                      },
                    ],
                  });
                  res.write(`data: ${payload}\n\n`);
                  res.write(`data: [DONE]\n\n`);
                  res.end();
                  return;
                }

                // Stream Anthropic SSE events converted to OpenAI format
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                });

                if (fccResponse.body) {
                  const reader = fccResponse.body.getReader();
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
                      try {
                        const evt = JSON.parse(dataStr);
                        if (evt.type === 'content_block_delta') {
                          if (evt.delta?.type === 'thinking_delta') {
                            const chunk = JSON.stringify({
                              choices: [{ delta: { reasoning_content: evt.delta.thinking } }],
                            });
                            res.write(`data: ${chunk}\n\n`);
                          } else if (evt.delta?.type === 'text_delta') {
                            const chunk = JSON.stringify({
                              choices: [{ delta: { content: evt.delta.text } }],
                            });
                            res.write(`data: ${chunk}\n\n`);
                          }
                        } else if (evt.type === 'message_stop') {
                          res.write(`data: [DONE]\n\n`);
                        }
                      } catch {
                        // ignore non-json
                      }
                    }
                  }
                }
                res.write(`data: [DONE]\n\n`);
                res.end();
                return;
              }

              // --- CASE B: DIRECT PROVIDERS (OpenAI, Moonshot Kimi, OpenRouter, etc.) ---
              if (!apiKey && provider !== 'ollama' && provider !== 'custom') {
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                });

                const warningMsg = `⚠️ **Není nastaven API klíč ani není spuštěn fcc-server!**

Máte dvě možnosti:
1. **Použít váš fcc-server**: Spusťte v terminálu \`fcc-server\` (běží na portu 8082). Aplikace se na něj automaticky napojí bez nutnosti zadávat token!
2. **Přímé zadání tokenu**: Otevřete **Nastavení (⚙️)** a vložte svůj **Kimi Token** nebo **OpenRouter klíč**.`;

                const chunkPayload = JSON.stringify({
                  choices: [{ delta: { content: warningMsg } }],
                });
                res.write(`data: ${chunkPayload}\n\n`);
                res.write(`data: [DONE]\n\n`);
                res.end();
                return;
              }

              let targetUrl = '';
              const headers: Record<string, string> = {
                'Content-Type': 'application/json',
              };

              const cleanModelId = model.includes('/') ? model.split('/').slice(1).join('/') : model;

              if (provider === 'kimi') {
                const base = endpoint || 'https://api.moonshot.cn/v1';
                targetUrl = `${base.replace(/\/+$/, '')}/chat/completions`;
                headers['Authorization'] = `Bearer ${apiKey}`;
              } else if (provider === 'openrouter') {
                targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
                headers['Authorization'] = `Bearer ${apiKey}`;
                headers['HTTP-Referer'] = 'http://localhost:3000';
                headers['X-Title'] = 'CodeSpace AI';
              } else if (provider === 'openai') {
                targetUrl = 'https://api.openai.com/v1/chat/completions';
                headers['Authorization'] = `Bearer ${apiKey}`;
              } else if (provider === 'deepseek') {
                targetUrl = 'https://api.deepseek.com/chat/completions';
                headers['Authorization'] = `Bearer ${apiKey}`;
              } else if (provider === 'groq') {
                targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
                headers['Authorization'] = `Bearer ${apiKey}`;
              } else if (provider === 'ollama') {
                const base = endpoint || 'http://localhost:11434/v1';
                targetUrl = `${base.replace(/\/+$/, '')}/chat/completions`;
              } else {
                const base = endpoint || 'http://localhost:8082/v1';
                targetUrl = `${base.replace(/\/+$/, '')}/chat/completions`;
                if (apiKey) {
                  headers['Authorization'] = `Bearer ${apiKey}`;
                }
              }

              const upstreamResponse = await fetch(targetUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  model: cleanModelId,
                  messages,
                  stream: true,
                  temperature: temperature ?? 0.7,
                }),
              });

              if (!upstreamResponse.ok) {
                const errText = await upstreamResponse.text();
                let errMsg = errText;
                try {
                  const errJson = JSON.parse(errText);
                  errMsg = errJson.error?.message || errJson.message || errText;
                } catch {}

                res.writeHead(200, {
                  'Content-Type': 'text/event-stream',
                  'Cache-Control': 'no-cache',
                  'Connection': 'keep-alive',
                });
                const payload = JSON.stringify({
                  choices: [
                    {
                      delta: {
                        content: `❌ **Chyba od AI poskytovatele (${upstreamResponse.status})**:\n\n\`\`\`\n${errMsg}\n\`\`\``,
                      },
                    },
                  ],
                });
                res.write(`data: ${payload}\n\n`);
                res.write(`data: [DONE]\n\n`);
                res.end();
                return;
              }

              res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              });

              if (upstreamResponse.body) {
                const reader = upstreamResponse.body.getReader();
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;
                  res.write(Buffer.from(value));
                }
              }
              res.end();
            } catch (err: any) {
              res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
              });
              const payload = JSON.stringify({
                choices: [
                  {
                    delta: {
                      content: `❌ **Chyba spojení**: ${err?.message || 'Neznámá chyba'}.`,
                    },
                  },
                ],
              });
              res.write(`data: ${payload}\n\n`);
              res.write(`data: [DONE]\n\n`);
              res.end();
            }
          });
          return;
        }

        // 2. FILESYSTEM TREE API
        if (url.startsWith('/api/fs/tree') && req.method === 'GET') {
          const urlObj = new URL(url, 'http://localhost:3000');
          let dirPath = urlObj.searchParams.get('path');
          if (!dirPath) {
            dirPath = path.resolve(__dirname, '..');
          }

          try {
            function buildTree(dir: string, baseId = 'root'): any[] {
              if (!fs.existsSync(dir)) return [];
              const entries = fs.readdirSync(dir, { withFileTypes: true });
              const nodes: any[] = [];

              for (const entry of entries) {
                if (
                  entry.name.startsWith('.') ||
                  entry.name === 'node_modules' ||
                  entry.name === 'dist' ||
                  entry.name === 'brain' ||
                  entry.name === '$RECYCLE.BIN' ||
                  entry.name === 'System Volume Information'
                ) {
                  continue;
                }

                const fullPath = path.join(dir, entry.name);
                const id = `${baseId}/${entry.name}`;

                if (entry.isDirectory()) {
                  nodes.push({
                    id,
                    name: entry.name,
                    type: 'directory',
                    path: fullPath,
                    children: buildTree(fullPath, id),
                    isOpen: false,
                  });
                } else {
                  const ext = path.extname(entry.name).slice(1).toLowerCase();
                  nodes.push({
                    id,
                    name: entry.name,
                    type: 'file',
                    path: fullPath,
                    language: ext || 'plaintext',
                  });
                }
              }

              return nodes.sort((a, b) => {
                if (a.type === b.type) return a.name.localeCompare(b.name);
                return a.type === 'directory' ? -1 : 1;
              });
            }

            const tree = buildTree(dirPath);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ path: dirPath, tree }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 2b. LIST DIRECTORIES API (For folder browsing)
        if (url.startsWith('/api/fs/directories') && req.method === 'GET') {
          const urlObj = new URL(url, 'http://localhost:3000');
          let dirPath = urlObj.searchParams.get('path');

          try {
            if (!dirPath) {
              const drives: string[] = [];
              for (const drive of ['C:', 'D:', 'E:', 'F:']) {
                if (fs.existsSync(drive + '\\')) {
                  drives.push(drive + '\\');
                }
              }
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ current: '', directories: drives.map((d) => ({ name: d, path: d })), parent: null }));
              return;
            }

            if (!fs.existsSync(dirPath)) {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Složka neexistuje' }));
              return;
            }

            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            const dirs = entries
              .filter(
                (e) =>
                  e.isDirectory() &&
                  !e.name.startsWith('.') &&
                  e.name !== '$RECYCLE.BIN' &&
                  e.name !== 'System Volume Information' &&
                  e.name !== 'node_modules'
              )
              .map((e) => ({ name: e.name, path: path.join(dirPath, e.name) }))
              .sort((a, b) => a.name.localeCompare(b.name));

            const parent = path.dirname(dirPath) !== dirPath ? path.dirname(dirPath) : null;
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ current: dirPath, directories: dirs, parent }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 3. FILESYSTEM READ API
        if (url.startsWith('/api/fs/read') && req.method === 'GET') {
          const urlObj = new URL(url, 'http://localhost:3000');
          const filePath = urlObj.searchParams.get('file');

          if (!filePath || !fs.existsSync(filePath)) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Soubor nenalezen' }));
            return;
          }

          try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const ext = path.extname(filePath).slice(1).toLowerCase();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ content, language: ext || 'plaintext' }));
          } catch (err: any) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // 4. FILESYSTEM WRITE API
        if (url.startsWith('/api/fs/write') && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { path: filePath, projectPath, content } = JSON.parse(body || '{}');
              if (!filePath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Chybí cesta k souboru' }));
                return;
              }

              // Resolve workspace root (e.g. D:\trip)
              const workspaceRoot = path.resolve(__dirname, '..');
              const baseDir = projectPath || workspaceRoot;

              let resolvedPath = filePath;
              if (!path.isAbsolute(resolvedPath)) {
                resolvedPath = path.resolve(baseDir, resolvedPath);
              }

              // Ensure parent directory exists
              const dir = path.dirname(resolvedPath);
              if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
              }

              fs.writeFileSync(resolvedPath, content ?? '', 'utf-8');
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, path: resolvedPath }));
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), codeSpaceBackendPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
