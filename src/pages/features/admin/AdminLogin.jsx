import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';

// ============================================
// ADMIN LOGIN — Split layout: dark teal left + white form right
// ============================================

export default function AdminLogin() {
  const { login } = useApp();
  const navigate = useNavigate();
  const loginAdmin = useMutation(api.auth.loginAdmin);

  const [formData, setFormData] = useState({ email: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('جميع الحقول مطلوبة');
      return;
    }
    setLoading(true);
    try {
      const result = await loginAdmin({ email: formData.email, password: formData.password });
      if (result.success) {
        login({ id: result.adminId, userId: result.userId, email: result.email, name: 'Admin', role: 'admin' });
        navigate('/admin');
      } else {
        setError(result.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
      }
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }} dir="rtl">

      {/* Left decorative panel */}
      <div style={{ flex: 1, background: 'linear-gradient(160deg,#010C0D,#0A5F62,#0d7477)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,.03)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 52, height: 52, background: 'white', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#0A5F62' }}>ا</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: 'white' }}>ابتسام · إدارة</div>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: 36, fontWeight: 900, color: 'white', lineHeight: 1.3, marginBottom: 12, position: 'relative', zIndex: 1 }}>
          لوحة التحكم<br />لجمعية ابتسام
        </h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,.65)', lineHeight: 1.8, marginBottom: 40, position: 'relative', zIndex: 1 }}>
          إدارة المشاريع، المتبرعين،<br />الكفالات، والتحقق من التحويلات
        </p>

        {/* Stat chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
          {[
            { icon: '📋', num: '1,247', label: 'تبرع في انتظار التحقق' },
            { icon: '🤲', num: '89', label: 'كفالة نشطة هذا الشهر' },
            { icon: '💰', num: '124,500', label: 'درهم محصّل هذا الشهر' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width: 480, background: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 48px', flexShrink: 0 }}>
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#E6F4F4', color: '#0A5F62', padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 700, marginBottom: 24 }}>
          🔐 لوحة الإدارة
        </div>

        <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, width: '100%', textAlign: 'right' }}>مرحباً بك</h2>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 32, width: '100%', textAlign: 'right' }}>أدخل بياناتك للوصول إلى لوحة التحكم</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {/* Email field */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 7, display: 'block' }}>البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@ibtasim.org"
              style={{ width: '100%', height: 52, border: '1.5px solid #E5E9EB', borderRadius: 14, padding: '0 16px', fontSize: 15, fontFamily: 'Inter, sans-serif', color: '#0e1a1b', outline: 'none', direction: 'ltr', textAlign: 'left' }}
              onFocus={(e) => { e.target.style.borderColor = '#0d7477'; e.target.style.boxShadow = '0 0 0 3px rgba(13,116,119,.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = '#E5E9EB'; e.target.style.boxShadow = 'none'; }}
              dir="ltr"
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 7, display: 'block' }}>كلمة المرور</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••"
                style={{ width: '100%', height: 52, border: '1.5px solid #E5E9EB', borderRadius: 14, padding: '0 16px', fontSize: 16, fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', outline: 'none', direction: 'ltr', textAlign: 'left' }}
                onFocus={(e) => { e.target.style.borderColor = '#0d7477'; e.target.style.boxShadow = '0 0 0 3px rgba(13,116,119,.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E9EB'; e.target.style.boxShadow = 'none'; }}
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94a3b8', padding: 0 }}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
            <button type="button" style={{ fontSize: 12, color: '#0d7477', background: 'none', border: 'none', padding: 0, cursor: 'pointer', marginTop: 6, display: 'block', fontFamily: 'Tajawal, sans-serif' }}>
              نسيت كلمة المرور؟
            </button>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #fecaca', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14, textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', height: 52, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'Tajawal, sans-serif', marginTop: 4, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '⏳ جاري الدخول...' : 'دخول لوحة التحكم'}
          </button>
        </form>

        {/* Security badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24, justifyContent: 'center' }}>
          {['🔒 SSL 256-bit', '🛡️ دخول آمن', '📋 سجل الأنشطة مفعّل'].map((b, i, arr) => (
            <React.Fragment key={b}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{b}</span>
              {i < arr.length - 1 && <span style={{ color: '#94a3b8', fontSize: 11 }}>·</span>}
            </React.Fragment>
          ))}
        </div>

        <Link to="/" style={{ marginTop: 20, fontSize: 13, color: '#94a3b8', textDecoration: 'none' }}>
          ← العودة للموقع
        </Link>
      </div>
    </div>
  );
}
