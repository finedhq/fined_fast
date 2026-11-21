// WinterArc: 30 Days of Money. Public landing page + join form (live 6 Nov 2026).
// The FinEd world in winter: the home page's illustrated hills with snow
// falling and piling up on the buttons, a 30-door advent calendar, a snowball
// that grows with your streak, and a frosted window hiding the prizes.
// All challenge values come from winterarcConfig.js.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { motion, useReducedMotion } from "motion/react";
import {
  PiArrowRightBold, PiSnowflakeBold, PiBookOpenTextBold, PiChatCircleDotsBold,
  PiCheckSquareOffsetBold, PiTargetBold, PiArrowCounterClockwiseBold, PiTrophyBold,
  PiUsersThreeBold, PiCheckBold, PiGiftBold,
} from "react-icons/pi";
import { WINTERARC as W } from "./winterarcConfig";
import SnowField from "./SnowField";
import AdventCalendar from "./AdventCalendar";
import SnowballStreak from "./SnowballStreak";
import FrostWindow from "./FrostWindow";
import PrizeTicket from "./PrizeTicket";
import CertificateShowcase from "./CertificateShowcase";
import SampleQuestion from "./SampleQuestion";
import SignupForm, { Countdown } from "./WinterArcSignup";
import { HeadStart } from "./CrossSell";
import useWinterArcStatus from "./useWinterArcStatus";
import sceneImg from "../../assets/newnewbg-imgofhomepg.webp";
import planeImg from "../../assets/newnewplane.webp";
import "./WinterArcLanding.css";

const EASE = [0.16, 1, 0.3, 1];

function Reveal({ children, delay = 0, className = "" }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// A hand-drawn note pointing at the countdown card, so people find out the
// snow piling on it can be knocked off. Shows once snow has had time to
// build up, and fades away as soon as they touch the card.
const CAN_HOVER = typeof window !== "undefined" && window.matchMedia?.("(hover: hover)").matches;

function SnowHint({ hidden }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="wa-snow-hint"
      aria-hidden="true"
      initial={{ opacity: 0, y: 6 }}
      animate={hidden ? { opacity: 0, y: -4 } : { opacity: 1, y: 0 }}
      transition={{ duration: hidden ? 0.4 : 0.7, delay: hidden || reduce ? 0 : 4, ease: EASE }}
    >
      <span className="wa-snow-hint-text">
        {CAN_HOVER ? "Hover to see the winter magic" : "Tap the snow for some winter magic"}{" "}
        <PiSnowflakeBold />
      </span>
      <svg className="wa-snow-hint-arrow" viewBox="0 0 60 48" fill="none">
        <path d="M52 4 C 50 22, 36 34, 12 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <path d="M20 30 L 10 38 L 21 44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
}

const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

function Hero() {
  const reduce = useReducedMotion();
  const { joined } = useWinterArcStatus();
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const [triedSnow, setTriedSnow] = useState(false);
  const heroRef = useRef(null);
  const rise = (delay) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <section className="wa-hero" ref={heroRef}>
      <div className="wa-hero-scene" aria-hidden="true">
        <img src={sceneImg} alt="" fetchPriority="high" />
      </div>

      <div className="wa-hero-inner">
        <div className="wa-hero-copy">
          <motion.p className="wa-eyebrow" {...rise(0)}>
            <PiSnowflakeBold aria-hidden="true" /> WinterArc · 1 to 30 Dec
          </motion.p>
          <motion.h1 {...rise(0.08)}>
            Give your money a{" "}
            <span className="wa-hl">
              winter arc.
              <svg className="wa-hl-line" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                <motion.path
                  d="M4 16 C 70 6, 150 4, 296 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, delay: 0.7, ease: EASE }}
                />
              </svg>
            </span>
          </motion.h1>
          <motion.p className="wa-hero-sub" {...rise(0.16)}>
            One short money task a day for {W.totalDays} days. Free to enter, free to win.
          </motion.p>
          <motion.div className="wa-hero-ctas" {...rise(0.24)}>
            {joined ? (
              <Link className="wa-btn wa-btn-primary" data-snow-ledge="11" to="/winterarc/challenge">
                Go to your hub <PiArrowRightBold aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" className="wa-btn wa-btn-primary" data-snow-ledge="11" onClick={() => scrollTo("join")}>
                Join WinterArc <PiArrowRightBold aria-hidden="true" />
              </button>
            )}
            <button type="button" className="wa-btn wa-btn-ghost" data-snow-ledge="9" onClick={() => scrollTo("calendar")}>
              See the 30 days
            </button>
          </motion.div>
          {!isAuthenticated && !isLoading && (
            <motion.p className="wa-hero-login" {...rise(0.3)}>
              Already joined?{" "}
              <button
                type="button"
                onClick={() => loginWithRedirect({ appState: { returnTo: "/winterarc/challenge" } })}
              >
                Log in to go to your hub
              </button>
            </motion.p>
          )}
        </div>

        <motion.div
          className="wa-hero-side"
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        >
          <img className="wa-plane" src={planeImg} alt="" aria-hidden="true" />
          <SnowHint hidden={triedSnow} />
          <div
            className="wa-hero-card"
            data-snow-ledge="16"
            onPointerEnter={() => setTriedSnow(true)}
            onPointerDown={() => setTriedSnow(true)}
          >
            <p className="wa-hero-card-label">Day 1 unlocks in</p>
            <Countdown />
            <ul className="wa-hero-facts">
              <li><strong>{W.totalDays}</strong> days</li>
              <li><strong>{W.questionsPerDay}</strong> questions a day</li>
              <li><strong>₹0</strong> to enter</li>
            </ul>
          </div>
          {W.show.prizes && (
            <div className="wa-hero-ticket">
              <PrizeTicket amount={W.prizePool} delay={0.9} data-snow-ledge="12" />
            </div>
          )}
        </motion.div>
      </div>

      <SnowField hostRef={heroRef} />
    </section>
  );
}

