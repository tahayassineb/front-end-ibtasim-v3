import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

const COPY = {
  ar: { shareText: 'تبرعت لجمعية ابتسام! انضم إليّ في دعم مشاريع الخير 🤲', failed: 'فشل الدفع', failedBody: 'لم يتم معالجة دفعتك. يمكنك المحاولة مرة أخرى.', backHome: 'العودة إلى الموقع', checking: 'جار تأكيد الدفع', checkingBody: 'عدنا من بوابة الدفع، لكننا ما زلنا نتحقق من النتيجة النهائية. حدّث الصفحة خلال لحظات أو راجع ملفك الشخصي لاحقاً.', profile: 'ملفي الشخصي', thanks: 'شكراً لك!', confirmed: 'تم تأكيد الدفع بنجاح', credited: 'وسيُحتسب تبرعك مباشرة للمشروع', reference: 'رقم المرجع', currency: 'درهم', copyNumber: 'نسخ الرقم', status: 'حالة تبرعك', paymentSent: 'إرسال الدفع', now: 'تم الآن', cardConfirmed: 'تأكيد البطاقة', verified: 'تم التحقق', cardMatch: 'تمت مطابقة عملية الدفع مع تبرعك', approved: 'اعتماد التبرع', noManualCheck: 'لا يحتاج هذا التبرع إلى تحقق يدوي', complete: 'مكتمل', followUp: 'الإشعار والمتابعة', profileReview: 'يمكنك مراجعة التبرع من ملفك الشخصي', shortly: 'بعد لحظات', share: 'شارك معروفك مع الآخرين', whatsapp: 'واتساب', copyLink: 'نسخ الرابط', otherProjects: 'مشاريع أخرى' },
  fr: { shareText: 'J’ai fait un don à l’Association Ibtasim ! Rejoignez-moi pour soutenir ses projets solidaires 🤲', failed: 'Paiement échoué', failedBody: 'Votre paiement n’a pas pu être traité. Vous pouvez réessayer.', backHome: 'Retour au site', checking: 'Confirmation du paiement', checkingBody: 'Nous sommes de retour du prestataire de paiement et vérifions encore le résultat final. Actualisez la page dans quelques instants ou consultez votre profil plus tard.', profile: 'Mon profil', thanks: 'Merci !', confirmed: 'Votre paiement a été confirmé', credited: 'Votre don sera directement attribué au projet', reference: 'Référence', currency: 'MAD', copyNumber: 'Copier le numéro', status: 'Statut de votre don', paymentSent: 'Paiement envoyé', now: 'À l’instant', cardConfirmed: 'Carte confirmée', verified: 'Vérifié', cardMatch: 'Le paiement a été associé à votre don', approved: 'Don approuvé', noManualCheck: 'Ce don ne nécessite pas de vérification manuelle', complete: 'Terminé', followUp: 'Notification et suivi', profileReview: 'Vous pouvez consulter ce don depuis votre profil', shortly: 'Dans quelques instants', share: 'Partagez votre geste solidaire', whatsapp: 'WhatsApp', copyLink: 'Copier le lien', otherProjects: 'Autres projets' },
  en: { shareText: 'I donated to Association Ibtasim! Join me in supporting its charitable projects 🤲', failed: 'Payment failed', failedBody: 'Your payment could not be processed. Please try again.', backHome: 'Back to site', checking: 'Confirming payment', checkingBody: 'We are back from the payment provider and are still confirming the final result. Refresh this page in a moment or check your profile later.', profile: 'My profile', thanks: 'Thank you!', confirmed: 'Your payment has been confirmed', credited: 'Your donation will be credited directly to the project', reference: 'Reference number', currency: 'MAD', copyNumber: 'Copy number', status: 'Your donation status', paymentSent: 'Payment sent', now: 'Just now', cardConfirmed: 'Card confirmed', verified: 'Verified', cardMatch: 'Your payment has been matched to your donation', approved: 'Donation approved', noManualCheck: 'This donation does not require manual verification', complete: 'Complete', followUp: 'Notification and follow-up', profileReview: 'You can review this donation from your profile', shortly: 'In a few moments', share: 'Share your good deed', whatsapp: 'WhatsApp', copyLink: 'Copy link', otherProjects: 'Other projects' },
};

// ============================================
// DONATE SUCCESS PAGE
// Shown when FRONTEND_URL is set and Whop redirects here after card payment.
// URL params: paid=true, donationId=xxx, amount=xxx
// ============================================

const useViewportWidth = () => {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return width;
};

