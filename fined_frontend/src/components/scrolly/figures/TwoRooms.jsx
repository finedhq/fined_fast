// Chapter 3 figure — "two_rooms_money_flow" (port of the prototype's
// TwoRoomsFigure.js). A small primary room (company ↔ first investors) and a
// big, busy secondary room (investor ↔ investor). Corrects "buying a share
// sends money to the company" by showing where a ₹ token actually goes.
// Steps are by position: 0 the catch · 1 the fix · 2 guess first · 3 so why bother.
// Answering step 3's tap-to-guess sends two tokens across the crowded room.
import { useEffect, useState } from "react";
import { crowdDots, rand } from "./figureMath";

const CROWD = crowdDots();

// A ₹ token that slides from `from` to `to` (percent of the room's width).
function MoneyToken({ from, to, top }) {
  const [left, setLeft] = useState(from);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setLeft(to));
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <div className="money-token" style={{ left: `${left}%`, top: `${top}%` }}></div>;
}

function Crowd() {
  return CROWD.map((d, i) => <div key={i} className={`crowd-dot crowd-dot--${d.kind}`} style={{ left: `${d.left}%`, top: `${d.top}%` }}></div>);
}

export default function TwoRooms({ step, steps, state }) {
  // Tokens flying after the guess is answered: [{ id, from, to, top }]
  const [flying, setFlying] = useState([]);
  const [batch, setBatch] = useState(0);
  const [dimmed, setDimmed] = useState(false);
  const [lastStep, setLastStep] = useState(step);

  // Entering any step resets the primary room's dimming, as in the prototype.
  if (step !== lastStep) {
    setLastStep(step);
    if (dimmed) setDimmed(false);
  }

  // Only a fresh answer animates (not an answer restored from earlier).
  const guessStepId = steps?.[2]?.step_id;
  const answer = guessStepId ? state.guesses?.[guessStepId] : undefined;
  const [lastAnswer, setLastAnswer] = useState(answer);
  if (answer !== lastAnswer) {
    setLastAnswer(answer);
    if (lastAnswer === undefined && answer !== undefined) {
      setBatch(batch + 1);
      setDimmed(true);
      if (flying.length <= 2) {
        // don't pile up on repeated answers
        setFlying([
          ...flying,
          ...[0, 1].map((i) => ({ id: `${batch + 1}-${i}`, from: 15 + rand(i * 3) * 20, to: 55 + rand(i * 7) * 25, top: 20 + rand(i * 5) * 50 })),
        ]);
      }
    }
  }

  // Each token disappears 1.6 s after it starts, like the prototype.
  useEffect(() => {
    if (!flying.length) return undefined;
    const timer = setTimeout(() => setFlying([]), 1600);
    return () => clearTimeout(timer);
  }, [flying]);

  const s = step; // undefined = not reached yet: the rooms as first built
  const primaryVisible = s !== 1;
  const primaryLit = s === 2 || s === 3;
  const primaryLabel = s === undefined ? "Primary room" : s === 2 || s === 3 ? "Primary room · company sells new shares" : "";
  const secondaryLabel =
    s === undefined ? "Secondary room" : s === 1 ? "The stock exchange — one crowded room" : s === 2 || s === 3 ? "Secondary room · people trade with each other" : "";

  let primaryStage = null;
  if (s === 0) {
    primaryStage = (
      <div className="lone-holder">
        <div className="investor-avatar-badge">
          <span className="avatar-initial" aria-hidden="true">
            A
          </span>
          <span className="avatar-name">Arjun</span>
        </div>
        <div className="lone-holder-note">holds a slice, needs a buyer</div>
      </div>
    );
  } else if (s === 2 || s === 3) {
    primaryStage = (
      <div className="primary-flow">
        <span className="flow-node">Company</span>
        <span className="flow-arrow" aria-hidden="true"></span>
        <span className="flow-node">First investors</span>
      </div>
    );
  }

  let secondaryStage = null;
  if (s === 0) {
    secondaryStage = (
      <>
        <div className="qbubble" style={{ left: "20%", top: "20%" }}>?</div>
        <div className="qbubble" style={{ left: "55%", top: "35%" }}>?</div>
        <div className="qbubble" style={{ left: "75%", top: "65%" }}>?</div>
        <div className="qbubble" style={{ left: "35%", top: "70%" }}>?</div>
      </>
    );
  } else if (s === 1) {
    secondaryStage = (
      <>
        <Crowd />
        <MoneyToken key="fix-token" from={10} to={60} top={50} />
      </>
    );
  } else if (s === 2 || s === 3) {
    secondaryStage = <Crowd />;
  }

  return (
    <div className="rooms-figure">
      <div
        className={`room room--primary${primaryLit && !dimmed ? " lit" : ""}${dimmed ? " dimmed" : ""}`}
        style={{ display: primaryVisible ? "block" : "none" }}
      >
        <div className="room-label">{primaryLabel}</div>
        <div className="room-stage">{primaryStage}</div>
      </div>
      <div className="room room--secondary">
        <div className="room-head">
          <div className="room-label">{secondaryLabel}</div>
          <div className="room-legend" style={{ display: s === 1 || s === 2 || s === 3 ? "flex" : "none" }}>
            <span className="legend-item legend-item--buyer">Buyers</span>
            <span className="legend-item legend-item--seller">Sellers</span>
          </div>
        </div>
        <div className="room-stage">
          {secondaryStage}
          {flying.map((t) => (
            <MoneyToken key={t.id} from={t.from} to={t.to} top={t.top} />
          ))}
        </div>
      </div>
      <div className="rooms-loop" style={{ display: s === 3 ? "block" : "none" }}>
        easy exit → willing investors → companies raise money
      </div>
    </div>
  );
}
