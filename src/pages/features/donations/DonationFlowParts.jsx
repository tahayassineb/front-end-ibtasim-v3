import React, { useEffect } from 'react';
import CountryCodeSelector from '../../../components/CountryCodeSelector';
import { STEP_LABELS } from './donationFlowHelpers';
export const TopBar = ({ onBack }) => (
  <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #E5E9EB', flexShrink: 0, background: 'white' }}>
    <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: 'none', cursor: 'pointer' }}>←</button>
    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-arabic)' }}>إتمام التبرع</div>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b' }}>?</div>
  </div>
);

// ─── Shared UI: Segmented Progress ───────────────────────────────────────────
export const SegProgress = ({ step }) => (
  <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
      {[0, 1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 100, background: i < step ? '#0d7477' : i === step ? '#33C0C0' : '#E5E9EB' }} />
      ))}
    </div>
    <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{STEP_LABELS[step] || ''}</div>
  </div>
);

// ─── Shared UI: Project Context Card ─────────────────────────────────────────
export const ProjectCtx = ({ project, step, amount }) => (
  <div style={{ margin: '14px 16px', background: '#F0F7F7', borderRadius: 14, padding: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #CCF0F0', flexShrink: 0 }}>
    <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,#0A5F62,#33C0C0)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, overflow: 'hidden' }}>
      {project?.image ? <img src={project.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🎓'}
    </div>
    <div>
      {step <= 1 ? (
        <>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{project?.title || 'تبرع لجمعية ابتسام'}</div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>{amount} درهم</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>{project?.title || 'تبرع لجمعية ابتسام'}</div>
        </>
      )}
    </div>
  </div>
);

// ─── Step 0: Auth ─────────────────────────────────────────────────────────────
export const Step0Auth = ({ authMode, setAuthMode, authFormData, handleAuthChange, handlePhoneChange, phoneInputRef, countryCode, setCountryCode, showPassword, setShowPassword, showConfirmPassword, authErrors, otpSent, otpValues, setOtpValues, otpRefs, otpTimer, setOtpTimer, lang, formatPhoneDisplay, requestOTP, showToast, isNarrow }) => {
  const handleResendOtp = async () => {
    try {
      const result = await requestOTP({ phoneNumber: countryCode + authFormData.phone });
      if (!result?.success) {
        showToast?.(result?.message || (lang === 'ar' ? 'تعذر إعادة الإرسال' : 'Failed to resend'), 'error');
        return;
      }
      setOtpTimer(120);
      showToast?.(lang === 'ar' ? 'تم إرسال الرمز' : 'Code resent', 'success');
    } catch {
      showToast?.(lang === 'ar' ? 'تعذر إعادة الإرسال' : 'Failed to resend', 'error');
    }
  };
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) otpRefs[index - 1].current?.focus();
  };
  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(p => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpSent, otpTimer, setOtpTimer]);

  const inputStyle = { width: '100%', height: 52, border: '1.5px solid #E5E9EB', borderRadius: 14, padding: '0 16px', fontSize: 15, fontFamily: 'var(--font-arabic)', color: '#0e1a1b', background: 'white', outline: 'none', boxSizing: 'border-box' };

  const AUTH_OPTIONS = [
    { id: 'login', icon: '🔑', title: 'تسجيل الدخول', desc: 'لديك حساب؟ سجّل دخولك لتتبع تبرعاتك', badge: '✓ الأسرع' },
    { id: 'register', icon: '✨', title: 'إنشاء حساب جديد', desc: 'سجّل للمرة الأولى وانضم إلى مجتمع المحسنين', badge: '🎁 مجاني تماماً' },
    { id: 'guest', icon: '👤', title: 'متابعة كضيف', desc: 'تبرع بدون حساب — لن تتمكن من متابعة تبرعاتك', badge: null },
  ];

  if (otpSent) {
    return (
      <div style={{ flex: 1, padding: '24px 16px', overflowY: 'auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
          <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>أدخل رمز التحقق</div>
          <div style={{ fontSize: 13, color: '#64748b' }}>تم الإرسال إلى <span dir="ltr" style={{ fontFamily: 'Inter', fontWeight: 700 }}>{countryCode} {formatPhoneDisplay(authFormData.phone)}</span></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, direction: 'ltr' }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={otpValues[i]}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              style={{ width: 56, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 700, border: `2px solid ${otpValues[i] ? '#0d7477' : '#E5E9EB'}`, borderRadius: 12, outline: 'none', fontFamily: 'Inter, sans-serif', background: otpValues[i] ? '#E6F4F4' : 'white' }}
            />
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          {otpTimer > 0 ? (
            <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>إعادة الإرسال بعد {formatTime(otpTimer)}</div>
          ) : (
            <button onClick={handleResendOtp} style={{ fontSize: 13, color: '#0d7477', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>إعادة إرسال الرمز</button>
          )}
        </div>
      </div>
    );
  }

  // When authMode is selected, show ONLY the form (full screen within the step)
  if (authMode === 'login' || authMode === 'register') {
    return (
      <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
        {/* Back to options */}
        <button onClick={() => setAuthMode(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0d7477', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'var(--font-arabic)' }}>
          ← تغيير الخيار
        </button>

        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
          {authMode === 'login' ? '🔑 تسجيل الدخول' : '✨ إنشاء حساب جديد'}
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
          {authMode === 'login' ? 'أدخل رقم هاتفك وكلمة المرور' : 'أنشئ حسابك وانضم إلى مجتمع المحسنين'}
        </div>

        {otpSent ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📱</div>
              <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>أدخل رمز التحقق</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>تم الإرسال إلى <span dir="ltr" style={{ fontFamily: 'Inter', fontWeight: 700 }}>{countryCode} {formatPhoneDisplay(authFormData.phone)}</span></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, direction: 'ltr' }}>
              {[0, 1, 2, 3, 4, 5].map(i => (
                <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={otpValues[i]}
                  onChange={e => { const v = e.target.value; if (v.length > 1) return; if (!/^\d*$/.test(v)) return; const n = [...otpValues]; n[i] = v; setOtpValues(n); if (v && i < 5) otpRefs[i + 1].current?.focus(); }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !otpValues[i] && i > 0) otpRefs[i - 1].current?.focus(); }}
                  style={{ width: 56, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 700, border: `2px solid ${otpValues[i] ? '#0d7477' : '#E5E9EB'}`, borderRadius: 12, outline: 'none', fontFamily: 'Inter, sans-serif', background: otpValues[i] ? '#E6F4F4' : 'white' }}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              {otpTimer > 0
                ? <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>إعادة الإرسال بعد {String(Math.floor(otpTimer / 60)).padStart(2, '0')}:{String(otpTimer % 60).padStart(2, '0')}</div>
                : <button onClick={handleResendOtp} style={{ fontSize: 13, color: '#0d7477', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>إعادة إرسال الرمز</button>
              }
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px', background: '#F0F7F7', borderRadius: 16, border: '1px solid #CCF0F0' }}>
            {authMode === 'register' && (
              <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>الاسم الكامل *</div>
                  <input type="text" name="fullName" value={authFormData.fullName} onChange={handleAuthChange} placeholder="الاسم" style={{ ...inputStyle, height: 44 }} />
                  {authErrors.fullName && <p style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>{authErrors.fullName}</p>}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>البريد الإلكتروني *</div>
                  <input type="email" name="email" value={authFormData.email} onChange={handleAuthChange} placeholder="email@..." dir="ltr" style={{ ...inputStyle, height: 44 }} />
                  {authErrors.email && <p style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>{authErrors.email}</p>}
                </div>
              </div>
            )}
            <div style={{ fontSize: authMode === 'register' ? 12 : 13, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>رقم الهاتف {authMode === 'register' ? '*' : ''}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <CountryCodeSelector value={countryCode} onChange={setCountryCode} lang={lang} />
              <input ref={phoneInputRef} type="tel" name="phone" value={authFormData.phone} onChange={handlePhoneChange}
                placeholder="6XXXXXXXX" maxLength={15} dir="ltr" inputMode="numeric"
                style={{ ...inputStyle, flex: 1, height: authMode === 'register' ? 44 : 52 }} />
            </div>
            {authErrors.phone && <p style={{ color: '#ef4444', fontSize: 11, marginTop: -6, marginBottom: 8 }}>{authErrors.phone}</p>}
            {authMode === 'login' && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>كلمة المرور</div>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={authFormData.password} onChange={handleAuthChange}
                    placeholder="••••••••" style={{ ...inputStyle, paddingLeft: 44 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
                {authErrors.password && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{authErrors.password}</p>}
              </>
            )}
            {authMode === 'register' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>كلمة المرور *</div>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} name="password" value={authFormData.password} onChange={handleAuthChange}
                        placeholder="••••••" style={{ ...inputStyle, height: 44, paddingLeft: 36 }} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>
                        {showPassword ? '🙈' : '👁'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>التأكيد *</div>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={authFormData.confirmPassword} onChange={handleAuthChange}
                      placeholder="••••••" style={{ ...inputStyle, height: 44 }} />
                  </div>
                </div>
                {authErrors.password && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 4 }}>{authErrors.password}</p>}
                {authErrors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{authErrors.confirmPassword}</p>}
              </>
            )}
          </div>
        )}

        <div style={{ marginTop: 14, padding: '10px 14px', background: '#F0F7F7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
          🔒 <span>بياناتك محمية بتشفير SSL 256-bit</span>
        </div>
      </div>
    );
  }

  // No auth mode selected yet — show the 3 option cards
  return (
    <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>كيف تريد المتابعة؟</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>سجّل دخولك لمتابعة تبرعاتك وتاريخ عطائك</div>

      {AUTH_OPTIONS.map(opt => (
        <div key={opt.id} onClick={() => setAuthMode(opt.id)}
          style={{ background: 'white', border: '1.5px solid #E5E9EB', borderRadius: 16, padding: 18, marginBottom: 12, cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s' }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{opt.title}</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>{opt.desc}</div>
          {opt.badge && <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: '#E6F4F4', color: '#0A5F62', padding: '2px 8px', borderRadius: 100, marginTop: 6 }}>{opt.badge}</div>}
        </div>
      ))}

      <div style={{ marginTop: 14, padding: '10px 14px', background: '#F0F7F7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
        🔒 <span>بياناتك محمية بتشفير SSL 256-bit</span>
      </div>
    </div>
  );
};

// ─── Step 1: Amount ────────────────────────────────────────────────────────────
