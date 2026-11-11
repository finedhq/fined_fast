// One WinterArc day (/winterarc/day/:day): the day's module drawn by the
// normal module page in its `challenge` mode. Questions arrive without their
// answers; each try goes to the server, which marks it and sends the answer
// and explanation only once the question is finished.
import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { WINTERARC as W } from "./winterarcConfig";
import { answerWinterArcQuestion, getWinterArcDay } from "../../services/api";
import WinterArcGate, { JoinFirst, WinterArcMessage } from "./WinterArcGate";

const ScrollyModulePage = lazy(() => import("../../components/scrolly/ScrollyModulePage"));

const opensLabel = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

const tryAgain = (q) =>
  q.on_offer
    ? `Not quite. ${q.tries_left} ${q.tries_left === 1 ? "try" : "tries"} left. A right answer now earns ${q.on_offer} points.`
    : `Not quite. ${q.tries_left} ${q.tries_left === 1 ? "try" : "tries"} left.`;

function DayDone({ day, questions }) {
  const list = Object.values(questions);
  const finished = list.filter((q) => q.finished).length;
  const points = list.reduce((s, q) => s + (q.points || 0), 0);
  const done = list.length > 0 && finished === list.length;
  return (
    <section className="wa-day-done" data-part="winterarc-done">
      <div className="wa-day-done-card">
        <h2>{done ? `Day ${day} done` : `Day ${day}: ${finished} of ${list.length} questions done`}</h2>
        <p>{done ? `You earned ${points} points today.` : "Answer every question to finish the day."}</p>
        <Link className="wa-day-done-btn" to="/winterarc/challenge">Back to {W.name}</Link>
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

  const challenge = useMemo(() => {
    const list = Object.values(questions);
    return {
      questions,
      onAnswer,
      points: list.reduce((s, q) => s + (q.points || 0), 0),
      maxPoints: list.reduce((s, q) => s + (q.finished ? q.points || 0 : q.on_offer || 0), 0),
      done: <DayDone day={n} questions={questions} />,
    };
  }, [questions, onAnswer, n]);

  if (error?.status === 403) return <JoinFirst />;
  if (error?.status === 423 || error?.status === 404) {
    const opens = /opens at (.+)\.$/.exec(error.message || "")?.[1];
    return (
      <WinterArcMessage
        title={error.status === 404 ? "There's no such day" : `Day ${n} isn't open yet`}
        actions={<Link className="wa-btn wa-btn-primary" to="/winterarc/challenge">Back to {W.name}</Link>}
      >
        {opens ? `It opens ${opensLabel(opens)} IST.` : `WinterArc runs from ${W.startDate} to ${W.endDate}.`}
      </WinterArcMessage>
    );
  }
  if (error) {
    return (
      <WinterArcMessage title="Something went wrong" actions={<Link className="wa-btn wa-btn-ghost" to="/winterarc/challenge">Back to {W.name}</Link>}>
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
