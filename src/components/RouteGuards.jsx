import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import {
  getAdminSessionQueryArgs,
  isMissingUserSession,
  resolveAdminRouteState,
} from "../lib/routeGuardHelpers";

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isMissingUserSession(isAuthenticated) ? <Navigate to="/login" /> : children;
}

function AdminRouteLoading() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#f8fafc",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-arabic)",
    }}>
      <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔐</div>
        جاري التحقق...
      </div>
    </div>
  );
}

export function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuth();
  const isAdmin = useQuery(api.admin.verifyAdminSession, getAdminSessionQueryArgs(isAuthenticated, user));
  const state = resolveAdminRouteState({ isAuthenticated, user, isAdmin });

  if (state === "redirect") return <Navigate to="/admin/login" />;
  if (state === "loading") return <AdminRouteLoading />;
  return children;
}
