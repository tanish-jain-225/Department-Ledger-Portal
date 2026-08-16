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
    label: "Academics",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: "extracurricular",
    label: "Achievements & Activities",
    shortLabel: "Achievements",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: "professional",
    label: "Placements & Internships",
    shortLabel: "Placements",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "portfolio",
    label: "Projects & Skills",
    shortLabel: "Projects",
    icon: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
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
          <div className="flex flex-col gap-6 sm:gap-8">
            <AchievementSection uid={uid} rows={data.achievements} onRefresh={onRefresh} />
            <ActivitySection uid={uid} rows={data.activities} onRefresh={onRefresh} />
          </div>
        );
      case "professional":
        return <PlacementSection uid={uid} rows={data.placements} onRefresh={onRefresh} />;
      case "portfolio":
        return (
          <div className="flex flex-col gap-6 sm:gap-8">
            <ProjectSection uid={uid} rows={data.projects} onRefresh={onRefresh} />
            <SkillSection uid={uid} rows={data.skills} onRefresh={onRefresh} />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
      {/* Header + Tab bar */}
      <div className="flex flex-col bg-slate-50 border-b border-slate-200">
        {/* Title row */}
        <div className="flex items-center justify-between px-3 min-[360px]:px-6 pt-4 pb-2.5">
          <div className="min-w-0">
            <h2 className="text-sm min-[340px]:text-base font-bold text-slate-900 tracking-tight">Academic Records</h2>
            <p className="text-xs text-slate-500 font-medium truncate">Official student ledger records</p>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
            {SUB_TABS.find(t => t.id === activeSubTab)?.label}
          </span>
        </div>

        {/* Tabs - 2-col grid on small mobile, flex row on sm+ */}
        <nav className="grid grid-cols-2 sm:flex sm:flex-row px-2 gap-1 pb-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 px-2.5 py-2.5 min-[360px]:px-3 sm:px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-150 border sm:border-b-2 sm:border-x-0 sm:border-t-0 truncate ${
                activeSubTab === tab.id
                  ? "bg-white text-brand-700 border-brand-500 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-transparent"
              }`}
            >
              {tab.icon}
              <span className="truncate">
                <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <main className="flex-1 p-3 min-[360px]:p-5 sm:p-8 bg-white min-w-0">
        {renderContent()}
      </main>
    </div>
  );
}
