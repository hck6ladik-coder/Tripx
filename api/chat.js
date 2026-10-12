// Vercel serverless: POST /api/chat
// Proxy na primo dostupne providery (OpenAI-kompatibilni SSE stream).
// Lokalni fcc-server (127.0.0.1:8082) na Vercelu nebezi, proto se misto
// HTTP 404 vzdy vraci SSE odpoved 200, kterou frontend umi zobrazit.
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
      endpoint = '',
      temperature = 0.7,
    } = req.body || {};

    const cleanModelId = model.includes('/') ? model.split('/').slice(1).join('/') : model;
    const ep = endpoint || '';
    const needsLocal =
      provider === 'fcc' ||
      provider === 'ollama' ||
      provider === 'custom' ||
      ep.includes('8082') ||
      ep.includes('8080') ||
      ep.includes('localhost') ||
      ep.includes('127.0.0.1') ||
      (cleanModelId && cleanModelId.toLowerCase().includes('nemotron'));

    if (needsLocal || !apiKey) {
      sendMessage(
        '⚠️ **Na Vercelu nebezi lokalni fcc-server.**\n\n' +
          'Pro chat na nasazene verzi otevrete **Nastaveni** a vlozte svuj API klic ' +
          '(Kimi / OpenRouter / OpenAI / DeepSeek / Groq). Modely `fcc/*` a lokalni funkce ' +
          '(disk, terminal) funguji jen pri spusteni na vlastnim pocitaci (`npm run dev`).'
      );
      return;
    }

    let targetUrl = '';
    const headers = { 'Content-Type': 'application/json' };

    if (provider === 'kimi') {
      targetUrl = `${(ep || 'https://api.moonshot.cn/v1').replace(/\/+$/, '')}/chat/completions`;
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'openrouter') {
      targetUrl = 'https://openrouter.ai/api/v1/chat/completions';
      headers['Authorization'] = `Bearer ${apiKey}`;
      headers['HTTP-Referer'] = 'https://vercel.app';
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
    } else if (provider === 'anthropic') {
      sendMessage(
        '❌ **Prime volani Anthropic API neni na Vercelu podporovano.** ' +
          'Pouzijte OpenRouter nebo jineho OpenAI-kompatibilniho poskytovatele.'
      );
      return;
    } else {
      if (!ep) {
        sendMessage('❌ **Chybi endpoint pro vlastniho poskytovatele.** Nastavte ho v Nastaveni.');
        return;
      }
      targetUrl = `${ep.replace(/\/+$/, '')}/chat/completions`;
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const upstream = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: cleanModelId,
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
};
