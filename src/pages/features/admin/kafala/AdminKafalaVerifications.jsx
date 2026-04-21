import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';

// ============================================
// ADMIN KAFALA VERIFICATIONS
// Lists all pending bank/cash kafala donations and lets admin
// verify or reject them. Modelled after AdminVerifications.jsx.
// ============================================

export default function AdminKafalaVerifications() {
  const { showToast, user: adminUser } = useApp();

  const rawDonations  = useQuery(api.kafala.getPendingKafalaVerifications, {});
  const verifyMut     = useMutation(api.kafala.verifyKafalaDonation);

  const [search, setSearch]                 = useState('');
  const [selected, setSelected]             = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [imageExpanded, setImageExpanded]   = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);
  const [checks, setChecks]                 = useState({
    amountMatches: false,
    referenceVisible: false,
    dateRecent: false,
  });

  // ── Filter ────────────────────────────────────────────────────────────────────
  const donations = useMemo(() => rawDonations || [], [rawDonations]);

  const filtered = useMemo(() => {
    if (!search) return donations;
    const q = search.toLowerCase();
    return donations.filter(
      (d) =>
        d.donorName?.toLowerCase().includes(q) ||
        d.donorPhone?.includes(q) ||
        d.kafalaName?.toLowerCase().includes(q)
    );
  }, [donations, search]);

  // ── Helpers ───────────────────────────────────────────────────────────────────
  const formatDate = (ts) =>
    ts ? new Date(ts).toLocaleDateString('ar-MA', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const formatMAD = (cents) =>
    cents != null ? `${(cents / 100).toLocaleString('fr-MA')} MAD` : '—';

  const methodLabel = (m) =>
    m === 'bank_transfer' ? 'تحويل بنكي' : m === 'cash_agency' ? 'وكالة نقدية' : m;

  const methodIcon = (m) =>
    m === 'bank_transfer' ? 'account_balance' : m === 'cash_agency' ? 'store' : 'payments';

  const whatsappLink = (phone) =>
    `https://wa.me/${(phone || '').replace(/\D/g, '')}`;

  const openModal = (d) => {
    setSelected(d);
    setRejectionReason('');
    setImageExpanded(false);
    setChecks({ amountMatches: false, referenceVisible: false, dateRecent: false });
  };

  const closeModal = () => {
    setSelected(null);
    setImageExpanded(false);
  };

  // ── Actions ───────────────────────────────────────────────────────────────────
  const handleVerify = async (verified) => {
    if (!selected || isSubmitting) return;
    const adminId = adminUser?.id;
    if (!adminId) { showToast('جلسة منتهية — سجّل الدخول مجدداً', 'error'); return; }

    setIsSubmitting(true);
    try {
      await verifyMut({
        donationId: selected._id,
        adminId,
        verified,
        notes: rejectionReason || undefined,
      });
      showToast(verified ? 'تم قبول التجديد وتفعيله' : 'تم رفض التجديد', verified ? 'success' : 'error');
      closeModal();
    } catch (err) {
      showToast(err?.message || 'حدث خطأ', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (rawDonations === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">التحقق من تجديدات الكفالة</h1>
          <p className="text-sm text-text-secondary mt-1">مراجعة وتوثيق تجديدات الكفالة المعلقة (بنكي / وكالة)</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-sm font-bold px-4 py-2 rounded-xl">
          <span className="material-symbols-outlined text-base">pending</span>
          {filtered.length} معلق
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/10 rounded-xl px-4 h-11 shadow-sm">
        <span className="material-symbols-outlined text-text-muted text-xl">search</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم، الهاتف، أو اسم اليتيم..."
          className="flex-1 bg-transparent text-sm text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none"
        />
      </div>

      {/* ── List ───────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-5xl text-emerald-500">check_circle</span>
          </div>
          <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">كل شيء محدّث!</h3>
          <p className="text-text-secondary text-sm">لا توجد تجديدات معلقة للمراجعة</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((d) => (
            <button
              key={d._id}
              onClick={() => openModal(d)}
              className="w-full text-right bg-amber-50/40 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3">
                {/* Avatar + donor info */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-xl">
                    {(d.donorName || '؟').charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-text-primary dark:text-white text-sm truncate">{d.donorName}</p>
                    <p className="text-xs text-text-muted">{d.donorPhone}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        معلق
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                        <span className="material-symbols-outlined text-xs">{methodIcon(d.paymentMethod)}</span>
                        {methodLabel(d.paymentMethod)}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Amount + orphan */}
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">{formatMAD(d.amount)}</p>
                  <p className="text-xs text-text-muted mt-0.5">{d.kafalaName}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{formatDate(d.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/30">
                <span className="text-xs text-text-muted">
                  {d.receiptUrl ? '📎 وصل مرفق' : d.transactionReference ? `# ${d.transactionReference}` : 'لا يوجد وصل'}
                </span>
                <span className="text-xs text-primary font-semibold flex items-center gap-1">
                  اضغط للمراجعة
                  <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Detail modal ───────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 sm:rounded-2xl shadow-xl overflow-hidden flex flex-col h-[95vh] sm:max-h-[90vh] border-0 sm:border border-border-light dark:border-white/10">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-light dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
              <button onClick={closeModal} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <span className="material-symbols-outlined text-text-secondary">close</span>
              </button>
              <h2 className="font-bold text-text-primary dark:text-white">مراجعة تجديد الكفالة</h2>
              <a
                href={whatsappLink(selected.donorPhone)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 transition-colors"
                title="فتح واتساب"
              >
                <span className="material-symbols-outlined text-lg">chat</span>
              </a>
            </div>

            {/* Modal body — scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-5 space-y-5">

                {/* Orphan + donor info */}
                <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0">
                      {(selected.donorName || '؟').charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-text-primary dark:text-white text-sm">{selected.donorName}</p>
                      <a href={whatsappLink(selected.donorPhone)} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline">
                        <span className="material-symbols-outlined text-xs">chat</span>
                        {selected.donorPhone}
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-primary/10">
                    {[
                      { label: 'اليتيم', value: selected.kafalaName, icon: 'child_care' },
                      { label: 'المبلغ', value: formatMAD(selected.amount), icon: 'payments' },
                      { label: 'الطريقة', value: methodLabel(selected.paymentMethod), icon: methodIcon(selected.paymentMethod) },
                      { label: 'تاريخ الإرسال', value: formatDate(selected.createdAt), icon: 'calendar_today' },
                    ].map((r) => (
                      <div key={r.label}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">{r.label}</p>
                        <p className="text-sm font-semibold text-text-primary dark:text-white flex items-center gap-1">
                          <span className="material-symbols-outlined text-primary text-sm">{r.icon}</span>
                          {r.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Receipt image */}
                {selected.receiptUrl && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-text-muted">صورة الوصل</p>
                    <div
                      className="relative overflow-hidden rounded-2xl border border-border-light dark:border-white/10 cursor-pointer"
                      onClick={() => setImageExpanded((v) => !v)}
                    >
                      <img
                        src={convexFileUrl(selected.receiptUrl) || selected.receiptUrl}
                        alt="وصل التحويل"
                        className={`w-full object-cover transition-all duration-300 ${imageExpanded ? 'max-h-[500px]' : 'max-h-[180px]'}`}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-[10px] px-3 py-1 rounded-full">
                        {imageExpanded ? 'اضغط للتصغير' : 'اضغط للتكبير'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Transaction reference */}
                {selected.transactionReference && (
                  <div className="bg-white dark:bg-white/5 rounded-xl border border-border-light dark:border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-2">رقم المرجع / الوصل</p>
                    <p className="font-mono font-bold text-text-primary dark:text-white text-sm break-all">
                      {selected.transactionReference}
                    </p>
                  </div>
                )}

                {!selected.receiptUrl && !selected.transactionReference && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-amber-800 dark:text-amber-300 text-sm">
                    ⚠️ لم يتم إرفاق وصل أو رقم مرجع — تواصل مع المتبرع عبر واتساب.
                  </div>
                )}

                {/* Verification checklist */}
                <div className="bg-white dark:bg-white/5 rounded-2xl border border-border-light dark:border-white/10 p-4 space-y-3">
                  <p className="text-sm font-bold text-text-primary dark:text-white">قائمة التحقق</p>
                  {[
                    { key: 'amountMatches', label: 'المبلغ يطابق المبلغ المطلوب' },
                    { key: 'referenceVisible', label: 'رقم المرجع / الوصل مرئي وصحيح' },
                    { key: 'dateRecent', label: 'تاريخ العملية حديث (أقل من 7 أيام)' },
                  ].map((c) => (
                    <label key={c.key} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks[c.key]}
                        onChange={() => setChecks((prev) => ({ ...prev, [c.key]: !prev[c.key] }))}
                        className="w-5 h-5 accent-primary rounded"
                      />
                      <span className={`text-sm ${checks[c.key] ? 'text-text-primary dark:text-white font-semibold' : 'text-text-secondary'}`}>
                        {c.label}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Rejection reason */}
                <div>
                  <label className="block text-sm font-semibold text-text-secondary mb-2">
                    سبب الرفض (اختياري — للرجوع الداخلي)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={3}
                    placeholder="اشرح لماذا تم رفض هذا التجديد..."
                    className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary text-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer — action buttons */}
            <div className="p-4 border-t border-border-light dark:border-white/10 bg-white dark:bg-slate-900 flex gap-3">
              <button
                onClick={() => handleVerify(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 rounded-xl font-bold text-sm border-2 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '...' : 'رفض'}
              </button>
              <button
                onClick={() => handleVerify(true)}
                disabled={isSubmitting || !Object.values(checks).some(Boolean)}
                className="flex-[2] py-3 rounded-xl font-bold text-sm bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    جاري التفعيل...
                  </span>
                ) : 'قبول وتفعيل التجديد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
