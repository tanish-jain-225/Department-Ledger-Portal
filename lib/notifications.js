import { addDoc, collection, serverTimestamp, getDocs, query, where, limit, deleteDoc, doc, writeBatch } from "firebase/firestore";
import { getDb } from "./firebase";
import { PAGE_SIZE } from "./constants";

/**
 * Creates a notification for a specific user in the global ledger.
 * 
 * @param {string} userUid - The recipient UID. 
 * @param {Object} notification - Notification details.
 * @param {string} notification.title - Short, descriptive title.
 * @param {string} notification.message - Detailed notification content.
 * @param {string} [notification.type="info"] - Visual variant (info, success, warning, error).
 * @param {string} [notification.link=null] - Optional destination URL for the user.
 * @param {string} [notification.relatedId=null] - Optional ID of the related entity (for grouping/purging).
 */
export async function createNotification(userUid, { title, message, type = "info", link = null, relatedId = null }) {
  const db = getDb();
  if (!db) throw new Error("[Notification Service] Firestore unavailable.");
  
  try {
    await addDoc(collection(db, "notifications"), {
      userUid,
      title,
      message,
      type,
      link,
      relatedId,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(`[Notification Service] Failed to create record for ${userUid}: ${error.message}`);
  }
}

/**
 * Broadcasts a notification to all verified administrators.
 * 
 * @param {Object} notification - Notification details (see createNotification).
 */
export async function notifyAdmins({ title, message, type = "info", link = null, relatedId = null }) {
  const db = getDb();
  if (!db) throw new Error("[Notification Service] Admin broadcast failed: Firestore unavailable.");

  try {
    const q = query(collection(db, "users"), where("role", "==", "admin"));
    const snap = await getDocs(q);
    if (snap.empty) return;

    const adminIds = snap.docs.map(d => d.id);
    const chunkSize = 400;
    for (let i = 0; i < adminIds.length; i += chunkSize) {
      const chunk = adminIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(adminId => {
        const ref = doc(collection(db, "notifications"));
        batch.set(ref, {
          userUid: adminId,
          title,
          message,
          type,
          link,
          relatedId,
          read: false,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    throw new Error(`[Notification Service] Admin broadcast failed: ${error.message}`);
  }
}

/**
 * Broadcasts a notification to all faculty members.
 *
 * @param {Object} notification - Notification details (see createNotification).
 */
export async function notifyFaculty({ title, message, type = "info", link = null, relatedId = null }) {
  const db = getDb();
  if (!db) throw new Error("[Notification Service] Faculty broadcast failed: Firestore unavailable.");

  try {
    const q = query(collection(db, "users"), where("role", "==", "faculty"));
    const snap = await getDocs(q);
    if (snap.empty) return;

    const facultyIds = snap.docs.map(d => d.id);
    const chunkSize = 400;
    for (let i = 0; i < facultyIds.length; i += chunkSize) {
      const chunk = facultyIds.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach(facId => {
        const ref = doc(collection(db, "notifications"));
        batch.set(ref, {
          userUid: facId,
          title,
          message,
          type,
          link,
          relatedId,
          read: false,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
    }
  } catch (error) {
    throw new Error(`[Notification Service] Faculty broadcast failed: ${error.message}`);
  }
}


// ── Debounce map for syncAdminNotifications ───────────────────────────────────
// Prevents triple Firestore query hits on every admin page load.
// Key: adminUid, Value: timestamp of last successful sync.
const _syncDebounceMap = new Map();
const SYNC_DEBOUNCE_MS = 60_000; // 1 minute

/**
 * Synchronizes pending governance requests into the notification stream for an admin.
 * Deduplicates by `relatedId` (stable identifier) rather than message string.
 * Debounced to at most once per 60 seconds per admin UID.
 *
 * @param {string} adminUid - The UID of the administrator.
 */
export async function syncAdminNotifications(adminUid) {
  const db = getDb();
  if (!db || !adminUid) return;

  // Debounce: skip if called again within the debounce window.
  const lastSync = _syncDebounceMap.get(adminUid) || 0;
  if (Date.now() - lastSync < SYNC_DEBOUNCE_MS) return;
  _syncDebounceMap.set(adminUid, Date.now());

  try {
    const qRole = query(collection(db, "roleRequests"), where("status", "==", "pending"));
    const qDel = query(collection(db, "deletionRequests"), where("status", "==", "pending"));
    
    const [snapRole, snapDel] = await Promise.all([getDocs(qRole), getDocs(qDel)]);
    
    // Deduplicate by relatedId (stable across message format changes).
    const qExisting = query(
      collection(db, "notifications"), 
      where("userUid", "==", adminUid), 
      limit(PAGE_SIZE.NOTIFICATIONS)
    );
    const snapExisting = await getDocs(qExisting);
    const existingRelatedIds = new Set(
      snapExisting.docs.map(d => d.data().relatedId).filter(Boolean)
    );

    const notifications = [];
    
    snapRole.forEach(d => {
      const data = d.data();
      const relatedId = `role_${d.id}`;
      if (!existingRelatedIds.has(relatedId)) {
        notifications.push({ 
          title: "Clearance Request", 
          message: `Protocol: User ${data.email} is awaiting clearance elevation to ${data.requestedRole}.`, 
          type: "info", 
          link: "/admin/requests",
          relatedId,
        });
      }
    });

    snapDel.forEach(d => {
      const data = d.data();
      const relatedId = `del_${d.id}`;
      if (!existingRelatedIds.has(relatedId)) {
        notifications.push({ 
          title: "Purge Activation", 
          message: `Security: Data lifecycle purge requested for ${data.email}.`, 
          type: "warning", 
          link: "/admin/requests",
          relatedId,
        });
      }
    });

    for (const n of notifications) {
      await createNotification(adminUid, n);
    }
  } catch (error) {
    throw new Error(`[Notification Service] Admin sync failed: ${error.message}`);
  }
}


/**
 * Purges notifications related to a specific entity or event across the system.
 * 
 * @param {string} relatedId - The unique identifier used during creation (e.g., role_UID).
 */
export async function purgeNotifications(relatedId) {
  const db = getDb();
  if (!db || !relatedId) return;

  try {
    const q = query(collection(db, "notifications"), where("relatedId", "==", relatedId));
    const snap = await getDocs(q);
    
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    throw new Error(`[Notification Service] Cleanup failed for ${relatedId}: ${error.message}`);
  }
}

/**
 * Marks all notifications as read for a specific user.
 * 
 * @param {string} userUid - The recipient UID.
 */
export async function markAllAsRead(userUid) {
  const db = getDb();
  if (!db || !userUid) return;

  try {
    const q = query(
      collection(db, "notifications"),
      where("userUid", "==", userUid),
      where("read", "==", false),
      limit(PAGE_SIZE.NOTIFICATIONS)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(d => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    throw new Error(`[Notification Service] Mark all as read failed: ${error.message}`);
  }
}

export async function clearAllNotifications(userUid) {
  const db = getDb();
  if (!db || !userUid) return;

  try {
    const q = query(
      collection(db, "notifications"),
      where("userUid", "==", userUid),
      limit(PAGE_SIZE.NOTIFICATIONS)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    throw new Error(`[Notification Service] Clear all notifications failed: ${error.message}`);
  }
}
