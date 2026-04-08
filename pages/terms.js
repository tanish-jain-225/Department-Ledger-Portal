import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-2 text-sm">{children}</div>
  </div>
);

export default function TermsPage() {
  return (
    <Layout title="Terms of Use" access={ACCESS.PUBLIC}>
      <article className="mx-auto max-w-3xl py-12 space-y-10">
        <div className="space-y-3 px-responsive">
          <h1 className="text-3xl min-[360px]:text-4xl font-black text-slate-900 tracking-tighter uppercase">Terms of Use</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Last updated: March 2026</p>
        </div>

        <div className="premium-card p-responsive space-y-8">
          <Section title="1. Acceptance of Terms">
            <p>By accessing and using the Department Ledger Portal, you agree to be bound by these Terms of Use. If you do not agree, you must not use this portal.</p>
          </Section>

          <Section title="2. Authorized Use">
            <p>This portal is intended exclusively for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Enrolled students of the institution managing their academic records</li>
              <li>Faculty members reviewing and overseeing student progress</li>
              <li>Administrators managing institutional data and user access</li>
            </ul>
            <p>Unauthorized access or use by individuals outside these categories is strictly prohibited.</p>
          </Section>

          <Section title="3. Account Responsibilities">
            <p>You are responsible for:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintaining the confidentiality of your login credentials</li>
              <li>All activity that occurs under your account</li>
              <li>Notifying administrators immediately of any unauthorized access</li>
              <li>Ensuring the accuracy of information you submit</li>
            </ul>
          </Section>

          <Section title="4. Prohibited Conduct">
            <p>You must not:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Submit false, misleading, or fraudulent academic records</li>
              <li>Attempt to access records belonging to other users</li>
              <li>Upload files containing malware, illegal content, or copyrighted material you do not own</li>
              <li>Use the AI features to generate fabricated academic credentials</li>
              <li>Attempt to reverse-engineer, scrape, or abuse the platform&apos;s APIs</li>
              <li>Share your credentials with any other person</li>
            </ul>
          </Section>

          <Section title="5. AI-Generated Content">
            <p>The Smart Analysis and Placement Readiness features use Google Gemini AI to generate suggestions and reports. These are provided for informational purposes only. AI-generated content may contain inaccuracies and should not be treated as official academic documentation. You are responsible for reviewing and verifying all AI-suggested data before saving it.</p>
          </Section>

          <Section title="6. Data Accuracy">
            <p>You are solely responsible for the accuracy of records you submit. Submitting false academic records may result in immediate account suspension and referral to institutional disciplinary processes.</p>
          </Section>

          <Section title="7. Suspension & Termination">
            <p>Administrators reserve the right to suspend or terminate access for any violation of these terms, misuse of the platform, or at the discretion of the institution. Continued use of the portal constitutes acceptance of these terms.</p>
          </Section>

          <Section title="8. Limitation of Liability">
            <p>The portal is provided &ldquo;as is&rdquo; for institutional use. We are not liable for any loss of data, inaccuracies in AI-generated content, or disruptions in service. Always maintain your own copies of important academic documents.</p>
          </Section>

          <Section title="9. Changes to Terms">
            <p>These terms may be updated periodically. Continued use of the portal after changes constitutes acceptance of the revised terms.</p>
          </Section>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">← Back to Home</Link>
        </div>
      </article>
    </Layout>
  );
}
