import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb } from "./firebase";

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
    console.error("audit log failed", e);
  }
}
