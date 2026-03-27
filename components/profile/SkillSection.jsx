import { useState } from "react";
import { createRecord, removeRecord, updateRecord } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SmartAssistant from "./SmartAssistant";

const PROFICIENCY_LEVELS = [
  { value: "beginner",     label: "Beginner / Exploring" },
  { value: "intermediate", label: "Intermediate / Capable" },
  { value: "advanced",     label: "Advanced / Proficient" },
  { value: "expert",       label: "Expert / Specialized" },
];

const CATEGORIES = [
  { value: "languages",  label: "Programming Languages" },
  { value: "frameworks", label: "Frameworks & Libraries" },
  { value: "tools",      label: "Tools & Infrastructure" },
  { value: "soft",       label: "Soft Skills & Leadership" },
  { value: "other",      label: "Other" },
];

const PROFICIENCY_DOT = {
  beginner:     "bg-slate-400",
  intermediate: "bg-brand-500",
  advanced:     "bg-indigo-500",
  expert:       "bg-emerald-500",
};

export default function SkillSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("languages");
  const [proficiency, setProficiency] = useState("intermediate");
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    if (rows.find(s => s.name.toLowerCase() === name.trim().toLowerCase())) {
      return addToast("Skill already exists in your ledger", "error");
    }
    try {
      await createRecord("skills", {
        studentUid: uid,
        name: name.trim(),
        category,
        proficiency,
      }, { actorUid: uid, description: `Added skill: ${name.trim()}` });
      addToast(`Added skill: ${name.trim()}`, "success");
      setName("");
      onRefresh();
    } catch {
      addToast("Failed to add skill", "error");
    }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    try {
      await updateRecord("skills", editingRecord.id, {
        name: editingRecord.name,
        category: editingRecord.category,
        proficiency: editingRecord.proficiency,
      }, { actorUid: uid, description: `Updated skill: ${editingRecord.name}` });
      addToast(`Updated skill: ${editingRecord.name}`, "success");
      setEditingRecord(null);
      onRefresh();
    } catch {
      addToast("Failed to update skill", "error");
    }
  }

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Technical Mastery</h2>
      <p className="text-sm text-slate-400 mt-1 italic">&ldquo;Index your professional competencies and specialized toolkits.&rdquo;</p>

      <div className="mt-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8">
        <div className="mb-4">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Master Entry</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Manual entry with AI assistance</p>
        </div>
        <SmartAssistant
          mode="skill"
          existingData={rows}
          onExtract={(data) => {
            if (data.name) setName(data.name);
            if (data.category) setCategory(data.category);
            if (data.proficiency) setProficiency(data.proficiency);
          }}
          label="AI Skill Assistant"
        />
      </div>

      <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
        <Input
          placeholder="Skill Name (e.g. Python, Docker)"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
        >
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value)}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
        >
          {PROFICIENCY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
        <div className="sm:col-span-2">
          <Button type="submit" className="w-full py-4 uppercase tracking-widest text-[10px] font-black">
            Register Skill in Ledger
          </Button>
        </div>
      </form>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.id} className="group premium-card p-6 border-slate-100 hover:border-brand-500/30 transition-all flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                  <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${PROFICIENCY_DOT[r.proficiency] || "bg-slate-400"}`} />
                  {r.proficiency}
                </span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => setEditingRecord({ ...r })} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight mb-2 uppercase tracking-tight">{r.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {CATEGORIES.find(c => c.value === r.category)?.label || r.category}
              </p>
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="sm:col-span-2 py-20 text-center bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-sm text-slate-400 font-medium italic">&ldquo;No professional competencies recorded in the ledger.&rdquo;</p>
          </div>
        )}
      </div>

      <Modal open={!!editingRecord} onClose={() => setEditingRecord(null)} title="Update Skill">
        <div className="space-y-4 pt-4">
          <Input
            placeholder="Skill Name"
            value={editingRecord?.name || ""}
            onChange={e => setEditingRecord({ ...editingRecord, name: e.target.value })}
          />
          <select
            value={editingRecord?.category || "languages"}
            onChange={e => setEditingRecord({ ...editingRecord, category: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={editingRecord?.proficiency || "intermediate"}
            onChange={e => setEditingRecord({ ...editingRecord, proficiency: e.target.value })}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
          >
            {PROFICIENCY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <Button onClick={handleUpdate} className="w-full py-4">Save Ledger Entry</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Erase Skill Entry"
        message="Are you sure you want to permanently remove this skill from the institutional ledger? This action cannot be undone."
        onConfirm={async () => {
          try {
            await removeRecord("skills", deleteTarget.id, {
              actorUid: uid,
              description: `Removed skill: ${deleteTarget.name}`
            });
            addToast("Skill entry erased", "success");
            onRefresh();
          } catch {
            addToast("Failed to remove skill", "error");
          } finally {
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
