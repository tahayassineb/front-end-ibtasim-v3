export const RECEIPT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const CMS_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
export const CMS_IMAGE_MAX_BYTES = 3 * 1024 * 1024;

export function validateUploadFile(file, { allowedTypes, maxBytes, label }) {
  if (!file) {
    return `${label} مطلوب`;
  }

  if (!allowedTypes.includes(file.type)) {
    return `${label} يجب أن يكون بصيغة JPG أو PNG أو WebP${allowedTypes.includes("application/pdf") ? " أو PDF" : ""}`;
  }

  if (file.size > maxBytes) {
    return `${label} أكبر من الحد المسموح (${Math.round(maxBytes / 1024 / 1024)}MB)`;
  }

  return null;
}
