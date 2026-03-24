import React, { useRef } from "react";
import StudentCard from "./StudentCard";

export default function StudentCardPopup({ 
  show, 
  onClose, 
  data, 
  academic = [], 
  activities = [], 
  achievements = [], 
  placements = [],
  certificates = [] 
}) {
  const cardRef = useRef(null);

  if (!show) return null;

  const handleDownload = () => {
    const element = cardRef.current;
    if (!element) return;
    
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      const opt = {
        margin: [10, 10],
        filename: `Student_Card_${data.rollNumber || "ID"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 3, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().set(opt).from(element).save();
    };
    document.body.appendChild(script);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center bg-slate-900/80 p-2 sm:p-6 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative my-auto w-full max-w-3xl max-h-none sm:max-h-[90vh] overflow-y-auto rounded-xl sm:rounded-2xl bg-slate-50 shadow-2xl flex flex-col no-print border border-slate-200">

        
        {/* Header - Not for Print */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-4">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">Digital Student Card</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Official Profile Document</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-md shadow-emerald-500/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              View / Download
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-8 flex justify-center bg-slate-50">
          <div ref={cardRef} id="print-area" className="w-full max-w-3xl flex-shrink-0">
             <StudentCard 
                data={data} 
                academic={academic} 
                activities={activities}
                achievements={achievements}
                placements={placements} 
                certificates={certificates}
              />
          </div>
        </div>

        {/* Footer - Mobile Download Button */}
        <div className="sm:hidden p-4 border-t border-slate-200 bg-white text-center">
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 shadow-lg"
            >
              View / Download (PDF)
            </button>
        </div>
      </div>

      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
