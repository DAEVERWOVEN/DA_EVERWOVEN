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


// Continuous music stays in this document during internal SPA page transitions.
// The MP3 is decoded and its tail is cross-faded into the beginning in PCM;
// a single AudioBufferSourceNode then loops sample-accurately without gaps.
(() => {
  const audioElement = document.getElementById('da-theme-audio');
  const scriptElement = document.querySelector('script[src*="site.js"]');
  if (!audioElement || !scriptElement) return;
  const siteRoot = new URL('../', scriptElement.src);
  const musicURL = new URL('assets/da-universe-theme.mp3', siteRoot);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let ctx = null, gain = null, source = null, loopBuffer = null, loadPromise = null;
  let playing = false, fallback = false, sequence = 0, starting = null;
  // A fresh visit always requests music. Muting is retained only while
  // navigating within this SPA, not across a new visit or reload.
  let wanted = true;

  function getToggle() { return document.querySelector('[data-audio-toggle]'); }
  function renderSoundState() {
    const button = getToggle();
    if (!button) return;
    const lang = document.documentElement.lang || 'uk';
    const waiting = {uk:'Звук: Увімкнути', en:'Sound: Play', ru:'Звук: Включить'};
    const label = button.querySelector('[data-audio-state]');
    const icon = button.querySelector('.music-icon');
    const active = playing && wanted;
    button.setAttribute('aria-pressed', active ? 'true' : 'false');
    button.classList.toggle('audio-toggle--on', active);
    if (label) label.textContent = active ? button.dataset.textOn :
      wanted ? (waiting[lang] || waiting.uk) : button.dataset.textOff;
    if (icon) icon.textContent = active ? '♫' : '♪';
  }
  function initContext() {
    if (!AudioContextClass) throw new Error('Web Audio unsupported');
    if (!ctx) {
      ctx = new AudioContextClass();
      gain = ctx.createGain();
      gain.gain.value = 0.5;
      gain.connect(ctx.destination);
    }
    return ctx;
  }
  function prepareLoop() {
    if (loopBuffer) return Promise.resolve(loopBuffer);
    if (loadPromise) return loadPromise;
    const context = initContext();
    loadPromise = fetch(musicURL.href)
      .then(response => {
        if (!response.ok) throw new Error('Audio unavailable');
        return response.arrayBuffer();
      })
      .then(raw => context.decodeAudioData(raw))
      .then(decoded => {
        // Crossfade the final samples into the beginning. On every repeat,
        // the loop jumps to the sample immediately after the overlapped intro.
        // The initial play still starts at 0, preserving the complete opening.
        const fade = Math.min(Math.round(decoded.sampleRate * 0.35), Math.floor(decoded.length / 8));
        if (fade < 2) { loopBuffer = decoded; return loopBuffer; }
        const length = decoded.length;
        const mixed = context.createBuffer(decoded.numberOfChannels, length, decoded.sampleRate);
        for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
          const input = decoded.getChannelData(ch);
          const output = mixed.getChannelData(ch);
          output.set(input);
          for (let i = 0; i < fade; i++) {
            const t = i / (fade - 1);
            output[length - fade + i] = input[length - fade + i] * (1 - t) + input[i] * t;
          }
        }
        loopBuffer = mixed;
        return mixed;
      }).catch(error => { loadPromise = null; throw error; });
    return loadPromise;
  }
  function startSound() {
    if (!wanted || playing) return starting;
    const attempt = sequence;
    let context = null, running = null, setupError = null;
    try {
      context = initContext();
      // Reissue resume *inside* every real user gesture, even if a previous
      // autoplay attempt is still waiting for Chrome to unlock AudioContext.
      running = context.resume();
    } catch (error) {
      setupError = error;
    }
    // Only one decode/start pipeline may run. Multiple rapid gestures must
    // not invalidate each other or demand a second tap.
    if (starting) return starting;
    starting = (async () => {
      try {
        if (setupError) throw setupError;
        await Promise.all([running, prepareLoop()]);
        if (!wanted || playing || attempt !== sequence || context.state !== 'running') return;
        source = context.createBufferSource();
        source.buffer = loopBuffer;
        source.loop = true;
        const fadeSeconds = Math.min(0.35, loopBuffer.duration / 8);
        source.loopStart = fadeSeconds;
        source.loopEnd = loopBuffer.duration;
        source.connect(gain);
        source.start(0);
        fallback = false;
        playing = true;
      } catch (_) {
        if (!wanted || playing || attempt !== sequence) return;
        try {
          audioElement.volume = 0.5;
          audioElement.loop = true;
          await audioElement.play();
          if (!wanted || attempt !== sequence) {
            audioElement.pause();
            return;
          }
          fallback = true;
          playing = true;
        } catch (_) {
          playing = false; // Never report sound ON if browser blocked playback.
        }
      } finally {
        starting = null;
        renderSoundState();
      }
    })();
    return starting;
  }
  function stopSound() {
    wanted = false;
    sequence++;
    if (source) {
      try { source.stop(); } catch (_) {}
      try { source.disconnect(); } catch (_) {}
      source = null;
    }
    if (fallback || !audioElement.paused) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    playing = false;
    fallback = false;
    renderSoundState();
  }
  function requestSound() {
    wanted = true;
    renderSoundState();
    startSound();
  }

  // Browsers may deny unprompted sound. Try immediately; if denied,
  // begin on the very first permitted interaction without resetting on links.
  renderSoundState();
  if (wanted) startSound();
  document.addEventListener('pointerdown', event => {
    // A sound-button click owns its start/stop action. Unlocking audio here
    // could make the subsequent click immediately turn a just-started sound OFF.
    if (event.target.closest('[data-audio-toggle]')) return;
    if (wanted && !playing) startSound();
  }, {capture:true});
  document.addEventListener('keydown', event => {
    if (event.target.closest('[data-audio-toggle]')) return;
    if (wanted && !playing) startSound();
  }, {capture:true});

  // Fetch and swap HTML shell only. The audio node, decoded buffer and JS
  // stay in place so crossing pages/languages never interrupts the track.
  let pendingNavigation = null;
  async function loadPage(destination, addHistory) {
    const url = new URL(destination, location.href);
    if (pendingNavigation) pendingNavigation.abort();
    const controller = new AbortController();
    pendingNavigation = controller;
    try {
      const response = await fetch(url.href, {signal:controller.signal});
      if (!response.ok) throw new Error('Navigation failed');
      const documentHTML = new DOMParser().parseFromString(await response.text(), 'text/html');
      const shell = documentHTML.querySelector('.page-shell');
      const current = document.querySelector('.page-shell');
      if (!shell || !current || controller.signal.aborted) throw new Error('Invalid page');
      current.replaceWith(shell);
      document.title = documentHTML.title;
      document.documentElement.lang = documentHTML.documentElement.lang;
      const newDescription = documentHTML.querySelector('meta[name="description"]');
      const oldDescription = document.querySelector('meta[name="description"]');
      if (newDescription && oldDescription) oldDescription.content = newDescription.content;
      if (addHistory) history.pushState({daUniverse:true}, '', url.href);
      window.scrollTo({top:0,behavior:'instant'});
      renderSoundState();
      detectLatestPublicApk();
    } catch (error) {
      if (error.name !== 'AbortError') location.assign(url.href);
    } finally {
      if (pendingNavigation === controller) pendingNavigation = null;
    }
  }
  history.scrollRestoration = 'manual';
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-audio-toggle]');
    if (button) {
      event.preventDefault();
      if (playing) stopSound();
      else requestSound();
      return;
    }
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.altKey || event.shiftKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin ||
        !url.pathname.startsWith(siteRoot.pathname) ||
        !(url.pathname.endsWith('.html') || url.pathname === siteRoot.pathname)) return;
    if (url.href === location.href) return;
    event.preventDefault();
    loadPage(url, true);
  });
  window.addEventListener('popstate', () => { loadPage(location.href, false); });
})();
