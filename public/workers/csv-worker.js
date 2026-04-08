/**
 * Dedicated Web Worker for high-performance CSV serialization.
 * Offloads heavy string manipulation and data flattening from the main thread
 * to prevent UI freezing during large student ledger exports.
 */

self.onmessage = function (e) {
  const { rows, options, origin } = e.data;

  try {
    const csvString = buildCsv(rows, options, origin);
    self.postMessage({ success: true, csvString });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};

function buildCsv(rows, options, origin) {
  if (!rows || rows.length === 0) return "";

  const { fields, maskSensitive } = options;
  
  // 1. Flatten rows (applying masking if needed)
  const dataRows = flattenData(rows, maskSensitive, origin);
  
  // 2. Identify Headers
  const headers = fields || Object.keys(dataRows[0]);

  // 3. Build CSV Lines
  const headerLine = headers.map(escapeCell).join(",");
  const bodyLines = dataRows.map(row => 
    headers.map(h => escapeCell(row[h])).join(",")
  );

  return [headerLine, ...bodyLines].join("\r\n");
}

function flattenData(rows, maskSensitive, origin) {
  return rows.map(u => {
    let row = { ...u };
    
    // Apply masking if requested (Faculty summary view)
    if (maskSensitive) {
      if (row.email) row.email = maskEmail(row.email);
      if (row.phone) row.phone = maskPhone(row.phone);
    }

    // Ensure all values are strings/primitives
    const entries = Object.entries(row).map(([k, v]) => [k, normalizeValue(v)]);
    return Object.fromEntries(entries);
  });
}

function escapeCell(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  // Check for Firestore-style timestamp objects
  if (value && typeof value === 'object') {
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (value.seconds !== undefined) return new Date(value.seconds * 1000).toISOString();
  }
  return String(value);
}

function maskEmail(email) {
  if (!email || typeof email !== "string") return "";
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const masked = local.length <= 1 ? "*" : `${local[0]}${"*".repeat(Math.min(local.length - 1, 4))}`;
  return `${masked}@${domain}`;
}

function maskPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `***${digits.slice(-4)}`;
}
