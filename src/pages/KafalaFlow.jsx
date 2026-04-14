import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';
import CountryCodeSelector, { validatePhoneByCountry } from '../components/CountryCodeSelector';

// ============================================
// KAFALA FLOW — Sponsorship wizard
// Step 0: Auth (login / register) — skipped if already authenticated
// Step 1: Confirm orphan + locked monthly price
// Step 2: Choose payment method
// Step 3: Review details
// Step 4: Execute payment
// ============================================

const STEPS = 4; // 1-4 (step 0 = auth gate, not counted in progress)

const TX = {
  ar: {
    title: 'كفالة يتيم',
    back: 'رجوع',
    next: 'متابعة',
    step: 'الخطوة',
    of: 'من',
    // Auth step
    welcome: 'مرحباً بك',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    fullName: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    continueToDonation: 'متابعة إلى الكفالة',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'لديك حساب؟',
    enterOtp: 'أدخل رمز التحقق',
    otpSent: 'أرسلنا رمزاً إلى',
    resendCode: 'إعادة إرسال الرمز',
    // Step 1
    confirmTitle: 'تأكيد الكفالة',
    perMonth: 'درهم / شهر',
    priceFixed: 'السعر الشهري ثابت ولا يمكن تغييره',
    monthly_note: 'هذه الكفالة شهرية — يتجدد الاشتراك تلقائياً بالبطاقة',
    // Step 2
    paymentTitle: 'طريقة الدفع',
    card: 'بطاقة بنكية (اشتراك تلقائي)',
    cardDesc: 'Visa، Mastercard — يتجدد تلقائياً كل شهر',
    bank: 'تحويل بنكي',
    bankDesc: 'تحويل يدوي + رفع وصل الدفع',
    cash: 'وكالة نقدية',
    cashDesc: 'Wafacash، Cash Plus',
    // Step 3 — review
    reviewTitle: 'مراجعة التفاصيل',
    orphan: 'اليتيم',
    amount: 'المبلغ الشهري',
    payment: 'طريقة الدفع',
    donor: 'المتبرع',
    anonymous: 'إخفاء اسمي (تبرع مجهول)',
    // Step 4 — pay
    payTitle: 'إتمام الدفع',
    cardPay: 'الدفع بالبطاقة (Whop)',
    cardNote: 'ستُوجَّه إلى صفحة دفع آمنة. يتجدد الاشتراك تلقائياً كل شهر.',
    bankPay: 'تحويل بنكي',
    bankDetails: 'بيانات الحساب البنكي',
    bankHolder: 'صاحب الحساب',
    bankRib: 'رقم الحساب (RIB)',
    bankNameLabel: 'البنك',
    uploadReceipt: 'رفع وصل الدفع',
    receiptUploaded: 'تم رفع الوصل',
    selectFile: 'اختر ملف',
    cashPay: 'دفع نقدي بالوكالة',
    cashAgencies: 'الوكالات المتاحة',
    agenciesList: 'Wafacash، Cash Plus',
    refNum: 'رقم المرجع / الوصل',
    refPlaceholder: 'أدخل رقم الوصل من الوكالة',
    submit: 'إرسال الكفالة',
    submitting: 'جاري الإرسال...',
    redirecting: 'جاري التحويل إلى صفحة الدفع...',
    // Success
    successTitle: 'تم تسجيل كفالتك!',
    successSub: 'جزاك الله خيراً على هذا العمل الصالح. ستتلقى رسالة تأكيد عبر واتساب.',
    backHome: 'العودة للرئيسية',
    pendingNote: 'سيتم مراجعة تبرعك وتأكيده خلال 24 ساعة.',
    // Errors
    kafalaUnavailable: 'هذا اليتيم مكفول بالفعل. الرجاء اختيار يتيم آخر.',
    unknownError: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    loading: 'جاري التحميل...',
    notfound: 'الكفالة غير موجودة',
  },
};

function getT(lang) {
  return TX[lang] || TX.ar;
}

