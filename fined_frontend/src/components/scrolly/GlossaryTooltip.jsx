// One glossary tooltip for the whole module page — a port of the prototype's
// _setupJargonTooltips (engine.js): shows on hover, keyboard focus or tap;
// closes on mouse-out, blur, Escape, a tap elsewhere, or scrolling. Rendered
// in a portal so it floats above everything; all listeners are removed when
// the page unmounts.
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";

export default function GlossaryTooltip({ scopeRef }) {
  const id = useId();
  const tipRef = useRef(null);
  const termRef = useRef(null);
  const defRef = useRef(null);
  const exampleRef = useRef(null);

  useEffect(() => {
    const tooltip = tipRef.current;
    if (!tooltip) return undefined;
    let current = null;

    const jargonFrom = (target) => {
      const el = target instanceof Element ? target.closest(".jargon") : null;
      return el && scopeRef.current && scopeRef.current.contains(el) ? el : null;
    };

    const show = (el) => {
      if (current && current !== el) current.removeAttribute("aria-describedby");
      current = el;
      el.setAttribute("aria-describedby", id);
      termRef.current.textContent = el.dataset.term || "";
      defRef.current.textContent = el.dataset.def || "";
      const example = el.dataset.example;
      exampleRef.current.textContent = example || "";
      exampleRef.current.style.display = example ? "block" : "none";
      tooltip.classList.add("visible");
      const rect = el.getBoundingClientRect();
      const tRect = tooltip.getBoundingClientRect();
      let top = rect.bottom + 10;
      let placement = "below";
      let left = rect.left + rect.width / 2 - tRect.width / 2;
      left = Math.max(12, Math.min(left, window.innerWidth - tRect.width - 12));
      if (top + tRect.height > window.innerHeight - 12) {
        top = rect.top - tRect.height - 10;
        placement = "above";
      }
      tooltip.dataset.placement = placement;
      // Keep the little pointer over the word even when the box is clamped to the edge.
      const arrowX = Math.max(14, Math.min(tRect.width - 14, rect.left + rect.width / 2 - left));
      tooltip.style.setProperty("--arrow-x", `${arrowX}px`);
      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    };
    const hide = () => {
      tooltip.classList.remove("visible");
      if (current) current.removeAttribute("aria-describedby");
      current = null;
    };

    const onOver = (e) => {
      const el = jargonFrom(e.target);
      if (el) show(el);
    };
    const onOut = (e) => {
      const el = jargonFrom(e.target);
      if (el && !el.contains(e.relatedTarget)) hide();
    };
    const onFocusIn = (e) => {
      const el = jargonFrom(e.target);
      if (el) show(el);
    };
    const onFocusOut = (e) => {
      if (jargonFrom(e.target)) hide();
    };
    const onKey = (e) => {
      if (e.key === "Escape") hide();
    };
    const onClick = (e) => {
      const el = jargonFrom(e.target);
      if (!el) return hide();
      e.preventDefault();
      show(el); // taps on touch screens; tapping anywhere else closes it
    };

    document.addEventListener("mouseover", onOver);
    document.addEventListener("mouseout", onOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    window.addEventListener("scroll", hide, { passive: true });
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", hide);
      hide();
    };
  }, [id, scopeRef]);

  return createPortal(
    <div className="nc-root nc-root--portal">
      <div className="nc-tooltip" id={id} role="tooltip" ref={tipRef}>
        <div className="tt-term" ref={termRef} />
        <div className="tt-def" ref={defRef} />
        <div className="tt-example" ref={exampleRef} />
      </div>
    </div>,
    document.body
  );
}
