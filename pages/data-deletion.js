import { useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";

export default function DataDeletionPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    const db = getDb();
    if (!db || !user?.uid) {
      setErr("Sign in to submit a request.");
      return;
    }
    await addDoc(collection(db, "dataDeletionRequests"), {
      uid: user.uid,
      notes,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    setMsg("Your request was recorded. An administrator will follow up.");
    setNotes("");
  }

  return (
    <Layout title="Data deletion" access={ACCESS.AUTH}>
      <article className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Data deletion request</h1>
        <p className="mt-2 text-slate-600">
          Submit a GDPR-style request to delete your personal data from this
          portal. Institutional records may be retained where required by law.
        </p>
        {!user && (
          <p className="mt-4 text-amber-800">Please sign in to continue.</p>
        )}
        {user && (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700">
                Details (optional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>
            {msg && (
              <p className="text-sm text-green-700" role="status">
                {msg}
              </p>
            )}
            {err && (
              <p className="text-sm text-red-600" role="alert">
                {err}
              </p>
            )}
            <button
              type="submit"
              className="rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              Submit request
            </button>
          </form>
        )}
      </article>
    </Layout>
  );
}
