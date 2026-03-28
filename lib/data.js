import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  orderBy,
  startAfter,
} from "firebase/firestore";
import { getDb } from "./firebase";
import { logAudit } from "./audit";
import { PAGE_SIZE } from "./constants";

/**
 * Helper to get a Firestore collection reference.
 * @param {string} name - Collection name.
 * @returns {import("firebase/firestore").CollectionReference}
 * @throws {Error} If Firestore is not initialized.
 */
export function col(name) {
  const db = getDb();
  if (!db) throw new Error("[Firestore] Service not initialized or available.");
  return collection(db, name);
}

/**
 * Retrieves a list of records for a specific student, sorted by creation date.
 * Implements a graceful fallback for missing Firestore composite indexes.
 * 
 * @param {string} collectionName - Target Firestore collection.
 * @param {string} studentUid - The UID of the student.
 * @param {number} [pageSize=20] - Number of records per page.
 * @param {import("firebase/firestore").DocumentSnapshot} [lastDoc=null] - For pagination.
 * @returns {Promise<Array<Object>>}
 */
export async function listByStudent(collectionName, studentUid, pageSize = PAGE_SIZE.DEFAULT, lastDoc = null) {
  const db = getDb();
  if (!db) return [];
  
  const baseConstraints = [where("studentUid", "==", studentUid)];
  
  try {
    // Attempt high-performance indexed query
    const constraints = [...baseConstraints, orderBy("createdAt", "desc"), limit(pageSize)];
    if (lastDoc) constraints.push(startAfter(lastDoc));
    
    const q = query(collection(db, collectionName), ...constraints);
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    // Graceful Degradation: If index is missing, sort in-memory
    if (error.code === 'failed-precondition' || error.message.includes('index')) {
      const q = query(collection(db, collectionName), ...baseConstraints, limit(pageSize * 2));
      const snap = await getDocs(q);
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return rows.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
    }
    throw new Error(`[Data Layer] Failed to list ${collectionName}: ${error.message}`);
  }
}

/**
 * Administrative query tool for student dashboards with multi-parameter filtering.
 * 
 * @param {Object} params - Query parameters.
 * @param {string} [params.branch] - Department branch.
 * @param {string} [params.year] - Academic year.
 * @param {string} [params.search] - Search term (Name/Email).
 * @param {number} [params.pageSize=20] - Records per page.
 * @param {import("firebase/firestore").DocumentSnapshot} [params.lastDoc=null] - For pagination.
 * @returns {Promise<Array<Object>>}
 */
export async function listStudentsForDashboard({
  branch = "",
  year = "",
  search = "",
  pageSize = PAGE_SIZE.DASHBOARD,
  lastDoc = null,
}) {
  const db = getDb();
  if (!db) return [];
  
  const usersRef = collection(db, "users");
  let constraints = [where("role", "==", "student")];
  
  if (branch) constraints.push(where("branch", "==", branch));
  if (year) constraints.push(where("year", "==", year));
  if (lastDoc) constraints.push(startAfter(lastDoc));
  
  constraints.push(limit(pageSize));
  
  try {
    const q = query(usersRef, ...constraints);
    const snap = await getDocs(q);
    let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Client-side search fallback (Firestore lacks native partial text search without indexes/keys)
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          (r.name || "").toLowerCase().includes(s) ||
          (r.email || "").toLowerCase().includes(s)
      );
    }
    return rows;
  } catch (error) {
    throw new Error(`[Data Layer] Dashboard query failed: ${error.message}`);
  }
}

/**
 * Commits a new record to the ledger with automatic timestamping and optional auditing.
 * 
 * @param {string} collectionName - Target collection.
 * @param {Object} data - Record data.
 * @param {Object} [logging=null] - Audit metadata.
 * @returns {Promise<string>} The new document ID.
 */
export async function createRecord(collectionName, data, logging = null) {
  try {
    const ref = await addDoc(col(collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    if (logging) {
      await logAudit({
        action: `${collectionName}_created`,
        actorUid: logging.actorUid,
        targetUid: data.studentUid || logging.targetUid || null,
        description: logging.description || `Created new record in ${collectionName}`,
        details: { id: ref.id, ...data }
      });
    }
    
    return ref.id;
  } catch (error) {
    throw new Error(`[Data Layer] Creation failed in ${collectionName}: ${error.message}`);
  }
}

/**
 * Updates an existing record with optional auditing.
 * 
 * @param {string} collectionName - Target collection.
 * @param {string} id - Document ID.
 * @param {Object} data - Update data.
 * @param {Object} [logging=null] - Audit metadata.
 */
export async function updateRecord(collectionName, id, data, logging = null) {
  const db = getDb();
  if (!db) return;
  
  try {
    await updateDoc(doc(db, collectionName, id), {
      ...data,
      updatedAt: serverTimestamp(),
    });

    if (logging) {
      await logAudit({
        action: `${collectionName}_updated`,
        actorUid: logging.actorUid,
        targetUid: data.studentUid || logging.targetUid || null,
        description: logging.description || `Updated record ${id} in ${collectionName}`,
        details: { id, ...data }
      });
    }
  } catch (error) {
    throw new Error(`[Data Layer] Update failed in ${collectionName}: ${error.message}`);
  }
}

/**
 * Purges a record from the ledger with optional auditing.
 * 
 * @param {string} collectionName - Target collection.
 * @param {string} id - Document ID.
 * @param {Object} [logging=null] - Audit metadata.
 */
export async function removeRecord(collectionName, id, logging = null) {
  const db = getDb();
  if (!db) return;
  
  try {
    if (logging) {
      await logAudit({
        action: `${collectionName}_deleted`,
        actorUid: logging.actorUid,
        targetUid: logging.targetUid || null,
        description: logging.description || `Deleted record ${id} from ${collectionName}`,
        details: { id }
      });
    }
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    throw new Error(`[Data Layer] Removal failed in ${collectionName}: ${error.message}`);
  }
}
