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

// Keep a single audio element alive across every internal page and language switch.
(() => {
 const audio=document.getElementById('da-theme-audio');
 const script=document.querySelector('script[src*="site.js"]');
 if(!audio||!script)return;
 const root=new URL('../',script.src), assetRoot=new URL('assets/',root);
 const parts={"2":["audio/theme-2-00.bin","audio/theme-2-01.bin","audio/theme-2-02.bin","audio/theme-2-03.bin","audio/theme-2-04.bin","audio/theme-2-05.bin","audio/theme-2-06.bin","audio/theme-2-07.bin","audio/theme-2-08.bin"],"3":["audio/theme-3-00.bin","audio/theme-3-01.bin","audio/theme-3-02.bin","audio/theme-3-03.bin","audio/theme-3-04.bin","audio/theme-3-05.bin","audio/theme-3-06.bin","audio/theme-3-07.bin","audio/theme-3-08.bin"]}; const tracks=[new URL('da-universe-theme.mp3',assetRoot).href,null,null];
 async function getTrack(i){if(tracks[i])return tracks[i];const files=parts[String(i+1)];const buffers=await Promise.all(files.map(async p=>{const r=await fetch(new URL(p,assetRoot));if(!r.ok)throw Error('Audio part unavailable');return r.arrayBuffer();}));return tracks[i]=URL.createObjectURL(new Blob(buffers,{type:'audio/mpeg'}));}
 let wanted=true,playing=false,idx=0,seq=0,pending=null;
 const toggle=()=>document.querySelector('[data-audio-toggle]');
 function reflect(){const b=toggle();if(!b)return;const l=b.querySelector('[data-audio-state]');b.setAttribute('aria-pressed',String(playing));b.classList.toggle('audio-toggle--on',playing);if(l)l.textContent=playing?b.dataset.textOn:b.dataset.textOff;}
 audio.volume=.5;audio.loop=false;audio.src=tracks[0];
 async function start(){if(!wanted||playing||changing)return;const attempt=++seq;try{await audio.play();if(attempt!==seq||!wanted){if(!wanted)audio.pause();return;}playing=true;getTrack((idx+1)%tracks.length).catch(()=>{});}catch(_){if(attempt===seq)playing=false;}reflect();}
 function stop(){wanted=false;++seq;audio.pause();playing=false;reflect();}
 let changing=false; audio.addEventListener('ended',async()=>{playing=false;changing=true;idx=(idx+1)%tracks.length;try{audio.src=await getTrack(idx);changing=false;if(wanted)start();}catch(_){changing=false;reflect();}});
 audio.addEventListener('error',()=>{playing=false;reflect();});
 document.addEventListener('pointerdown',e=>{if(!e.target.closest('[data-audio-toggle]')&&wanted&&!playing)start();},{capture:true});
 document.addEventListener('keydown',e=>{if(!e.target.closest('[data-audio-toggle]')&&wanted&&!playing)start();},{capture:true});
 function prepareCaps(scope=document){scope.querySelectorAll('.dropcap img').forEach(img=>{const cap=img.closest('.dropcap');const show=()=>{if(img.naturalWidth>0)cap.classList.add('cap-ready');};if(img.complete)show();else img.addEventListener('load',show,{once:true});img.addEventListener('error',()=>cap.classList.remove('cap-ready'),{once:true});});}
 prepareCaps();
 reflect();start();
 // Only the page shell is swapped. The audio element never leaves the document.
 async function navigate(destination,addHistory){const url=new URL(destination,location.href);if(pending)pending.abort();const ctl=new AbortController();pending=ctl;try{
 const response=await fetch(url.href,{signal:ctl.signal});if(!response.ok)throw Error('Navigation failed');
 const doc=new DOMParser().parseFromString(await response.text(),'text/html'),next=doc.querySelector('.page-shell'),current=document.querySelector('.page-shell');if(!next||!current||ctl.signal.aborted)throw Error('Invalid page');
 if(addHistory)history.pushState({daUniverse:true},'',url.href);
 current.replaceWith(next);document.title=doc.title;document.documentElement.lang=doc.documentElement.lang;
 const sel='link[rel="canonical"],link[hreflang],meta[name="description"],meta[property^="og:"],meta[name^="twitter:"],script[type="application/ld+json"]';document.head.querySelectorAll(sel).forEach(e=>e.remove());doc.head.querySelectorAll(sel).forEach(e=>document.head.append(document.importNode(e,true)));
 prepareCaps(next);if(url.hash){let target;try{target=document.getElementById(decodeURIComponent(url.hash.slice(1)));}catch(_){}if(target)target.scrollIntoView({behavior:'instant',block:'start'});else window.scrollTo(0,0);}else window.scrollTo(0,0);reflect();detectLatestPublicApk();
 }catch(e){if(e.name!=='AbortError')location.assign(url.href);}finally{if(pending===ctl)pending=null;}}
 history.scrollRestoration='manual';
 document.addEventListener('click',e=>{const b=e.target.closest('[data-audio-toggle]');if(b){e.preventDefault();if(playing)stop();else{wanted=true;start();}return;}
 const l=e.target.closest('a[href]');if(!l||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.altKey||e.shiftKey||l.hasAttribute('download')||(l.target&&l.target!=='_self'))return;
 const u=new URL(l.href,location.href);if(u.origin!==location.origin||!u.pathname.startsWith(root.pathname)||!(u.pathname.endsWith('.html')||u.pathname===root.pathname||u.pathname===root.pathname+'en/'))return;
 if(u.href===location.href)return;e.preventDefault();navigate(u,true);});
 window.addEventListener('popstate',()=>navigate(location.href,false));
})();
