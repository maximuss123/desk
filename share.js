/* ==================================================================
   SHARE PAGE LOGIC
   Reads whatever the OS share sheet handed us (title/text/url),
   guesses whether it's an article or a video, pre-fills what it can,
   and lets the person tap a category + language before sending it
   into the right sheet via the Apps Script endpoint in
   CONFIG.appsScriptUrl.
   ================================================================== */

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function extractUrl(str) {
  const match = String(str || "").match(/https?:\/\/[^\s]+/);
  return match ? match[0] : "";
}

function outletFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return "";
  }
}

function isVideoUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be";
  } catch (e) {
    return false;
  }
}

function buildShareData() {
  const params = new URLSearchParams(window.location.search);
  const sharedTitle = (params.get("title") || "").trim();
  const sharedText = (params.get("text") || "").trim();
  const sharedUrl = (params.get("url") || "").trim();

  const link = sharedUrl || extractUrl(sharedText) || extractUrl(sharedTitle) || "";

  let title = sharedTitle;
  if (!title || title === link) {
    title = sharedText.split(link).join("").trim();
  }

  return { link, title, outlet: outletFromUrl(link), isVideo: isVideoUrl(link) };
}

const shareData = buildShareData();
const formState = {
  type: shareData.isVideo ? "video" : "article",
  category: "",
  language: (window.CONFIG && CONFIG.defaultLanguage) || "English",
  bulletin: false,
};

function chipGroupHtml(name, options, selected) {
  return `<div class="chip-group" data-group="${name}">` +
    options.map((opt) =>
      `<button type="button" class="chip${opt === selected ? " selected" : ""}" data-value="${escapeHtml(opt)}">${escapeHtml(opt)}</button>`
    ).join("") +
    `</div>`;
}

function renderMissingConfig(root) {
  root.innerHTML = `
    <div class="share-card">
      <div class="state-block" style="padding:10px;">
        <p class="state-title">Sharing isn't set up yet</p>
        <p>Add your Apps Script URL to <code>appsScriptUrl</code> in <code>config.js</code> to enable one-tap sharing — see the README, section 5.</p>
      </div>
      ${shareData.link ? `<div class="field"><span class="field-label">Link you shared</span><div class="field-link">${escapeHtml(shareData.link)}</div></div>` : ""}
    </div>`;
}

function renderNoLink(root) {
  root.innerHTML = `
    <div class="share-card">
      <div class="state-block" style="padding:10px;">
        <p class="state-title">No link found</p>
        <p>Open this page by sharing an article or video link into The Desk from your browser or another app.</p>
      </div>
    </div>`;
}

function articleFieldsHtml() {
  return `
    <div class="field">
      <span class="field-label">Headline</span>
      <input type="text" id="headlineInput" value="${escapeHtml(shareData.title)}" placeholder="Headline" />
    </div>
    <div class="field">
      <span class="field-label">Outlet</span>
      <input type="text" id="outletInput" value="${escapeHtml(shareData.outlet)}" placeholder="Outlet" />
    </div>
    <div class="field">
      <span class="field-label">Journalist (optional)</span>
      <input type="text" id="journalistInput" placeholder="Byline" />
    </div>
    <div class="field">
      <label class="toggle-row">
        <input type="checkbox" id="bulletinToggle" ${formState.bulletin ? "checked" : ""} />
        Feature in today's Bulletin
      </label>
    </div>`;
}

function videoFieldsHtml() {
  return `
    <div class="field">
      <span class="field-label">Title</span>
      <input type="text" id="titleInput" value="${escapeHtml(shareData.title)}" placeholder="Video title" />
    </div>
    <div class="field">
      <span class="field-label">Channel (optional)</span>
      <input type="text" id="channelInput" placeholder="Channel name" />
    </div>`;
}

function renderForm(root) {
  root.innerHTML = `
    <div class="share-card" id="shareCard">
      <div class="field">
        <span class="field-label">Type</span>
        ${chipGroupHtml("type", ["Article", "Video"], formState.type === "video" ? "Video" : "Article")}
      </div>
      <div class="field">
        <span class="field-label">Link</span>
        <div class="field-link">${escapeHtml(shareData.link)}</div>
      </div>
      <div id="typeFields"></div>
      <div class="field">
        <span class="field-label">Category</span>
        ${chipGroupHtml("category", CONFIG.categories, formState.category)}
      </div>
      <div class="field">
        <span class="field-label">Language</span>
        ${chipGroupHtml("language", ["English", "Marathi"], formState.language)}
      </div>
      <button class="submit-btn" id="submitBtn">Add to feed</button>
    </div>`;

  document.getElementById("typeFields").innerHTML =
    formState.type === "video" ? videoFieldsHtml() : articleFieldsHtml();
  wireDynamicFieldEvents();

  root.querySelectorAll(".chip-group").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      const groupName = group.getAttribute("data-group");
      const value = btn.getAttribute("data-value");

      group.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");

      if (groupName === "type") {
        formState.type = value.toLowerCase();
        document.getElementById("typeFields").innerHTML =
          formState.type === "video" ? videoFieldsHtml() : articleFieldsHtml();
        wireDynamicFieldEvents();
      } else {
        formState[groupName] = value;
      }
    });
  });

  document.getElementById("submitBtn").addEventListener("click", submit);
}

function wireDynamicFieldEvents() {
  const bulletinToggle = document.getElementById("bulletinToggle");
  if (bulletinToggle) {
    bulletinToggle.addEventListener("change", (e) => {
      formState.bulletin = e.target.checked;
    });
  }
}

function renderSuccess(root) {
  const isVideo = formState.type === "video";
  root.innerHTML = `
    <div class="share-card success-block">
      <div class="success-mark">✓</div>
      <p class="state-title">Added to your feed</p>
      <p>${isVideo
        ? "It'll show up in the Videos tab"
        : "It'll show up in Your Feed" + (formState.bulletin ? " and today's Bulletin" : "")
      } — the sheet can take a minute to catch up.</p>
    </div>`;
}

function renderError(root) {
  root.innerHTML = `
    <div class="share-card">
      <div class="state-block" style="padding:10px;">
        <p class="state-title">Couldn't send that</p>
        <p>Check your connection and try again — or add the row directly in the sheet this once.</p>
      </div>
    </div>`;
}

function submit() {
  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.textContent = "Sending…";

  const isVideo = formState.type === "video";
  const payload = new URLSearchParams({
    type: isVideo ? "video" : "article",
    link: shareData.link,
    category: formState.category,
    language: formState.language,
  });

  if (isVideo) {
    payload.set("title", document.getElementById("titleInput").value.trim());
    payload.set("channelName", document.getElementById("channelInput").value.trim());
  } else {
    payload.set("headline", document.getElementById("headlineInput").value.trim());
    payload.set("outlet", document.getElementById("outletInput").value.trim());
    payload.set("journalist", document.getElementById("journalistInput").value.trim());
    payload.set("tab", formState.bulletin ? "Bulletin" : "");
  }

  fetch(CONFIG.appsScriptUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload.toString(),
  })
    .then(() => renderSuccess(document.getElementById("shareRoot")))
    .catch(() => renderError(document.getElementById("shareRoot")));
}

const root = document.getElementById("shareRoot");
if (!CONFIG.appsScriptUrl) {
  renderMissingConfig(root);
} else if (!shareData.link) {
  renderNoLink(root);
} else {
  renderForm(root);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}
