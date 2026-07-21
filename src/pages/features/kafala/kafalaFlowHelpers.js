import { RECEIPT_ALLOWED_TYPES, RECEIPT_MAX_BYTES, validateUploadFile } from "../../../lib/uploadValidation";

export const KAFALA_STEPS = 4;

export const KAFALA_STEP_LABELS = [
  "الخطوة 1 من 4 — تسجيل الدخول",
  "الخطوة 2 من 4 — اختيار خطة الكفالة",
  "الخطوة 3 من 4 — طريقة الدفع",
  "الخطوة 4 من 4 — مراجعة وتأكيد",
];

export const KAFALA_COLORS = {
  kdark: "#8B6914",
  k: "#C4A882",
  kbg: "#F5EBD9",
  k100: "#E8D4B0",
};

export function validateReceiptFile(file, showToast) {
  const error = validateUploadFile(file, {
    allowedTypes: RECEIPT_ALLOWED_TYPES,
    maxBytes: RECEIPT_MAX_BYTES,
    label: "ملف الإيصال",
  });
  if (error) {
    showToast(error, "error");
    return false;
  }
  return true;
}

export function validateEmailAddress(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
