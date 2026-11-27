// WinterArc Day 7 "The Indian Financial Ecosystem": the three chapter
// figures. Every regulator, route and clock is real (sources in the spec:
// RB-IOS 2026, SEBI SCORES 2.0, the insurance ombudsman route, NPCI's
// profile, 1930). Amounts in tickets are made up.

const TOWERS = [
  { id: "rbi", label: "RBI", remit: "banks, lenders, payments" },
  { id: "sebi", label: "SEBI", remit: "markets, brokers, mutual funds" },
  { id: "irdai", label: "IRDAI", remit: "insurance" },
  { id: "pfrda", label: "PFRDA", remit: "pensions, including NPS" },
];

// Chapter 1 · "Referees and players" (CityMap.jsx).
export const WA7_CH1_CITY = {
  towers: TOWERS,
  players: [
    { id: "bank", label: "Arjun's bank", tower: "rbi", why: "Banks are the RBI's." },
    { id: "nbfc", label: "Loan-app lender (NBFC)", tower: "rbi", why: "Lenders that aren't banks are mostly the RBI's too." },
    { id: "npci", label: "UPI network (NPCI)", tower: "rbi", why: "UPI runs on NPCI's network. NPCI was set up by the RBI and the Indian Banks' Association and is authorised by the RBI." },
    { id: "broker", label: "Stockbroker", tower: "sebi", why: "Brokers are SEBI's." },
    { id: "exchange", label: "Stock exchange (NSE, BSE)", tower: "sebi", why: "Stock exchanges are SEBI's. They also help police brokers." },
    { id: "fund", label: "Mutual fund house", tower: "sebi", why: "Mutual funds are SEBI's." },
    { id: "insurer", label: "Health insurer", tower: "irdai", why: "Insurers are IRDAI's." },
    { id: "nps", label: "NPS pension account", tower: "pfrda", why: "NPS is a pension scheme, so PFRDA watches it." },
  ],
  notes: [
    "Money City: four referees, each with its own patch.",
    "Who watches whom? Tap a player, then its referee.",
    "The roads light up.",
    "One more building. Where does AMFI go?",
    "What a referee does, and doesn't.",
  ],
  texts: {
    after_done: "Placed. Scroll on to see the real roads.",
    score: "You placed {n} of {of} on the right road.",
    not_sorted: "You haven't placed the players in 1.2. Here are the real roads.",
    amfi_right: "Right. Many people get this one wrong.",
    amfi_close: "Close: AMFI lives in SEBI's district, but it's the industry's own body, not the referee.",
    amfi_other: "AMFI is the fund houses' association. SEBI is the referee.",
    amfi_body: "AMFI is the association of mutual fund houses. It isn't a regulator. It registers mutual fund distributors, who get an ARN, and runs investor-awareness work. SEBI regulates mutual funds.",
    fake_banner: "SEBI-approved! 5% a month guaranteed",
  },
};

// Chapter 2 · "Follow Arjun's day" (RouteDay.jsx). A route without `button`
// plays when the step is reached.
export const WA7_CH2_ROUTES = {
  routes: [
    {
      id: "chai",
      time: "9:00",
      label: "₹60 chai, by UPI",
      tower: "rbi",
      towerLabel: "RBI",
      stops: ["Arjun's phone", "UPI app", "NPCI network", "Arjun's bank", "Stall's bank"],
      button: "Pay ₹60",
      after: "It crossed the RBI's roads: a UPI app, NPCI's network and two banks.",
    },
    {
      id: "policy",
      time: "13:00",
      label: "His health policy renews",
      tower: "irdai",
      towerLabel: "IRDAI",
      stops: ["Arjun's bank", "Health insurer"],
      after: "An insurance road: IRDAI's. No GST on it since September 2025. Remember Day 5?",
    },
    {
      id: "fund",
      time: "18:00",
      label: "₹500 into a mutual fund",
      tower: "sebi",
      towerLabel: "SEBI",
      stops: ["Arjun's bank", "Investing app", "Mutual fund house", "Units for Arjun"],
      button: "Invest ₹500",
      badge: "A distributor on this road shows an ARN from AMFI.",
      after: "A market road: SEBI's. Day 15 covers how to read a fund.",
    },
  ],
  notes: ["9:00 on an ordinary Monday.", "13:00.", "18:00.", "Zoom out."],
  texts: { counter: "3 referees · 1 Monday. Each watches only its own roads, which matters most when something goes wrong." },
};

