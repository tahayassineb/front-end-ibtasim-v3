export const KAFALA_DEFAULT_BANK_INFO = { name: "-", rib: "-", bank: "-" };

export function parseKafalaBankInfo(bankInfoRaw) {
  if (!bankInfoRaw) return KAFALA_DEFAULT_BANK_INFO;
  try {
    return JSON.parse(bankInfoRaw);
  } catch {
    return KAFALA_DEFAULT_BANK_INFO;
  }
}

export function createInitialKafalaAuthFormData() {
  return {
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  };
}

export function createEmptyOtpValues() {
  return ["", "", "", "", "", ""];
}

export function validateKafalaLogin({ password, phone, validatePhone }) {
  const errors = {};
  if (!validatePhone(phone)) errors.phone = "رقم هاتف غير صحيح";
  if (!password || password.length < 6) errors.password = "كلمة المرور مطلوبة";
  return errors;
}

export function validateKafalaRegistration({ formData, validateEmail, validatePhone }) {
  const errors = {};
  if (!formData.fullName.trim()) errors.fullName = "الاسم مطلوب";
  if (!validateEmail(formData.email)) errors.email = "بريد غير صحيح";
  if (!validatePhone(formData.phone)) errors.phone = "رقم هاتف غير صحيح";
  if (!formData.password || formData.password.length < 6) errors.password = "6 أحرف على الأقل";
  if (formData.password !== formData.confirmPassword) errors.confirmPassword = "كلمات المرور غير متطابقة";
  return errors;
}

export function getKafalaOfflinePaymentError({ paymentMethod, receipt, reference }) {
  if (paymentMethod === "bank_transfer" && !receipt && !reference.trim()) {
    return "يجب إرفاق وصل الدفع أو إدخال رقم المرجع";
  }
  if (paymentMethod === "cash_agency" && !receipt && !reference.trim()) {
    return "يجب إرفاق وصل الدفع أو إدخال رقم الوصل";
  }
  return null;
}

export function getKafalaPhotoUrl(kafala, resolveFileUrl) {
  if (!kafala?.photo) return null;
  return resolveFileUrl(kafala.photo) || kafala.photo;
}

export function getKafalaPriceSummary(kafala) {
  const monthlyPrice = Number(kafala?.monthlyPrice || 0);
  return {
    priceMAD: monthlyPrice.toLocaleString("fr-MA"),
    annualPrice: Math.round(monthlyPrice * 12 * 0.9).toLocaleString("fr-MA"),
  };
}

export function getKafalaDonorName({ appUserName, isAnonymous }) {
  return isAnonymous ? "مجهول الهوية" : appUserName || "-";
}
