import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import toast from 'react-hot-toast';
import {
  PiCheckBold,
  PiCopyBold,
  PiDownloadSimpleBold,
  PiImageBold,
  PiLinkedinLogoBold,
  PiPencilSimpleBold,
  PiShareNetworkBold,
  PiWhatsappLogoBold,
  PiXBold,
} from 'react-icons/pi';
import instance from '../../lib/axios';
import CertificateDesign from './CertificateDesign';
import CertificatePreview from './CertificatePreview';
import {
  certificateFileName,
  certificatePngBlob,
  downloadCertificatePdf,
  downloadCertificatePng,
  linkedInAddUrl,
  linkedInShareUrl,
  verifyUrlFor,
  whatsAppShareUrl,
} from './certificateExport';
import './CertificateModal.css';

const NAME_MAX = 60;

function errorText(err, fallback) {
  return err?.response?.data?.detail || fallback;
}

// Course certificate: confirm the printed name (first time), then preview,
// download (PDF / image), add to LinkedIn and share the public verify link.
export default function CertificateModal({ courseSlug, courseTitle, onClose }) {
  const [state, setState] = useState(null); // GET /certificates/course/{slug}
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');
  const [busy, setBusy] = useState(''); // 'pdf' | 'png' | 'share'
  const [copied, setCopied] = useState(false);
  const sheetRef = useRef(null);
  const inputRef = useRef(null);
  const closeRef = useRef(null);
  const { user } = useAuth0();
  // The server's suggestion, else the sign-in name (never an email address)
  const signInName = user?.name && !user.name.includes('@') ? user.name : '';
  const fallbackNameRef = useRef(signInName);

  const cert = state?.certificate || null;
  const showNameStep = state?.eligible && (!cert || editing);

  useEffect(() => {
    let alive = true;
    instance.get(`/certificates/course/${courseSlug}`)
      .then((res) => {
        if (!alive) return;
        setState(res.data);
        setName(res.data.certificate?.recipient_name || res.data.suggested_name || fallbackNameRef.current);
      })
      .catch((err) => alive && setLoadError(errorText(err, "Couldn't load your certificate. Please try again.")));
    return () => { alive = false; };
  }, [courseSlug]);

  // Escape closes; lock page scroll while open
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  useEffect(() => {
    if (showNameStep) inputRef.current?.focus();
  }, [showNameStep]);

  const sheet = cert
    ? {
        name: editing ? name : cert.recipient_name,
        courseTitle: cert.course_title,
        modulesCount: cert.modules_count,
        completedAt: cert.completed_at,
        code: cert.code,
        verifyUrl: verifyUrlFor(cert.code),
      }
    : {
        name,
        courseTitle: state?.course_title || courseTitle,
        modulesCount: state?.modules_count,
        completedAt: state?.completed_at,
        code: null,
        verifyUrl: null,
      };
  const exportData = cert ? { ...cert, verifyUrl: verifyUrlFor(cert.code) } : null;

  async function saveName(e) {
    e.preventDefault();
    const clean = name.replace(/\s+/g, ' ').trim();
    if (clean.length < 2) {
      setNameError('Please enter your full name.');
      return;
    }
    setSaving(true);
    setNameError('');
    try {
      const res = await instance.post(`/certificates/course/${courseSlug}`, { name: clean });
      setState((s) => ({ ...s, eligible: true, certificate: res.data.certificate }));
      setName(res.data.certificate.recipient_name);
      if (!cert) toast.success('Your certificate is ready!');
      setEditing(false);
    } catch (err) {
      setNameError(errorText(err, "Couldn't save your name. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function run(kind, fn) {
    if (!sheetRef.current || busy) return;
    setBusy(kind);
    try {
      await fn();
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Something went wrong. Please try again.');
    } finally {
      setBusy('');
    }
  }

  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  async function nativeShare() {
    const url = verifyUrlFor(cert.code);
    const text = `I just completed "${cert.course_title}" on FinEd!`;
    const blob = await certificatePngBlob(sheetRef.current);
    const file = new File([blob], certificateFileName(cert.course_title, 'png'), { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My FinEd certificate', text: `${text} ${url}` });
    } else {
      await navigator.share({ title: 'My FinEd certificate', text, url });
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(verifyUrlFor(cert.code));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy. The link is " + verifyUrlFor(cert.code));
    }
  }

  const content = (
    <div className="cm-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="cm-dialog" role="dialog" aria-modal="true" aria-labelledby="cm-title">
        <header className="cm-head">
          <div>
            <p className="cm-kicker">{courseTitle || sheet.courseTitle}</p>
            <h2 id="cm-title" className="cm-title">
              {!state ? 'Your certificate' : showNameStep ? (cert ? 'Edit your name' : 'One last step') : state.eligible ? 'Your certificate' : 'Not unlocked yet'}
            </h2>
          </div>
          <button ref={closeRef} type="button" className="cm-close" onClick={onClose} aria-label="Close">
            <PiXBold />
          </button>
        </header>

        {loadError && <p className="cm-error" role="alert">{loadError}</p>}
        {!state && !loadError && <div className="cm-loading" aria-live="polite">Loading your certificate…</div>}

        {state && !state.eligible && (
          <p className="cm-text">
            Finish every module in this course to unlock your certificate.{' '}
            <Link to={`/courses/${courseSlug}`} className="cm-inline-link" onClick={onClose}>See what's left</Link>
          </p>
        )}

        {state?.eligible && (
          <div className="cm-body">
            <div className="cm-sheet">
              <CertificatePreview {...sheet} />
            </div>

            {showNameStep ? (
              <form className="cm-form" onSubmit={saveName} noValidate>
                <label htmlFor="cm-name" className="cm-label">Name on certificate</label>
                <p className="cm-hint">
                  {cert
                    ? `You can change it ${cert.name_changes_left} more time${cert.name_changes_left === 1 ? '' : 's'}. Your certificate ID stays the same.`
                    : 'Type it exactly as you want it printed, as on your ID or LinkedIn.'}
                </p>
                <div className="cm-form-row">
                  <input
                    id="cm-name"
                    ref={inputRef}
                    className="cm-input"
                    value={name}
                    maxLength={NAME_MAX}
                    autoComplete="name"
                    placeholder="e.g. Priya Sharma"
                    onChange={(e) => { setName(e.target.value); setNameError(''); }}
                    aria-invalid={!!nameError}
                    aria-describedby={nameError ? 'cm-name-error' : undefined}
                  />
                  <button type="submit" className="cm-btn cm-btn--primary" disabled={saving}>
                    {saving ? 'Saving…' : cert ? 'Save name' : 'Get my certificate'}
                  </button>
                </div>
                {nameError && <p id="cm-name-error" className="cm-error" role="alert">{nameError}</p>}
                {cert && (
                  <button type="button" className="cm-link" onClick={() => { setEditing(false); setName(cert.recipient_name); setNameError(''); }}>
                    Cancel
                  </button>
                )}
              </form>
            ) : (
              <>
                <div className="cm-actions">
                  <button type="button" className="cm-btn cm-btn--primary" onClick={() => run('pdf', () => downloadCertificatePdf(sheetRef.current, exportData))} disabled={!!busy}>
                    <PiDownloadSimpleBold aria-hidden="true" /> {busy === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}
                  </button>
                  <button type="button" className="cm-btn" onClick={() => run('png', () => downloadCertificatePng(sheetRef.current, exportData))} disabled={!!busy}>
                    <PiImageBold aria-hidden="true" /> {busy === 'png' ? 'Preparing…' : 'Download image'}
                  </button>
                  <a className="cm-btn cm-btn--linkedin" href={linkedInAddUrl(cert)} target="_blank" rel="noopener noreferrer">
                    <PiLinkedinLogoBold aria-hidden="true" /> Add to LinkedIn profile
                  </a>
                </div>

                <div className="cm-share">
                  <span className="cm-share-label">Share</span>
                  <a className="cm-chip" href={linkedInShareUrl(cert)} target="_blank" rel="noopener noreferrer"><PiLinkedinLogoBold aria-hidden="true" /> Post</a>
                  <a className="cm-chip" href={whatsAppShareUrl(cert)} target="_blank" rel="noopener noreferrer"><PiWhatsappLogoBold aria-hidden="true" /> WhatsApp</a>
                  {canNativeShare && (
                    <button type="button" className="cm-chip" onClick={() => run('share', nativeShare)} disabled={!!busy}>
                      <PiShareNetworkBold aria-hidden="true" /> More
                    </button>
                  )}
                  <button type="button" className="cm-chip" onClick={copyLink}>
                    {copied ? <><PiCheckBold aria-hidden="true" /> Copied</> : <><PiCopyBold aria-hidden="true" /> Copy link</>}
                  </button>
                </div>

                <div className="cm-meta">
                  <span>ID <strong>{cert.code}</strong> · anyone can check it at <a href={`/certificate/${cert.code}`} target="_blank" rel="noopener noreferrer">{verifyUrlFor(cert.code).replace(/^https?:\/\//, '')}</a></span>
                  {cert.name_changes_left > 0 && (
                    <button type="button" className="cm-link" onClick={() => setEditing(true)}>
                      <PiPencilSimpleBold aria-hidden="true" /> Edit name
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Full-size copy used for the PDF / image capture */}
      {cert && (
        <div className="cm-offscreen" aria-hidden="true">
          <CertificateDesign ref={sheetRef} {...sheet} />
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
