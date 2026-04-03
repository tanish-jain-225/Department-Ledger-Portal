/**
 * Shared hook for all student ledger section components.
 * Encapsulates the create / update / delete state and operations
 * that are duplicated across AcademicSection, AchievementSection,
 * ActivitySection, PlacementSection, ProjectSection and SkillSection.
 *
 * @param {string} collectionName  - Firestore collection (e.g. "achievements")
 * @param {string} uid             - Student UID (owner)
 * @param {Function} onRefresh     - Callback to re-fetch rows after mutation
 * @returns {Object}
 */
import { useCallback, useState } from "react";
import { createRecord, removeRecord, updateRecord } from "./data";
import { useToast } from "./toast-context";

export function useLedgerSection(collectionName, uid, onRefresh) {
  const { addToast } = useToast();
  const [editingRecord, setEditingRecord]   = useState(null);
  const [deleteTarget,  setDeleteTarget]    = useState(null);
  const [saving,        setSaving]          = useState(false);

  /** Create a new record. `data` should NOT include studentUid - it is added here. */
  const add = useCallback(async (data, auditDescription) => {
    setSaving(true);
    try {
      await createRecord(collectionName, { studentUid: uid, ...data }, {
        actorUid: uid,
        description: auditDescription,
      });
      addToast("Record added.", "success");
      onRefresh();
    } catch {
      addToast("Failed to add record.", "error");
    } finally {
      setSaving(false);
    }
  }, [collectionName, uid, onRefresh, addToast]);

  /** Save edits to the currently open editingRecord. */
  const save = useCallback(async (fields, auditDescription) => {
    if (!editingRecord) return;
    setSaving(true);
    try {
      await updateRecord(collectionName, editingRecord.id, fields, {
        actorUid: uid,
        description: auditDescription,
      });
      addToast("Record updated.", "success");
      setEditingRecord(null);
      onRefresh();
    } catch {
      addToast("Failed to update record.", "error");
    } finally {
      setSaving(false);
    }
  }, [collectionName, uid, editingRecord, onRefresh, addToast]);

  /** Confirm and execute deletion of deleteTarget. */
  const confirmDelete = useCallback(async (auditDescription) => {
    if (!deleteTarget) return;
    try {
      await removeRecord(collectionName, deleteTarget.id, {
        actorUid: uid,
        targetUid: uid,
        description: auditDescription,
      });
      addToast("Record deleted.", "success");
      setDeleteTarget(null);
      onRefresh();
    } catch {
      addToast("Failed to delete record.", "error");
    }
  }, [collectionName, uid, deleteTarget, onRefresh, addToast]);

  return {
    editingRecord, setEditingRecord,
    deleteTarget,  setDeleteTarget,
    saving,
    add, save, confirmDelete,
  };
}
