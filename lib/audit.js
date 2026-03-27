import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb } from "./firebase";

/**
 * Commits a security event to the global audit stream.
 * 
 * @param {Object} auditData - The event payload.
 * @param {string} auditData.action - Unique identifier for the action (e.g., student_updated).
 * @param {string} [auditData.actorUid=null] - The UID of the entity performing the action.
 * @param {string} [auditData.targetUid=null] - The UID of the entity affected by the action.
 * @param {string} [auditData.description=null] - Human-readable narrative of the event.
 * @param {Object} [auditData.details={}] - Structured metadata for forensic analysis.
 */
export async function logAudit({ action, actorUid, targetUid, description, details }) {
  const db = getDb();
  if (!db) return;
  try {
    await addDoc(collection(db, "auditLogs"), {
      action,
      actorUid: actorUid || null,
      targetUid: targetUid || null,
      description: description || null,
      details: details || {},
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    throw new Error(`[Audit Service] Stream interruption: ${e.message}`);
  }
}
