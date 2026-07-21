import { useEffect, useState } from "react";
import { getLocalizedText } from "../../../lib/i18nContent";

export const DONATION_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export const DEFAULT_BANK_INFO = {
  accountHolder: "—",
  rib: "—",
  bankName: "—",
  agency: "",
  associationPhone: "",
};

export const STEP_LABELS = [
  "الخطوة 1 من 6 — تسجيل الدخول",
  "الخطوة 2 من 6 — اختيار المبلغ",
  "الخطوة 3 من 6 — طريقة الدفع",
  "الخطوة 4 من 6 — رفع وصل التحويل",
  "الخطوة 5 من 6 — بياناتك الشخصية",
  "الخطوة 6 من 6 — مراجعة وتأكيد",
];

export function useViewportWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

export function getImpactItems(benefitCards) {
  if (benefitCards && benefitCards.length > 0) {
    return benefitCards
      .slice(0, 3)
      .map((card) => `${card.icon} ${card.value} ${getLocalizedText(card.label, "ar")}`.trim());
  }
  return [];
}

export function parseBankInfo(bankConfigRaw) {
  if (!bankConfigRaw) return DEFAULT_BANK_INFO;
  try {
    return JSON.parse(bankConfigRaw);
  } catch {
    return DEFAULT_BANK_INFO;
  }
}

export function validateEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
