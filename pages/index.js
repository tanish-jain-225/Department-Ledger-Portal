import Link from "next/link";
import Head from "next/head";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { isStaff, canManageUsers, hasApprovedRole } from "@/lib/roles";
import Button from "@/components/ui/Button";

export default function Home() {
  const { user, profile, loading } = useAuth();
  const role = profile?.role;

  return (
    <Layout title="Department Ledger" access={ACCESS.PUBLIC}>
      <Head>
        <title>Department Ledger Portal - AI-Powered Academic Records</title>
        <meta name="description" content="The modern academic ledger for departments. Track student GPA, placements, achievements and generate AI-powered placement readiness reports using Gemini." />
        <meta property="og:title" content="Department Ledger Portal - AI-Powered Academic Records" />
        <meta property="og:description" content="The modern academic ledger for departments. Track student GPA, placements, achievements and generate AI-powered placement readiness reports using Gemini." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Department Ledger Portal",
              "description": "AI-powered academic records platform for departments. Track student performance, placements, achievements and generate AI readiness reports.",
              "applicationCategory": "EducationApplication",
              "operatingSystem": "Web",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
              "featureList": [
                "AI-powered document auto-fill",
                "Placement readiness reports",
                "Academic record tracking",
                "Faculty dashboard",
                "Admin governance panel",
                "Audit trail"
              ]
            })
          }}
        />
      </Head>
      <div className="mx-auto max-w-7xl pt-8 sm:pt-12 pb-16 sm:pb-24 px-4 min-[400px]:px-6 relative overflow-x-clip">
        {/* Decorative background elements */}
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Hero Section */}
        <div className="relative z-10 text-center py-10 min-[400px]:py-14 sm:py-24 px-1 min-[400px]:px-2">

          <div className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 min-[400px]:px-4 py-2 text-[10px] min-[400px]:text-xs font-black text-brand-700 uppercase tracking-wider mb-6 sm:mb-10 shadow-sm animate-slide-up">
            <span className="h-2.5 w-2.5 rounded-full bg-brand-700 animate-pulse shrink-0"></span>
            Next-Gen Academic Infrastructure
          </div>

          <h1 className="text-[2rem] min-[360px]:text-[2.5rem] min-[430px]:text-[2.8rem] sm:text-6xl lg:text-7xl font-black tracking-tighter text-slate-900 leading-[0.92] animate-slide-up text-balance" style={{ animationDelay: "0.1s" }}>
            <span className="block">The Modern Ledger</span>
            <span className="block bg-clip-text text-transparent bg-linear-to-r from-brand-600 to-indigo-600">for Departments.</span>
          </h1>

          <p className="mt-5 min-[400px]:mt-6 sm:mt-8 text-base min-[360px]:text-lg sm:text-xl lg:text-2xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium animate-slide-up text-balance" style={{ animationDelay: "0.2s" }}>
            A unified platform for academic records, student performance tracking and departmental oversight.
          </p>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md sm:max-w-none mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {loading ? (
              <div className="h-10 w-40 flex items-center justify-center bg-slate-100 rounded-xl">
                <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user && hasApprovedRole(role) ? (
              <>
                <Link href="/profile" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8">Dashboard</Button>
                </Link>
                {canManageUsers(role) && (
                  <Link href="/admin" className="w-full sm:w-auto">
                    <Button variant="secondary" className="w-full sm:w-auto px-8">Admin Panel</Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-8">Create Account</Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto px-8">Sign In</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 sm:gap-8 sm:grid-cols-3 mt-8 sm:mt-12 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          {[
            {
              title: "AI Pulse Readiness",
              desc: "Personalized placement readiness scores and career roadmap generated via Gemini AI.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                </svg>
              ),
              iconClass: "bg-brand-700 text-white border-brand-700 shadow-lg shadow-brand-500/10",
            },
            {
              title: "Comprehensive Tracking",
              desc: "Track academic performance, activities, achievements and placements in one platform.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              iconClass: "bg-emerald-700 text-white border-emerald-700 shadow-lg shadow-emerald-500/10",
            },
            {
              title: "Audited Ledger",
              desc: "Every record is tracked and verified with complete administrative oversight and audit trails.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              iconClass: "bg-indigo-700 text-white border-indigo-700 shadow-lg shadow-indigo-500/10",
            },
          ].map((feature) => (
            <div key={feature.title} className="premium-card p-responsive">
              <div className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-lg border ${feature.iconClass}`}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 sm:mt-16 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="premium-card p-responsive">
            <div className="grid gap-8 min-[500px]:grid-cols-3 text-center">
              {[
                { label: "AI Features", value: "2" },
                { label: "Role Systems", value: "3" },
                { label: "Firestore Collections", value: "12" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-4xl font-bold  mb-1">{stat.value}</p>
                  <p className="text-sm uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
