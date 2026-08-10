# The Desk — Setup Guide

A hand-curated news feed. Nothing appears in it unless you put it there.

Five tabs, four moving parts:
- **Articles** (Daily Bulletin + Your Feed) — fully manual, driven by a Google Sheet.
- **Live News** — auto-pulled, from YouTube channels you curate once.
- **Videos** — individually curated videos, manual, like Articles.
- **One-tap sharing** — share an article *or* a video straight into the right sheet from your phone's share menu — the app tells them apart automatically by the link.

No Instagram yet (parked for later, as discussed).

---

## 1. Set up the Articles sheet

1. Create a new Google Sheet.
2. Rename the first tab **Articles**.
3. Copy in these exact column headers (row 1), or open `articles-template.csv` in this folder and import it as this tab (**File → Import → Upload → Replace current sheet**):

   `Article Link | Headline | Journalist | Outlet | Category | Language | Date Added | Tab`

4. Fill in one row per article:
   - **Article Link** — the URL.
   - **Headline** — your own words are fine; doesn't have to match the original exactly.
   - **Journalist**, **Outlet**, **Category** — free text, whatever taxonomy you want.
   - **Language** — `English` or `Marathi` (the app matches on the first two letters, so `en`/`mr` also work).
   - **Date Added** — `2026-07-29` (YYYY-MM-DD) or `29-07-2026` (DD-MM-YYYY) both sort correctly. Avoid `MM-DD-YYYY` — that ordering isn't supported and will parse wrong.
   - **Tab** — write `Bulletin` for anything that should also appear in the Daily Bulletin. Leave blank for everything else; it will still show in Your Feed.
5. Delete the sample row once you've added your own.
6. **File → Share → Publish to web.**
   - In the dropdown, select the **Articles** sheet specifically (not "Entire document").
   - Format: **CSV**.
   - Click Publish, copy the link.
7. Paste that link into `articlesCsvUrl` near the top of `config.js`.

## 2. Set up the YouTube Channels sheet

1. In the same Google Sheet, add a second tab named **Channels**.
2. Columns: `Channel Name | Channel ID | Category | Language` — or import `channels-template.csv` into this tab.
3. To find a **Channel ID**: open the channel on YouTube → About tab → Share → Copy channel ID. (It looks like `UCxxxxxxxxxxxxxxxxxxxxxx`, not the `@handle` — the RSS feed needs the ID form.)
4. Publish this tab to the web the same way (step 6 above), choosing the **Channels** sheet this time.
5. Paste that link into `channelsCsvUrl` in `config.js`.

You only touch this sheet when you want to add or remove a trusted channel — new videos from existing channels show up automatically.

## 3. Set up the Videos sheet

This is for individually curated videos — one you spot and want in the app without adding its whole channel. It gets its own **Videos** tab, kept separate from the auto-pulled Live News feed.

1. In the same Google Sheet, add a third tab named **Videos**.
2. Columns: `Video Link | Title | Channel Name | Category | Language | Date Added` — or import `videos-template.csv` into this tab.
3. Publish this tab to the web the same way as before, choosing the **Videos** sheet this time.
4. Paste that link into `videosCsvUrl` in `config.js`.

Thumbnails are pulled automatically for YouTube links — no need to find or paste one yourself. These show in their own **Videos** tab — Live News stays exclusively the auto-pulled channel feed.

## 4. Rename the app (optional)

The default name is "The Desk." To change it, edit the `appName` entry near the top of `app.js`:

```js
appName: { en: "THE DESK", mr: "डेस्क" },
```

## 5. Host it

The app is a static site (`index.html`, `share-target.html`, `config.js`, `app.js`, `share.js`, `manifest.json`, `sw.js`, icons) — any static host works. Two easy free options:

- **GitHub Pages** — push this folder to a repo, enable Pages in repo settings, done.
- **Netlify Drop** — go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag this folder in. You get a live URL immediately.

Once it's hosted on `https://…`, open the link on your Android phone in Chrome, tap the menu → **Add to Home screen** (or you'll see an automatic install prompt). It'll behave like a real app: its own icon, no browser bar.

