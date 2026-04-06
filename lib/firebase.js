import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function getFirebaseConfig() {
  if (typeof window === "undefined") return null;

  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!config.apiKey || !config.projectId) {
    console.warn("[Firebase] Missing client environment configuration. Firebase will not initialize.");
    return null;
  }

  return config;
}

/**
 * Initializes and retrieves the singleton Firebase application instance.
 * @returns {import("firebase/app").FirebaseApp | null}
 */
function getFirebaseApp() {
  if (typeof window === "undefined") return null;
  if (getApps().length) return getApps()[0];
  const firebaseConfig = getFirebaseConfig();
  if (!firebaseConfig) return null;
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
