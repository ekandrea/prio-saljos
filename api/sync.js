const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'SUPABASE_URL eller SUPABASE_SERVICE_KEY saknas' });
  }

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  const seller = (req.query.seller || req.body?.seller || 'andy').toLowerCase().trim();

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

  if (req.method === 'PUT') {
    try {
      const body = req.body;
      const sellerName = (body.seller || seller).toLowerCase().trim();
      const payload = { data: body, updated_at: new Date().toISOString() };

      // Try PATCH first (update existing row)
      const patchRes = await fetch(
        `${SUPABASE_URL}/rest/v1/leads?seller=eq.${encodeURIComponent(sellerName)}`,
        { method: 'PATCH', headers: { ...headers, 'Prefer': 'return=minimal' }, body: JSON.stringify(payload) }
      );

      if (patchRes.status === 204) {
        return res.status(200).json({ ok: true });
      }

      // If no row existed, insert new one
      const maxRes = await fetch(
        `${SUPABASE_URL}/rest/v1/leads?select=id&order=id.desc&limit=1`,
        { headers }
      );
      const maxRows = await maxRes.json();
      const nextId = (maxRows.length ? maxRows[0].id : 0) + 1;

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal' },
        body: JSON.stringify({ id: nextId, seller: sellerName, ...payload })
      });

      if (insertRes.ok) return res.status(200).json({ ok: true });
      const err = await insertRes.text();
      throw new Error(err);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
