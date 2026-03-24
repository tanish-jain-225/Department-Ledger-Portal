import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Head from "next/head";
import { getDb } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { isStaff } from "@/lib/roles";
import Layout, { ACCESS } from "@/components/Layout";
import Link from "next/link";
import { listByStudent } from "@/lib/data";
import StudentCard from "@/components/StudentCard";

export default function StudentCardPage() {
  const router = useRouter();
  const { uid } = router.query;
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [extra, setExtra] = useState({ academic: [], placements: [] });
  const [err, setErr] = useState("");

  const role = profile?.role;
  const canView =
    user &&
    uid &&
    role &&
    (user.uid === uid || isStaff(role));

  useEffect(() => {
    if (!router.isReady || authLoading) return;
    if (!uid || typeof uid !== "string") return;
    if (user && role && !canView) {
      router.replace("/");
      return;
    }
    if (!canView) return;
    async function load() {
      const db = getDb();
      if (!db) {
        setErr("Firebase not configured");
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) {
          setErr("Profile not found");
          return;
        }
        const userData = { id: snap.id, ...snap.data() };
        if (userData.role !== "student") {
          setErr("Profile is not a student record");
          return;
        }
        setData(userData);
        const [academic, placements] = await Promise.all([
          listByStudent("academicRecords", uid),
          listByStudent("placements", uid),
        ]);
        setExtra({ academic, placements });
      } catch (e) {
        setErr(e?.message || "Failed to load");
      }
    }
    load();
  }, [router.isReady, authLoading, uid, user, role, canView, router]);

  if (!router.isReady) {
    return (
      <Layout title="Student card" access={ACCESS.AUTH}>
        <p className="text-slate-600">Loading…</p>
      </Layout>
    );
  }

  return (
    <Layout title="Student card" access={ACCESS.AUTH}>
      <Head>
        <title>Student card — {data?.name || "Student"}</title>
      </Head>
      {err && (
        <p className="text-red-600" role="alert">
          {err}
        </p>
      )}
      {data && (
        <div className="print:block" id="print-area">
          <div className="no-print mb-6 flex items-center justify-between">
            <Link 
              href="/student" 
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
            >
              ← Back
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700 shadow-lg shadow-brand-500/20 active:scale-95 transition-all"
            >
              View / Download
            </button>
          </div>
          <StudentCard 
            data={data} 
            academic={extra.academic} 
            placements={extra.placements} 
          />
        </div>
      )}
    </Layout>
  );
}
