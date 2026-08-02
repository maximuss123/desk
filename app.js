/* CONFIG now lives in config.js, loaded before this file. */

/* ==================================================================
   I18N STRINGS
   ================================================================== */
const STR = {
  appName:            { en: "THE DESK", mr: "डेस्क" },
  tabBulletin:         { en: "Daily Bulletin", mr: "दैनिक बुलेटिन" },
  tabFeed:             { en: "Your Feed", mr: "तुमचा फीड" },
  tabLive:             { en: "Live News", mr: "लाइव्ह न्यूज" },
  tabCategories:       { en: "Categories", mr: "विभाग" },
  soon:                { en: "Soon", mr: "लवकरच" },
  bulletinSub:         { en: "Today's hand-picked stories.", mr: "आजच्या निवडक बातम्या." },
  feedSub:             { en: "Everything added, newest first.", mr: "जोडलेले सर्व, नवीनतम आधी." },
  liveSub:             { en: "Latest uploads from your curated news channels.", mr: "तुमच्या निवडक न्यूज चॅनेल्सवरील नवीनतम व्हिडिओ." },
  footerNote:          { en: "Curated by hand. Every link chosen on purpose.", mr: "हाताने निवडलेले. प्रत्येक लिंक जाणीवपूर्वक निवडलेली." },
  loadingArticles:     { en: "Fetching the latest curated links…", mr: "नवीनतम निवडक लिंक्स आणत आहे…" },
  loadingVideos:       { en: "Checking your news channels…", mr: "तुमचे न्यूज चॅनेल्स तपासत आहे…" },
  emptyArticlesTitle:  { en: "Nothing here yet", mr: "इथे अजून काही नाही" },
  emptyArticlesBody:   { en: "No sheet is connected. Paste your published Google Sheet link into articlesCsvUrl at the top of app.js.", mr: "कोणतीही शीट जोडलेली नाही. app.js च्या सुरुवातीला articlesCsvUrl मध्ये तुमच्या प्रकाशित Google Sheet ची लिंक टाका." },
  emptyBulletinTitle:  { en: "No picks for today", mr: "आजसाठी कोणतीही निवड नाही" },
  emptyBulletinBody:   { en: "Tag a row's Tab column as \"Bulletin\" in your sheet to feature it here.", mr: "इथे दाखवण्यासाठी तुमच्या शीटमध्ये एका ओळीच्या Tab स्तंभात \"Bulletin\" असे लिहा." },
  emptyVideosTitle:    { en: "No channels yet", mr: "अजून चॅनेल्स नाहीत" },
  emptyVideosBody:     { en: "No channel sheet is connected. Paste your published sheet link into channelsCsvUrl at the top of app.js.", mr: "कोणतीही चॅनेल शीट जोडलेली नाही. app.js मध्ये channelsCsvUrl मध्ये तुमच्या शीटची लिंक टाका." },
  errorArticlesTitle:  { en: "Couldn't load your articles", mr: "तुमचे लेख लोड करता आले नाहीत" },
  errorArticlesBody:   { en: "Check that the sheet is published to the web as CSV, and that the link in articlesCsvUrl is correct.", mr: "शीट CSV म्हणून वेबवर प्रकाशित आहे का आणि articlesCsvUrl मधील लिंक बरोबर आहे का ते तपासा." },
  errorVideosTitle:    { en: "Couldn't load some channels", mr: "काही चॅनेल्स लोड करता आले नाहीत" },
  errorVideosBody:     { en: "This can happen if the relay service is briefly down. Try again in a moment.", mr: "रिले सेवा तात्पुरती बंद असल्यास असे होऊ शकते. थोड्या वेळाने पुन्हा प्रयत्न करा." },
  categoriesSoonTitle: { en: "Categories are coming next", mr: "विभाग लवकरच येत आहेत" },
  categoriesSoonBody:  { en: "Once your feed has enough curated stories, this tab will let you browse by beat.", mr: "तुमच्या फीडमध्ये पुरेशा निवडक बातम्या झाल्यावर, या टॅबमध्ये तुम्ही विषयानुसार बातम्या पाहू शकाल." },
  editionLabel:        { en: "Personal Edition", mr: "वैयक्तिक आवृत्ती" },
};

function t(key, lang) {
  return (STR[key] && STR[key][lang]) || (STR[key] && STR[key].en) || key;
}

/* ==================================================================
   STATE
   ================================================================== */
const state = {
  lang: "en",
  tab: "bulletin", // bulletin | feed | live | categories
  articles: null,      // parsed rows, or null before first fetch
  articlesError: false,
  videos: null,
  videosError: false,
};

