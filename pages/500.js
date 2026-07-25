import Head from "next/head";
import Link from "next/link";

export default function Custom500() {
  return (
    <>
      <Head>
        <title>Server Error | Department Ledger Portal</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center w-full bg-slate-50 px-6 py-12 text-slate-900">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-3xl font-black text-amber-600">
            500
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight sm:text-4xl">
            Something went wrong on our side.
          </h1>
          <p className="mb-8 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
            The portal hit an unexpected runtime issue. Please refresh the page or return home while we resolve it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Refresh Page
            </button>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700"
            >
              Go Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
