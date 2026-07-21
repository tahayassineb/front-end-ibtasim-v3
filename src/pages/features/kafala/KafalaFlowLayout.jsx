import React from "react";

export function KafalaFlowShell({ children, colors }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.kbg,
        fontFamily: "var(--font-arabic)",
        color: "#0e1a1b",
        display: "flex",
        justifyContent: "center",
      }}
      dir="rtl"
    >
      <div
        style={{
          width: "100%",
          maxWidth: 430,
          minHeight: "100vh",
          background: "white",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}
