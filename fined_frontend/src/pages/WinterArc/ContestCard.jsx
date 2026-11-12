// The pre-launch referral contest: a dark ink card with the prize in big gold
// numerals, so it reads at a glance next to the white cards around it. The
// landing's gold prize ticket is the challenge prize pool; this is its
// counterpart for the referral contest. Shown only while the contest runs.
//   compact   smaller, for the hub's invite card
//   standing  { friends, rank } from the hub: where this person is so far
import { PiFlagCheckeredFill } from "react-icons/pi";
import { REFERRAL_CONTEST_OPEN, WINTERARC as W } from "./winterarcConfig";
import "./ContestCard.css";

// Days left, worked out once when the page loads
const DAYS_LEFT = Math.max(0, Math.ceil((Date.parse(W.referralContestEndsAt) - Date.now()) / 86400000));

export default function ContestCard({ compact = false, standing = null }) {
  if (!REFERRAL_CONTEST_OPEN) return null;
  const left = DAYS_LEFT <= 1 ? "Ends today" : `${DAYS_LEFT} days left`;
  return (
    <div className={`wa-race${compact ? " is-compact" : ""}`}>
      <div className="wa-race-prize">
        <span className="wa-race-amount">{W.referralContestPrize}</span>
        <span className="wa-race-left"><PiFlagCheckeredFill aria-hidden="true" /> {left}</span>
      </div>
      <div className="wa-race-text">
        <p className="wa-race-title">Bring the most friends, win {W.referralContestPrize}</p>
        <p className="wa-race-rule">
          Closes {W.referralContestCloses}. A friend counts once they join with your link and make a FinEd account with
          the same email.
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
