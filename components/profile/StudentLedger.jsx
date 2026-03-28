import { useState } from "react";
import AcademicSection from "./AcademicSection";
import AchievementSection from "./AchievementSection";
import ActivitySection from "./ActivitySection";
import PlacementSection from "./PlacementSection";
import ProjectSection from "./ProjectSection";
import SkillSection from "./SkillSection";

const SUB_TABS = [
  {
    id: "academic",
    label: "Academy",
    icon: (
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "extracurricular",
    label: "Excellence",
    icon: (
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "professional",
    label: "Journal",
    icon: (
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: (
      <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

export default function StudentLedger({ uid, data, onRefresh }) {
  const [activeSubTab, setActiveSubTab] = useState("academic");

  const renderContent = () => {
    switch (activeSubTab) {
      case "academic":
        return <AcademicSection uid={uid} rows={data.academic} onRefresh={onRefresh} />;
      case "extracurricular":
        return (
          <div className="flex flex-col gap-10">
            <AchievementSection uid={uid} rows={data.achievements} onRefresh={onRefresh} />
            <ActivitySection uid={uid} rows={data.activities} onRefresh={onRefresh} />
          </div>
        );
      case "professional":
        return <PlacementSection uid={uid} rows={data.placements} onRefresh={onRefresh} />;
      case "portfolio":
        return (
          <div className="flex flex-col gap-10">
            <ProjectSection uid={uid} rows={data.projects} onRefresh={onRefresh} />
            <SkillSection uid={uid} rows={data.skills} onRefresh={onRefresh} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-white/40 backdrop-blur-3xl rounded-[2rem] border border-white/40 shadow-2xl overflow-hidden animate-fade-in">
      {/* Header + Tab bar */}
      <div className="flex flex-col bg-slate-900/5 border-b border-white/20">
        {/* Title row */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-3">
          <div>
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em]">Master Ledger</h2>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Institutional Index</p>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest hidden sm:block">
            {SUB_TABS.find(t => t.id === activeSubTab)?.label}
          </span>
        </div>

        {/* Tabs — 2-col grid on mobile, single row on sm+ */}
        <nav className="grid grid-cols-2 sm:flex sm:flex-row px-2 gap-1 pb-0">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center justify-center sm:justify-start gap-2 px-3 py-3 sm:px-4 rounded-xl sm:rounded-t-xl sm:rounded-b-none text-[10px] sm:text-xs font-black transition-all duration-200 uppercase tracking-widest border-2 sm:border-b-2 sm:border-x-0 sm:border-t-0 ${
                activeSubTab === tab.id
                  ? "bg-white text-slate-900 border-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40 border-transparent"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-white/20 to-transparent">
        {renderContent()}
      </main>
    </div>
  );
}
