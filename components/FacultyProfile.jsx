import { useState, useEffect } from "react";
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { useToast } from "@/lib/toast-context";
import { logAudit } from "@/lib/audit";
import { createRecord } from "@/lib/data";
import { notifyAdmins } from "@/lib/notifications";
import Button from "./ui/Button";
import IdentityCardPopup from "./IdentityCardPopup";

export default function FacultyProfile({ profile, onRefresh }) {
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [loadingDeletion, setLoadingDeletion] = useState(true);
  const [err, setErr] = useState("");

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

  useEffect(() => {
    async function checkDeletionStatus() {
      if (!profile?.id) return;
      try {
        const db = getDb();
        const q = query(
          collection(db, "deletionRequests"),
          where("uid", "==", profile.id),
          where("status", "==", "pending"),
          limit(1)
        );
        const snap = await getDocs(q);
        setPendingDeletion(!snap.empty);
      } catch (err) {
        // Deletion status check is non-critical — fail silently
      } finally {
        setLoadingDeletion(false);
      }
    }
    checkDeletionStatus();
  }, [profile?.id]);

  async function save(e) {
    if (e) e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const db = getDb();
      if (!db) return;
      await updateDoc(doc(db, "users", profile.id), {
        ...form,
        updatedAt: serverTimestamp(),
      });
      await logAudit({
        action: "profile_updated",
        actorUid: profile.id,
        targetUid: profile.id,
        description: `Updated faculty profile information`,
        details: { fields: Object.keys(form) }
      });
      await onRefresh();
      addToast("Professional profile updated.", "success");
      setIsEditing(false);
    } catch (error) {
      addToast(error.message || "Failed to update profile", "error");
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function requestDeletion() {
    try {
      const delDocId = await createRecord("deletionRequests", {
        uid: profile.id,
        email: profile.email || "",
        name: profile.name || "",
        status: "pending",
        createdAt: new Date(),
      }, {
        actorUid: profile.id,
        description: "Requested professional account and data deletion"
      });
      addToast("Deletion request transmitted. An admin will review it.", "success");

      await notifyAdmins({
        title: "Staff Deletion Request",
        message: `Faculty member ${profile.name || profile.email} has requested data deletion.`,
        type: "warning",
        link: "/admin/requests",
        relatedId: `del_${delDocId}`
      });
      setPendingDeletion(true);
    } catch (err) {
      addToast("Failed to transmit request", "error");
    }
  }

  const [showCardModal, setShowCardModal] = useState(false);

  return (
    <div className="mx-auto max-w-5xl space-y-10 animate-fade-in no-print pb-24">
      <IdentityCardPopup 
        show={showCardModal} 
        onClose={() => setShowCardModal(false)} 
        role="faculty"
        data={profile}
      />
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Professional Identity</h1>
          <p className="text-base text-slate-400 mt-2 font-medium">Manage your instructional credentials and departmental status.</p>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="px-6"
            >
              Update Credentials
            </Button>
            <Button
              onClick={() => setShowCardModal(true)}
              className="px-6 shadow-xl shadow-brand-500/20"
            >
              View Identity Card
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-8">
          {isEditing ? (
            <form onSubmit={save} className="premium-card p-8 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-900 focus:border-brand-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone Contact</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-900 focus:border-brand-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Office Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-900 focus:border-brand-500/50 outline-none transition-all"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date of Birth</label>
                  <input
                    type="date"
                    value={form.dob}
                    onChange={(e) => setForm({ ...form, dob: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-900 focus:border-brand-500/50 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-900 focus:border-brand-500/50 outline-none transition-all appearance-none"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">LinkedIn URL</label>
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-900 focus:border-brand-500/50 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructions Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-white px-5 py-3 text-sm font-black text-slate-900 focus:border-brand-500/50 outline-none transition-all min-h-[120px]"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" onClick={save} disabled={saving} className="flex-1">
                  {saving ? "Saving Changes..." : "Secure Save"}
                </Button>
                <Button variant="secondary" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </form>
          ) : (
            <div className="premium-card p-10 flex flex-col items-center text-center space-y-6">
               <div className="h-24 w-24 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-slate-900/30">
                  {profile.name?.charAt(0) || "U"}
               </div>
               <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{profile.name || "Staff Member"}</h2>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-600 mt-2">{profile.role}</p>
               </div>
               <p className="text-slate-500 font-medium leading-relaxed max-w-sm italic">
                  &quot;{profile.bio || "No professional biography provided. Update your credentials to customize your identity card."}&quot;
               </p>
               
               <div className="w-full pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                     <p className="text-xs font-black text-emerald-600 uppercase">Verified</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                     <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Clearance</p>
                     <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{profile.role === 'admin' ? 'L3 ROOT' : 'L2 STAFF'}</p>
                  </div>
               </div>
            </div>
          )}

          {!isEditing && (
            <div className="mt-12 pt-10 border-t border-red-50/50">
              <div className="flex items-center gap-2 mb-4">
                 <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                 <h3 className="text-sm font-black text-red-600 uppercase tracking-widest">Protocol: Data Deletion</h3>
              </div>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-xl">Requesting data deletion will trigger an administrative workflow to permanently purge your professional records. This operation is non-reversible.</p>
              
              {loadingDeletion ? (
                <div className="h-12 w-48 bg-slate-100 animate-pulse rounded-2xl" />
              ) : pendingDeletion ? (
                <div className="flex flex-col gap-4 items-start">
                   <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 animate-fade-in shadow-sm">
                      <svg className="h-5 w-5 text-amber-500 animate-spin-slow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-black uppercase tracking-widest">Awaiting Administrative Review</span>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 italic pl-2">Protocol: Your purge request is active. System access will be revoked upon clearance.</p>
                </div>
              ) : (
                <Button
                  onClick={requestDeletion}
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-100/50 px-6"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Initialize Deletion Request
                </Button>
              )}
            </div>
          )}
        </div>
    </div>
  );
}
