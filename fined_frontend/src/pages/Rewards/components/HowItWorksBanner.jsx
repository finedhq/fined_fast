const STEPS = [
  'Choose a reward you like',
  'Click on Redeem Now',
  'Confirm & exchange FinStars',
  'Get your voucher instantly!',
];

const HowItWorksBanner = () => (
  <div className="rw-how">
    <h4 className="rw-how-title">How it works?</h4>
    <ol className="rw-how-steps">
      {STEPS.map((step, i) => (
        <li key={step}>
          <span className="rw-how-num" aria-hidden="true">{i + 1}</span>
          {step}
        </li>
      ))}
    </ol>
  </div>
);

export default HowItWorksBanner;
