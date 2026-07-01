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

export function getRouteAccess(pathname) {
  if (!pathname) return ACCESS.PUBLIC;

  const normalized = pathname.split("?")[0].split("#")[0];
  const exact = ROUTE_POLICY[normalized];
  if (exact) return exact;

  const dynamicPatterns = Object.keys(ROUTE_POLICY).filter((route) => route.includes(":"));
  for (const pattern of dynamicPatterns) {
    const regex = new RegExp(`^${pattern.replace(/:[^/]+/g, "[^/]+")}$`);
    if (regex.test(normalized)) return ROUTE_POLICY[pattern];
  }

  return ACCESS.PUBLIC;
}
