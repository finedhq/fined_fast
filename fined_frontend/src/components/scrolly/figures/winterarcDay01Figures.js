// WinterArc Day 1 "Introduction to Personal Finance": the three chapter
// figures. Every number here is a made-up example (Arjun) and is labelled as
// made up on the page. Totals are checked in stackMath.test.js.

// Arjun's month (Chapter 1), and the same spending split into needs and wants
// (Chapter 3, from the handoff's split table): food and phone each split in two.
const MONTH = {
  stipend: { label: "Stipend", value: 15000, tone: 0 },
  tutoring: { label: "Tutoring", value: 3000, tone: 1 },
  rent: { label: "Rent and bills", value: 6000, tone: 0 },
  food: { label: "Food", value: 5000, tone: 1 },
  travel: { label: "Travel", value: 1500, tone: 2 },
  phone: { label: "Phone and subscriptions", value: 1000, tone: 3 },
  out: { label: "Going out and shopping", value: 3000, tone: 4 },
  left: { label: "Left over", value: 1500, tone: 5 },
};

/** Chapter 1: money in, money out, what's left. */
export const WA1_CH1_STACK = {
  max: 18000,
  bars: [
    { id: "in", label: "Money in" },
    { id: "spent", label: "Spent" },
    { id: "left", label: "Left over" },
  ],
  segments: MONTH,
  views: [
    // s1-1: three empty slots; the warm-up answer sits on "Left over"
    { unknown: ["in", "spent", "left"], tag: { bar: "left", text: "You said: {poll}" }, note: "Arjun's month, before he checks." },
    // s1-2: what comes in
    { unknown: ["spent", "left"], fill: { in: ["stipend", "tutoring"] }, legend: "in", note: "What comes in: ₹18,000." },
    // s1-3: what goes out, one piece at a time; the total waits for s1-4
    {
      unknown: ["left"],
      fill: { in: ["stipend", "tutoring"], spent: ["rent", "food", "travel", "phone", "out"] },
      hideTotal: ["spent"],
      legend: "spent",
      note: "What goes out, piece by piece.",
    },
    // s1-4: the total, and what's left
    {
      fill: { in: ["stipend", "tutoring"], spent: ["rent", "food", "travel", "phone", "out"], left: ["left"] },
      pulse: "out",
      legend: "spent",
      note: "₹18,000 in, ₹16,500 out, ₹1,500 left.",
    },
  ],
};

/** Chapter 2: save what's left vs save first, six made-up months. */
const MONTHS = ["Month 1", "Month 2", "Month 3", "Month 4", "Month 5", "Month 6"];
const running = (monthly) => monthly.reduce((out, v) => [...out, (out[out.length - 1] || 0) + v], []);
export const WA1_CH2_CHART = {
  x: MONTHS,
  format: "inr",
  fromZero: true,
  futureSolid: true, // the hidden months must not show through before the guess
  series: [
    { id: "left", label: "Save what's left", values: running([1500, 0, 2000, 500, 0, 1000]) },
    { id: "first2000", label: "Save ₹2,000 first", values: running([2000, 2000, 2000, 2000, 2000, 2000]) },
    { id: "first1000", label: "Save ₹1,000 first", values: running([1000, 1000, 1000, 1000, 1000, 1000]) },
    { id: "first3500", label: "Save ₹3,500 first", values: running([3500, 3500, 3500, 3500, 3500, 3500]) },
  ],
  markers: [
    { id: "wedding", label: "Wedding", at: 1, value: 1500 },
    { id: "screen", label: "Cracked screen", at: 4, value: 4000, row: 1 },
  ],
  steps: [
    // s2-1: month 1 only; the rest hides until the guess
    { show: ["left"], future: { from: 1, label: "Months 2 to 6: guess first." }, endLabels: false },
    // s2-2: the zig-zag, with what got in the way
    { show: ["left", "wedding", "screen"], endLabels: true },
    // s2-3: the same income, saving first
    { show: ["left", "first2000"], endLabels: true },
    // s2-4: the reader picks how much goes first
    {
      show: ["left", "first1000", "first2000", "first3500"],
      endLabels: true,
      choose: {
        prompt: "Move on day one:",
        label: "How much Arjun moves to savings first",
        start: "c2000",
        options: [
          { id: "c1000", label: "₹1,000", focus: ["left", "first1000"], text: "Leaves ₹17,000 to spend. His month costs ₹16,500, so there's room. ₹6,000 after six months." },
          { id: "c2000", label: "₹2,000", focus: ["left", "first2000"], text: "Leaves ₹16,000. ₹500 tighter every month. ₹12,000 after six months." },
          { id: "c3500", label: "₹3,500", focus: ["left", "first3500"], text: "Leaves ₹14,500. That's ₹2,000 short every month. Something gets cut, or the savings get pulled back." },
        ],
      },
    },
  ],
};

