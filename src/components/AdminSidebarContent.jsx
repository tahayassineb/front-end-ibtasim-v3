import React from "react";
import { Link } from "react-router-dom";
import { roleLabels } from "../lib/adminPermissions";
import { getVisibleAdminSections } from "./adminLayoutHelpers";

export default function AdminSidebarContent({ user, onLogout, onNavigate, isActive }) {
  const visibleSections = getVisibleAdminSections(user?.role);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Link
        to="/admin"
        onClick={onNavigate}
        style={{
          padding: 20,
          borderBottom: "1px solid #E5E9EB",
          display: "flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          color: "#0e1a1b",
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: "#0d7477",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 900,
          }}
        >
          ا
        </div>
        <div>
          <div style={{ fontWeight: 900 }}>ابتسام</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>لوحة الإدارة</div>
        </div>
      </Link>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
        {visibleSections.length === 0 ? (
          <div
            style={{
              margin: 14,
              padding: 12,
              borderRadius: 10,
              background: "#F8FAFC",
              color: "#64748b",
              fontSize: 12,
              fontWeight: 700,
              lineHeight: 1.8,
            }}
          >
            لا توجد صلاحيات ظاهرة. أعد تسجيل الدخول أو تواصل مع المالك.
          </div>
        ) : (
          visibleSections.map((section) => (
            <div key={section.label}>
              <div style={{ padding: "14px 14px 5px", fontSize: 10, color: "#94a3b8", fontWeight: 900 }}>{section.label}</div>
              {section.items.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    style={{
                      margin: "3px 8px",
                      padding: "10px 12px",
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: active ? 800 : 600,
                      background: active ? "#0d7477" : "transparent",
                      color: active ? "white" : "#64748b",
                    }}
                  >
                    <span className="material-symbols-outlined no-flip" style={{ fontSize: 20 }}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))
        )}
      </div>

      <div style={{ borderTop: "1px solid #E5E9EB", padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{user?.name || "المدير"}</div>
        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{roleLabels[user?.role] || roleLabels.owner}</div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: "100%",
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "#FEE2E2",
            color: "#dc2626",
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "var(--font-arabic)",
          }}
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}
