import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb } from "./firebase";

export const FIRESTORE_MAX_UPLOAD_BYTES = 512 * 1024;
const DOCUMENTS_COLLECTION = "uploadedDocuments";

export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = reader.result;
      if (typeof value !== "string") {
        return reject(new Error("Unable to read file as base64."));
      }
      const commaIndex = value.indexOf(",");
      resolve(commaIndex >= 0 ? value.slice(commaIndex + 1) : value);
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

async function uploadToFirestore(file, { studentUid, section } = {}) {
  if (typeof window === "undefined") {
    throw Object.assign(new Error("Firestore upload unavailable on the server."), { code: "FIRESTORE_UNAVAILABLE" });
  }

  const db = getDb();
  if (!db) {
    throw Object.assign(new Error("Firestore not initialized."), { code: "FIRESTORE_UNAVAILABLE" });
  }

  if (file.size > FIRESTORE_MAX_UPLOAD_BYTES) {
    throw Object.assign(new Error("File too large for Firestore document storage."), { code: "FIRESTORE_SIZE_LIMIT" });
  }

  const data = await readFileAsBase64(file);
  const docRef = await addDoc(collection(db, DOCUMENTS_COLLECTION), {
    studentUid: studentUid || null,
    section: section || null,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    data,
    createdAt: serverTimestamp(),
  });

  return {
    source: "firestore",
    documentId: docRef.id,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

export async function uploadDocument(file, options = {}) {
  if (file.size > FIRESTORE_MAX_UPLOAD_BYTES) {
    const error = new Error("File too large for Firestore document storage.");
    error.code = "FIRESTORE_SIZE_LIMIT";
    throw error;
  }

  try {
    return await uploadToFirestore(file, options);
  } catch (firestoreError) {
    console.error("Firestore upload failed:", firestoreError);
    throw firestoreError;
  }
}
