/** Mask email: j***@domain.com */
export function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked =
    local.length <= 1 ? "*" : `${local[0]}${"*".repeat(Math.min(local.length - 1, 4))}`;
  return `${masked}@${domain}`;
}

/** Mask phone: last 4 digits visible */
export function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `***${digits.slice(-4)}`;
}

function buildDocumentMetadata(row, origin = "") {
  if (!row || typeof row !== "object") return { fileName: "", documentId: "", documentLink: "" };

  const candidate = row.document || row.uploadedDocument || null;
  const doc = candidate || ((row.documentId || row.fileName) ? row : null);
  if (!doc || typeof doc !== "object") return { fileName: "", documentId: "", documentLink: "" };

  const documentId = doc?.documentId || (doc !== row ? doc?.id : "") || "";
  const fileName = doc?.fileName || "";
  const documentLink = documentId && origin
    ? `${origin.replace(/\/$/, "")}/document/${encodeURIComponent(documentId)}`
    : documentId;

  return { fileName, documentId, documentLink };
}

function normalizeExportValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if (typeof value.seconds === "number" && typeof value.nanoseconds === "number") {
      return new Date(value.seconds * 1000).toISOString();
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function flattenRowsForExport(users, { maskSensitive = true, origin = "", fields = null } = {}) {
  return users.map((u) => {
    const { fileName, documentId, documentLink } = buildDocumentMetadata(u, origin);
    const baseRow = {
      ...u,
      email: maskSensitive ? maskEmail(u.email) : u.email || "",
      phone: maskSensitive ? maskPhone(u.phone) : u.phone || "",
      alumni: u.alumni ? "yes" : "no",
      uploadedDocumentName: fileName,
      uploadedDocumentId: documentId,
      uploadedDocumentLink: documentLink,
    };

    const entries = fields
      ? fields.map((key) => [key, normalizeExportValue(baseRow[key])])
      : Object.entries(baseRow).map(([key, value]) => [key, normalizeExportValue(value)]);

    return Object.fromEntries(entries);
  });
}
