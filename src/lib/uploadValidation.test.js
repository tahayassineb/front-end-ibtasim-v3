import { describe, expect, it } from "vitest";
import {
  CMS_IMAGE_ALLOWED_TYPES,
  CMS_IMAGE_MAX_BYTES,
  RECEIPT_ALLOWED_TYPES,
  RECEIPT_MAX_BYTES,
  validateUploadFile,
} from "./uploadValidation";

describe("validateUploadFile", () => {
  it("accepts valid receipt files", () => {
    const file = {
      type: "application/pdf",
      size: RECEIPT_MAX_BYTES - 1,
    };

    expect(
      validateUploadFile(file, {
        allowedTypes: RECEIPT_ALLOWED_TYPES,
        maxBytes: RECEIPT_MAX_BYTES,
        label: "ملف الإيصال",
      })
    ).toBeNull();
  });

  it("rejects receipt files with disallowed type", () => {
    const file = {
      type: "image/gif",
      size: 1024,
    };

    expect(
      validateUploadFile(file, {
        allowedTypes: RECEIPT_ALLOWED_TYPES,
        maxBytes: RECEIPT_MAX_BYTES,
        label: "ملف الإيصال",
      })
    ).toContain("JPG");
  });

  it("rejects cms images above size limit", () => {
    const file = {
      type: "image/png",
      size: CMS_IMAGE_MAX_BYTES + 1,
    };

    expect(
      validateUploadFile(file, {
        allowedTypes: CMS_IMAGE_ALLOWED_TYPES,
        maxBytes: CMS_IMAGE_MAX_BYTES,
        label: "صورة الغلاف",
      })
    ).toContain("3MB");
  });
});
