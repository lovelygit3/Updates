/* updater.js  ─────────────── */
const BUILD       = '2025-11-02-a';      //  bump here each release
const VERSION_URL = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@main/version.json';
const HTML_URL    = 'https://cdn.jsdelivr.net/gh/lovelygit3/Updates@latest/test.html';

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
      document.open();
      document.write(/^\s*<!doctype/i.test(fresh) ? fresh
                                                  : '<!DOCTYPE html>\n' + fresh);
      document.close();
      throw 'dashboard replaced';                    // cancel the rest of this JS task
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
