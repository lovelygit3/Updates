/* updater.js  ─────────────── */
const BUILD       = '2025-11-05-a';      //  bump here each release
const VERSION_URL = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@main/version4.json';
const HTML_URL    = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@latest/test4.html';

export async function checkUpdate(manual = false) {

  export async function checkUpdate(manual = false) {
  console.log('checkUpdate called, manual:', manual);

  if (!manual && !JSON.parse(localStorage.getItem('autoUpdDash') || 'false')) {
    console.log('Auto-update disabled.');
    return;
  }

  if (sessionStorage.updatedTo === BUILD) {
    console.log('Already up-to-date in this session.');
    sessionStorage.removeItem('updatedTo');
    return;
  }

  try {
    console.log('Fetching version JSON from:', VERSION_URL);
    const r = await fetch(VERSION_URL + '?t=' + Date.now(), {cache:'no-store'});
    console.log('Version fetch response status:', r.status);
    if (!r.ok) {
      console.error('Version fetch failed:', r.status);
      return;
    }
    const json = await r.json();
    console.log('Version JSON:', json);

    const remoteBuild = String((json.build || '')).trim();
    console.log('Remote build:', remoteBuild);

    if (remoteBuild && remoteBuild !== BUILD) {
      console.log('Fetching HTML from:', HTML_URL);
      const response = await fetch(HTML_URL + '?t=' + Date.now(), {cache:'no-store'});
      console.log('HTML fetch response status:', response.status);
      if (!response.ok) {
        console.error('HTML fetch failed:', response.status);
        return;
      }
      const fresh = await response.text();
      console.log('Fetched HTML length:', fresh.length);

      // Proceed with update...
      sessionStorage.updatedTo = remoteBuild;

      // Replace only #app content
      const parser = new DOMParser();
      const doc = parser.parseFromString(fresh, 'text/html');
      const newApp = doc.querySelector('#app');

      if (newApp) {
        const currentApp = document.querySelector('#app');
        if (currentApp) {
          currentApp.innerHTML = newApp.innerHTML;
          console.log('Updated #app content.');
        }
      } else {
        console.warn('No #app found in fetched content.');
      }
      return; // Done
    } else {
      if (manual) alert('You already have the latest build.');
    }
  } catch (e) {
    console.error('Error during update:', e);
  }
}

/* run once automatically */
checkUpdate();

/* expose for the manual button */
window.__dashUpdate = checkUpdate;
