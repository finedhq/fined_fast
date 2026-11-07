// WinterArc rules. Values come from winterarcConfig.js. Points, streak and
// referral values may still change; the final rules are published on 27 Nov.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { WINTERARC as W } from "./winterarcConfig";
import "./WinterArcLanding.css";

const SECTIONS = [
  ["about", "About WinterArc"],
  ["entry", "Who can take part"],
  ["days", "How the days work"],
  ["points", "Points"],
  ["streaks", "Streaks and resets"],
  ["referrals", "Referrals"],
  ["boards", "Leaderboards and ties"],
  ["prizes", "Prizes"],
  ["fair", "Fair play and verification"],
  ["certificate", "Completion certificate"],
  ["privacy", "Your data"],
  ["changes", "Changes and contact"],
];

export default function WinterArcRules() {
  useEffect(() => {
    document.title = `${W.name} rules | FinEd`;
  }, []);

  const weeks = W.weeks.map((w) => `${w.label} (${w.from}-${w.to} Dec)`).join(", ");

  return (
    <div className="wa wa-doc-page">
      <div className="wa-wrap wa-doc">

        <h1>{W.name} rules</h1>
        <p className="wa-lede">The rules for {W.name}: {W.tagline}, a free 30-day money challenge run by FinEd from {W.startDate} to {W.endDate} 2026.</p>

        <div className="wa-doc-grid">
          <nav className="wa-doc-toc" aria-label="On this page">
            <ol>
              {SECTIONS.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
            </ol>
          </nav>

          <div className="wa-doc-body">
            <section id="about">
              <h2>1. About WinterArc</h2>
              <ul>
                <li>{W.name} is organised by FinEd (myfined.com).</li>
                <li>It is educational only. Nothing in it is investment, tax or financial advice, and it never tells you what to buy or sell.</li>
                <li>Entry is free. You never need to pay to take part or to win.</li>
              </ul>
            </section>

            <section id="entry">
              <h2>2. Who can take part</h2>
              <ul>
                <li>You must be a resident of {W.residency} and {W.minAge} or older.</li>
                <li>One account per person. Duplicate or shared accounts can be removed.</li>
                <li>FinEd team members, their family and friends can take part and win, on exactly the same rules as everyone else.</li>
              </ul>
            </section>

            <section id="days">
              <h2>3. How the days work</h2>
              <ul>
                <li>The challenge runs for {W.totalDays} days, {W.startDate} to {W.endDate} 2026. All times are India Standard Time (IST).</li>
                <li>Each day has one task: a short read, {W.questionsPerDay} questions with an explanation after each answer, and one optional action.</li>
                <li>The optional action is a tick-box and earns no points.</li>
                <li>Day {W.totalDays} is the finale quiz, open all day. It has no late window.</li>
              </ul>
            </section>

            <section id="points">
              <h2>4. Points</h2>
              <p className="wa-doc-note">The values in this section and in sections 5 and 6 may still change. The final rules will be published on {W.finalRulesDate}.</p>
              <ul>
                <li>Each correct answer earns {W.pointsPerQuestion} points. A wrong answer earns 0.</li>
                <li>{W.retryPointsNote}</li>
                <li>A task done within {W.lateFullHours} hours of its start earns full points. After that it earns {W.latePercentAfter}% until that week's Sunday cut-off, and nothing after.</li>
                <li>The finale quiz is worth {W.finalePoints} points.</li>
                <li>{W.name} points are kept separately and added to your FinStars only after results are verified.</li>
                <li>There is no daily or weekly cap on points.</li>

              </ul>
            </section>

            {(W.show.streakBonuses || W.show.resets) && (
              <section id="streaks">
                <h2>5. Streaks and resets</h2>
                <ul>
                  <li>A day counts towards your streak if you finish its task by {W.streakGrace}.</li>
                  {W.show.streakBonuses && (
                    <li>Streak bonuses: {W.streakBonuses.map((b) => `+${b.points} at ${b.days} days`).join(", ")}.</li>
                  )}
                  {W.show.resets && (
                    <>
                      <li>Everyone starts with {W.startingResets} resets. One reset repairs one missed day and restores your streak only.</li>
                      <li>You choose when to use a reset. A task done late after a reset earns {W.lateResetPercent}% of its points.</li>
                      <li>One extra reset is given to each weekly top-3 finisher, and to everyone who completes every task in a leaderboard week.</li>
                      <li>Bonus points from a reset count in the week the reset is used, never in a week that has already closed.</li>
                      <li>Unused resets expire at {W.resetsExpire}.</li>
                    </>
                  )}
                </ul>
              </section>
            )}

            {W.show.referrals && (
              <section id="referrals">
                <h2>6. Referrals</h2>
                <ul>
                  <li>Everyone gets a personal invite link.</li>
                  <li>A referral counts once your friend finishes Day 3 and passes a manual check.</li>
                  <li>You earn {W.referralPoints} points per counted referral, up to {W.referralCap} referrals.</li>
                  <li>Referral points show as pending until checked. They count in the week the check passes, never in a closed week.</li>
                  <li>You cannot refer yourself, and each person can only be referred once.</li>
                </ul>
              </section>
            )}

            <section id="boards">
              <h2>7. Leaderboards and ties</h2>
              <ul>
                <li>Weekly leaderboards: {weeks}.</li>
                <li>Each weekly board closes on Sunday night and winners are announced on Monday.</li>
                <li>A final leaderboard adds up all {W.totalDays} days and closes at the end of {W.endDate}. All late windows end then too.</li>
                <li>Ties are broken in this order: higher score; then more tasks completed on time; then whoever reached that score first. If still tied, the prize is split equally.</li>
              </ul>
            </section>

            {W.show.prizes && (
              <section id="prizes">
                <h2>8. Prizes</h2>
                <ul>
                  <li>Total prize pool: {W.prizePool} in cash, for weekly winners and final top scorers.</li>
                  <li>Winners are decided by score only.</li>
                  <li>Prizes are paid by UPI to verified winners, using details they choose to share after winning.</li>
                  <li>The exact split of the prize pool between places and weeks will be announced before {W.startDate}.</li>
                  <li>FinEd does not deduct tax from prizes. Any tax due on winnings is the winner's own responsibility.</li>
                  <li>Winners are contacted after verification. If a winner does not reply within {W.winnerResponseHours} hours, the prize may pass to the next eligible person.</li>
                </ul>
              </section>
            )}

            <section id="fair">
              <h2>9. Fair play and verification</h2>
              <ul>
                <li>Every winner is verified before points are credited or any prize is paid.</li>
                <li>FinEd may disqualify an account, remove its points or withhold a prize for: more than one account per person, fake or self-referrals, automated or scripted entries, or any other attempt to game the challenge.</li>
                <li>FinEd's decision on verification and disqualification is final.</li>
              </ul>
            </section>

            {W.show.certificate && (
              <section id="certificate">
                <h2>10. Completion certificate</h2>
                <ul>
                  <li>Anyone who completes at least {W.certificateMinDays} of the {W.totalDays} days can get a completion certificate after the challenge ends.</li>
                  <li>It records that you completed {W.name}. It is not an accredited qualification.</li>
                  <li>Getting a certificate never changes your points, rank or prize chances.</li>
                  <li>The certificate is paid. The expected price is {W.certificatePrice}, confirmed when it goes on sale.</li>
                </ul>
              </section>
            )}

            <section id="privacy">
              <h2>11. Your data</h2>
              <ul>
                <li>We collect your name, email, college (optional) and how you heard about {W.name}, to run the challenge and contact you about it.</li>
                <li>UPI details are collected only from winners, only with their consent, and only to pay prizes.</li>
                <li>Reports shared with partner colleges are aggregated and never include your email.</li>
                <li>The <Link to="/privacy-policy">privacy policy</Link> has a WinterArc section covering what we collect, why, and how long we keep it.</li>
              </ul>
            </section>

            <section id="changes">
              <h2>12. Changes and contact</h2>
              <ul>
                <li>FinEd may update these rules. Any change will be announced on this page before it takes effect, and will never apply to a leaderboard week that has already closed.</li>
                <li>Questions? <Link to="/contact">Contact us</Link>.</li>
                <li>These rules are governed by the laws of India.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
