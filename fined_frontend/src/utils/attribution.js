// First-touch source capture (WinterArc and anything after it).
// On the first visit that carries UTM tags or a referral code, we remember them
// in this browser, so they survive the Auth0 redirect and later page views.
// Later visits never overwrite them: each person is counted against one source.
// Storage can be blocked (private mode); then we simply remember nothing.

const KEY = "fined_attribution_v1";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const write = (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
};

const cut = (value, max) => (value ? String(value).slice(0, max) : null);

/** Reads source tags from a URL search string. Exported for tests. */
export function parseSource(search) {
  const params = new URLSearchParams(search || "");
  const out = {};
  UTM_KEYS.forEach((k) => {
    const v = params.get(k);
    if (v) out[k] = cut(v.trim(), 100);
  });
  // "campaign" is accepted as a short alias for utm_campaign
  if (!out.utm_campaign && params.get("campaign")) out.utm_campaign = cut(params.get("campaign").trim(), 100);
  const ref = (params.get("ref") || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  if (ref) out.ref = ref.slice(0, 20);
  return out;
}

/** Call once on every page load. Keeps the first tagged visit. */
export function captureAttribution() {
  if (typeof window === "undefined") return;
  const existing = read();
  const found = parseSource(window.location.search);
  const tagged = Object.keys(found).length > 0;

  if (!existing) {
    write({
      ...found,
      landing_path: cut(window.location.pathname + window.location.search, 300),
      first_referrer: cut(document.referrer, 300),
      first_seen_at: new Date().toISOString(),
      tagged,
    });
    return;
  }
  // First visit had no tags (e.g. typed the URL), this one does: take these tags
  if (!existing.tagged && tagged) {
    write({
      ...existing,
      ...found,
      landing_path: cut(window.location.pathname + window.location.search, 300),
      tagged: true,
    });
  }
}

/** What we know about how this person arrived (never null). */
export function getAttribution() {
  const value = { ...(read() || {}) };
  delete value.tagged;
  return value;
}

/**
 * Record an on-site source (e.g. the home page WinterArc popup) for a visitor
 * who arrived with no tags. Tagged first visits are never overwritten.
 */
export function tagSourceIfUntagged(tags) {
  const existing = read();
  if (existing?.tagged) return;
  write({
    ...(existing || {}),
    ...tags,
    landing_path: existing?.landing_path || cut(window.location.pathname, 300),
    first_seen_at: existing?.first_seen_at || new Date().toISOString(),
    tagged: true,
  });
}
