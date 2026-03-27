import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState("");
  const cardRef = useRef(null);

  const role = profile?.role;
  const canView = user && uid && role && (user.uid === uid || isStaff(role));

  useEffect(() => {
    if (!router.isReady || authLoading) return;
    if (!uid || typeof uid !== "string") return;
    if (user && role && !canView) { router.replace("/"); return; }
    if (!canView) return;
    async function load() {
      const db = getDb();
      if (!db) { setErr("Firebase not configured"); return; }
      try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists()) { setErr("Profile not found"); return; }
        const userData = { id: snap.id, ...snap.data() };
        if (userData.role !== "student") { setErr("Profile is not a student record"); return; }
        setData(userData);
        const [academic, placements] = await Promise.all([
          listByStudent("academicRecords", uid),
          listByStudent("placements", uid),
        ]);
        setExtra({ academic, placements });
      } catch (e) { setErr(e?.message || "Failed to load"); }
    }
    load();
  }, [router.isReady, authLoading, uid, user, role, canView, router]);

  const handleDownload = () => {
    const element = cardRef.current;
    if (!element) return;
    setPdfErr("");
    setPdfBusy(true);

    const scriptId = "html2pdf-cdn-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => performDownload(element);
      script.onerror = () => {
        setPdfBusy(false);
        setPdfErr("PDF library failed to load. Check your internet connection and try again.");
      };
      document.body.appendChild(script);
    } else {
      performDownload(element);
    }
  };

  const performDownload = async (element) => {
    const clone = element.cloneNode(true);
    clone.style.animation = 'none';
    clone.style.transition = 'none';
    clone.style.opacity = '1';
    clone.style.visibility = 'visible';
    clone.style.position = 'relative';
    clone.style.width = '800px';
    clone.style.margin = '0';
    clone.style.padding = '40px';

    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-10000px';
    container.style.left = '0';
    container.style.width = '1000px';
    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      const opt = {
        margin: [5, 5],
        filename: `Student_Card_${data.rollNumber || "ID"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          windowWidth: 1000,
          logging: false
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      await window.html2pdf().set(opt).from(clone).save();
    } catch (e) {
      console.error("PDF Export Error:", e);
      setPdfErr("PDF export failed. Please try again.");
    } finally {
      document.body.removeChild(container);
      setPdfBusy(false);
    }
  };

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
          <div className="no-print mb-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Link
                href="/student"
                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-brand-600 transition-colors"
              >
                ← Back
              </Link>
              <button
                type="button"
                onClick={handleDownload}
                disabled={pdfBusy}
                className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 active:scale-95 transition-all uppercase tracking-widest disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {pdfBusy && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {pdfBusy ? "Generating PDF..." : "Download Professional Identity (PDF)"}
              </button>
            </div>
            {pdfErr && (
              <p className="text-sm text-red-600 font-medium text-right">{pdfErr}</p>
            )}
          </div>
          <div ref={cardRef}>
            <StudentCard 
              data={data} 
              academic={extra.academic} 
              placements={extra.placements} 
            />
          </div>
        </div>
      )}
    </Layout>
  );
}

