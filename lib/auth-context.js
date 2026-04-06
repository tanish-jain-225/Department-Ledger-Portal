import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb } from "./firebase";
import { PENDING_ROLE, hasApprovedRole } from "./roles";
import { notifyAdmins } from "./notifications";

/**
 * Central authentication and profile management context for the Department Ledger Portal.
 * Implements a zero-trust role-based access control (RBAC) system.
 */
const AuthContext = createContext(null);

/** @description Template for new student profile synchronization. */
const defaultProfile = {
  name: "",
  email: "",
  role: PENDING_ROLE,
  year: "",
  branch: "",
  phone: "",
  address: "",
  alumni: false,
  status: "active",
  facultyVerification: "pending",
  verificationMethod: null,
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Ref-scoped flag — avoids module-level state shared across concurrent renders
  const isRegisteringRef = useRef(false);

  /**
   * Synchronizes the user's professional profile from the global ledger.
   * 
   * @param {string} uid - The unique identifier of the authenticated user.
   * @throws {Error} If the lookup fails due to connectivity or permissions.
   */
  const loadProfile = useCallback(async (uid) => {
    const db = getDb();
    if (!db || !uid) {
      setProfile(null);
      return;
    }
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setProfile({ id: snap.id, ...snap.data() });
      } else {
        setProfile(null);
      }
    } catch (err) {
      throw new Error(`[Auth Engine] Profile synchronization failed: ${err.message}`);
    }
  }, []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    const unsub = onAuthStateChanged(auth, async (u) => {
      setError(null);
      if (!u) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      const db = getDb();
      if (!db) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.exists() ? snap.data() : {};
        const role = data.role;

        if (!hasApprovedRole(role)) {
          if (!isRegisteringRef.current) {
            await signOut(auth);
          }
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(u);
        await loadProfile(u.uid);
        try {
          await updateDoc(doc(db, "users", u.uid), {
            lastLogin: serverTimestamp(),
          });
        } catch {
          /* ignore */
        }
      } catch (err) {
        await signOut(auth);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [loadProfile]);

  /**
   * Authenticates a user against the ledger and verifies active clearance.
   * 
   * @param {string} email - Registered email address.
   * @param {string} password - Secure passphrase.
   * @throws {Error} If credentials are invalid or account clearance has not been approved.
   */
  const login = useCallback(async (email, password) => {
    setError(null);
    const auth = getFirebaseAuth();
    const db = getDb();
    if (!auth || !db) throw new Error("[Auth Engine] Infrastructure not initialized.");

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const role = snap.exists() ? (snap.data().role || PENDING_ROLE) : PENDING_ROLE;

      if (!hasApprovedRole(role)) {
        await signOut(auth);
        throw new Error(
          "Administrative Protocol: Your account is awaiting role assignment. Please verify your identity with a department lead."
        );
      }
    } catch (err) {
      // Re-throw descriptive errors for the UI layer
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        throw new Error("Invalid credentials. Please verify your identity and try again.");
      }
      throw err;
    }
  }, []);

  /**
   * Registers a new entity in the ledger. 
   * Triggers a multi-stage approval process and notifies administrators.
   * 
   * @param {Object} userData - Registration payload.
   * @throws {Error} If registration protocol fails.
   */
  const register = useCallback(
    async ({ email, password, name, year, branch }) => {
      setError(null);
      const auth = getFirebaseAuth();
      const db = getDb();
      if (!auth || !db) throw new Error("[Auth Engine] Infrastructure not initialized.");
      
      isRegisteringRef.current = true;
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const uid = cred.user.uid;
        
        // 1. Initialize Global Profile
        await setDoc(doc(db, "users", uid), {
          ...defaultProfile,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          year: year || "",
          branch: branch || "",
          role: PENDING_ROLE,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // 2. Queue Role Assignment Request
        const { collection, addDoc } = await import("firebase/firestore");
        const roleReqRef = await addDoc(collection(db, "roleRequests"), {
          uid,
          email: email.trim().toLowerCase(),
          requestedRole: "pending",
          status: "pending",
          createdAt: serverTimestamp(),
        });
        
        // 3. Broadcast to Administrative Governance
        await notifyAdmins({
          title: "New Protocol Request",
          message: `User ${email.trim()} has registered and is awaiting clearance elevation.`,
          type: "info",
          link: "/admin/requests",
          relatedId: `role_${roleReqRef.id}`
        });

        await signOut(auth);
      } catch (err) {
        throw new Error(`[Auth Engine] Registration sequence failed: ${err.message}`);
      } finally {
        isRegisteringRef.current = false;
      }
    },
    []
  );

  /** Terminates the session and resets the application state. */
  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setIsLoggingOut(true);
    try {
      await signOut(auth);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout Error:", err);
      setIsLoggingOut(false);
    }
  }, []);

  /** Triggers a password recovery sequence for the specified identity. */
  const resetPassword = useCallback(async (email) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("[Auth Engine] Infrastructure not initialized.");
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.uid) await loadProfile(user.uid);
  }, [user, loadProfile]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isLoggingOut,
      error,
      setError,
      login,
      register,
      logout,
      resetPassword,
      refreshProfile,
    }),
    [
      user,
      profile,
      loading,
      isLoggingOut,
      error,
      login,
      register,
      logout,
      resetPassword,
      refreshProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
