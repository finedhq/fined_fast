import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { FiBell, FiCheckCircle } from 'react-icons/fi';
import { notifyRewardInterest } from '../../../services/api';
import HowItWorksBanner from './HowItWorksBanner';

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
    toast.success("🎉 You're on the priority list! We'll notify you as soon as brand vouchers go live.", {
      duration: 4500,
      style: {
        borderRadius: '14px',
        background: '#1e1b4b',
        color: '#ffffff',
        fontWeight: '600'
      }
    });
  };

  return (
    <section className="redeem-section" id="redeem-rewards-section">
      <div className="section-top-row">
        <div className="section-heading-group">
          <h2 className="section-title">Redeem Rewards</h2>
          <p className="section-subtitle">
            Use your FinStars to get exciting vouchers, coupons and exclusive merchandise.
          </p>
        </div>

        {/* Current user FinStars balance pill */}
        <div className="balance-pill-badge">
          <img src="/dash-finstar.svg" alt="FinStars" className="balance-star-img" />
          <span>{userStars} FinStars</span>
        </div>
      </div>

      {/* Single Teaser Card (Coming Soon) */}
      <div className="rewards-teaser-card">
        <div className="coming-soon-badge-pill">
          <span>🚀 Coming Soon</span>
        </div>

        {/* Partner Brand Badges */}
        <div className="teaser-brand-logos-row">
          <div className="teaser-brand-pill brand-amazon">Amazon Pay</div>
          <div className="teaser-brand-pill brand-flipkart">Flipkart</div>
          <div className="teaser-brand-pill brand-myntra">Myntra</div>
          <div className="teaser-brand-pill brand-zomato">Zomato</div>
          <div className="teaser-brand-pill brand-netflix">Netflix</div>
        </div>

        <h3 className="teaser-title">Top Brand Vouchers & Subscriptions</h3>
        <p className="teaser-desc">
          We are partnering with your favorite brands for instant gift cards, shopping discounts, streaming subscriptions, and dining rewards. Keep learning and stacking up your FinStars!
        </p>

        <div className="teaser-star-tier-pill">
          <img src="/dash-finstar.svg" alt="FinStars" className="teaser-star-icon-img" />
          <span>Redemptions starting from 150 FinStars</span>
        </div>

        <button 
          className="teaser-notify-btn"
          onClick={handleNotify}
          disabled={notified}
          type="button"
        >
          {notified ? (
            <>
              <FiCheckCircle size={18} />
              <span>Notification Alert Active</span>
            </>
          ) : (
            <>
              <FiBell size={18} />
              <span>Notify Me When Live</span>
            </>
          )}
        </button>
      </div>

      {/* How it Works Banner */}
      <HowItWorksBanner />
    </section>
  );
};

export default RedeemSection;
