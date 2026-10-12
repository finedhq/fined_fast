import { useEffect, useState } from 'react';
import { PiCertificateBold } from 'react-icons/pi';
import instance from '../../lib/axios';
import CertificatePreview from './CertificatePreview';
import CertificateModal from './CertificateModal';
import { formatCertDate } from './certificateSheet';
import { verifyUrlFor } from './certificateExport';

// Profile page, inside the learning-track card: one row per completed course
// with its certificate. Opening one shows the same window as the course page
// (download, LinkedIn, share, edit name). Renders nothing until there is one.
export default function ProfileCertificates() {
  const [certs, setCerts] = useState([]);
  const [openCert, setOpenCert] = useState(null);

  useEffect(() => {
    let alive = true;
    instance.get('/certificates/mine')
      .then((res) => alive && setCerts(res.data || []))
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!certs.length) return null;

  return (
    <div className="mt-6 pt-5 border-t border-slate-100">
      <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
        Completed courses
      </span>
      <ul className="mt-3 flex flex-col gap-3">
        {certs.map((c) => (
          <li key={c.code}>
            <button
              type="button"
              onClick={() => setOpenCert(c)}
              className="group w-full flex items-center gap-4 p-2.5 rounded-2xl border border-slate-200 hover:border-[#4A3AFF]/40 hover:bg-[#F7F4FF] text-left transition cursor-pointer"
              aria-label={`Open your certificate for ${c.course_title}`}
            >
              <div className="w-24 sm:w-32 flex-shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                <CertificatePreview
                  name={c.recipient_name}
                  courseTitle={c.course_title}
                  modulesCount={c.modules_count}
                  completedAt={c.completed_at}
                  code={c.code}
                  verifyUrl={verifyUrlFor(c.code)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-black text-slate-800 truncate">{c.course_title}</p>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Completed {formatCertDate(c.completed_at)}</p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-[#4100BC] group-hover:underline">
                  <PiCertificateBold aria-hidden="true" /> View certificate →
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>

      {openCert && (
        <CertificateModal
          courseSlug={openCert.course_slug}
          courseTitle={openCert.course_title}
          onClose={() => setOpenCert(null)}
        />
      )}
    </div>
  );
}
