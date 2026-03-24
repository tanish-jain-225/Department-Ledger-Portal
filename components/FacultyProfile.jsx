import { useState, useEffect, useRef } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import FacultyCard from "./FacultyCard";

export default function FacultyProfile({ profile, onRefresh }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const cardRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    dob: "",
    gender: "",
    linkedin: "",
    github: "",
    bio: "",
  });

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
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  async function save(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const db = getDb();
      if (!db) return;
      await updateDoc(doc(db, "users", profile.id), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      await onRefresh();
      setMsg("Professional profile updated.");
      setIsEditing(false);
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  const handleDownload = () => {
    const element = cardRef.current;
    if (!element) return;
    
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () => {
      const opt = {
        margin: [10, 10],
        filename: `Faculty_Card_${profile.name || "ID"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          scrollY: 0,
          windowHeight: element.scrollHeight + 500
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };

      // Ensure the hidden capture element is not clipped
      const parent = element.parentElement;
      const originalPosition = parent.style.position;
      const originalVisibility = parent.style.visibility;
      
      parent.style.position = 'static';
      parent.style.visibility = 'visible';

      window.html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          parent.style.position = originalPosition;
          parent.style.visibility = originalVisibility;
        });
    };
    document.body.appendChild(script);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {msg && (
        <div className="mb-6 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800 border border-emerald-100 shadow-sm animate-in slide-in-from-top-2">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800 border border-red-100 shadow-sm animate-in slide-in-from-top-2">
          {err}
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50 overflow-hidden transition-all duration-300">
        {/* Profile Header Banner */}
        <div className="h-32 bg-gradient-to-r from-brand-600 to-violet-600 relative">
          <div className="absolute -bottom-12 left-8 p-1 rounded-2xl bg-white shadow-lg">
            <div className="h-24 w-24 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <span className="text-3xl font-black uppercase tracking-tighter">{profile?.name?.charAt(0) || "F"}</span>
            </div>
          </div>
        </div>

        <div className="pt-16 pb-10 px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">{profile?.name || "Unnamed Faculty"}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm font-medium text-slate-500">{profile?.email}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${profile?.facultyVerification === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {profile?.facultyVerification || "Pending"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                PDF Card
              </button>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700 transition-all active:scale-95"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>


          {!isEditing ? (
            <div className="space-y-10">
              <div className="grid gap-8 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</p>
                  <p className="text-sm font-bold text-slate-800">{profile?.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                  <p className="text-sm font-bold text-slate-800 capitalize">{profile?.gender || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
                  <p className="text-sm font-bold text-slate-800">{profile?.dob || "—"}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Permanent Address</p>
                   <p className="text-sm font-bold text-slate-800 leading-relaxed">{profile?.address || "—"}</p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Professional Bio</p>
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed italic">
                    {profile?.bio || "No professional biography has been added yet."}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                {profile?.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100 hover:bg-brand-100 transition-colors">
                    LinkedIn ↗
                  </a>
                )}
                {profile?.github && (
                  <a href={profile.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors">
                    GitHub / Research ↗
                  </a>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={save} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Full Name</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 bg-white text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 block">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Professional summary..."
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <input
                  placeholder="LinkedIn URL"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
                <input
                  placeholder="GitHub URL"
                  value={form.github}
                  onChange={(e) => setForm({ ...form, github: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-xl bg-brand-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-brand-600/20 hover:bg-brand-700 disabled:opacity-60 transition-all active:scale-95"
                >
                  {saving ? "Updating..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-6 py-4 text-sm font-black text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Hidden FacultyCard for PDF export */}
      <div style={{ position: 'absolute', left: '-9999px', top: '0', width: '800px' }}>
        <div ref={cardRef}>
          <FacultyCard data={profile} />
        </div>
      </div>
    </div>
  );
}

