import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import KafalaAvatar from '../../../components/kafala/KafalaAvatar';

// ============================================
// KAFALA RENEW — Monthly renewal page for bank/cash sponsors
// Route: /kafala/:id/renew  (:id = kafalaId)
// ============================================

const K = {
  kdark: '#8B6914',
  k: '#C4A882',
  kbg: '#F5EBD9',
  k100: '#E8D4B0',
};

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });
}

function monthsAgo(ts) {
  if (!ts) return 0;
  const diff = Date.now() - ts;
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 30)));
}

export default function KafalaRenew() {
  const { id } = useParams();
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

  // ── Mutations / Actions ─────────────────────────────────────────────────────
  const renewMut          = useMutation(api.kafala.renewKafalaDonation);
  const uploadReceiptMut  = useMutation(api.kafala.uploadKafalaReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const cancelKafala      = useAction(api.kafalaPayments.cancelKafalaSubscription);

  // ── Local state ──────────────────────────────────────────────────────────────
  const [receipt, setReceipt]         = useState(null);
  const [reference, setReference]     = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [dragActive, setDragActive]   = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const fileRef = useRef();

  // ── Derived ──────────────────────────────────────────────────────────────────
  const bankInfo = React.useMemo(() => {
    if (!bankInfoRaw) return { name: '—', rib: '—', bank: '—' };
    try { return JSON.parse(bankInfoRaw); } catch { return { name: '—', rib: '—', bank: '—' }; }
  }, [bankInfoRaw]);

  const copy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('تم النسخ', 'success');
  };

  // ── Auth guard ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0e1a1b', marginBottom: 20 }}>يجب تسجيل الدخول للوصول إلى هذه الصفحة.</p>
          <button onClick={() => navigate('/login')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (kafalaData === undefined || sponsorship === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: K.kbg, fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
          <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!kafalaData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>
        <p style={{ color: '#94a3b8' }}>الكفالة غير موجودة</p>
      </div>
    );
  }

  // ── Not the current sponsor ───────────────────────────────────────────────────
  if (!sponsorship) {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0e1a1b', marginBottom: 20 }}>أنت لست الكافل الحالي لهذا اليتيم.</p>
          <button onClick={() => navigate('/kafala')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            العودة للكفالات
          </button>
        </div>
      </div>
    );
  }

  // ── Renewal already pending ───────────────────────────────────────────────────
  if (sponsorship.status === 'pending_payment') {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#FFFBEB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>⏳</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0e1a1b', marginBottom: 12 }}>طلب قيد المراجعة</h2>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>يوجد طلب تجديد قيد المراجعة. سيتواصل معك الفريق قريباً.</p>
          <button onClick={() => navigate('/')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 40 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: K.kdark, marginBottom: 12 }}>تم إرسال طلب التجديد!</h2>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>سيراجع فريقنا الوصل ويؤكد تجديد كفالتك خلال 24 ساعة. جزاك الله خيراً.</p>
          <button onClick={() => navigate('/')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '14px 40px', borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 4px 14px rgba(196,168,130,.35)`, fontFamily: 'Tajawal, sans-serif' }}>
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  const kafala    = kafalaData;
  const photoUrl  = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceMAD  = ((kafala.monthlyPrice || 30000) / 100).toLocaleString('fr-MA');
  const payMethod = sponsorship.paymentMethod; // bank_transfer | cash_agency

  const monthsCount  = monthsAgo(sponsorship._creationTime || sponsorship.createdAt);
  const totalSpent   = (monthsCount * (kafala.monthlyPrice || 30000) / 100).toLocaleString('fr-MA');
  const reportsCount = kafala.reports?.length || sponsorship.reportsCount || Math.min(Math.floor(monthsCount / 3), 3);

  const latestUpdate = kafala.latestUpdate || (kafala.updates ? kafala.updates[0] : null);

  const handleCancel = async () => {
    if (!window.confirm('هل أنت متأكد من إلغاء الكفالة؟ سيتوقف الدعم الشهري لهذا اليتيم.')) return;
    setIsCancelling(true);
    try {
      const result = await cancelKafala({ sponsorshipId: sponsorship._id });
      if (result.success) {
        showToast('تم إلغاء الكفالة بنجاح', 'success');
        navigate('/kafala');
      } else {
        showToast(result.error || 'فشل إلغاء الكفالة', 'error');
      }
    } catch (e) {
      showToast('حدث خطأ أثناء الإلغاء', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setReceipt(file);
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if ((payMethod === 'bank_transfer' || payMethod === 'cash_agency') && !receipt && !reference.trim()) {
      showToast('يجب إرفاق وصل الدفع أو إدخال رقم المرجع', 'error');
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
      showToast(err?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F7', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', display: 'flex', justifyContent: 'center' }} dir="rtl">
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>

        {/* Renewal hero */}
        <div style={{ background: 'linear-gradient(135deg,#3D2506,#8B6914,#C4A882)', padding: '28px 20px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={64} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>🤲 كفالتك النشطة</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{kafala.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>📍 {kafala.location} · {kafala.age} سنوات</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.15)', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'white', marginTop: 8 }}>
              🔥 {monthsCount} أشهر متواصلة
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* Relationship stats */}
          <div style={{ background: K.kbg, borderRadius: 16, padding: 16, border: `1px solid ${K.k100}`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: K.kdark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'Inter, sans-serif' }}>
              علاقتك مع {kafala.name}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { num: monthsCount, label: 'أشهر كفالة' },
                { num: totalSpent, label: 'د.م أنفقت' },
                { num: reportsCount, label: 'تقارير وصلت' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest update card */}
          <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${K.k100}`, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ background: `linear-gradient(90deg,${K.kbg},white)`, padding: '12px 16px', borderBottom: `1px solid ${K.k100}`, fontSize: 13, fontWeight: 700, color: K.kdark }}>
              📸 آخر تحديث عن {kafala.name}
            </div>
            <div style={{ padding: '14px 16px' }}>
              {latestUpdate?.photo ? (
                <img src={convexFileUrl(latestUpdate.photo) || latestUpdate.photo} alt="تحديث" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
              ) : (
                <div style={{ width: '100%', height: 140, background: `linear-gradient(135deg,${K.k100},${K.k})`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 12 }}>
                  🎒
                </div>
              )}
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                {latestUpdate?.text || `${kafala.name} بخير بفضل دعمك المستمر. فريقنا يتابع وضعه عن كثب ويحرص على توفير أفضل الظروف له.`}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontFamily: 'Inter, sans-serif' }}>
                {latestUpdate ? formatDate(latestUpdate._creationTime || latestUpdate.date) : 'آخر تحديث متاح'}
              </div>
            </div>
          </div>

          {/* Renewal CTA */}
          <div style={{ background: `linear-gradient(135deg,${K.kdark},${K.k})`, borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 4 }}>🔔 موعد تجديد كفالتك</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginBottom: 16 }}>
              الشهر {monthsCount + 1} — {priceMAD} درهم
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', height: 52, background: 'white', color: K.kdark, border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? '⏳ جاري الإرسال...' : '🤲 جدّد الكفالة الآن'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 12, cursor: isCancelling ? 'not-allowed' : 'pointer', marginTop: 10, textDecoration: 'underline', fontFamily: 'Tajawal, sans-serif', display: 'block', width: '100%', textAlign: 'center', opacity: isCancelling ? 0.5 : 1 }}
            >
              {isCancelling ? 'جاري الإلغاء...' : 'إيقاف مؤقت أو إلغاء الكفالة'}
            </button>
          </div>

          {/* Payment proof section */}
          {payMethod === 'bank_transfer' && (
            <div style={{ marginBottom: 16 }}>
              {/* Bank details */}
              <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${K.k100}`, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ background: K.kdark, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>بيانات الحساب البنكي</span>
                  <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 18 }}>🏦</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>صاحب الحساب</div>
                    <button onClick={() => copy(bankInfo.name)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: K.kbg, border: `1px solid ${K.k100}`, borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0e1a1b' }}>{bankInfo.name}</span>
                      <span style={{ fontSize: 16, color: K.kdark }}>📋</span>
                    </button>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>رقم الحساب (RIB)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: K.kbg, border: `1px solid ${K.k100}`, borderRadius: 12, padding: '10px 14px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: K.kdark, fontFamily: 'monospace', letterSpacing: '.05em', flex: 1, direction: 'ltr', textAlign: 'left' }}>{bankInfo.rib}</span>
                      <button onClick={() => copy((bankInfo.rib || '').replace(/\s/g, ''))}
                        style={{ width: 36, height: 36, background: K.kdark, color: 'white', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 14 }}>
                        📋
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, paddingTop: 10, borderTop: `1px solid ${K.k100}` }}>
                    <span style={{ color: '#94a3b8' }}>البنك</span>
                    <span style={{ fontWeight: 600 }}>{bankInfo.bank}</span>
                  </div>
                </div>
              </div>

              {/* Receipt upload */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>رفع وصل الدفع</div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragActive ? K.kdark : K.k}`,
                    borderRadius: 12,
                    padding: '32px 16px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: dragActive ? K.kbg : 'white',
                    transition: 'all .2s',
                  }}
                >
                  {receipt ? (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>تم رفع الوصل</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{receipt.name}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6, color: K.k }}>📄</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>اختر ملفاً أو اسحبه هنا</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>JPG، PNG، PDF</div>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                  onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
              </div>

              {/* Reference input */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>رقم المرجع / الوصل</div>
                <input
                  type="text" placeholder="أدخل رقم العملية من الوصل"
                  value={reference} onChange={(e) => setReference(e.target.value)}
                  style={{ width: '100%', border: `1.5px solid ${K.k100}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', background: 'white', direction: 'ltr', textAlign: 'left' }}
                  onFocus={(e) => e.target.style.borderColor = K.kdark}
                  onBlur={(e) => e.target.style.borderColor = K.k100}
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {payMethod === 'cash_agency' && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${K.k100}`, padding: 16, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 40, height: 40, background: K.kbg, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>🏪</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark }}>الوكالات المتاحة</div>
                    <div style={{ fontSize: 13, color: '#0e1a1b', fontWeight: 600 }}>Wafacash، Cash Plus</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, borderTop: `1px solid ${K.k100}`, paddingTop: 12 }}>
                  بعد الدفع في الوكالة، أدخل رقم المرجع الخاص بمعاملتك أدناه للتحقق.
                </p>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>رقم المرجع / الوصل</div>
                <input
                  type="text" placeholder="أدخل رقم العملية من الوصل"
                  value={reference} onChange={(e) => setReference(e.target.value)}
                  style={{ width: '100%', border: `1.5px solid ${K.k100}`, borderRadius: 12, padding: '12px 14px', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', background: 'white', direction: 'ltr', textAlign: 'left' }}
                  onFocus={(e) => e.target.style.borderColor = K.kdark}
                  onBlur={(e) => e.target.style.borderColor = K.k100}
                  dir="ltr"
                />
              </div>
            </div>
          )}

          {/* Payment history */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark, marginBottom: 10 }}>📋 سجل مدفوعاتك</div>
            {(sponsorship.renewals || []).slice(0, 3).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E5E9EB' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(r._creationTime || r.date)}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{((kafala.monthlyPrice || 30000) / 100).toLocaleString('fr-MA')} د.م</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>✓ مؤكد</div>
              </div>
            ))}
            {(!sponsorship.renewals || sponsorship.renewals.length === 0) && (
              <>
                {[...Array(Math.min(monthsCount, 3))].map((_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - (i + 1));
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E5E9EB' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.toLocaleDateString('ar-MA', { year: 'numeric', month: 'long' })}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{priceMAD} د.م</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>✓ مؤكد</div>
                    </div>
                  );
                })}
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <Link to="/profile" style={{ fontSize: 12, color: '#0d7477', cursor: 'pointer', textDecoration: 'none' }}>
                عرض كل السجل ←
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ flexShrink: 0, padding: '14px 16px', background: 'white', borderTop: '1px solid #E5E9EB', display: 'flex', gap: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 1, height: 52, background: K.kdark, color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(196,168,130,.35)', fontFamily: 'Tajawal, sans-serif', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? '⏳ جاري الإرسال...' : `🤲 تجديد — ${priceMAD} درهم`}
          </button>
          <button
            onClick={() => navigate(`/kafala/${id}`)}
            style={{ height: 52, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 14, fontSize: 13, fontWeight: 600, color: '#64748b', background: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
          >
            إيقاف
          </button>
        </div>

      </div>
    </div>
  );
}
