/**
 * Shared hook for profile edit + deletion request flow.
 * Used by ProfileInfoSection (student) and FacultyProfile (faculty/admin).
 *
 * @param {string} uid        - The user's UID.
 * @param {string} email      - The user's email (for deletion request record).
 * @param {string} name       - The user's display name.
 * @param {Function} onRefresh - Callback to re-fetch profile after save.
 */
import { useCallback, useEffect, useState } from "react";
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore";
import { getDb } from "./firebase";
import { logAudit } from "./audit";
import { createRecord } from "./data";
import { notifyAdmins } from "./notifications";
import { useToast } from "./toast-context";

export function useProfileEdit(uid, email, name, onRefresh) {
  const { addToast } = useToast();
  const [saving, setSaving]                   = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [loadingDeletion, setLoadingDeletion] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if a deletion request is already pending for this user
  useEffect(() => {
    if (!uid) return;
    async function check() {
      try {
        const db = getDb();
        if (!db) return;
        const q = query(
          collection(db, "deletionRequests"),
          where("uid", "==", uid),
          where("status", "==", "pending"),
          limit(1)
        );
        const snap = await getDocs(q);
        setPendingDeletion(!snap.empty);
      } catch { /* non-critical */ }
      finally { setLoadingDeletion(false); }
    }
    check();
  }, [uid]);

  /**
   * Saves profile fields to Firestore and logs an audit entry.
   * @param {Object} fields - The fields to update on the user document.
   */
  const saveProfile = useCallback(async (fields) => {
    if (!uid) return;
    setSaving(true);
    try {
      const db = getDb();
      if (!db) throw new Error("Firebase not configured");
      await updateDoc(doc(db, "users", uid), { ...fields, updatedAt: serverTimestamp() });
      await onRefresh();
      await logAudit({
        action: "profile_updated",
        actorUid: uid,
        targetUid: uid,
        description: "Updated profile information",
        details: { fields: Object.keys(fields) },
      });
      addToast("Profile saved successfully.", "success");
      return true;
    } catch (error) {
      addToast(error?.message || "Save failed", "error");
      return false;
    } finally {
      setSaving(false);
    }
  }, [uid, onRefresh, addToast]);

  /** Submits a deletion request and notifies admins. */
  const requestDeletion = useCallback(async () => {
    setShowDeleteConfirm(false);
    try {
      const delDocId = await createRecord("deletionRequests", {
        uid, email, name: name || "", status: "pending",
      }, { actorUid: uid, description: "Requested account and data deletion" });

      await notifyAdmins({
        title: "Deletion Request",
        message: `User ${name || email} has requested data deletion.`,
        type: "warning",
        link: "/admin/requests",
        relatedId: `del_${delDocId}`,
      });
      addToast("Deletion request transmitted. An admin will review it.", "success");
      setPendingDeletion(true);
    } catch {
      addToast("Failed to transmit request", "error");
    }
  }, [uid, email, name, addToast]);

  return {
    saving, pendingDeletion, loadingDeletion,
    showDeleteConfirm, setShowDeleteConfirm,
    saveProfile, requestDeletion,
  };
}
