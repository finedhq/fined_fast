import { useState } from 'react';
import toast from 'react-hot-toast';
import { PiBellRingingBold, PiCheckCircleBold, PiRocketLaunchFill, PiStarFill } from 'react-icons/pi';
import { notifyRewardInterest } from '../../../services/api';
import HowItWorksBanner from './HowItWorksBanner';
import { REDEEM_MIN_STARS } from './StatsBanner';

const BRANDS = ['Amazon Pay', 'Flipkart', 'Myntra', 'Zomato', 'Netflix'];

const RedeemSection = ({ userStars = 0, userEmail = "" }) => {
  const [notified, setNotified] = useState(false);

  const handleNotify = async () => {
    setNotified(true);
    try {
      if (userEmail) {
        await notifyRewardInterest(userEmail);
      }
    } catch (e) {
      console.warn("Could not save notification to backend:", e);
    }
    toast.success("You're on the priority list! We'll notify you as soon as brand vouchers go live.", {
      duration: 4500,
      style: {
        borderRadius: '14px',
        background: '#171321',
        color: '#ffffff',
        fontWeight: '600'
      }
    });
  };

  return (
    <section className="rw-section rw-redeem" id="redeem-rewards-section" aria-labelledby="rw-redeem-title">
      <div className="rw-section-head">
        <h2 id="rw-redeem-title" className="rw-section-title">Redeem Rewards</h2>
        <span className="rw-balance-chip"><PiStarFill aria-hidden="true" /> {userStars} FinStars</span>
      </div>
      <p className="rw-section-sub">Use your FinStars to get exciting vouchers, coupons and exclusive merchandise.</p>

      <div className="rw-panel rw-soon">
        <span className="rw-soon-badge"><PiRocketLaunchFill aria-hidden="true" /> Coming soon</span>
        <h3 className="rw-soon-title">Top Brand Vouchers &amp; Subscriptions</h3>
        <p className="rw-soon-desc">
          We are partnering with your favorite brands for instant gift cards, shopping discounts, streaming subscriptions, and dining rewards. Keep learning and stacking up your FinStars!
        </p>

        <ul className="rw-brands" aria-label="Partner brands">
          {BRANDS.map((brand) => <li key={brand}>{brand}</li>)}
        </ul>

        <p className="rw-soon-min"><PiStarFill aria-hidden="true" /> Redemptions starting from {REDEEM_MIN_STARS} FinStars</p>

        <button
          className={`rw-btn${notified ? ' is-done' : ''}`}
          onClick={handleNotify}
          disabled={notified}
          type="button"
        >
          {notified
            ? <><PiCheckCircleBold aria-hidden="true" /> Notification Alert Active</>
            : <><PiBellRingingBold aria-hidden="true" /> Notify Me When Live</>}
        </button>

        <HowItWorksBanner />
      </div>
    </section>
  );
};

export default RedeemSection;
