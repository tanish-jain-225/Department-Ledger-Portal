import { useCallback, useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import Layout, { ACCESS } from "@/components/Layout";
import { useAuth } from "@/lib/auth-context";
import { getDb } from "@/lib/firebase";
import { ROLES, isStaff } from "@/lib/roles";
import { createRecord, listByStudent, removeRecord, updateRecord } from "@/lib/data";

import StudentCardPopup from "@/components/StudentCardPopup";
import FacultyProfile from "@/components/FacultyProfile";

function EditModal({ title, isOpen, onClose, onSave, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          {children}
          <div className="mt-8 flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-6 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-brand-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "academic", label: "Academic" },
  { id: "activities", label: "Activities" },
  { id: "achievements", label: "Achievements" },
  { id: "placement", label: "Placement" },
  { id: "certificates", label: "Certificates" },
];

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [showCard, setShowCard] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    dob: "",
    gender: "",
    linkedin: "",
    github: "",
    alumni: false,
  });

  const [academic, setAcademic] = useState([]);
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [certificates, setCertificates] = useState([]);

  const loadLists = useCallback(async () => {
    if (!user?.uid) return;
    const uid = user.uid;
    try {
      const [a, act, ach, pl, cert] = await Promise.all([
        listByStudent("academicRecords", uid),
        listByStudent("activities", uid),
        listByStudent("achievements", uid),
        listByStudent("placements", uid),
        listByStudent("certificates", uid),
      ]);
      setAcademic(a.sort((x, y) => {
        if (y.year !== x.year) return parseInt(y.year) - parseInt(x.year);
        return parseInt(y.semester) - parseInt(x.semester);
      }));
      setActivities(act);
      setAchievements(ach);
      setPlacements(pl);
      setCertificates(cert);
    } catch (e) {
      console.error(e);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        dob: profile.dob || "",
        gender: profile.gender || "",
        linkedin: profile.linkedin || "",
        github: profile.github || "",
        alumni: !!profile.alumni,
      });
    }
  }, [profile]);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  async function saveProfile(e) {
    e.preventDefault();
    if (!user?.uid) return;
    setErr("");
    setMsg("");
    setSaving(true);
    try {
      const db = getDb();
      if (!db) throw new Error("Firebase not configured");
      await updateDoc(doc(db, "users", user.uid), {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        alumni: form.alumni,
        dob: form.dob,
        gender: form.gender,
        linkedin: form.linkedin.trim(),
        github: form.github.trim(),
        updatedAt: serverTimestamp(),
      });
      await refreshProfile();
      setMsg("Profile saved.");
      setIsEditing(false);
    } catch (error) {
      setErr(error?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <Layout title="Profile" access={ACCESS.STUDENT}>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-slate-600 animate-pulse">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile" access={ACCESS.PUBLIC}>
      {isStaff(profile?.role) ? (
        <FacultyProfile profile={profile} onRefresh={refreshProfile} />
      ) : (
        <>
          <div className="flex flex-col gap-6 lg:flex-row">
        <nav
          className="flex flex-wrap gap-2 lg:w-48 lg:flex-col"
          aria-label="Profile sections"
        >
          <button
            type="button"
            onClick={() => setShowCard(true)}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View / Download Card
          </button>
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-brand-600 text-white"
                  : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {msg && (
            <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
              {msg}
            </p>
          )}
          {err && (
            <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </p>
          )}

          {tab === "profile" && (
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Personal Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all hover:border-brand-300 active:scale-95"
                  >
                    <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                    <p className="text-sm font-semibold text-slate-800">{profile?.name || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-semibold text-slate-800">{profile?.email || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                    <p className="text-sm font-semibold text-slate-800">{profile?.phone || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                    <p className="text-sm font-semibold text-slate-800 capitalize">{profile?.gender || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
                    <p className="text-sm font-semibold text-slate-800">{profile?.dob || "—"}</p>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residential Address</p>
                    <p className="text-sm font-semibold text-slate-800">{profile?.address || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LinkedIn</p>
                    <p className="text-sm font-medium text-brand-600 truncate">{profile?.linkedin || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GitHub</p>
                    <p className="text-sm font-medium text-brand-600 truncate">{profile?.github || "—"}</p>
                  </div>
                  <div className="sm:col-span-2 pt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${profile?.alumni ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                      {profile?.alumni ? "Alumni Status Active" : "Regular Student"}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={saveProfile} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Full name</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Phone</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Gender</label>
                      <select
                        value={form.gender}
                        onChange={(e) => setForm({ ...form, gender: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700">Address</label>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      rows={2}
                      className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Date of Birth</label>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(e) => setForm({ ...form, dob: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex items-center pt-6">
                      <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.alumni}
                          onChange={(e) => setForm({ ...form, alumni: e.target.checked })}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                        />
                        Mark as alumni
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">LinkedIn Profile</label>
                      <input
                        placeholder="https://..."
                        value={form.linkedin}
                        onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">GitHub Profile</label>
                      <input
                        placeholder="https://..."
                        value={form.github}
                        onChange={(e) => setForm({ ...form, github: e.target.value })}
                        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-3 pt-4 border-t border-slate-100 mt-6">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700 disabled:opacity-60 transition-all active:scale-95"
                    >
                      {saving ? "Saving…" : "Save profile"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}


          {tab === "academic" && (
            <AcademicSection
              uid={user.uid}
              rows={academic}
              form={form}
              setForm={setForm}
              onSave={saveProfile}
              saving={saving}
              onRefresh={loadLists}
            />
          )}
          {tab === "activities" && (
            <ActivitySection
              uid={user.uid}
              rows={activities}
              onRefresh={loadLists}
            />
          )}
          {tab === "achievements" && (
            <AchievementSection
              uid={user.uid}
              rows={achievements}
              onRefresh={loadLists}
            />
          )}
          {tab === "placement" && (
            <PlacementSection
              uid={user.uid}
              rows={placements}
              onRefresh={loadLists}
            />
          )}
          {tab === "certificates" && (
            <CertificateSection
              uid={user.uid}
              rows={certificates}
              onRefresh={loadLists}
            />
          )}
        </div>
      </div>

      <StudentCardPopup
        show={showCard}
        onClose={() => setShowCard(false)}
        data={profile}
        academic={academic}
        activities={activities}
        achievements={achievements}
        placements={placements}
        certificates={certificates}
      />
        </>
      )}
    </Layout>
  );
}

function AcademicSection({ uid, rows, onRefresh }) {
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [gpa, setGpa] = useState("");
  const [subjects, setSubjects] = useState("");
  const [branch, setBranch] = useState("");
  const [link, setLink] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    await createRecord("academicRecords", {
      studentUid: uid,
      year,
      semester,
      gpa,
      subjects,
      rollNumber,
      branch,
      resultLink: link,
    });
    setYear("");
    setSemester("");
    setGpa("");
    setSubjects("");
    setRollNumber("");
    setBranch("");
    setLink("");
    onRefresh();
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    await updateRecord("academicRecords", editingRecord.id, {
      year: editingRecord.year,
      semester: editingRecord.semester,
      gpa: editingRecord.gpa,
      subjects: editingRecord.subjects,
      rollNumber: editingRecord.rollNumber,
      branch: editingRecord.branch,
      resultLink: editingRecord.resultLink,
    });
    setEditingRecord(null);
    onRefresh();
  }

  return (
    <div className="space-y-6">
      {/* Semester Timeline Entry */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Add Academic Record</h2>
        <p className="text-xs text-slate-500 mb-4 italic">Specify details as they were for this particular semester.</p>
        <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
          {/* ... existing inputs ... */}
          <input
            required
            placeholder="Year (e.g. 2024)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Semester (e.g. 5)"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Roll Number (for this sem)"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="Branch (for this sem)"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            required
            placeholder="GPA (e.g. 9.5)"
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Result URL / Drive Link (optional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Subjects / notes"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            rows={1}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
          <button
            type="submit"
            className="rounded-md bg-brand-600 px-4 py-2 text-white sm:col-span-2 text-sm font-bold shadow-sm hover:bg-brand-700 transition-colors"
          >
            Add record
          </button>
        </form>

        <div className="mt-8">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Academic Timeline</h3>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No academic records yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {rows.map((r) => (
                <li key={r.id} className="py-4 group">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">Year {r.year} · Semester {r.semester}</span>
                        <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">GPA {r.gpa}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span className="truncate max-w-[250px]">{r.subjects || "No subjects listed"}</span>
                        {r.resultLink && (
                          <a href={r.resultLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1 font-bold bg-slate-50 px-1.5 py-0.5 rounded truncate max-w-[150px]">
                            <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                            </svg>
                            <span className="truncate">{r.resultLink}</span>
                          </a>
                        )}
                      </div>
                      {r.createdAt && (
                        <p className="mt-1 text-[10px] text-slate-300 italic">Added on {new Date(r.createdAt.toMillis?.() || r.createdAt).toLocaleDateString()}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setEditingRecord({...r})}
                        className="p-2 text-slate-300 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                        title="Edit record"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" />
                        </svg>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm("Delete this record?")) {
                            await removeRecord("academicRecords", r.id);
                            onRefresh();
                          }
                        }}
                        className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        title="Delete record"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <EditModal
          title="Edit Academic Record"
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          onSave={handleUpdate}
        >
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Year</label>
                <input
                  value={editingRecord?.year || ""}
                  onChange={(e) => setEditingRecord({...editingRecord, year: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Semester</label>
                <input
                  value={editingRecord?.semester || ""}
                  onChange={(e) => setEditingRecord({...editingRecord, semester: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Roll Number</label>
                <input
                  value={editingRecord?.rollNumber || ""}
                  onChange={(e) => setEditingRecord({...editingRecord, rollNumber: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Branch</label>
                <input
                  value={editingRecord?.branch || ""}
                  onChange={(e) => setEditingRecord({...editingRecord, branch: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">GPA</label>
              <input
                value={editingRecord?.gpa || ""}
                onChange={(e) => setEditingRecord({...editingRecord, gpa: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Subjects</label>
              <textarea
                value={editingRecord?.subjects || ""}
                onChange={(e) => setEditingRecord({...editingRecord, subjects: e.target.value})}
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Result Link</label>
              <input
                value={editingRecord?.resultLink || ""}
                onChange={(e) => setEditingRecord({...editingRecord, resultLink: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
        </EditModal>
      </section>
    </div>
  );
}

function ActivitySection({ uid, rows, onRefresh }) {
  const [type, setType] = useState("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [link, setLink] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    await createRecord("activities", {
      studentUid: uid,
      type,
      title,
      description,
      date,
      link,
    });
    setTitle("");
    setDescription("");
    setDate("");
    setLink("");
    onRefresh();
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    await updateRecord("activities", editingRecord.id, {
      type: editingRecord.type,
      title: editingRecord.title,
      description: editingRecord.description,
      date: editingRecord.date,
      link: editingRecord.link,
    });
    setEditingRecord(null);
    onRefresh();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Activities</h2>
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="none">None</option>
          <option value="co-curricular">Co-curricular</option>
          <option value="extra-curricular">Extra-curricular</option>
          <option value="cultural">Cultural</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
        <input
          placeholder="Activity Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <textarea
          placeholder="Short description or role"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={1}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Activity Link (Drive/Post/etc.) - Optional"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-white text-sm font-bold sm:col-span-2 shadow-sm hover:bg-brand-700 transition-colors">
          Add Activity
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Activity Timeline</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No activities logged yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="py-4 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 truncate">{r.title}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                        r.type === 'none' ? 'bg-slate-100 text-slate-500' : 'bg-brand-50 text-brand-600'
                      }`}>
                        {r.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {r.date}
                      </span>
                      {r.link && (
                        <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1.5 font-bold bg-slate-50 px-1.5 py-0.5 rounded max-w-[150px] truncate">
                          <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                          </svg>
                          <span className="truncate">{r.link}</span>
                        </a>
                      )}
                    </div>
                    {r.description && <p className="mt-2 text-xs text-slate-500 italic line-clamp-2">{r.description}</p>}
                    {r.createdAt && (
                      <p className="mt-1 text-[10px] text-slate-300 italic">Added on {new Date(r.createdAt.toMillis?.() || r.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingRecord({...r})}
                      className="p-2 text-slate-300 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                      title="Edit activity"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this activity?")) {
                          await removeRecord("activities", r.id);
                          onRefresh();
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete activity"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditModal
        title="Edit Activity"
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdate}
      >
        <div className="grid gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Activity Type</label>
            <select
              value={editingRecord?.type || "none"}
              onChange={(e) => setEditingRecord({...editingRecord, type: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 bg-white"
            >
              <option value="none">None</option>
              <option value="co-curricular">Co-curricular</option>
              <option value="extra-curricular">Extra-curricular</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Activity Title</label>
            <input
              value={editingRecord?.title || ""}
              onChange={(e) => setEditingRecord({...editingRecord, title: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Date</label>
            <input
              type="date"
              value={editingRecord?.date || ""}
              onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Description</label>
            <textarea
              value={editingRecord?.description || ""}
              onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Evidence Link</label>
            <input
              value={editingRecord?.link || ""}
              onChange={(e) => setEditingRecord({...editingRecord, link: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1"
            />
          </div>
        </div>
      </EditModal>
    </section>
  );
}

function AchievementSection({ uid, rows, onRefresh }) {
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [level, setLevel] = useState("college");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    await createRecord("achievements", {
      studentUid: uid,
      type: "achievement",
      title,
      issuer,
      level,
      date,
      description,
      certificateLink: link,
    });
    setTitle("");
    setIssuer("");
    setLevel("college");
    setDate("");
    setDescription("");
    setLink("");
    onRefresh();
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    await updateRecord("achievements", editingRecord.id, {
      title: editingRecord.title,
      issuer: editingRecord.issuer,
      level: editingRecord.level,
      date: editingRecord.date,
      description: editingRecord.description,
      certificateLink: editingRecord.certificateLink,
    });
    setEditingRecord(null);
    onRefresh();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Achievements & Awards</h2>
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          placeholder="Achievement Title (e.g. 1st Place)"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Issuing Organization (e.g. Google)"
          value={issuer}
          onChange={(e) => setIssuer(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="college">College Level</option>
          <option value="state">State Level</option>
          <option value="national">National Level</option>
          <option value="international">International Level</option>
          <option value="other">Other</option>
        </select>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Certificate Link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Brief description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-white text-sm font-bold sm:col-span-2 shadow-sm hover:bg-brand-700 transition-colors">
          Add Achievement
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Achievement Timeline</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No achievements recorded.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="py-4 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 truncate">{r.title}</span>
                      <span className="text-[9px] font-black text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        {r.level}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="truncate max-w-[200px]">{r.issuer || "No issuer"} · {r.date}</span>
                      {r.certificateLink && (
                        <a href={r.certificateLink} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1.5 font-bold bg-slate-50 px-1.5 py-0.5 rounded max-w-[150px] truncate">
                          <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                          </svg>
                          <span className="truncate">{r.certificateLink}</span>
                        </a>
                      )}
                    </div>
                    {r.description && <p className="mt-2 text-xs text-slate-500 italic line-clamp-2">{r.description}</p>}
                    {r.createdAt && (
                      <p className="mt-1 text-[10px] text-slate-300 italic">Added on {new Date(r.createdAt.toMillis?.() || r.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingRecord({...r})}
                      className="p-2 text-slate-300 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                      title="Edit achievement"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this record?")) {
                          await removeRecord("achievements", r.id);
                          onRefresh();
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete record"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditModal
        title="Edit Achievement"
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdate}
      >
        <div className="grid gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Achievement Title</label>
            <input
              value={editingRecord?.title || ""}
              onChange={(e) => setEditingRecord({...editingRecord, title: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Issuer</label>
              <input
                value={editingRecord?.issuer || ""}
                onChange={(e) => setEditingRecord({...editingRecord, issuer: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Level</label>
              <select
                value={editingRecord?.level || "college"}
                onChange={(e) => setEditingRecord({...editingRecord, level: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="college">College Level</option>
                <option value="state">State Level</option>
                <option value="national">National Level</option>
                <option value="international">International Level</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Date</label>
            <input
              type="date"
              value={editingRecord?.date || ""}
              onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Description</label>
            <textarea
              value={editingRecord?.description || ""}
              onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Certificate Link</label>
            <input
              value={editingRecord?.certificateLink || ""}
              onChange={(e) => setEditingRecord({...editingRecord, certificateLink: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>
      </EditModal>
    </section>
  );
}

function PlacementSection({ uid, rows, onRefresh }) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("intern");
  const [pkg, setPkg] = useState("");
  const [link, setLink] = useState("");

  const [editingRecord, setEditingRecord] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    await createRecord("placements", {
      studentUid: uid,
      company,
      role,
      status,
      package: pkg,
      link,
      year: new Date().getFullYear(),
    });
    setCompany("");
    setRole("");
    setPkg("");
    setLink("");
    onRefresh();
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    await updateRecord("placements", editingRecord.id, {
      company: editingRecord.company,
      role: editingRecord.role,
      status: editingRecord.status,
      package: editingRecord.package,
      link: editingRecord.link,
    });
    setEditingRecord(null);
    onRefresh();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Placements & Internships</h2>
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          placeholder="Company Name"
          required
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Role (e.g. SDE)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white"
        >
          <option value="placed">Full-time Placed</option>
          <option value="intern">Internship</option>
          <option value="unplaced">Unplaced</option>
        </select>
        <input
          placeholder="Package / Stipend (optional)"
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Offer Letter / Post Link (optional)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
        />
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-white text-sm font-bold sm:col-span-2 shadow-sm hover:bg-brand-700 transition-colors">
          Add Record
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Placement Timeline</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No placement records logged.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="py-4 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 truncate">{r.company}</span>
                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter ${
                        r.status === 'placed' ? 'bg-green-50 text-green-600' : 'bg-brand-50 text-brand-600'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="truncate max-w-[200px] font-bold text-slate-700">{r.role || "No role specified"}</span>
                      {r.package && <span className="text-slate-400">· {r.package}</span>}
                      {r.link && (
                        <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1.5 font-bold bg-slate-50 px-1.5 py-0.5 rounded max-w-[150px] truncate">
                          <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                          </svg>
                          <span className="truncate">{r.link}</span>
                        </a>
                      )}
                    </div>
                    {r.createdAt && (
                      <p className="mt-1 text-[10px] text-slate-300 italic">Added on {new Date(r.createdAt.toMillis?.() || r.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingRecord({...r})}
                      className="p-2 text-slate-300 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                      title="Edit placement"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this record?")) {
                          await removeRecord("placements", r.id);
                          onRefresh();
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete record"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditModal
        title="Edit Placement/Internship"
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdate}
      >
        <div className="grid gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Company Name</label>
            <input
              value={editingRecord?.company || ""}
              onChange={(e) => setEditingRecord({...editingRecord, company: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Role</label>
            <input
              value={editingRecord?.role || ""}
              onChange={(e) => setEditingRecord({...editingRecord, role: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Status</label>
              <select
                value={editingRecord?.status || "intern"}
                onChange={(e) => setEditingRecord({...editingRecord, status: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              >
                <option value="placed">Full-time Placed</option>
                <option value="intern">Internship</option>
                <option value="unplaced">Unplaced</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Package/Stipend</label>
              <input
                value={editingRecord?.package || ""}
                onChange={(e) => setEditingRecord({...editingRecord, package: e.target.value})}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Offer/Post Link</label>
            <input
              value={editingRecord?.link || ""}
              onChange={(e) => setEditingRecord({...editingRecord, link: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>
      </EditModal>
    </section>
  );
}

function CertificateSection({ uid, rows, onRefresh, onNotifyStaff }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const [editingRecord, setEditingRecord] = useState(null);

  async function add(e) {
    if (e) e.preventDefault();
    if (!fileUrl) {
      alert("Certificate link is required.");
      return;
    }
    setBusy(true);
    try {
      await createRecord("certificates", {
        studentUid: uid,
        title,
        description,
        date,
        fileUrl,
        fileType: "link",
        verified: false,
      });
      setTitle("");
      setDescription("");
      setDate("");
      setFileUrl("");
      if (onNotifyStaff) await onNotifyStaff();
      onRefresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate() {
    if (!editingRecord) return;
    await updateRecord("certificates", editingRecord.id, {
      title: editingRecord.title,
      description: editingRecord.description,
      date: editingRecord.date,
      fileUrl: editingRecord.fileUrl,
    });
    setEditingRecord(null);
    onRefresh();
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">External Certificates</h2>
      <p className="text-xs text-slate-500 mb-4 italic">Add links to certificates from external platforms (Coursera, Udemy, NPTEL, etc.).</p>
      
      <form onSubmit={add} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          placeholder="Certificate Title (e.g. AWS Developer)"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Certificate URL (Drive/Public Link)"
          required
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          placeholder="Brief description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-brand-600 px-4 py-2 text-white text-sm font-bold sm:col-span-2 shadow-sm hover:bg-brand-700 disabled:opacity-60 transition-colors"
        >
          {busy ? "Saving…" : "Add Certificate Link"}
        </button>
      </form>

      <div className="mt-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Certificate Timeline</h3>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-400 italic">No certificates added yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((r) => (
              <li key={r.id} className="py-4 group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 truncate">{r.title}</span>
                      {r.verified && (
                        <span className="text-[9px] font-black bg-green-50 text-green-600 px-1.5 py-0.5 rounded uppercase tracking-tighter">Verified</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 font-bold">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {r.date}
                      </span>
                      {r.fileUrl && (
                        <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline flex items-center gap-1.5 font-bold bg-slate-50 px-1.5 py-0.5 rounded max-w-[150px] truncate">
                          <svg className="h-3 w-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4-4a4 4 0 10-5.656-5.656l-1.102 1.101" />
                          </svg>
                          <span className="truncate">{r.fileUrl}</span>
                        </a>
                      )}
                    </div>
                    {r.description && <p className="mt-1 text-xs text-slate-500 italic line-clamp-1">{r.description}</p>}
                    {r.createdAt && (
                      <p className="mt-1 text-[10px] text-slate-300 italic">Added on {new Date(r.createdAt.toMillis?.() || r.createdAt).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingRecord({...r})}
                      className="p-2 text-slate-300 hover:text-brand-600 transition-colors rounded-lg hover:bg-brand-50"
                      title="Edit certificate"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M18.364 5.636a2.121 2.121 0 113 3L12 18l-4 1 1-4 9.364-9.364z" />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Delete this certificate?")) {
                          await removeRecord("certificates", r.id);
                          onRefresh();
                        }
                      }}
                      className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete record"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <EditModal
        title="Edit Certificate Info"
        isOpen={!!editingRecord}
        onClose={() => setEditingRecord(null)}
        onSave={handleUpdate}
      >
        <div className="grid gap-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Certificate Title</label>
            <input
              value={editingRecord?.title || ""}
              onChange={(e) => setEditingRecord({...editingRecord, title: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Date Issued</label>
            <input
              type="date"
              value={editingRecord?.date || ""}
              onChange={(e) => setEditingRecord({...editingRecord, date: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Public URL / Link</label>
            <input
              value={editingRecord?.fileUrl || ""}
              onChange={(e) => setEditingRecord({...editingRecord, fileUrl: e.target.value})}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Description</label>
            <textarea
              value={editingRecord?.description || ""}
              onChange={(e) => setEditingRecord({...editingRecord, description: e.target.value})}
              rows={2}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mt-1 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>
      </EditModal>
    </section>
  );
}




