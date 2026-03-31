import Link from "next/link";

export default function CommonFooter() {
  return (
    <footer className="no-print border-t border-slate-200 bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-400">&copy; 2026 Department Ledger Portal.</span>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="text-xs text-slate-400 hover:text-brand-600 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="text-xs text-slate-400 hover:text-brand-600 transition-colors">Terms of Use</Link>
        </div>
      </div>
    </footer>
  );
}
