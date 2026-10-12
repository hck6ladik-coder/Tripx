// Vercel serverless: POST /api/chat
// Proxy na primo dostupne providery (OpenAI-kompatibilni SSE stream).
// Lokalni fcc-server (127.0.0.1:8082) na Vercelu nebezi, proto se pozadavek
// automaticky presmeruje na prvniho dostupneho poskytovatele podle klicu:
// 1) klic z UI (Nastaveni -> localStorage -> telo pozadavku),
// 2) klic ze serverovych env promennych (Vercel -> Environment Variables).
// Vzdy se vraci SSE odpoved 200, kterou frontend umi zobrazit (zadne 404).

// Klice ze serverovych env (Vercel -> Settings -> Environment Variables)
const ENV_KEYS = {
  openrouter: process.env.OPENROUTER_API_KEY || '',
  kimi: process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || '',
  openai: process.env.OPENAI_API_KEY || '',
  deepseek: process.env.DEEPSEEK_API_KEY || '',
  groq: process.env.GROQ_API_KEY || '',
};

const DIRECT_PROVIDERS = ['openrouter', 'kimi', 'openai', 'deepseek', 'groq'];

// Prevod fcc/* modelu na prime modely poskytovatelu
function mapFccModel(fccId, provider) {
  const id = String(fccId || '').toLowerCase();
  if (provider === 'openrouter') {
    if (id.includes('opus-4')) return 'anthropic/claude-opus-4';
    if (id.includes('sonnet-4')) return 'anthropic/claude-sonnet-4';
    if (id.includes('3-5-sonnet')) return 'anthropic/claude-3.5-sonnet';
    if (id.includes('deepseek-r1') || (id.includes('deepseek') && id.includes('r1')))
      return 'deepseek/deepseek-r1';
    if (id.includes('deepseek')) return 'deepseek/deepseek-chat';
    if (id.includes('qwen')) return 'qwen/qwen-2.5-coder-32b-instruct';
    return 'anthropic/claude-3.5-sonnet';
  }
  if (provider === 'deepseek') {
    return id.includes('r1') || id.includes('reason') ? 'deepseek-reasoner' : 'deepseek-chat';
  }
  if (provider === 'kimi') return 'moonshot-v1-8k';
  if (provider === 'openai') return 'gpt-4o-mini';
  if (provider === 'groq') return 'llama-3.3-70b-versatile';
  return 'anthropic/claude-3.5-sonnet';
}

const NO_KEY_MSG =
  '⚠️ **Neni nastaven zadny API klic!**\n\n' +
  'Mate dve moznosti:\n' +
  '1. **Vlozit klic v aplikaci**: otevrete **Nastaveni** a vlozte svuj klic ' +
  '(Kimi / OpenRouter / OpenAI / DeepSeek / Groq).\n' +
  '2. **Prednastavit na Vercelu**: pridejte Environment Variable ' +
  '(`OPENROUTER_API_KEY`, `KIMI_API_KEY`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY` nebo `GROQ_API_KEY`) ' +
  'v nastaveni projektu a redeploynete.\n\n' +
  'Modely `fcc/*` a lokalni funkce (disk, terminal) funguji jen pri spusteni na vlastnim pocitaci (`npm run dev` + `fcc-server`).';

const ANTHROPIC_MSG =
  '❌ **Prime volani Anthropic API neni podporovano.** ' +
  'Pouzijte OpenRouter (modely Claude tam najdete taky) nebo jineho OpenAI-kompatibilniho poskytovatele.';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Pouzijte POST' });
    return;
  }

  const sseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  };

  const sendMessage = (text) => {
    res.writeHead(200, sseHeaders);
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  };

  try {
    const {
      provider = 'fcc',
      model = '',
      messages = [],
      apiKey = '',
      apiKeys = {},
      endpoint = '',
      temperature = 0.7,
    } = req.body || {};

    const cleanModelId = model.includes('/') ? model.split('/').slice(1).join('/') : model;

    // Sdruzene klice: explicitni klic z UI ma prednost, pak mapa z UI, pak env
    const keys = {};
    for (const p of DIRECT_PROVIDERS) {
      keys[p] = (apiKeys && apiKeys[p]) || ENV_KEYS[p] || '';
    }
    if (apiKey) keys[provider] = apiKey;

    const ep = endpoint || '';
    const isLocalTarget =
      provider === 'fcc' ||
      provider === 'ollama' ||
      provider === 'custom' ||
      ep.includes('8082') ||
      ep.includes('8080') ||
      ep.includes('localhost') ||
      ep.includes('127.0.0.1') ||
      cleanModelId.toLowerCase().includes('nemotron');

    let effProvider = provider;
    let effKey = keys[provider] || '';
    let effModel = cleanModelId;

    // Cil je lokalni server (na Vercelu nebezi) nebo chybi klic -> automaticky presmerovat
    if (isLocalTarget || !effKey) {
      const auto = DIRECT_PROVIDERS.find((p) => keys[p]);
      if (auto) {
        effProvider = auto;
        effKey = keys[auto];
        effModel = mapFccModel(cleanModelId, auto);
      }
    }

    const hasAnthropicOnly =
      !effKey && ((apiKeys && apiKeys.anthropic) || process.env.ANTHROPIC_API_KEY);
    if (hasAnthropicOnly) {
      sendMessage(ANTHROPIC_MSG);
      return;
    }
    if (!effKey) {
      sendMessage(NO_KEY_MSG);
      return;
    }
    if (effProvider === 'anthropic') {
      sendMessage(ANTHROPIC_MSG);
      return;
    }

    let targetUrl = '';
    const headers = { 'Content-Type': 'application/json' };

    if (effProvider === 'kimi') {
      targetUrl = 'https://api.moonshot.cn/v1/chat/completions';
      headers['Authorization'] = `Bearer ${effKey}`;
    } else if (effProvider === 'openrouter') {
      targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${effKey}`;
      headers['HTTP-Referer'] = 'https://vercel.app';
      headers['X-Title'] = 'CodeSpace AI';
    } else if (effProvider === 'openai') {
      targetUrl = 'https://api.openai.com/v1/chat/completions';
      headers['Authorization'] = `Bearer ${effKey}`;
    } else if (effProvider === 'deepseek') {
      targetUrl = 'https://api.deepseek.com/chat/completions';
      headers['Authorization'] = `Bearer ${effKey}`;
    } else if (effProvider === 'groq') {
      targetUrl = 'https://api.groq.com/openai/v1/chat/completions';
      headers['Authorization'] = `Bearer ${effKey}`;
    } else {
      if (!ep) {
        sendMessage('❌ **Chybi endpoint pro vlastniho poskytovatele.** Nastavte ho v Nastaveni.');
        return;
      }
      targetUrl = `${ep.replace(/\/+$/, '')}/chat/completions`;
      headers['Authorization'] = `Bearer ${effKey}`;
    }

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: effModel,
        messages,
        stream: true,
        temperature: temperature ?? 0.7,
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text().catch(() => '');
      let errMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errJson.message || errText;
      } catch {
        // ponechat surovy text
      }
      sendMessage(
        `❌ **Chyba od AI poskytovatele (${upstream.status})**:\n\n\`\`\`\n${errMsg}\n\`\`\``
      );
      return;
    }

    res.writeHead(200, sseHeaders);
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    sendMessage(`❌ **Chyba spojeni**: ${err?.message || 'Neznama chyba'}.`);
  }
}
