// Turns the rendered certificate sheet into files.
// PDF: true A4 landscape, image captured at ~240 dpi (crisp in print), plus an
// invisible text layer so the name/course/ID can be searched and copied, a
// clickable verify link and document metadata.
import { SHEET_WIDTH } from './certificateSheet';

const PRINT_SCALE = 2.5;                // ~240 dpi on A4: crisp in print, quick to make
const SHARE_SCALE = 2;                  // 2246 x 1588 PNG for social posts

async function capture(element, scale) {
  if (document.fonts?.ready) await document.fonts.ready;
  const mod = await import('html2canvas');
  const html2canvas = mod.default || mod;
  return html2canvas(element, {
    scale,
    useCORS: true,
    backgroundColor: '#FFFDF8',
    scrollX: 0,
    scrollY: 0,
    logging: false,
  });
}

export function certificateFileName(courseTitle, ext) {
  const slug = (courseTitle || 'Course').replace(/[^\w]+/g, '_').replace(/^_|_$/g, '');
  return `FinEd_Certificate_${slug}.${ext}`;
}

export async function buildCertificatePdf(element, cert) {
  const [canvas, jspdfModule] = await Promise.all([capture(element, PRINT_SCALE), import('jspdf')]);
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  const W = 297, H = 210;

  pdf.setProperties({
    title: `FinEd Certificate: ${cert.course_title}`,
    subject: `${cert.recipient_name} completed ${cert.course_title}`,
    author: 'FinEd',
    keywords: `FinEd, certificate, ${cert.code}`,
    creator: 'myfined.com',
  });

  // Invisible text first (selectable/searchable), the picture on top of it
  pdf.setFontSize(10);
  const lines = [cert.recipient_name, cert.course_title, cert.code, cert.verifyUrl].filter(Boolean);
  lines.forEach((t, i) => pdf.text(t, 90, 60 + i * 8, { renderingMode: 'invisible' }));
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, W, H, undefined, 'FAST');

  // The QR area in the left band (sheet px -> mm) opens the verify page
  if (cert.verifyUrl) {
    const px = W / SHEET_WIDTH;
    pdf.link(60 * px, 600 * px, 180 * px, 165 * px, { url: cert.verifyUrl });
  }
  return pdf;
}

export async function downloadCertificatePdf(element, cert) {
  const pdf = await buildCertificatePdf(element, cert);
  pdf.save(certificateFileName(cert.course_title, 'pdf'));
}

export async function certificatePngBlob(element) {
  const canvas = await capture(element, SHARE_SCALE);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export async function downloadCertificatePng(element, cert) {
  const blob = await certificatePngBlob(element);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = certificateFileName(cert.course_title, 'png');
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function verifyUrlFor(code) {
  return `${window.location.origin}/certificate/${code}`;
}

// FinEd's LinkedIn company page, so certificates added to profiles show its logo
const LINKEDIN_ORGANIZATION_ID = '104170837';

// LinkedIn's "Add licence or certification" form, pre-filled
export function linkedInAddUrl(cert) {
  const d = new Date(cert.completed_at || cert.issued_at || Date.now());
  const params = new URLSearchParams({
    startTask: 'CERTIFICATION_NAME',
    name: cert.course_title,
    organizationId: LINKEDIN_ORGANIZATION_ID,
    issueYear: String(d.getFullYear()),
    issueMonth: String(d.getMonth() + 1),
    certUrl: verifyUrlFor(cert.code),
    certId: cert.code,
  });
  return `https://www.linkedin.com/profile/add?${params}`;
}

export function linkedInShareUrl(cert) {
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrlFor(cert.code))}`;
}

export function whatsAppShareUrl(cert) {
  const text = `I just completed "${cert.course_title}" on FinEd! 🎓 ${verifyUrlFor(cert.code)}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