> Opening `index.html` directly from a folder on your computer will *not* support the install-to-home-screen step — that only works once it's served over `https://`.

## 6. Turn on one-tap sharing

This is what lets you (or your four curators) read an article or watch a video, hit the phone's **Share** button, tap **The Desk**, tap a category, and send — no sheet, no typing a URL.

**a) Create the receiver script**
1. Open your Google Sheet → **Extensions → Apps Script**.
2. Delete the placeholder code and paste in the contents of `apps-script.js` from this folder.
3. Click **Deploy → New deployment**.
4. Next to "Select type," choose **Web app**.
5. Set **Execute as: Me**, **Who has access: Anyone**.
6. Click **Deploy**, authorize it with your Google account when prompted.
7. Copy the **Web app URL** it gives you.

**b) Connect it to the app**
1. Paste that URL into `appsScriptUrl` in `config.js`.
2. Re-host the updated files (repeat whatever hosting step you used in section 5).
3. On your phone, remove The Desk from your home screen and reinstall it once (Android needs to notice the app can now receive shares — it won't pick this up automatically on an existing install).

**c) Use it**
Read an article or open a video → tap **Share** → tap **The Desk**. The page opens with **Article** or **Video** pre-selected based on the link (YouTube links default to Video — tap the other chip if it guessed wrong) → the relevant fields are pre-filled → tap a category chip → tap **Add to feed**. Articles land in Your Feed (and the Bulletin if you toggle it); videos land in the Videos tab. Both are auto-published for now — no review step, though you can add an approval gate later if you want one.

To give this to your four curators: host the app once, share the install link with them, and each of them repeats steps (c) after installing. They'll all be writing into the same sheets.

**Customizing the category chips** — edit the `categories` array in `config.js`.

**Heads up:** the Web Share Target feature this relies on is an Android/Chrome thing. It won't work the same way for anyone on iPhone — they'd need to add rows to the sheet directly instead for now.

## Known limitations, honestly

- **YouTube feeds go through a public relay** (`allorigins.win`) because YouTube doesn't allow browsers to read its feeds directly. It's reliable most of the time but isn't guaranteed uptime — if Live News looks empty, try refreshing in a minute. If this bothers you long-term, this is the one piece worth eventually replacing with your own small backend.
- **"Live News" shows latest uploads, not strictly live streams** — YouTube's public feed doesn't cleanly distinguish "streaming right now" from "just posted." It reflects channel activity, not a live-broadcast detector.
- **New sheet edits can still take a little while to show up.** The app now adds a cache-busting parameter to every sheet request, which bypasses the browser's own cache — but Google also caches the published CSV on its own servers for a short time, independent of anything the app does. If a new "Bulletin" row isn't appearing, this is almost always why; it should catch up within a few minutes.
- **The Tab column has to read exactly "Bulletin"** (case doesn't matter, but check for stray spaces or typos) for a row to show up in the Daily Bulletin — everything else still shows in Your Feed regardless.
- **The Apps Script needs a "Videos" tab to exist** once you're using video sharing, exactly like it needs "Articles" — if you skip section 3, sharing a video will silently fail (same `no-cors` visibility limit as below).
- **Automatic thumbnails only work for YouTube links** (youtube.com / youtu.be / m.youtube.com) — a shared video from anywhere else will show a placeholder image.
- **The share flow can't confirm success from the server** — it sends the submission in a way that avoids a browser cross-origin restriction (`no-cors`), which means it can't read back whether Apps Script actually wrote the row. In practice it's reliable; if you want certainty, check Your Feed after a submission.
- Nothing is stored by the app itself — it reads your sheets fresh on every visit.

## What's next (not built yet)

- Categories tab (phase 2) — the Category column is already being collected, so this is mostly UI work once you're ready.
- Instagram posts/reels — parked per our discussion; oEmbed-based manual entry is the planned approach.
- An approval step before shared submissions go live, if you decide you want one.
