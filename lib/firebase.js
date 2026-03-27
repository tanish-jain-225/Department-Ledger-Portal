import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Initializes and retrieves the singleton Firebase application instance.
 * @returns {import("firebase/app").FirebaseApp | null}
 */
function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn("[Firebase] Environment variables not detected. Service initialization suspended.");
    return null;
  }
  if (getApps().length) return getApps()[0];
  return initializeApp(firebaseConfig);
}

/** @returns {import("firebase/auth").Auth | null} */
export function getFirebaseAuth() {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

/** @returns {import("firebase/firestore").Firestore | null} */
export function getDb() {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

export { getFirebaseApp };
