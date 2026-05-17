const OWNER  = 'isaias-sanchez';
const REPO   = 'conception-curriculaire-processus-modeles-methodologies';
const FILE   = 'data/images.json';
const BRANCH = 'main';

async function ghHeaders() {
  return {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    'Content-Type': 'application/json',
    'User-Agent':   'mapa-curriculum',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiBase = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${FILE}`;

  /* ── GET: return current image data ───────────────── */
  if (req.method === 'GET') {
    const r = await fetch(apiBase + `?ref=${BRANCH}`, { headers: await ghHeaders() });
    if (r.status === 404) return res.json({ nodes: {} });
    if (!r.ok)            return res.status(500).json({ error: 'read failed' });
    const { content } = await r.json();
    const data = JSON.parse(Buffer.from(content, 'base64').toString('utf8'));
    return res.json(data);
  }

  /* ── PUT: save updated image data ─────────────────── */
  if (req.method === 'PUT') {
    /* get current SHA (required for updates) */
    const meta   = await fetch(apiBase + `?ref=${BRANCH}`, { headers: await ghHeaders() });
    const sha    = meta.ok ? (await meta.json()).sha : undefined;
    const body   = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const encoded = Buffer.from(body).toString('base64');

    const putRes = await fetch(apiBase, {
      method:  'PUT',
      headers: await ghHeaders(),
      body: JSON.stringify({
        message: 'chore: update gallery images',
        content: encoded,
        branch:  BRANCH,
        ...(sha && { sha }),
      }),
    });
    if (!putRes.ok) {
      const err = await putRes.text();
      return res.status(500).json({ error: 'write failed', detail: err });
    }
    return res.json({ ok: true });
  }

  return res.status(405).end();
}
