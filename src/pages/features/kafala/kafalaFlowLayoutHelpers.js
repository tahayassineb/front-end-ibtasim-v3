export function createKafalaInputStyle(colors) {
  return {
    width: "100%",
    height: 52,
    border: `1.5px solid ${colors.k100}`,
    borderRadius: 14,
    padding: "0 16px",
    fontSize: 15,
    fontFamily: "var(--font-arabic)",
    color: "#0e1a1b",
    background: "white",
    outline: "none",
    boxSizing: "border-box",
  };
}
