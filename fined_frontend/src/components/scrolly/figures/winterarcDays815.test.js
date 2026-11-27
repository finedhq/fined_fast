// Every number the Day 8–15 figures show, checked against the specs' tables.
import { describe, expect, it } from "vitest";
import {
  afterCost,
  basketReturn,
  bondPrice,
  cloudDots,
  countBelow,
  indexLevel,
  lumpRun,
  monthlyPot,
  nav,
  pathValues,
  profitSplit,
  raise,
  rangeBySize,
  real,
  savingsValues,
  sellBranch,
  sipRun,
  startAt,
  unitsFor,
  weights,
} from "./winterarcDays815Math";

const r0 = (v) => Math.round(v);

describe("Day 8 · three doors", () => {
  const PATH = [22, -10, 28, 6, -18, 35, 10, 14, -4, 20];
  it("savings: ₹13,439, or ₹7,504 in today's money", () => {
    const s = savingsValues(10000, 3, 10);
    expect(r0(s[9])).toBe(13439);
    expect(r0(real(s[9], 6, 10))).toBe(7504);
  });
  it("investing path year by year", () => {
    expect(pathValues(10000, PATH).map(r0)).toEqual([12200, 10980, 14054, 14898, 12216, 16492, 18141, 20681, 19853, 23824]);
  });
  it("hold vs sell, rupees and today's money", () => {
    const hold = pathValues(10000, PATH)[9];
    const sell = sellBranch(10000, PATH, 5, 3)[9];
    expect(r0(hold)).toBe(23824);
    expect(r0(sell)).toBe(14162);
    expect(r0(real(hold, 6, 10))).toBe(13303);
    expect(r0(real(sell, 6, 10))).toBe(7908);
  });
  it("Chai Point's bad year: owners ₹15 → ₹3.75", () => {
    expect(profitSplit({ sales: 100, costs: 70, interest: 10, taxRate: 25 })).toMatchObject({ tax: 5, owners: 15 });
    expect(profitSplit({ sales: 85, costs: 70, interest: 10, taxRate: 25 })).toMatchObject({ tax: 1.25, owners: 3.75 });
  });
  it("time machine: Riya ≈ ₹74.2 lakh, Kabir ≈ ₹41.0 lakh", () => {
    const riya = monthlyPot({ monthly: 2000, rate: 10, payMonths: 120, totalMonths: 39 * 12 });
    const kabir = monthlyPot({ monthly: 2000, rate: 10, payMonths: 29 * 12, totalMonths: 29 * 12 });
    expect(riya / 1e5).toBeCloseTo(74.2, 1);
    expect(kabir / 1e5).toBeCloseTo(41.0, 1);
  });
  it("time machine slider ages", () => {
    const o = { monthly: 2000, rate: 10, end: 60 };
    expect(r0(startAt(20, o))).toBeCloseTo(12753560, -2);
    expect(r0(startAt(25, o))).toBeCloseTo(7656553, -2);
    expect(r0(startAt(30, o))).toBeCloseTo(4558651, -2);
    expect(r0(startAt(35, o))).toBeCloseTo(2675781, -2);
  });
});

describe("Day 9 · risk", () => {
  it("cloud counts below zero match the spec", () => {
    const sd = (s, n) => s / Math.sqrt(n);
    expect(countBelow(cloudDots({ mean: 11, sd: 18, below: 27 }))).toBe(27);
    expect(countBelow(cloudDots({ mean: 11, sd: sd(18, 5), below: 9 }))).toBe(9);
    expect(countBelow(cloudDots({ mean: 11, sd: sd(18, 10), below: 3 }))).toBe(3);
    expect(countBelow(cloudDots({ mean: 7, sd: 5, below: 8 }))).toBe(8);
    expect(countBelow(cloudDots({ mean: 7, sd: sd(5, 5), below: 0 }))).toBe(0);
  });
  const R = { chai: 22, volt: -25, spark: -20, shuttle: -22, pixel: 28, green: 14, byte: -60, sun: 40, kisan: 16, steel: 20 };
  it("basket presets", () => {
    expect(basketReturn([R.volt, R.spark, R.shuttle])).toBeCloseTo(-22.33, 2);
    expect(basketReturn([R.chai, R.volt, R.pixel, R.sun, R.kisan])).toBeCloseTo(16.2, 2);
    expect(basketReturn(Object.values(R))).toBeCloseTo(1.3, 2);
    expect(basketReturn([R.volt, R.pixel, R.kisan])).toBeCloseTo(6.33, 2);
  });
  it("range bar by basket size", () => {
    const got = rangeBySize(Object.values(R)).map(({ lo, hi }) => [Number(lo.toFixed(1)), Number(hi.toFixed(1))]);
    expect(got).toEqual([
      [-60, 40],
      [-42.5, 34],
      [-35.7, 30],
      [-31.8, 27.5],
      [-22.6, 25.2],
      [-16.2, 23.3],
      [-11, 17.1],
      [-6.9, 12.3],
      [-3, 8.1],
      [1.3, 1.3],
    ]);
  });
});

