import { describe, expect, it } from "vitest";
import {
  calculateDonationTotal,
  calculateDonationTotalAmount,
  createEmptyDonationOtpValues,
  createInitialDonationAuthFormData,
  createInitialDonationData,
  getDonationOfflineSubmissionError,
  getDonationNextLabel,
  getDonationNextStep,
  getDonationProjectView,
  getDonationPreviousStep,
  getDonationSuccessReference,
  isDonationNextDisabled,
  resolveOfflinePaymentMethod,
  validateDonationLogin,
  validateDonationRegistration,
} from "./donationFlowController";

const baseDonationData = {
  amount: 200,
  customAmount: "",
  paymentMethod: null,
  transferType: "bank",
  donorName: "Test User",
  donorPhone: "612345678",
  transactionReference: "",
};

describe("donationFlowController", () => {
  it("creates stable initial state", () => {
    expect(createInitialDonationAuthFormData()).toEqual({
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });
    expect(createEmptyDonationOtpValues()).toEqual(["", "", "", "", "", ""]);
    expect(
      createInitialDonationData({ name: "Donor", phone: "+212 612345678", email: "test@example.com" }),
    ).toMatchObject({
      amount: 200,
      donorName: "Donor",
      donorPhone: "612345678",
      donorEmail: "test@example.com",
      paymentMethod: null,
    });
  });

  it("calculates totals from preset and custom amounts", () => {
    expect(calculateDonationTotal(baseDonationData)).toBe(200);
    expect(calculateDonationTotal({ ...baseDonationData, customAmount: "350.5", amount: 0 })).toBe(350.5);
    expect(calculateDonationTotalAmount({ ...baseDonationData, customAmount: "350.567", amount: 0 })).toBe(350.57);
  });

  it("resolves offline transfer types to backend payment methods", () => {
    expect(resolveOfflinePaymentMethod({ ...baseDonationData, paymentMethod: "transfer", transferType: "bank" })).toBe("bank_transfer");
    expect(resolveOfflinePaymentMethod({ ...baseDonationData, paymentMethod: "transfer", transferType: "cash" })).toBe("cash_agency");
  });

  it("handles step skipping rules for authenticated and card users", () => {
    expect(getDonationNextStep({ step: 2, donationData: { ...baseDonationData, paymentMethod: "card" }, isAuthenticated: true })).toBe(5);
    expect(getDonationNextStep({ step: 2, donationData: { ...baseDonationData, paymentMethod: "card" }, isAuthenticated: false })).toBe(4);
    expect(getDonationPreviousStep({ step: 5, donationData: { ...baseDonationData, paymentMethod: "card" }, isAuthenticated: true })).toBe(2);
    expect(getDonationPreviousStep({ step: 1, donationData: baseDonationData, isAuthenticated: false })).toBe(0);
  });

  it("enforces validation gates before progressing", () => {
    expect(
      isDonationNextDisabled({
        agreedTerms: false,
        donationData: { ...baseDonationData, amount: 0, customAmount: "" },
        isAuthenticated: false,
        isLoading: false,
        step: 1,
        uploadedFile: null,
      }),
    ).toBe(true);

    expect(
      isDonationNextDisabled({
        agreedTerms: false,
        donationData: { ...baseDonationData, paymentMethod: "transfer", transactionReference: "" },
        isAuthenticated: false,
        isLoading: false,
        step: 3,
        uploadedFile: null,
      }),
    ).toBe(true);

    expect(
      isDonationNextDisabled({
        agreedTerms: false,
        donationData: { ...baseDonationData, paymentMethod: "card" },
        isAuthenticated: true,
        isLoading: false,
        step: 5,
        uploadedFile: null,
      }),
    ).toBe(true);
  });

  it("returns the expected CTA labels for auth and final review", () => {
    expect(getDonationNextLabel({ authMode: "guest", donationData: baseDonationData, isLoading: false, otpSent: false, step: 0 })).toBe("التالي: اختيار المبلغ →");
    expect(getDonationNextLabel({ authMode: "login", donationData: baseDonationData, isLoading: false, otpSent: true, step: 0 })).toBe("تحقق");
    expect(getDonationNextLabel({ authMode: null, donationData: { ...baseDonationData, paymentMethod: "card" }, isLoading: false, otpSent: false, step: 5 })).toBe("💳 الدفع بالبطاقة");
  });

  it("validates auth inputs and offline submission requirements", () => {
    const validatePhone = (value) => value === "612345678";
    const validateEmail = (value) => value === "test@example.com";

    expect(validateDonationLogin({ password: "123", phone: "bad", validatePhone })).toEqual({
      phone: "رقم هاتف غير صحيح",
      password: "كلمة المرور مطلوبة",
    });

    expect(
      validateDonationRegistration({
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

    expect(getDonationOfflineSubmissionError(null)).toBe("يرجى رفع صورة الإيصال");
    expect(getDonationOfflineSubmissionError({ name: "receipt.png" })).toBeNull();
  });

  it("derives project-card data and success references", () => {
    expect(
      getDonationProjectView(
        {
          _id: "project_1",
          title: { ar: "Arabic title", en: "English title" },
          mainImage: "storage-id",
          category: "education",
          benefitCards: [{ label: "A" }],
        },
        "ar",
        (value) => `https://cdn/${value}`,
      ),
    ).toEqual({
      id: "project_1",
      title: "Arabic title",
      image: "https://cdn/storage-id",
      category: "education",
      benefitCards: [{ label: "A" }],
    });

    expect(getDonationSuccessReference({ donationId: "don_123", transactionReference: " ref-1 " })).toBe("ref-1");
    expect(getDonationSuccessReference({ donationId: "don_123", transactionReference: "" })).toBe("don_123");
  });
});
