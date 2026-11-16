// The referral contest running now (Nov pre-launch, then December): a dark ink card with the prize in big gold
// numerals, so it reads at a glance next to the white cards around it. The
// landing's gold prize ticket is the challenge prize pool; this is its
// counterpart for the referral contest. Shown only while the contest runs.
//   compact   smaller, for the hub's invite card
//   standing  { friends, rank } from the hub: where this person is so far
import { PiFlagCheckeredFill } from "react-icons/pi";
import { CURRENT_REFERRAL_CONTEST as C, WINTERARC as W } from "./winterarcConfig";
import "./ContestCard.css";

// Days left, worked out once when the page loads
const DAYS_LEFT = C ? Math.max(0, Math.ceil((Date.parse(C.endsAt) - Date.now()) / 86400000)) : 0;

export default function ContestCard({ compact = false, standing = null }) {
  if (!C) return null;
  const left = DAYS_LEFT <= 1 ? "Ends today" : `${DAYS_LEFT} days left`;
  return (
    <div className={`wa-race${compact ? " is-compact" : ""}`}>
      <div className="wa-race-prize">
        <span className="wa-race-amount">{C.prize}</span>
        <span className="wa-race-left"><PiFlagCheckeredFill aria-hidden="true" /> {left}</span>
      </div>
      <div className="wa-race-text">
        <p className="wa-race-title">The {W.referralAwardName}: bring the most friends, win {C.prize}</p>
        <p className="wa-race-rule">
          Closes {C.closes}. A friend counts once they join with your link using their FinEd account. You need at
          least {W.referralAwardMin} friends to win.
        </p>
        {standing && (
          <p className="wa-race-standing">
            {standing.friends
              ? `You: ${standing.friends} ${standing.friends === 1 ? "friend" : "friends"} so far${standing.rank ? `, #${standing.rank} right now` : ""}.`
              : "You haven't brought anyone in yet. Your link is below."}
          </p>
        )}
      </div>
    </div>
  );
}