const TABS = [
  { id: "bulletin",   labelKey: "tabBulletin" },
  { id: "feed",        labelKey: "tabFeed" },
  { id: "live",        labelKey: "tabLive" },
  { id: "categories",  labelKey: "tabCategories", disabled: true },
];

/* ==================================================================
   HELPERS
   ================================================================== */
function normalizeKey(k) {
  return String(k || "").trim().toLowerCase().replace(/\s+/g, "");
}

function normalizeLangValue(v) {
  const s = String(v || "").trim().toLowerCase();
  if (s.startsWith("mr") || s.includes("marath")) return "mr";
  return "en";
}

function remapRow(row, keyMap) {
  const out = {};
  Object.keys(row).forEach((rawKey) => {
    const norm = normalizeKey(rawKey);
    if (keyMap[norm]) out[keyMap[norm]] = (row[rawKey] || "").toString().trim();
  });
  return out;
}

const ARTICLE_KEYMAP = {
  articlelink: "link",
  headline: "headline",
  journalist: "journalist",
  outlet: "outlet",
  category: "category",
  language: "language",
  dateadded: "dateAdded",
  tab: "tab",
};

const CHANNEL_KEYMAP = {
  channelname: "name",
  channelid: "channelId",
  category: "category",
  language: "language",
};

function parseSheetDate(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  const timeRe = "(?:[ T](\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?";

  // ISO-style, year leads: YYYY-MM-DD, optionally with a time (unambiguous — always Y/M/D).
  let m = s.match(new RegExp("^(\\d{4})-(\\d{1,2})-(\\d{1,2})" + timeRe));
  if (m) {
    const d = new Date(
      Number(m[1]), Number(m[2]) - 1, Number(m[3]),
      Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)
    );
    if (!isNaN(d.getTime())) return d;
  }

  // Day-first style, year trails: DD-MM-YYYY or DD/MM/YYYY, optionally with a time
  // (this is what the share flow writes, e.g. "02/08/2026 15:01:33").
  m = s.match(new RegExp("^(\\d{1,2})[-/](\\d{1,2})[-/](\\d{4})" + timeRe + "$"));
  if (m) {
    const day = Number(m[1]), month = Number(m[2]), year = Number(m[3]);
    const d = new Date(
      year, month - 1, day,
      Number(m[4] || 0), Number(m[5] || 0), Number(m[6] || 0)
    );
    if (!isNaN(d.getTime())) return d;
  }

  // Anything else: let the browser take its best guess.
  const fallback = new Date(s);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function relativeTime(dateLike, lang) {
  const d = parseSheetDate(dateLike);
  if (!d) return String(dateLike || "");
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);

  if (mins < 1) return lang === "mr" ? "आत्ताच" : "just now";
  if (hrs < 1) return lang === "mr" ? `${mins} मि. पूर्वी` : `${mins}m ago`;
  if (days < 1) return lang === "mr" ? `${hrs} तास पूर्वी` : `${hrs}h ago`;
  if (days < 7) return lang === "mr" ? `${days} दिवस पूर्वी` : `${days}d ago`;

  try {
    return new Intl.DateTimeFormat(lang === "mr" ? "mr-IN" : "en-IN", {
      day: "numeric", month: "short",
    }).format(d);
  } catch (e) {
    return d.toDateString();
  }
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* ==================================================================
   DATA FETCHING
   ================================================================== */
function fetchCsv(url, keyMap) {
  const bustUrl = url + (url.indexOf("?") === -1 ? "?" : "&") + "_=" + Date.now();
  return fetch(bustUrl, { cache: "no-store" })
    .then((res) => {
      if (!res.ok) throw new Error("Sheet fetch failed: " + res.status);
      return res.text();
    })
    .then((text) => {
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
      return parsed.data
        .map((row) => remapRow(row, keyMap))
        .filter((row) => Object.values(row).some((v) => v));
    });
}

function loadArticles() {
  if (!CONFIG.articlesCsvUrl) {
    state.articles = [];
    render();
    return;
  }
  fetchCsv(CONFIG.articlesCsvUrl, ARTICLE_KEYMAP)
    .then((rows) => {
      state.articles = rows;
      state.articlesError = false;
      render();
    })
    .catch(() => {
      state.articles = [];
      state.articlesError = true;
      render();
    });
}

