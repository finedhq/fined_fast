// The v2 module page: ONE long scroll that reproduces the prototype
// (fined-scrolly/module-1-market), drawn from the module's cards in order.
// Used for every new-course module — there is no per-module page code; a
// module is just its cards (plus a figure plug-in when it has a new visual).
//
//   hero card        -> top bar title + hero with warm-up
//   narrative cards  -> chapters (also the chapter bar in the top bar)
//   model cards      -> hands-on tool (tools/registry.js)
//   quiz cards       -> prototype-style quick checks
//   completion card  -> completion + confetti
//
// Each part is saved to the learner's account as it is finished (see
// savedAnswers.js for what and when); on return, saved answers are shown as
// answered (decision 7f). `preview` (admin): starts empty, saves nothing;
// `embedded` (admin card preview): no top bar, and the window isn't scrolled.
import { useEffect, useMemo, useRef, useState } from "react";
import Topbar from "./Topbar";
import Hero from "./Hero";
import Chapter from "./Chapter";
import Checkpoint from "./Checkpoint";
import Completion from "./Completion";
import GlossaryTooltip from "./GlossaryTooltip";
import useStepObserver from "./useStepObserver";
import { EMPTY_PAGE_STATE, loadPageState, savePageState } from "./pageState";
import { mergePages, pageFromSaved } from "./savedAnswers";
import useSaveProgress from "./useSaveProgress";
import { earnedStars, maxStars as moduleMaxStars, openParts } from "./progress";
import { scrollToElement } from "./scroll";
import { TOOLS } from "./tools/registry";
import "./scrolly.css";
import "./scrolly-app.css";
import "./scrolly-blocks.css";

