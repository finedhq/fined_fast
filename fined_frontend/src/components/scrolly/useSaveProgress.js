// Saves the module page's parts to the learner's account through the existing
// progress endpoint, at the moments set in savedAnswers.js (pendingSaves).
// Returns the module's cards with what has been saved in this visit applied,
// so the FinStars count and the "skipped" line follow the account.
//
// - A first save goes out at once; a changed answer on a part already saved
//   waits a moment (slider moves), since it never pays again anyway.
// - Network hiccups are retried twice, like the card player. If a save still
//   fails it is undone locally and not retried until that answer changes.
// - Nothing is saved when `enabled` is false (admin preview).
import { useEffect, useMemo, useRef, useState } from "react";
import { updateCardBySlug } from "../../services/api";
import { pendingSaves } from "./savedAnswers";

const RESAVE_DELAY_MS = 1200;
const RETRY_DELAY_MS = 1500;

async function send(slug, body, retries = 2) {
  try {
    return await updateCardBySlug(slug, body);
  } catch (err) {
    if (retries <= 0) throw err;
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return send(slug, body, retries - 1);
  }
}

export default function useSaveProgress({ cards, page, reached, email, enabled }) {
  const [saved, setSaved] = useState({}); // card_id -> { status, userAnswer } saved in this visit
  const failed = useRef({}); // card_id -> the answer that could not be saved

  const current = useMemo(() => cards.map((c) => (saved[c.card_id] ? { ...c, ...saved[c.card_id] } : c)), [cards, saved]);

  useEffect(() => {
    if (!enabled) return undefined;
    const todo = pendingSaves(current, page, reached).filter((s) => failed.current[s.card.card_id] !== s.answer);
    if (!todo.length) return undefined;

    const timer = setTimeout(
      () => {
        todo.forEach(({ card, answer, finStars }) => {
          const id = card.card_id;
          delete failed.current[id];
          setSaved((m) => ({ ...m, [id]: { status: "completed", userAnswer: answer } }));
          send(card.slug, { status: "completed", email, finStars, userAnswer: answer }).catch((err) => {
            console.warn("Module page: progress save failed", card.slug, err);
            failed.current[id] = answer;
            setSaved((m) => {
              if (m[id]?.userAnswer !== answer) return m; // a newer answer went out since
              const next = { ...m };
              delete next[id];
              return next;
            });
          });
        });
      },
      todo.some((s) => !s.resave) ? 0 : RESAVE_DELAY_MS
    );
    return () => clearTimeout(timer);
  }, [enabled, current, page, reached, email]);

  return current;
}
