// A frosted window over the prize card. Rub it (mouse or finger) to wipe the
// frost away; once about half is clear the rest melts. The prize text is in
// the page the whole time, so screen readers get it, and the button clears
// the frost for keyboard users.
import { useEffect, useRef, useState } from "react";
import { PiHandSwipeRightBold } from "react-icons/pi";

const BRUSH = 30;

export default function FrostWindow({ children }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [clear, setClear] = useState(false);

  useEffect(() => {
    if (clear) return undefined;
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let w = 0;
    let h = 0;
    let dpr = 1;
    let down = false;
    let lastPt = null;
    let strokes = 0;

    const paint = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = wrap.clientWidth;
      h = wrap.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "rgba(241, 243, 255, 0.98)");
      g.addColorStop(1, "rgba(221, 226, 255, 0.98)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // Ice crystals: short feathery strokes, denser at the edges like a real window
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.lineCap = "round";
      for (let i = 0; i < 90; i += 1) {
        const edge = Math.random() < 0.7;
        const x = edge ? (Math.random() < 0.5 ? Math.random() * w * 0.22 : w - Math.random() * w * 0.22) : Math.random() * w;
        const y = Math.random() * h;
        const len = 6 + Math.random() * 22;
        const ang = Math.random() * Math.PI * 2;
        ctx.lineWidth = 0.8 + Math.random() * 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
        for (let k = 0; k < 2; k += 1) {
          const t = 0.3 + Math.random() * 0.5;
          const bx = x + Math.cos(ang) * len * t;
          const by = y + Math.sin(ang) * len * t;
          const b = ang + (Math.random() < 0.5 ? 0.7 : -0.7);
          ctx.moveTo(bx, by);
          ctx.lineTo(bx + Math.cos(b) * len * 0.4, by + Math.sin(b) * len * 0.4);
        }
        ctx.stroke();
      }
      for (let i = 0; i < 260; i += 1) {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.4 + Math.random() * 0.6})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#4100BC";
      ctx.textAlign = "center";
      ctx.font = "800 17px Manrope, sans-serif";
      ctx.fillText("Rub the frost to see the prizes", w / 2, h / 2 + 6);
    };

    const wipeAt = (x, y) => {
      ctx.globalCompositeOperation = "destination-out";
      const g = ctx.createRadialGradient(x, y, 0, x, y, BRUSH);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(0.6, "rgba(0,0,0,0.85)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, BRUSH, 0, Math.PI * 2);
      ctx.fill();
    };

    const clearedShare = () => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let seen = 0;
      let gone = 0;
      const stride = 4 * 37; // sample every 37th pixel
      for (let i = 3; i < data.length; i += stride) {
        seen += 1;
        if (data[i] < 60) gone += 1;
      }
      return gone / seen;
    };

    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onDown = (e) => {
      down = true;
      lastPt = pos(e);
      wipeAt(lastPt.x, lastPt.y);
      canvas.setPointerCapture?.(e.pointerId);
    };
    const onMove = (e) => {
      // A mouse wipes on hover too; a finger only while touching
      if (!down && e.pointerType !== "mouse") return;
      const pt = pos(e);
      if (lastPt) {
        const dist = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y);
        const steps = Math.max(1, Math.floor(dist / 8));
        for (let i = 1; i <= steps; i += 1) {
          wipeAt(lastPt.x + ((pt.x - lastPt.x) * i) / steps, lastPt.y + ((pt.y - lastPt.y) * i) / steps);
        }
      } else {
        wipeAt(pt.x, pt.y);
      }
      lastPt = pt;
      strokes += 1;
      if (strokes % 10 === 0 && clearedShare() > 0.5) setClear(true);
    };
    const onUp = () => {
      down = false;
      lastPt = null;
    };
    const onLeave = () => {
      lastPt = null;
    };

    paint();
    // Repaint once the brand fonts have loaded so the hint uses Manrope
    document.fonts?.ready.then(() => { if (strokes === 0) paint(); });
    const ro = new ResizeObserver(() => { if (strokes === 0) paint(); });
    ro.observe(wrap);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [clear]);

  return (
    <div className={`wa-frost ${clear ? "is-clear" : ""}`} ref={wrapRef}>
      {children}
      <canvas ref={canvasRef} className="wa-frost-glass" aria-hidden="true" />
      {!clear && (
        <button type="button" className="wa-frost-skip" onClick={() => setClear(true)}>
          <PiHandSwipeRightBold aria-hidden="true" /> Clear the frost
        </button>
      )}
    </div>
  );
}
