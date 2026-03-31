/**
 * Returns the current user's Firebase ID token for use in API route headers.
 * Returns null if no user is signed in or Firebase is unavailable.
 */
import { getFirebaseAuth } from "./firebase";

export async function getIdToken() {
  const auth = getFirebaseAuth();
  if (!auth?.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}
