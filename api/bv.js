export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const clientId = process.env.BV_CLIENT_ID;
  const clientSecret = process.env.BV_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'BV_CLIENT_ID eller BV_CLIENT_SECRET saknas.' });
  }

  const { orgnr, _endpoint, maxAntal } = req.query;

  // Health check
  if (_endpoint !== undefined) {
    return res.status(200).json({ status: 'ok' });
  }

  if (!orgnr) {
    return res.status(400).json({ error: 'orgnr saknas' });
  }

  try {
    const tokenRes = await fetch('https://portal.api.bolagsverket.se/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(401).json({ error: 'Kunde inte hämta token', details: tokenData });
    }

    const clean = orgnr.replace(/[-\s]/g, '');
    const apiRes = await fetch('https://gw.api.bolagsverket.se/vardefulla-datamangder/v1/organisationer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ identitetsbeteckning: clean })
    });

    const data = await apiRes.json();
    const org = data.organisationer?.[0];
    if (!org) return res.status(404).json({ error: 'Bolag ej hittat', rawResponse: data });

    const namn = org.organisationsnamn?.organisationsnamnLista?.find(n => n.organisationsnamntyp?.kod === 'FORETAGSNAMN')?.namn || '';
    const adress = org.postadressOrganisation?.postadress;
    const regDatum = org.organisationsdatum?.registreringsdatum || '';
    const beskrivning = org.verksamhetsbeskrivning?.beskrivning || '';
    const form = org.organisationsform?.klartext || '';

    return res.status(200).json({
      namn, regDatum, beskrivning, form,
      adress: adress ? `${adress.utdelningsadress}, ${adress.postnummer} ${adress.postort}` : ''
    });

  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
