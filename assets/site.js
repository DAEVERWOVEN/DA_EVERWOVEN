"use strict";
/* DA UNIVERSE - public website music and download support.
   This website does not authenticate visitors with Google.
   An API key is optional; when supplied it must be browser-referrer restricted
   and API restricted to Google Drive API.
*/
const DA_SITE = {
  fileId: "1nyrXwN7q8yQznjTr6ZF9wbiarQT8nzCb",
  folderId: "1aBBBQ98PW-Z27yMna14Dv4Wbig6ooo4u",
  driveApiKey: "" // Optional: required only to auto-detect newly uploaded *separate* APKs.
};
const daFileLink = id => `https://drive.google.com/file/d/${encodeURIComponent(id)}/view`;

// When the APK is replaced via Drive > Manage versions > Upload new version,
// the original file ID and public URL remain the same. No API key is needed.
async function detectLatestPublicApk() {
  if (!DA_SITE.driveApiKey) return;
  const q = `'${DA_SITE.folderId}' in parents and trashed = false`;
  const url = new URL('https://www.googleapis.com/drive/v3/files');
  url.searchParams.set('key', DA_SITE.driveApiKey);
  url.searchParams.set('q', q);
  url.searchParams.set('pageSize', '100');
  url.searchParams.set('fields', 'nextPageToken,files(id,name,modifiedTime,size,mimeType,webViewLink)');
  url.searchParams.set('orderBy', 'modifiedTime desc');
  try {
    const result = await fetch(url.toString(), { mode: 'cors', cache: 'no-cache' });
    if (!result.ok) return; // Safe fallback to the known public file URL.
    const data = await result.json();
    const files = (data.files || []).filter(x => /\.apk$/i.test(x.name || '') && x.id);
    if (!files.length) return;
    // The folder might contain backups; pick the most recently modified APK.
    files.sort((a,b) => Date.parse(b.modifiedTime || 0)-Date.parse(a.modifiedTime || 0));
    const latest = files[0];
    document.querySelectorAll('[data-apk-link]').forEach(a => a.href = daFileLink(latest.id));
    const info = document.querySelector('[data-release-meta]');
    if (info) {
      const date = latest.modifiedTime ? new Date(latest.modifiedTime).toLocaleDateString(document.documentElement.lang) : '';
      info.textContent = `${latest.name}${date ? ' · '+date : ''}`;
    }
  } catch (_) { /* Static link remains available. */ }
}
detectLatestPublicApk();

// Browsers generally disallow audio autoplay. Music starts only after a user
// explicitly chooses ON; OFF always pauses and resets playback.
(() => {
  const toggle=document.querySelector('[data-audio-toggle]');
  const audio=document.getElementById('da-theme-audio');
  if (!toggle || !audio) return;
  audio.volume=.50;
  const label=toggle.querySelector('[data-audio-state]');
  const icon=toggle.querySelector('.music-icon');
  let enabled=false;
  function reflect() {
    toggle.setAttribute('aria-pressed', enabled ? 'true':'false');
    toggle.classList.toggle('audio-toggle--on', enabled);
    label.textContent=enabled?toggle.dataset.textOn:toggle.dataset.textOff;
    icon.textContent=enabled?'♫':'♪';
  }
  async function setEnabled(shouldPlay) {
    if (!shouldPlay) {
      enabled=false;
      audio.pause();
      audio.currentTime=0;
      try { sessionStorage.setItem('da-site-sound','off'); } catch (_) {}
      reflect();return;
    }
    try {
      await audio.play();
      enabled=true;
      try { sessionStorage.setItem('da-site-sound','on'); } catch (_) {}
    } catch (_) {
      enabled=false; // Unsupported audio / blocked autoplay: don't claim audio is ON.
    }
    reflect();
  }
  toggle.addEventListener('click', () => { setEnabled(!enabled); });
  reflect();
  // Best effort to resume previously-enabled music after navigating internally;
  // browsers may still require another tap to grant a playback gesture.
  try {
    if (sessionStorage.getItem('da-site-sound')==='on') {
      document.addEventListener('pointerdown', e => {
        if (e.target.closest('[data-audio-toggle]')) return;
        setEnabled(true);
      }, { once:true });
    }
  } catch (_) {}
})();
