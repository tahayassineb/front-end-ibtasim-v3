import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { useApp } from "../context/AppContext";
import AdminSidebarContent from "./AdminSidebarContent";
import {
  buildAdminUserUpdate,
  getCurrentAdminLabel,
  hydrateAdminUser,
  isActiveAdminItem,
  shouldSyncAdminUser,
} from "./adminLayoutHelpers";

export default function AdminLayout() {
  const { user, logout, updateUser } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const revokeAdminSession = useMutation(api.admin.logoutAdminSession);
  const adminSession = useQuery(
    api.admin.getAdminSession,
    user?.sessionToken ? { sessionToken: user?.sessionToken } : "skip",
  );

  const hydratedUser = useMemo(() => hydrateAdminUser(user, adminSession), [adminSession, user]);

  useEffect(() => {
    if (!user || !adminSession || !updateUser) return;

    const nextUser = buildAdminUserUpdate(user, adminSession);
    if (shouldSyncAdminUser(user, nextUser)) {
      updateUser(nextUser);
    }
  }, [adminSession, updateUser, user]);

  const isActive = (item) => isActiveAdminItem(item, location.pathname);
  const current = getCurrentAdminLabel(location.pathname);

  const handleLogout = async () => {
    if (user?.sessionToken) {
      try {
        await revokeAdminSession({ sessionToken: user.sessionToken });
      } catch {
        // Ignore logout revocation failures and clear local state anyway.
      }
    }
    logout();
    navigate("/admin/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f6f8f8", fontFamily: "var(--font-arabic)", color: "#0e1a1b" }} dir="rtl">
      <aside
        className="hidden lg:block"
        style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: 248, background: "white", borderLeft: "1px solid #E5E9EB", zIndex: 40 }}
      >
        <AdminSidebarContent user={hydratedUser} onLogout={handleLogout} onNavigate={() => setOpen(false)} isActive={isActive} />
      </aside>

      {open && <div className="fixed inset-0 lg:hidden" style={{ background: "rgba(0,0,0,.45)", zIndex: 45 }} onClick={() => setOpen(false)} />}
      <aside
        className="lg:hidden"
        style={{
          position: "fixed",
          top: 0,
          bottom: 0,
          right: open ? 0 : -285,
          width: 280,
          background: "white",
          zIndex: 50,
          transition: "right .2s",
          boxShadow: open ? "-10px 0 30px rgba(0,0,0,.16)" : "none",
        }}
      >
        <AdminSidebarContent user={hydratedUser} onLogout={handleLogout} onNavigate={() => setOpen(false)} isActive={isActive} />
      </aside>

      <main style={{ marginRight: typeof window !== "undefined" && window.innerWidth >= 1024 ? 248 : 0, minHeight: "100vh" }}>
        <header
          style={{
            height: 64,
            background: "white",
            borderBottom: "1px solid #E5E9EB",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            position: "sticky",
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #E5E9EB", background: "white", cursor: "pointer" }}
          >
            <span className="material-symbols-outlined no-flip">menu</span>
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{current}</h1>
          <Link to="/" style={{ color: "#0d7477", fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
            عرض الموقع
          </Link>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
