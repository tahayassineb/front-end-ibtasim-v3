import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';

// ============================================
// ADMIN VERIFICATIONS — Split layout: pending list + detail panel
// ============================================

export default function AdminVerifications() {
  const { currentLanguage, showToast } = useApp();
  const lang = currentLanguage?.code || 'ar';

  const [searchQuery, setSearchQuery]       = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editedAmount, setEditedAmount]     = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationChecks, setChecks]     = useState({
    receiptClear:   false,
    amountMatches:  false,
    accountCorrect: false,
    dateRecent:     false,
    referenceVisible: false,
  });
  const [imageExpanded, setImageExpanded]   = useState(false);
  const [isSubmitting, setIsSubmitting]     = useState(false);

  // ── Convex ────────────────────────────────────────────────────────────────────
  const rawDonations        = useQuery(api.donations.getPendingVerifications, {});
  const verifyDonationMut   = useMutation(api.donations.verifyDonation);
  const rejectDonationMut   = useMutation(api.donations.rejectDonation);

  // ── Transform ─────────────────────────────────────────────────────────────────
  const donations = useMemo(() => {
    if (!rawDonations) return [];
    return rawDonations.map(d => ({
      id:               d._id,
      _id:              d._id,
      donor:            d.donorName || 'مجهول',
      phone:            d.donorPhone || '—',
      amount:           d.amount || 0,
      trxId:            `IB-${String(d._id).slice(-8).toUpperCase()}`,
      project:          (typeof d.projectTitle === 'string' ? d.projectTitle : d.projectTitle?.[lang] || d.projectTitle?.ar) || '—',
      paymentMethodRaw: d.paymentMethod,
      method:           d.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : d.paymentMethod === 'cash_agency' ? 'وكالة' : 'بطاقة',
      receiptImage:     d.receiptUrl || null,
      referenceNumber:  d.message || d.transactionReference || null,
      agencyName:       d.bankName || null,
      createdAt:        d.createdAt || Date.now(),
    }));
  }, [rawDonations, lang]);

  const filtered = donations.filter(d => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return d.donor.toLowerCase().includes(q) || d.trxId.toLowerCase().includes(q) || d.phone.includes(q);
  });

  const timeAgo = (ts) => {
    const h = Math.floor((Date.now() - ts) / 3600000);
    if (h < 1) return 'منذ قليل';
    if (h < 24) return `منذ ${h} ساعة`;
    return `منذ ${Math.floor(h / 24)} يوم`;
  };

  const handleSelect = (d) => {
    setSelectedDonation(d);
    setEditedAmount((d.amount / 100).toFixed(2));
    setRejectionReason('');
    setChecks({ receiptClear: false, amountMatches: false, accountCorrect: false, dateRecent: false, referenceVisible: false });
    setImageExpanded(false);
  };

  const handleVerify = async () => {
    if (!selectedDonation || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const ok = await verifyDonationMut({ donationId: selectedDonation._id, verified: true });
      if (!ok) { showToast('فشل التحقق', 'error'); return; }
      showToast('تم التحقق من التبرع بنجاح ✅', 'success');
      setSelectedDonation(null);
    } catch { showToast('حدث خطأ أثناء التحقق', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const handleReject = async () => {
    if (!selectedDonation || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await rejectDonationMut({ donationId: selectedDonation._id, reason: rejectionReason || undefined });
      showToast('تم رفض التبرع', 'error');
      setSelectedDonation(null);
    } catch { showToast('حدث خطأ أثناء الرفض', 'error'); }
    finally { setIsSubmitting(false); }
  };

  if (rawDonations === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'var(--font-arabic)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
          <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: '#0e1a1b', display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }} dir="rtl">

      {/* Left: pending list */}
      <div style={{ width: 360, borderLeft: '1px solid #E5E9EB', flexShrink: 0, overflowY: 'auto', background: 'white', display: 'flex', flexDirection: 'column' }}>
        {/* List header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>قائمة الانتظار</div>
          <div style={{ background: '#FEF3C7', color: '#b45309', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>
            {filtered.length} تحويل
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #E5E9EB' }}>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="ابحث..."
            style={{ width: '100%', height: 34, padding: '0 12px', border: '1.5px solid #E5E9EB', borderRadius: 8, fontSize: 13, fontFamily: 'var(--font-arabic)', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#0d7477'}
            onBlur={e => e.target.style.borderColor = '#E5E9EB'}
          />
        </div>

        {/* Items */}
        {filtered.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 14, fontWeight: 600 }}>تم التحقق من جميع التبرعات</p>
          </div>
        ) : filtered.map(d => (
          <div
            key={d._id}
            onClick={() => handleSelect(d)}
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #E5E9EB',
              cursor: 'pointer',
              borderRight: `4px solid ${selectedDonation?._id === d._id ? '#0d7477' : '#f59e0b'}`,
              background: selectedDonation?._id === d._id ? '#E6F4F4' : 'white',
              transition: 'all .15s',
            }}
            onMouseEnter={e => { if (selectedDonation?._id !== d._id) e.currentTarget.style.background = '#F0F7F7'; }}
            onMouseLeave={e => { if (selectedDonation?._id !== d._id) e.currentTarget.style.background = 'white'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{d.donor}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                {(d.amount / 100).toLocaleString('fr-MA')} د.م
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{d.project}</div>
            <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600, marginTop: 2 }}>{timeAgo(d.createdAt)}</div>
          </div>
        ))}
      </div>

      {/* Right: detail panel */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f6f8f8' }}>
        {!selectedDonation ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>اختر تحويلاً من القائمة للمراجعة</p>
          </div>
        ) : (
          <>
            {/* Donor info card */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9EB', fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                👤 معلومات المتبرع
              </div>
              <div style={{ padding: 20 }}>
                {[
                  ['الاسم', selectedDonation.donor],
                  ['الهاتف', selectedDonation.phone],
                  ['المشروع', selectedDonation.project],
                  ['المبلغ', `${(selectedDonation.amount / 100).toLocaleString('fr-MA')} درهم`],
                  ['رقم المرجع', `#${selectedDonation.trxId}`],
                  ['وقت الإرسال', new Date(selectedDonation.createdAt).toLocaleString('ar-MA')],
                ].map(([label, value], i, arr) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #E5E9EB' : 'none' }}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>{label}</div>
                    <div style={{ fontSize: label === 'المبلغ' ? 20 : 14, fontWeight: 700, textAlign: 'left', color: label === 'المبلغ' ? '#0A5F62' : '#0e1a1b', fontFamily: label === 'الهاتف' || label === 'رقم المرجع' ? 'Inter, sans-serif' : 'inherit' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Receipt card */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9EB', fontSize: 15, fontWeight: 700 }}>🧾 وصل التحويل المرفق</div>
              <div style={{ padding: 20 }}>
                {selectedDonation.receiptImage ? (
                  <img
                    src={convexFileUrl(selectedDonation.receiptImage) || selectedDonation.receiptImage}
                    alt="الوصل"
                    onClick={() => setImageExpanded(true)}
                    style={{ width: '100%', height: 240, objectFit: 'cover', borderRadius: 12, cursor: 'zoom-in', border: '1px solid #E5E9EB' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: 240, background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, border: '1px solid #E5E9EB' }}>
                    🧾
                  </div>
                )}
                {selectedDonation.referenceNumber && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#F0F7F7', borderRadius: 10, fontSize: 13, fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#0A5F62' }}>
                    Ref: {selectedDonation.referenceNumber}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {selectedDonation.receiptImage && (
                    <button onClick={() => setImageExpanded(true)}
                      style={{ flex: 1, height: 36, borderRadius: 10, background: '#F0F7F7', border: '1px solid #E5E9EB', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-arabic)' }}>
                      🔍 تكبير
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const url = convexFileUrl(selectedDonation.receiptImage);
                      if (!url) return;
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `receipt-${selectedDonation._id || 'doc'}.jpg`;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    style={{ flex: 1, height: 36, borderRadius: 10, background: '#E6F4F4', border: '1px solid #CCF0F0', color: '#0A5F62', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'var(--font-arabic)' }}>
                    ⬇ تحميل
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist card */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E9EB', fontSize: 15, fontWeight: 700 }}>📋 قائمة التحقق</div>
              <div style={{ padding: '0 20px' }}>
                {[
                  ['receiptClear',      'الوصل واضح وقابل للقراءة'],
                  ['amountMatches',     `المبلغ يطابق: ${(selectedDonation.amount / 100).toLocaleString('fr-MA')} درهم`],
                  ['accountCorrect',    'رقم الحساب المستفيد مطابق'],
                  ['dateRecent',        'تاريخ التحويل ضمن 48 ساعة'],
                  ['referenceVisible',  'الرقم المرجعي للعملية موجود'],
                ].map(([key, label], i, arr) => (
                  <label
                    key={key}
                    onClick={() => setChecks(prev => ({ ...prev, [key]: !prev[key] }))}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #E5E9EB' : 'none', cursor: 'pointer' }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 6, border: `2px solid ${verificationChecks[key] ? '#0d7477' : '#E5E9EB'}`,
                      background: verificationChecks[key] ? '#0d7477' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      color: 'white', fontSize: 12, fontWeight: 700,
                    }}>
                      {verificationChecks[key] ? '✓' : ''}
                    </div>
                    <div style={{ fontSize: 14 }}>{label}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Rejection note */}
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="سبب الرفض (سيُرسَل للمتبرع عبر واتساب)..."
              style={{ width: '100%', minHeight: 72, border: '1.5px solid #E5E9EB', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-arabic)', outline: 'none', resize: 'none', marginBottom: 16, boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = '#ef4444'}
              onBlur={e => e.target.style.borderColor = '#E5E9EB'}
            />

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleVerify}
                disabled={isSubmitting}
                style={{ flex: 1, height: 52, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'var(--font-arabic)', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? '⏳ جاري المعالجة...' : '✅ قبول التبرع وإرسال تأكيد واتساب'}
              </button>
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                style={{ flexShrink: 0, height: 52, padding: '0 20px', background: '#FEE2E2', color: '#dc2626', border: '1px solid #FCA5A5', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)' }}
              >
                ✗ رفض
              </button>
            </div>
          </>
        )}
      </div>

      {/* Full-screen image zoom */}
      {imageExpanded && selectedDonation?.receiptImage && (
        <div
          onClick={() => setImageExpanded(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.9)', backdropFilter: 'blur(4px)', cursor: 'zoom-out' }}
        >
          <button onClick={() => setImageExpanded(false)}
            style={{ position: 'absolute', top: 16, right: 16, color: 'rgba(255,255,255,.8)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 28 }}>✕</button>
          <img
            src={convexFileUrl(selectedDonation.receiptImage) || selectedDonation.receiptImage}
            alt="الوصل"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 12 }}
          />
        </div>
      )}
    </div>
  );
}