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
      <div className="flex-1 flex flex-col justify-between w-full relative overflow-x-hidden">
        {/* Full-width decorative background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 -left-1/4 w-3/4 h-3/4 bg-brand-500/10 rounded-full blur-[140px]" />
          <div className="absolute top-1/4 -right-1/4 w-3/4 h-3/4 bg-indigo-500/10 rounded-full blur-[140px]" />
        </div>

        {/* Content container */}
        <div className="relative z-10 flex-1 flex flex-col justify-between w-full max-w-7xl mx-auto px-3 min-[360px]:px-6 sm:px-8 py-6 sm:py-10">
          {/* Hero Section */}
          <div className="text-center py-4 min-[360px]:py-8 sm:py-14 px-1 my-auto">

          <div className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-[10px] min-[360px]:text-xs font-bold text-brand-700 uppercase tracking-wider mb-5 sm:mb-8 shadow-xs animate-slide-up">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            Academic Department Portal
          </div>

          <h1 className="text-2xl min-[340px]:text-3xl min-[430px]:text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight animate-slide-up text-balance" style={{ animationDelay: "0.1s" }}>
            <span className="block">The Modern Ledger</span>
            <span className="block bg-clip-text text-transparent bg-linear-to-r from-brand-600 to-indigo-600">for Departments.</span>
          </h1>

          <p className="mt-4 sm:mt-6 text-sm min-[360px]:text-base sm:text-lg lg:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed font-medium animate-slide-up text-balance" style={{ animationDelay: "0.2s" }}>
            A unified portal for academic ledgers, student performance tracking, and verified departmental records.
          </p>

          <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-md sm:max-w-none mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {loading ? (
              <div className="h-10 w-40 flex items-center justify-center bg-slate-100 rounded-xl">
                <div className="h-4 w-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : user && hasApprovedRole(role) ? (
              <>
                <Link href="/profile" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold">Dashboard</Button>
                </Link>
                {canManageUsers(role) && (
                  <Link href="/admin" className="w-full sm:w-auto">
                    <Button variant="secondary" className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold">Admin Panel</Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/register" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold">Create Account</Button>
                </Link>
                <Link href="/login" className="w-full sm:w-auto">
                  <Button variant="secondary" className="w-full sm:w-auto px-6 py-2.5 text-xs font-bold">Sign In</Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3 mt-6 sm:mt-10 animate-slide-up" style={{ animationDelay: "0.4s" }}>
          {[
            {
              title: "AI Pulse Readiness",
              desc: "Personalized placement readiness scores and career roadmap generated via Gemini AI.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.989-2.386l-.548-.547z" />
                </svg>
              ),
              iconClass: "bg-brand-700 text-white border-brand-700 shadow-sm",
            },
            {
              title: "Comprehensive Tracking",
              desc: "Track academic performance, activities, achievements and placements in one platform.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ),
              iconClass: "bg-emerald-700 text-white border-emerald-700 shadow-sm",
            },
            {
              title: "Audited Ledger",
              desc: "Every record is tracked and verified with complete administrative oversight and audit trails.",
              icon: (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              iconClass: "bg-indigo-700 text-white border-indigo-700 shadow-sm",
            },
          ].map((feature) => (
            <div key={feature.title} className="premium-card p-4 sm:p-6 min-w-0">
              <div className={`mb-4 inline-flex h-9 w-9 items-center justify-center rounded-xl border ${feature.iconClass}`}>
                {feature.icon}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1.5">{feature.title}</h3>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 sm:mt-8 animate-slide-up" style={{ animationDelay: "0.5s" }}>
          <div className="premium-card p-4 sm:p-6">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              {[
                { label: "AI Features", value: "2" },
                { label: "Role Systems", value: "3" },
                { label: "Collections", value: "12" },
              ].map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <p className="text-xl sm:text-3xl font-black text-slate-900 mb-0.5">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
  );
}
