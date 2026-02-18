export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { host, username, password, database, query } = req.body;

  if (!host || !username || !password || !query) {
    return res.status(400).json({ error: 'Missing required fields: host, username, password, query' });
  }

  const apiUrl = `https://http-${host}/v1beta/sql`;
  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'TiDB-Database': database || 'test',
      },
      body: JSON.stringify({ query }),
    });

    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