export default function ScrollyModulePage({ bundle, focusSlug, email, preview = false, embedded = false, backTo: backToOverride }) {
  const rootRef = useRef(null);
  const moduleId = bundle.module_id;

  const cards = useMemo(() => [...(bundle.cards || [])].sort((a, b) => a.order_index - b.order_index), [bundle.cards]);
  const hero = cards.find((c) => c.card_template === "hero");
  const chapters = useMemo(() => cards.filter((c) => c.card_template === "narrative"), [cards]);
  const chapterLinks = useMemo(() => chapters.map((c) => ({ slug: c.slug, title: c.card_data?.title || c.title })), [chapters]);
  const maxStars = moduleMaxStars(cards);

  // The learner's saved answers, with this tab's in-progress state on top.
  const [page, setPage] = useState(() =>
    preview ? { ...EMPTY_PAGE_STATE } : mergePages(pageFromSaved(cards), loadPageState(moduleId))
  );
  useEffect(() => {
    if (!preview) savePageState(moduleId, page);
  }, [moduleId, page, preview]);

  // Parts the reader has reached: the hero once any chapter is being read, a
  // chapter once its last step is, the completion screen once it's in view.
  const [reached, setReached] = useState({});
  const markReached = (slug) => setReached((r) => (r[slug] ? r : { ...r, [slug]: true }));
  const lastStep = useMemo(() => Object.fromEntries(chapters.map((c) => [c.slug, (c.card_data?.steps || []).length - 1])), [chapters]);

  // Save each finished part; `saved` = the cards with this visit's saves applied.
  const saved = useSaveProgress({ cards, page, reached, email, enabled: !preview });
  const stars = earnedStars(saved, page);
  const open = openParts(saved, page);

  // `patch` is an object, or a function of that part's latest state (so quick
  // repeated taps or slider moves never work from a stale value).
  const patchPart = (group, slug) => (patch) =>
    setPage((p) => {
      const current = p[group]?.[slug] || {};
      const next = typeof patch === "function" ? patch(current) : patch;
      return { ...p, [group]: { ...p[group], [slug]: { ...current, ...next } } };
    });

  // Which step is being read in each chapter: { [chapterSlug]: { step, direction } }
  const [active, setActive] = useState({});
  useStepObserver(
    rootRef,
    ({ chapter, step, direction }) => {
      setActive((a) => (a[chapter]?.step === step ? a : { ...a, [chapter]: { step, direction } }));
      if (hero) markReached(hero.slug);
      if (step === lastStep[chapter]) markReached(chapter);
    },
    moduleId
  );

  // Open at the top (decision 7f); a link to a specific part jumps there.
  const focusRef = useRef(focusSlug);
  const embeddedRef = useRef(embedded);
  useEffect(() => {
    if (embeddedRef.current) return;
    // Instant, not smooth: the site sets smooth scrolling on <html>, which
    // would otherwise animate a deep link all the way down the page.
    window.scrollTo({ top: 0, behavior: "instant" });
    const slug = focusRef.current;
    if (slug && slug !== hero?.slug) {
      const el = rootRef.current?.querySelector(`[data-part="${CSS.escape(slug)}"]`);
      if (el) el.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [moduleId, hero?.slug]);

  const backTo = backToOverride || (bundle.course_slug ? `/courses/${bundle.course_slug}` : "/courses");
  const firstSection = chapters[0] ? `#section-${CSS.escape(chapters[0].slug)}` : ".scrolly-section";
  const nextSlug = bundle.nextModuleFirstCard?.cardSlug || bundle.nextModuleFirstCard?.cardId;
  const goToPart = (slug) => scrollToElement(rootRef.current?.querySelector(`[data-part="${CSS.escape(slug)}"]`));

  const part = (card) => {
    switch (card.card_template) {
      case "hero":
        return (
          <Hero
            key={card.card_id}
            card={card}
            maxStars={maxStars}
            answers={page.hero || {}}
            onAnswer={(a) => setPage((p) => ({ ...p, hero: { ...p.hero, ...a } }))}
            firstSectionSelector={firstSection}
            rootRef={rootRef}
          />
        );
      case "narrative":
        return (
          <Chapter
            key={card.card_id}
            card={card}
            chapterNum={chapters.indexOf(card) + 1}
            chapterCount={chapters.length}
            activeStep={active[card.slug]?.step}
            direction={active[card.slug]?.direction}
            figureState={page.steps[card.slug]}
            onFigureState={patchPart("steps", card.slug)}
          />
        );
      case "model": {
        const Tool = TOOLS[card.card_data?.model_kind]?.component;
        return (
          <section key={card.card_id} className="tool-section" id={`tool-${card.slug}`} data-part={card.slug}>
            <div className="tool-mount">
              {Tool && <Tool card={card} state={page.tools[card.slug]} onState={patchPart("tools", card.slug)} heroAmount={page.hero?.amount} />}
            </div>
          </section>
        );
      }
      case "quiz":
        return (
          <Checkpoint
            key={card.card_id}
            card={card}
            picked={page.checks[card.slug]}
            onPick={(optionId) => setPage((p) => ({ ...p, checks: { ...p.checks, [card.slug]: optionId } }))}
          />
        );
      case "completion":
        return (
          <Completion
            key={card.card_id}
            card={card}
            moduleNumber={bundle.module_order_index}
            heroPoll={hero?.card_data?.poll}
            pollChoice={page.hero?.poll}
            stars={stars}
            maxStars={maxStars}
            open={open}
            nextHref={nextSlug && !preview ? `/cards/${nextSlug}` : null}
            comingSoon={!nextSlug && !preview}
            onReached={() => markReached(card.slug)}
            onGoTo={goToPart}
            onReviewTop={() => scrollToElement(rootRef.current?.querySelector(".nc-hero"))}
          />
        );
      default:
        return null; // older card types never appear in a v2 module
    }
  };

  return (
    <div className="nc-root" ref={rootRef}>
      {!embedded && (
        <Topbar
          rootRef={rootRef}
          moduleNumber={bundle.module_order_index}
          title={hero?.card_data?.short_title || bundle.module_title}
          chapters={chapterLinks}
          stars={stars}
          backTo={backTo}
        />
      )}
      <main>{cards.map(part)}</main>
      <GlossaryTooltip scopeRef={rootRef} />
    </div>
  );
}
