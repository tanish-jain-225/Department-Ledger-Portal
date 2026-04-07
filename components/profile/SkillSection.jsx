import { useState } from "react";
import { useToast } from "@/lib/toast-context";
import { useLedgerSection } from "@/lib/use-ledger-section";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import DocumentPreview from "./DocumentPreview";
import SmartAssistant from "./SmartAssistant";

const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300";

const PROFICIENCY_LEVELS = [
  { value: "beginner", label: "Beginner / Exploring" },
  { value: "intermediate", label: "Intermediate / Capable" },
  { value: "advanced", label: "Advanced / Proficient" },
  { value: "expert", label: "Expert / Specialized" },
];

const CATEGORIES = [
  { value: "languages", label: "Programming Languages" },
  { value: "frameworks", label: "Frameworks & Libraries" },
  { value: "tools", label: "Tools & Infrastructure" },
  { value: "soft", label: "Soft Skills & Leadership" },
  { value: "other", label: "Other" },
];

const PROFICIENCY_DOT = {
  beginner: "bg-slate-400",
  intermediate: "bg-brand-700",
  advanced: "bg-indigo-700",
  expert: "bg-emerald-700",
};

export default function SkillSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const { editingRecord, setEditingRecord, deleteTarget, setDeleteTarget, saving, add, save, confirmDelete } =
    useLedgerSection("skills", uid, onRefresh);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("languages");
  const [proficiency, setProficiency] = useState("intermediate");
  const [document, setDocument] = useState(null);

  async function handleAdd(e) {
    if (e) e.preventDefault();
    if (!name.trim()) return;
    if (rows.find(s => s.name.toLowerCase() === name.trim().toLowerCase())) {
      addToast("Skill already exists in your ledger", "error");
      return;
    }
    await add({ name: name.trim(), category, proficiency, document }, `Added skill: ${name.trim()}`);
    setName("");
    setDocument(null);
  }

  const handleUpdate = () => save(
    { name: editingRecord?.name, category: editingRecord?.category, proficiency: editingRecord?.proficiency, document: editingRecord?.document || document },
    `Updated: ${editingRecord?.name}`
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Technical Mastery</h2>
        <p className="text-sm text-slate-500 italic">&ldquo;Professional competencies and specialized toolkits.&rdquo;</p>
      </div>

      <div className="flex flex-col gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100">
        <div>
          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Assistant</p>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-0.5">Auto-fill with AI</p>
        </div>
        <SmartAssistant mode="skill" studentUid={uid} existingData={rows}
          onExtract={(d) => {
            if (d.name) setName(d.name);
            if (d.category) setCategory(d.category);
            if (d.proficiency) setProficiency(d.proficiency);
          }}
          onDocumentSaved={setDocument}
          label="AI Skill Assistant"
        />
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-3">
        <Input placeholder="Skill Name (e.g. Python, Docker)" required value={name} onChange={e => setName(e.target.value)} />
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={category} onChange={e => setCategory(e.target.value)} className={field}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={proficiency} onChange={e => setProficiency(e.target.value)} className={field}>
            {PROFICIENCY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </div>
        <Button type="submit" className="w-full py-4 uppercase tracking-widest text-[10px] font-black">Register Skill in Ledger</Button>
      </form>

      {/* Skill cards - flex column, no grid */}
      <div className="flex flex-col gap-3">
        {rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
            <p className="text-sm text-slate-500 italic">&ldquo;No professional competencies recorded in the ledger.&rdquo;</p>
          </div>
        ) : (
          rows.map((r) => (
            <div key={r.id} className="group flex flex-col gap-3 premium-card p-4 sm:p-5 border-slate-100 hover:border-brand-500/30 transition-all">
              {/* Top row: proficiency badge + actions */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                    <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${PROFICIENCY_DOT[r.proficiency] || "bg-slate-400"}`} />
                    {r.proficiency}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingRecord({ ...r })} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setDeleteTarget(r)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
                {r.document && (
                  <DocumentPreview document={r.document} triggerLabel="View uploaded file" />
                )}
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{r.name}</h3>
              <p className="text-sm text-slate-500">{CATEGORIES.find(c => c.value === r.category)?.label || r.category}</p>
            </div>
          ))
        )}
      </div>

      <Modal open={!!editingRecord} onClose={() => setEditingRecord(null)} title="Update Skill">
        <div className="flex flex-col gap-4">
          <Input placeholder="Skill Name" value={editingRecord?.name || ""} onChange={e => setEditingRecord({ ...editingRecord, name: e.target.value })} />
          <select value={editingRecord?.category || "languages"} onChange={e => setEditingRecord({ ...editingRecord, category: e.target.value })} className={field}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={editingRecord?.proficiency || "intermediate"} onChange={e => setEditingRecord({ ...editingRecord, proficiency: e.target.value })} className={field}>
            {PROFICIENCY_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
          <Button onClick={handleUpdate} className="w-full py-4">Save Ledger Entry</Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} title="Erase Skill Entry"
        message="Permanently remove this skill from the institutional ledger? This cannot be undone."
        onConfirm={async () => {
          if (!deleteTarget) return;
          await confirmDelete(`Removed: ${deleteTarget.name}`);
          addToast("Skill entry erased", "success");
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
