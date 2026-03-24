import Link from "next/link";
import Layout, { ACCESS } from "@/components/Layout";

export default function PrivacyPage() {
  return (
    <Layout title="Privacy policy" access={ACCESS.PUBLIC}>
      <article className="mx-auto max-w-3xl space-y-4 text-slate-700">
        <h1 className="text-3xl font-bold text-slate-900">Privacy policy</h1>
        <p>
          This portal processes personal data for academic and departmental
          purposes. Data is stored in Firebase (Google Cloud) with access
          controlled by role. Students can request correction or deletion of
          their profile data via the{" "}
          <Link href="/data-deletion" className="text-brand-600 hover:underline">
            data deletion
          </Link>{" "}
          page.
        </p>
        <p>
          Exports for faculty and administrators may mask contact details by
          default to reduce unnecessary exposure.
        </p>
        <p>
          For questions, contact your department administrator.
        </p>
      </article>
    </Layout>
  );
}
