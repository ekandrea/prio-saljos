export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { number } = req.query;
  if (!number) return res.status(400).json({ error: 'number saknas' });
  let n = String(number).replace(/[\s\-\(\)\.]/g, '');
  if (n.startsWith('0')) n = '+46' + n.slice(1);
  else if (!n.startsWith('+')) n = '+46' + n;
  try {
    const r = await fetch(`https://opendata.pts.se/api/Nummerportabilitet/nummer/${encodeURIComponent(n)}`, {
      headers: { 'Accept': 'application/json' }
    });
    const data = await r.json();
    return res.status(200).json({
      nummer: n,
      operatör: data.nuvarandeInnehavare || data.innehavare || null,
      portningsdatum: data.portningsdatum || null,
      nummertyp: data.nummertyp || null,
      nix: data.nix || false
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
