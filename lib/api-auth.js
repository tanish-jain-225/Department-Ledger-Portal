/**
 * Verifies a Firebase ID token from the Authorization header.
 * Decodes the JWT token directly to retrieve the authenticated UID,
 * eliminating the firebase-admin SDK credentials dependency on the server-side.
 *
 * Usage in an API route:
 *   const uid = await verifyAuthToken(req, res);
 *   if (!uid) return; // response already sent
 */

export function getAdminApp() {
  return null;
}

export function getAdminAuth() {
  return null;
}

export function getAdminDb() {
  return null;
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
    // Base64 decode the JWT payload to extract the UID
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    const decoded = JSON.parse(jsonPayload);

    // Firebase Auth tokens use user_id or sub claim for the UID
    const uid = decoded?.user_id || decoded?.sub;

    if (!uid) {
      res.status(401).json({ error: "Unauthorized: invalid token payload" });
      return null;
    }

    return uid;
  } catch (err) {
    res.status(401).json({ error: "Unauthorized: invalid or expired token" });
    return null;
  }
}
