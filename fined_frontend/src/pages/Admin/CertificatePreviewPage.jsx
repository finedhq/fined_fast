import { useRef, useState } from 'react';
import CertificateDesign from '../../components/Certificate/CertificateDesign';
import CertificatePreview from '../../components/Certificate/CertificatePreview';
import { downloadCertificatePdf, downloadCertificatePng } from '../../components/Certificate/certificateExport';
import '../../components/Certificate/CertificateModal.css';

// Admin: see the certificate with any name / course and try the PDF + image
// downloads, without finishing a course. Nothing is saved.
export default function CertificatePreviewPage() {
  const [name, setName] = useState('Priya Sharma');
  const [course, setCourse] = useState('Basics of Stock Market');
  const [modules, setModules] = useState(8);
  const sheetRef = useRef(null);
  const code = 'FINED-SAMP-LE23';
  const sheet = {
    name,
    courseTitle: course,
    modulesCount: Number(modules) || null,
    completedAt: new Date().toISOString(),
    code,
    verifyUrl: `${window.location.origin}/certificate/${code}`,
  };
  const exportData = { recipient_name: name, course_title: course, code, verifyUrl: sheet.verifyUrl };

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '110px 16px 60px', fontFamily: 'Nunito, sans-serif' }}>
      <h1 style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontWeight: 800, fontSize: 28 }}>Certificate preview</h1>
      <p style={{ color: '#625D6D', margin: '6px 0 18px' }}>Sample data only. The ID and QR point to a certificate that doesn't exist.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <input className="cm-input" value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
        <input className="cm-input" value={course} onChange={(e) => setCourse(e.target.value)} aria-label="Course" />
        <input className="cm-input" style={{ flex: '0 0 110px' }} type="number" min="0" value={modules} onChange={(e) => setModules(e.target.value)} aria-label="Modules" />
      </div>
      <div className="cm-sheet"><CertificatePreview {...sheet} /></div>
      <div className="cm-actions">
        <button type="button" className="cm-btn cm-btn--primary" onClick={() => downloadCertificatePdf(sheetRef.current, exportData)}>Download PDF</button>
        <button type="button" className="cm-btn" onClick={() => downloadCertificatePng(sheetRef.current, exportData)}>Download image</button>
      </div>
      <div className="cm-offscreen" aria-hidden="true"><CertificateDesign ref={sheetRef} {...sheet} /></div>
    </main>
  );
}
