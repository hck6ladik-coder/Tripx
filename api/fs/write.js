// Vercel serverless: POST /api/fs/write
// Na Vercelu neni zapis na disk – vraci uspech bez perzistence (200, ne 404).
// Soubor zustane otevreny v editoru, po reloadu se neulozi.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Pouzijte POST' });
    return;
  }
  const { path: filePath = '', content = '' } = req.body || {};
  if (!filePath) {
    res.status(400).json({ error: 'Chybi cesta k souboru' });
    return;
  }
  res.status(200).json({ success: true, path: filePath, ephemeral: true });
};
