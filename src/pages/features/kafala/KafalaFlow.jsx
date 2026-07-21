import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useApp } from "../../../context/AppContext";
import { convexFileUrl } from "../../../lib/convex";
import { validatePhoneByCountry } from "../../../components/countryCodeHelpers";
import {
  KAFALA_COLORS as K,
  KAFALA_STEP_LABELS as STEP_LABELS,
  validateEmailAddress,
  validateReceiptFile,
} from "./kafalaFlowHelpers";
import {
  getKafalaDonorName,
  getKafalaPhotoUrl,
  getKafalaPriceSummary,
  parseKafalaBankInfo,
} from "./kafalaFlowController";
import { KafalaFlowShell } from "./KafalaFlowLayout";
import { createKafalaInputStyle } from "./kafalaFlowLayoutHelpers";
import KafalaAuthStep from "./KafalaAuthStep";
import {
  KafalaActionBar,
  KafalaContextCard,
  KafalaFlowHeader,
  KafalaLoadingState,
  KafalaMissingState,
  KafalaPaymentStep,
  KafalaPlanStep,
  KafalaReviewStep,
  KafalaSponsoredState,
  KafalaStepProgress,
  KafalaSuccessState,
} from "./kafalaFlowSteps";
import { useKafalaFlowController } from "./useKafalaFlowController";

export default function KafalaFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, showToast, user: appUser, isAuthenticated, login } = useApp();
  const lang = currentLanguage?.code || "ar";

  const loginWithPassword = useMutation(api.auth.loginWithPassword);
  const registerUser = useMutation(api.auth.registerUser);
  const requestOTP = useMutation(api.auth.requestOTP);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const setPasswordMut = useMutation(api.auth.setPassword);

  const createSponsorship = useMutation(api.kafala.createSponsorship);
  const cancelSponsorship = useMutation(api.kafala.cancelSponsorship);
  const uploadKafalaReceipt = useMutation(api.kafala.uploadKafalaReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const createCheckout = useAction(api.kafalaPayments.startKafalaCheckout);

  const kafalaData = useQuery(api.kafala.getKafalaById, { kafalaId: id });
  const bankInfoRaw = useQuery(api.config.getConfig, { key: "bank_info" });

  const bankInfo = React.useMemo(() => {
    return parseKafalaBankInfo(bankInfoRaw);
  }, [bankInfoRaw]);

  const validateEmail = validateEmailAddress;
  const validatePhone = (phone) => validatePhoneByCountry(phone, countryCode);
  const {
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
  } = useKafalaFlowController({
    appUser,
    cancelSponsorship,
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
  });

  if (kafalaData === undefined) {
    return <KafalaLoadingState colors={K} />;
  }

  if (!kafalaData) {
    return <KafalaMissingState />;
  }

  if (kafalaData.status === "sponsored") {
    return <KafalaSponsoredState colors={K} onBack={() => navigate("/kafala")} />;
  }

  if (done) {
    return <KafalaSuccessState colors={K} paymentMethod={paymentMethod} onHome={() => navigate("/")} />;
  }

  const kafala = kafalaData;
  const photoUrl = getKafalaPhotoUrl(kafala, convexFileUrl);
  const { annualPrice, priceMAD } = getKafalaPriceSummary(kafala);
  const isFemale = kafala.gender === "female";
  const donorName = getKafalaDonorName({ appUserName: appUser?.name, isAnonymous });
  const inputStyle = createKafalaInputStyle(K);

  return (
    <KafalaFlowShell colors={K}>
      <KafalaFlowHeader colors={K} id={id} navigate={navigate} step={step} setStep={setStep} />

      <KafalaStepProgress colors={K} labels={STEP_LABELS} step={step} />

      {step > 0 && <KafalaContextCard colors={K} kafala={kafala} photoUrl={photoUrl} priceMAD={priceMAD} />}

      <div style={{ flex: 1, padding: "0 16px 16px", overflowY: "auto" }}>
        {step === 0 && (
          <KafalaAuthStep
            authErrors={authErrors}
            authFormData={authFormData}
            authMode={authMode}
            colors={K}
            countryCode={countryCode}
            handleAuthChange={handleAuthChange}
            handlePhoneChange={handlePhoneChange}
            handleResendOtp={handleResendOtp}
            inputStyle={inputStyle}
            lang={lang}
            otpRefs={otpRefs}
            otpSent={otpSent}
            otpTimer={otpTimer}
            otpValues={otpValues}
            phoneInputRef={phoneInputRef}
            setAuthMode={setAuthMode}
            setCountryCode={setCountryCode}
            setOtpValues={setOtpValues}
            setShowConfirmPassword={setShowConfirmPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            showPassword={showPassword}
          />
        )}

        {step === 1 && (
          <KafalaPlanStep
            annualPrice={annualPrice}
            colors={K}
            kafalaName={kafala.name}
            planType={planType}
            priceMAD={priceMAD}
            setPlanType={setPlanType}
          />
        )}

        {step === 2 && (
          <KafalaPaymentStep
            bankInfo={bankInfo}
            colors={K}
            fileRef={fileRef}
            inputStyle={inputStyle}
            paymentCategory={paymentCategory}
            paymentMethod={paymentMethod}
            receipt={receipt}
            reference={reference}
            setBankName={setBankName}
            setPaymentCategory={setPaymentCategory}
            setPaymentMethod={setPaymentMethod}
            setReceipt={setReceipt}
            setReference={setReference}
            bankName={bankName}
            showToast={showToast}
            validateReceiptFile={validateReceiptFile}
          />
        )}

        {step === 3 && (
          <KafalaReviewStep
            colors={K}
            donorName={donorName}
            isAnonymous={isAnonymous}
            kafala={kafala}
            paymentMethod={paymentMethod}
            photoUrl={photoUrl}
            planType={planType}
            priceMAD={priceMAD}
            setIsAnonymous={setIsAnonymous}
          />
        )}
      </div>

      <KafalaActionBar
        authMode={authMode}
        colors={K}
        handleLogin={handleLogin}
        handleOtpVerify={handleOtpVerify}
        handleRegister={handleRegister}
        handleSubmit={handleSubmit}
        isAuthLoading={isAuthLoading}
        isFemale={isFemale}
        otpSent={otpSent}
        paymentMethod={paymentMethod}
        priceMAD={priceMAD}
        setStep={setStep}
        step={step}
        submitting={submitting}
      />
    </KafalaFlowShell>
  );
}
