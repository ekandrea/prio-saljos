const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL eller SUPABASE_SERVICE_KEY saknas i Vercel env vars' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Prefer': 'return=representation'
  };

  const seller = (req.query.seller || 'andy').toLowerCase().trim();

  // GET — hämta leads för denna säljare
  if (req.method === 'GET') {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/leads?seller=eq.${encodeURIComponent(seller)}&select=data`,
        { headers }
      );
      const rows = await r.json();
      if (!rows.length) return res.status(200).json({ record: { leads: [] } });
      return res.status(200).json({ record: rows[0].data });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PUT — spara leads för denna säljare
  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const sellerName = (body.seller || seller).toLowerCase().trim();
      const r = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify({
          seller: sellerName,
          data: body,
          updated_at: new Date().toISOString()
        })
      });
      const result = await r.json();
      if (!r.ok) throw new Error(JSON.stringify(result));
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
