import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../../hooks/useDocumentTitle';

/**
 * Shared layout for the legal pages (privacy policy, terms of service).
 * Keeps both documents on one readable measure with consistent FinEd styling.
 */
export default function LegalPage({ title, lastUpdated, intro, children }) {
  useDocumentTitle(`${title} | FinEd`);

  return (
    <div className="bg-[#F7F4FF] min-h-screen py-10 sm:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-[#E6E1EC] p-6 sm:p-12">
          <h1
            className="text-3xl sm:text-4xl font-extrabold text-[#171321]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {title}
          </h1>

          <p className="mt-3 text-sm text-[#8E8A95]">Last updated: {lastUpdated}</p>

          {intro && (
            <p
              className="mt-6 text-[#625D6D] leading-relaxed"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {intro}
            </p>
          )}

          <div
            className="mt-8 space-y-8 text-[#625D6D] leading-relaxed"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            {children}
          </div>

          <div className="mt-12 pt-6 border-t border-[#E6E1EC] flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link to="/" className="text-[#4100BC] font-semibold hover:underline">
              Back to home
            </Link>
            <Link to="/privacy-policy" className="text-[#4100BC] font-semibold hover:underline">
              Privacy Policy
            </Link>
            <Link to="/termsofservice" className="text-[#4100BC] font-semibold hover:underline">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Section({ heading, children }) {
  return (
    <section>
      <h2
        className="text-xl font-extrabold text-[#171321] mb-3"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {heading}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function Bullets({ items }) {
  return (
    <ul className="list-disc pl-5 space-y-2 marker:text-[#4A3AFF]">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export function Callout({ children }) {
  return (
    <div className="bg-[#FFF9E8] border border-[#FFB600] rounded-xl p-4 text-[#171321]">
      {children}
    </div>
  );
}
