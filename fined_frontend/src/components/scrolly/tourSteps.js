// The module tour's steps (ModuleTour.jsx) and whether this browser has seen it.
const SEEN_KEY = "fined:module-tour-seen:v1";

export function tourSeen() {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // storage blocked: don't pop the tour up on every visit
  }
}

export function markSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage blocked: nothing to remember */
  }
}

// `scroll`: "top" = back to the top of the page, "center" = bring the part into
// view, none = the part is in the fixed top bar. Steps whose part isn't on this
// module's page (e.g. the test module has no chapters) are left out.
const DESKTOP_STEPS = [
  {
    title: "Hey, first time here? 👋",
    text: "Let's show you around. It's quick, about 30 seconds.",
    next: "Let's go",
  },
  {
    target: ".nc-hero .hero-copy",
    scroll: "top",
    title: "What's inside",
    text: "What you'll learn, how long it takes, and how many things you get to play with.",
  },
  {
    target: ".nc-hero .hero-warmup",
    scroll: "top",
    title: "Start here 👇",
    text: "Take a quick guess. No marks, no wrong answers. Just go with your gut.",
  },
  {
    target: ".scrolly-section .scrolly-step",
    scroll: "center",
    title: "The story lives here",
    text: "Short bits, one at a time. Just keep scrolling and the story moves along.",
  },
  {
    target: ".scrolly-section .scrolly-figure",
    scroll: "center",
    anchor: ".scrolly-section .scrolly-step",
    title: "Keep an eye on this side",
    text: "It changes as you read. See a slider or a button? Go on, poke it.",
  },
  {
    target: ".nc-topbar .chapter-nav",
    title: "How far you've got",
    text: "These bars fill up as you read. Click any chapter to jump to it.",
  },
  {
    target: ".nc-topbar .finstars-pill",
    title: "Collect FinStars ⭐",
    text: "Answer the quick checks and try the tools to earn stars. Lost? Click ? to see this again.",
    next: "Let's start!",
  },
];

const PHONE_STEPS = [
  {
    title: "Hey, first time here? 👋",
    text: "This works just like Reels: one short screen at a time. Let's show you around, it's quick.",
    next: "Let's go",
  },
  {
    target: ".nc-hero .hero-warmup",
    scroll: "center",
    title: "Start here 👇",
    text: "Take a quick guess. No marks, no wrong answers. Just go with your gut.",
  },
  {
    target: ".scrolly-section .scrolly-step",
    inner: true, // the step fills the screen; light up just its text
    scroll: "center",
    title: "Swipe up, like Reels",
    text: "Each screen is one tiny bit of the story. Swipe up for the next one.",
  },
  {
    target: ".scrolly-section .scrolly-figure",
    scroll: "center",
    anchor: ".scrolly-section .scrolly-step",
    title: "Watch this up top",
    text: "It changes with every swipe. See a slider or a button? Go on, tap it.",
  },
  {
    target: ".nc-topbar .finstars-pill",
    title: "Collect FinStars ⭐",
    text: "Answer the quick checks and try the tools to earn stars. Lost? Tap ? to see this again.",
    next: "Let's start!",
  },
];

function visible(el) {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

// The steps for this layout whose part is on this module's page.
export function tourSteps(root, reels) {
  return (reels ? PHONE_STEPS : DESKTOP_STEPS).filter((s) => !s.target || visible(root?.querySelector(s.target)));
}
