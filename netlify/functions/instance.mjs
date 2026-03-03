const ZERO_API = 'https://zero.tidbapi.com/v1alpha1/instances';
let cached = null;

function isExpired(expiresAt) {
  return !expiresAt || new Date(expiresAt) <= new Date(Date.now() + 5 * 60_000);
}

export default async (req) => {
  const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
  const forceNew = body.force === true;
  if (forceNew) cached = null;

  if (cached && !isExpired(cached.expiresAt)) {
    return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const upstream = await fetch(ZERO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'browser-sql-editor' }),
    });
    if (!upstream.ok) {
      return new Response(await upstream.text(), { status: upstream.status });
    }
    const data = await upstream.json();
    cached = data.instance;
    return new Response(JSON.stringify(cached), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
};

export const config = { path: "/api/instance" };
