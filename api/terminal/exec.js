// Vercel serverless: POST /api/terminal/exec
// Spousteni prikazu na serveru neni mozne – vraci srozumitelnou zpravu (200, ne 404).
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Pouzijte POST' });
    return;
  }
  const { command = '' } = req.body || {};
  if (!command || !command.trim()) {
    res.status(400).json({ error: 'Chybi prikaz' });
    return;
  }
  res.status(200).json({
    stdout: '',
    stderr:
      'Terminal neni na Vercelu dostupny – pro plny terminal spustte aplikaci lokalne (`npm run dev`).',
    exitCode: 1,
  });
};