/** Chapter 3: needs, wants and savings; the reader sorts first. */
const SPLIT = {
  rent: { label: "Rent and bills", value: 6000, tone: 0 },
  mess: { label: "Mess food", value: 3500, tone: 1 },
  orders: { label: "Food orders", value: 1500, tone: 1 },
  travel: { label: "Travel", value: 1500, tone: 2 },
  phone_basic: { label: "Basic phone plan", value: 500, tone: 3 },
  subs: { label: "Subscriptions", value: 500, tone: 6 },
  out: { label: "Going out and shopping", value: 3000, tone: 4 },
  left: { label: "Left over", value: 1500, tone: 5 },
};
const ARJUN_FILL = { need: ["rent", "mess", "travel", "phone_basic"], want: ["orders", "subs", "out"], savings: ["left"] };
const GHOST = { need: 9000, want: 5400, savings: 3600 }; // 50/30/20 on ₹18,000

export const WA1_CH3_STACK = {
  max: 12000,
  bars: [
    { id: "need", label: "Needs" },
    { id: "want", label: "Wants" },
    { id: "savings", label: "Savings" },
  ],
  segments: SPLIT,
  sort: {
    chips: ["rent", "mess", "orders", "travel", "phone_basic", "subs", "out"],
    zones: [
      { id: "need", label: "Need", bar: "need" },
      { id: "want", label: "Want", bar: "want" },
    ],
    fixed: { savings: ["left"] },
    answer: { rent: "need", mess: "need", orders: "want", travel: "need", phone_basic: "need", subs: "want", out: "want" },
    howto: "Tap a spend, then Need or Want. Tap it again to move it.",
    done_text: "All sorted. Scroll on to compare with Arjun.",
    notes: {
      rent: "Arjun counts this as a need. A roof and electricity aren't optional.",
      mess: "Arjun counts this as a need. Eating isn't optional.",
      orders: "Arjun counts this as a want. Eating is a need. Ordering in is a choice.",
      travel: "Arjun counts this as a need. It gets him to college and his internship.",
      phone_basic: "Arjun counts this as a need. You need a working number.",
      subs: "Arjun counts these as a want. Nice to have, easy to pause.",
      out: "Arjun counts this as a want. Worth it sometimes. Still a want.",
    },
    compare: {
      zone: "need",
      of: 18000,
      mine: "Your sort: needs {mine} ({mine_pct}). Arjun's: {theirs} ({theirs_pct}).",
      theirs_only: "Arjun's sort: needs {theirs}, about {theirs_pct} of his ₹18,000.",
    },
  },
  views: [
    // s3-1: the reader sorts; the bars fill as they go
    { sort: true, note: "Sort Arjun's spending. Savings is what's left over." },
    // s3-2: Arjun's own sort, compared with the reader's
    { fill: ARJUN_FILL, compare: true, legend: "need" },
    // s3-3: the 50/30/20 outline behind; the needs overshoot is hatched
    { fill: ARJUN_FILL, ghost: GHOST, note: "Dashed: 50/30/20 on ₹18,000. Hatched: needs over the rule." },
    // s3-4: Arjun's own plan; the outline stays, faint
    {
      fill: { need: 11500, want: 4000, savings: 2500 },
      tones: { need: 0, want: 4, savings: 5 },
      ghost: GHOST,
      ghostFaint: true,
      note: "Arjun's plan: wants down to ₹4,000, savings up to ₹2,500.",
    },
  ],
};
