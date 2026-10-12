import { forwardRef, useId, useMemo } from 'react';
import qrcode from 'qrcode-generator';
import logo from '../../assets/fined-footer-logo.webp';
import { SHEET_WIDTH, SHEET_HEIGHT, formatCertDate } from './certificateSheet';
import './CertificateDesign.css';

// Long names step down to fit one line (about 0.6em per character in the
// heading font across the ~640px text column); very long ones wrap to two
function nameSize(name) {
  return Math.round(Math.max(36, Math.min(68, 1100 / Math.max(name.length, 1))));
}

function QrCode({ text, size }) {
  const cells = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    const count = qr.getModuleCount();
    const dark = [];
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        if (qr.isDark(r, c)) dark.push([c, r]);
      }
    }
    return { count, dark };
  }, [text]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${cells.count} ${cells.count}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect width={cells.count} height={cells.count} fill="#ffffff" />
      {cells.dark.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#171321" />)}
    </svg>
  );
}

// Fine concentric rings and a soft gold glow, centred on the seal. Drawn as a
// background image (not inline SVG) so the PDF capture places it exactly as on screen.
const RINGS_URL = (() => {
  const rings = Array.from({ length: 17 }, (_, i) => `<circle cx='260' cy='260' r='${74 + i * 11}'/>`).join('');
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='520' height='520' viewBox='0 0 520 520'>`
    + `<defs><radialGradient id='g'><stop offset='0' stop-color='#FFD877' stop-opacity='0.28'/><stop offset='1' stop-color='#FFD877' stop-opacity='0'/></radialGradient></defs>`
    + `<circle cx='260' cy='260' r='150' fill='url(#g)'/>`
    + `<g fill='none' stroke='#ffffff' stroke-opacity='0.07' stroke-width='1'>${rings}</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

// Gold rosette seal with two ribbon tails
function Seal() {
  const id = useId().replace(/:/g, '');
  const teeth = 32;
  const points = Array.from({ length: teeth * 2 }, (_, i) => {
    const r = i % 2 === 0 ? 50 : 45.5;
    const a = (Math.PI * i) / teeth - Math.PI / 2;
    return `${(55 + r * Math.cos(a)).toFixed(2)},${(55 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return (
    <div className="fcert-seal">
      <svg viewBox="0 0 110 150" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFE08F" />
            <stop offset="0.5" stopColor="#F5A623" />
            <stop offset="1" stopColor="#C97D06" />
          </linearGradient>
          <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#B8740A" />
            <stop offset="1" stopColor="#E9A12C" />
          </linearGradient>
        </defs>
        <polygon points="34,78 56,86 46,146 37,134 25,142" fill={`url(#${id}-ribbon)`} />
        <polygon points="76,78 54,86 64,146 73,134 85,142" fill={`url(#${id}-ribbon)`} />
        <polygon points={points} fill={`url(#${id}-gold)`} />
        <circle cx="55" cy="55" r="39" fill="none" stroke="#FFF3D1" strokeWidth="1.2" />
        <circle cx="55" cy="55" r="35" fill="none" stroke="#FFF3D1" strokeWidth="0.6" strokeDasharray="1.5 2" />
        <path d="M40 56 l10 10 l21 -22" fill="none" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

const CertificateDesign = forwardRef(function CertificateDesign(
  { name, courseTitle, modulesCount, completedAt, code, verifyUrl, sample = false },
  ref
) {
  const displayName = (name || '').trim() || 'Your Name';
  const shownCode = code || 'FINED-XXXX-XXXX';
  const verifyHost = verifyUrl ? verifyUrl.replace(/^https?:\/\//, '').replace(/\/certificate\/.*$/, '') : 'myfined.com';

  return (
    <div className="fcert" ref={ref} style={{ width: SHEET_WIDTH, height: SHEET_HEIGHT }}>
      {/* Left band */}
      <aside className="fcert-band">
        <div className="fcert-logo-chip">
          <img src={logo} alt="FinEd" />
        </div>

        <div className="fcert-band-mid">
          <div className="fcert-rings" style={{ backgroundImage: RINGS_URL }} aria-hidden="true" />
          <Seal />
          <div className="fcert-band-label">Course complete</div>
          {modulesCount ? (
            <div className="fcert-band-stat">
              <span className="fcert-band-dot" />{modulesCount} modules<span className="fcert-band-dot" />
            </div>
          ) : null}
        </div>

        <div className="fcert-verify">
          <div className="fcert-qr">
            {verifyUrl ? <QrCode text={verifyUrl} size={80} /> : <div className="fcert-qr-placeholder" />}
          </div>
          <div className="fcert-verify-text">
            <span className="fcert-verify-kicker">Scan to verify</span>
            <span className="fcert-verify-url">{verifyHost}</span>
          </div>
        </div>
      </aside>

      {/* Main sheet */}
      <main className="fcert-main">
        <div className="fcert-frame" aria-hidden="true" />

        <div className="fcert-body">
          <div className="fcert-eyebrow">
            <span className="fcert-eyebrow-rule" />
            Certificate of Completion
            <span className="fcert-eyebrow-rule" />
          </div>

          <p className="fcert-lead">This certifies that</p>
          <h1 className="fcert-name" style={{ fontSize: nameSize(displayName) }}>{displayName}</h1>
          <div className="fcert-name-rule" aria-hidden="true"><span /></div>

          <p className="fcert-lead">has successfully completed the course</p>
          <h2 className="fcert-course">{courseTitle || 'Course name'}</h2>
        </div>

        <div className="fcert-footer">
          <span className="fcert-date">Completed on <strong>{formatCertDate(completedAt)}</strong></span>
          <span className="fcert-id">ID {shownCode}</span>
        </div>

        {sample && <div className="fcert-sample" aria-hidden="true">Preview</div>}
      </main>
    </div>
  );
});

export default CertificateDesign;