export default function DonateSuccess() {
  const { language } = useApp();
  const tx = COPY[language] || COPY.ar;
  const vw = useViewportWidth();
  const containerMaxWidth = vw >= 1024 ? 720 : vw >= 640 ? 560 : 430;

  const [searchParams] = useSearchParams();
  const paidParam = searchParams.get('paid');
  const donationId = searchParams.get('donationId') || '';
  const amount = searchParams.get('amount') || '';
  const paymentId = searchParams.get('paymentId') || searchParams.get('payment_id') || '';
  const checkoutStatus = (searchParams.get('checkout_status') || searchParams.get('status') || '').toLowerCase();
  const successStatuses = new Set(['success', 'complete', 'completed']);
  const explicitFailure = paidParam === 'false' || (checkoutStatus && !successStatuses.has(checkoutStatus));
  const paid = paidParam === 'true' || successStatuses.has(checkoutStatus) || Boolean(donationId);

  const handleShare = (platform) => {
    const text = tx.shareText;
    const url = window.location.origin;
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    else navigator.clipboard?.writeText(url);
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(donationId);
  };

  if (explicitFailure) {
    return (
      <div style={{ minHeight: '100vh', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>{tx.failed}</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.7 }}>{tx.failedBody}</p>
          <Link to="/" style={{ display: 'inline-block', background: '#0d7477', color: 'white', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            {tx.backHome}
          </Link>
        </div>
      </div>
    );
  }

  if (!paid) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.08)', padding: 48, maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>⏳</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0d7477', marginBottom: 8 }}>{tx.checking}</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.8 }}>
            {tx.checkingBody}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/profile" style={{ display: 'inline-block', background: '#0d7477', color: 'white', padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              {tx.profile}
            </Link>
            <Link to="/" style={{ display: 'inline-block', background: '#F0F7F7', color: '#0d7477', padding: '12px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              {tx.backHome}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F7', fontFamily: 'var(--font-arabic)', color: '#0e1a1b', display: 'flex', justifyContent: 'center' }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div style={{ width: '100%', maxWidth: containerMaxWidth, minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>

        {/* Success hero */}
        <div style={{ background: 'linear-gradient(160deg,#0A5F62,#0d7477,#33C0C0)', padding: '48px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', bottom: -60, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '3px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✅</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>{tx.thanks}</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
              {tx.confirmed}<br />{tx.credited}
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Confetti bar */}
          <div style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4, padding: '12px 0' }}>🎉 🤲 🌟 ❤️ 🎊</div>

          {/* Reference card */}
          <div style={{ margin: '0 16px 16px', background: '#F0F7F7', borderRadius: 16, padding: 16, border: '1px solid #CCF0F0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>{tx.reference}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0A5F62', fontFamily: 'Inter, sans-serif', letterSpacing: '.05em' }}>#{donationId.slice(-8).toUpperCase() || '--------'}</div>
            {amount && (
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0d7477', fontFamily: 'Inter, sans-serif', marginTop: 8 }}>{amount} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>{tx.currency}</span></div>
            )}
            {paymentId && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 8, fontFamily: 'Inter, sans-serif' }}>
                Whop: {paymentId}
              </div>
            )}
            <button onClick={handleCopyRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#0d7477', background: 'white', padding: '4px 12px', borderRadius: 100, cursor: 'pointer', marginTop: 8, border: '1px solid #CCF0F0', fontFamily: 'var(--font-arabic)' }}>
              📋 {tx.copyNumber}
            </button>
          </div>

          {/* Status timeline */}
          <div style={{ margin: '0 16px 16px', background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E9EB', fontSize: 13, fontWeight: 700 }}>📊 {tx.status}</div>
            {[
              { dot: 'done', name: tx.paymentSent, time: `✓ ${tx.now}`, desc: null },
              { dot: 'done', name: tx.cardConfirmed, time: `✓ ${tx.verified}`, desc: tx.cardMatch },
              { dot: 'done', name: tx.approved, desc: tx.noManualCheck, time: `✓ ${tx.complete}` },
              { dot: 'active', name: tx.followUp, desc: tx.profileReview, time: tx.shortly },
            ].map((s, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', position: 'relative' }}>
                {i < arr.length - 1 && (
                  <div style={{ position: 'absolute', right: 26, top: 42, bottom: -12, width: 2, background: '#E5E9EB' }} />
                )}
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700,
                  background: s.dot === 'done' ? '#D1FAE5' : s.dot === 'active' ? '#E6F4F4' : '#E5E9EB',
                  border: `2px solid ${s.dot === 'done' ? '#16a34a' : s.dot === 'active' ? '#0d7477' : '#E5E9EB'}`,
                  color: s.dot === 'done' ? '#16a34a' : s.dot === 'active' ? '#0d7477' : '#94a3b8',
                }}>
                  {s.dot === 'done' ? '✓' : s.dot === 'active' ? '⏳' : i + 1}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{s.name}</div>
                  {s.desc && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.desc}</div>}
                  {s.time && <div style={{ fontSize: 11, fontWeight: 600, color: s.dot === 'done' ? '#16a34a' : '#0d7477', marginTop: 2 }}>{s.time}</div>}
                </div>
              </div>
            ))}
          </div>

          {/* Share + actions */}
          <div style={{ margin: '0 16px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>{tx.share}</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button onClick={() => handleShare('whatsapp')}
                style={{ flex: 1, height: 44, border: '1.5px solid #25D366', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#25D366', fontFamily: 'var(--font-arabic)' }}>
                💬 {tx.whatsapp}
              </button>
              <button onClick={() => handleShare('copy')}
                style={{ flex: 1, height: 44, border: '1.5px solid #33C0C0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#0d7477', fontFamily: 'var(--font-arabic)' }}>
                🔗 {tx.copyLink}
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/profile"
                style={{ flex: 1, height: 48, border: '1.5px solid #E5E9EB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'white', color: '#0e1a1b', textDecoration: 'none', fontFamily: 'var(--font-arabic)' }}>
                📋 {tx.profile}
              </Link>
              <Link to="/projects"
                style={{ flex: 1, height: 48, background: '#0d7477', border: 'none', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'white', textDecoration: 'none', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'var(--font-arabic)' }}>
                🔍 {tx.otherProjects}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
