const ZERO_API = 'https://zero.tidbapi.com/v1alpha1/instances';

// Module-level cache — survives across warm requests on the same function instance.
// Acts as a shared server-side L2 cache on top of the client's localStorage L1 cache.
let cached = null;

function isExpired(expiresAt) {
  // Treat as expired if less than 5 minutes remain
  return !expiresAt || new Date(expiresAt) <= new Date(Date.now() + 5 * 60_000);
}

export default async function handler(req, res) {
  // POST ?force=true → throw away the cached instance and provision a fresh one
  const forceNew = req.method === 'POST' && (req.query.force === 'true' || req.body?.force === true);

  if (forceNew) {
    cached = null;
  }

  // Return the cached instance if still valid
  if (cached && !isExpired(cached.expiresAt)) {
    return res.status(200).json(cached);
  }

  // Provision a new TiDB Cloud Zero instance
  try {
    const upstream = await fetch(ZERO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'browser-sql-editor' }),
    });

    if (!upstream.ok) {
      const text = await upstream.text();
      return res.status(upstream.status).json({ error: text });
    }

    const data = await upstream.json();
    cached = data.instance; // { connectionString, expiresAt }
    return res.status(200).json(cached);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
