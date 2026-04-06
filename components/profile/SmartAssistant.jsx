import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/lib/toast-context";
import { getIdToken } from "@/lib/get-id-token";
import { uploadDocument, readFileAsBase64, FIRESTORE_MAX_UPLOAD_BYTES } from "@/lib/uploadCloud";

// Accepted file types for Gemini inline data
const ACCEPTED_TYPES = {
  "application/pdf": true,
  "image/png": true,
  "image/jpeg": true,
  "image/webp": true,
  "image/heic": true,
  "image/heif": true,
  "text/plain": true,
};

export default function SmartAssistant({
  mode,
  studentUid,
  onExtract,
  onDocumentSaved,
  existingData = [],
  label = "Smart Analysis",
}) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewText, setPreviewText] = useState("");
  const [previewType, setPreviewType] = useState("");
  const [documentInfo, setDocumentInfo] = useState(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const runAnalysis = async (file) => {
    setIsLoading(true);
    try {
      const base64 = await readFileAsBase64(file);
      const docInfo = await uploadDocument(file, { studentUid, section: mode });
      setDocumentInfo(docInfo);
      if (onDocumentSaved) onDocumentSaved(docInfo);

      const token = await getIdToken();

      const res = await fetch("/api/autofill-section", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          section: mode,
          existingData,
          fileData: base64,
          fileMimeType: file.type,
        }),
      });

      if (res.status === 413) {
        addToast("File too large. Please use a file under 10MB.", "error");
        return;
      }
      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        const apiMessage = errorBody?.error || `Server error ${res.status}`;
        throw new Error(apiMessage);
      }

      const data = await res.json();

      // Auto-fill immediately - no confirmation
      if (onExtract) onExtract(data);
      addToast("Form filled from your document!", "success");

      // Reset after success
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("SmartAssistant upload failed:", error);
      let message = "Smart Analysis failed. Please try again.";
      if (error?.code === "FIRESTORE_SIZE_LIMIT") {
        message = `File too large. Please upload a file smaller than ${Math.round(FIRESTORE_MAX_UPLOAD_BYTES / 1024)}KB.`;
      } else if (error?.code === "FIRESTORE_UNAVAILABLE") {
        message = "Firestore upload is unavailable in this browser session.";
      }
      addToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES[file.type]) {
      addToast("Unsupported file. Use PDF, image (PNG/JPG/WEBP), or text file.", "error");
      return;
    }

    if (file.size > FIRESTORE_MAX_UPLOAD_BYTES) {
      addToast(`File too large. Please use a file under ${Math.round(FIRESTORE_MAX_UPLOAD_BYTES / 1024)}KB.`, "error");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPreviewType(file.type);

    if (file.type.startsWith("text/")) {
      const text = await file.text();
      setPreviewText(text.slice(0, 2048));
    } else {
      setPreviewText("");
    }

    setFileName(file.name);
    await runAnalysis(file);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.heif,.txt"
          onChange={handleFileChange}
          className="hidden"
          id={`smart-upload-${mode}`}
          disabled={isLoading}
        />

        <label
          htmlFor={`smart-upload-${mode}`}
          className={`flex items-center gap-2 cursor-pointer rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all select-none
            ${isLoading
              ? "border-brand-200 bg-brand-50 text-brand-400 cursor-not-allowed pointer-events-none"
              : "border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
            }`}
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <span className="truncate max-w-[180px]">Analyzing {fileName}…</span>
            </>
          ) : (
            <>
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              {label} - Upload file to auto-fill
            </>
          )}
        </label>

        {documentInfo && (
          <div className="text-[10px] text-slate-500 font-medium mt-1">
            Document saved: {documentInfo.fileName} (Firestore)
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-slate-400 font-medium">PDF, image, or text</span>
        <span className="text-[10px] text-slate-400 font-medium">Max size: {Math.round(FIRESTORE_MAX_UPLOAD_BYTES / 1024)}KB</span>
      </div>

      {previewUrl && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-xs font-semibold text-slate-700">Preview</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-[0.25em]">{previewType || "file"}</span>
          </div>

          {previewType.startsWith("image/") ? (
            <div className="relative w-full h-56 rounded-xl overflow-hidden border border-slate-200">
              <Image
                src={previewUrl}
                alt="Document preview"
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : previewType === "application/pdf" ? (
            <iframe src={previewUrl} title="Document preview" className="h-52 w-full rounded-xl border border-slate-200" />
          ) : previewText ? (
            <textarea
              readOnly
              value={previewText}
              className="w-full min-h-[9rem] rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700"
            />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 text-[11px] text-slate-600">
              <span>{fileName || "File selected"}</span>
              <a href={previewUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-600 hover:text-brand-700">
                Open file
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