export default function KafalaFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, showToast, user: appUser, isAuthenticated, login } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const tx = getT(lang);
  const isRTL = lang === 'ar';

  // ── Auth mutations ───────────────────────────────────────────────────────
  const loginWithPassword = useMutation(api.auth.loginWithPassword);
  const registerUser     = useMutation(api.auth.registerUser);
  const requestOTP       = useMutation(api.auth.requestOTP);
  const verifyOTP        = useMutation(api.auth.verifyOTP);
  const setPasswordMut   = useMutation(api.auth.setPassword);

  // ── Kafala mutations ─────────────────────────────────────────────────────
  const createSponsorship  = useMutation(api.kafala.createSponsorship);
  const cancelSponsorship  = useMutation(api.kafala.cancelSponsorship);
  const uploadKafalaReceipt = useMutation(api.kafala.uploadKafalaReceipt);
  const generateUploadUrl  = useMutation(api.storage.generateProjectImageUploadUrl);
  const createCheckout     = useAction(api.kafalaPayments.createKafalaWhopCheckout);

  // ── Queries ──────────────────────────────────────────────────────────────
  const kafalaData   = useQuery(api.kafala.getKafalaById, { kafalaId: id });
  const bankInfoRaw  = useQuery(api.config.getConfig, { key: 'bank_info' });

  // ── Step state ───────────────────────────────────────────────────────────
  const [step, setStep] = useState(isAuthenticated ? 1 : 0);

  // ── Auth state ───────────────────────────────────────────────────────────
  const [authMode, setAuthMode]                 = useState('login');
  const [authFormData, setAuthFormData]         = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [authErrors, setAuthErrors]             = useState({});
  const [otpSent, setOtpSent]                   = useState(false);
  const [otpValues, setOtpValues]               = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer]                 = useState(120);
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading]       = useState(false);
  const [countryCode, setCountryCode]           = useState('+212');
  const phoneInputRef = useRef();
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // ── Payment state ─────────────────────────────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState('card_whop');
  const [isAnonymous, setIsAnonymous]     = useState(false);
  const [receipt, setReceipt]             = useState(null);
  const [reference, setReference]         = useState('');
  const [bankName, setBankName]           = useState('');
  const [submitting, setSubmitting]       = useState(false);
  const [done, setDone]                   = useState(false);
  const fileRef = useRef();

  // ── Derived ───────────────────────────────────────────────────────────────
  const bankInfo = React.useMemo(() => {
    if (!bankInfoRaw) return { name: '—', rib: '—', bank: '—' };
    try { return JSON.parse(bankInfoRaw); } catch { return { name: '—', rib: '—', bank: '—' }; }
  }, [bankInfoRaw]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => validatePhoneByCountry(phone, countryCode);
  const formatPhoneDisplay = (phone) => phone.replace(/(\d{2})(?=\d)/g, '$1 ').trim();

  // ── If user logs in elsewhere while on this page, advance past auth step ─
  useEffect(() => {
    if (isAuthenticated && step === 0) setStep(1);
  }, [isAuthenticated]);

  // ── Auth handlers (same as DonationFlow) ─────────────────────────────────

  const handleAuthModeSwitch = (mode) => {
    setAuthMode(mode);
    setAuthErrors({});
    if (otpSent) { setOtpSent(false); setOtpValues(['', '', '', '']); }
  };

  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthFormData(prev => ({ ...prev, [name]: value }));
    if (authErrors[name]) setAuthErrors(prev => ({ ...prev, [name]: null }));
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setAuthFormData(prev => ({ ...prev, phone: value }));
    if (authErrors.phone) setAuthErrors(prev => ({ ...prev, phone: null }));
  };

  const handleLogin = async () => {
    const errors = {};
    if (!validatePhone(authFormData.phone))
      errors.phone = lang === 'ar' ? 'رقم هاتف غير صحيح' : 'Numéro invalide';
    if (!authFormData.password || authFormData.password.length < 6)
      errors.password = lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Mot de passe requis';
    if (Object.keys(errors).length) { setAuthErrors(errors); return; }

    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await loginWithPassword({ phoneNumber: fullPhone, password: authFormData.password });
      if (result.success && result.user) {
        login({ id: result.user._id, userId: result.user._id, name: result.user.fullName, phone: result.user.phoneNumber, email: result.user.email });
        setStep(1);
        showToast(lang === 'ar' ? 'تم تسجيل الدخول' : 'Connecté', 'success');
      } else if (result.requiresOtpVerification) {
        // Account exists but was never verified — resend OTP and show verification screen
        try { await requestOTP({ phoneNumber: fullPhone }); } catch {}
        setOtpSent(true);
        setOtpTimer(120);
        showToast(lang === 'ar' ? 'حسابك غير مفعّل. تم إرسال رمز التحقق مجدداً.' : 'Compte non vérifié. Code renvoyé.', 'info');
      } else {
        setAuthErrors({ password: result.message || (lang === 'ar' ? 'فشل تسجيل الدخول' : 'Échec') });
      }
    } catch { setAuthErrors({ password: lang === 'ar' ? 'خطأ في الاتصال' : 'Erreur' }); }
    finally { setIsAuthLoading(false); }
  };

  const handleRegister = async () => {
    const errors = {};
    if (!authFormData.fullName.trim()) errors.fullName = lang === 'ar' ? 'الاسم مطلوب' : 'Nom requis';
    if (!validateEmail(authFormData.email)) errors.email = lang === 'ar' ? 'بريد غير صحيح' : 'Email invalide';
    if (!validatePhone(authFormData.phone)) errors.phone = lang === 'ar' ? 'رقم هاتف غير صحيح' : 'Numéro invalide';
    if (!authFormData.password || authFormData.password.length < 6) errors.password = lang === 'ar' ? '6 أحرف على الأقل' : '6 caractères min';
    if (authFormData.password !== authFormData.confirmPassword) errors.confirmPassword = lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Mots de passe différents';
    if (Object.keys(errors).length) { setAuthErrors(errors); return; }

    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await registerUser({ fullName: authFormData.fullName, email: authFormData.email, phoneNumber: fullPhone, preferredLanguage: lang === 'fr' ? 'fr' : lang === 'en' ? 'en' : 'ar' });
      if (result.success) {
        if (result.userId) await setPasswordMut({ userId: result.userId, password: authFormData.password });
        await requestOTP({ phoneNumber: fullPhone });
        setOtpSent(true);
        setOtpTimer(120);
        showToast(lang === 'ar' ? 'تم إرسال الرمز' : 'Code envoyé', 'success');
      } else {
        setAuthErrors({ phone: result.message });
      }
    } catch { showToast(lang === 'ar' ? 'خطأ في التسجيل' : 'Erreur', 'error'); }
    finally { setIsAuthLoading(false); }
  };

  const handleOtpVerify = async () => {
    if (!otpValues.every(v => v.length === 1)) return;
    setIsAuthLoading(true);
    try {
      const phoneNumber = countryCode + authFormData.phone;
      const result = await verifyOTP({ phoneNumber, code: otpValues.join('') });
      if (!result.success) { showToast(result.message, 'error'); return; }
      login({ id: result.userId, userId: result.userId, name: authFormData.fullName, phone: phoneNumber, email: authFormData.email });
      setStep(1);
      showToast(lang === 'ar' ? 'تم إنشاء الحساب' : 'Compte créé', 'success');
    } catch { showToast(lang === 'ar' ? 'خطأ في التحقق' : 'Erreur', 'error'); }
    finally { setIsAuthLoading(false); }
  };

  // ── Submit (step 4) ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const userId = appUser?.userId || appUser?.id;
      if (!userId) { showToast(lang === 'ar' ? 'يرجى تسجيل الدخول أولاً' : 'Veuillez vous connecter', 'error'); setStep(0); return; }

      const result = await createSponsorship({ kafalaId: id, userId, paymentMethod, isAnonymous });

      if (paymentMethod === 'card_whop') {
        let userCountry;
        try {
          const geoRes = await fetch('https://ipapi.co/json/');
          if (geoRes.ok) userCountry = (await geoRes.json()).country_code;
        } catch {}

        let purchaseUrl;
        try {
          purchaseUrl = await createCheckout({ kafalaId: id, donationId: result.donationId, userCountry });
        } catch (whopErr) {
          try { await cancelSponsorship({ sponsorshipId: result.sponsorshipId, donationId: result.donationId }); } catch {}
          throw whopErr;
        }
        window.location.href = purchaseUrl;
        return;
      }

      if (paymentMethod === 'bank_transfer') {
        let storageId = '';
        if (receipt) {
          const uploadUrl = await generateUploadUrl();
          const uploadRes = await fetch(uploadUrl, { method: 'POST', body: receipt, headers: { 'Content-Type': receipt.type } });
          const uploadData = await uploadRes.json();
          storageId = uploadData.storageId;
        }
        await uploadKafalaReceipt({ donationId: result.donationId, receiptUrl: storageId, bankName, transactionReference: reference || undefined });
      }

      if (paymentMethod === 'cash_agency' && reference) {
        await uploadKafalaReceipt({ donationId: result.donationId, receiptUrl: '', transactionReference: reference, bankName: bankName || 'cash_agency' });
      }

      setDone(true);
    } catch (err) {
      const msg = err?.message || tx.unknownError;
      showToast(msg.includes('مكفول') ? tx.kafalaUnavailable : msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading / not-found guards ────────────────────────────────────────────
  if (kafalaData === undefined) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!kafalaData) {
    return <div className="min-h-screen flex items-center justify-center text-text-secondary">{tx.notfound}</div>;
  }
  if (kafalaData.status === 'sponsored') {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <span className="material-symbols-outlined text-5xl text-amber-400 mb-4 block">warning</span>
          <p className="text-text-primary font-semibold text-lg">{tx.kafalaUnavailable}</p>
          <button onClick={() => navigate('/kafala')} className="mt-6 bg-primary text-white px-6 py-3 rounded-xl font-bold">
            {tx.backHome}
          </button>
        </div>
      </div>
    );
  }

  const kafala = kafalaData;
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceMAD = (kafala.monthlyPrice / 100).toLocaleString('fr-MA');
  const progress = Math.round((step / STEPS) * 100);

  // ── Success screen ────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="bg-white dark:bg-bg-dark-card rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-3">{tx.successTitle}</h2>
          <p className="text-text-secondary text-sm mb-3 leading-relaxed">{tx.successSub}</p>
          {paymentMethod !== 'card_whop' && (
            <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3 mb-5">{tx.pendingNote}</p>
          )}
          <button onClick={() => navigate('/')} className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors">
            {tx.backHome}
          </button>
        </div>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  const donorName = isAnonymous
    ? (lang === 'ar' ? 'مجهول' : 'Anonyme')
    : (appUser?.name || appUser?.fullName || '—');

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-bg-dark-card/90 backdrop-blur-sm border-b border-border-light dark:border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => { if (step > 1) setStep(s => s - 1); else navigate(`/kafala/${id}`); }}
            className="shrink-0 text-text-secondary hover:text-primary"
          >
            <span className="material-symbols-outlined text-2xl">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
          </button>
          <div className="flex-1">
            {step > 0 && <p className="text-xs text-text-muted">{tx.step} {step} {tx.of} {STEPS}</p>}
            <h1 className="text-base font-bold text-text-primary dark:text-white">{tx.title}</h1>
          </div>
        </div>
        {step > 0 && (
          <div className="h-1 bg-gray-100 dark:bg-white/10">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Orphan summary strip (shown from step 1 onwards) */}
      {step > 0 && (
        <div className="max-w-lg mx-auto px-4 pt-4">
          <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-border-light dark:border-white/10">
            <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={52} />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-text-primary dark:text-white">{kafala.name}</p>
              <p className="text-sm text-text-secondary">{kafala.age} {lang === 'ar' ? 'سنة' : 'ans'} • {kafala.location}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-primary">{priceMAD}</p>
              <p className="text-xs text-text-muted">{tx.perMonth}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ── STEP 0: Auth ── */}
        {step === 0 && (
          <AuthStep
            tx={tx} lang={lang}
            authMode={authMode} authFormData={authFormData} authErrors={authErrors}
            otpSent={otpSent} otpValues={otpValues} otpRefs={otpRefs} otpTimer={otpTimer}
            phoneInputRef={phoneInputRef} showPassword={showPassword} showConfirmPassword={showConfirmPassword}
            handleAuthChange={handleAuthChange} handlePhoneChange={handlePhoneChange}
            formatPhoneDisplay={formatPhoneDisplay} handleAuthModeSwitch={handleAuthModeSwitch}
            setOtpValues={setOtpValues} setOtpTimer={setOtpTimer}
            setShowPassword={setShowPassword} setShowConfirmPassword={setShowConfirmPassword}
            handleOtpVerify={handleOtpVerify} isLoading={isAuthLoading}
            countryCode={countryCode} setCountryCode={setCountryCode}
            handleLogin={handleLogin} handleRegister={handleRegister}
            isAuthenticated={isAuthenticated}
          />
        )}

        {/* ── STEP 1: Confirm ── */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">{tx.confirmTitle}</h2>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <span className="material-symbols-outlined text-lg">lock</span>
                <p className="text-sm font-semibold">{tx.priceFixed}</p>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <span className="material-symbols-outlined text-lg">calendar_month</span>
                <p className="text-sm">{tx.monthly_note}</p>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
              <p className="text-4xl font-bold text-primary">{priceMAD}</p>
              <p className="text-text-secondary text-sm mt-1">{tx.perMonth}</p>
            </div>
          </div>
        )}

        {/* ── STEP 2: Payment method ── */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">{tx.paymentTitle}</h2>
            {[
              { id: 'card_whop',     label: tx.card, desc: tx.cardDesc, icon: 'credit_card' },
              { id: 'bank_transfer', label: tx.bank, desc: tx.bankDesc, icon: 'account_balance' },
              { id: 'cash_agency',   label: tx.cash, desc: tx.cashDesc, icon: 'store' },
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setPaymentMethod(m.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-right ${
                  paymentMethod === m.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-bg-dark-card hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === m.id ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
                  <span className="material-symbols-outlined text-2xl">{m.icon}</span>
                </div>
                <div className="flex-1 text-right">
                  <p className={`font-bold text-sm ${paymentMethod === m.id ? 'text-primary' : 'text-text-primary dark:text-white'}`}>{m.label}</p>
                  <p className="text-text-muted text-xs mt-0.5">{m.desc}</p>
                </div>
                <span className={`material-symbols-outlined text-xl ${paymentMethod === m.id ? 'text-primary' : 'text-gray-300'}`}>
                  {paymentMethod === m.id ? 'radio_button_checked' : 'radio_button_unchecked'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* ── STEP 3: Review ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">{tx.reviewTitle}</h2>
            <div className="bg-white dark:bg-bg-dark-card rounded-2xl border border-border-light dark:border-white/10 overflow-hidden">
              {[
                { label: tx.orphan,  value: kafala.name },
                { label: tx.amount,  value: `${priceMAD} ${lang === 'ar' ? 'درهم/شهر' : 'MAD/mois'}` },
                { label: tx.payment, value: paymentMethod === 'card_whop' ? tx.card : paymentMethod === 'bank_transfer' ? tx.bank : tx.cash },
                { label: tx.donor,   value: donorName },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center px-5 py-4 border-b last:border-b-0 border-border-light dark:border-white/10">
                  <span className="text-text-muted text-sm">{row.label}</span>
                  <span className="font-semibold text-text-primary dark:text-white text-sm">{row.value}</span>
                </div>
              ))}
            </div>
            <label className="flex items-center gap-3 cursor-pointer bg-white dark:bg-bg-dark-card rounded-xl px-4 py-3 border border-border-light dark:border-white/10">
              <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-5 h-5 accent-primary" />
              <span className="text-sm text-text-secondary">{tx.anonymous}</span>
            </label>
          </div>
        )}

        {/* ── STEP 4: Execute payment ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">{tx.payTitle}</h2>

            {paymentMethod === 'card_whop' && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="material-symbols-outlined text-primary text-2xl">credit_card</span>
                  <p className="font-bold text-text-primary dark:text-white">{tx.cardPay}</p>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed">{tx.cardNote}</p>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div className="space-y-4">
                {/* Bank account info with copy buttons */}
                <div className="bg-white dark:bg-bg-dark-card rounded-2xl border border-border-light dark:border-white/10 overflow-hidden">
                  <div className="bg-primary px-5 py-3 flex items-center justify-between">
                    <span className="text-white text-sm font-bold">{tx.bankDetails}</span>
                    <span className="material-symbols-outlined text-white/80 text-lg">account_balance</span>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Account holder */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{tx.bankHolder}</label>
                      <button onClick={() => { navigator.clipboard.writeText(bankInfo.name); showToast(lang === 'ar' ? 'تم النسخ' : 'Copié', 'success'); }}
                        className="flex items-center justify-between w-full bg-primary/5 dark:bg-primary/10 p-3 rounded-xl border border-primary/10 active:scale-[.98] transition-all">
                        <span className="text-text-primary dark:text-white font-bold text-sm flex-1 text-right">{bankInfo.name}</span>
                        <span className="material-symbols-outlined text-primary/60 text-lg mr-2">content_copy</span>
                      </button>
                    </div>
                    {/* RIB */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">{tx.bankRib}</label>
                      <div className="flex items-center gap-2 bg-primary/10 dark:bg-primary/20 p-3 rounded-xl border border-primary/10">
                        <span className="text-primary font-mono font-bold text-base tracking-wider flex-1" dir="ltr">{bankInfo.rib}</span>
                        <button onClick={() => { navigator.clipboard.writeText((bankInfo.rib || '').replace(/\s/g, '')); showToast(lang === 'ar' ? 'تم النسخ' : 'Copié', 'success'); }}
                          className="flex items-center justify-center w-9 h-9 bg-primary text-white rounded-lg active:scale-95 shadow transition-all">
                          <span className="material-symbols-outlined text-[20px]">content_copy</span>
                        </button>
                      </div>
                    </div>
                    {/* Bank name */}
                    <div className="flex justify-between items-center text-sm pt-1 border-t border-border-light dark:border-white/10">
                      <span className="text-text-muted">{tx.bankNameLabel}</span>
                      <span className="font-semibold text-text-primary dark:text-white">{bankInfo.bank}</span>
                    </div>
                  </div>
                </div>
                {/* Receipt upload */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.uploadReceipt}</label>
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-primary/30 rounded-xl py-6 text-center hover:bg-primary/5 transition-colors">
                    {receipt
                      ? <span className="text-emerald-600 font-semibold text-sm">{tx.receiptUploaded}: {receipt.name}</span>
                      : <span className="text-text-muted text-sm">{tx.selectFile}</span>}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setReceipt(e.target.files?.[0] || null)} />
                </div>
                {/* Transaction reference (same as agency) */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.refNum}</label>
                  <input type="text" placeholder={tx.refPlaceholder}
                    value={reference} onChange={e => setReference(e.target.value)}
                    className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                    dir="ltr"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'cash_agency' && (
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                  <p className="text-sm font-bold text-text-secondary mb-2">{tx.cashAgencies}</p>
                  <p className="text-text-primary dark:text-white font-semibold">{tx.agenciesList}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.refNum}</label>
                  <input type="text" placeholder={tx.refPlaceholder}
                    value={reference} onChange={e => setReference(e.target.value)}
                    className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation button ── */}
        {step > 0 && (
          <div className="mt-8">
            {step < STEPS ? (
              <button onClick={() => setStep(s => s + 1)}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 active:scale-[.98] transition-all shadow-primary">
                {tx.next}
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 active:scale-[.98] transition-all shadow-primary disabled:opacity-60 disabled:cursor-not-allowed">
                {submitting
                  ? (paymentMethod === 'card_whop' ? tx.redirecting : tx.submitting)
                  : (paymentMethod === 'card_whop' ? tx.cardPay : tx.submit)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Auth step component (same UI as DonationFlow Step0Auth) ─────────────────
function AuthStep({
  tx, lang, authMode, authFormData, authErrors, otpSent, otpValues, otpRefs, otpTimer,
  phoneInputRef, showPassword, showConfirmPassword, handleAuthChange, handlePhoneChange,
  formatPhoneDisplay, handleAuthModeSwitch, setOtpValues, setOtpTimer,
  setShowPassword, setShowConfirmPassword, handleOtpVerify, isLoading,
  countryCode, setCountryCode, handleLogin, handleRegister, isAuthenticated,
}) {
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(p => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpSent, otpTimer, setOtpTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) otpRefs[index - 1].current?.focus();
  };

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const isOtpComplete = otpValues.every(v => v.length === 1);
  const isLogin = authMode === 'login';
  const canSubmit = isLogin
    ? authFormData.phone && authFormData.password
    : authFormData.phone && authFormData.password && authFormData.fullName && authFormData.email;

  if (otpSent) {
    return (
      <div className="flex flex-col items-center pt-8 pb-4">
        <div className="mb-6 p-4 bg-primary/10 rounded-full">
          <span className="material-symbols-outlined text-primary text-5xl">phonelink_ring</span>
        </div>
        <h2 className="text-xl font-bold text-text-primary dark:text-white mb-2">{tx.enterOtp}</h2>
        <p className="text-text-secondary text-sm text-center mb-8">
          {tx.otpSent} <span className="font-bold text-primary" dir="ltr">{countryCode} {formatPhoneDisplay(authFormData.phone)}</span>
        </p>
        <fieldset className="flex justify-between gap-3 mb-8 w-full max-w-xs" dir="ltr">
          {[0,1,2,3].map(i => (
            <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1}
              value={otpValues[i]} onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              className="flex h-14 w-14 text-center text-xl font-bold bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/20 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              placeholder="-"
            />
          ))}
        </fieldset>
        {otpTimer > 0
          ? <div className="flex items-center gap-2 py-2 px-5 bg-primary/5 rounded-full border border-primary/10 mb-4">
              <span className="material-symbols-outlined text-primary text-sm">schedule</span>
              <span className="text-primary text-sm font-bold tracking-widest" dir="ltr">{formatTime(otpTimer)}</span>
            </div>
          : <button onClick={() => setOtpTimer(120)} className="text-primary font-bold hover:underline mb-4">{tx.resendCode}</button>
        }
        <button onClick={handleOtpVerify} disabled={!isOtpComplete || isLoading}
          className="w-full max-w-xs bg-primary text-white py-4 rounded-xl font-bold disabled:opacity-60 transition-all">
          {isLoading ? '...' : (lang === 'ar' ? 'تحقق' : 'Vérifier')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pt-4">
      <h2 className="text-xl font-bold text-text-primary dark:text-white text-center mb-1">{tx.welcome}</h2>
      <p className="text-text-secondary text-sm text-center mb-6">
        {lang === 'ar' ? 'سجل الدخول أو أنشئ حساباً للمتابعة' : 'Connectez-vous ou créez un compte pour continuer'}
      </p>

      {/* Mode toggle */}
      <div className="flex h-11 items-center rounded-xl bg-gray-100 dark:bg-white/10 p-1 mb-6">
        {['login', 'register'].map(mode => (
          <button key={mode} onClick={() => handleAuthModeSwitch(mode)}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              authMode === mode ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm' : 'text-text-muted'
            }`}>
            {mode === 'login' ? tx.login : tx.register}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {authMode === 'register' && (
          <>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.fullName}</label>
              <input type="text" name="fullName" value={authFormData.fullName} onChange={handleAuthChange} placeholder="Mohammed Alami"
                className="w-full h-12 bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/20 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white" />
              {authErrors.fullName && <p className="text-red-500 text-xs mt-1">{authErrors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.email}</label>
              <input type="email" name="email" value={authFormData.email} onChange={handleAuthChange} placeholder="example@mail.com"
                className="w-full h-12 bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/20 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white" dir="ltr" />
              {authErrors.email && <p className="text-red-500 text-xs mt-1">{authErrors.email}</p>}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.phone}</label>
          <div className="flex gap-2">
            <CountryCodeSelector value={countryCode} onChange={setCountryCode} lang={lang} />
            <input ref={phoneInputRef} type="tel" name="phone" value={authFormData.phone} onChange={handlePhoneChange}
              placeholder={countryCode === '+212' ? '6XXXXXXXX' : 'Phone number'} maxLength={15}
              className="flex-1 h-12 bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/20 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              dir="ltr" inputMode="numeric" />
          </div>
          {authErrors.phone && <p className="text-red-500 text-xs mt-1">{authErrors.phone}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.password}</label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} name="password" value={authFormData.password} onChange={handleAuthChange} placeholder="••••••••"
              className="w-full h-12 bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/20 rounded-xl px-4 pr-12 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white" />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
              <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
            </button>
          </div>
          {authErrors.password && <p className="text-red-500 text-xs mt-1">{authErrors.password}</p>}
        </div>

        {authMode === 'register' && (
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.confirmPassword}</label>
            <div className="relative">
              <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={authFormData.confirmPassword} onChange={handleAuthChange} placeholder="••••••••"
                className="w-full h-12 bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/20 rounded-xl px-4 pr-12 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white" />
              <button type="button" onClick={() => setShowConfirmPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {authErrors.confirmPassword && <p className="text-red-500 text-xs mt-1">{authErrors.confirmPassword}</p>}
          </div>
        )}
      </div>

      {/* Submit button */}
      <button onClick={isLogin ? handleLogin : handleRegister} disabled={!canSubmit || isLoading}
        className="mt-6 w-full bg-primary text-white py-4 rounded-xl font-bold disabled:opacity-60 hover:bg-primary/90 transition-all">
        {isLoading ? '...' : isLogin ? tx.login : tx.continueToDonation}
      </button>
    </div>
  );
}
