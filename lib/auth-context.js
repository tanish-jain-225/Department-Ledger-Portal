import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

const AuthContext = createContext(null);
let isRegistering = false;

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
      console.error("Failed to load user profile:", err);
      setProfile(null);
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
          if (!isRegistering) {
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
        console.error("Error checking user role:", err);
        await signOut(auth);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [loadProfile]);

  const login = useCallback(async (email, password) => {
    setError(null);
    const auth = getFirebaseAuth();
    const db = getDb();
    if (!auth || !db) throw new Error("Firebase not configured");
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    let role = PENDING_ROLE;
    try {
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        role = snap.data().role || PENDING_ROLE;
      }
    } catch (err) {
      console.error("Error fetching user during login:", err);
    }
    if (!hasApprovedRole(role)) {
      await signOut(auth);
      throw new Error(
        "Your account is not active yet. An administrator must assign your role before you can sign in."
      );
    }
  }, []);

  const register = useCallback(
    async ({ email, password, name, year, branch }) => {
      setError(null);
      const auth = getFirebaseAuth();
      const db = getDb();
      if (!auth || !db) throw new Error("Firebase not configured");
      isRegistering = true;
      try {
        const cred = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        const uid = cred.user.uid;
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
        
        const { collection, addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, "roleRequests"), {
          uid,
          email: email.trim().toLowerCase(),
          requestedRole: "student",
          status: "pending",
          createdAt: serverTimestamp(),
        });

        await signOut(auth);
      } finally {
        isRegistering = false;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Firebase not configured");
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
