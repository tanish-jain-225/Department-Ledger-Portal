import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { isStaff, canManageUsers, hasApprovedRole } from "@/lib/roles";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const role = profile?.role;

  return (
    <Layout title="Department Ledger Portal" access={ACCESS.PUBLIC}>
      <div className="mx-auto max-w-4xl">
        {/* Hero */}
        <div className="text-center py-16 sm:py-24 relative">
          {/* Decorative gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
            <div className="absolute top-10 left-1/4 w-72 h-72 bg-brand-200/30 rounded-full blur-3xl animate-float" />
            <div className="absolute top-20 right-1/4 w-60 h-60 bg-violet-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
          </div>

          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200 px-4 py-1.5 text-xs font-bold text-brand-700 uppercase tracking-widest mb-6 animate-fade-in">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />
            Academic Records Portal
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Department{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-700 animate-gradient">Ledger</span>{" "}
            Portal
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            A unified platform for managing student academic records, faculty profiles, and departmental oversight — all in one place.
          </p>

          {loading && (
            <div className="mt-12 flex justify-center">
              <div className="h-6 w-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && user && hasApprovedRole(role) && (
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/profile"
                className="w-full sm:w-auto rounded-xl bg-brand-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:shadow-brand-500/30 transition-all active:scale-95"
              >
                My Profile
              </Link>
              {isStaff(role) && (
                <Link
                  href="/dashboard"
                  className="w-full sm:w-auto rounded-xl border border-brand-300 bg-brand-50 px-8 py-3.5 font-semibold text-brand-700 hover:bg-brand-100 transition-all active:scale-95"
                >
                  Dashboard
                </Link>
              )}
              {canManageUsers(role) && (
                <Link
                  href="/admin"
                  className="w-full sm:w-auto rounded-xl border border-slate-300 bg-white px-8 py-3.5 font-semibold text-slate-800 hover:bg-slate-50 shadow-sm transition-all active:scale-95"
                >
                  Admin Panel
                </Link>
              )}
            </div>
          )}

          {!loading && !user && (
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login"
                className="w-full sm:w-auto rounded-xl bg-brand-600 px-8 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:shadow-brand-500/30 transition-all active:scale-95"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto rounded-xl border-2 border-brand-600 px-8 py-3.5 font-semibold text-brand-800 hover:bg-brand-50 transition-all active:scale-95"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Feature highlights */}
        {!user && (
          <div className="grid gap-6 sm:grid-cols-3 pb-16">
            {[
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                ),
                title: "Academic Records",
                desc: "Track semester performance, GPA, and subject history with a clean timeline.",
                color: "brand",
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
                  </svg>
                ),
                title: "Identity Card",
                desc: "Generate printable student ID cards for placement drives and applications.",
                color: "amber",
              },
              {
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ),
                title: "Admin Oversight",
                desc: "Role-based access control with audit logs and secure role request management.",
                color: "violet",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="card-hover rounded-2xl border border-slate-200 bg-white p-6 shadow-sm group"
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${f.color === "brand" ? "bg-brand-50 text-brand-600" : f.color === "amber" ? "bg-amber-50 text-amber-600" : "bg-violet-50 text-violet-600"}`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
