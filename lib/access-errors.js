export function isPermissionDeniedError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("permission") || message.includes("insufficient permissions") || message.includes("permission-denied");
}

export function getAccessDeniedMessage(error) {
  if (isPermissionDeniedError(error)) {
    return "Access denied. You do not have permission to view this resource.";
  }
  return "Access denied. You are not authorized to view this resource.";
}
