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
      title={role === "faculty" ? "Faculty Identity Card" : "Student Identity Card"}
      fullScreen={true}
    >
      <div className="flex h-full min-h-0 flex-col gap-4">
        {/* Toolbar */}
        <div className="shrink-0 rounded-2xl border border-slate-200 bg-white/90 px-3 py-3 sm:px-4 backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Preview your identity card below. Use the button to download as PDF.
            </p>
            {showPdf && (
              <div className="w-full sm:w-auto shrink-0">
                <DownloadPdfButton
                  elementRef={cardRef}
                  filename={filename}
                  label="Download PDF"
                  allowedRoles={allowedRoles}
                  orientation="portrait"
                />
              </div>
            )}
          </div>
        </div>

        {/* Card preview */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain py-1 sm:py-2">
          <div className="mx-auto w-full max-w-5xl px-0 sm:px-1">
            <div ref={cardRef} className="w-full">
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
      </div>
    </Modal>
  );
}
