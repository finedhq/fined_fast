// Sharing and saving files in the app (app build only). Android's in-app browser engine has no
// Web Share API and ignores download links, so the site's existing share buttons and certificate
// downloads would do nothing. This gives them Android's share sheet instead, without changing them:
//  - navigator.share / navigator.canShare  -> Android share sheet (text, links and files)
//  - window.saveAs (used by jsPDF) and download links with blob:/data: addresses
//                                           -> the file opens in the share sheet ("Save to Files", Drive, WhatsApp…)
import { Share } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function cacheFile(blob, name) {
  const safeName = (name || 'file').replace(/[^\w.\- ]+/g, '_').slice(0, 120);
  const { uri } = await Filesystem.writeFile({
    path: `shared/${Date.now()}-${safeName}`,
    data: await blobToBase64(blob),
    directory: Directory.Cache,
    recursive: true,
  });
  return uri;
}

function abortError() {
  return new DOMException('Share canceled', 'AbortError');
}

async function nativeShare(data = {}) {
  const files = data.files?.length ? await Promise.all([...data.files].map((f) => cacheFile(f, f.name))) : undefined;
  const text = [data.text, data.url && !String(data.text ?? '').includes(data.url) ? data.url : null].filter(Boolean).join(' ');
  try {
    await Share.share({ title: data.title, dialogTitle: data.title, text: text || undefined, files });
  } catch (error) {
    if (/cancel/i.test(String(error?.message))) throw abortError();
    throw error;
  }
}

export async function saveFile(blob, name) {
  const uri = await cacheFile(blob, name);
  try {
    await Share.share({ title: name, dialogTitle: 'Save or send your file', files: [uri] });
  } catch (error) {
    if (!/cancel/i.test(String(error?.message))) throw error;
  }
}

async function saveFromUrl(href, name) {
  const blob = await (await fetch(href)).blob();
  return saveFile(blob, name);
}

const isFileDownload = (a) => a instanceof HTMLAnchorElement && a.hasAttribute('download') && /^(blob|data):/.test(a.href);

export function setupShareAndSave() {
  Object.defineProperty(navigator, 'share', { value: nativeShare, configurable: true, writable: true });
  Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true, writable: true });

  window.saveAs = (blob, name) => {
    saveFile(blob, name).catch(() => {});
  };

  // Download links: the PNG certificate uses a.click(); jsPDF's fallback dispatches a click event.
  const originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function click() {
    if (isFileDownload(this)) return void saveFromUrl(this.href, this.download).catch(() => {});
    return originalClick.call(this);
  };
  const originalDispatch = HTMLAnchorElement.prototype.dispatchEvent;
  HTMLAnchorElement.prototype.dispatchEvent = function dispatchEvent(event) {
    if (event?.type === 'click' && isFileDownload(this)) {
      saveFromUrl(this.href, this.download).catch(() => {});
      return false;
    }
    return originalDispatch.call(this, event);
  };
  // A download link tapped directly by the user.
  document.addEventListener(
    'click',
    (event) => {
      const link = event.target.closest?.('a[download]');
      if (link && isFileDownload(link)) {
        event.preventDefault();
        saveFromUrl(link.href, link.download).catch(() => {});
      }
    },
    true,
  );
}
