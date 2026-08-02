/* ==================================================================
   THE DESK — SHARED CONFIG
   Edit the values below to point the app at your own sheets, your
   channel list, and (optionally) your one-tap sharing endpoint.
   Both index.html and share-target.html load this file first.
   ================================================================== */
const CONFIG = {
  // Published-to-web CSV link for your ARTICLES sheet.
  // Google Sheet → File → Share → Publish to web → select the
  // "Articles" tab specifically → format: CSV → copy the URL here.
  articlesCsvUrl: "",

  // Published-to-web CSV link for your YOUTUBE CHANNELS sheet
  // (same steps, but select the "Channels" tab).
  channelsCsvUrl: "",

  // Used only to read YouTube's public per-channel RSS feeds from
  // the browser (YouTube does not allow direct cross-origin reads).
  // This is a third-party relay with no uptime guarantee — swap it
  // for your own proxy later if you want something more reliable.
  corsProxyForYouTube: "https://api.allorigins.win/raw?url=",

  // How many recent videos to pull per channel.
  videosPerChannel: 4,

  // Total videos shown in the Live News tab after merging channels.
  maxLiveVideos: 40,

  // The Web App URL from your Apps Script deployment (see README,
  // section 5) — this is what lets the Share page add a row to your
  // Articles sheet directly. Leave blank to keep sharing disabled.
  appsScriptUrl: "",

  // Category chips shown on the Share page. Edit freely — these are
  // just quick-tap suggestions, not a fixed taxonomy.
  categories: ["Politics", "Business", "World", "Local", "Sports", "Tech", "Opinion", "Other"],

  // Which language chip is pre-selected on the Share page.
  defaultLanguage: "English",
};