describe("Day 10 · stock market", () => {
  it("raising ₹2 crore leaves the founder 83.3% of ₹12 crore", () => {
    const r = raise({ shares: 1e6, price: 100, newShares: 2e5 });
    expect(r.raised).toBe(2e7);
    expect(r.value).toBe(1.2e8);
    expect(r.stake * 100).toBeCloseTo(83.33, 2);
    expect(r.yours).toBe(1e8);
  });
  const CAPS = { bank: 4000, pixel: 2500, chai: 1500, sun: 1200, kisan: 800 };
  it("index: Kisan +20%, Big Bank −5% → 996", () => {
    const { level, parts } = indexLevel(CAPS, { kisan: 20, bank: -5 });
    expect(level).toBeCloseTo(996, 6);
    expect(parts.find((p) => p.id === "kisan").points).toBeCloseTo(16, 6);
    expect(parts.find((p) => p.id === "bank").points).toBeCloseTo(-20, 6);
  });
  it("full cap vs free float weights", () => {
    const full = weights({ ...CAPS, bank: 8000 });
    expect(Object.values(full).map(Math.round)).toEqual([57, 18, 11, 9, 6]);
    expect(Object.values(weights(CAPS))).toEqual([40, 25, 15, 12, 8]);
  });
  it("the index puzzle: 1,050 is reachable on the 5% grid", () => {
    expect(indexLevel(CAPS, { pixel: 20 }).level).toBeCloseTo(1050, 6);
    expect(indexLevel(CAPS, { bank: 20, chai: -20 }).level).toBeCloseTo(1050, 6);
    expect(indexLevel(CAPS, { kisan: 20, sun: 20, chai: 5 }).level).toBeCloseTo(1047.5, 6);
  });
});

describe("Day 11 · mutual funds", () => {
  it("units and NAV", () => {
    expect(nav(1080000, 100000)).toBeCloseTo(10.8, 9);
    expect(unitsFor(5000, 10.8)).toBe(462.96);
    expect(nav(1085000, 100462.96)).toBeCloseTo(10.8, 4);
    expect(1000 * 11).toBe(100 * 110);
    expect(nav(5000000, 250000)).toBe(20);
  });
  it("cost drag over 20 years", () => {
    expect(r0(afterCost(100000, 10, 0.5, 20))).toBe(614161);
    expect(r0(afterCost(100000, 10, 1, 20))).toBe(560441);
    expect(r0(afterCost(100000, 10, 1.5, 20))).toBe(511205);
  });
});

describe("Day 12 · SIPs", () => {
  const FALL = [100, 90, 80, 70, 80, 90, 100, 110, 100, 95, 105, 110];
  const RISE = Array.from({ length: 12 }, (_, k) => 100 + 5 * k);
  it("falling-then-rising year", () => {
    const sip = sipRun(FALL, 1000);
    expect(sip.units).toBeCloseTo(129.74, 2);
    expect(sip.avgCost).toBeCloseTo(92.49, 2);
    expect(r0(sip.value)).toBe(14271);
    expect(lumpRun(FALL, 12000).value).toBe(13200);
  });
  it("pausing months 3 to 6", () => {
    const p = sipRun(FALL, 1000, [2, 3, 4, 5]);
    expect(p.paid).toBe(8000);
    expect(p.units).toBeCloseTo(79.34, 2);
    expect(r0(p.value)).toBe(8728);
  });
  it("rising year", () => {
    expect(RISE[11]).toBe(155);
    const sip = sipRun(RISE, 1000);
    expect(sip.units).toBeCloseTo(95.9, 1);
    expect(r0(sip.value)).toBe(14865);
    expect(lumpRun(RISE, 12000).value).toBe(18600);
  });
  it("three managers beat the index next year", () => {
    const next = [6, 8, 13, 9, 9, 12, 7, 14, 5, 9];
    expect(next.filter((r) => r > 10).length).toBe(3);
  });
});

describe("Day 13 · bonds", () => {
  const p = (years, y) => r0(bondPrice({ face: 10000, coupon: 7, years, yieldPct: y }));
  it("rates up to 8%", () => expect([p(1, 8), p(5, 8), p(10, 8)]).toEqual([9907, 9601, 9329]));
  it("rates down to 6%", () => expect([p(1, 6), p(5, 6), p(10, 6)]).toEqual([10094, 10421, 10736]));
});

describe("Day 15 · choosing funds", () => {
  it("direct vs regular SIP over 15 years", () => {
    const d = monthlyPot({ monthly: 5000, rate: 11.4, payMonths: 180, totalMonths: 180 });
    const g = monthlyPot({ monthly: 5000, rate: 10.4, payMonths: 180, totalMonths: 180 });
    expect(d / 1e5).toBeCloseTo(23.83, 1);
    expect(g / 1e5).toBeCloseTo(21.69, 1);
    expect((d - g) / 1e5).toBeCloseTo(2.14, 1);
  });
  it("steady vs rollercoaster", () => {
    const x = pathValues(1000, [45, -10, 8, 25, 2]);
    const y = pathValues(1000, [12, 10, 14, 11, 13]);
    expect(r0(x[1])).toBe(1305);
    expect(r0(y[1])).toBe(1232);
    expect(r0(pathValues(1000, [-10, 8])[1])).toBe(972);
    expect(((x[4] / 1000) ** 0.2 - 1) * 100).toBeCloseTo(12.4, 0);
    expect(((y[4] / 1000) ** 0.2 - 1) * 100).toBeCloseTo(12.0, 0);
  });
});
