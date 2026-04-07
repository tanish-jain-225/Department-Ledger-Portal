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
    // Handle Firestore Timestamps
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString();
    }
    if (typeof value.seconds === "number" && typeof value.nanoseconds === "number") {
      return new Date(value.seconds * 1000).toISOString();
    }
    // For other objects, if it's not a primitive, we should have flattened it already.
    // If we haven't, String() is safer than JSON.stringify to avoid cell overflow/quotes issues.
    return String(value);
  }
  return String(value);
}

export function flattenRowsForExport(data, { maskSensitive = true, origin = "", fields = null } = {}) {
  return data.map((u) => {
    // Prepare the base row. 
    // If the mapper already provided a flat object (like buildStudentExportRow), 
    // we just need to apply masking if requested.
    const row = { ...u };
    
    if (maskSensitive) {
      if (row.email) row.email = maskEmail(row.email);
      if (row.phone) row.phone = maskPhone(row.phone);
    }

    const entries = fields
      ? fields.map((key) => [key, normalizeExportValue(row[key])])
      : Object.entries(row).map(([key, value]) => [key, normalizeExportValue(value)]);

    return Object.fromEntries(entries);
  });
}
