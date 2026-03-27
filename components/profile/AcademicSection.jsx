import { useState } from "react";
import { createRecord, removeRecord, updateRecord } from "@/lib/data";
import { useToast } from "@/lib/toast-context";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import SmartAssistant from "./SmartAssistant";

export default function AcademicSection({ uid, rows, onRefresh }) {
  const { addToast } = useToast();
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [gpa, setGpa] = useState("");
  const [subjects, setSubjects] = useState("");
  const [branch, setBranch] = useState("");
  const [link, setLink] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    try {
      await createRecord("academicRecords", {
        studentUid: uid,
        year,
        semester,
        gpa,
        subjects,
        rollNumber,
        branch,
        resultLink: link,
      }, {
        actorUid: uid,
        description: `Added academic record for Year ${year} Sem ${semester}`
      });
      addToast(`Added academic record for Year ${year} Sem ${semester}`, "success");
      setYear("");
      setSemester("");
      setGpa("");
      setSubjects("");
      setRollNumber("");
      setBranch("");
      setLink("");
      onRefresh();
    } catch (err) {
      addToast("Failed to add record", "error");
    }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    try {
      await updateRecord("academicRecords", editingRecord.id, {
        year: editingRecord.year,
        semester: editingRecord.semester,
        gpa: editingRecord.gpa,
        subjects: editingRecord.subjects,
        rollNumber: editingRecord.rollNumber,
        branch: editingRecord.branch,
        resultLink: editingRecord.resultLink,
      }, {
        actorUid: uid,
        description: `Updated academic record for Year ${editingRecord.year} Sem ${editingRecord.semester}`
      });
      addToast(`Updated academic record for Year ${editingRecord.year} Sem ${editingRecord.semester}`, "success");
      setEditingRecord(null);
      onRefresh();
    } catch (err) {
      addToast("Failed to update record", "error");
    }
  }

  return (
    <div className="space-y-8 animate-slide-up">
      <section className="premium-card p-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Add Academic Record</h2>
        <p className="text-sm text-slate-400 mt-1">Keep your semester-wise progress up to date for AI analysis.</p>
        
        <div className="mt-8 bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Master Entry</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">Manual entry with AI assistance</p>
          </div>
          
          <SmartAssistant 
            mode="academic" 
            existingData={rows}
            onExtract={(data) => {
              if (data.year) setYear(data.year.toString());
              if (data.semester) setSemester(data.semester.toString());
              if (data.gpa) setGpa(data.gpa.toString());
              if (data.subjects) setSubjects(data.subjects);
              if (data.branch) setBranch(data.branch);
              if (data.rollNumber) setRollNumber(data.rollNumber.toString());
            }} 
            label="AI Academic Assistant"
            description="Describe your academic record to get AI suggestions"
          />
        </div>

      <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
          <Input
            required
            placeholder="Year (e.g. 2024)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          />
          <Input
            required
            placeholder="Semester (e.g. 5)"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
          />
          <Input
            required
            placeholder="Roll Number"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
          />
          <Input
            required
            placeholder="Branch / Department"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
          <Input
            required
            placeholder="GPA / SGPA (e.g. 9.5)"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
          />
          <Input
            placeholder="Result URL / Drive Link (Optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <textarea
            placeholder="Subjects or key learnings..."
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300 sm:col-span-2"
          />
          <Button type="submit" className="sm:col-span-2 py-4">
            Add Record to Ledger
          </Button>
        </form>

        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Academic Timeline</h3>
            <Badge variant="brand">{rows.length} Sessions</Badge>
          </div>
          
          {rows.length === 0 ? (
            <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400 font-medium italic">No academic records yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rows.map((r) => (
                <div key={r.id} className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50/50 border border-slate-100 transition-all hover:bg-white hover:shadow-md hover:border-slate-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-base font-black text-slate-900">Year {r.year} · Sem {r.semester}</span>
                      <Badge variant="success" className="bg-emerald-500 text-white border-none">{r.gpa} GPA</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                      <span className="truncate max-w-[300px]">{r.subjects || "General Curriculum"}</span>
                      {r.resultLink && (
                        <a href={r.resultLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:text-brand-700 flex items-center gap-1.5 transition-colors">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                          </svg>
                          View Results
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                    <button
                      onClick={() => setEditingRecord({...r})}
                      className="p-2.5 text-slate-400 hover:text-brand-600 transition-all rounded-xl hover:bg-brand-50"
                      title="Edit record"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ collection: "academicRecords", id: r.id, label: `Year ${r.year} · Sem ${r.semester}` })}
                      className="p-2.5 text-slate-400 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                      title="Delete record"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Modal
          title="Edit Record"
          open={!!editingRecord}
          onClose={() => setEditingRecord(null)}
        >
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Batch Year</label>
                <Input
                  value={editingRecord?.year || ""}
                  onChange={(e) => setEditingRecord({...editingRecord, year: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Semester</label>
                <Input
                  value={editingRecord?.semester || ""}
                  onChange={(e) => setEditingRecord({...editingRecord, semester: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Score (GPA)</label>
              <Input
                value={editingRecord?.gpa || ""}
                onChange={(e) => setEditingRecord({...editingRecord, gpa: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1 mb-2 block">Subjects</label>
              <textarea
                value={editingRecord?.subjects || ""}
                onChange={(e) => setEditingRecord({...editingRecord, subjects: e.target.value})}
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 focus:outline-none transition-all duration-300"
              />
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setEditingRecord(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </div>
          </div>
        </Modal>

        <ConfirmDialog
          open={!!deleteTarget}
          title="Delete Record?"
          message={`Are you sure you want to delete "${deleteTarget?.label}"? This action cannot be undone.`}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (deleteTarget) {
              try {
                await removeRecord(deleteTarget.collection, deleteTarget.id, {
                  actorUid: uid,
                  targetUid: uid,
                  description: `Deleted academic record: ${deleteTarget.label}`
                });
                addToast(`Deleted academic record: ${deleteTarget.label}`, "success");
                setDeleteTarget(null);
                onRefresh();
              } catch (err) {
                addToast("Failed to delete record", "error");
              }
            }
          }}
        />
      </section>
    </div>
  );
}
