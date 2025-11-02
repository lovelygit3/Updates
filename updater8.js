/* updater4.js ───────────────────────────────────────── */
const BUILD       = '2025-11-05-a';   // bump each release
const VERSION_URL = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@main/version4.json';
const HTML_URL    = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@latest/test4.html';

/**
 * Check dashboard update.
 * @param {boolean} [manual=false] – true when called from “Check update now” button
 */
export async function checkUpdate(manual = false) {
  console.log('checkUpdate called, manual:', manual);

  /* 1. auto-update switch */
  if (!manual && !JSON.parse(localStorage.getItem('autoUpdDash') || 'false')) {
    console.log('Auto-update disabled.');
    return;
  }

  /* 2. already refreshed in this tab? */
  if (sessionStorage.updatedTo === BUILD) {
    console.log('Already up-to-date in this session.');
    sessionStorage.removeItem('updatedTo');
    return;
  }

  /* 3. ask the CDN for the latest version number */
  try {
    console.log('Fetching', VERSION_URL);
    const vr = await fetch(VERSION_URL + '?t=' + Date.now(), { cache: 'no-store' });
    console.log('Version response', vr.status);
    if (!vr.ok) throw `version fetch ${vr.status}`;
    const { build: remoteBuild = '' } = await vr.json();
    console.log('Remote build:', remoteBuild);

    /* 4. only proceed if there’s a newer build */
    if (remoteBuild && remoteBuild.trim() !== BUILD) {
      console.log('New build found → fetching HTML:', HTML_URL);
      const hr = await fetch(HTML_URL + '?t=' + Date.now(), { cache: 'no-store' });
      console.log('HTML response', hr.status);
      if (!hr.ok) throw `HTML fetch ${hr.status}`;
      const fresh = await hr.text();
      console.log('Fetched HTML length:', fresh.length);

      /* 5. remember so we don’t loop, then patch #app */
      sessionStorage.updatedTo = remoteBuild.trim();

      const doc = new DOMParser().parseFromString(fresh, 'text/html');
      const newApp = doc.querySelector('#app');
      if (newApp) {
        const currentApp = document.querySelector('#app');
        if (currentApp) {
          currentApp.innerHTML = newApp.innerHTML;
          console.log('#app content replaced — update complete.');
        }
      } else {
        console.warn('No #app in fetched HTML');
      }
    } else if (manual) {
      alert('You already have the latest build.');
    }
  } catch (e) {
    console.error('Update failed:', e);
    if (manual) alert('Update failed: ' + e);
  }
}

/* ─── run once automatically and expose for the button ─── */
if (typeof window !== 'undefined') {
  checkUpdate();                  // automatic check on load
  window.__dashUpdate = checkUpdate;
}
