import { describe, expect, it } from "vitest";
import {
  createEmptyOtpValues,
  createInitialKafalaAuthFormData,
  getKafalaDonorName,
  getKafalaOfflinePaymentError,
  getKafalaPhotoUrl,
  getKafalaPriceSummary,
  parseKafalaBankInfo,
  validateKafalaLogin,
  validateKafalaRegistration,
} from "./kafalaFlowController";

describe("kafalaFlowController", () => {
  it("returns safe defaults for parsed and initial state", () => {
    expect(parseKafalaBankInfo(null)).toEqual({ name: "-", rib: "-", bank: "-" });
    expect(parseKafalaBankInfo("not json")).toEqual({ name: "-", rib: "-", bank: "-" });
    expect(createInitialKafalaAuthFormData()).toEqual({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    expect(createEmptyOtpValues()).toEqual(["", "", "", "", "", ""]);
  });

  it("validates login and registration field requirements", () => {
    const validatePhone = (value) => value === "612345678";
    const validateEmail = (value) => value === "test@example.com";

    expect(validateKafalaLogin({ password: "123", phone: "bad", validatePhone })).toEqual({
      phone: "رقم هاتف غير صحيح",
      password: "كلمة المرور مطلوبة",
    });

    expect(
      validateKafalaRegistration({
        formData: {
          fullName: "",
          email: "bad",
          phone: "bad",
          password: "123",
          confirmPassword: "456",
        },
        validateEmail,
        validatePhone,
      }),
    ).toEqual({
      fullName: "الاسم مطلوب",
      email: "بريد غير صحيح",
      phone: "رقم هاتف غير صحيح",
      password: "6 أحرف على الأقل",
      confirmPassword: "كلمات المرور غير متطابقة",
    });
  });

  it("enforces offline payment proof requirements", () => {
    expect(
      getKafalaOfflinePaymentError({
        paymentMethod: "bank_transfer",
        receipt: null,
        reference: "",
      }),
    ).toBe("يجب إرفاق وصل الدفع أو إدخال رقم المرجع");

    expect(
      getKafalaOfflinePaymentError({
        paymentMethod: "cash_agency",
        receipt: null,
        reference: "",
      }),
    ).toBe("يجب إرفاق وصل الدفع أو إدخال رقم الوصل");

    expect(
      getKafalaOfflinePaymentError({
        paymentMethod: "bank_transfer",
        receipt: { name: "receipt.jpg" },
        reference: "",
      }),
    ).toBeNull();
  });

  it("derives donor and media display values", () => {
    expect(getKafalaDonorName({ appUserName: "Donor Name", isAnonymous: true })).toBe("مجهول الهوية");
    expect(getKafalaDonorName({ appUserName: "Donor Name", isAnonymous: false })).toBe("Donor Name");
    expect(getKafalaPhotoUrl({ photo: "storage-id" }, (value) => `https://cdn/${value}`)).toBe("https://cdn/storage-id");
    const summary = getKafalaPriceSummary({ monthlyPrice: 100 });
    expect(summary.priceMAD).toBe("100");
    expect(summary.annualPrice.replace(/[^\d]/g, "")).toBe("1080");
  });
});
