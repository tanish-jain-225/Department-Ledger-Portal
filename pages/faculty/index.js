import Link from "next/link";
import { Layout, ACCESS } from "@/components";
import { useAuth } from "@/lib/auth-context";

export default function FacultyStarterPage() {
  const { profile } = useAuth();

  return (
    <Layout title="Staff Intelligence" access={ACCESS.STAFF}>
      <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 animate-fade-in">
        <div className="text-center mb-16 px-6">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter sm:text-7xl leading-none">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-brand-600">{profile?.name || "Professor"}</span>
          </h1>
          <p className="mt-6 text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed italic">
            &ldquo;Orchestrate departmental records and oversee student academic integrity with precision.&rdquo;
          </p>
        </div>

        <div className="grid gap-10 sm:grid-cols-2 w-full max-w-5xl px-6">
          <Link
            href="/profile"
            className="group premium-card p-10 flex flex-col items-center text-center transition-all hover:translate-y-[-8px]"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-6 transition-all shadow-xl shadow-indigo-500/10 border border-indigo-100">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Staff ID</h2>
            <p className="text-slate-500 text-base font-medium leading-relaxed mb-8">
              Manage your personal and professional identity, contact information, and verification status.
            </p>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 border-b-2 border-indigo-200 pb-1 group-hover:border-indigo-600 transition-all">
              Manage Profile
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="group premium-card p-10 flex flex-col items-center text-center transition-all hover:translate-y-[-8px]"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white group-hover:-rotate-6 transition-all shadow-xl shadow-brand-500/10 border border-brand-100">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Student Records</h2>
            <p className="text-slate-500 text-base font-medium leading-relaxed mb-8">
              Search, audit, and oversee student records for your department. Full data governance enabled.
            </p>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-600 border-b-2 border-brand-200 pb-1 group-hover:border-brand-600 transition-all">
              Initialize Dashboard
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
