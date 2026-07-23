import { useEffect, useRef, useState } from "react";
import {
  calculateDonationTotalAmount,
  createEmptyDonationOtpValues,
  createInitialDonationAuthFormData,
  createInitialDonationData,
  getDonationNextLabel,
  getDonationNextStep,
  getDonationOfflineSubmissionError,
  getDonationPreviousStep,
  getDonationSuccessReference,
  isDonationNextDisabled,
  resolveOfflinePaymentMethod,
  validateDonationLogin,
  validateDonationRegistration,
} from "./donationFlowController";

export function useDonationFlowController({
  countryCodeDefault = "+212",
  createDonation,
  generateUploadUrl,
  isAuthenticated,
  lang,
  login,
  loginWithPassword,
  navigate,
  projectId,
  registerUser,
  requestOTP,
  setPassword,
  showToast,
  startDonationCheckout,
  uploadReceiptMutation,
  user,
  validateEmail,
  validatePhoneByCountry,
  verifyOTP,
}) {
  const [step, setStep] = useState(isAuthenticated ? 1 : 0);
  const [isLoading, setIsLoading] = useState(false);
  const [donationData, setDonationData] = useState(() => createInitialDonationData(user));
  const [authMode, setAuthMode] = useState(null);
  const [authFormData, setAuthFormData] = useState(createInitialDonationAuthFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authErrors, setAuthErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(120);
  const [otpValues, setOtpValues] = useState(createEmptyDonationOtpValues);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const [countryCode, setCountryCode] = useState(countryCodeDefault);
  const phoneInputRef = useRef(null);
  const cursorPositionRef = useRef(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [donationReference, setDonationReference] = useState(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    if (isAuthenticated && step === 0) setStep(1);
  }, [isAuthenticated, step]);

  useEffect(() => {
    if (user) {
      setDonationData((previous) => ({
        ...previous,
        donorName: previous.donorName || user.name || "",
        donorPhone: previous.donorPhone || (user.phone || "").replace("+212", "").replace(/\s/g, ""),
        donorEmail: previous.donorEmail || user.email || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
    }
  }, [authFormData.phone]);

  const resetDonation = () => {
    setDonationData(createInitialDonationData(user));
    setAuthMode(null);
    setAuthFormData(createInitialDonationAuthFormData());
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAuthErrors({});
    setOtpSent(false);
    setOtpTimer(120);
    setOtpValues(createEmptyDonationOtpValues());
    setUploadedFile(null);
    setDragActive(false);
    setDonationReference(null);
    setAgreedTerms(false);
    setStep(isAuthenticated ? 1 : 0);
  };

  const handleAuthChange = (event) => {
    const { name, value } = event.target;
    setAuthFormData((previous) => ({ ...previous, [name]: value }));
    if (authErrors[name]) setAuthErrors((previous) => ({ ...previous, [name]: null }));
  };

  const handlePhoneChange = (event) => {
    const input = event.target;
    const cursorPosition = input.selectionStart;
    const previousValue = input.value;
    const rawValue = input.value.replace(/\D/g, "").slice(0, 10);
    const diff = previousValue.length - rawValue.length;
    cursorPositionRef.current = Math.max(0, cursorPosition - diff);
    setAuthFormData((previous) => ({ ...previous, phone: rawValue }));
    if (authErrors.phone) setAuthErrors((previous) => ({ ...previous, phone: null }));
  };

  const handleAuthModeSwitch = (mode) => {
    setAuthMode(mode);
    setAuthErrors({});
    if (otpSent) {
      setOtpSent(false);
      setOtpValues(createEmptyDonationOtpValues());
    }
    if (mode === "guest") setStep(1);
  };

  const handleLogin = async () => {
    const errors = validateDonationLogin({
      password: authFormData.password,
      phone: authFormData.phone,
      validatePhone: (phone) => validatePhoneByCountry(phone, countryCode),
    });
    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }
    setIsLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await loginWithPassword({ phoneNumber: fullPhone, password: authFormData.password });
      if (result.success && result.user) {
        login({
          id: result.user._id,
          name: result.user.fullName,
          phone: result.user.phoneNumber,
          email: result.user.email,
          preferredLanguage: result.user.preferredLanguage,
          isVerified: result.user.isVerified,
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
        showToast("حسابك غير مُفعّل. تم إرسال رمز التحقق مجدداً.", "info");
      } else {
        setAuthErrors({ password: result.message || "فشل تسجيل الدخول" });
        showToast(result.message || "Login failed", "error");
      }
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    const errors = validateDonationRegistration({
      formData: authFormData,
      validateEmail,
      validatePhone: (phone) => validatePhoneByCountry(phone, countryCode),
    });
    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }
    setIsLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await registerUser({
        fullName: authFormData.fullName,
        email: authFormData.email,
        phoneNumber: fullPhone,
        preferredLanguage: lang,
      });
      if (result.success) {
        if (result.userId) await setPassword({ userId: result.userId, password: authFormData.password });
        await requestOTP({ phoneNumber: fullPhone });
        setOtpSent(true);
        setOtpTimer(120);
        showToast("تم إرسال الرمز", "success");
      } else {
        setAuthErrors({ phone: result.message });
        showToast(result.message, "error");
      }
    } catch {
      showToast("خطأ في التسجيل", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpValues.every((value) => value.length === 1)) return;
    setIsLoading(true);
    try {
      const phoneNumber = `${countryCode}${authFormData.phone}`;
      const code = otpValues.join("");
      const result = await verifyOTP({ phoneNumber, code });
      if (!result.success) {
        showToast(result.message, "error");
        return;
      }
      login({
        id: result.userId,
        name: authFormData.fullName || "",
        phone: phoneNumber,
        email: authFormData.email || "",
        avatar: null,
      });
      setStep(1);
      showToast("تم إنشاء الحساب", "success");
    } catch {
      showToast("خطأ في التحقق", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDonation = async () => {
    const offlineSubmissionError = getDonationOfflineSubmissionError(uploadedFile);
    if (offlineSubmissionError) {
      showToast(offlineSubmissionError, "error");
      return;
    }
    setIsLoading(true);
    try {
      const donationId = await createDonation({
        userId: user?.userId || user?.id,
        projectId,
        amount: calculateDonationTotalAmount(donationData),
        paymentMethod: resolveOfflinePaymentMethod(donationData),
        coversFees: donationData.coverFees,
        isAnonymous: donationData.isAnonymous,
        message: donationData.dedication || donationData.message || "",
        bankName: donationData.bankName || "",
        transactionReference: donationData.transactionReference || "",
      });
      const uploadUrl = await generateUploadUrl({ purpose: "receipt", donationId });
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": uploadedFile.type },
        body: uploadedFile,
      });
      if (!uploadResponse.ok) throw new Error("Receipt upload failed");
      const { storageId } = await uploadResponse.json();
      await uploadReceiptMutation({ donationId, receiptUrl: storageId });
      setDonationReference(
        getDonationSuccessReference({
          donationId,
          transactionReference: donationData.transactionReference,
        }),
      );
      setStep(6);
      showToast("تم إرسال التبرع بنجاح", "success");
    } catch (error) {
      console.error("Donation error:", error);
      showToast("فشل إرسال التبرع", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhopCheckout = async () => {
    setIsLoading(true);
    try {
      const { purchaseUrl } = await startDonationCheckout({
        userId: user?.userId || user?.id,
        projectId,
        amount: calculateDonationTotalAmount(donationData),
        coversFees: donationData.coverFees,
        isAnonymous: donationData.isAnonymous,
        message: donationData.dedication || "",
      });
      window.location.href = purchaseUrl;
    } catch (error) {
      console.error("Whop checkout error:", error);
      setIsLoading(false);
      showToast("فشل إنشاء جلسة الدفع", "error");
    }
  };

  const handleBack = () => {
    if (step === 0) {
      navigate(-1);
      return;
    }
    setStep(getDonationPreviousStep({ step, donationData, isAuthenticated }));
  };

  const handleNext = async () => {
    if (step === 0) {
      if (authMode === "guest") {
        setStep(1);
        return;
      }
      if (authMode === "login") {
        if (otpSent) await handleOtpVerify();
        else await handleLogin();
        return;
      }
      if (authMode === "register") {
        if (otpSent) await handleOtpVerify();
        else await handleRegister();
        return;
      }
    }
    if (step === 5) {
      if (donationData.paymentMethod === "card") await handleWhopCheckout();
      else await handleSubmitDonation();
      return;
    }
    setStep(getDonationNextStep({ step, donationData, isAuthenticated }));
  };

  const isNextDisabled = () =>
    isDonationNextDisabled({
      agreedTerms,
      donationData,
      isAuthenticated,
      isLoading,
      step,
      uploadedFile,
    });

  const getNextCtaLabel = () =>
    getDonationNextLabel({ authMode, donationData, isLoading, otpSent, step });

  return {
    agreedTerms,
    authErrors,
    authFormData,
    authMode,
    countryCode,
    donationData,
    donationReference,
    dragActive,
    getNextCtaLabel,
    handleAuthChange,
    handleAuthModeSwitch,
    handleBack,
    handleNext,
    handlePhoneChange,
    isLoading,
    isNextDisabled,
    otpRefs,
    otpSent,
    otpTimer,
    otpValues,
    phoneInputRef,
    resetDonation,
    setAgreedTerms,
    setCountryCode,
    setDonationData,
    setDragActive,
    setOtpTimer,
    setOtpValues,
    setShowConfirmPassword,
    setShowPassword,
    setUploadedFile,
    setStep,
    showConfirmPassword,
    showPassword,
    step,
    uploadedFile,
  };
}
