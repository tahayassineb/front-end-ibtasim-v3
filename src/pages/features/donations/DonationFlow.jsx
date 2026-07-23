import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useApp } from "../../../context/AppContext";
import { convexFileUrl } from "../../../lib/convex";
import { formatPhoneForDisplay, validatePhoneByCountry } from "../../../components/countryCodeHelpers";
import { parseBankInfo, useViewportWidth, validateEmailAddress } from "./donationFlowHelpers";
import { calculateDonationTotal, getDonationProjectView } from "./donationFlowController";
import { DonationFlowFooter, DonationFlowShell } from "./DonationFlowLayout";
import { ProjectCtx, SegProgress, Step0Auth, TopBar } from "./DonationFlowParts";
import {
  Step1Amount,
  Step2Payment,
  Step3Receipt,
  Step4Info,
  Step5Review,
  Step6Success,
} from "./donationFlowSteps";
import { useDonationFlowController } from "./useDonationFlowController";

export default function DonationFlow() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, user, isAuthenticated, login, showToast } = useApp();

  const loginWithPassword = useMutation(api.auth.loginWithPassword);
  const registerUser = useMutation(api.auth.registerUser);
  const requestOTP = useMutation(api.auth.requestOTP);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const createDonation = useMutation(api.donations.createDonation);
  const uploadReceiptMutation = useMutation(api.donations.uploadReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const startDonationCheckout = useAction(api.payments.startDonationCheckout);
  const setPassword = useMutation(api.auth.setPassword);

  const convexProject = useQuery(api.projects.getProjectById, projectId ? { projectId } : "skip");
  const bankConfigRaw = useQuery(api.config.getConfig, { key: "bank_info" });
  const bankInfo = parseBankInfo(bankConfigRaw);

  const lang = currentLanguage?.code || "ar";
  const project = getDonationProjectView(convexProject, lang, convexFileUrl);

  const {
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
  } = useDonationFlowController({
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
    validateEmail: validateEmailAddress,
    validatePhoneByCountry,
    verifyOTP,
  });

  const amount = calculateDonationTotal(donationData);
  const vw = useViewportWidth();
  const containerMaxWidth = vw >= 1024 ? 720 : vw >= 640 ? 560 : 430;
  const isNarrow = vw < 560;
  const formatPhoneDisplay = (phone) => formatPhoneForDisplay(phone, countryCode);

  return (
    <DonationFlowShell containerMaxWidth={containerMaxWidth}>
      {step < 6 && <TopBar onBack={handleBack} />}
      {step < 6 && <SegProgress step={step} />}
      {step < 5 && project !== undefined && <ProjectCtx project={project} step={step} amount={amount} />}

      {step === 0 && (
        <Step0Auth
          authMode={authMode}
          setAuthMode={handleAuthModeSwitch}
          authFormData={authFormData}
          handleAuthChange={handleAuthChange}
          handlePhoneChange={handlePhoneChange}
          phoneInputRef={phoneInputRef}
          countryCode={countryCode}
          setCountryCode={setCountryCode}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          showConfirmPassword={showConfirmPassword}
          setShowConfirmPassword={setShowConfirmPassword}
          authErrors={authErrors}
          otpSent={otpSent}
          otpValues={otpValues}
          setOtpValues={setOtpValues}
          otpRefs={otpRefs}
          otpTimer={otpTimer}
          setOtpTimer={setOtpTimer}
          lang={lang}
          formatPhoneDisplay={formatPhoneDisplay}
          requestOTP={requestOTP}
          showToast={showToast}
          isNarrow={isNarrow}
        />
      )}
      {step === 1 && (
        <Step1Amount donationData={donationData} setDonationData={setDonationData} benefitCards={project?.benefitCards} />
      )}
      {step === 2 && (
        <Step2Payment
          donationData={donationData}
          setDonationData={setDonationData}
          bankInfo={bankInfo}
          showToast={showToast}
          lang={lang}
        />
      )}
      {step === 3 && (
        <Step3Receipt
          uploadedFile={uploadedFile}
          setUploadedFile={setUploadedFile}
          dragActive={dragActive}
          setDragActive={setDragActive}
          showToast={showToast}
          amount={amount}
          donationData={donationData}
          setDonationData={setDonationData}
        />
      )}
      {step === 4 && <Step4Info donationData={donationData} setDonationData={setDonationData} />}
      {step === 5 && (
        <Step5Review
          donationData={donationData}
          project={project}
          uploadedFile={uploadedFile}
          amount={amount}
          agreedTerms={agreedTerms}
          setAgreedTerms={setAgreedTerms}
          setStep={setStep}
        />
      )}
      {step === 6 && (
        <Step6Success
          donationReference={donationReference}
          project={project}
          navigate={navigate}
          resetDonation={resetDonation}
        />
      )}

      <DonationFlowFooter
        amount={amount}
        getNextCtaLabel={getNextCtaLabel}
        handleNext={handleNext}
        isLoading={isLoading}
        isNextDisabled={isNextDisabled}
        step={step}
      />
    </DonationFlowShell>
  );
}
