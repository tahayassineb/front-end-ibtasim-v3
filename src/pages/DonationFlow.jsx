import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Badge from '../components/Badge';

// ============================================
// DONATION FLOW - 6 Step Wizard with Auth
// ============================================

const DONATION_AMOUNTS = [200, 500, 1000];

const MOCK_PROJECTS = {
  '1': {
    id: '1',
    title: 'Atlas Mountain Education',
    titleAr: 'تعليم جبال الأطلس',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
    category: 'Education',
    impact: {
      ar: 'توفير حقيبة مدرسية كاملة لطفل واحد في منطقة الأطلس العالي لمدة فصل دراسي كامل',
      fr: 'Fournir un kit scolaire complet pour un enfant dans la région du Haut Atlas pour un semestre entier',
      en: 'Provide a complete school kit for one child in the High Atlas region for an entire semester',
    },
  },
  '2': {
    id: '2',
    title: 'Clean Water Initiative',
    titleAr: 'مبادرة المياه النظيفة',
    image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800',
    category: 'Water',
    impact: {
      ar: 'توفير مياه نظيفة لأسرة لمدة شهر',
      fr: 'Fournir de l\'eau potable à une famille pendant un mois',
      en: 'Provide clean water to a family for a month',
    },
  },
};

const BANK_INFO = {
  name: 'جمعية الأمل المغربية (Association Espoir)',
  rib: '007 780 001234567890 12',
  bank: 'Attijariwafa Bank',
};

