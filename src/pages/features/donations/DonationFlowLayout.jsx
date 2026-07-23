import React from "react";

const DONATION_CONFIRMATION_NOTE =
  "\u0633\u062a\u0635\u0644\u0643 \u0631\u0633\u0627\u0644\u0629 \u062a\u0623\u0643\u064a\u062f \u0641\u0648\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u062a\u0628\u0631\u0639";
const DONATION_TOTAL_LABEL = "\u0627\u0644\u0645\u062c\u0645\u0648\u0639";
const MAD_ABBREVIATION = "\u062f.\u0645";

export function DonationFlowShell({ children, containerMaxWidth }) {
  return (
    <div
      style={{
        height: "100dvh",
        background: "#F0F7F7",
        fontFamily: "var(--font-arabic)",
        color: "#0e1a1b",
        display: "flex",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: containerMaxWidth,
          height: "100%",
          background: "white",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function DonationFlowFooter({
  amount,
  getNextCtaLabel,
  handleNext,
  isLoading,
  isNextDisabled,
  step,
}) {
  if (step >= 6) return null;

  return (
    <div style={{ flexShrink: 0, padding: "14px 16px", background: "white", borderTop: "1px solid #E5E9EB" }}>
      {step === 0 ? (
        <button
          onClick={handleNext}
          disabled={isLoading}
          style={{
            width: "100%",
            height: 52,
            background: isLoading ? "#94a3b8" : "#0d7477",
            color: "white",
            border: "none",
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            cursor: isLoading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(13,116,119,.25)",
            fontFamily: "var(--font-arabic)",
          }}
        >
          {isLoading ? "..." : getNextCtaLabel()}
        </button>
      ) : step === 5 ? (
        <div>
          <button
            onClick={handleNext}
            disabled={isNextDisabled()}
            style={{
              width: "100%",
              height: 56,
              background: isNextDisabled() ? "#E5E9EB" : "#0d7477",
              color: isNextDisabled() ? "#94a3b8" : "white",
              border: "none",
              borderRadius: 16,
              fontSize: 17,
              fontWeight: 800,
              cursor: isNextDisabled() ? "not-allowed" : "pointer",
              boxShadow: isNextDisabled() ? "none" : "0 4px 14px rgba(13,116,119,.25)",
              fontFamily: "var(--font-arabic)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {getNextCtaLabel()}
          </button>
          <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
            {DONATION_CONFIRMATION_NOTE}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.4 }}>
            {DONATION_TOTAL_LABEL}
            <br />
            <strong
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#0A5F62",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {amount}
            </strong>{" "}
            <span style={{ fontSize: 11 }}>{MAD_ABBREVIATION}</span>
          </div>
          <button
            onClick={handleNext}
            disabled={isNextDisabled()}
            style={{
              flex: 1,
              height: 52,
              background: isNextDisabled() ? "#E5E9EB" : "#0d7477",
              color: isNextDisabled() ? "#94a3b8" : "white",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: isNextDisabled() ? "not-allowed" : "pointer",
              boxShadow: isNextDisabled() ? "none" : "0 4px 14px rgba(13,116,119,.25)",
              fontFamily: "var(--font-arabic)",
            }}
          >
            {isLoading ? "..." : getNextCtaLabel()}
          </button>
        </div>
      )}
    </div>
  );
}
