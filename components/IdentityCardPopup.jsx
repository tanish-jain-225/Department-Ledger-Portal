import React, { useRef } from "react";
import Modal from "./ui/Modal";
import StudentCard from "./StudentCard";
import FacultyCard from "./FacultyCard";
import DownloadPdfButton from "./ui/DownloadPdfButton";
import { buildFilename } from "../lib/pdf-download";

export default function IdentityCardPopup({ 
  show, 
  onClose, 
  role = "student",
  data, 
  academic = [], 
  activities = [], 
  achievements = [], 
  placements = [],
  showPdf = true,
}) {
  const cardRef = useRef(null);

  if (!show || !data) return null;

  const filename =
    role === "faculty"
      ? buildFilename("Faculty_Card", data.name)
      : buildFilename("Student_Card", data.name);

  const allowedRoles =
    role === "faculty"
      ? ["faculty", "admin"]
      : ["student", "faculty", "admin"];

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
          {showPdf && (
            <DownloadPdfButton
              elementRef={cardRef}
              filename={filename}
              label="Generate PDF"
              allowedRoles={allowedRoles}
              orientation="portrait"
              windowWidth={794}
              className="rounded-xl px-6 py-3 text-sm font-black shadow-xl shadow-emerald-500/20 active:scale-95"
            />
          )}
        </div>

        {/* Scalable Card Preview */}
        <div className="flex-1 flex justify-center bg-transparent py-4 overflow-y-auto overflow-x-hidden">
          <div ref={cardRef} data-ref-card="true" className="w-full max-w-4xl animate-slide-up h-fit">
            {role === "faculty" ? (
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
