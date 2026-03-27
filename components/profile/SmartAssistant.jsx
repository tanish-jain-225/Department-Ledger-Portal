import { useRef, useState } from "react";
import { useToast } from "@/lib/toast-context";

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

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SmartAssistant({
  mode,
  onExtract,
  existingData = [],
  label = "Smart Analysis",
}) {
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState("");

  const runAnalysis = async (file) => {
    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/autofill-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (!res.ok) throw new Error("API error");

      const data = await res.json();

      // Auto-fill immediately — no confirmation
      if (onExtract) onExtract(data);
      addToast("Form filled from your document!", "success");

      // Reset after success
      setFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      addToast("Smart Analysis failed. Please try again.", "error");
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

    if (file.size > 10 * 1024 * 1024) {
      addToast("File too large. Please use a file under 10MB.", "error");
      return;
    }

    setFileName(file.name);
    await runAnalysis(file);
  };

  return (
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
            {label} — Upload file to auto-fill
          </>
        )}
      </label>

      <span className="text-[10px] text-slate-400 font-medium">
        PDF, image, or text
      </span>
    </div>
  );
}
