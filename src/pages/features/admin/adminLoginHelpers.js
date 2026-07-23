export function normalizeAdminEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function buildAdminUser(loginResult) {
  return {
    id: loginResult.adminId,
    sessionToken: loginResult.sessionToken,
    userId: loginResult.userId,
    email: loginResult.email,
    name: loginResult.fullName || "Admin",
    phone: loginResult.phoneNumber || "",
    role: loginResult.role || "owner",
    isAdmin: true,
  };
}
