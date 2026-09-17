'use client';

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration failure (e.g. unsupported context) must not break the app.
    });
  }, []);

  return null;
}
