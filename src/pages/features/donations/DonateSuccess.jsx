import React from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

// ============================================
// DONATE SUCCESS PAGE
// Shown when FRONTEND_URL is set and Whop redirects here after card payment.
// URL params: paid=true, donationId=xxx, amount=xxx
// ============================================

export default function DonateSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentLanguage } = useApp();

  const paid = searchParams.get('paid') === 'true';
  const donationId = searchParams.get('donationId') || '';
  const amount = searchParams.get('amount') || '';

  const handleShare = (platform) => {
    const text = 'تبرعت لجمعية ابتسام! انضم إليّ في دعم مشاريع الخير 🤲';
    const url = window.location.origin;
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    else navigator.clipboard?.writeText(url);
  };

  const handleCopyRef = () => {
    navigator.clipboard?.writeText(donationId);
  };

  if (!paid) {
    return (
      <div style={{ minHeight: '100vh', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir="rtl">
        <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 10px 15px rgba(0,0,0,.1)', padding: 48, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginBottom: 8 }}>فشل الدفع</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.7 }}>لم يتم معالجة دفعتك. يمكنك المحاولة مرة أخرى.</p>
          <Link to="/" style={{ display: 'inline-block', background: '#0d7477', color: 'white', padding: '12px 32px', borderRadius: 14, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
            العودة إلى الموقع
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F7', fontFamily: 'var(--font-arabic)', color: '#0e1a1b', display: 'flex', justifyContent: 'center' }} dir="rtl">
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>

        {/* Success hero */}
        <div style={{ background: 'linear-gradient(160deg,#0A5F62,#0d7477,#33C0C0)', padding: '48px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
          <div style={{ position: 'absolute', bottom: -60, right: -30, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,.04)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '3px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>✅</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 8 }}>شكراً لك!</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
              تم إرسال تبرعك بنجاح<br />وسيصل كاملاً للمشروع
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {/* Confetti bar */}
          <div style={{ textAlign: 'center', fontSize: 24, letterSpacing: 4, padding: '12px 0' }}>🎉 🤲 🌟 ❤️ 🎊</div>

          {/* Reference card */}
          <div style={{ margin: '0 16px 16px', background: '#F0F7F7', borderRadius: 16, padding: 16, border: '1px solid #CCF0F0', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '.08em' }}>رقم المرجع</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0A5F62', fontFamily: 'Inter, sans-serif', letterSpacing: '.05em' }}>#{donationId.slice(-8).toUpperCase() || '--------'}</div>
            {amount && (
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0d7477', fontFamily: 'Inter, sans-serif', marginTop: 8 }}>{amount} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>درهم</span></div>
            )}
            <button onClick={handleCopyRef} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#0d7477', background: 'white', padding: '4px 12px', borderRadius: 100, cursor: 'pointer', marginTop: 8, border: '1px solid #CCF0F0', fontFamily: 'var(--font-arabic)' }}>
              📋 نسخ الرقم
            </button>
          </div>

          {/* Status timeline */}
          <div style={{ margin: '0 16px 16px', background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #E5E9EB', fontSize: 13, fontWeight: 700 }}>📊 حالة تبرعك</div>
            {[
              { dot: 'done', name: 'إرسال التبرع', time: '✓ تم الآن', desc: null },
              { dot: 'active', name: 'التحقق من الدفع', time: 'خلال 24 ساعة', desc: 'يراجع فريقنا تفاصيل الدفع' },
              { dot: 'pending', name: 'اعتماد التبرع', desc: 'إشعار واتساب عند الاعتماد', time: null },
              { dot: 'pending', name: 'التحويل للمشروع', desc: 'يُضاف للرصيد الإجمالي', time: null },
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
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 10 }}>شارك معروفك مع الآخرين</div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <button onClick={() => handleShare('whatsapp')}
                style={{ flex: 1, height: 44, border: '1.5px solid #25D366', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#25D366', fontFamily: 'var(--font-arabic)' }}>
                💬 واتساب
              </button>
              <button onClick={() => handleShare('copy')}
                style={{ flex: 1, height: 44, border: '1.5px solid #33C0C0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'white', color: '#0d7477', fontFamily: 'var(--font-arabic)' }}>
                🔗 نسخ الرابط
              </button>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/profile"
                style={{ flex: 1, height: 48, border: '1.5px solid #E5E9EB', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'white', color: '#0e1a1b', textDecoration: 'none', fontFamily: 'var(--font-arabic)' }}>
                📋 ملفي الشخصي
              </Link>
              <Link to="/projects"
                style={{ flex: 1, height: 48, background: '#0d7477', border: 'none', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 700, cursor: 'pointer', color: 'white', textDecoration: 'none', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'var(--font-arabic)' }}>
                🔍 مشاريع أخرى
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}