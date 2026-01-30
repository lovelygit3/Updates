# Patch your `index.html` (no Pages Functions)

## 1) Add API origin meta tag
Put this in `<head>`:
```html
<meta name="api-origin" content="https://YOUR-WORKER-DOMAIN">
```

If your UI and Worker share the same origin, you can omit it.

## 2) Include the client helper
Add before your inline script:
```html
<script src="/cloudflare-client.js"></script>
```

## 3) Change the init hook
Replace:
```js
document.addEventListener('DOMContentLoaded', init);
```
With:
```js
document.addEventListener('DOMContentLoaded', () => initWithCloudflare(init));
```

That keeps all your existing UI code and just swaps the lists (movies/games/shows/proxies) to come from the Worker catalog.
