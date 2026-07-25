import React, { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import KafalaAvatar from '../../../components/kafala/KafalaAvatar';
import { getKafalaRenewCopy } from './kafalaRenewCopy';

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

function formatDate(ts, locale = 'ar-MA') {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

function monthsAgo(ts) {
  if (!ts) return 0;
  const diff = Date.now() - ts;
  return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24 * 30)));
}

export default function KafalaRenew() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: appUser, isAuthenticated, showToast, currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const tx = getKafalaRenewCopy(lang);
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const dir = currentLanguage?.dir || (lang === 'ar' ? 'rtl' : 'ltr');

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
    showToast(tx.copied, 'success');
  };

  // ── Auth guard ────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={dir}>
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0e1a1b', marginBottom: 20 }}>{tx.loginRequired}</p>
          <button onClick={() => navigate('/login')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>
            {tx.signIn}
          </button>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (kafalaData === undefined || sponsorship === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: K.kbg, fontFamily: 'var(--font-arabic)' }} dir={dir}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
          <p style={{ color: '#94a3b8' }}>{tx.loading}</p>
        </div>
      </div>
    );
  }

  if (!kafalaData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-arabic)' }}>
        <p style={{ color: '#94a3b8' }}>{tx.notFound}</p>
      </div>
    );
  }

  // ── Not the current sponsor ───────────────────────────────────────────────────
  if (!sponsorship) {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={dir}>
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0e1a1b', marginBottom: 20 }}>{tx.notSponsor}</p>
          <button onClick={() => navigate('/kafala')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>
            {tx.backKafala}
          </button>
        </div>
      </div>
    );
  }

  // ── Renewal already pending ───────────────────────────────────────────────────
  if (sponsorship.status === 'pending_payment') {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={dir}>
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#FFFBEB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 32 }}>⏳</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0e1a1b', marginBottom: 12 }}>{tx.pendingTitle}</h2>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>{tx.pendingBody}</p>
          <button onClick={() => navigate('/')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>
            {tx.backHome}
          </button>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={dir}>
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 40 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: K.kdark, marginBottom: 12 }}>{tx.successTitle}</h2>
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 28 }}>{tx.successBody}</p>
          <button onClick={() => navigate('/')}
            style={{ background: K.kdark, color: 'white', border: 'none', padding: '14px 40px', borderRadius: 16, fontWeight: 800, fontSize: 16, cursor: 'pointer', boxShadow: `0 4px 14px rgba(196,168,130,.35)`, fontFamily: 'var(--font-arabic)' }}>
            {tx.backHome}
          </button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────
  const kafala    = kafalaData;
  const photoUrl  = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const isAnnual = sponsorship.planType === 'annual';
  const priceValue = isAnnual ? Number(kafala.annualPrice || Math.round((kafala.monthlyPrice || 300) * 12 * 0.9)) : Number(kafala.monthlyPrice || 300);
  const priceMAD  = priceValue.toLocaleString(locale);
  const payMethod = sponsorship.paymentMethod; // bank_transfer | cash_agency

  const monthsCount  = monthsAgo(sponsorship._creationTime || sponsorship.createdAt);
  const periodCount = isAnnual ? Math.max(1, Math.ceil(monthsCount / 12)) : monthsCount;
  const periodLabel = isAnnual ? tx.year : tx.month;
  const periodPlural = isAnnual ? tx.yearsPeriod : tx.months;
  const totalSpent   = (periodCount * priceValue).toLocaleString(locale);
  const reportsCount = kafala.reports?.length || sponsorship.reportsCount || Math.min(Math.floor(monthsCount / 3), 3);

  const latestUpdate = kafala.latestUpdate || (kafala.updates ? kafala.updates[0] : null);

  const handleCancel = async () => {
    if (!window.confirm(tx.cancelConfirm)) return;
    setIsCancelling(true);
    try {
      const result = await cancelKafala({ sponsorshipId: sponsorship._id });
      if (result.success) {
        showToast(tx.cancelSuccess, 'success');
        navigate('/kafala');
      } else {
        showToast(result.error || tx.cancelFailed, 'error');
      }
    } catch {
      showToast(tx.cancelError, 'error');
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
      showToast(tx.receiptRequired, 'error');
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
      showToast(err?.message || tx.genericError, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F7', fontFamily: 'var(--font-arabic)', color: '#0e1a1b', display: 'flex', justifyContent: 'center' }} dir={dir}>
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>

        {/* Renewal hero */}
        <div style={{ background: 'linear-gradient(135deg,#3D2506,#8B6914,#C4A882)', padding: '28px 20px', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,.2)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={64} />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.7)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>🤲 {tx.active}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: 'white' }}>{kafala.name}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 2 }}>📍 {kafala.location} · {kafala.age} {tx.years}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,.15)', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, color: 'white', marginTop: 8 }}>
              🔥 {tx.continuous(periodCount, periodPlural)}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

          {/* Relationship stats */}
          <div style={{ background: K.kbg, borderRadius: 16, padding: 16, border: `1px solid ${K.k100}`, marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: K.kdark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.05em', fontFamily: 'Inter, sans-serif' }}>
              {tx.relationship(kafala.name)}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { num: periodCount, label: tx.periodsSponsored(periodPlural) },
                { num: totalSpent, label: tx.spent },
                { num: reportsCount, label: tx.reports },
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
              📸 {tx.latest(kafala.name)}
            </div>
            <div style={{ padding: '14px 16px' }}>
              {latestUpdate?.photo ? (
                <img src={convexFileUrl(latestUpdate.photo) || latestUpdate.photo} alt={tx.updateAlt} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, marginBottom: 12 }} />
              ) : (
                <div style={{ width: '100%', height: 140, background: `linear-gradient(135deg,${K.k100},${K.k})`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, marginBottom: 12 }}>
                  🎒
                </div>
              )}
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
                {latestUpdate?.text || tx.defaultUpdate(kafala.name)}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontFamily: 'Inter, sans-serif' }}>
                {latestUpdate ? formatDate(latestUpdate._creationTime || latestUpdate.date, locale) : tx.latestAvailable}
              </div>
            </div>
          </div>

          {/* Renewal CTA */}
          <div style={{ background: `linear-gradient(135deg,${K.kdark},${K.k})`, borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 4 }}>🔔 {tx.renewalDue}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', marginBottom: 16 }}>
              {tx.nextPeriod(periodCount + 1, periodLabel, priceMAD)}
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', height: 52, background: 'white', color: K.kdark, border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? `⏳ ${tx.sending}` : `🤲 ${tx.renewNow}`}
            </button>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.7)', fontSize: 12, cursor: isCancelling ? 'not-allowed' : 'pointer', marginTop: 10, textDecoration: 'underline', fontFamily: 'var(--font-arabic)', display: 'block', width: '100%', textAlign: 'center', opacity: isCancelling ? 0.5 : 1 }}
            >
              {isCancelling ? tx.cancelling : tx.cancel}
            </button>
          </div>

          {/* Payment proof section */}
          {payMethod === 'bank_transfer' && (
            <div style={{ marginBottom: 16 }}>
              {/* Bank details */}
              <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${K.k100}`, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ background: K.kdark, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{tx.bankDetails}</span>
                  <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 18 }}>🏦</span>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>{tx.accountHolder}</div>
                    <button onClick={() => copy(bankInfo.name)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: K.kbg, border: `1px solid ${K.k100}`, borderRadius: 12, padding: '10px 14px', cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#0e1a1b' }}>{bankInfo.name}</span>
                      <span style={{ fontSize: 16, color: K.kdark }}>📋</span>
                    </button>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>{tx.rib}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: K.kbg, border: `1px solid ${K.k100}`, borderRadius: 12, padding: '10px 14px' }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: K.kdark, fontFamily: 'monospace', letterSpacing: '.05em', flex: 1, direction: 'ltr', textAlign: 'left' }}>{bankInfo.rib}</span>
                      <button onClick={() => copy((bankInfo.rib || '').replace(/\s/g, ''))}
                        style={{ width: 36, height: 36, background: K.kdark, color: 'white', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 14 }}>
                        📋
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, paddingTop: 10, borderTop: `1px solid ${K.k100}` }}>
                    <span style={{ color: '#94a3b8' }}>{tx.bank}</span>
                    <span style={{ fontWeight: 600 }}>{bankInfo.bank}</span>
                  </div>
                </div>
              </div>

              {/* Receipt upload */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{tx.upload}</div>
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
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#16a34a' }}>{tx.uploaded}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{receipt.name}</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 28, marginBottom: 6, color: K.k }}>📄</div>
                      <div style={{ fontSize: 13, color: '#94a3b8' }}>{tx.choose}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>JPG، PNG، PDF</div>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                  onChange={(e) => setReceipt(e.target.files?.[0] || null)} />
              </div>

              {/* Reference input */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{tx.reference}</div>
                <input
                  type="text" placeholder={tx.referencePlaceholder}
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark }}>{tx.agencies}</div>
                    <div style={{ fontSize: 13, color: '#0e1a1b', fontWeight: 600 }}>Wafacash، Cash Plus</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6, borderTop: `1px solid ${K.k100}`, paddingTop: 12 }}>
                  {tx.agencyHelp}
                </p>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>{tx.reference}</div>
                <input
                  type="text" placeholder={tx.referencePlaceholder}
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
            <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark, marginBottom: 10 }}>📋 {tx.history}</div>
            {(sponsorship.renewals || []).slice(0, 3).map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E5E9EB' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{formatDate(r._creationTime || r.date, locale)}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{priceMAD} {tx.currency}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>✓ {tx.confirmed}</div>
              </div>
            ))}
            {(!sponsorship.renewals || sponsorship.renewals.length === 0) && (
              <>
                {[...Array(Math.min(monthsCount, 3))].map((_, i) => {
                  const d = new Date();
                  d.setMonth(d.getMonth() - (i + 1));
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #E5E9EB' }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{d.toLocaleDateString(locale, { year: 'numeric', month: 'long' })}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{priceMAD} {tx.currency}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>✓ {tx.confirmed}</div>
                    </div>
                  );
                })}
              </>
            )}
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <Link to="/profile" style={{ fontSize: 12, color: '#0d7477', cursor: 'pointer', textDecoration: 'none' }}>
                {tx.viewHistory}
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{ flexShrink: 0, padding: '14px 16px', background: 'white', borderTop: '1px solid #E5E9EB', display: 'flex', gap: 10 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 1, height: 52, background: K.kdark, color: 'white', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(196,168,130,.35)', fontFamily: 'var(--font-arabic)', opacity: submitting ? 0.7 : 1 }}
          >
            {submitting ? `⏳ ${tx.sending}` : `🤲 ${tx.renew(priceMAD)}`}
          </button>
          <button
            onClick={() => navigate(`/kafala/${id}`)}
            style={{ height: 52, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 14, fontSize: 13, fontWeight: 600, color: '#64748b', background: 'white', cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}
          >
            {tx.stop}
          </button>
        </div>

      </div>
    </div>
  );
}
