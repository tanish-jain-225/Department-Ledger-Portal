import Link from "next/link";

export default function CommonFooter() {
  return (
    <footer className="no-print border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-500 font-medium tracking-wide">&copy; {new Date().getFullYear()} Department Ledger Portal.</span>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-xs text-slate-500 hover:text-brand-600 font-medium transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-xs text-slate-500 hover:text-brand-600 font-medium transition-colors">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}
