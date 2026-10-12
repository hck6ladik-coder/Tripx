// Vercel serverless: GET /api/fs/directories
// Na Vercelu neni pristup k disku – vraci prazdny vypis (200, ne 404).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Pouzijte GET' });
    return;
  }
  res.status(200).json({ current: '', directories: [], parent: null });
};
