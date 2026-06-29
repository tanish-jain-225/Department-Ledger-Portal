import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Initializes the Admin app dynamically with the existing Project ID.
 * Since ID token verification is a read-only cryptographic validation using public keys,
 * it functions securely without private service account credentials.
 */
export function getAdminApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_PROJECT_ID configuration.");
  }

  return initializeApp({
    projectId,
  });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  // If credential env vars exist, initialize Firestore Admin SDK.
  // Otherwise, return null to fall back to client-side/in-memory processes.
  const hasCreds = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY;
  if (!hasCreds) return null;
  try {
    return getFirestore(getAdminApp());
  } catch {
    return null;
  }
}

/**
 * @param {import("next").NextApiRequest} req
 * @param {import("next").NextApiResponse} res
 * @returns {Promise<string|null>} The verified UID, or null if unauthorized.
 */
export async function verifyAuthToken(req, res) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: "Unauthorized: missing token" });
    return null;
  }

  try {
    const auth = getAdminAuth();
    // Cryptographically verify signature, audience, issuer, and expiration time using Firebase Admin
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized: invalid token payload" });
      return null;
    }

    return uid;
  } catch (err) {
    console.warn(`[Auth Audit] JWT verification failed: ${err.message || err}`);
    res.status(401).json({ error: "Unauthorized: invalid or expired token" });
    return null;
  }
}
