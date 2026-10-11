'use client';

import { useEffect } from 'react';

/** Registers the service worker in production only (never in dev). */
export function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline cover is best-effort; the app works without it */
    });
  }, []);
  return null;
}
