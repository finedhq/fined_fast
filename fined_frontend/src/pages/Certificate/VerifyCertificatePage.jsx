import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PiCheckCircleFill, PiWarningCircleFill, PiArrowRightBold } from 'react-icons/pi';
import instance from '../../lib/axios';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import CertificatePreview from '../../components/Certificate/CertificatePreview';
import { formatCertDate } from '../../components/Certificate/certificateSheet';
import { verifyUrlFor } from '../../components/Certificate/certificateExport';
import './VerifyCertificatePage.css';

// Public page behind the QR code / verify link: anyone can confirm a certificate is real.
export default function VerifyCertificatePage() {
  const { code } = useParams();
  const [cert, setCert] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | valid | missing | error

  useDocumentTitle(cert ? `${cert.recipient_name} · ${cert.course_title} | FinEd certificate` : 'Verify a certificate | FinEd');

  useEffect(() => {
    let alive = true;
    instance.get(`/certificates/verify/${encodeURIComponent(code)}`)
      .then((res) => { if (alive) { setCert(res.data); setStatus('valid'); } })
      .catch((err) => { if (alive) setStatus(err?.response?.status === 404 ? 'missing' : 'error'); });
    return () => { alive = false; };
  }, [code]);

  return (
    <main className="vc-page">
      <div className="vc-wrap">
        {status === 'loading' && <p className="vc-loading" aria-live="polite">Checking certificate…</p>}

        {status === 'valid' && cert && (
          <>
            <div className="vc-badge" role="status">
              <PiCheckCircleFill aria-hidden="true" />
              <span>Verified certificate</span>
            </div>
            <h1 className="vc-title">
              {cert.recipient_name} completed <span>{cert.course_title}</span>
            </h1>
            <p className="vc-sub">
              This certificate was issued by FinEd and is valid. The holder finished every module
              {cert.modules_count ? ` (${cert.modules_count} in all)` : ''} of the course.
            </p>

            <dl className="vc-facts">
              <div><dt>Holder</dt><dd>{cert.recipient_name}</dd></div>
              <div><dt>Course</dt><dd>{cert.course_title}</dd></div>
              <div><dt>Completed on</dt><dd>{formatCertDate(cert.completed_at)}</dd></div>
              <div><dt>Certificate ID</dt><dd className="vc-code">{cert.code}</dd></div>
            </dl>

            <div className="vc-sheet">
              <CertificatePreview
                name={cert.recipient_name}
                courseTitle={cert.course_title}
                modulesCount={cert.modules_count}
                completedAt={cert.completed_at}
                code={cert.code}
                verifyUrl={verifyUrlFor(cert.code)}
              />
            </div>
          </>
        )}

        {(status === 'missing' || status === 'error') && (
          <div className="vc-missing">
            <PiWarningCircleFill aria-hidden="true" />
            <h1 className="vc-title">
              {status === 'missing' ? 'No certificate with this ID' : "Couldn't check this certificate"}
            </h1>
            <p className="vc-sub">
              {status === 'missing'
                ? <>We couldn't find a valid FinEd certificate with the ID <strong>{code}</strong>. Check the ID on the certificate and try again.</>
                : 'Something went wrong on our side. Please try again in a minute.'}
            </p>
          </div>
        )}

        {status !== 'loading' && (
          <aside className="vc-cta">
            <div>
              <h2>Learn finance by doing</h2>
              <p>Free, interactive courses on FinEd. Finish one and get your own certificate.</p>
            </div>
            <Link to="/courses" className="vc-cta-btn">Explore courses <PiArrowRightBold aria-hidden="true" /></Link>
          </aside>
        )}
      </div>
    </main>
  );
}
