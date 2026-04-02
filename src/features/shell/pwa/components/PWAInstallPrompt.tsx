"use client";

import { Button } from "@/components/ui/Button";
import {
  PWA_INSTALL_DISMISS_COOLDOWN_MS,
  PWA_INSTALL_DISMISS_KEY,
} from "@/features/shell/pwa/constants";
import { cn } from "@/lib/utils/cn";
import { Download, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptOutcome = "accepted" | "dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: BeforeInstallPromptOutcome;
    platform: string;
  }>;
}

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  const displayModeStandalone = window.matchMedia(
    "(display-mode: standalone)",
  ).matches;
  const iosStandalone = Boolean(
    (window.navigator as NavigatorWithStandalone).standalone,
  );

  return displayModeStandalone || iosStandalone;
}

function shouldSuppressPromptByDismissal() {
  if (typeof window === "undefined") {
    return false;
  }

  const dismissedAt = window.localStorage.getItem(PWA_INSTALL_DISMISS_KEY);
  if (!dismissedAt) {
    return false;
  }

  const dismissedTs = Number(dismissedAt);
  if (Number.isNaN(dismissedTs)) {
    return false;
  }

  return Date.now() - dismissedTs < PWA_INSTALL_DISMISS_COOLDOWN_MS;
}

function setDismissedNow() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PWA_INSTALL_DISMISS_KEY, String(Date.now()));
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() =>
    shouldSuppressPromptByDismissal(),
  );
  const [isInstalled, setIsInstalled] = useState(() => isStandaloneMode());

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      const promptEvent = event as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const canShowPrompt = useMemo(
    () => Boolean(deferredPrompt) && !isInstalled && !isDismissed,
    [deferredPrompt, isInstalled, isDismissed],
  );

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    setIsInstalling(true);
    await deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    setIsInstalling(false);
    setDeferredPrompt(null);

    if (result.outcome === "accepted") {
      setIsInstalled(true);
      return;
    }

    setDismissedNow();
    setIsDismissed(true);
  };

  const handleDismiss = () => {
    setDismissedNow();
    setIsDismissed(true);
  };

  if (!canShowPrompt) {
    return null;
  }

  return (
    <section
      aria-label="Install app"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-4 z-50 px-4",
        "animate-in slide-in-from-bottom-5 duration-300",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm",
          "sm:p-4",
        )}
      >
        <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 sm:flex">
          <Download className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">
            Install CHO-HUAI POS
          </p>
          <p className="text-xs text-slate-600 sm:text-sm">
            Add this app to your home screen for faster access and a full-screen
            app-like experience.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            aria-label="Dismiss install prompt"
            onClick={handleDismiss}
            size="icon"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button
            icon={<Download className="h-4 w-4" />}
            isLoading={isInstalling}
            onClick={handleInstall}
            size="sm"
          >
            Install
          </Button>
        </div>
      </div>
    </section>
  );
}