// Translations
const translations = {
  ar: {
    // Auth Step
    welcome: 'مرحباً بك',
    continueAsGuest: 'المتابعة كزائر',
    haveAccount: 'لديك حساب؟',
    noAccount: 'ليس لديك حساب؟',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    enterOtp: 'أدخل رمز التحقق',
    otpSent: 'تم إرسال رمز التحقق إلى',
    verify: 'تحقق',
    resendCode: 'إعادة إرسال الرمز',
    or: 'أو',
    continueToDonation: 'المتابعة للتبرع',
    
    // Step 1 - Amount
    makeDonation: 'التبرع',
    activeCampaign: 'حملة نشطة',
    donationFrequency: 'تكرار التبرع',
    once: 'مرة واحدة',
    monthly: 'شهري',
    selectAmount: 'اختر المبلغ (MAD)',
    customAmount: 'مبلغ مخصص',
    coverFees: 'أرغب في تغطية رسوم المعاملة (2%)',
    yourImpact: 'تأثيرك',
    totalDonation: 'إجمالي التبرع',
    billingDetails: 'بيانات الفوترة',
    continue: 'متابعة',
    secureTransaction: 'معاملة مشفرة 256-bit',
    
    // Step 3 - Payment Methods
    selectPayment: 'اختر طريقة الدفع',
    bankTransfer: 'تحويل بنكي',
    bankTransferDesc: 'CIH, BMCE, Attijari',
    creditCard: 'بطاقة بنكية',
    creditCardDesc: 'Visa, Mastercard, CMI',
    cash: 'نقدي عبر الوكالة',
    cashDesc: 'Wafacash, Cash Plus',
    cmi: 'CMI',
    cmiDesc: 'الدفع الإلكتروني',
    paymentInfo: 'اختر وسيلة الدفع المناسبة لك. سيتم توجيهك لإتمام العملية.',
    
    // Step 4 - Receipt Upload
    receiptUpload: 'رفع الإيصال',
    step5of5: 'الخطوة 5 من 5',
    bankInfo: 'معلومات الحساب البنكي',
    accountHolder: 'اسم صاحب الحساب',
    rib: 'رقم الحساب (RIB)',
    copy: 'نسخ',
    uploadReceipt: 'تحميل إيصال التحويل',
    uploadDesc: 'ارفع صورة الإيصال أو قم بسحب الملف هنا',
    selectFile: 'اختر ملف',
    supportedFormats: 'JPG, PNG, PDF (أقصى 5MB)',
    verifyClarity: 'تأكد من وضوح البيانات',
    clarityDesc: 'يجب أن يكون رقم العملية والمبلغ وتاريخ التحويل ظاهرين بشكل كامل',
    submitDonation: 'إرسال التبرع',
    
    // Step 5 - Success
    success: 'تم بنجاح',
    thankYou: 'شكراً لك!',
    thankYouEn: 'Thank you!',
    donationRef: 'رقم مرجع التبرع',
    verificationNotice: 'سنقوم بالتحقق من التبرع وإرسال تأكيد عبر واتساب',
    shareGoodness: 'انشر الخير مع أصدقائك',
    whatsapp: 'واتساب',
    facebook: 'فيسبوك',
    returnHome: 'العودة للرئيسية',
    
    // Common
    back: 'رجوع',
    next: 'التالي',
    processingFee: 'رسوم المعالجة',
  },
  fr: {
    // Auth Step
    welcome: 'Bienvenue',
    continueAsGuest: 'Continuer en invité',
    haveAccount: 'Vous avez un compte?',
    noAccount: 'Vous n\'avez pas de compte?',
    login: 'Connexion',
    register: 'Inscription',
    fullName: 'Nom complet',
    email: 'Adresse email',
    phone: 'Numéro de téléphone',
    password: 'Mot de passe',
    confirmPassword: 'Confirmer le mot de passe',
    enterOtp: 'Entrez le code',
    otpSent: 'Un code a été envoyé à',
    verify: 'Vérifier',
    resendCode: 'Renvoyer le code',
    or: 'ou',
    continueToDonation: 'Continuer vers le don',
    
    // Step 1 - Amount
    makeDonation: 'Faire un don',
    activeCampaign: 'Campagne active',
    donationFrequency: 'Fréquence du don',
    once: 'Une fois',
    monthly: 'Mensuel',
    selectAmount: 'Sélectionnez le montant (MAD)',
    customAmount: 'Montant personnalisé',
    coverFees: 'Je souhaite couvrir les frais de transaction (2%)',
    yourImpact: 'Votre impact',
    totalDonation: 'Don total',
    billingDetails: 'Détails de facturation',
    continue: 'Continuer',
    secureTransaction: 'Transaction sécurisée 256-bit',
    
    // Step 3 - Payment Methods
    selectPayment: 'Choisir un mode de paiement',
    bankTransfer: 'Virement bancaire',
    bankTransferDesc: 'CIH, BMCE, Attijari',
    creditCard: 'Carte bancaire',
    creditCardDesc: 'Visa, Mastercard, CMI',
    cash: 'Espèces via agence',
    cashDesc: 'Wafacash, Cash Plus',
    cmi: 'CMI',
    cmiDesc: 'Paiement en ligne',
    paymentInfo: 'Choisissez votre méthode de paiement. Vous serez redirigé pour finaliser.',
    
    // Step 4 - Receipt Upload
    receiptUpload: 'Télécharger le reçu',
    step5of5: 'Étape 5 sur 5',
    bankInfo: 'Informations bancaires',
    accountHolder: 'Titulaire du compte',
    rib: 'Numéro de compte (RIB)',
    copy: 'Copier',
    uploadReceipt: 'Télécharger le reçu',
    uploadDesc: 'Glissez-déposez votre reçu ou cliquez pour sélectionner',
    selectFile: 'Choisir un fichier',
    supportedFormats: 'JPG, PNG, PDF (max 5MB)',
    verifyClarity: 'Assurez la lisibilité',
    clarityDesc: 'Le numéro de transaction, le montant et la date doivent être visibles',
    submitDonation: 'Valider le don',
    
    // Step 5 - Success
    success: 'Succès',
    thankYou: 'Merci!',
    thankYouEn: 'Thank you!',
    donationRef: 'Référence du don',
    verificationNotice: 'Nous vérifierons votre don et enverrons une confirmation par WhatsApp',
    shareGoodness: 'Partagez avec vos amis',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    returnHome: 'Retour à l\'accueil',
    
    // Common
    back: 'Retour',
    next: 'Suivant',
    processingFee: 'Frais de traitement',
  },
  en: {
    // Auth Step
    welcome: 'Welcome',
    continueAsGuest: 'Continue as Guest',
    haveAccount: 'Have an account?',
    noAccount: 'Don\'t have an account?',
    login: 'Login',
    register: 'Register',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    enterOtp: 'Enter Verification Code',
    otpSent: 'A code has been sent to',
    verify: 'Verify',
    resendCode: 'Resend Code',
    or: 'or',
    continueToDonation: 'Continue to Donation',
    
    // Step 1 - Amount
    makeDonation: 'Make a Donation',
    activeCampaign: 'Active Campaign',
    donationFrequency: 'Donation Frequency',
    once: 'One-time',
    monthly: 'Monthly',
    selectAmount: 'Select Amount (MAD)',
    customAmount: 'Custom Amount',
    coverFees: 'I want to cover transaction fees (2%)',
    yourImpact: 'Your Impact',
    totalDonation: 'Total Donation',
    billingDetails: 'Billing Details',
    continue: 'Continue',
    secureTransaction: 'Secure 256-bit encrypted transaction',
    
    // Step 3 - Payment Methods
    selectPayment: 'Select Payment Method',
    bankTransfer: 'Bank Transfer',
    bankTransferDesc: 'CIH, BMCE, Attijari',
    creditCard: 'Credit Card',
    creditCardDesc: 'Visa, Mastercard, CMI',
    cash: 'Cash via Agency',
    cashDesc: 'Wafacash, Cash Plus',
    cmi: 'CMI',
    cmiDesc: 'Online Payment',
    paymentInfo: 'Choose your preferred payment method. You will be redirected to complete.',
    
    // Step 4 - Receipt Upload
    receiptUpload: 'Upload Receipt',
    step5of5: 'Step 5 of 5',
    bankInfo: 'Bank Account Information',
    accountHolder: 'Account Holder',
    rib: 'Account Number (RIB)',
    copy: 'Copy',
    uploadReceipt: 'Upload Transfer Receipt',
    uploadDesc: 'Drag and drop your receipt or click to browse',
    selectFile: 'Select File',
    supportedFormats: 'JPG, PNG, PDF (max 5MB)',
    verifyClarity: 'Ensure clarity',
    clarityDesc: 'Transaction number, amount and date must be clearly visible',
    submitDonation: 'Submit Donation',
    
    // Step 5 - Success
    success: 'Success',
    thankYou: 'Thank you!',
    thankYouEn: 'Thank you!',
    donationRef: 'Donation Reference',
    verificationNotice: 'We will verify your donation and send confirmation via WhatsApp',
    shareGoodness: 'Share with friends',
    whatsapp: 'WhatsApp',
    facebook: 'Facebook',
    returnHome: 'Return Home',
    
    // Common
    back: 'Back',
    next: 'Next',
    processingFee: 'Processing fee',
  },
};

