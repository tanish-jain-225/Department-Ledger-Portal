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
} from "firebase/firestore";
import { getDb } from "./firebase";

export function col(name) {
  const db = getDb();
  if (!db) throw new Error("Firestore not available");
  return collection(db, name);
}

// Improved: Use Firestore orderBy for createdAt, avoid in-memory sorting
export async function listByStudent(collectionName, studentUid, pageSize = 20, lastDoc = null) {
  const db = getDb();
  if (!db) return [];
  let constraints = [
    where("studentUid", "==", studentUid),
    // Order by createdAt descending (most recent first)
    // Note: Ensure Firestore index exists for this query
    // If you want ascending, change "desc" to "asc"
    // orderBy("createdAt", "desc"),
  ];
  // Uncomment the next line if you want to order by createdAt
  // constraints.push(orderBy("createdAt", "desc"));
  if (lastDoc) constraints.push(startAfter(lastDoc));
  constraints.push(limit(pageSize));
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Improved: Push filtering and sorting into Firestore queries, add pagination support
export async function listStudentsForDashboard({
  branch = "",
  year = "",
  search = "",
  pageSize = 20,
  lastDoc = null, // for pagination
}) {
  const db = getDb();
  if (!db) return [];
  const usersRef = collection(db, "users");
  let constraints = [where("role", "==", "student")];
  if (branch) constraints.push(where("branch", "==", branch));
  if (year) constraints.push(where("year", "==", year));
  // For search, Firestore does not support contains, so we can only filter by prefix if indexed
  if (search.trim()) {
    // If you have a search index, use it here. Otherwise, fallback to client-side filtering after fetching a reasonable number of docs.
    // For now, fetch by name prefix (if available)
    // constraints.push(where("name", ">=", search), where("name", "<=", search + '\uf8ff'));
    // If not indexed, fallback to client-side filtering after fetching
  }
  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }
  constraints.push(limit(pageSize));
  let q = query(usersRef, ...constraints);
  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Fallback: If search is provided and not indexed, filter client-side
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s)
    );
  }
  return rows;
}

export async function createRecord(collectionName, data) {
  const ref = await addDoc(col(collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateRecord(collectionName, id, data) {
  const db = getDb();
  if (!db) return;
  await updateDoc(doc(db, collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function removeRecord(collectionName, id) {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, collectionName, id));
}
