"use client";

import { CreateStoreForm } from "@/features/stores/components/CreateStoreForm";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">
        Create your first store
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Configure store identity and currency defaults for all prices.
      </p>

      <div className="mt-8">
        <CreateStoreForm />
      </div>
    </main>
  );
}
