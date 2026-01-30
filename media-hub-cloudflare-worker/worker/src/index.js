/**
 * Media Hub API Worker (R2-backed)
 * Routes:
 *  - GET /api/catalog
 *  - GET /api/search?q=&type=
 *  - GET /api/assets/<path...>
 *
 * Bindings:
 *  - ASSETS_BUCKET (R2)
 */
const EXT_TO_TYPE = {
  html: 'text/html; charset=utf-8',
  htm:  'text/html; charset=utf-8',
  js:   'application/javascript; charset=utf-8',
  mjs:  'application/javascript; charset=utf-8',
  css:  'text/css; charset=utf-8',
  json: 'application/json; charset=utf-8',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  svg:  'image/svg+xml',
  ico:  'image/x-icon',
  wasm: 'application/wasm',
  mp3:  'audio/mpeg',
  mp4:  'video/mp4',
  ogg:  'audio/ogg',
  wav:  'audio/wav',
  txt:  'text/plain; charset=utf-8',
};

function guessType(key) {
  const m = String(key).toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return 'application/octet-stream';
  return EXT_TO_TYPE[m[1]] || 'application/octet-stream';
}

function json(resObj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(resObj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      ...extraHeaders,
    },
  });
}

function normalizeArr(v) { return Array.isArray(v) ? v : []; }
function toStr(v) { return v == null ? '' : String(v); }

function matchesQuery(item, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  const title = toStr(item.title).toLowerCase();
  const desc  = toStr(item.description).toLowerCase();
  const tags  = normalizeArr(item.tags).map(t => toStr(t).toLowerCase()).join(' ');
  return title.includes(needle) || desc.includes(needle) || tags.includes(needle);
}

function safePath(pathname) {
  // Block traversal and backslashes
  if (!pathname || pathname.includes('..') || pathname.includes('\\')) return false;
  return true;
}

async function handleCatalog(request, env) {
  let catalog = { movies: [], games: [], shows: [], proxies: [] };

  try {
    const obj = await env.ASSETS_BUCKET.get('catalog.json');
    if (obj) catalog = JSON.parse(await obj.text());
  } catch {}

  catalog.movies = normalizeArr(catalog.movies);
  catalog.games  = normalizeArr(catalog.games);
  catalog.shows  = normalizeArr(catalog.shows);
  catalog.proxies= normalizeArr(catalog.proxies);

  // Auto-build src for games with r2Path
  const assetsBase = new URL('/api/assets/', request.url).toString();
  catalog.games = catalog.games.map(g => {
    if (!g || typeof g !== 'object') return g;
    const r2Path = g.r2Path || g.assetPath || g.path;
    if (r2Path && !g.src && !g.url) g.src = assetsBase + String(r2Path).replace(/^\/+/, '');
    return g;
  });

  return json(catalog, 200, { 'Cache-Control': 'public, max-age=60' });
}

async function handleSearch(request, env) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const type = (url.searchParams.get('type') || 'all').trim().toLowerCase();

  // Load catalog
  let catalog = { movies: [], games: [], shows: [], proxies: [] };
  try {
    const obj = await env.ASSETS_BUCKET.get('catalog.json');
    if (obj) catalog = JSON.parse(await obj.text());
  } catch {}

  const out = {};
  if (type === 'movie' || type === 'all')  out.movies  = normalizeArr(catalog.movies).filter(m => matchesQuery(m, q));
  if (type === 'game'  || type === 'all')  out.games   = normalizeArr(catalog.games).filter(g => matchesQuery(g, q));
  if (type === 'show'  || type === 'all')  out.shows   = normalizeArr(catalog.shows).filter(s => matchesQuery(s, q));
  if (type === 'proxy' || type === 'all')  out.proxies = normalizeArr(catalog.proxies).filter(p => matchesQuery(p, q));

  return json({ query: q, type, results: out }, 200, { 'Cache-Control': 'no-store' });
}

async function handleAssets(request, env) {
  const url = new URL(request.url);
  const prefix = '/api/assets/';
  const key = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length) : '';

  if (!key || !safePath(key)) return new Response('Invalid path', { status: 400 });

  const obj = await env.ASSETS_BUCKET.get(key);
  if (!obj) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  headers.set('Content-Type', obj.httpMetadata?.contentType || guessType(key));
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('X-Content-Type-Options', 'nosniff');

  if (obj.httpEtag) headers.set('ETag', obj.httpEtag);

  return new Response(obj.body, { status: 200, headers });
}

export default {
  async fetch(request, env, ctx) {
    if (!env.ASSETS_BUCKET) return new Response('Missing R2 binding ASSETS_BUCKET', { status: 500 });

    const url = new URL(request.url);

    // CORS preflight for API endpoints
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,Accept',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'GET') return new Response('Method not allowed', { status: 405 });

    if (url.pathname === '/api/catalog') return handleCatalog(request, env);
    if (url.pathname === '/api/search')  return handleSearch(request, env);
    if (url.pathname.startsWith('/api/assets/')) return handleAssets(request, env);

    return new Response('Not found', { status: 404 });
  },
};
