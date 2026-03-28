"use client";

import { Loader } from "lucide-react";

export function MaintenanceModePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-900 to-neutral-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-full mb-6">
          <Loader size={32} className="text-white animate-spin" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          System Maintenance
        </h1>

        <p className="text-neutral-300 mb-6">
          We&apos;re currently performing maintenance on the system. We&apos;ll
          be back online shortly. Thank you for your patience!
        </p>

        <div className="text-sm text-neutral-400">
          <p>If you believe this is an error, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
