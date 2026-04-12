export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { event, company, pkg, leadId } = req.body || {};
  const topic = 'prio-andy-2026';

  let title, msg, priority;
  if (event === 'opened') {
    title = 'Offert oppnad';
    msg = (company || 'Okand') + ' har oppnat din offert just nu';
    priority = '3';
  } else if (event === 'accepted') {
    title = 'OFFERT GODKAND!';
    msg = (company || 'Okand') + ' har godkant ' + (pkg || 'offerten') + '!';
    priority = '5';
  } else {
    return res.status(400).json({ error: 'unknown event' });
  }

  try {
    await fetch('https://ntfy.sh/' + topic, {
      method: 'POST',
      headers: {
        'Title': title,
        'Priority': priority,
        'Tags': event === 'accepted' ? 'tada,moneybag' : 'eyes',
      },
      body: msg,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
