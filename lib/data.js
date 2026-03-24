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

export async function listByStudent(collectionName, studentUid) {
  const db = getDb();
  if (!db) return [];
  const q = query(
    collection(db, collectionName),
    where("studentUid", "==", studentUid)
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  rows.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
  return rows;
}

export async function listStudentsForDashboard({
  branch = "",
  year = "",
  search = "",
  pageSize = 20,
}) {
  const db = getDb();
  if (!db) return [];
  const usersRef = collection(db, "users");
  let q = query(usersRef, where("role", "==", "student"), limit(200));
  const snap = await getDocs(q);
  let rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (branch)
    rows = rows.filter(
      (r) => (r.branch || "").toLowerCase() === branch.toLowerCase()
    );
  if (year) rows = rows.filter((r) => String(r.year) === String(year));
  if (search.trim()) {
    const s = search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(s) ||
        (r.email || "").toLowerCase().includes(s)
    );
  }
  return rows.slice(0, pageSize);
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
