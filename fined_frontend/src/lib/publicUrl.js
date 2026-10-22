// Addresses for links people share or scan: certificate QR codes and verify links, article,
// profile and invite links. The website uses its own address, exactly as before. Inside the
// mobile app pages live at https://localhost, which means nothing off the phone, so the app
// build uses the real site instead.
const IN_APP = import.meta.env.VITE_NATIVE_APP === 'true';
const SITE = 'https://myfined.com';

// e.g. https://myfined.com (no trailing slash)
export function publicOrigin() {
  return IN_APP ? SITE : window.location.origin;
}

// The current page's shareable address
export function publicHref() {
  const { pathname, search, hash } = window.location;
  return IN_APP ? `${SITE}${pathname}${search}${hash}` : window.location.href;
}
