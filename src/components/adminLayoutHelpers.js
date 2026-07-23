import { canAccessPath, normalizeAdminRole } from "../lib/adminPermissions";

export const adminSections = [
  { label: "الرئيسية", items: [{ path: "/admin", label: "لوحة التحكم", icon: "dashboard", exact: true }] },
  {
    label: "المحتوى",
    items: [
      { path: "/admin/projects", label: "المشاريع", icon: "folder_open" },
      { path: "/admin/kafala", label: "الكفالة", icon: "diversity_1" },
      { path: "/admin/stories", label: "القصص", icon: "auto_stories" },
    ],
  },
  {
    label: "المالية",
    items: [
      { path: "/admin/donations", label: "التبرعات", icon: "payments" },
      { path: "/admin/verification", label: "التحقق", icon: "verified" },
      { path: "/admin/kafala/verifications", label: "تجديدات الكفالة", icon: "published_with_changes" },
      { path: "/admin/receipts", label: "الوصولات", icon: "receipt_long" },
    ],
  },
  {
    label: "العلاقات",
    items: [
      { path: "/admin/donors", label: "المتبرعون", icon: "groups" },
      { path: "/admin/contacts", label: "رسائل التواصل", icon: "mail" },
    ],
  },
  {
    label: "النظام",
    items: [
      { path: "/admin/settings", label: "الإعدادات", icon: "settings" },
      { path: "/admin/activity", label: "سجل النشاط", icon: "manage_history" },
      { path: "/admin/team-performance", label: "أداء الفريق", icon: "monitoring" },
      { path: "/admin/error-logs", label: "سجل الأخطاء", icon: "report" },
    ],
  },
];

export function getVisibleAdminSections(role) {
  const normalizedRole = normalizeAdminRole(role);
  return adminSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessPath(normalizedRole, item.path)),
    }))
    .filter((section) => section.items.length > 0);
}

export function hydrateAdminUser(user, adminSession) {
  if (!user) return user;
  const session = adminSession || null;
  return {
    ...user,
    role: normalizeAdminRole(session?.role ?? user.role),
    name: session?.fullName ?? user.name,
    email: session?.email ?? user.email,
    phone: session?.phoneNumber ?? user.phone,
    isActive: session?.isActive ?? user.isActive,
  };
}

export function buildAdminUserUpdate(user, adminSession) {
  if (!user || !adminSession) return null;
  return {
    role: normalizeAdminRole(adminSession.role),
    name: adminSession.fullName ?? user.name,
    email: adminSession.email ?? user.email,
    phone: adminSession.phoneNumber ?? user.phone,
    isActive: adminSession.isActive ?? user.isActive,
  };
}

export function shouldSyncAdminUser(user, nextUser) {
  if (!user || !nextUser) return false;
  return (
    user.role !== nextUser.role ||
    user.name !== nextUser.name ||
    user.email !== nextUser.email ||
    user.phone !== nextUser.phone ||
    user.isActive !== nextUser.isActive
  );
}

export function isActiveAdminItem(item, pathname) {
  if (item.exact) return pathname === item.path || pathname === "/admin/dashboard";
  return pathname.startsWith(item.path);
}

export function getCurrentAdminLabel(pathname) {
  return adminSections.flatMap((section) => section.items).find((item) => isActiveAdminItem(item, pathname))?.label || "لوحة التحكم";
}
