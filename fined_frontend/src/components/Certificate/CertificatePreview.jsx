import { useEffect, useRef, useState } from 'react';
import CertificateDesign from './CertificateDesign';
import { SHEET_WIDTH, SHEET_HEIGHT } from './certificateSheet';

// The certificate scaled to fit its container's width (keeps the sheet's ratio).
export default function CertificatePreview({ className = '', ...props }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / SHEET_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      className={`fcert-preview ${className}`}
      style={{ position: 'relative', width: '100%', aspectRatio: `${SHEET_WIDTH} / ${SHEET_HEIGHT}`, overflow: 'hidden' }}
      role="img"
      aria-label={`Certificate of completion for ${props.name || 'you'}: ${props.courseTitle || ''}`}
    >
      {scale > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, transform: `scale(${scale})`, transformOrigin: 'top left' }} aria-hidden="true">
          <CertificateDesign {...props} />
        </div>
      )}
    </div>
  );
}
