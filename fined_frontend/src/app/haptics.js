// Haptics (app build only), driven by what the module pages already show, so no module code changes:
//  - a quiz's explanation box turning "is-correct" / "is-wrong"  -> success buzz / soft tap
//  - the FinStars pill pulsing                                   -> light tap
//  - end-of-module confetti                                      -> celebration buzz
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

let lastBuzz = 0;
let lastCelebration = 0;

function buzz(kind) {
  const now = Date.now();
  if (kind === 'stars' && now - lastBuzz < 600) return; // stars come with the answer: one buzz is enough
  lastBuzz = now;
  const run =
    kind === 'correct' || kind === 'done'
      ? Haptics.notification({ type: NotificationType.Success })
      : Haptics.impact({ style: kind === 'wrong' ? ImpactStyle.Medium : ImpactStyle.Light });
  run.catch(() => {});
}

function onMutations(records) {
  for (const record of records) {
    if (record.type === 'attributes') {
      const el = record.target;
      if (!el.classList?.contains('checkpoint-explanation-box') || !el.classList.contains('visible')) continue;
      if (/\bvisible\b/.test(record.oldValue ?? '')) continue; // already shown before this change
      buzz(el.classList.contains('is-correct') ? 'correct' : 'wrong');
      continue;
    }
    for (const node of record.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.classList.contains('finstars-pill') && node.classList.contains('pulse')) buzz('stars');
      else if (node.classList.contains('confetti-piece') && Date.now() - lastCelebration > 3000) {
        lastCelebration = Date.now();
        buzz('done');
      }
    }
  }
}

export function setupHaptics() {
  new MutationObserver(onMutations).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class'],
    attributeOldValue: true,
  });
}
