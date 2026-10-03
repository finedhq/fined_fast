// Module 3 Chapter 3 figure — "vault_preview": a one-beat preview of where
// shares live, setting up Module 4. Drawn in CSS, numbers/labels from
// module3Figures.js. Steps by position:
// 0 a locked vault with a question mark — where is Arjun's share? ·
// 1 guess first: a paper certificate; once the step's tap-to-guess is
//   answered it turns into an electronic entry ·
// 2 the vault is labelled as a depository (NSDL / CDSL), the entry inside ·
// 3 the door opens a crack onto a corridor leading to Module 4.
export default function VaultPreview({ step, steps, state, config }) {
  const s = step ?? 0;
  const guessStepId = steps?.[1]?.step_id;
  const guessed = guessStepId ? state.guesses?.[guessStepId] !== undefined : false;
  const electronic = s >= 2 || (s === 1 && guessed);
  const label = s >= 2 ? `Depository · ${config.depositories.join(" or ")}` : "Where is it?";
  const summary =
    s === 0
      ? `A locked vault with a question mark: where is ${config.holder}'s share?`
      : s === 1 && !electronic
        ? "A paper share certificate."
        : s === 1
          ? `The paper certificate has become an electronic entry: ${config.holder} · ${config.holding}.`
          : s === 2
            ? `The vault is a depository — ${config.depositories.join(" or ")} — holding the entry ${config.holder} · ${config.holding}.`
            : `The vault door opens onto a corridor: ${config.next}.`;

  return (
    <div className="vp-figure" role="img" aria-label={summary}>
      <div className={`vp-label${s >= 2 ? " is-named" : ""}`}>{label}</div>
      <div className="vp-scene">
        <div className={`vp-vault${s === 3 ? " is-open" : ""}`}>
          <div className="vp-corridor" aria-hidden="true"></div>
          <div className="vp-door">
            <div className="vp-wheel">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          {s === 0 && <div className="vp-question">?</div>}
        </div>
      </div>
      <div className="vp-holding">
        {s >= 1 && (
          <div className={`vp-record${electronic ? " is-electronic" : ""}`}>
            {electronic ? (
              <>
                <span className="vp-record-dot"></span>
                <span className="vp-record-who">{config.holder}</span>
                <span className="vp-record-what">{config.holding}</span>
              </>
            ) : (
              <>
                <span className="vp-cert-title">Share certificate</span>
                <span className="vp-record-what">{config.holding}</span>
              </>
            )}
          </div>
        )}
        {s >= 2 && (
          <div className="vp-depositories">
            {config.depositories.map((d) => (
              <span key={d} className="vp-depository">
                {d}
              </span>
            ))}
          </div>
        )}
        {s === 3 && <div className="vp-next">→ Next door: {config.next}</div>}
      </div>
    </div>
  );
}
