export function getAdminSessionQueryArgs(isAuthenticated, user) {
  return isAuthenticated && user?.sessionToken
    ? { sessionToken: user.sessionToken }
    : "skip";
}

export function isMissingUserSession(isAuthenticated) {
  return !isAuthenticated;
}

export function isMissingAdminSession(isAuthenticated, user) {
  return !isAuthenticated || !user?.id || !user?.sessionToken;
}

export function resolveAdminRouteState({ isAuthenticated, user, isAdmin }) {
  if (isMissingAdminSession(isAuthenticated, user)) return "redirect";
  if (isAdmin === undefined) return "loading";
  if (!isAdmin) return "redirect";
  return "allowed";
}

export function resolveFontSystem(configValue) {
  return configValue === "legacy" ? "legacy" : "thmanyah";
}
