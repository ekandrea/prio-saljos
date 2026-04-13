const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`
  };

  // POST — offert-sidan rapporterar event
  if (req.method === 'POST') {
    const { leadId, event, company, pkg } = req.body || {};
    if (!leadId) return res.status(400).json({ error: 'leadId krävs' });

    // Store event
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/leads?seller=eq.andy&select=data`, { headers })
        .then(r => r.json())
        .then(async rows => {
          if (!rows.length) return;
          const data = rows[0].data;
          if (!data.leads) return;
          const lead = data.leads.find(l => l.id === parseInt(leadId));
          if (!lead) return;
          if (event === 'opened') {
            lead.offerOpened = true;
            lead.offerOpenedAt = new Date().toISOString();
          }
          if (event === 'accepted') {
            lead.offerOpened = true;
            lead.status = 'order';
            lead.history = lead.history || [];
            lead.history.push({ date: new Date().toISOString().slice(0, 10), outcome: 'Kund godkände offert: ' + (pkg || ''), note: '', seller: 'system' });
          }
          // Save back
          await fetch(`${SUPABASE_URL}/rest/v1/leads?seller=eq.andy`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ data, updated_at: new Date().toISOString() })
          });
        });
      // Also try andrea
      await fetch(`${SUPABASE_URL}/rest/v1/leads?seller=eq.andrea&select=data`, { headers })
        .then(r => r.json())
        .then(async rows => {
          if (!rows.length) return;
          const data = rows[0].data;
          if (!data.leads) return;
          const lead = data.leads.find(l => l.id === parseInt(leadId));
          if (!lead) return;
          if (event === 'opened') {
            lead.offerOpened = true;
            lead.offerOpenedAt = new Date().toISOString();
          }
          if (event === 'accepted') {
            lead.offerOpened = true;
            lead.status = 'order';
            lead.history = lead.history || [];
            lead.history.push({ date: new Date().toISOString().slice(0, 10), outcome: 'Kund godkände offert: ' + (pkg || ''), note: '', seller: 'system' });
          }
          await fetch(`${SUPABASE_URL}/rest/v1/leads?seller=eq.andrea`, {
            method: 'PATCH',
            headers: { ...headers, 'Prefer': 'return=minimal' },
            body: JSON.stringify({ data, updated_at: new Date().toISOString() })
          });
        });

      return res.status(200).json({ ok: true, event });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // GET — SäljOS kollar status
  if (req.method === 'GET') {
    const leadId = req.query.id;
    if (!leadId) return res.status(400).json({ error: 'id krävs' });
    try {
      const seller = req.query.seller || 'andy';
      const r = await fetch(`${SUPABASE_URL}/rest/v1/leads?seller=eq.${seller}&select=data`, { headers });
      const rows = await r.json();
      if (!rows.length) return res.status(200).json({ found: false });
      const lead = rows[0].data?.leads?.find(l => l.id === parseInt(leadId));
      if (!lead) return res.status(200).json({ found: false });
      return res.status(200).json({ found: true, offerOpened: !!lead.offerOpened, status: lead.status });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
