/**
 * Verifies a Firebase ID token from the Authorization header.
 * Used to protect server-side API routes from unauthenticated access.
 *
 * Usage in an API route:
 *   const uid = await verifyAuthToken(req, res);
 *   if (!uid) return; // response already sent
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getAdminApp() {
  if (getApps().length) return getApps()[0];

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID is not set");

  // In production (Vercel) use GOOGLE_APPLICATION_CREDENTIALS or
  // individual service account env vars. For local dev the client SDK
  // project ID is enough for token verification.
  return initializeApp({ projectId });
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
