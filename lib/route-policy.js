import { ACCESS } from "./route-access";

export const ROUTE_POLICY = {
  "/": ACCESS.PUBLIC,
  "/login": ACCESS.GUEST,
  "/register": ACCESS.GUEST,
  "/privacy": ACCESS.PUBLIC,
  "/terms": ACCESS.PUBLIC,
  "/profile": ACCESS.AUTH,
  "/document/:documentId": ACCESS.AUTH,
  "/student": ACCESS.STUDENT,
  "/student/:uid": ACCESS.STAFF,
  "/student/:uid/card": ACCESS.AUTH,
  "/faculty": ACCESS.STAFF,
  "/dashboard": ACCESS.STAFF,
  "/admin": ACCESS.ADMIN,
  "/admin/audit": ACCESS.ADMIN,
  "/admin/faculty": ACCESS.ADMIN,
  "/admin/requests": ACCESS.ADMIN,
  "/admin/students": ACCESS.ADMIN,
};

/**
 * Protected path prefixes. Any route under these namespaces that is NOT
 * explicitly registered in ROUTE_POLICY defaults to ACCESS.AUTH rather than
 * ACCESS.PUBLIC, preventing accidental public exposure of future routes.
 */
const PROTECTED_PREFIXES = [
  "/admin",
  "/student",
  "/faculty",
  "/dashboard",
  "/profile",
  "/document",
];

export function getRouteAccess(pathname) {
  if (!pathname) return ACCESS.PUBLIC;

  // 1. Normalize path: split query/hash and strip trailing slash (except for "/")
  let normalized = pathname.split("?")[0].split("#")[0];
  if (normalized.endsWith("/") && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }

  // 2. Exact match check
  const exact = ROUTE_POLICY[normalized];
  if (exact) return exact;

  // 3. Dynamic pattern match
  const dynamicPatterns = Object.keys(ROUTE_POLICY).filter((route) => route.includes(":"));
  for (const pattern of dynamicPatterns) {
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}$`);
    if (regex.test(normalized)) return ROUTE_POLICY[pattern];
  }

  // 4. Tight namespace-specific fallback gating
  if (normalized.startsWith("/admin")) return ACCESS.ADMIN;
  if (normalized.startsWith("/faculty") || normalized.startsWith("/dashboard")) return ACCESS.STAFF;
  if (normalized.startsWith("/student")) return ACCESS.STUDENT;
  if (normalized.startsWith("/profile") || normalized.startsWith("/document")) return ACCESS.AUTH;

  return ACCESS.PUBLIC;
}

