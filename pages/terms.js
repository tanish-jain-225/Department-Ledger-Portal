import Layout, { ACCESS } from "@/components/Layout";

export default function TermsPage() {
  return (
    <Layout title="Terms of use" access={ACCESS.PUBLIC}>
      <article className="mx-auto max-w-3xl space-y-4 text-slate-700">
        <h1 className="text-3xl font-bold text-slate-900">Terms of use</h1>
        <p>
          Use this portal only for legitimate department business. Do not share
          credentials. Uploaded files must not violate copyright or contain
          unlawful content.
        </p>
        <p>
          Administrators may suspend access for misuse. Continued use
          constitutes acceptance of these terms.
        </p>
      </article>
    </Layout>
  );
}
