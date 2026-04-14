import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';
import CountryCodeSelector, { validatePhoneByCountry } from '../components/CountryCodeSelector';

// ============================================
// KAFALA FLOW — 5-step sponsorship wizard
// Steps: 1.Confirm  2.Payment method  3.User info  4.Review  5.Pay
// ============================================

const STEPS = 5;

const TX = {
  ar: {
    title: 'كفالة يتيم',
    back: 'رجوع',
    next: 'متابعة',
    step: 'الخطوة',
    of: 'من',
    // Step 1
    confirmTitle: 'تأكيد الكفالة',
    perMonth: 'درهم / شهر',
    priceFixed: 'السعر الشهري ثابت ولا يمكن تغييره',
    monthly_note: 'هذه الكفالة شهرية — ستتلقى تذكيراً قبل انتهاء كل شهر',
    // Step 2
    paymentTitle: 'طريقة الدفع',
    card: 'بطاقة بنكية (اشتراك تلقائي)',
    cardDesc: 'Visa، Mastercard — يتجدد تلقائياً كل شهر',
    bank: 'تحويل بنكي',
    bankDesc: 'تحويل يدوي + رفع وصل الدفع',
    cash: 'وكالة نقدية',
    cashDesc: 'Wafacash، Cash Plus',
    // Step 3
    userTitle: 'معلوماتك',
    fullName: 'الاسم الكامل',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني (اختياري)',
    anonymous: 'إخفاء اسمي (تبرع مجهول)',
    namePlaceholder: 'أدخل اسمك الكامل',
    emailPlaceholder: 'example@email.com',
    required: 'الاسم ورقم الهاتف مطلوبان',
    invalidPhone: 'رقم الهاتف غير صحيح',
    // Step 4
    reviewTitle: 'مراجعة التفاصيل',
    orphan: 'اليتيم',
    amount: 'المبلغ الشهري',
    payment: 'طريقة الدفع',
    donor: 'المتبرع',
    // Step 5
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
    male: 'ذكر',
    female: 'أنثى',
    loading: 'جاري التحميل...',
    notfound: 'الكفالة غير موجودة',
    copy: 'نسخ',
    copied: 'تم النسخ!',
  },
};

function getT(lang) {
  // Fallback to Arabic for all unsupported langs
  return TX[lang] || TX.ar;
}

