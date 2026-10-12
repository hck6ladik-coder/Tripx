// Vercel serverless: GET /api/fs/tree
// Na Vercelu neni pristup k disku – vraci prazdny strom (200, ne 404).
// Frontend pak pouzije vestavene ukazkove soubory.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Pouzijte GET' });
    return;
  }
  const dirPath = (req.query && req.query.path) || '';
  res.status(200).json({ path: dirPath, tree: [] });
};
