import { useEffect } from 'react';
import Lenis from 'lenis';
import { Capacitor } from '@capacitor/core';

// Lenis smooth scrolling for the website. Skipped inside the mobile app, where the phone's
// own scrolling feels better and Lenis can lag on low-end Android phones.
export function useSmoothScroll() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return undefined;

    const lenis = new Lenis();
    let frameId;
    function raf(time) {
      lenis.raf(time);
      frameId = requestAnimationFrame(raf);
    }
    frameId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frameId);
      lenis.destroy();
    };
  }, []);
}
