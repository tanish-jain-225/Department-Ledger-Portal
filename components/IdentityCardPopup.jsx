import React, { useRef, useState } from "react";
import Modal from "./ui/Modal";
import StudentCard from "./StudentCard";
import FacultyCard from "./FacultyCard";
import { downloadAsPDF } from "@/lib/pdf-download";

export default function IdentityCardPopup({ 
  show, 
  onClose, 
  role = "student",
  data, 
  academic = [], 
  activities = [], 
  achievements = [], 
  placements = [],
}) {
  const cardRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  if (!show || !data) return null;

  const handleDownload = () => {
    setPdfBusy(true);
    downloadAsPDF(
      cardRef.current,
      `${role === "faculty" ? "Faculty" : "Student"}_Card_${data.name || "Member"}`,
      () => setPdfBusy(false),
      () => setPdfBusy(false)
    );
  };

  return (
    <Modal
      open={show}
      onClose={onClose}
      title="Identity & Protocol Verification"
      fullScreen={true}
      className="!bg-transparent"
    >
      <div className="flex flex-col h-full">
        {/* Sub-Header / Toolbelt */}
        <div className="flex items-center justify-between mb-8 px-2 border-b border-white/20 pb-6">
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Verification Protocol</span>
            </div>
            <button
              onClick={handleDownload}
              disabled={pdfBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-60"
            >
              {pdfBusy ? (
                <><div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating...</>
              ) : (
                <><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>Generate Authorized PDF</>
              )}
            </button>
        </div>

        {/* Scalable Card Preview */}
        <div className="flex-1 flex justify-center bg-transparent py-4 overflow-y-auto overflow-x-hidden">
          <div ref={cardRef} data-ref-card="true" className="w-full max-w-4xl animate-slide-up h-fit">
             {role === 'faculty' ? (
                <FacultyCard data={data} />
             ) : (
                <StudentCard 
                  data={data} 
                  academic={academic} 
                  activities={activities}
                  achievements={achievements}
                  placements={placements} 
                />
             )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
