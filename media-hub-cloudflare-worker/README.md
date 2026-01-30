# Media Hub → Cloudflare **Worker + R2** (no Pages Functions, no _routes.json)

You said Pages Functions aren’t supported in your setup. This package uses:
- **Cloudflare Worker** (API + asset gateway)
- **Cloudflare R2** (stores your games/assets + catalog.json)
- **Cloudflare Pages** (optional) to host your static `index.html` UI

The Worker provides:
- `GET /api/catalog`
- `GET /api/search?q=...&type=...`
- `GET /api/assets/<path...>`   (serves files from your R2 bucket)

## 1) Deploy the Worker
### A) Using Wrangler
1. Install wrangler and login
2. Edit `wrangler.toml` with your Worker name and route (optional)
3. Bind your R2 bucket name in `wrangler.toml`
4. Deploy:
   - `wrangler deploy`

### B) Dashboard
Create a Worker, paste `worker/src/index.js`, and add an R2 binding named `ASSETS_BUCKET`.

## 2) Upload files to R2
Upload:
- `catalog.json` to the **bucket root** (key: `catalog.json`)
- Your game folders under e.g. `games/<game>/...`

Example:
- `games/my-game/index.html`
- `games/my-game/bundle.js`
- `games/my-game/assets/sprite.png`

## 3) Point your UI at the Worker
Add this near the top of your HTML (in `<head>`):
```html
<meta name="api-origin" content="https://YOUR-WORKER-DOMAIN">
```

Then add this before your big inline script:
```html
<script src="/cloudflare-client.js"></script>
```

And replace your last init line:
```js
document.addEventListener('DOMContentLoaded', init);
```
with:
```js
document.addEventListener('DOMContentLoaded', () => initWithCloudflare(init));
```

If your UI is on Pages and Worker is on another domain, the meta tag is required.

## Why this works for "games load assets from files"
If a game entry points to an R2 path like `games/my-game/index.html`, we convert it to:
`<API_ORIGIN>/api/assets/games/my-game/index.html`

Then **relative assets** in that HTML (like `./bundle.js`) resolve back to the same /api/assets/ prefix.

## Important limitation
This is **NOT** a general web proxy/unblocker. It only serves content you host in your R2 bucket.
