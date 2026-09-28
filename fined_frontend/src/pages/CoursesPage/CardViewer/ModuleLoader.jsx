// The simple loader shown while a module opens (old course and new course
// alike, owner's choice 2026-09-26): a plain page, a spinner and "Loading…",
// with no card-player chrome, so it fits in front of either kind of module.
export default function ModuleLoader() {
  return (
    <div className="cv-simple-loader" role="status" aria-live="polite">
      <span className="cv-simple-loader-spinner" aria-hidden="true" />
      <span className="cv-simple-loader-text">Loading…</span>
    </div>
  );
}
