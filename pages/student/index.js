import Link from "next/link";
import { Layout, ACCESS } from "@/components";
import { useAuth } from "@/lib/auth-context";

export default function StudentStarterPage() {
  const { user, profile } = useAuth();
  return (
    <Layout title="Student Hub" access={ACCESS.STUDENT}>

      <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 animate-fade-in">
        <div className="text-center mb-16 px-6">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter sm:text-7xl leading-none transition-all">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-600">{profile?.name || "Scholar"}</span>
          </h1>
          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed italic">
            &ldquo;Your academic legacy, secured by the ledger. Access your professional profile and verified records.&rdquo;
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 w-full max-w-5xl px-6">
          <Link
            href="/profile"
            className="group premium-card p-10 flex flex-col items-center text-center transition-all hover:translate-y-[-8px]"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white group-hover:rotate-6 transition-all shadow-xl shadow-brand-500/10 border border-brand-100">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">The Profile</h2>
            <p className="text-slate-500 text-base font-medium leading-relaxed mb-8">
              Manage your academic records, achievements and AI-driven placement insights.
            </p>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 border-b-2 border-brand-200 pb-1 group-hover:border-brand-600 transition-all">
              Launch Console
            </div>
          </Link>

          <Link
            href="/profile?tab=records"
            className="group premium-card p-10 flex flex-col items-center text-center transition-all hover:translate-y-[-8px] relative overflow-hidden"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:-rotate-6 transition-all shadow-xl shadow-indigo-500/10 border border-indigo-100">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Student Records</h2>
            <p className="text-slate-500 text-base font-medium leading-relaxed mb-8">
              Verify your academic history, professional achievements and AI-driven placement insights.
            </p>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 border-b-2 border-indigo-200 pb-1 group-hover:border-indigo-600 transition-all">
              Inspect Records
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
