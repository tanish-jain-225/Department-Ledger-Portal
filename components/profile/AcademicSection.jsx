import { useState } from "react";
import { useToast } from "@/lib/toast-context";
import { useLedgerSection } from "@/lib/use-ledger-section";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import DocumentPreview from "./DocumentPreview";
import SmartAssistant from "./SmartAssistant";

const field = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300";

export default function AcademicSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const { editingRecord, setEditingRecord, deleteTarget, setDeleteTarget, saving, add, save, confirmDelete } =
    useLedgerSection("academicRecords", uid, onRefresh);

  const [year, setYear]           = useState("");
  const [semester, setSemester]   = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [gpa, setGpa]             = useState("");
  const [subjects, setSubjects]   = useState("");
  const [branch, setBranch]       = useState("");
  const [document, setDocument]   = useState(null);

  async function handleAdd(e) {
    if (e) e.preventDefault();
    const gpaNum = parseFloat(gpa);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
      addToast("GPA must be a number between 0 and 10.", "error");
      return;
    }
    await add(
      { year, semester, gpa, subjects, rollNumber, branch, document },
      `Added academic record for Year ${year} Sem ${semester}`
    );
    setYear(""); setSemester(""); setGpa(""); setSubjects(""); setRollNumber(""); setBranch(""); setDocument(null);
  }

  async function handleUpdate() {
    const gpaNum = parseFloat(editingRecord?.gpa);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
      addToast("GPA must be a number between 0 and 10.", "error");
      return;
    }
    await save(
      { year: editingRecord.year, semester: editingRecord.semester, gpa: editingRecord.gpa,
        subjects: editingRecord.subjects, rollNumber: editingRecord.rollNumber,
        branch: editingRecord.branch, document: editingRecord.document || document },
      `Updated Year ${editingRecord.year} Sem ${editingRecord.semester}`
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <section className="premium-card p-4 sm:p-6 lg:p-8">
        {/* Section header */}
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Academic Records</h2>
          <p className="text-sm text-slate-400">Semester-wise progress for AI analysis.</p>
        </div>

        {/* AI assistant */}
        <div className="flex flex-col gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 mb-6">
          <div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Assistant</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Auto-fill with AI</p>
          </div>
          <SmartAssistant
            mode="academic"
            studentUid={uid}
            existingData={rows}
            onExtract={(d) => {
              if (d.year) setYear(d.year.toString());
              if (d.semester) setSemester(d.semester.toString());
              if (d.gpa) setGpa(d.gpa.toString());
              if (d.subjects) setSubjects(d.subjects);
              if (d.branch) setBranch(d.branch);
              if (d.rollNumber) setRollNumber(d.rollNumber.toString());
            }}
            onDocumentSaved={setDocument}
            label="AI Academic Assistant"
            description="Describe your academic record to get AI suggestions"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input required placeholder="Year (e.g. 2024)" value={year} onChange={e => setYear(e.target.value)} />
            <Input required placeholder="Semester (e.g. 5)" value={semester} onChange={e => setSemester(e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input required placeholder="Roll Number" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
            <Input required placeholder="Branch / Department" value={branch} onChange={e => setBranch(e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input required placeholder="GPA / SGPA (e.g. 9.5)" value={gpa} onChange={e => setGpa(e.target.value)} />
          </div>
          <textarea placeholder="Subjects or key learnings..." value={subjects} onChange={e => setSubjects(e.target.value)} rows={2} className={field} />
          <Button type="submit" className="w-full py-4">Add Record to Ledger</Button>
        </form>

        {/* Records list */}
        <div className="flex flex-col gap-4 mt-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Academic Timeline</h3>
            <Badge variant="brand">{rows.length} Sessions</Badge>
          </div>

          {rows.length === 0 ? (
            <div className="flex items-center justify-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400 italic">No academic records yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {rows.map((r) => (
                <div key={r.id} className="flex flex-col gap-3 p-4 sm:p-5 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all">
                  {/* Top row: title + badge */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-black text-slate-900">Year {r.year} · Sem {r.semester}</span>
                    <Badge variant="success" className="bg-emerald-500 text-white border-none">{r.gpa} GPA</Badge>
                  </div>
                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                    <span>{r.subjects || "General Curriculum"}</span>
                    {r.resultLink && (
                      <a href={r.resultLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" /></svg>
                        View Results
                      </a>
                    )}
                    {r.document && (
                      <DocumentPreview document={r.document} triggerLabel="View uploaded file" />
                    )}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end">
                    <button onClick={() => setEditingRecord({...r})} className="p-2 text-slate-400 hover:text-brand-600 rounded-xl hover:bg-brand-50 transition-all" title="Edit">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" /></svg>
                    </button>
                    <button onClick={() => setDeleteTarget({ collection: "academicRecords", id: r.id, label: `Year ${r.year} · Sem ${r.semester}` })} className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all" title="Delete">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Modal title="Edit Record" open={!!editingRecord} onClose={() => setEditingRecord(null)}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Batch Year</label>
              <Input value={editingRecord?.year || ""} onChange={e => setEditingRecord({...editingRecord, year: e.target.value})} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Semester</label>
              <Input value={editingRecord?.semester || ""} onChange={e => setEditingRecord({...editingRecord, semester: e.target.value})} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Score (GPA)</label>
            <Input value={editingRecord?.gpa || ""} onChange={e => setEditingRecord({...editingRecord, gpa: e.target.value})} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subjects</label>
            <textarea value={editingRecord?.subjects || ""} onChange={e => setEditingRecord({...editingRecord, subjects: e.target.value})} rows={3} className={field} />
          </div>
          {editingRecord?.document && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-[11px] text-slate-600">
              Uploaded document: {editingRecord.document.fileName} (Firestore)
            </div>
          )}
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setEditingRecord(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Record?"
        message={`Delete "${deleteTarget?.label}"? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return;
          await confirmDelete(`Deleted: ${deleteTarget.label}`);
        }}
      />
    </div>
  );
}
