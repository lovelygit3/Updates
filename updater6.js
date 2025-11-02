/* updater.js  ─────────────── */
const BUILD       = '2025-11-04-a';      //  bump here each release
const VERSION_URL = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@main/version4.json';
const HTML_URL    = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@latest/test4.html';

export async function checkUpdate(manual = false) {

  if (!manual && !JSON.parse(localStorage.getItem('autoUpdDash') || 'false'))
    return;                                          // auto-update disabled

  if (sessionStorage.updatedTo === BUILD) {          // already updated in this tab
    sessionStorage.removeItem('updatedTo');
    return;
  }

  try {
    const r = await fetch(VERSION_URL + '?t=' + Date.now(), {cache:'no-store'});
    const remote = String((await r.json()).build || '').trim();

    if (remote && remote !== BUILD) {
      const fresh = await (await fetch(HTML_URL + '?t=' + Date.now(),
                                       {cache:'no-store'})).text();
      sessionStorage.updatedTo = remote;             // stop loop
   // Save data before updating
const themeData = localStorage.getItem('hallowsTheme');
const autoUpdate = localStorage.getItem('autoUpdDash');
const updatedFlag = sessionStorage.getItem('updatedTo');

try {
  const response = await fetch(HTML_URL + '?t=' + Date.now(), {cache:'no-store'});
const fresh = await response.text();
console.log('Fetched HTML:', fresh); // <-- add this line

  // Parse the fetched HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(fresh, 'text/html');

  // Extract the #app content from the fetched page
  const newApp = doc.querySelector('#app');

  if (newApp) {
    // Replace only the #app innerHTML
    const currentApp = document.querySelector('#app');
    if (currentApp) {
      currentApp.innerHTML = newApp.innerHTML;
    }

    // Restore saved data
    if (themeData) localStorage.setItem('hallowsTheme', themeData);
    if (autoUpdate) localStorage.setItem('autoUpdDash', autoUpdate);
    if (updatedFlag) sessionStorage.setItem('updatedTo', updatedFlag);
  } else {
    console.warn('Could not find #app in fetched content');
  }

} catch (e) {
  console.error('Error during update:', e);
  // cancel the rest of this JS task
    }
    }
    if (manual) alert('You already have the latest build.');
  } catch (e) {
    if (manual) alert('Update failed: ' + e);
    console.warn(e);
  }
}

/* run once automatically */
checkUpdate();

/* expose for the manual button */
window.__dashUpdate = checkUpdate;
