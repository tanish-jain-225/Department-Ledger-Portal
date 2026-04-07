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
      <div className="flex flex-col h-full gap-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-shrink-0">
          <p className="text-sm text-slate-500">
            Preview your identity card below. Use the button to download as PDF.
          </p>
          {showPdf && (
            <DownloadPdfButton
              elementRef={cardRef}
              filename={filename}
              label="Download PDF"
              allowedRoles={allowedRoles}
              orientation="portrait"
            />
          )}
        </div>

        {/* Card preview */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden flex justify-center py-2">
          <div ref={cardRef} className="w-full max-w-4xl">
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
