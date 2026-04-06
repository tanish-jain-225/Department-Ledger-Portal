import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { isStaff } from "@/lib/roles";

function base64ToBlob(base64, mimeType = "application/octet-stream") {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    buffer[i] = binary.charCodeAt(i);
  }
  return new Blob([buffer], { type: mimeType });
}

export default function DocumentViewerPage() {
  const { query, isReady } = useRouter();
  const { documentId } = query;
  const { user, profile, loading: authLoading } = useAuth();
  const [documentData, setDocumentData] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isReady || authLoading || !documentId) return;
    async function fetchDocument() {
      setIsLoading(true);
      try {
        const db = getDb();
        if (!db) throw new Error("Firestore not initialized.");
        const snap = await getDoc(doc(db, "uploadedDocuments", documentId));
        if (!snap.exists()) {
          setError("Document not found.");
          return;
        }
        const docData = { id: snap.id, ...snap.data() };
        if (!user?.uid || (docData.studentUid !== user.uid && !isStaff(profile?.role))) {
          setError("You are not authorized to view this document.");
          return;
        }
        setDocumentData(docData);
      } catch (err) {
        setError(err?.message || "Unable to load the document.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocument();
  }, [authLoading, documentId, isReady, profile?.role, user?.uid]);

  useEffect(() => {
    if (!documentData?.data) {
      setPreviewUrl("");
      return;
    }

    try {
      const blob = base64ToBlob(documentData.data, documentData.mimeType || "application/octet-stream");
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } catch (err) {
      setError("Could not create document preview.");
    }
  }, [documentData]);

  const handleDownload = () => {
    if (!documentData?.data) return;
    const blob = base64ToBlob(documentData.data, documentData.mimeType || "application/octet-stream");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = documentData.fileName || "document";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="View Uploaded Document" access={ACCESS.AUTH}>
      <div className="mx-auto max-w-5xl p-6 sm:p-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Uploaded Document</h1>
            <p className="text-sm text-slate-500 mt-1">Preview or download a document saved in Firestore.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} disabled={!documentData || !previewUrl}>
              Download File
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading document preview…</div>
        ) : error ? (
          <EmptyState title="Unable to load document" message={error} />
        ) : !documentData ? (
          <EmptyState title="No document selected" message="Open this page with a document link from the CSV export." />
        ) : (
          <div className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">File name</p>
                  <p className="font-black text-slate-900">{documentData.fileName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <p className="font-bold text-slate-700">{documentData.mimeType || "unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Document ID</p>
                  <p className="text-xs text-slate-500 break-all">{documentData.id}</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              {previewUrl ? (
                documentData.mimeType?.startsWith("image/") ? (
                  <div className="relative w-full aspect-[16/9]">
                    <Image
                      src={previewUrl}
                      alt={documentData.fileName}
                      fill
                      className="rounded-3xl object-contain"
                      unoptimized
                    />
                  </div>
                ) : documentData.mimeType === "application/pdf" ? (
                  <iframe src={previewUrl} title={documentData.fileName} className="h-[650px] w-full rounded-3xl border" />
                ) : documentData.mimeType?.startsWith("text/") ? (
                  <textarea
                    readOnly
                    value={atob(documentData.data)}
                    className="min-h-[20rem] w-full rounded-3xl border border-slate-200 p-4 text-sm font-medium text-slate-700"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-slate-500">
                    <p className="font-semibold text-slate-900">Preview is not available for this file type.</p>
                    <p className="text-sm">Use the download button to save the file locally.</p>
                  </div>
                )
              ) : (
                <div className="py-16 text-center text-slate-500">Preparing file preview…</div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
