"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    const isDev = process.env.NODE_ENV !== "production";
    const enablePwaInDev = process.env.NEXT_PUBLIC_ENABLE_PWA_IN_DEV === "true";

    if (isDev && !enablePwaInDev) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration errors can happen on unsupported contexts and are safe to ignore.
    });
  }, []);

  return null;
}
