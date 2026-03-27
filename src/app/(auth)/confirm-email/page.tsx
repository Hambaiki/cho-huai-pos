import Link from "next/link";

export const metadata = { title: "Confirm Your Email" };

export default async function ConfirmEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">Confirm your email</h1>
      <p className="mt-2 text-sm text-slate-600">
        We sent a confirmation link to
        {email ? (
          <span className="font-medium text-slate-800"> {email}</span>
        ) : (
          <span className="font-medium text-slate-800"> your email address</span>
        )}
        .
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">
          Please open your inbox and click the verification link before signing in.
          If you do not see the email, check your spam folder.
        </p>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-800"
          >
            Go to sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Create another account
          </Link>
        </div>
      </div>
    </main>
  );
}
