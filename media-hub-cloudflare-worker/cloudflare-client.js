(function () {
  'use strict';

  function getApiOrigin() {
    // Priority:
    // 1) <meta name="api-origin" content="...">
    // 2) localStorage apiOrigin override
    // 3) same origin
    const meta = document.querySelector('meta[name="api-origin"]');
    const metaVal = meta && meta.getAttribute('content') ? meta.getAttribute('content').trim() : '';
    const lsVal = (() => { try { return (localStorage.getItem('apiOrigin') || '').trim(); } catch { return ''; } })();
    const origin = metaVal || lsVal || window.location.origin;
    return origin.replace(/\/+$/, '');
  }

  function saveJson(key, obj) { try { localStorage.setItem(key, JSON.stringify(obj)); } catch {} }

  function normalizeCatalog(catalog, apiOrigin) {
    const out = Object.assign({ movies: [], games: [], shows: [], proxies: [] }, catalog || {});
    const norm = (v) => Array.isArray(v) ? v : [];
    out.movies = norm(out.movies);
    out.games  = norm(out.games);
    out.shows  = norm(out.shows);
    out.proxies= norm(out.proxies);

    const assetsBase = apiOrigin + '/api/assets/';
    out.games = out.games.map(g => {
      if (!g || typeof g !== 'object') return g;
      const r2Path = g.r2Path || g.assetPath || g.path;
      if (r2Path && !g.src && !g.url) {
        g.src = assetsBase + String(r2Path).replace(/^\/+/, '');
      } else if (g.src && g.src.startsWith('/api/assets/')) {
        // normalize relative to worker origin
        g.src = apiOrigin + g.src;
      }
      return g;
    });

    return out;
  }

  async function fetchCatalog(apiOrigin) {
    const res = await fetch(apiOrigin + '/api/catalog', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('catalog http ' + res.status);
    return await res.json();
  }

  async function initWithCloudflare(initFn) {
    const apiOrigin = getApiOrigin();
    try {
      if (!window.LS_KEYS) return initFn();

      const catalog = normalizeCatalog(await fetchCatalog(apiOrigin), apiOrigin);

      if (window.movies)  window.movies  = catalog.movies;
      if (window.games)   window.games   = catalog.games;
      if (window.shows)   window.shows   = catalog.shows;
      if (window.proxies) window.proxies = catalog.proxies;

      saveJson(window.LS_KEYS.movies,  catalog.movies);
      saveJson(window.LS_KEYS.games,   catalog.games);
      saveJson(window.LS_KEYS.shows,   catalog.shows);
      saveJson(window.LS_KEYS.proxies, catalog.proxies);

      window.cloudflareSearch = async function(q, type) {
        const u = new URL(apiOrigin + '/api/search');
        if (q) u.searchParams.set('q', q);
        if (type) u.searchParams.set('type', type);
        const r = await fetch(u.toString(), { headers: { 'Accept': 'application/json' } });
        if (!r.ok) throw new Error('search http ' + r.status);
        return await r.json();
      };
    } catch (e) {
      console.warn('[CF Worker] Catalog load failed; using localStorage defaults.', e);
    }
    return initFn();
  }

  window.initWithCloudflare = initWithCloudflare;
})();
