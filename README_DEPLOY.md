# DA UNIVERSE — THE ASHEN ATLAS (website)

A ready-to-publish, no-dependencies multilingual static website.

## What works
- Ukrainian is the default language at `/`.
- English has its own crawlable pages (`/en/`). Ukrainian is also available at `/uk/`.
- All menu links, language switches, Privacy Policy, Terms and About pages work.
- "Enter Thedas" goes to a real information / download page, not a dead button.
- The Download / Update APK button uses the supplied Google Drive file link; the releases folder is a visible alternative. Public access must be checked separately.
- No third-party fonts, trackers, cookies, or hosting frameworks required.

## Quick preview
Double-click `index.html` in any browser. It works offline.

## Free hosting (GitHub Pages)
1. For the simplest Google Search Console verification flow, create a **public** GitHub repository named `USERNAME.github.io` where USERNAME is your actual GitHub account name. (This is free, but Google approval cannot be guaranteed.)
2. Upload the *contents* of this folder to that repository root (NOT the outer ZIP file).
3. In repository `Settings → Pages`, select `Deploy from a branch`, branch `main`, folder `/(root)`, save.
4. The website can become available at `https://USERNAME.github.io/`.
5. In Google Search Console, add **URL-prefix** `https://USERNAME.github.io/` and try the HTML file or HTML meta verification method. Upload Google's own generated verification file into repository root, then verify. This proves control of the URL-prefix only; Google's OAuth brand review may still require other evidence of domain control.
6. If allowed in Google Auth Platform → Branding, set the matching homepage `https://USERNAME.github.io/`, privacy policy `https://USERNAME.github.io/privacy.html`, and terms `https://USERNAME.github.io/terms.html`. Register the appropriate `Authorized domains`.
7. **Google may still insist on a domain you own and can independently verify**. A free shared-hosting subdomain is *not guaranteed* to pass OAuth verification. Do not invent or paste website URLs until they are publicly live. If rejected, a custom owned domain may be necessary.

## Downloads and updates (Google Drive)
- The website uses the **existing shared APK file URL** `https://drive.google.com/file/d/1nyrXwN7q8yQznjTr6ZF9wbiarQT8nzCb/view` as primary Download / Update link.
- It also exposes the **public builds folder** `https://drive.google.com/drive/folders/1aBBBQ98PW-Z27yMna14Dv4Wbig6ooo4u`.
- **Preferred zero-maintenance update method**: Google Drive → select the SAME uploaded APK file → More / File information → **Manage versions → Upload new version**. This replaces the contents while keeping the same Drive file ID and website URL. It does not matter if the local filename stays the same; a new separate upload always creates a different ID.
- When the user separately uploads a new APK with the same filename, the folder link still works but the static file link continues pointing to the earlier file. To automatically resolve the newest separate APK, the site includes an **optional Google Drive API browser-key mode** in `assets/site.js`: set `driveApiKey` to a properly **HTTP-referrer restricted + Drive API restricted** Google Cloud API key after enabling Google Drive API and public folder access. The site then lists the public folder and selects the latest modified `.apk`; if this fails, the original link remains as a fallback. Without the key, the site DOES NOT automatically discover separate new uploads. See official Google public-folder API documentation.
- The download opens Google Drive UI; Google may require an extra confirmation for large or unfamiliar APKs.
- **Version naming**: the Android Studio source is not a built APK. Rebuild and replace the shared APK after testing; do not assume the current public link already serves the latest version.
- To preserve an Android user's installed data when updating, keep the application ID and signing key unchanged, increment `versionCode`, and install the new APK over the old version. Avoid deleting or clearing app data.

## Original website music
- Three user-provided original tracks are included and play in sequence.
- An accessible music ON/OFF control appears in the header in both supported languages on every page. Playback is user-initiated because browsers normally restrict autoplay. Background pages may require a fresh tap after navigation.
- The site does not transmit the player's game-save data or manage their Google Sign-In.

## Attribution
- **Created by Gregorth Vain** is shown as a consistent, untranslated credit on all language pages beneath the original fan-work description and in the footer. The corresponding app home screen has the same English credit. The attribution does not imply endorsement by EA or BioWare.

## Google privacy and publication notes
The Privacy Policy is based on the 1.8.7 Android source as of 2026-11-14: Google user info for the identity, Google Drive `drive.appdata` for the hidden `da_universe_saves_v1.json` file, local per-profile saved characters. Review/update if the app changes and review with a legal professional if you intend wide distribution.
Publishing this website **does not automatically switch OAuth to `In production` or guarantee that Google will approve the application**. Production OAuth, branding and domain verification are separate steps.

## Project disclaimer
Non-commercial, independent fan work; not endorsed by EA / BioWare.

## Crimson leather edition — 2026-11-25
- Deploy to the existing repository `dauniversebook/DA_UNIVERSE` on its configured Pages branch.
- Delete the obsolete language directory from the live repository when deploying; uploading the new files alone will not remove obsolete files on the server.
- Preserve any repository-specific Google verification files not present in this archive.
- Includes the approved leather background, original game frame/divider textures, lute, illuminated initials and bundled original soundtrack.
- Public download and Drive folder links are unchanged.

## Search indexing
- Add the URL-prefix property https://dauniversebook.github.io/DA_UNIVERSE/ in Google Search Console.
- Verify ownership and submit `sitemap.xml`. Request indexing of the home page and download page after deployment.
- Sitemap lists ten canonical URLs, with Ukrainian/English alternates; `/uk/` duplicates point to the Ukrainian canonical root pages.
- Project-level robots.txt is included; host-root robots.txt is controlled by the GitHub Pages host.
- Rankings are not guaranteed. Do not use keyword stuffing or hidden search terms.
