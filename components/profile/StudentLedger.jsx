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
    label: "Institutional Academy", 
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> 
  },
  { 
    id: "extracurricular", 
    label: "Excellence Feed", 
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> 
  },
  { 
    id: "professional", 
    label: "Professional Journal", 
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> 
  },
  { 
    id: "portfolio", 
    label: "Technical Portfolio", 
    icon: <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg> 
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
          <div className="space-y-12">
            <AchievementSection uid={uid} rows={data.achievements} onRefresh={onRefresh} />
            <ActivitySection uid={uid} rows={data.activities} onRefresh={onRefresh} />
          </div>
        );
      case "professional":
        return <PlacementSection uid={uid} rows={data.placements} onRefresh={onRefresh} />;
      case "portfolio":
        return (
          <div className="space-y-12">
             <ProjectSection uid={uid} rows={data.projects} onRefresh={onRefresh} />
             <SkillSection uid={uid} rows={data.skills} onRefresh={onRefresh} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-white/40 backdrop-blur-3xl rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden min-h-[700px] animate-fade-in group">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-slate-900/5 border-b lg:border-b-0 lg:border-r border-white/20 p-6 flex flex-col pt-10">
        <div className="px-4 mb-10">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em]">Master Ledger</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Institutional Index</p>
        </div>
        
        <nav className="space-y-2 flex-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all duration-500 uppercase tracking-widest ${
                activeSubTab === tab.id
                  ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20 translate-x-1"
                  : "text-slate-500 hover:bg-white/50 hover:text-slate-900 hover:translate-x-1"
              }`}
            >
              <span className={`transition-transform duration-500 ${activeSubTab === tab.id ? "scale-110" : "group-hover:rotate-6"}`}>
                {tab.icon}
              </span>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-10 px-5 py-6 bg-brand-600/5 rounded-3xl border border-brand-600/10">
           <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-1 italic">Ledger Status</p>
           <p className="text-xs font-bold text-slate-600">Dynamic Multi-Modal Sync Active</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-12 overflow-auto bg-gradient-to-br from-white/20 to-transparent">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
