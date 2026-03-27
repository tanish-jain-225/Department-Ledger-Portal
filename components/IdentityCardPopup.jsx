import React, { useRef } from "react";
import Modal from "./ui/Modal";
import StudentCard from "./StudentCard";
import FacultyCard from "./FacultyCard";

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

  if (!show || !data) return null;

  const handleDownload = async () => {
    const element = cardRef.current;
    if (!element) return;
    
    // Ensure the script is loaded
    if (typeof window === "undefined") return;
    const scriptId = "html2pdf-cdn-script";
    let script = document.getElementById(scriptId);
    
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      document.body.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
    }

    await performDownload(element);
  };

  const performDownload = async (element) => {
    try {
      // RESET scroll to ensure coordinate accuracy
      const scrollPos = window.scrollY;
      window.scrollTo(0, 0);

      const opt = {
        margin: [10, 10],
        filename: `${role === 'faculty' ? 'Faculty' : 'Student'}_Report_${data.name || "Member"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          allowTaint: true,
          letterRendering: true,
          scrollY: 0,
          windowWidth: 850,
          windowHeight: 4000,
          logging: false,
          onclone: (clonedDoc) => {
            // Hide all "no-print" elements
            const noPrint = clonedDoc.querySelectorAll('.no-print');
            noPrint.forEach(el => el.style.display = 'none');

            // Find the targeted card in the cloned document
            const card = clonedDoc.querySelector('[data-ref-card="true"]') || clonedDoc.querySelector('article');
            if (card) {
                // FORCE absolute visibility and calculate real height
                card.style.display = 'block'; 
                card.style.height = 'auto';
                card.style.maxHeight = 'none';
                card.style.overflow = 'visible';
                card.style.width = '794px'; // Standard A4 width at 96 DPI
                card.style.margin = '0';
                card.style.padding = '40px'; 
                card.style.background = 'white';
                card.style.position = 'relative';

                // Ensure the article inside fits the width
                const article = card.querySelector('article');
                if (article) {
                  article.style.width = '100%';
                  article.style.maxWidth = '100%';
                  article.style.minWidth = '0';
                }

                // Ensure all parents of the card are also fully open
                let parent = card.parentElement;
                while (parent) {
                  parent.style.height = 'auto';
                  parent.style.maxHeight = 'none';
                  parent.style.overflow = 'visible';
                  parent.style.display = 'block';
                  parent = parent.parentElement;
                }

                // Force all nested sections to be visible
                const sections = card.querySelectorAll('section, article, div');
                sections.forEach(s => {
                  s.style.display = 'block';
                  s.style.height = 'auto';
                  s.style.maxHeight = 'none';
                  s.style.overflow = 'visible';
                });

                // Set capture window height to some large value
                clonedDoc.documentElement.style.height = '5000px';
                clonedDoc.body.style.height = '5000px';
                clonedDoc.body.style.overflow = 'visible';
            }
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // We use the original element and let html2pdf handle the cloning via our onclone logic
      await window.html2pdf().set(opt).from(element).save();
      
      // RESTORE scroll
      window.scrollTo(0, scrollPos);
    } catch (e) {
      console.error("PDF Export Error:", e);
    }
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
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white hover:bg-emerald-700 transition-all active:scale-95 shadow-xl shadow-emerald-500/20"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Generate Authorized PDF
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
