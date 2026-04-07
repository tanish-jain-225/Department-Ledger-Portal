import Image from "next/image";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Modal from "@/components/ui/Modal";
import { getDb } from "@/lib/firebase";

function base64ToBlob(base64, mimeType) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export default function DocumentPreview({ document, triggerLabel = "View file" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewType, setPreviewType] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [displayName, setDisplayName] = useState(document?.fileName || "Document");

  useEffect(() => {
    if (!open || !document?.documentId) return;
    let active = true;
    let objectUrl = null;

    async function loadDocument() {
      setLoading(true);
      setError("");
      setPreviewText("");
      try {
        const db = getDb();
        if (!db) throw new Error("Firestore is not initialized.");

        const snap = await getDoc(doc(db, "uploadedDocuments", document.documentId));
        if (!snap.exists()) throw new Error("Uploaded file not found.");

        const data = snap.data();
        const mimeType = data?.mimeType || document.mimeType || "application/octet-stream";
        const fileName = data?.fileName || document.fileName || "document";
        setDisplayName(fileName);
        setPreviewType(mimeType);

        if (!data?.data) {
          throw new Error("Uploaded file content is missing.");
        }

        if (mimeType.startsWith("text/")) {
          const decoded = atob(data.data);
          if (active) {
            setPreviewText(decoded.slice(0, 2048));
            setPreviewUrl(null);
          }
        } else {
          const blob = base64ToBlob(data.data, mimeType);
          objectUrl = URL.createObjectURL(blob);
          if (active) {
            setPreviewUrl(objectUrl);
          }
        }
      } catch (err) {
        if (active) {
          if (err?.code === "permission-denied") {
            setError("You are not authorized to view this document.");
          } else {
            setError(err.message || "Failed to load uploaded document.");
          }
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [open, document]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-600 hover:text-brand-700 transition-colors"
      >
        {triggerLabel}
      </button>

      <Modal title={`Preview: ${displayName}`} open={open} onClose={() => setOpen(false)} maxWidth="max-w-4xl">
        <div className="space-y-4">
          {loading && (
            <div className="text-sm text-slate-500">Loading document…</div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-700 bg-red-700 p-5 text-sm text-white shadow-lg shadow-red-900/10 flex items-center gap-3">
              <div className="h-6 w-6 shrink-0 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {previewType.startsWith("image/") && previewUrl && (
                <div className="relative w-full h-64 overflow-hidden rounded-2xl border border-slate-200">
                  <Image
                    src={previewUrl}
                    alt={displayName}
                    fill
                    className="rounded-2xl object-contain"
                    unoptimized
                  />
                </div>
              )}

              {previewType === "application/pdf" && previewUrl && (
                <div className="h-[55vh] sm:h-[65vh] w-full overflow-hidden rounded-2xl border border-slate-200">
                  <iframe
                    src={previewUrl}
                    title={displayName}
                    className="h-full w-full"
                  />
                </div>
              )}

              {previewType.startsWith("text/") && previewText && (
                <textarea
                  readOnly
                  value={previewText}
                  className="w-full min-h-[28vh] rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700"
                />
              )}

              {!loading && !error && !previewUrl && !previewText && (
                <div className="rounded-2xl border border-slate-800 bg-slate-800 p-5 text-sm text-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">The uploaded document is ready. Use the download button below to open it.</span>
                  </div>
                </div>
              )}

              {previewUrl && (
                <a
                  href={previewUrl}
                  download={displayName}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-700 px-8 py-4 text-sm font-black text-white hover:bg-brand-800 transition-all active:scale-95 shadow-xl shadow-brand-900/10 uppercase tracking-widest sm:w-auto"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download / Open File
                </a>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