function HowADayWorks() {
  const steps = [
    { Icon: PiBookOpenTextBold, tone: "blue", title: "Read", body: "A short, story-led lesson on one money idea." },
    { Icon: PiChatCircleDotsBold, tone: "gold", title: `Answer ${W.questionsPerDay} questions`, body: "Every answer comes with an explanation, right or wrong." },
    { Icon: PiCheckSquareOffsetBold, tone: "purple", title: "Try it, if you like", body: "One small real-life step to tick off. Optional, no points." },
  ];
  return (
    <section className="wa-section" id="try">
      <div className="wa-wrap wa-split">
        <Reveal>
          <h2>A few minutes a day.</h2>
          <p className="wa-lede">Each day brings one task you can finish between classes or on the bus.</p>
          <ol className="wa-steps">
            {steps.map(({ Icon, tone, title, body }) => (
              <li key={title}>
                <span className={`wa-icon wa-icon-${tone}`}><Icon aria-hidden="true" /></span>
                <div>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={0.1}>
          <SampleQuestion />
        </Reveal>
      </div>
    </section>
  );
}

function Calendar() {
  return (
    <section className="wa-section wa-section-tint" id="calendar">
      <div className="wa-wrap">
        <Reveal className="wa-head">
          <h2>30 doors. One for every day.</h2>
          <p className="wa-lede">
            Each row is a leaderboard week, and every day has its own winner. The coloured stripes show the four learning themes.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <AdventCalendar />
        </Reveal>
      </div>
    </section>
  );
}

function Scoring() {
  const facts = [
    { Icon: PiTargetBold, tone: "gold", title: `${W.pointsPerQuestion} points per right answer`, body: "Full points on your first try. Each retry earns a little less.", show: true },
    { Icon: PiArrowCounterClockwiseBold, tone: "blue", title: `${W.startingResets} streak resets`, body: "Missed a day? Use a reset to repair your streak.", show: W.show.resets },
    { Icon: PiTrophyBold, tone: "purple", title: "Day 30 finale", body: `A final quiz worth ${W.finalePoints} points.`, show: true },
    { Icon: PiUsersThreeBold, tone: "green", title: `+${W.referralPoints} per friend`, body: `When a friend you invite finishes Day 3. Up to ${W.referralCap}.`, show: W.show.referrals },
  ].filter((f) => f.show);

  return (
    <section className="wa-section">
      <div className="wa-wrap">
        <Reveal className="wa-head">
          <h2>{W.show.streakBonuses ? "Your streak snowballs." : "How you score"}</h2>
          {W.show.streakBonuses && (
            <p className="wa-lede">Show up day after day and your streak bonus keeps getting bigger.</p>
          )}
          {W.show.prizes && (
            <p className="wa-prize-tie">
              Every bonus point lifts you up the leaderboard. The top 3 overall win{" "}
              <strong className="wa-cash">{W.finalPrizes.map((p) => p.amount).join(", ")}</strong>.
            </p>
          )}
        </Reveal>
        {W.show.streakBonuses && <SnowballStreak />}
        <div className="wa-facts">
          {facts.map(({ Icon, tone, title, body }, i) => (
            <Reveal key={title} delay={i * 0.06} className="wa-fact">
              <span className={`wa-icon wa-icon-${tone}`}><Icon aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{body}</p>
            </Reveal>
          ))}
        </div>
        <p className="wa-small wa-center">Point values may change before the full rules are published on 27 Nov.</p>
      </div>
    </section>
  );
}

function PrizesAndRules() {
  const rules = [
    "Free to enter, always. You never pay to take part or to win.",
    `Open to residents of ${W.residency} aged ${W.minAge} and over.`,
    "Learning only. WinterArc never tells you what to buy or sell.",
  ];
  return (
    <section className="wa-section">
      <div className="wa-wrap wa-split wa-split-top">
        <Reveal>
          <h2>Free, open and honest.</h2>
          <ul className="wa-ticks">
            {rules.map((r) => (
              <li key={r}><span className="wa-tick"><PiCheckBold aria-hidden="true" /></span>{r}</li>
            ))}
          </ul>
        </Reveal>
        {W.show.prizes && (
          <Reveal delay={0.1}>
            <FrostWindow>
              <div className="wa-prize">
                <PiGiftBold className="wa-prize-icon" aria-hidden="true" />
                <p className="wa-prize-amount">{W.prizePool}</p>
                <p className="wa-prize-label">in cash prizes</p>
                <ol className="wa-prize-podium" aria-label="Final leaderboard prizes">
                  {W.finalPrizes.map((p) => (
                    <li key={p.place}><span>{p.place}</span><strong>{p.amount}</strong></li>
                  ))}
                </ol>
                <ul className="wa-prize-more">
                  <li><strong>{W.dailyPrizeTotal}</strong> in daily prizes: a winner every day</li>
                  {W.show.referralContest && W.referralContests.map((c) => (
                    <li key={c.key}><strong>{c.prize}</strong> {W.referralAwardName}: top referrer by {c.closes.split(",")[0]}</li>
                  ))}
                </ul>
                <Link className="wa-prize-link" to="/winterarc/rules#prizes">Full prize rules</Link>
              </div>
            </FrostWindow>
          </Reveal>
        )}
      </div>
    </section>
  );
}

function Certificate() {
  return (
    <section className="wa-section" id="certificate">
      <div className="wa-wrap">
        <Reveal className="wa-head">
          <h2>Finish strong. Take home a certificate.</h2>
          <p className="wa-lede">
            Complete at least {W.certificateMinDays} of the {W.totalDays} days and get a FinEd certificate of
            completion with your name on it. Every certificate is verifiable.
          </p>
        </Reveal>
        <Reveal delay={0.1}>
          <CertificateShowcase />
        </Reveal>
      </div>
    </section>
  );
}

function Join() {
  const perks = ["Your own challenge hub", "Your own invite link for friends", "Free to enter, always"];
  return (
    <section className="wa-section wa-section-join" id="join">
      <div className="wa-wrap wa-split">
        <Reveal>
          <h2>Join WinterArc.</h2>
          <p className="wa-lede">Day 1 is {W.startDate}. Make your free FinEd account, join, and you're in.</p>
          <ul className="wa-ticks">
            {perks.map((p) => (
              <li key={p}><span className="wa-tick"><PiCheckBold aria-hidden="true" /></span>{p}</li>
            ))}
          </ul>
          <HeadStart placement="landing" />
        </Reveal>
        <Reveal delay={0.1}>
          <div className="wa-form-wrap">
            <SignupForm />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Faq({ q, children }) {
  return (
    <details className="wa-faq">
      <summary>{q}</summary>
      <div className="wa-faq-body">{children}</div>
    </details>
  );
}

function Faqs() {
  return (
    <section className="wa-section">
      <div className="wa-wrap wa-narrow">
        <Reveal className="wa-head">
          <h2>Questions</h2>
        </Reveal>
        <Faq q="Does it cost anything?">
          No. Entry is free and you can win without paying anything.
          {W.show.certificatePrice &&
            ` The only paid extra is the optional completion certificate (${W.certificatePrice}), which you can choose once you've finished.`}
        </Faq>
        <Faq q="How long does a day take?">A few minutes: one short read and {W.questionsPerDay} questions.</Faq>
        <Faq q="What if I miss a day?">
          You can still do it later and earn points, within the late window in the full rules.
          {W.show.resets && ` Your ${W.startingResets} resets can repair a broken streak.`}
        </Faq>
        <Faq q="Do I need to know about finance already?">No. It starts from the basics and builds up over the month.</Faq>
        {W.show.referrals && (
          <Faq q="How do referrals work?">
            After you join, you get your own link. When a friend joins with it and finishes Day 3, you earn{" "}
            {W.referralPoints} points (up to {W.referralCap} friends), once a quick check is done.
            {W.show.referralContest &&
              ` On top of that, the ${W.referralAwardName} gives ${W.referralContestPrize} to whoever brings in the most friends (at least ${W.referralAwardMin}), twice: once for friends who join by 30 Nov, and again for friends who join from 1 to 30 Dec.`}
          </Faq>
        )}
        {W.show.certificate && (
          <Faq q="Is there a certificate?">
            If you complete at least {W.certificateMinDays} of the {W.totalDays} days, you can get a completion
            certificate after the challenge ends. It records that you finished WinterArc; it is not an accredited
            qualification, and getting one does not change your score, rank or prizes.
            {W.show.certificatePrice && ` It's optional and costs ${W.certificatePrice}, paid only after the challenge ends.`}
          </Faq>
        )}
        <Faq q="Is this investment advice?">No. WinterArc teaches how money works. It does not tell you what to buy or sell.</Faq>
      </div>
    </section>
  );
}

export default function WinterArcLanding() {
  useEffect(() => {
    document.title = `${W.name}: ${W.tagline} | FinEd`;
    // Coming back from sign-in (or a "Join" link) lands on /winterarc#join: go there
    const id = window.location.hash.slice(1);
    if (!id) return undefined;
    const t = setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: "start" }), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="wa">
      <Hero />
      <HowADayWorks />
      <Calendar />
      <Scoring />
      <PrizesAndRules />
      {W.show.certificate && <Certificate />}
      <Join />
      <Faqs />
    </div>
  );
}
