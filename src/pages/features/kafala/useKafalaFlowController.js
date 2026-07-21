import { useEffect, useRef, useState } from "react";
import {
  createEmptyOtpValues,
  createInitialKafalaAuthFormData,
  getKafalaOfflinePaymentError,
  validateKafalaLogin,
  validateKafalaRegistration,
} from "./kafalaFlowController";

export function useKafalaFlowController({
  appUser,
  cancelSponsorship,
  countryCodeDefault = "+212",
  createCheckout,
  createSponsorship,
  generateUploadUrl,
  id,
  isAuthenticated,
  lang,
  login,
  loginWithPassword,
  registerUser,
  requestOTP,
  setPasswordMut,
  showToast,
  uploadKafalaReceipt,
  validateEmail,
  validatePhone,
  verifyOTP,
}) {
  const [step, setStep] = useState(isAuthenticated ? 1 : 0);
  const [authMode, setAuthMode] = useState(null);
  const [authFormData, setAuthFormData] = useState(createInitialKafalaAuthFormData);
  const [authErrors, setAuthErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(createEmptyOtpValues);
  const [otpTimer, setOtpTimer] = useState(120);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [countryCode, setCountryCode] = useState(countryCodeDefault);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentCategory, setPaymentCategory] = useState("bank_agency");
  const [planType, setPlanType] = useState("monthly");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [reference, setReference] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const phoneInputRef = useRef();
  const fileRef = useRef();
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (isAuthenticated && step === 0) setStep(1);
  }, [isAuthenticated, step]);

  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer((previous) => previous - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [otpSent, otpTimer]);

  const handleResendOtp = async () => {
    try {
      const result = await requestOTP({ phoneNumber: countryCode + authFormData.phone });
      if (!result?.success) {
        showToast(result?.message || "تعذر إعادة الإرسال", "error");
        return;
      }
      setOtpTimer(120);
      showToast("تم إرسال الرمز", "success");
    } catch {
      showToast("تعذر إعادة الإرسال", "error");
    }
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthFormData((previous) => ({ ...previous, [name]: value }));
    if (authErrors[name]) {
      setAuthErrors((previous) => ({ ...previous, [name]: null }));
    }
  };

  const handlePhoneChange = (event) => {
    const value = event.target.value.replace(/[^\d]/g, "");
    setAuthFormData((previous) => ({ ...previous, phone: value }));
    if (authErrors.phone) {
      setAuthErrors((previous) => ({ ...previous, phone: null }));
    }
  };

  const handleLogin = async () => {
    const errors = validateKafalaLogin({
      password: authFormData.password,
      phone: authFormData.phone,
      validatePhone,
    });
    if (Object.keys(errors).length) {
      setAuthErrors(errors);
      return;
    }

    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await loginWithPassword({ phoneNumber: fullPhone, password: authFormData.password });
      if (result.success && result.user) {
        login({
          id: result.user._id,
          userId: result.user._id,
          name: result.user.fullName,
          phone: result.user.phoneNumber,
          email: result.user.email,
        });
        setStep(1);
        showToast("تم تسجيل الدخول", "success");
      } else if (result.requiresOtpVerification) {
        try {
          await requestOTP({ phoneNumber: fullPhone });
        } catch (requestError) {
          void requestError;
        }
        setOtpSent(true);
        setOtpTimer(120);
        showToast("حسابك غير مفعّل. تم إرسال رمز التحقق مجدداً.", "info");
      } else {
        setAuthErrors({ password: result.message || "فشل تسجيل الدخول" });
      }
    } catch {
      setAuthErrors({ password: "خطأ في الاتصال" });
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRegister = async () => {
    const errors = validateKafalaRegistration({
      formData: authFormData,
      validateEmail,
      validatePhone,
    });
    if (Object.keys(errors).length) {
      setAuthErrors(errors);
      return;
    }

    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await registerUser({
        fullName: authFormData.fullName,
        email: authFormData.email,
        phoneNumber: fullPhone,
        preferredLanguage: lang,
      });
      if (result.success) {
        if (result.userId) {
          await setPasswordMut({ userId: result.userId, password: authFormData.password });
        }
        await requestOTP({ phoneNumber: fullPhone });
        setOtpSent(true);
        setOtpTimer(120);
        showToast("تم إرسال الرمز", "success");
      } else {
        setAuthErrors({ phone: result.message });
      }
    } catch {
      showToast("خطأ في التسجيل", "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpValues.every((value) => value.length === 1)) return;
    setIsAuthLoading(true);
    try {
      const phoneNumber = countryCode + authFormData.phone;
      const result = await verifyOTP({ phoneNumber, code: otpValues.join("") });
      if (!result.success) {
        showToast(result.message, "error");
        return;
      }
      login({
        id: result.userId,
        userId: result.userId,
        name: authFormData.fullName,
        phone: phoneNumber,
        email: authFormData.email,
      });
      setStep(1);
      showToast("تم إنشاء الحساب", "success");
    } catch {
      showToast("خطأ في التحقق", "error");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const userId = appUser?.userId || appUser?.id;
      if (!userId) {
        showToast("يرجى تسجيل الدخول أولاً", "error");
        setStep(0);
        return;
      }

      const offlinePaymentError = getKafalaOfflinePaymentError({
        paymentMethod,
        receipt,
        reference,
      });
      if (offlinePaymentError) {
        showToast(offlinePaymentError, "error");
        setSubmitting(false);
        return;
      }

      const result = await createSponsorship({ kafalaId: id, userId, paymentMethod, isAnonymous });

      if (paymentMethod === "card_whop") {
        let userCountry;
        try {
          const geo = await fetch("https://ipapi.co/json/");
          if (geo.ok) userCountry = (await geo.json()).country_code;
        } catch (geoError) {
          void geoError;
        }

        let purchaseUrl;
        try {
          const checkout = await createCheckout({
            kafalaId: id,
            donationId: result.donationId,
            userCountry,
            plan: planType,
          });
          purchaseUrl = checkout.purchaseUrl;
        } catch (whopError) {
          try {
            await cancelSponsorship({ sponsorshipId: result.sponsorshipId, donationId: result.donationId });
          } catch (cancelError) {
            void cancelError;
          }
          throw whopError;
        }
        window.location.href = purchaseUrl;
        return;
      }

      if (paymentMethod === "bank_transfer" || paymentMethod === "cash_agency") {
        let storageId = "";
        if (receipt) {
          const uploadUrl = await generateUploadUrl({ purpose: "receipt", kafalaDonationId: result.donationId });
          const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            body: receipt,
            headers: { "Content-Type": receipt.type },
          });
          const uploadData = await uploadRes.json();
          storageId = uploadData.storageId;
        }

        await uploadKafalaReceipt({
          donationId: result.donationId,
          receiptUrl: storageId,
          bankName: paymentMethod === "cash_agency" ? bankName || "cash_agency" : bankName,
          transactionReference: reference || undefined,
        });
      }

      setDone(true);
    } catch (error) {
      const message = error?.message || "حدث خطأ. يرجى المحاولة مرة أخرى.";
      showToast(message.includes("مكفول") ? "هذا اليتيم مكفول بالفعل. الرجاء اختيار يتيم آخر." : message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    authErrors,
    authFormData,
    authMode,
    bankName,
    countryCode,
    done,
    fileRef,
    handleAuthChange,
    handleLogin,
    handleOtpVerify,
    handlePhoneChange,
    handleRegister,
    handleResendOtp,
    handleSubmit,
    isAnonymous,
    isAuthLoading,
    otpRefs,
    otpSent,
    otpTimer,
    otpValues,
    paymentCategory,
    paymentMethod,
    phoneInputRef,
    planType,
    receipt,
    reference,
    setAuthMode,
    setBankName,
    setCountryCode,
    setIsAnonymous,
    setOtpValues,
    setPaymentCategory,
    setPaymentMethod,
    setPlanType,
    setReceipt,
    setReference,
    setShowConfirmPassword,
    setShowPassword,
    setStep,
    showConfirmPassword,
    showPassword,
    step,
    submitting,
  };
}
