import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";

export default function StudentStarterPage() {
  const { user, profile } = useAuth();

  return (
    <Layout title="Student Hub" access={ACCESS.STUDENT}>
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight sm:text-5xl">
            Hi, <span className="text-brand-600">{profile?.name || "Student"}</span>
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Access your academic records or generate your professional identity card for placements and applications.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 w-full max-w-4xl px-4">
          <Link
            href="/profile"
            className="group relative flex flex-col items-center p-8 rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-brand-300 hover:shadow-2xl hover:shadow-brand-500/10 active:scale-95"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">My Profile</h2>
            <p className="text-center text-slate-500 text-sm leading-relaxed">
              Manage your academic records, achievements, and professional certificates in one place.
            </p>
            <div className="mt-6 font-bold text-brand-600 text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              View Profile →
            </div>
          </Link>

          <Link
            href={`/student/${user?.uid}/card`}
            className="group relative flex flex-col items-center p-8 rounded-3xl border border-slate-200 bg-white shadow-sm transition-all hover:border-amber-300 hover:shadow-2xl hover:shadow-amber-500/10 active:scale-95"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Student Card</h2>
            <p className="text-center text-slate-500 text-sm leading-relaxed">
              Generate a shareable and printable professional identity card for your placement drives.
            </p>
            <div className="mt-6 font-bold text-amber-600 text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
              View / Download ID Card →
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
