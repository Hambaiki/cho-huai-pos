import Link from "next/link";
import { ShieldOff } from "lucide-react";

interface StoreSuspendedScreenProps {
  storeName: string;
}

export function StoreSuspendedScreen({ storeName }: StoreSuspendedScreenProps) {
  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-900 to-neutral-800 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 rounded-full mb-6">
          <ShieldOff size={32} className="text-white" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">Store Suspended</h1>

        <p className="text-neutral-300 mb-2">
          <span className="font-semibold text-white">{storeName}</span> has been
          suspended by an administrator.
        </p>

        <p className="text-neutral-400 mb-8 text-sm">
          If you believe this is a mistake, please contact a super admin for
          assistance.
        </p>

        <Link
          href="/dashboard/stores"
          className="inline-flex items-center justify-center rounded-lg border border-transparent bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-200 active:bg-neutral-300"
        >
          Back to My Stores
        </Link>
      </div>
    </div>
  );
}
