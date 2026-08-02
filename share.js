/* ==================================================================
   SHARE PAGE LOGIC
   Reads whatever the OS share sheet handed us (title/text/url),
   guesses the article link + a headline, and lets the person tap a
   category + language before sending it straight into the Articles
   sheet via the Apps Script endpoint in CONFIG.appsScriptUrl.
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

function buildShareData() {
  const params = new URLSearchParams(window.location.search);
  const sharedTitle = (params.get("title") || "").trim();
  const sharedText = (params.get("text") || "").trim();
  const sharedUrl = (params.get("url") || "").trim();

  const link = sharedUrl || extractUrl(sharedText) || extractUrl(sharedTitle) || "";

  let headline = sharedTitle;
  if (!headline || headline === link) {
    headline = sharedText.split(link).join("").trim();
  }

  return { link, headline, outlet: outletFromUrl(link) };
}

const shareData = buildShareData();
const formState = {
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
        <p>Open this page by sharing an article link into The Desk from your browser or news app.</p>
      </div>
    </div>`;
}

function renderForm(root) {
  root.innerHTML = `
    <div class="share-card" id="shareCard">
      <div class="field">
        <span class="field-label">Article</span>
        <div class="field-link">${escapeHtml(shareData.link)}</div>
      </div>
      <div class="field">
        <span class="field-label">Headline</span>
        <input type="text" id="headlineInput" value="${escapeHtml(shareData.headline)}" placeholder="Headline" />
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
        <span class="field-label">Category</span>
        ${chipGroupHtml("category", CONFIG.categories, formState.category)}
      </div>
      <div class="field">
        <span class="field-label">Language</span>
        ${chipGroupHtml("language", ["English", "Marathi"], formState.language)}
      </div>
      <div class="field">
        <label class="toggle-row">
          <input type="checkbox" id="bulletinToggle" />
          Feature in today's Bulletin
        </label>
      </div>
      <button class="submit-btn" id="submitBtn">Add to feed</button>
    </div>`;

  root.querySelectorAll(".chip-group").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      group.querySelectorAll(".chip").forEach((c) => c.classList.remove("selected"));
      btn.classList.add("selected");
      const groupName = group.getAttribute("data-group");
      formState[groupName] = btn.getAttribute("data-value");
    });
  });

  document.getElementById("bulletinToggle").addEventListener("change", (e) => {
    formState.bulletin = e.target.checked;
  });

  document.getElementById("submitBtn").addEventListener("click", submit);
}

function renderSuccess(root) {
  root.innerHTML = `
    <div class="share-card success-block">
      <div class="success-mark">✓</div>
      <p class="state-title">Added to your feed</p>
      <p>It'll show up in Your Feed${formState.bulletin ? " and today's Bulletin" : ""} — the sheet can take a minute to catch up.</p>
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

  const payload = new URLSearchParams({
    link: shareData.link,
    headline: document.getElementById("headlineInput").value.trim(),
    outlet: document.getElementById("outletInput").value.trim(),
    journalist: document.getElementById("journalistInput").value.trim(),
    category: formState.category,
    language: formState.language,
    tab: formState.bulletin ? "Bulletin" : "",
  });

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
