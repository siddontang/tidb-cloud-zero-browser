export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { host, username, password, database, query } = await req.json();
  if (!host || !username || !password || !query) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const apiUrl = `https://http-${host}/v1beta/sql`;
  const auth = btoa(`${username}:${password}`);

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
    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 502 });
  }
};

export const config = { path: "/api/sql" };
