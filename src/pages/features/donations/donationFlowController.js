export function calculateDonationTotal(donationData) {
  const base = donationData.customAmount ? parseFloat(donationData.customAmount) || 0 : donationData.amount;
  return base;
}

export function createInitialDonationData(user) {
  return {
    amount: 200,
    customAmount: "",
    paymentMethod: null,
    transferType: "bank",
    coverFees: false,
    donorName: user?.name || "",
    donorPhone: (user?.phone || "").replace("+212", "").replace(/\s/g, ""),
    donorEmail: user?.email || "",
    isAnonymous: false,
    dedication: "",
    message: "",
    transactionReference: "",
  };
}

export function createInitialDonationAuthFormData() {
  return { fullName: "", email: "", phone: "", password: "", confirmPassword: "" };
}

export function createEmptyDonationOtpValues() {
  return ["", "", "", "", "", ""];
}

export function calculateDonationTotalAmount(donationData) {
  return Number(calculateDonationTotal(donationData).toFixed(2));
}

export function getDonationProjectView(convexProject, lang, resolveFileUrl) {
  if (!convexProject) return null;
  return {
    id: convexProject._id,
    title: convexProject.title?.[lang] || convexProject.title?.ar || convexProject.title?.en || "",
    image: resolveFileUrl(convexProject.mainImage) || convexProject.mainImage,
    category: convexProject.category,
    benefitCards: convexProject.benefitCards,
  };
}

export function validateDonationLogin({ password, phone, validatePhone }) {
  const errors = {};
  if (!validatePhone(phone)) errors.phone = "رقم هاتف غير صحيح";
  if (!password || password.length < 6) errors.password = "كلمة المرور مطلوبة";
  return errors;
}

export function validateDonationRegistration({ formData, validateEmail, validatePhone }) {
  const errors = {};
  if (!formData.fullName.trim()) errors.fullName = "الاسم مطلوب";
  if (!validateEmail(formData.email)) errors.email = "بريد غير صحيح";
  if (!validatePhone(formData.phone)) errors.phone = "رقم هاتف غير صحيح";
  if (!formData.password || formData.password.length < 6) errors.password = "6 أحرف على الأقل";
  if (formData.password !== formData.confirmPassword) errors.confirmPassword = "كلمات المرور غير متطابقة";
  return errors;
}

export function resolveOfflinePaymentMethod(donationData) {
  return donationData.paymentMethod === "transfer"
    ? donationData.transferType === "cash"
      ? "cash_agency"
      : "bank_transfer"
    : "bank_transfer";
}

export function getDonationOfflineSubmissionError(uploadedFile) {
  if (!uploadedFile) return "يرجى رفع صورة الإيصال";
  return null;
}

export function getDonationSuccessReference({ donationId, transactionReference }) {
  return transactionReference?.trim() || donationId;
}

export function getDonationNextStep({ donationData, isAuthenticated, step }) {
  if (step === 2 && donationData.paymentMethod === "card") return isAuthenticated ? 5 : 4;
  if (step === 3 && isAuthenticated) return 5;
  return step + 1;
}

export function getDonationPreviousStep({ donationData, isAuthenticated, step }) {
  if (step === 4 && donationData.paymentMethod === "card") return 2;
  if (step === 5 && isAuthenticated) return donationData.paymentMethod === "card" ? 2 : 3;
  if (step === 1 && !isAuthenticated) return 0;
  return step - 1;
}

export function isDonationNextDisabled({
  agreedTerms,
  donationData,
  isAuthenticated,
  isLoading,
  step,
  uploadedFile,
}) {
  if (isLoading) return true;
  if (step === 1 && calculateDonationTotal(donationData) <= 0) return true;
  if (step === 2 && !donationData.paymentMethod) return true;
  if (step === 3 && !uploadedFile && !donationData.transactionReference?.trim()) return true;
  if (step === 4 && !isAuthenticated && (!donationData.donorName?.trim() || !donationData.donorPhone?.trim())) return true;
  if (step === 5 && !agreedTerms) return true;
  return false;
}

export function getDonationNextLabel({ authMode, donationData, isLoading, otpSent, step }) {
  if (step === 0) {
    if (authMode === "guest") return "التالي: اختيار المبلغ →";
    if (otpSent) return "تحقق";
    return authMode === "login" ? "تسجيل الدخول" : "إنشاء حساب";
  }
  if (step === 5) {
    if (isLoading) return "...";
    return donationData.paymentMethod === "card" ? "💳 الدفع بالبطاقة" : "🤲 أرسل تبرعي الآن";
  }
  if (step === 2 && donationData.paymentMethod === "card") return "التالي: بياناتك →";
  const labels = ["", "التالي: طريقة الدفع →", "التالي: رفع الوصل →", "التالي: بياناتك →", "التالي: المراجعة →"];
  return labels[step] || "التالي";
}
