// Snow for the WinterArc hero. Flakes drift down over the illustrated hills,
// the cursor (or a finger) blows them aside, and they pile up on top of any
// element inside the hero marked data-snow-ledge="<max pile height in px>".
// Hovering or tapping a pile knocks the snow off. Pauses when the hero is off
// screen or the tab is hidden; with reduced motion it draws one still frame.
import { useEffect, useRef } from "react";

const FLAKE_FILL = "rgba(255, 255, 255, 0.95)";
const FLAKE_EDGE = "rgba(98, 84, 200, 0.42)";
const PILE_EDGE = "rgba(98, 84, 200, 0.5)";
const CRYSTAL = "rgba(118, 104, 232, 0.75)";
const WIND_RADIUS = 110;

export default function SnowField({ hostRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return undefined;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let flakes = [];
    let ledges = [];
    let raf = 0;
    let last = 0;
    let lastScan = 0;
    let onScreen = true;
    // Piles wait until the hero's buttons and card have finished fading in
    const pilesFrom = performance.now() + 1400;
    const pointer = { x: -9999, y: -9999 };
    const bound = new WeakSet();
    const bindings = [];

    const makeFlake = (y) => {
      // About one in eight is a six-point crystal; the rest are soft round flakes
      const crystal = Math.random() < 0.13;
      const r = crystal ? 4 + Math.random() * 3 : 1.5 + Math.random() * 2.8;
      return {
        x: Math.random() * w,
        y: y ?? Math.random() * h,
        r,
        crystal,
        spin: Math.random() * Math.PI,
        vy: crystal ? 0.45 + Math.random() * 0.35 : 0.28 + r * 0.24,
        vx: 0,
        phase: Math.random() * Math.PI * 2,
        sway: 0.25 + Math.random() * 0.55,
        a: 0.6 + Math.random() * 0.4,
      };
    };

    // Ends of a pile stay low so it looks like a rounded cap of snow
    const capAt = (l, i) => {
      const t = i / (l.cols - 1);
      const edge = Math.min(1, Math.min(t, 1 - t) * 6);
      return l.max * (0.3 + 0.7 * edge);
    };

    const knockOff = (l) => {
      for (let i = 0; i < l.cols; i += 2) {
        if (l.heights[i] < 1) continue;
        const f = makeFlake(l.top - l.heights[i]);
        f.x = l.left + ((i + 0.5) / l.cols) * l.width;
        f.vy = 0.8 + Math.random() * 1.2;
        f.vx = (Math.random() - 0.5) * 2.4;
        f.extra = true;
        flakes.push(f);
      }
      l.heights.fill(0);
    };

    const scanLedges = () => {
      const hr = host.getBoundingClientRect();
      const next = [];
      host.querySelectorAll("[data-snow-ledge]").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 24 || r.height < 8) return;
        const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        const inset = Math.min(radius, r.height / 2) * 0.55;
        const width = r.width - inset * 2;
        const cols = Math.max(6, Math.round(width / 3));
        const old = ledges.find((l) => l.el === el);
        const ledge = {
          el,
          left: r.left - hr.left + inset,
          top: r.top - hr.top,
          width,
          cols,
          max: Number(el.dataset.snowLedge) || 10,
          heights: old && old.cols === cols ? old.heights : new Float32Array(cols),
        };
        if (!old) {
          for (let i = 0; i < cols; i += 1) {
            const t = i / (cols - 1);
            const edge = Math.min(1, Math.min(t, 1 - t) * 6);
            ledge.heights[i] = ledge.max * (0.3 + 0.7 * edge) * (0.5 + Math.random() * 0.15);
          }
        }
        next.push(ledge);
        if (!bound.has(el) && !reduce) {
          bound.add(el);
          const shake = () => {
            const l = ledges.find((x) => x.el === el);
            if (l) knockOff(l);
          };
          el.addEventListener("pointerenter", shake);
          el.addEventListener("pointerdown", shake);
          bindings.push([el, shake]);
        }
      });
      ledges = next;
    };

    const deposit = (l, i, r) => {
      [[0, 0.95], [-1, 0.6], [1, 0.6], [-2, 0.3], [2, 0.3]].forEach(([d, k]) => {
        const j = i + d;
        if (j < 0 || j >= l.cols) return;
        l.heights[j] = Math.min(capAt(l, j), l.heights[j] + r * k);
      });
    };

    const drawPiles = () => {
      ledges.forEach((l) => {
        let any = false;
        for (let i = 0; i < l.cols; i += 1) if (l.heights[i] > 0.4) { any = true; break; }
        if (!any) return;
        ctx.beginPath();
        ctx.moveTo(l.left - 3, l.top + 1.5);
        let px = l.left;
        let py = l.top - l.heights[0];
        ctx.lineTo(px, py);
        for (let i = 1; i < l.cols; i += 1) {
          const x = l.left + ((i + 0.5) / l.cols) * l.width;
          const y = l.top - l.heights[i];
          ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
          px = x;
          py = y;
        }
        ctx.lineTo(l.left + l.width + 3, l.top + 1.5);
        ctx.closePath();
        ctx.save();
        ctx.shadowColor = "rgba(65, 0, 188, 0.22)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 1.5;
        // White on top, a touch of ice blue underneath, so it reads on a pale sky
        let peak = 0;
        for (let i = 0; i < l.cols; i += 1) peak = Math.max(peak, l.heights[i]);
        const g = ctx.createLinearGradient(0, l.top - peak, 0, l.top + 1);
        g.addColorStop(0, "#FFFFFF");
        g.addColorStop(0.55, "#F4F5FF");
        g.addColorStop(1, "#DCE1FF");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = PILE_EDGE;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    const drawFlakes = () => {
      ctx.fillStyle = FLAKE_FILL;
      ctx.strokeStyle = FLAKE_EDGE;
      ctx.lineWidth = 0.8;
      flakes.forEach((f) => {
        ctx.globalAlpha = f.a;
        if (f.crystal) {
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.spin + f.phase * 0.5);
          ctx.strokeStyle = CRYSTAL;
          ctx.lineWidth = 1.3;
          ctx.lineCap = "round";
          ctx.beginPath();
          for (let k = 0; k < 3; k += 1) {
            const a = (k * Math.PI) / 3;
            ctx.moveTo(-Math.cos(a) * f.r, -Math.sin(a) * f.r);
            ctx.lineTo(Math.cos(a) * f.r, Math.sin(a) * f.r);
          }
          ctx.stroke();
          ctx.restore();
          ctx.strokeStyle = FLAKE_EDGE;
          ctx.lineWidth = 0.8;
          return;
        }
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };

    const step = (now) => {
      raf = requestAnimationFrame(step);
      const dt = last ? Math.min(3, (now - last) / 16.67) : 1;
      last = now;
      if (now - lastScan > 900) {
        scanLedges();
        lastScan = now;
      }

      for (let n = flakes.length - 1; n >= 0; n -= 1) {
        const f = flakes[n];
        const prevY = f.y;
        f.phase += 0.012 * dt;

        const dx = f.x - pointer.x;
        const dy = f.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < WIND_RADIUS * WIND_RADIUS) {
          const d = Math.sqrt(d2) || 1;
          const push = (1 - d / WIND_RADIUS) * 0.9;
          f.vx += (dx / d) * push;
        }
        f.vx *= 0.95;
        f.x += (Math.sin(f.phase) * f.sway * 0.45 + f.vx) * dt;
        f.y += f.vy * dt;

        let landed = false;
        for (let k = 0; k < ledges.length && !f.extra; k += 1) {
          const l = ledges[k];
          if (f.x < l.left || f.x > l.left + l.width) continue;
          const i = Math.min(l.cols - 1, Math.floor(((f.x - l.left) / l.width) * l.cols));
          const surface = l.top - l.heights[i];
          if (prevY <= surface && f.y >= surface) {
            deposit(l, i, f.r);
            landed = true;
            break;
          }
        }

        if (landed || f.y > h + 6 || f.x < -20 || f.x > w + 20) {
          if (f.extra) flakes.splice(n, 1);
          else Object.assign(f, makeFlake(-6));
        }
      }

      ctx.clearRect(0, 0, w, h);
      if (now >= pilesFrom) drawPiles();
      drawFlakes();
    };

    const start = () => {
      if (reduce || raf || !onScreen || document.hidden) return;
      last = 0;
      raf = requestAnimationFrame(step);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = host.clientWidth;
      h = host.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(150, Math.max(36, (w * h) / 8500)));
      flakes = Array.from({ length: count }, () => makeFlake());
      scanLedges();
      if (reduce) {
        ledges.forEach((l) => { for (let i = 0; i < l.cols; i += 1) l.heights[i] = capAt(l, i) * 0.7; });
        ctx.clearRect(0, 0, w, h);
        drawPiles();
        drawFlakes();
      }
    };

    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    io.observe(host);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      bindings.forEach(([el, fn]) => {
        el.removeEventListener("pointerenter", fn);
        el.removeEventListener("pointerdown", fn);
      });
    };
  }, [hostRef]);

  return <canvas ref={canvasRef} className="wa-snow" aria-hidden="true" />;
}
