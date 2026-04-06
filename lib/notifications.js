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
    
    const promises = snap.docs.map(adminDoc => 
      createNotification(adminDoc.id, { title, message, type, link, relatedId })
    );
    
    await Promise.all(promises);
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
    const promises = snap.docs.map(f =>
      createNotification(f.id, { title, message, type, link, relatedId })
    );
    await Promise.all(promises);
  } catch (error) {
    throw new Error(`[Notification Service] Faculty broadcast failed: ${error.message}`);
  }
}

/**
 * Synchronizes pending governance requests into the notification stream for an admin.
 * Prevents duplicate alerts by cross-referencing recent notification history.
 * 
 * @param {string} adminUid - The UID of the administrator.
 */
export async function syncAdminNotifications(adminUid) {
  const db = getDb();
  if (!db || !adminUid) return;

  try {
    const qRole = query(collection(db, "roleRequests"), where("status", "==", "pending"));
    const qDel = query(collection(db, "deletionRequests"), where("status", "==", "pending"));
    
    const [snapRole, snapDel] = await Promise.all([getDocs(qRole), getDocs(qDel)]);
    
    // Check for existing recent notifications to avoid duplication
    const qExisting = query(
      collection(db, "notifications"), 
      where("userUid", "==", adminUid), 
      limit(PAGE_SIZE.NOTIFICATIONS)
    );
    const snapExisting = await getDocs(qExisting);
    const existingMessages = new Set(snapExisting.docs.map(d => d.data().message));

    const notifications = [];
    
    snapRole.forEach(d => {
      const data = d.data();
      const msg = `Protocol: User ${data.email} is awaiting clearance elevation to ${data.requestedRole}.`;
      if (!existingMessages.has(msg)) {
        notifications.push({ 
          title: "Clearance Request", 
          message: msg, 
          type: "info", 
          link: "/admin/requests",
          relatedId: `role_${d.id}` 
        });
      }
    });

    snapDel.forEach(d => {
      const data = d.data();
      const msg = `Security: Data lifecycle purge requested for ${data.email}.`;
      if (!existingMessages.has(msg)) {
        notifications.push({ 
          title: "Purge Activation", 
          message: msg, 
          type: "warning", 
          link: "/admin/requests",
          relatedId: `del_${d.id}` 
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
