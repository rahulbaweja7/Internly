// Single line to change between local dev and a real build.
const FRONTEND_URL = "http://localhost:3000";

const MAX_DESCRIPTION_LENGTH = 500;

// Runs inside the page (isolated world) via chrome.scripting.executeScript.
// No closure over outer variables — everything needed must be recomputed here.
function extractPageData() {
  const clean = (s) => (s || "").trim().replace(/\s+/g, " ");
  const meta = (selector) => {
    const el = document.querySelector(selector);
    return el ? el.getAttribute("content") : "";
  };

  const ogTitle = meta('meta[property="og:title"]');
  const title = clean(ogTitle || document.title);
  const siteName = clean(meta('meta[property="og:site_name"]'));
  const description = clean(meta('meta[property="og:description"]'));

  return { title, siteName, description };
}

async function buildAddJobUrl(tab) {
  const params = new URLSearchParams();
  // jobUrl comes from the click event's tab, not re-derived in-page.
  if (tab.url) params.set("jobUrl", tab.url);

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractPageData,
    });
    const data = results && results[0] && results[0].result;
    if (data) {
      if (data.title) params.set("position", data.title);
      if (data.siteName) params.set("company", data.siteName);
      if (data.description) {
        params.set("description", data.description.slice(0, MAX_DESCRIPTION_LENGTH));
      }
    }
  } catch (err) {
    // Restricted URL scheme (chrome://, chrome-extension://, edge://, the
    // Chrome Web Store, or a tab with no injectable id) — fall back to a
    // blank form instead of failing silently or throwing.
    console.warn("Add to Applycation: could not extract page data", err);
  }

  const qs = params.toString();
  return qs ? `${FRONTEND_URL}/add?${qs}` : `${FRONTEND_URL}/add`;
}

// Registered synchronously at the top level so Chrome can replay the click
// event correctly after the service worker unloads from idle and wakes back up.
chrome.action.onClicked.addListener(async (tab) => {
  const url = await buildAddJobUrl(tab);
  chrome.tabs.create({ url });
});
