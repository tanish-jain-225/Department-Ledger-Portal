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

export function flattenRowsForExport(users, { maskSensitive = true } = {}) {
  return users.map((u) => ({
    name: u.name || "",
    email: maskSensitive ? maskEmail(u.email) : u.email || "",
    phone: maskSensitive ? maskPhone(u.phone) : u.phone || "",
    role: u.role || "",
    year: u.year ?? "",
    branch: u.branch || "",
    alumni: u.alumni ? "yes" : "no",
    facultyVerification: u.facultyVerification || "",
    status: u.status || "active",
  }));
}
