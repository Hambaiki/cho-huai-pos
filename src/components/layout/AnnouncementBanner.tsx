"use client";

import { AlertCircle, X } from "lucide-react";
import { useState } from "react";

interface AnnouncementBannerProps {
  text: string;
  closable?: boolean;
}

/**
 * Displays an announcement banner at the top of the page
 * Can be dismissed by the user
 */
export function AnnouncementBanner({
  text,
  closable = true,
}: AnnouncementBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!text || isDismissed) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-900">{text}</p>
        </div>
        {closable && (
          <button
            onClick={() => setIsDismissed(true)}
            className="shrink-0 text-amber-600 hover:text-amber-700 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
