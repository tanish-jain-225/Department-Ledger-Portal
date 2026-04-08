/**
 * Verifies a Firebase ID token from the Authorization header.
 * Used to protect server-side API routes from unauthenticated access.
 *
 * Usage in an API route:
 *   const uid = await verifyAuthToken(req, res);
 *   if (!uid) return; // response already sent
 */
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId) {
    throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");
  }

  // Support local development with explicit service account credentials
  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Ensure private key handles escaped newlines correctly in environment variables
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
      projectId,
    });
  }

  // Fallback to environment-based ADC (for production/Vercel)
  return initializeApp({ projectId });
}

/** @returns {import("firebase-admin/auth").Auth} */
export function getAdminAuth() {
  return getAuth(getAdminApp());
}

/** @returns {import("firebase-admin/firestore").Firestore} */
export function getAdminDb() {
  const { getFirestore } = require("firebase-admin/firestore");
  return getFirestore(getAdminApp());
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
    const app = getAdminApp();
    const decoded = await getAuth(app).verifyIdToken(token);
    return decoded.uid;
  } catch {
    res.status(401).json({ error: "Unauthorized: invalid or expired token" });
    return null;
  }
}
