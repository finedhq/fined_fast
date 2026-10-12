// The certificate is a fixed A4-landscape sheet: 1123 x 794 CSS px = 297 x 210 mm
// at 96 dpi. It is drawn once at this size and scaled for previews, and captured
// at ~300 dpi for the PDF.
export const SHEET_WIDTH = 1123;
export const SHEET_HEIGHT = 794;

export function formatCertDate(iso) {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}