// Chapter 3 · "Complaint Router" (ComplaintDesk.jsx).
const REGULATORS = ["rbi_omb", "scores", "ins_omb", "amfi"];
export const WA7_CH3_DESK = {
  chips: [
    { id: "company", label: "The company itself" },
    { id: "rbi_omb", label: "RBI Ombudsman" },
    { id: "scores", label: "SEBI SCORES" },
    { id: "ins_omb", label: "Insurance Ombudsman / Bima Bharosa" },
    { id: "c1930", label: "Cybercrime helpline 1930" },
    { id: "police", label: "Police station" },
    { id: "amfi", label: "AMFI" },
  ],
  tickets: [
    {
      id: "t1",
      label: "Ticket 1",
      short: "₹500 wrong charge",
      text: "Arjun's bank took ₹500 for an SMS alert pack he never asked for.",
      rung1: ["company"],
      rung2: ["rbi_omb"],
      regulators: REGULATORS,
      feedback: {
        skipped: "The Ombudsman only takes a complaint after you've gone to the bank. Start there.",
        right: "Bank first. If there's no reply in 30 days, or the reply doesn't fix it, the RBI Ombudsman. It's free.",
        other: "Not quite. A bank charge goes to the bank first, then up the RBI's ladder.",
        wrong: { scores: "SCORES is SEBI's, for markets. Banks are the RBI's.", ins_omb: "That route is for insurance. Banks are the RBI's.", amfi: "AMFI is the fund houses' association, not a complaint route." },
      },
    },
    {
      id: "t2",
      label: "Ticket 2",
      short: "₹1,200 failed UPI payment",
      text: "₹1,200 left Arjun's account for a UPI payment that failed. It hasn't come back.",
      rung1: ["company"],
      rung2: ["rbi_omb"],
      regulators: REGULATORS,
      feedback: {
        skipped: "Not yet: his bank or the payment app gets the first chance to fix it.",
        right: "His bank or the payment app first. If it isn't fixed in 30 days, the RBI Ombudsman, against the bank.",
        other: "Not quite. Payments are on the RBI's roads.",
        wrong: { scores: "SCORES is SEBI's, for markets. UPI is the RBI's.", ins_omb: "That route is for insurance. UPI is the RBI's." },
      },
    },
    {
      id: "t3",
      label: "Ticket 3",
      short: "Rejected health claim",
      text: "His insurer rejected a claim, saying a waiting period applied. He's had the policy 4 years.",
      rung1: ["company"],
      rung2: ["ins_omb"],
      regulators: REGULATORS,
      feedback: {
        skipped: "Not yet: the insurer gets the first chance to fix it.",
        right: "The insurer first, then the Insurance Ombudsman, or Bima Bharosa to register it with IRDAI. Waiting periods are capped at 36 months: Day 5's Claim Machine showed it.",
        other: "Not quite. Insurance has its own ladder.",
        wrong: { rbi_omb: "The RBI's ombudsman is for banks and payments. This is insurance.", scores: "SCORES is SEBI's, for markets. This is insurance." },
      },
    },
    {
      id: "t4",
      label: "Ticket 4",
      short: "A trade he never placed",
      text: "Arjun's trading account shows a trade he didn't place.",
      rung1: ["company"],
      rung2: ["scores"],
      regulators: REGULATORS,
      feedback: {
        skipped: "Not yet: the broker gets the first chance to answer.",
        right: "The broker first, then SEBI SCORES.",
        other: "Not quite. Brokers are on SEBI's roads.",
        wrong: { amfi: "AMFI is the fund houses' association, and this is a broker. SEBI SCORES is the route.", rbi_omb: "The RBI's ombudsman is for banks. Brokers are SEBI's." },
      },
    },
    {
      id: "t5",
      label: "Ticket 5",
      short: "₹5,000 to a 'SEBI-approved' WhatsApp scheme",
      text: "A WhatsApp group promised 5% a month. Arjun's friend sent ₹5,000. Now the group has vanished.",
      unregistered: true,
      rung1: ["c1930"],
      rung2: ["company", "police"],
      regulators: REGULATORS,
      feedback: {
        unregistered: "This group isn't registered with us. No referee, and no ombudsman.",
        right: "Call 1930 or report at cybercrime.gov.in straight away, and tell the bank the money was sent from. Reporting fast gives the best chance of stopping the money. The only real protection is checking registration before paying. Day 21 goes deeper on scams.",
        other: "When the other side isn't registered, report the fraud first: the cybercrime helpline.",
      },
    },
  ],
  ladders: [
    {
      id: "rbi",
      tower: "rbi",
      label: "RBI: banks, lenders, payments",
      rungs: [{ step: "The company first" }, { step: "No reply, or an unhappy one", clock: "30 days" }, { step: "RBI Ombudsman, free", clock: "within 90 days" }],
    },
    {
      id: "sebi",
      tower: "sebi",
      label: "SEBI: brokers, funds, listed companies",
      rungs: [{ step: "The company first" }, { step: "SEBI SCORES: the company must respond", clock: "21 days" }, { step: "Two levels of review if you're unhappy" }, { step: "Online dispute resolution (SMART ODR)" }],
    },
    {
      id: "ins",
      tower: "irdai",
      label: "Insurance",
      rungs: [{ step: "The insurer first" }, { step: "No reply, or an unhappy one", clock: "30 days" }, { step: "Insurance Ombudsman, free" }],
    },
  ],
  kit: ["cms.rbi.org.in", "scores.sebi.gov.in", "bimabharosa.irdai.gov.in", "1930"],
  notes: [
    "Arjun's complaints desk. Fill both rungs, then Send.",
    "Two more tickets.",
    "Three ladders, three clocks. Tap one to open it.",
    "Ticket 4.",
    "Ticket 5.",
    "Your desk.",
  ],
  texts: {
    clocks: "The ladders look alike, but the clocks differ, so note the date you complain.",
    desk_score: "{n} of {of} right first time.",
    rule: "Rule to keep: the company first, almost always.",
    unrouted: "Some tickets are still open above.",
  },
};