function parseYoutubeFeed(xmlText, channelMeta) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const entries = Array.from(doc.getElementsByTagName("entry")).slice(0, CONFIG.videosPerChannel);
  return entries.map((entry) => {
    const title = entry.getElementsByTagName("title")[0]?.textContent || "";
    const published = entry.getElementsByTagName("published")[0]?.textContent || "";
    const linkEl = entry.getElementsByTagName("link")[0];
    const link = linkEl ? linkEl.getAttribute("href") : "#";
    const thumbEl = entry.getElementsByTagName("media:thumbnail")[0];
    const thumb = thumbEl ? thumbEl.getAttribute("url") : "";
    return {
      title,
      link,
      published,
      thumb,
      channelName: channelMeta.name,
      category: channelMeta.category,
      language: channelMeta.language,
    };
  });
}

function loadVideos() {
  if (!CONFIG.channelsCsvUrl) {
    state.videos = [];
    render();
    return;
  }
  fetchCsv(CONFIG.channelsCsvUrl, CHANNEL_KEYMAP)
    .then((channels) => {
      const withIds = channels.filter((c) => c.channelId);
      if (withIds.length === 0) {
        state.videos = [];
        render();
        return;
      }
      const requests = withIds.map((ch) => {
        const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(ch.channelId)}`;
        const proxied = CONFIG.corsProxyForYouTube + encodeURIComponent(feedUrl);
        return fetch(proxied)
          .then((res) => {
            if (!res.ok) throw new Error("Channel fetch failed");
            return res.text();
          })
          .then((xml) => parseYoutubeFeed(xml, ch))
          .catch(() => ({ __failed: true }));
      });

      Promise.all(requests).then((results) => {
        let anyFailed = false;
        let merged = [];
        results.forEach((r) => {
          if (r && r.__failed) { anyFailed = true; return; }
          merged = merged.concat(r);
        });
        merged.sort((a, b) => new Date(b.published) - new Date(a.published));
        state.videos = merged.slice(0, CONFIG.maxLiveVideos);
        state.videosError = anyFailed && merged.length === 0;
        render();
      });
    })
    .catch(() => {
      state.videos = [];
      state.videosError = true;
      render();
    });
}

/* ==================================================================
   RENDERING
   ================================================================== */
function langFilter(rows) {
  return rows.filter((r) => normalizeLangValue(r.language) === state.lang);
}

function renderStateBlock({ title, body, loading }) {
  return `
    <div class="state-block">
      ${loading ? '<div class="spinner"></div>' : ""}
      <p class="state-title">${escapeHtml(title)}</p>
      <p>${escapeHtml(body)}</p>
    </div>`;
}

function articleRowHtml(a) {
  const isBulletin = String(a.tab || "").trim().toLowerCase() === "bulletin";
  return `
    <a class="article-row" href="${escapeHtml(a.link)}" target="_blank" rel="noopener noreferrer">
      <div class="article-meta-row">
        ${a.category ? `<span class="tag${isBulletin ? " breaking" : ""}">${escapeHtml(a.category)}</span>` : ""}
        <span class="meta-date">${escapeHtml(relativeTime(a.dateAdded, state.lang))}</span>
      </div>
      <h2 class="headline">${escapeHtml(a.headline || a.link)}</h2>
      <div class="byline">
        ${a.journalist ? escapeHtml(a.journalist) + " · " : ""}<span class="outlet">${escapeHtml(a.outlet || "")}</span>
      </div>
    </a>`;
}

function videoRowHtml(v) {
  const placeholder = "https://placehold.co/320x180/D7DCE3/4A5261?text=%20";
  return `
    <a class="video-row" href="${escapeHtml(v.link)}" target="_blank" rel="noopener noreferrer">
      <img class="video-thumb" loading="lazy" src="${escapeHtml(v.thumb || placeholder)}" alt="" />
      <div class="video-info">
        <div class="video-channel">${escapeHtml(v.channelName)}</div>
        <h3 class="video-title">${escapeHtml(v.title)}</h3>
        <div class="video-time">${escapeHtml(relativeTime(v.published, state.lang))}</div>
      </div>
    </a>`;
}

function renderBulletin() {
  if (state.articles === null) {
    return renderStateBlock({ title: t("loadingArticles", state.lang), body: "", loading: true });
  }
  if (state.articlesError) {
    return renderStateBlock({ title: t("errorArticlesTitle", state.lang), body: t("errorArticlesBody", state.lang) });
  }
  const rows = langFilter(state.articles).filter(
    (a) => String(a.tab || "").trim().toLowerCase() === "bulletin"
  );
  const header = `
    <p class="section-label">${escapeHtml(t("tabBulletin", state.lang))}</p>
    <p class="section-sub">${escapeHtml(t("bulletinSub", state.lang))}</p>`;
  if (rows.length === 0) {
    return header + renderStateBlock({ title: t("emptyBulletinTitle", state.lang), body: t("emptyBulletinBody", state.lang) });
  }
  return header + `<div class="article-list">${rows.map(articleRowHtml).join("")}</div>`;
}

function renderFeed() {
  if (state.articles === null) {
    return renderStateBlock({ title: t("loadingArticles", state.lang), body: "", loading: true });
  }
  if (state.articlesError) {
    return renderStateBlock({ title: t("errorArticlesTitle", state.lang), body: t("errorArticlesBody", state.lang) });
  }
  const rows = langFilter(state.articles).slice().sort(
    (a, b) => (parseSheetDate(b.dateAdded)?.getTime() || 0) - (parseSheetDate(a.dateAdded)?.getTime() || 0)
  );
  const header = `
    <p class="section-label">${escapeHtml(t("tabFeed", state.lang))}</p>
    <p class="section-sub">${escapeHtml(t("feedSub", state.lang))}</p>`;
  if (rows.length === 0) {
    return header + renderStateBlock({ title: t("emptyArticlesTitle", state.lang), body: t("emptyArticlesBody", state.lang) });
  }
  return header + `<div class="article-list">${rows.map(articleRowHtml).join("")}</div>`;
}

function renderLive() {
  if (state.videos === null) {
    return renderStateBlock({ title: t("loadingVideos", state.lang), body: "", loading: true });
  }
  const rows = langFilter(state.videos);
  const header = `
    <p class="section-label">${escapeHtml(t("tabLive", state.lang))}</p>
    <p class="section-sub">${escapeHtml(t("liveSub", state.lang))}</p>`;
  if (rows.length === 0 && state.videosError) {
    return header + renderStateBlock({ title: t("errorVideosTitle", state.lang), body: t("errorVideosBody", state.lang) });
  }
  if (rows.length === 0) {
    return header + renderStateBlock({ title: t("emptyVideosTitle", state.lang), body: t("emptyVideosBody", state.lang) });
  }
  return header + `<div class="video-list">${rows.map(videoRowHtml).join("")}</div>`;
}

function renderCategories() {
  return `
    <p class="section-label">${escapeHtml(t("tabCategories", state.lang))}</p>
    <div class="categories-soon">
      <p class="state-title" style="margin-bottom:8px;">${escapeHtml(t("categoriesSoonTitle", state.lang))}</p>
      <p>${escapeHtml(t("categoriesSoonBody", state.lang))}</p>
    </div>`;
}

function renderTabs() {
  const tabsEl = document.getElementById("tabs");
  tabsEl.innerHTML = TABS.map((tabDef) => {
    const active = state.tab === tabDef.id;
    const liveDot = tabDef.id === "live" ? '<span class="live-dot"></span>' : "";
    const soon = tabDef.disabled ? `<span class="soon">${escapeHtml(t("soon", state.lang))}</span>` : "";
    return `<button class="tab-btn${active ? " active" : ""}" data-tab="${tabDef.id}"
              role="tab" aria-selected="${active}" ${tabDef.disabled ? "disabled" : ""}>
              ${liveDot}${escapeHtml(t(tabDef.labelKey, state.lang))}${soon}
            </button>`;
  }).join("");

  tabsEl.querySelectorAll(".tab-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.tab = btn.getAttribute("data-tab");
      render();
    });
  });
}

function renderDateline() {
  const el = document.getElementById("dateline");
  const now = new Date();
  const dateStr = new Intl.DateTimeFormat(state.lang === "mr" ? "mr-IN" : "en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  }).format(now);
  el.innerHTML = `<span>${escapeHtml(dateStr)}</span><span>${escapeHtml(t("editionLabel", state.lang))}</span>`;
}

function render() {
  document.documentElement.lang = state.lang;
  document.querySelector(".masthead-name").innerHTML =
    `${escapeHtml(t("appName", state.lang))}<span class="mark">.</span>`;
  document.querySelector('[data-i18n="footerNote"]').textContent = t("footerNote", state.lang);

  renderDateline();
  renderTabs();

  const content = document.getElementById("content");
  if (state.tab === "bulletin") content.innerHTML = renderBulletin();
  else if (state.tab === "feed") content.innerHTML = renderFeed();
  else if (state.tab === "live") content.innerHTML = renderLive();
  else content.innerHTML = renderCategories();
}

/* ==================================================================
   INIT
   ================================================================== */
document.getElementById("langSelect").addEventListener("change", (e) => {
  state.lang = e.target.value;
  render();
});

render();
loadArticles();
loadVideos();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