export default function KafalaFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, showToast } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const tx = getT(lang);
  const isRTL = lang === 'ar';

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card_whop');
  const [user, setUser] = useState({ fullName: '', phone: '', email: '', countryCode: '+212', isAnonymous: false });
  const [phoneError, setPhoneError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [sponsorshipId, setSponsorshipId] = useState(null);
  const [donationId, setDonationId] = useState(null);
  const fileRef = useRef();

  // Convex
  const kafalaData = useQuery(api.kafala.getKafalaById, { kafalaId: id });
  const bankInfoRaw = useQuery(api.config.getConfig, { key: 'bank_info' });

  const createSponsorship = useMutation(api.kafala.createSponsorship);
  const uploadKafalaReceipt = useMutation(api.kafala.uploadKafalaReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const createCheckout = useAction(api.kafalaPayments.createKafalaWhopCheckout);

  // Also check for existing user in app context
  const { user: appUser } = useApp();

  // Pre-fill user from app context
  React.useEffect(() => {
    if (appUser) {
      setUser(prev => ({
        ...prev,
        fullName: appUser.fullName || prev.fullName,
        phone: appUser.phoneNumber || prev.phone,
        email: appUser.email || prev.email,
      }));
    }
  }, [appUser]);

  const bankInfo = React.useMemo(() => {
    if (!bankInfoRaw) return { name: '—', rib: '—', bank: '—' };
    try { return JSON.parse(bankInfoRaw); } catch { return { name: '—', rib: '—', bank: '—' }; }
  }, [bankInfoRaw]);

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
  if (kafalaData.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
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

  // ── Step navigation ──────────────────────────────────────────────────────
  const goBack = () => {
    if (step > 1) setStep(s => s - 1);
    else navigate(`/kafala/${id}`);
  };

  const validateStep = () => {
    if (step === 3) {
      if (!user.fullName.trim()) { showToast?.(tx.required, 'error'); return false; }
      const fullPhone = user.countryCode + user.phone.replace(/^0/, '');
      const valid = validatePhoneByCountry?.(user.phone, user.countryCode);
      if (valid === false) { setPhoneError(tx.invalidPhone); return false; }
      setPhoneError('');
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < STEPS) setStep(s => s + 1);
  };

  // ── Submit (step 5 execute payment) ───────────────────────────────────────
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. Create sponsorship + first donation record
      const fullPhone = user.countryCode + user.phone.replace(/^0/, '');
      const result = await createSponsorship({
        kafalaId: id,
        userId: appUser?.userId || appUser?.id,
        paymentMethod,
        isAnonymous: user.isAnonymous,
      });
      setSponsorshipId(result.sponsorshipId);
      setDonationId(result.donationId);

      if (paymentMethod === 'card_whop') {
        // Redirect to Whop subscription checkout
        const purchaseUrl = await createCheckout({
          kafalaId: id,
          donationId: result.donationId,
        });
        window.location.href = purchaseUrl;
        return; // page will redirect
      }

      if (paymentMethod === 'bank_transfer') {
        // Upload receipt if provided
        if (receipt) {
          const uploadUrl = await generateUploadUrl();
          const uploadRes = await fetch(uploadUrl, { method: 'POST', body: receipt, headers: { 'Content-Type': receipt.type } });
          const { storageId } = await uploadRes.json();
          await uploadKafalaReceipt({
            donationId: result.donationId,
            receiptUrl: storageId,
            bankName,
          });
        }
      }

      if (paymentMethod === 'cash_agency') {
        if (reference) {
          await uploadKafalaReceipt({
            donationId: result.donationId,
            receiptUrl: '',
            transactionReference: reference,
            bankName: bankName || 'cash_agency',
          });
        }
      }

      setDone(true);
    } catch (err) {
      const msg = err?.message || tx.unknownError;
      showToast?.(msg.includes('مكفول') ? tx.kafalaUnavailable : tx.unknownError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ─────────────────────────────────────────────────────────
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
            <p className="text-amber-600 dark:text-amber-400 text-xs bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 mb-5">{tx.pendingNote}</p>
          )}
          <button
            onClick={() => navigate('/kafala')}
            className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
          >
            {tx.backHome}
          </button>
        </div>
      </div>
    );
  }

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progress = ((step - 1) / (STEPS - 1)) * 100;

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white dark:bg-bg-dark-card border-b border-border-light dark:border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={goBack} className="shrink-0 text-text-secondary hover:text-primary">
            <span className="material-symbols-outlined text-2xl">{isRTL ? 'arrow_forward' : 'arrow_back'}</span>
          </button>
          <div className="flex-1">
            <p className="text-xs text-text-muted">{tx.step} {step} {tx.of} {STEPS}</p>
            <h1 className="text-base font-bold text-text-primary dark:text-white">{tx.title}</h1>
          </div>
        </div>
        <div className="h-1 bg-gray-100 dark:bg-white/10">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Orphan summary strip */}
        <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-4 flex items-center gap-4 mb-6 shadow-sm border border-border-light dark:border-white/10">
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
              { id: 'card_whop', label: tx.card, desc: tx.cardDesc, icon: 'credit_card' },
              { id: 'bank_transfer', label: tx.bank, desc: tx.bankDesc, icon: 'account_balance' },
              { id: 'cash_agency', label: tx.cash, desc: tx.cashDesc, icon: 'store' },
            ].map((m) => (
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

        {/* ── STEP 3: User info ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">{tx.userTitle}</h2>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.fullName} *</label>
              <input
                type="text"
                placeholder={tx.namePlaceholder}
                value={user.fullName}
                onChange={e => setUser(p => ({ ...p, fullName: e.target.value }))}
                className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.phone} *</label>
              <div className="flex gap-2">
                <CountryCodeSelector
                  value={user.countryCode}
                  onChange={cc => setUser(p => ({ ...p, countryCode: cc }))}
                  className="shrink-0"
                />
                <input
                  type="tel"
                  placeholder="0600000000"
                  value={user.phone}
                  onChange={e => { setUser(p => ({ ...p, phone: e.target.value })); setPhoneError(''); }}
                  className="flex-1 border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                  dir="ltr"
                />
              </div>
              {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.email}</label>
              <input
                type="email"
                placeholder={tx.emailPlaceholder}
                value={user.email}
                onChange={e => setUser(p => ({ ...p, email: e.target.value }))}
                className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                dir="ltr"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={user.isAnonymous}
                onChange={e => setUser(p => ({ ...p, isAnonymous: e.target.checked }))}
                className="w-5 h-5 accent-primary"
              />
              <span className="text-sm text-text-secondary">{tx.anonymous}</span>
            </label>
          </div>
        )}

        {/* ── STEP 4: Review ── */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-text-primary dark:text-white">{tx.reviewTitle}</h2>
            <div className="bg-white dark:bg-bg-dark-card rounded-2xl border border-border-light dark:border-white/10 overflow-hidden">
              {[
                { label: tx.orphan, value: kafala.name },
                { label: tx.amount, value: `${priceMAD} ${lang === 'ar' ? 'درهم/شهر' : 'MAD/mois'}` },
                { label: tx.payment, value: paymentMethod === 'card_whop' ? tx.card : paymentMethod === 'bank_transfer' ? tx.bank : tx.cash },
                { label: tx.donor, value: user.isAnonymous ? (lang === 'ar' ? 'مجهول' : 'Anonyme') : user.fullName },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center px-5 py-4 border-b last:border-b-0 border-border-light dark:border-white/10">
                  <span className="text-text-muted text-sm">{row.label}</span>
                  <span className="font-semibold text-text-primary dark:text-white text-sm">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 5: Execute payment ── */}
        {step === 5 && (
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
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-bold text-text-secondary mb-3">{tx.bankDetails}</p>
                  {[
                    { label: tx.bankHolder, value: bankInfo.name },
                    { label: tx.bankRib, value: bankInfo.rib, mono: true },
                    { label: tx.bankNameLabel, value: bankInfo.bank },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center text-sm">
                      <span className="text-text-muted">{row.label}</span>
                      <span className={`font-semibold text-text-primary dark:text-white ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.uploadReceipt}</label>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-primary/30 rounded-xl py-6 text-center hover:bg-primary/5 transition-colors"
                  >
                    {receipt ? (
                      <span className="text-emerald-600 font-semibold text-sm">{tx.receiptUploaded}: {receipt.name}</span>
                    ) : (
                      <span className="text-text-muted text-sm">{tx.selectFile}</span>
                    )}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => setReceipt(e.target.files?.[0] || null)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-1">{tx.bankNameLabel}</label>
                  <input
                    type="text"
                    placeholder="Attijariwafa, CIH, BMCE..."
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                    className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
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
                  <input
                    type="text"
                    placeholder={tx.refPlaceholder}
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                    dir="ltr"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-3">
          {step < STEPS ? (
            <button
              onClick={handleNext}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 active:scale-[.98] transition-all shadow-primary"
            >
              {tx.next}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 active:scale-[.98] transition-all shadow-primary disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting
                ? (paymentMethod === 'card_whop' ? tx.redirecting : tx.submitting)
                : (paymentMethod === 'card_whop' ? tx.cardPay : tx.submit)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
