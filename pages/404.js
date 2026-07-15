import Head from "next/head";
import Link from "next/link";

export default function Custom404() {
  return (
    <>
      <Head>
        <title>Page Not Found | Department Ledger Portal</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="min-h-screen bg-slate-50 px-6 py-20 text-slate-900">
        <div className="mx-auto flex max-w-2xl flex-col items-center rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-3xl font-black text-brand-700">
            404
          </div>
          <h1 className="mb-3 text-3xl font-black tracking-tight sm:text-4xl">
            The page you’re looking for is unavailable.
          </h1>
          <p className="mb-8 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
            The route may have moved, expired, or never existed. You can return home or open the dashboard from here.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Return Home
            </Link>
            <Link
              href="/"
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700"
            >
              Portal Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
