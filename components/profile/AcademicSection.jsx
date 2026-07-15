import { useState, useRef } from "react";
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

  const assistantRef = useRef(null);

  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [gpa, setGpa] = useState("");
  const [subjects, setSubjects] = useState("");
  const [branch, setBranch] = useState("");
  const [document, setDocument] = useState(null);

  async function handleAdd(e) {
    if (e) e.preventDefault();
    const gpaNum = parseFloat(gpa);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
      addToast("GPA must be a number between 0 and 10.", "error");
      return;
    }
    const ok = await add(
      { year, semester, gpa, subjects, rollNumber, branch, document },
      `Added academic record for Year ${year} Sem ${semester}`
    );
    if (ok) {
      setYear(""); setSemester(""); setGpa(""); setSubjects(""); setRollNumber(""); setBranch(""); setDocument(null);
      assistantRef.current?.reset();
    }
  }

  async function handleUpdate() {
    const gpaNum = parseFloat(editingRecord?.gpa);
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 10) {
      addToast("GPA must be a number between 0 and 10.", "error");
      return;
    }
    await save(
      {
        year: editingRecord.year, semester: editingRecord.semester, gpa: editingRecord.gpa,
        subjects: editingRecord.subjects, rollNumber: editingRecord.rollNumber,
        branch: editingRecord.branch, document: editingRecord.document || document
      },
      `Updated Year ${editingRecord.year} Sem ${editingRecord.semester}`
    );
  }

  return (
    <div className="flex flex-col gap-8 animate-slide-up">
      <section className="premium-card p-4 sm:p-6 lg:p-8">
        {/* Section header */}
        <div className="flex flex-col gap-1 mb-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Academic Records</h2>
          <p className="text-sm text-slate-500">Semester-wise progress for AI analysis.</p>
        </div>

        {/* AI assistant */}
        <div className="flex flex-col gap-3 bg-slate-50/50 p-4 sm:p-5 rounded-2xl border border-slate-100 mb-6">
          <div>
            <p className="text-xs font-black text-slate-900 uppercase tracking-widest">AI Assistant</p>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-0.5">Auto-fill with AI</p>
          </div>
          <SmartAssistant
            ref={assistantRef}
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
            <Input id="academic-year" name="academicYear" required placeholder="Year (e.g. 2024)" value={year} onChange={e => setYear(e.target.value)} />
            <Input id="academic-semester" name="academicSemester" required placeholder="Semester (e.g. 5)" value={semester} onChange={e => setSemester(e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input id="academic-roll" name="academicRollNumber" required placeholder="Roll Number" value={rollNumber} onChange={e => setRollNumber(e.target.value)} />
            <Input id="academic-branch" name="academicBranch" required placeholder="Branch / Department" value={branch} onChange={e => setBranch(e.target.value)} />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input id="academic-gpa" name="academicGpa" required placeholder="GPA / SGPA (e.g. 9.5)" value={gpa} onChange={e => setGpa(e.target.value)} />
          </div>
          <textarea id="academic-subjects" name="academicSubjects" placeholder="Subjects or key learnings..." value={subjects} onChange={e => setSubjects(e.target.value)} rows={2} className={field} />
          <Button type="submit" className="w-full py-4">Add Record to Ledger</Button>
        </form>

        {/* Records list */}
        <div className="flex flex-col gap-4 mt-10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Academic Records</h3>
            <Badge variant="brand">{rows.length} Records</Badge>
          </div>

          <div className="flex flex-col gap-4">
            {rows.length === 0 ? (
              <div className="flex items-center justify-center py-16 bg-slate-50/50 rounded-4xl border-2 border-dashed border-slate-100">
                <p className="text-sm text-slate-500 italic">&ldquo;No academic records found in the institutional ledger.&rdquo;</p>
              </div>
            ) : (
              rows.map((r) => (
                <div key={r.id} className="group flex flex-col gap-4 premium-card p-4 sm:p-6 border-slate-100 hover:border-brand-500/30 transition-all">
                  {/* Top row: badge + actions */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                      GPA {r.gpa}
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
                  {/* Content: Semester + Branch + Roll */}
                  <div className="flex flex-col gap-1">
                    <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Year {r.year} &bull; Semester {r.semester}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{r.branch} &bull; Roll: {r.rollNumber}</p>
                  </div>
                  {r.subjects && <p className="text-sm text-slate-500 leading-relaxed font-medium">{r.subjects}</p>}
                  {r.document && (
                    <div className="pt-2 border-t border-slate-100">
                      <DocumentPreview document={r.document} triggerLabel="View transcript / grade sheet" />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <Modal open={!!editingRecord} onClose={() => setEditingRecord(null)} title="Update Academic Record">
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-academic-year" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Batch Year</label>
              <Input id="edit-academic-year" name="editAcademicYear" value={editingRecord?.year || ""} onChange={e => setEditingRecord({ ...editingRecord, year: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label htmlFor="edit-academic-semester" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Semester</label>
              <Input id="edit-academic-semester" name="editAcademicSemester" value={editingRecord?.semester || ""} onChange={e => setEditingRecord({ ...editingRecord, semester: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-academic-gpa" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Score (GPA)</label>
            <Input id="edit-academic-gpa" name="editAcademicGpa" value={editingRecord?.gpa || ""} onChange={e => setEditingRecord({ ...editingRecord, gpa: e.target.value })} />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="edit-academic-subjects" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Subjects</label>
            <textarea id="edit-academic-subjects" name="editAcademicSubjects" value={editingRecord?.subjects || ""} onChange={e => setEditingRecord({ ...editingRecord, subjects: e.target.value })} rows={3} className={field} />
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
