import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BORDER  = '#E5E9EB';
const PRIMARY = '#0d7477';
const P600    = '#0A5F62';
const P50     = '#E6F4F4';
const P100    = '#CCF0F0';
const TEXT2   = '#64748b';
const TEXTM   = '#94a3b8';
const SHADOW_P = '0 4px 14px rgba(13,116,119,.25)';

const fieldInput = {
  width: '100%', height: 50, border: `1.5px solid ${BORDER}`, borderRadius: 14,
  padding: '0 16px', fontSize: 15, fontFamily: 'Tajawal, sans-serif',
  color: '#0e1a1b', outline: 'none', transition: 'border-color .15s', boxSizing: 'border-box',
};

const ROLES = [
  { key: 'admin',     icon: '🛡️', label: 'مدير',   desc: 'صلاحيات كاملة' },
  { key: 'viewer',    icon: '👁️', label: 'مراجع',  desc: 'عرض فقط' },
  { key: 'verifier',  icon: '✅', label: 'محقق',   desc: 'تحقق التبرعات' },
];

export default function AdminRegister() {
  const { token } = useParams();
  const navigate = useNavigate();

  // ── Convex ────────────────────────────────────────────────────────────────
  const validation       = useQuery(api.admin.validateInvitationToken, { token: token || '' });
  const acceptInvitation = useMutation(api.admin.acceptAdminInvitation);

  // ── Form state ────────────────────────────────────────────────────────────
  const [fullName, setFullName]             = useState('');
  const [phone, setPhone]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [role, setRole]                     = useState('admin');
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState('');

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim())         { setError('الاسم مطلوب'); return; }
    if (password.length < 8)      { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (password !== confirmPassword) { setError('كلمتا المرور غير متطابقتان'); return; }
    setIsLoading(true);
    try {
      const result = await acceptInvitation({ token: token || '', fullName: fullName.trim(), password });
      if (result.success) {
        navigate('/admin/login', { state: { message: 'تم إنشاء الحساب بنجاح. يمكنك الآن تسجيل الدخول.' } });
      } else {
        setError(result.message || 'فشل إنشاء الحساب');
      }
    } catch (err) {
      setError(err.message || 'حدث خطأ. يرجى المحاولة مجدداً.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (validation === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F7F7', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
          <p style={{ color: TEXTM }}>جاري التحقق من الدعوة...</p>
        </div>
      </div>
    );
  }

  // ── Invalid invitation ────────────────────────────────────────────────────
  if (!validation.valid) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F7F7', fontFamily: 'Tajawal, sans-serif', padding: 20 }}>
        <div style={{ background: 'white', borderRadius: 24, padding: 40, maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,.12)' }} dir="rtl">
          <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>رابط غير صالح</h1>
          <p style={{ fontSize: 14, color: TEXT2, marginBottom: 24 }}>{validation.reason}</p>
          <Link to="/admin/login" style={{ color: PRIMARY, fontWeight: 600, fontSize: 14 }}>العودة لتسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F7F7', fontFamily: 'Tajawal, sans-serif', padding: '40px 20px' }}>
      <div style={{ background: 'white', borderRadius: 24, boxShadow: '0 24px 60px rgba(0,0,0,.12),0 0 0 1px rgba(0,0,0,.05)', width: '100%', maxWidth: 460, overflow: 'hidden' }} dir="rtl">

        {/* ── Dark teal header ── */}
        <div style={{ background: 'linear-gradient(135deg,#010C0D,#0A5F62)', padding: '32px 32px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          {/* Decorative circle */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.05)', pointerEvents: 'none' }} />
          {/* Logo mark */}
          <div style={{ width: 52, height: 52, background: 'white', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: P600, margin: '0 auto 14px', position: 'relative', zIndex: 1 }}>
            ا
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'white', position: 'relative', zIndex: 1 }}>انضم لفريق إدارة ابتسام</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 4, position: 'relative', zIndex: 1 }}>هذه الصفحة متاحة بدعوة خاصة فقط</div>
        </div>

        {/* ── Invitation banner ── */}
        {validation.inviterName && (
          <div style={{ margin: '20px 24px', background: P50, borderRadius: 12, padding: 14, border: `1.5px solid ${P100}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>✉️</span>
            <div style={{ fontSize: 13, color: TEXT2, lineHeight: 1.5 }}>
              دُعيت من قِبل <strong>{validation.inviterName}</strong> للانضمام كعضو في فريق الإدارة.
              {validation.code && (
                <>
                  {' '}رمز الدعوة: <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, color: P600, background: 'white', padding: '2px 8px', borderRadius: 6, border: `1px solid ${P100}` }}>{validation.code}</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Form body ── */}
        <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>

          {/* Full name */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7 }}>الاسم الكامل <span style={{ color: '#ef4444' }}>*</span></div>
            <input style={fieldInput} type="text" placeholder="أدخل اسمك الكامل" value={fullName} onChange={e => setFullName(e.target.value)}
              onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7 }}>رقم الهاتف</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ height: 50, padding: '0 14px', background: '#F0F7F7', border: `1.5px solid ${BORDER}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>
                🇲🇦 +212
              </div>
              <input style={{ ...fieldInput, direction: 'ltr', fontFamily: 'Inter, sans-serif', fontSize: 16 }} type="tel" placeholder="661234567" value={phone} onChange={e => setPhone(e.target.value)}
                onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7 }}>كلمة المرور <span style={{ color: '#ef4444' }}>*</span></div>
            <div style={{ position: 'relative' }}>
              <input style={fieldInput} type={showPassword ? 'text' : 'password'} placeholder="••••••••••" value={password} onChange={e => setPassword(e.target.value)}
                onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
              <button type="button" onClick={() => setShowPassword(s => !s)}
                style={{ position: 'absolute', top: '50%', left: 14, transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Confirm password */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7 }}>تأكيد كلمة المرور <span style={{ color: '#ef4444' }}>*</span></div>
            <input style={fieldInput} type="password" placeholder="••••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              onFocus={e => e.target.style.borderColor = PRIMARY} onBlur={e => e.target.style.borderColor = BORDER} />
          </div>

          {/* Role selection */}
          <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 10 }}>الدور في الفريق</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {ROLES.map(({ key, icon, label, desc }) => (
              <div key={key} onClick={() => setRole(key)}
                style={{ flex: 1, border: `2px solid ${role === key ? PRIMARY : BORDER}`, borderRadius: 14, padding: 12, textAlign: 'center', cursor: 'pointer', background: role === key ? P50 : 'white', transition: 'all .15s' }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 11, color: TEXTM, marginTop: 2 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEE2E2', color: '#dc2626', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div style={{ height: 1, background: BORDER, margin: '16px 0' }} />

          {/* Submit */}
          <button type="submit" disabled={isLoading}
            style={{ width: '100%', height: 52, background: PRIMARY, color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: SHADOW_P, fontFamily: 'Tajawal, sans-serif', opacity: isLoading ? 0.7 : 1 }}>
            {isLoading ? '...' : '✅ إنشاء الحساب'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: TEXT2, marginTop: 12 }}>
            لديك حساب؟{' '}
            <Link to="/admin/login" style={{ color: PRIMARY, fontWeight: 600 }}>تسجيل الدخول</Link>
          </div>

          <div style={{ textAlign: 'center', fontSize: 11, color: TEXTM, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            🔒 <span>بياناتك محمية بتشفير SSL 256-bit</span>
          </div>
        </form>
      </div>
    </div>
  );
}
