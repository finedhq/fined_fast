import React from 'react';
import { FiTag, FiChevronRight } from 'react-icons/fi';

const HowItWorksBanner = () => {
  return (
    <div className="how-it-works-banner">
      <div className="how-it-works-tag">
        <div className="tag-icon-circle">
          <FiTag />
        </div>
        <span>How it works?</span>
      </div>

      <div className="how-steps-flow">
        <div className="how-step-item">
          <span className="how-step-number">1</span>
          <span>Choose a reward you like</span>
        </div>

        <FiChevronRight className="how-step-arrow" />

        <div className="how-step-item">
          <span className="how-step-number">2</span>
          <span>Click on Redeem Now</span>
        </div>

        <FiChevronRight className="how-step-arrow" />

        <div className="how-step-item">
          <span className="how-step-number">3</span>
          <span>Confirm & exchange FinStars</span>
        </div>

        <FiChevronRight className="how-step-arrow" />

        <div className="how-step-item">
          <span className="how-step-number">4</span>
          <span>Get your voucher instantly!</span>
        </div>
      </div>
    </div>
  );
};

export default HowItWorksBanner;
