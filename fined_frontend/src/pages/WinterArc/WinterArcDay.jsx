// One WinterArc day (/winterarc/day/:day): the day's module drawn by the
// normal module page in its `challenge` mode. Questions arrive without their
// answers; each try goes to the server, which marks it and sends the answer
// and explanation only once the question is finished.
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { WINTERARC as W } from "./winterarcConfig";
import { answerWinterArcQuestion, getWinterArcDay, tickWinterArcAction } from "../../services/api";
import WinterArcGate, { JoinFirst, WinterArcMessage } from "./WinterArcGate";

const ScrollyModulePage = lazy(() => import("../../components/scrolly/ScrollyModulePage"));

const opensLabel = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const tryAgain = (q) =>
  q.on_offer
    ? `Not quite. ${q.tries_left} ${q.tries_left === 1 ? "try" : "tries"} left. A right answer now earns ${q.on_offer} points.`
    : `Not quite. ${q.tries_left} ${q.tries_left === 1 ? "try" : "tries"} left.`;

// The day's optional real-life action: an "I did this" tick-box, no points.
function DayAction({ day, action, onChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const toggle = async (e) => {
    const done = e.target.checked;
    setBusy(true);
    setError("");
    try {
      await tickWinterArcAction(day, done);
      onChange(done);
    } catch (err) {
      setError(err.message || "Couldn't save that. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`wa-day-action${action.done ? " is-done" : ""}`}>
      <p className="wa-day-action-label">Today's action (optional)</p>
      <p className="wa-day-action-text">{action.text}</p>
      <label className="wa-day-action-check">
        <input type="checkbox" checked={action.done} disabled={busy} onChange={toggle} />
        <span>{action.done ? "Done. Nice one." : "I did this"}</span>
      </label>
      {error && <p className="wa-day-action-error" role="alert">{error}</p>}
    </div>
  );
}

// The end of a day: points earned and what's next once every question is
// finished; question pips until then. The optional action sits in between.
function DayDone({ day, opensAt, questions, action, onAction }) {
  const list = Object.values(questions);
  const finished = list.filter((q) => q.finished).length;
  const points = list.reduce((s, q) => s + (q.points || 0), 0);
  const done = list.length > 0 && finished === list.length;
  const nextOpens = opensAt ? new Date(new Date(opensAt).getTime() + 24 * 3600 * 1000) : null;
  const next = day >= W.totalDays
    ? "That was the finale. Final results come after the checks."
    : nextOpens
      ? `Day ${day + 1} opens ${nextOpens.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST.`
      : null;
  return (
    <section className={`wa-day-done${done ? " is-done" : ""}`} data-part="winterarc-done">
      <div className="wa-day-done-card">
        {done ? (
          <>
            <p className="wa-done-points" aria-label={`${points} points today`}>
              <span>+{points}</span>
              <small>points</small>
            </p>
            <h2>Day {day} done</h2>
            {next && <p className="wa-done-next">{next}</p>}
          </>
        ) : (
          <>
            <div className="wa-done-pips" aria-hidden="true">
              {list.map((q, i) => <span key={i} className={q.finished ? "is-on" : ""} />)}
            </div>
            <h2>{finished} of {list.length} questions done</h2>
            <p className="wa-done-next">Answer every question to finish Day {day}.</p>
          </>
        )}
        {action && <DayAction day={day} action={action} onChange={onAction} />}
        <div className="wa-done-actions">
          <Link className="wa-day-done-btn" to="/winterarc/challenge">Back to {W.name}</Link>
          <Link className="wa-done-link" to="/winterarc/leaderboard">See the leaderboard</Link>
        </div>
      </div>
    </section>
  );
}

function Day() {
  const { day } = useParams();
  const n = Number(day);
  const { user } = useAuth0();
  const [bundle, setBundle] = useState(null);
  const [questions, setQuestions] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = `Day ${n} | ${W.name} | FinEd`;
    let live = true;
    setBundle(null);
    setError(null);
    getWinterArcDay(n)
      .then((data) => {
        if (!live) return;
        setBundle(data);
        setQuestions(data.questions || {});
      })
      .catch((e) => live && setError(e));
    return () => {
      live = false;
    };
  }, [n]);

  const onAnswer = useCallback(
    async (card, answer) => {
      const id = card.card_id;
      setQuestions((qs) => ({ ...qs, [id]: { ...qs[id], busy: true, error: null } }));
      try {
        const res = await answerWinterArcQuestion(n, id, answer);
        setQuestions((qs) => ({
          ...qs,
          [id]: { ...res, feedback: res.finished ? null : tryAgain(res), tried: res.finished ? [] : [...(qs[id]?.tried || []), answer] },
        }));
        if (res.finished) {
          // The answer key and explanation arrive now: show the card answered
          setBundle((b) => ({
            ...b,
            cards: b.cards.map((c) => (c.card_id === id ? { ...c, card_data: res.card_data, status: "completed", userAnswer: res.answer } : c)),
          }));
        }
      } catch (e) {
        setQuestions((qs) => ({ ...qs, [id]: { ...qs[id], busy: false, error: e.message || "Couldn't send your answer. Please try again." } }));
      }
    },
    [n]
  );

  const action = bundle?.action;
  const onAction = useCallback((done) => setBundle((b) => ({ ...b, action: { ...b.action, done } })), []);

  const challenge = useMemo(() => {
    const list = Object.values(questions);
    return {
      questions,
      onAnswer,
      points: list.reduce((s, q) => s + (q.points || 0), 0),
      maxPoints: list.reduce((s, q) => s + (q.finished ? q.points || 0 : q.on_offer || 0), 0),
      done: <DayDone day={n} opensAt={bundle?.opens_at} questions={questions} action={action} onAction={onAction} />,
    };
  }, [questions, onAnswer, n, action, onAction, bundle?.opens_at]);

  if (error?.status === 403) return <JoinFirst />;
  if (error?.status === 423 || error?.status === 404) {
    const opens = /opens at (.+)\.$/.exec(error.message || "")?.[1];
    return (
      <WinterArcMessage
        icon="wait"
        title={error.status === 404 ? "There's no such day" : `Day ${n} isn't open yet`}
        actions={<Link className="wa-btn wa-btn-primary" to="/winterarc/challenge">Back to {W.name}</Link>}
      >
        {opens ? `It opens ${opensLabel(opens)} IST.` : `WinterArc runs from ${W.startDate} to ${W.endDate}.`}
      </WinterArcMessage>
    );
  }
  if (error) {
    return (
      <WinterArcMessage icon="error" title="Something went wrong" actions={<Link className="wa-btn wa-btn-ghost" to="/winterarc/challenge">Back to {W.name}</Link>}>
        {error.message || "Couldn't load this day."}
      </WinterArcMessage>
    );
  }
  if (!bundle) return null;

  return (
    <>
      {bundle.preview && <div className="wa-preview-bar">Admin preview: learners can't open Day {n} yet.</div>}
      <Suspense fallback={null}>
        <ScrollyModulePage
          key={bundle.module_id}
          bundle={bundle}
          email={user?.email}
          backTo="/winterarc/challenge"
          challenge={challenge}
        />
      </Suspense>
    </>
  );
}

export default function WinterArcDay() {
  return (
    <WinterArcGate>
      <Day />
    </WinterArcGate>
  );
}
