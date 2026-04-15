import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ============================================
// KAFALA RENEW — Monthly renewal page for bank/cash sponsors
// Route: /kafala/:id/renew  (:id = kafalaId)
//
// Flow:
//   1. Auth check — must be logged in and be the active sponsor
//   2. Show orphan card + current sponsorship status
//   3. Payment proof form — bank (copy details + receipt + ref) or cash (ref)
//   4. Submit → renewKafalaDonation + uploadKafalaReceipt → success screen
// ============================================

const TX = {
  title: 'تجديد الكفالة',
  perMonth: 'درهم / شهر',
  loginRequired: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة.',
  goLogin: 'تسجيل الدخول',
  notSponsor: 'أنت لست الكافل الحالي لهذا اليتيم.',
  notFound: 'الكفالة غير موجودة',
  paymentMethod: 'طريقة الدفع',
  bank: 'تحويل بنكي',
  cash: 'وكالة نقدية',
  bankDetails: 'بيانات الحساب البنكي',
  bankHolder: 'صاحب الحساب',
  bankRib: 'رقم الحساب (RIB)',
  bankNameLabel: 'البنك',
  uploadReceipt: 'رفع وصل الدفع',
  receiptUploaded: 'تم رفع الوصل',
  selectFile: 'اختر ملفاً أو اسحبه هنا',
  refNum: 'رقم المرجع / الوصل',
  refPlaceholder: 'أدخل رقم العملية من الوصل',
  cashAgencies: 'الوكالات المتاحة',
  agenciesList: 'Wafacash، Cash Plus',
  nextRenewal: 'موعد التجديد',
  statusLabel: 'حالة الاشتراك',
  statusActive: 'نشط',
  statusPending: 'في انتظار التحقق',
  statusExpired: 'منتهي',
  alreadyPending: 'يوجد طلب تجديد قيد المراجعة. سيتواصل معك الفريق قريباً.',
  proofTitle: 'إثبات الدفع',
  submit: 'إرسال طلب التجديد',
  submitting: 'جاري الإرسال...',
  successTitle: 'تم إرسال طلب التجديد!',
  successSub: 'سيراجع فريقنا الوصل ويؤكد تجديد كفالتك خلال 24 ساعة. جزاك الله خيراً.',
  backHome: 'العودة للرئيسية',
  submitError: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
  copied: 'تم النسخ',
};

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('ar-MA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

export default function KafalaRenew() {
  const { id } = useParams(); // kafalaId
  const navigate = useNavigate();
  const { user: appUser, isAuthenticated, showToast } = useApp();

  const userId = appUser?.userId || appUser?.id;

  // ── Queries ─────────────────────────────────────────────────────────────────
  const kafalaData    = useQuery(api.kafala.getKafalaById, { kafalaId: id });
  const bankInfoRaw   = useQuery(api.config.getConfig, { key: 'bank_info' });
  const sponsorship   = useQuery(
    api.kafala.getActiveSponsorshipByKafalaAndUser,
    userId ? { kafalaId: id, userId } : 'skip'
  );

  // ── Mutations ────────────────────────────────────────────────────────────────
  const renewMut          = useMutation(api.kafala.renewKafalaDonation);
  const uploadReceiptMut  = useMutation(api.kafala.uploadKafalaReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);

  // ── Local state ──────────────────────────────────────────────────────────────
  const [receipt, setReceipt]       = useState(null);
  const [reference, setReference]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]             = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef();

  // ── Derived ──────────────────────────────────────────────────────────────────
  const bankInfo = React.useMemo(() => {
    if (!bankInfoRaw) return { name: '—', rib: '—', bank: '—' };
    try { return JSON.parse(bankInfoRaw); } catch { return { name: '—', rib: '—', bank: '—' }; }
  }, [bankInfoRaw]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    showToast(TX.copied, 'success');
  };

  // ── Auth guard ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="bg-white dark:bg-bg-dark-card rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
          <span className="material-symbols-outlined text-5xl text-text-muted mb-4 block">lock</span>
          <p className="text-text-primary dark:text-white font-semibold mb-4">{TX.loginRequired}</p>
          <button onClick={() => navigate('/login')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold w-full">
            {TX.goLogin}
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (kafalaData === undefined || sponsorship === undefined) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!kafalaData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-text-secondary">
        {TX.notFound}
      </div>
    );
  }

  // ── Not the current sponsor ───────────────────────────────────────────────────
  if (!sponsorship) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="bg-white dark:bg-bg-dark-card rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
          <span className="material-symbols-outlined text-5xl text-amber-400 mb-4 block">warning</span>
          <p className="text-text-primary dark:text-white font-semibold mb-4">{TX.notSponsor}</p>
          <button onClick={() => navigate('/kafala')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold w-full">
            العودة للكفالات
          </button>
        </div>
      </div>
    );
  }

  // ── Renewal already pending ───────────────────────────────────────────────────
  if (sponsorship.status === 'pending_payment') {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="bg-white dark:bg-bg-dark-card rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-amber-500 text-3xl">pending</span>
          </div>
          <h2 className="text-lg font-bold text-text-primary dark:text-white mb-3">طلب قيد المراجعة</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-5">{TX.alreadyPending}</p>
          <button onClick={() => navigate('/')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold w-full">
            {TX.backHome}
          </button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center px-4">
        <div className="bg-white dark:bg-bg-dark-card rounded-3xl shadow-card p-8 max-w-sm w-full text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <span className="material-symbols-outlined text-emerald-600 text-4xl">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-text-primary dark:text-white mb-3">{TX.successTitle}</h2>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">{TX.successSub}</p>
          <button onClick={() => navigate('/')}
            className="bg-primary text-white px-8 py-3 rounded-xl font-bold w-full hover:bg-primary/90 transition-colors">
            {TX.backHome}
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  const kafala    = kafalaData;
  const photoUrl  = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceMAD  = (kafala.monthlyPrice / 100).toLocaleString('fr-MA');
  const payMethod = sponsorship.paymentMethod; // bank_transfer | cash_agency

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setReceipt(file);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (payMethod === 'bank_transfer' && !receipt && !reference.trim()) {
      showToast('يرجى رفع الوصل أو إدخال رقم المرجع', 'error');
      return;
    }
    if (payMethod === 'cash_agency' && !reference.trim()) {
      showToast('يرجى إدخال رقم المرجع / الوصل', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { donationId } = await renewMut({
        sponsorshipId: sponsorship._id,
        paymentMethod: payMethod,
      });

      let storageId = '';
      if (receipt) {
        const uploadUrl = await generateUploadUrl();
        const res = await fetch(uploadUrl, {
          method: 'POST', body: receipt,
          headers: { 'Content-Type': receipt.type },
        });
        const data = await res.json();
        storageId = data.storageId;
      }

      await uploadReceiptMut({
        donationId,
        receiptUrl: storageId,
        transactionReference: reference.trim() || undefined,
        bankName: payMethod === 'cash_agency' ? 'cash_agency' : undefined,
      });

      setDone(true);
    } catch (err) {
      showToast(err?.message || TX.submitError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen pb-32" dir="rtl">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-bg-dark-card/90 backdrop-blur-sm border-b border-border-light dark:border-white/10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(`/kafala/${id}`)}
            className="shrink-0 text-text-secondary hover:text-primary">
            <span className="material-symbols-outlined text-2xl">arrow_forward</span>
          </button>
          <h1 className="text-base font-bold text-text-primary dark:text-white">{TX.title}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* ── Orphan summary strip ────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-4 flex items-center gap-4 shadow-sm border border-border-light dark:border-white/10">
          <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={56} />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-text-primary dark:text-white">{kafala.name}</p>
            <p className="text-sm text-text-secondary">{kafala.age} سنة • {kafala.location}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-primary">{priceMAD}</p>
            <p className="text-xs text-text-muted">{TX.perMonth}</p>
          </div>
        </div>

        {/* ── Sponsorship info ────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-bg-dark-card rounded-2xl border border-border-light dark:border-white/10 overflow-hidden">
          <div className="bg-primary/5 px-5 py-3 border-b border-border-light dark:border-white/10">
            <p className="text-sm font-bold text-primary">معلومات الاشتراك</p>
          </div>
          <div className="divide-y divide-border-light dark:divide-white/10">
            {[
              {
                label: TX.paymentMethod,
                icon: payMethod === 'bank_transfer' ? 'account_balance' : 'store',
                value: payMethod === 'bank_transfer' ? TX.bank : TX.cash,
              },
              {
                label: TX.nextRenewal,
                icon: 'calendar_month',
                value: formatDate(sponsorship.nextRenewalDate),
              },
              {
                label: TX.statusLabel,
                icon: 'circle',
                value: sponsorship.status === 'active'
                  ? TX.statusActive
                  : sponsorship.status === 'expired'
                    ? TX.statusExpired
                    : TX.statusPending,
                valueClass: sponsorship.status === 'active'
                  ? 'text-emerald-600'
                  : 'text-amber-600',
              },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2 text-text-muted">
                  <span className="material-symbols-outlined text-base">{row.icon}</span>
                  <span className="text-sm">{row.label}</span>
                </div>
                <span className={`text-sm font-semibold ${row.valueClass || 'text-text-primary dark:text-white'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Payment proof ───────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-text-primary dark:text-white">{TX.proofTitle}</h2>

          {/* ── Bank transfer ── */}
          {payMethod === 'bank_transfer' && (
            <>
              {/* Bank account card with copy buttons */}
              <div className="bg-white dark:bg-bg-dark-card rounded-2xl border border-border-light dark:border-white/10 overflow-hidden">
                <div className="bg-primary px-5 py-3 flex items-center justify-between">
                  <span className="text-white text-sm font-bold">{TX.bankDetails}</span>
                  <span className="material-symbols-outlined text-white/80 text-lg">account_balance</span>
                </div>
                <div className="p-4 space-y-3">
                  {/* Account holder */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      {TX.bankHolder}
                    </label>
                    <button
                      onClick={() => copy(bankInfo.name)}
                      className="flex items-center justify-between w-full bg-primary/5 dark:bg-primary/10 p-3 rounded-xl border border-primary/10 active:scale-[.98] transition-all"
                    >
                      <span className="text-text-primary dark:text-white font-bold text-sm flex-1 text-right">
                        {bankInfo.name}
                      </span>
                      <span className="material-symbols-outlined text-primary/60 text-lg mr-2">content_copy</span>
                    </button>
                  </div>
                  {/* RIB */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                      {TX.bankRib}
                    </label>
                    <div className="flex items-center gap-2 bg-primary/10 dark:bg-primary/20 p-3 rounded-xl border border-primary/10">
                      <span className="text-primary font-mono font-bold text-base tracking-wider flex-1" dir="ltr">
                        {bankInfo.rib}
                      </span>
                      <button
                        onClick={() => copy((bankInfo.rib || '').replace(/\s/g, ''))}
                        className="flex items-center justify-center w-9 h-9 bg-primary text-white rounded-lg active:scale-95 shadow transition-all shrink-0"
                      >
                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                      </button>
                    </div>
                  </div>
                  {/* Bank name */}
                  <div className="flex justify-between items-center text-sm pt-1 border-t border-border-light dark:border-white/10">
                    <span className="text-text-muted">{TX.bankNameLabel}</span>
                    <span className="font-semibold text-text-primary dark:text-white">{bankInfo.bank}</span>
                  </div>
                </div>
              </div>

              {/* Receipt upload with drag & drop */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">{TX.uploadReceipt}</label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`w-full border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-primary bg-primary/10'
                      : 'border-primary/30 hover:bg-primary/5'
                  }`}
                >
                  {receipt ? (
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-emerald-500 text-3xl">check_circle</span>
                      <span className="text-emerald-600 font-semibold text-sm">{TX.receiptUploaded}</span>
                      <span className="text-text-muted text-xs">{receipt.name}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-primary/40 text-3xl">upload_file</span>
                      <span className="text-text-muted text-sm">{TX.selectFile}</span>
                      <span className="text-text-muted text-xs">JPG، PNG، PDF</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                  onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                />
              </div>

              {/* Transaction reference */}
              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">{TX.refNum}</label>
                <input
                  type="text" placeholder={TX.refPlaceholder}
                  value={reference} onChange={(e) => setReference(e.target.value)}
                  className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                  dir="ltr"
                />
              </div>
            </>
          )}

          {/* ── Cash agency ── */}
          {payMethod === 'cash_agency' && (
            <>
              <div className="bg-white dark:bg-bg-dark-card rounded-2xl border border-border-light dark:border-white/10 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl">store</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-secondary">{TX.cashAgencies}</p>
                    <p className="text-text-primary dark:text-white font-semibold">{TX.agenciesList}</p>
                  </div>
                </div>
                <p className="text-xs text-text-muted leading-relaxed border-t border-border-light dark:border-white/10 pt-3">
                  بعد الدفع في الوكالة، أدخل رقم المرجع الخاص بمعاملتك أدناه للتحقق.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-secondary mb-2">{TX.refNum}</label>
                <input
                  type="text" placeholder={TX.refPlaceholder}
                  value={reference} onChange={(e) => setReference(e.target.value)}
                  className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                  dir="ltr"
                />
              </div>
            </>
          )}
        </div>

        {/* ── Submit ──────────────────────────────────────────────────────────── */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 active:scale-[.98] transition-all shadow-primary disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                {TX.submitting}
              </span>
            ) : TX.submit}
          </button>
          <p className="text-center text-xs text-text-muted mt-3">
            سيتم مراجعة طلبك وتأكيده خلال 24 ساعة عبر واتساب.
          </p>
        </div>

      </div>
    </div>
  );
}
