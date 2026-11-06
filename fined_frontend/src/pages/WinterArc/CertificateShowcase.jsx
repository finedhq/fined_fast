// The WinterArc completion certificate, using the site's real certificate
// design. Visitors type their name and see it on the sheet. Wording avoids
// "certified" and "accredited" (it records completion, nothing more).
import { useState } from "react";
import { PiCalendarCheckBold, PiHourglassMediumBold } from "react-icons/pi";
import CertificatePreview from "../../components/Certificate/CertificatePreview";
import { WINTERARC as W } from "./winterarcConfig";

export default function CertificateShowcase() {
  const [name, setName] = useState("");

  const when = W.show.certificatePrice
    ? `On sale for ${W.certificatePrice} once the challenge ends on ${W.endDate}.`
    : `Available once the challenge ends on ${W.endDate}.`;

  const facts = [
    { Icon: PiCalendarCheckBold, tone: "purple", title: `Finish ${W.certificateMinDays} of ${W.totalDays} days`, body: "Only days you actually complete count towards it." },
    { Icon: PiHourglassMediumBold, tone: "gold", title: "After the finale", body: when },
  ];

  return (
    <div className="wa-cert">
      <div className="wa-cert-stage">
        <div className="wa-cert-sheet">
          <CertificatePreview
            name={name}
            courseTitle="Personal Finance & Stock Market Basics"
            completedAt="2026-12-30T18:00:00+05:30"
            code="FINED-WNTR-2026"
            sample
            leadText="This is to record that"
            actionText={`completed ${W.name}, FinEd's ${W.totalDays}-day challenge in`}
            bandLabel="Challenge complete"
            bandStat={`${W.certificateMinDays}+ of ${W.totalDays} days`}
          />
        </div>
        <label className="wa-cert-name">
          <span>Try it with your name</span>
          <input
            type="text"
            maxLength={40}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>
      </div>

      <div className="wa-cert-facts">
        {facts.map(({ Icon, tone, title, body }) => (
          <div key={title} className="wa-cert-fact">
            <span className={`wa-icon wa-icon-${tone}`}><Icon aria-hidden="true" /></span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="wa-small wa-center">
        A completion certificate records that you finished WinterArc. It is not an accredited qualification.
      </p>
    </div>
  );
}
