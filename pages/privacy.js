import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-lg font-black text-slate-900 tracking-tight">{title}</h2>
    <div className="text-slate-600 leading-relaxed space-y-2 text-sm">{children}</div>
  </div>
);

export default function PrivacyPage() {
  return (
    <Layout title="Privacy Policy" access={ACCESS.PUBLIC}>
      <article className="mx-auto max-w-3xl py-12 space-y-10">
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Privacy Policy</h1>
          <p className="text-slate-400 text-sm font-medium">Last updated: March 2026</p>
        </div>

        <div className="premium-card p-8 space-y-8">
          <Section title="1. Data We Collect">
            <p>We collect information you provide directly when registering and using the portal:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Identity data: name, email address, phone number, date of birth, gender</li>
              <li>Academic data: GPA records, semester results, branch and roll number</li>
              <li>Professional data: placement records, internship details, project portfolios</li>
              <li>Activity data: co-curricular activities, achievements, skill inventory</li>
              <li>Usage data: login timestamps, audit trail of record modifications</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Data">
            <p>Your data is used exclusively for departmental academic management purposes:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Generating AI-powered placement readiness reports via Google Gemini</li>
              <li>Enabling faculty and administrators to review student progress</li>
              <li>Producing identity cards and academic records for official use</li>
              <li>Maintaining audit trails for institutional compliance</li>
            </ul>
          </Section>

          <Section title="3. Data Storage & Security">
            <p>All data is stored in Google Firebase (Firestore and Firebase Auth), hosted on Google Cloud infrastructure. Access is controlled by role-based permissions — students can only access their own records, while faculty and administrators have supervised read access.</p>
            <p>Documents uploaded for AI analysis are processed in-memory and are not stored on our servers. They are sent directly to the Google Gemini API for extraction and discarded immediately after.</p>
          </Section>

          <Section title="4. AI Processing">
            <p>When you use the Smart Analysis feature, your uploaded documents are sent to Google&apos;s Gemini API for text extraction. This processing is governed by Google&apos;s AI usage policies. We do not store the content of uploaded documents beyond the duration of the API call.</p>
          </Section>

          <Section title="5. Data Sharing">
            <p>We do not sell or share your personal data with third parties. Data is only accessible to:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>You (the account holder)</li>
              <li>Faculty members of your department (read-only)</li>
              <li>Administrators of your institution</li>
              <li>Google Firebase and Gemini API (as infrastructure providers)</li>
            </ul>
          </Section>

          <Section title="6. Data Retention & Deletion">
            <p>Your data is retained for the duration of your enrollment or employment. You may request account deletion through the portal settings. Deletion requests are reviewed by administrators and processed within 30 days.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to access, correct, and request deletion of your personal data. Contact your department administrator to exercise these rights.</p>
          </Section>

          <Section title="8. Contact">
            <p>For privacy-related questions, contact your department administrator or the institution&apos;s data protection officer.</p>
          </Section>
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors">← Back to Home</Link>
        </div>
      </article>
    </Layout>
  );
}
