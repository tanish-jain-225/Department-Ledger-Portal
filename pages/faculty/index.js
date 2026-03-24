import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";

export default function FacultyStarterPage() {
  const { profile } = useAuth();

  return (
    <Layout title="Faculty Portal" access={ACCESS.STAFF}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Welcome, <span className="text-brand-600">{profile?.name || "Professor"}</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Choose an action to manage your professional profile or oversee the student directory.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 w-full max-w-4xl px-4">
          <Link
            href="/profile"
            className="group relative flex flex-col items-center p-8 rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-500/10 active:scale-95"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">My Profile</h2>
            <p className="text-center text-slate-500 text-sm leading-relaxed">
              Update your professional bio, manage contact details, and view your verification status.
            </p>
            <div className="mt-6 font-bold text-brand-600 text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Open Profile →
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="group relative flex flex-col items-center p-8 rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-violet-300 hover:shadow-2xl hover:shadow-violet-500/10 active:scale-95"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Records</h2>
            <p className="text-center text-slate-500 text-sm leading-relaxed">
              Browse student portfolios, search by branch/year, and oversee academic records.
            </p>
            <div className="mt-6 font-bold text-violet-600 text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              Manage Students →
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