// ============================================
// STEP COMPONENTS
// ============================================

// Step 0: Authentication
const Step0Auth = ({
  tx,
  lang,
  authMode,
  authFormData,
  authErrors,
  otpSent,
  otpValues,
  otpRefs,
  otpTimer,
  phoneInputRef,
  showPassword,
  showConfirmPassword,
  handleAuthChange,
  handlePhoneChange,
  formatPhoneDisplay,
  setAuthMode,
  setOtpValues,
  setOtpTimer,
  setStep,
  setShowPassword,
  setShowConfirmPassword,
}) => {
  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };
  
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSent, otpTimer, setOtpTimer]);
  
  if (otpSent) {
    return (
      <div className="flex-1 flex flex-col items-center px-6 pt-10 pb-8">
        <div className="mb-8 p-4 bg-primary/10 rounded-full">
          <span className="material-symbols-outlined text-primary text-5xl">phonelink_ring</span>
        </div>
        
        <h1 className="text-gray-900 dark:text-white text-2xl font-bold text-center pb-3">
          {tx.enterOtp}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base text-center max-w-xs">
          {tx.otpSent} <span className="font-bold text-primary" dir="ltr">+212 {formatPhoneDisplay(authFormData.phone)}</span>
        </p>
        
        <div className="mt-10 w-full max-w-sm">
          <fieldset className="flex justify-between gap-2 sm:gap-4" dir="ltr">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={otpRefs[index]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={otpValues[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="flex h-14 w-12 sm:w-14 text-center text-xl font-bold bg-white dark:bg-gray-800 border-0 rounded-xl shadow-lg shadow-primary/5 focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
                placeholder="-"
              />
            ))}
          </fieldset>
        </div>
        
        <div className="mt-10 flex flex-col items-center gap-4">
          {otpTimer > 0 ? (
            <div className="flex items-center gap-3 py-2 px-6 bg-primary/5 dark:bg-primary/10 rounded-full border border-primary/10">
              <span className="material-symbols-outlined text-primary text-sm">schedule</span>
              <p className="text-primary text-sm font-bold tracking-widest" dir="ltr">
                {formatTime(otpTimer)}
              </p>
            </div>
          ) : (
            <button
              onClick={() => setOtpTimer(120)}
              className="text-primary font-bold hover:underline"
            >
              {tx.resendCode}
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
      <h1 className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-2">
        {tx.welcome}
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8">
        {lang === 'ar' ? 'سجل الدخول أو أنشئ حساباً للمتابعة' : lang === 'fr' ? 'Connectez-vous ou créez un compte pour continuer' : 'Login or create an account to continue'}
      </p>
      
      {/* Auth Mode Toggle */}
      <div className="flex h-12 items-center justify-center rounded-xl bg-gray-200/50 dark:bg-white/10 p-1 mb-6">
        <button
          onClick={() => setAuthMode('login')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            authMode === 'login'
              ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {tx.login}
        </button>
        <button
          onClick={() => setAuthMode('register')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            authMode === 'register'
              ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {tx.register}
        </button>
      </div>
      
      {/* Form */}
      <div className="space-y-4 flex-1">
        {authMode === 'register' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tx.fullName}</label>
              <input
                type="text"
                name="fullName"
                value={authFormData.fullName}
                onChange={handleAuthChange}
                placeholder="John Doe"
                className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              />
              {authErrors.fullName && <p className="text-error text-xs mt-1">{authErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tx.email}</label>
              <input
                type="email"
                name="email"
                value={authFormData.email}
                onChange={handleAuthChange}
                placeholder="example@mail.com"
                className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              />
              {authErrors.email && <p className="text-error text-xs mt-1">{authErrors.email}</p>}
            </div>
          </>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tx.phone}</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+212</span>
            <input
              ref={phoneInputRef}
              type="tel"
              name="phone"
              value={authFormData.phone}
              onChange={handlePhoneChange}
              placeholder="6XXXXXXXX"
              maxLength={10}
              className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-16 pr-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              dir="ltr"
              inputMode="numeric"
              pattern="[0-9]*"
            />
          </div>
          {authErrors.phone && <p className="text-error text-xs mt-1">{authErrors.phone}</p>}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tx.password}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={authFormData.password}
              onChange={handleAuthChange}
              placeholder="••••••••"
              className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 pr-12 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          {authErrors.password && <p className="text-error text-xs mt-1">{authErrors.password}</p>}
        </div>
        
        {authMode === 'register' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{tx.confirmPassword}</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={authFormData.confirmPassword}
                onChange={handleAuthChange}
                placeholder="••••••••"
                className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 pr-12 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {authErrors.confirmPassword && <p className="text-error text-xs mt-1">{authErrors.confirmPassword}</p>}
          </div>
        )}
      </div>
      
      {/* Continue as Guest */}
      <button
        onClick={() => setStep(1)}
        className="mt-6 text-primary text-sm font-medium hover:underline"
      >
        {tx.continueAsGuest}
      </button>
    </div>
  );
};

// Step 1: Amount Selection
const Step1Amount = ({ tx, lang, project, donationData, setDonationData, formatCurrency, calculateTotal }) => (
  <div className="pb-24">
    {/* Project Hero */}
    <div className="px-4 py-3">
      <div 
        className="bg-cover bg-center flex flex-col justify-end overflow-hidden rounded-xl min-h-[200px] relative shadow-sm"
        style={{ 
          backgroundImage: `linear-gradient(0deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0) 50%), url(${project.image})` 
        }}
      >
        <div className="flex flex-col p-4">
          <span className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
            {tx.activeCampaign}
          </span>
          <p className="text-white tracking-tight text-2xl font-bold leading-tight">
            {lang === 'ar' ? project.titleAr : project.title}
          </p>
        </div>
      </div>
    </div>
    
    {/* Frequency */}
    <div className="px-4 pt-4">
      <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight tracking-tight mb-3">
        {tx.donationFrequency}
      </h3>
      <div className="flex h-12 items-center justify-center rounded-xl bg-gray-200/50 dark:bg-white/10 p-1">
        {['once', 'monthly'].map((freq) => (
          <label
            key={freq}
            className={`
              flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2
              transition-all text-sm font-semibold
              ${donationData.frequency === freq 
                ? 'bg-white dark:bg-primary shadow-sm text-primary dark:text-white' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }
            `}
          >
            <span className="truncate">
              {freq === 'once' ? tx.once : tx.monthly}
            </span>
            <input
              type="radio"
              name="frequency"
              value={freq}
              checked={donationData.frequency === freq}
              onChange={() => setDonationData(prev => ({ ...prev, frequency: freq }))}
              className="hidden"
            />
          </label>
        ))}
      </div>
    </div>
    
    {/* Amount Selection */}
    <div className="px-4 pt-6">
      <h3 className="text-gray-900 dark:text-white text-base font-bold leading-tight tracking-tight mb-3">
        {tx.selectAmount}
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {DONATION_AMOUNTS.map((amt) => (
          <button
            key={amt}
            onClick={() => setDonationData(prev => ({ ...prev, amount: amt, customAmount: '' }))}
            className={`
              flex flex-col items-center justify-center py-4 rounded-xl border-2 font-bold transition-all
              ${donationData.amount === amt && !donationData.customAmount
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:border-primary/30'
              }
            `}
          >
            <span className="text-lg">{amt}</span>
            <span className="text-[10px] opacity-70 uppercase">MAD</span>
          </button>
        ))}
      </div>
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          value={donationData.customAmount}
          onChange={(e) => {
            const value = e.target.value;
            // Only allow numeric input
            if (value === '' || /^\d*$/.test(value)) {
              setDonationData(prev => ({
                ...prev,
                customAmount: value,
                amount: 0
              }));
            }
          }}
          placeholder={tx.customAmount}
          className="w-full h-14 bg-white dark:bg-white/5 border-none rounded-xl px-4 text-base font-medium focus:ring-2 focus:ring-primary placeholder:text-gray-400 dark:text-white [appearance:textfield]"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
          MAD
        </span>
      </div>
    </div>
    
    
    {/* Summary Card */}
    <div className="px-4 pt-8">
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border border-white/30 dark:border-white/10 rounded-xl p-6 shadow-xl shadow-primary/5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
              {tx.yourImpact}
            </p>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white">
              {lang === 'ar' ? project.impact.ar : lang === 'fr' ? project.impact.fr : project.impact.en}
            </h4>
          </div>
          <div className="bg-primary/10 p-2 rounded-lg">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
          </div>
        </div>
        <hr className="border-gray-200 dark:border-white/10 mb-4"/>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{tx.totalDonation}</span>
          <span className="text-xl font-bold text-primary">
            {formatCurrency(calculateTotal())}
          </span>
        </div>
      </div>
    </div>
  </div>
);

// Step 2: Payment Methods
const Step2PaymentMethods = ({ tx, isRTL, donationData, setDonationData }) => {
  const paymentMethods = [
    { id: 'bank', icon: 'account_balance', title: tx.bankTransfer, desc: tx.bankTransferDesc },
    { id: 'card', icon: 'credit_card', title: tx.creditCard, desc: tx.creditCardDesc },
    { id: 'cash', icon: 'payments', title: tx.cash, desc: tx.cashDesc },
    { id: 'cmi', icon: 'security', title: tx.cmi, desc: tx.cmiDesc },
  ];
  
  return (
    <div className="px-6 flex-1 pb-8">
      <h3 className="text-gray-900 dark:text-white text-2xl font-bold leading-tight pb-6">
        {tx.selectPayment}
      </h3>
      
      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => setDonationData(prev => ({ ...prev, paymentMethod: method.id }))}
            className={`
              w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-right
              ${donationData.paymentMethod === method.id
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }
            `}
          >
            <div className={`
              flex items-center justify-center rounded-lg shrink-0 size-12
              ${donationData.paymentMethod === method.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}
            `}>
              <span className="material-symbols-outlined text-2xl">{method.icon}</span>
            </div>
            <div className="flex flex-col grow text-right">
              <p className={`text-base font-bold leading-normal ${donationData.paymentMethod === method.id ? 'text-primary' : 'text-gray-900 dark:text-white'}`}>
                {method.title}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal">
                {method.desc}
              </p>
            </div>
            <div className="text-gray-300">
              <span className="material-symbols-outlined">
                {isRTL ? 'chevron_left' : 'chevron_right'}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-dashed border-primary/30">
        <div className="flex gap-3">
          <span className="material-symbols-outlined text-primary">info</span>
          <p className="text-sm text-gray-900 dark:text-gray-300 leading-relaxed">
            {tx.paymentInfo}
          </p>
        </div>
      </div>
    </div>
  );
};

// Step 3: Receipt Upload
const Step3ReceiptUpload = ({
  tx,
  lang,
  uploadedFile,
  setUploadedFile,
  dragActive,
  setDragActive,
  showToast,
}) => {
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === 'ar' ? 'الملف كبير جداً' : lang === 'fr' ? 'Fichier trop grand' : 'File too large', 'error');
      return;
    }
    setUploadedFile(file);
  };
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast(lang === 'ar' ? 'تم النسخ' : lang === 'fr' ? 'Copié' : 'Copied', 'success');
  };
  
  return (
    <main className="flex flex-col flex-1 px-6 gap-6 pb-10">
      {/* Bank Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-xl shadow-primary/5 overflow-hidden">
        <div className="bg-primary px-5 py-3 flex items-center justify-between">
          <span className="text-white text-sm font-bold">{tx.bankInfo}</span>
          <span className="material-symbols-outlined text-white/80 text-lg">account_balance</span>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {tx.accountHolder}
            </label>
            <button
              onClick={() => copyToClipboard(BANK_INFO.name)}
              className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 p-3 rounded-xl border border-primary/5 transition-all active:scale-[0.98] text-right w-full"
            >
              <span className="text-gray-800 dark:text-white font-bold text-[15px] leading-tight flex-1">
                {BANK_INFO.name}
              </span>
              <span className="material-symbols-outlined text-primary/60 text-[18px] mr-2">content_copy</span>
            </button>
          </div>
          <div className="h-px bg-gray-100 w-full"></div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {tx.rib}
            </label>
            <div className="flex items-center justify-between bg-primary/10 dark:bg-primary/20 p-3 rounded-xl border border-primary/10">
              <span className="text-primary font-mono font-bold text-lg tracking-wider" dir="ltr">
                {BANK_INFO.rib}
              </span>
              <button
                onClick={() => copyToClipboard(BANK_INFO.rib.replace(/\s/g, ''))}
                className="flex items-center justify-center w-9 h-9 bg-primary text-white rounded-lg transition-all active:scale-95 shadow-md"
              >
                <span className="material-symbols-outlined text-[20px]">content_copy</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Upload Area */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-bold text-gray-700 dark:text-white px-1">
          {tx.uploadReceipt}
        </label>
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 transition-all
            ${dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-gray-300 bg-primary/5 hover:border-primary/50'
            }
            ${uploadedFile ? 'bg-success/5 border-success' : ''}
          `}
        >
          {uploadedFile ? (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-gray-800 dark:text-white text-base font-bold">
                  {uploadedFile.name}
                </p>
                <p className="text-gray-500 text-sm">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-error text-sm font-medium hover:underline"
              >
                {lang === 'ar' ? 'إزالة' : lang === 'fr' ? 'Supprimer' : 'Remove'}
              </button>
            </>
          ) : (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm text-primary">
                <span className="material-symbols-outlined text-3xl">upload_file</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-center">
                <p className="text-gray-800 dark:text-white text-base font-bold">
                  {lang === 'ar' ? 'ارفع صورة الإيصال' : lang === 'fr' ? 'Télécharger le reçu' : 'Upload receipt image'}
                </p>
                <p className="text-gray-500 text-[13px]">
                  {tx.uploadDesc}
                </p>
              </div>
              <label className="flex min-w-[140px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-11 px-6 bg-primary text-white text-sm font-bold transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
                <span>{tx.selectFile}</span>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
              <div className="flex items-center gap-2 px-3 py-1 bg-white/80 rounded-full border border-gray-100">
                <span className="material-symbols-outlined text-[14px] text-gray-400">info</span>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  {tx.supportedFormats}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Verification Notice */}
      <div className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <span className="material-symbols-outlined text-[18px]">verified_user</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <h4 className="text-[13px] font-bold text-gray-800 dark:text-white">{tx.verifyClarity}</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {tx.clarityDesc}
          </p>
        </div>
      </div>
    </main>
  );
};

// Step 4: Success
const Step4Success = ({ tx, lang, project }) => {
  const donationRef = `REF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const handleShare = (platform) => {
    const text = lang === 'ar' 
      ? `تبرعت لجمعية الأمل! انضم إلي في دعم ${project.titleAr}`
      : lang === 'fr'
      ? `J'ai fait un don à Association Espoir! Rejoignez-moi pour soutenir ${project.title}`
      : `I donated to Association Espoir! Join me in supporting ${project.title}`;
    
    const url = window.location.origin;
    
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }
  };
  
  return (
    <div className="flex-1 flex flex-col items-center px-6 pt-8 pb-12">
      {/* Success Icon */}
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl scale-150"></div>
        <div className="relative bg-primary size-24 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
          <span className="material-symbols-outlined text-white text-5xl font-bold">check</span>
        </div>
      </div>
      
      {/* Thank You */}
      <div className="text-center mb-8">
        <h1 className="text-gray-900 dark:text-white text-4xl font-bold mb-2 tracking-tight">
          {tx.thankYou}
        </h1>
        <p className="text-gray-500 text-2xl font-medium">{tx.thankYouEn}</p>
      </div>
      
      {/* Reference Card */}
      <div className="w-full bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 mb-8 text-center border border-primary/10">
        <p className="text-primary font-bold text-xs uppercase tracking-widest mb-2">
          {tx.donationRef}
        </p>
        <p className="text-gray-900 dark:text-white text-2xl font-bold tracking-wider" dir="ltr">
          #{donationRef}
        </p>
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
            {tx.verificationNotice}
          </p>
        </div>
      </div>
      
      {/* Share Buttons */}
      <div className="w-full mb-10">
        <p className="text-center text-gray-500 text-sm mb-4">{tx.shareGoodness}</p>
        <div className="flex gap-4">
          <button
            onClick={() => handleShare('whatsapp')}
            className="flex-1 bg-[#25D366] hover:brightness-95 transition-all py-4 rounded-xl flex items-center justify-center gap-2 text-white shadow-lg shadow-green-200/50 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">share</span>
            <span className="font-bold">{tx.whatsapp}</span>
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="flex-1 bg-[#1877F2] hover:brightness-95 transition-all py-4 rounded-xl flex items-center justify-center gap-2 text-white shadow-lg shadow-blue-200/50 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">notes</span>
            <span className="font-bold">{tx.facebook}</span>
          </button>
        </div>
      </div>
      
      {/* Image */}
      <div className="w-full rounded-2xl overflow-hidden mb-8 h-40 relative shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10"></div>
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 right-4 z-20 text-white font-bold text-xs bg-primary px-3 py-1.5 rounded-full shadow-lg">
          Association Espoir
        </div>
      </div>
    </div>
  );
};

