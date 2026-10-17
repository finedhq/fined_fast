// Module 10 ("What Risk Actually Feels Like") — everything its figures draw
// (decision D27: figure numbers live in frontend code, not in card data).
// Chapters 1 and 2 are the line chart on REAL data: Nifty 50 month-end
// closes from NSE Indices (niftyMonthly.js). Every number the copy quotes is
// checked against that data in module10.test.js. Chapter 3 is the trade map.
import { NIFTY_AS_OF, NIFTY_MONTHLY } from "./niftyMonthly";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (key) => `${MONTHS[Number(key.slice(5)) - 1]} ${key.slice(0, 4)}`;
/** x index of a month, e.g. at("2007-12"). */
export const at = (key) => NIFTY_MONTHLY.findIndex(([k]) => k === key);
const close = (key) => NIFTY_MONTHLY[at(key)][2];

const SERIES = [{ id: "nifty", label: "Nifty 50", values: NIFTY_MONTHLY.map(([, , c]) => c) }];
const X = NIFTY_MONTHLY.map(([k]) => label(k));
const NOTE = `Nifty 50 price index, month-end closes to ${NIFTY_AS_OF}. Source: NSE Indices. Prices only.`;
const SQUASHED = "Squashed scale, so the early years stay visible";
const mark = (id, key, text, row = 0) => ({ id, label: text, at: at(key), value: close(key), row });

// Chapter 1 · "The Average and the Ride" (steps 1.1 – 1.4).
export const M10_CH1_CHART = {
  series: SERIES,
  x: X,
  xYears: true,
  format: "plain",
  markers: [
    mark("y2008", "2008-12", "2008: −52%", 0),
    mark("y2009", "2009-12", "2009: +76%", 1),
    mark("y2011", "2011-12", "2011: −25%", 2),
    mark("fall2008", "2008-12", "End of 2008: about half gone"),
    mark("covid", "2020-03", "23 Mar 2020: −13% in one day"),
  ],
  note: NOTE,
  steps: [
    { show: ["nifty"], scale: "log", scaleNote: SQUASHED, badge: "About 11% a year since 1995, on average" },
    { show: ["nifty", "y2008", "y2009", "y2011"], scale: "log", scaleNote: SQUASHED },
    { show: ["nifty", "fall2008"], range: [at("2007-01"), at("2010-12")], pulse: "fall2008" },
    { show: ["nifty", "covid"], range: [at("2019-01"), at("2020-12")] },
  ],
};

// Chapter 2 · "It's the End of 2007" (steps 2.1 – 2.3). Arjun puts ₹1 lakh in
// at the end-2007 close (6,138.6); the slider walks 1–10 years forward.
const START = at("2007-12");
const RANGE = [at("2003-01"), at("2018-12")];
const BASE = { value: close("2007-12"), label: "Where Arjun started" };
export const M10_CH2_CHART = {
  series: SERIES,
  x: X,
  xYears: true,
  format: "plain",
  markers: [
    mark("start", "2007-12", "End of 2007: Arjun buys"),
    mark("h1", "2008-12", "1 yr", 0),
    mark("h3", "2010-12", "3 yrs", 1),
    mark("h4", "2011-12", "4 yrs", 0),
    mark("h10", "2017-12", "10 yrs", 0),
  ],
  note: NOTE,
  steps: [
    { show: ["nifty", "start"], range: RANGE, future: { from: START + 1, label: "What happens next is unknown." } },
    {
      show: ["nifty"],
      range: RANGE,
      baseline: BASE,
      horizon: {
        start: START,
        label: "Years until Arjun needs the money",
        min: 1,
        max: 10,
        step: 1,
        value: 1,
        amount: 100000,
        footnote: "Prices only, before dividends, costs and tax.",
      },
    },
    { show: ["nifty", "h1", "h3", "h4", "h10"], range: RANGE, baseline: BASE },
  ],
};

// Chapter 3 · "The Full Board" (steps 3.1 – 3.4). A hub with six spokes; each
// place's trade-off is a line under its box (shown two at a time).
const PLACES = ["sav", "fd", "gold", "prop", "fund", "shares"];
const ALL = ["you", ...PLACES];
const spokes = PLACES.map((p) => ["you", p]);
export const M10_CH3_MAP = {
  tall: true,
  nodes: {
    // "Your money" on top, so every spoke comes in from above and the line
    // under each place stays clear.
    you: { label: "Your money", x: 50, y: 10 },
    sav: { label: "Savings account", x: 16, y: 36 },
    fd: { label: "Fixed deposit", x: 84, y: 36 },
    gold: { label: "Gold", x: 16, y: 60 },
    prop: { label: "Property", x: 84, y: 60 },
    fund: { label: "Funds", x: 16, y: 84 },
    shares: { label: "Shares", x: 84, y: 84 },
  },
  tokens: {},
  links: spokes,
  steps: [
    {
      show: ALL,
      lit: ["you", "sav", "fd"],
      arrows: [
        ["you", "sav"],
        ["you", "fd"],
      ],
      notes: { sav: "Easy to reach, earns little", fd: "Locked, taxed" },
      caption: "Savings: easy to reach, earns little. A fixed deposit: locked for a time, and taxed.",
    },
    {
      show: ALL,
      lit: ["you", "gold", "prop"],
      arrows: [
        ["you", "gold"],
        ["you", "prop"],
      ],
      notes: { gold: "No income, price swings", prop: "Big, slow to sell" },
      caption: "Gold: no income, and its price swings. Property: big, slow to sell.",
    },
    {
      show: ALL,
      lit: ["you", "fund", "shares"],
      arrows: [
        ["you", "fund"],
        ["you", "shares"],
      ],
      notes: { fund: "Fees, market swings", shares: "Swings both ways" },
      caption: "Funds: fees, and they fall with the market. Shares: swing hard both ways.",
    },
    { show: ALL, lit: ALL, arrows: spokes, tag: "Different jobs, different risks", pulse: "you", caption: "Six places, each with a different job and a different way to let you down." },
  ],
};