// Progress Indicator Component
const ProgressIndicator = ({ step }) => {
  // Adjust steps for display (skip auth step in progress indicator)
  const displayStep = step === 0 ? 0 : step;
  
  return (
    <div className="flex w-full flex-row items-center justify-center gap-2 py-4">
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          className={`
            h-1.5 rounded-full transition-all
            ${s <= displayStep ? 'bg-primary w-6' : 'bg-primary/20 dark:bg-primary/10 w-3'}
          `}
        />
      ))}
    </div>
  );
};

// Header Component
const Header = ({ step, tx, isRTL, isAuthenticated, navigate, setStep }) => {
  const titles = [
    tx.welcome,
    tx.makeDonation,
    tx.selectPayment,
    tx.receiptUpload,
    tx.success,
  ];
  
  if (step === 4) return null;
  
  return (
    <div className="flex items-center p-4 pb-2 justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
      <button
        onClick={() => {
          if (step === 0) {
            navigate(-1);
          } else if (step === 1 && !isAuthenticated) {
            setStep(0); // Go back to auth
          } else {
            setStep(prev => prev - 1);
          }
        }}
        className="text-gray-900 dark:text-white flex size-10 shrink-0 items-center justify-center cursor-pointer active:scale-90 transition-transform"
      >
        <span className="material-symbols-outlined">
          {isRTL ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
      <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight flex-1 text-center mr-[-40px]">
        {titles[step]}
      </h2>
      <div className="size-10"></div>
    </div>
  );
};

// ============================================
// MAIN DONATION FLOW COMPONENT
// ============================================

const DonationFlow = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { 
    t, 
    currentLanguage, 
    user, 
    isAuthenticated,
    login,
    donationState, 
    updateDonation, 
    resetDonation, 
    nextDonationStep, 
    prevDonationStep,
    showToast,
    formatCurrency,
  } = useApp();
  
  // Determine initial step based on auth status
  const getInitialStep = () => {
    if (!isAuthenticated) return 0; // Auth step
    return donationState.step || 1;
  };
  
  const [step, setStep] = useState(getInitialStep());
  const [isLoading, setIsLoading] = useState(false);
  const [otpTimer, setOtpTimer] = useState(120);
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Auth state
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authFormData, setAuthFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authErrors, setAuthErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  
  const isRTL = currentLanguage.dir === 'rtl';
  const lang = currentLanguage.code;
  
  // Get project data
  const project = MOCK_PROJECTS[projectId] || MOCK_PROJECTS['1'];
  
  // Donation state
  const [donationData, setDonationData] = useState({
    amount: donationState.amount || 200,
    customAmount: '',
    frequency: donationState.frequency || 'once',
    phoneNumber: user?.phone?.replace('+212 ', '') || '',
    paymentMethod: donationState.paymentMethod || null,
    receipt: null,
  });
  
  const tx = translations[lang] || translations.en;
  
  // Calculate total
  const calculateTotal = () => {
    const baseAmount = donationData.customAmount
      ? parseFloat(donationData.customAmount) || 0
      : donationData.amount;
    return baseAmount;
  };
  
  // Validation functions
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 && (cleaned.startsWith('06') || cleaned.startsWith('07') || cleaned.startsWith('05'));
  };
  
  // Handle auth form changes
  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthFormData(prev => ({ ...prev, [name]: value }));
    if (authErrors[name]) setAuthErrors(prev => ({ ...prev, [name]: null }));
  };
  
  // Handle phone input with proper cursor position management
  const phoneInputRef = useRef(null);
  const cursorPositionRef = useRef(0);
  
  const handlePhoneChange = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const previousValue = input.value;
    
    // Get only digits and limit to 10
    const rawValue = input.value.replace(/\D/g, '').slice(0, 10);
    
    // Save cursor position before React updates
    const diff = previousValue.length - rawValue.length;
    cursorPositionRef.current = Math.max(0, cursorPosition - diff);
    
    // Update state
    setAuthFormData(prev => ({ ...prev, phone: rawValue }));
    if (authErrors.phone) setAuthErrors(prev => ({ ...prev, phone: null }));
  };
  
  // Restore cursor position after render
  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
    }
  }, [authFormData.phone]);
  
  // Format phone for display
  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    if (phone.length <= 2) return phone;
    if (phone.length <= 5) return `${phone.slice(0, 2)} ${phone.slice(2)}`;
    if (phone.length <= 8) return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
    return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
  };
  
  // Handle login submission
  const handleLogin = async () => {
    const errors = {};
    if (!validatePhone(authFormData.phone)) {
      errors.phone = lang === 'ar' ? 'رقم هاتف غير صحيح' : lang === 'fr' ? 'Numéro invalide' : 'Invalid phone number';
    }
    if (!authFormData.password || authFormData.password.length < 6) {
      errors.password = lang === 'ar' ? 'كلمة المرور مطلوبة' : lang === 'fr' ? 'Mot de passe requis' : 'Password required';
    }
    
    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo login
    const userData = {
      id: 'user_' + Date.now(),
      name: 'Demo User',
      phone: '+212 ' + formatPhoneDisplay(authFormData.phone),
      email: 'demo@example.com',
      avatar: null,
    };
    
    login(userData);
    setIsLoading(false);
    setStep(1); // Go to amount selection
    showToast(lang === 'ar' ? 'تم تسجيل الدخول' : lang === 'fr' ? 'Connecté' : 'Logged in', 'success');
  };
  
  // Handle register submission
  const handleRegister = async () => {
    const errors = {};
    if (!authFormData.fullName.trim()) {
      errors.fullName = lang === 'ar' ? 'الاسم مطلوب' : lang === 'fr' ? 'Nom requis' : 'Name required';
    }
    if (!validateEmail(authFormData.email)) {
      errors.email = lang === 'ar' ? 'بريد غير صحيح' : lang === 'fr' ? 'Email invalide' : 'Invalid email';
    }
    if (!validatePhone(authFormData.phone)) {
      errors.phone = lang === 'ar' ? 'رقم هاتف غير صحيح' : lang === 'fr' ? 'Numéro invalide' : 'Invalid phone number';
    }
    if (!authFormData.password || authFormData.password.length < 6) {
      errors.password = lang === 'ar' ? '6 أحرف على الأقل' : lang === 'fr' ? '6 caractères minimum' : '6 characters minimum';
    }
    if (authFormData.password !== authFormData.confirmPassword) {
      errors.confirmPassword = lang === 'ar' ? 'كلمات المرور غير متطابقة' : lang === 'fr' ? 'Mots de passe différents' : 'Passwords do not match';
    }
    
    if (Object.keys(errors).length > 0) {
      setAuthErrors(errors);
      return;
    }
    
    // Send OTP
    setOtpSent(true);
    setOtpTimer(120);
    showToast(lang === 'ar' ? 'تم إرسال الرمز' : lang === 'fr' ? 'Code envoyé' : 'Code sent', 'success');
  };
  
  // Handle OTP verification
  const handleOtpVerify = async () => {
    const isOtpComplete = otpValues.every(v => v.length === 1);
    if (!isOtpComplete) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo register and login
    const userData = {
      id: 'user_' + Date.now(),
      name: authFormData.fullName,
      phone: '+212 ' + formatPhoneDisplay(authFormData.phone),
      email: authFormData.email,
      avatar: null,
    };
    
    login(userData);
    setIsLoading(false);
    setStep(1); // Go to amount selection
    showToast(lang === 'ar' ? 'تم إنشاء الحساب' : lang === 'fr' ? 'Compte créé' : 'Account created', 'success');
  };
  
  // Bottom Action
  const BottomAction = () => {
    if (step === 4) {
      return (
        <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={() => {
              resetDonation();
              navigate('/', { replace: true });
            }}
            className="w-full bg-primary hover:brightness-110 text-white text-lg font-bold py-5 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            {tx.returnHome}
          </button>
        </div>
      );
    }
    
    if (step === 0) {
      // Auth step buttons
      const isLogin = authMode === 'login';
      const canSubmit = isLogin 
        ? authFormData.phone && authFormData.password
        : authFormData.phone && authFormData.password && authFormData.fullName && authFormData.email;
      
      return (
        <div className="p-6 pb-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md">
          <Button
            onClick={authMode === 'login' ? handleLogin : handleRegister}
            disabled={!canSubmit || isLoading}
            fullWidth
            size="xl"
            loading={isLoading}
          >
            {authMode === 'login' ? tx.login : tx.continueToDonation}
          </Button>
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="w-full mt-4 text-primary text-sm font-medium hover:underline"
          >
            {authMode === 'login' ? `${tx.noAccount} ${tx.register}` : `${tx.haveAccount} ${tx.login}`}
          </button>
        </div>
      );
    }
    
    if (step === 3) {
      return (
        <footer className="p-6 mt-auto bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-700">
          <Button
            onClick={() => setStep(4)}
            disabled={!uploadedFile}
            fullWidth
            size="xl"
            icon="verified"
            iconPosition={isRTL ? 'right' : 'left'}
            className="shadow-xl shadow-primary/30"
          >
            {tx.submitDonation}
          </Button>
        </footer>
      );
    }
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 p-4 z-50">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={() => setStep(step + 1)}
            fullWidth
            size="xl"
            className="shadow-lg shadow-primary/20"
          >
            {step === 0 ? tx.continue : step === 2 ? tx.continue : tx.next}
          </Button>
          {step === 1 && (
            <p className="text-[10px] text-center text-gray-400 mt-3 uppercase tracking-tighter">
              {tx.secureTransaction}
            </p>
          )}
        </div>
      </div>
    );
  };
  
  // Props for step components
  const step0Props = {
    tx,
    lang,
    authMode,
    authFormData,
    authErrors,
    otpSent,
    otpValues,
    otpRefs,
    otpTimer,
    phoneInputRef,
    showPassword,
    showConfirmPassword,
    handleAuthChange,
    handlePhoneChange,
    formatPhoneDisplay,
    setAuthMode,
    setOtpValues,
    setOtpTimer,
    setStep,
    setShowPassword,
    setShowConfirmPassword,
  };
  
  const step1Props = {
    tx,
    lang,
    project,
    donationData,
    setDonationData,
    formatCurrency,
    calculateTotal,
  };
  
  const step2Props = {
    tx,
    isRTL,
    donationData,
    setDonationData,
  };
  
  const step3Props = {
    tx,
    lang,
    uploadedFile,
    setUploadedFile,
    dragActive,
    setDragActive,
    showToast,
  };
  
  const step4Props = {
    tx,
    lang,
    project,
  };
  
  const headerProps = {
    step,
    tx,
    isRTL,
    isAuthenticated,
    navigate,
    setStep,
  };
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="relative flex h-full min-h-screen w-full max-w-[430px] mx-auto flex-col bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden">
        <Header {...headerProps} />
        {step < 4 && <ProgressIndicator step={step} />}
        
        {step === 0 && <Step0Auth {...step0Props} />}
        {step === 1 && <Step1Amount {...step1Props} />}
        {step === 2 && <Step2PaymentMethods {...step2Props} />}
        {step === 3 && <Step3ReceiptUpload {...step3Props} />}
        {step === 4 && <Step4Success {...step4Props} />}
        
        <BottomAction />
      </div>
    </div>
  );
};

export default DonationFlow;
