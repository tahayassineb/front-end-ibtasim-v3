import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import CountryCodeSelector, { validatePhoneByCountry, formatPhoneForDisplay } from '../../../components/CountryCodeSelector';

// ============================================
// DONATION FLOW — 6-Step Wizard
// Steps: 0=Auth, 1=Amount, 2=Payment, 3=Receipt, 4=Info, 5=Review, 6=Success
// ============================================

const DONATION_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

const DEFAULT_BANK_INFO = { accountHolder: '—', rib: '—', bankName: '—' };

const STEP_LABELS = [
  'الخطوة 1 من 6 — تسجيل الدخول',
  'الخطوة 2 من 6 — اختيار المبلغ',
  'الخطوة 3 من 6 — طريقة الدفع',
  'الخطوة 4 من 6 — رفع وصل التحويل',
  'الخطوة 5 من 6 — بياناتك الشخصية',
  'الخطوة 6 من 6 — مراجعة وتأكيد',
];

const getImpactItems = (amount) => {
  if (amount >= 5000) return ['تمويل مشروع بناء كامل', 'تعليم 10 أطفال لمدة سنة', 'رعاية صحية لـ 20 مستفيداً'];
  if (amount >= 2000) return ['تجهيز فصل دراسي كامل', 'كتب لـ 20 تلميذاً', 'وجبات مدرسية لشهر'];
  if (amount >= 1000) return ['كتب ولوازم لـ 10 تلاميذ', 'أسبوعان من الوجبات', 'رعاية طفل شهرين'];
  if (amount >= 500) return ['كتب مدرسية لـ 5 تلاميذ', 'ربع جدار في المبنى', '3 أسابيع وجبات مدرسية'];
  if (amount >= 200) return ['كتب لتلميذين', 'لوازم مدرسية كاملة', 'أسبوع وجبات مدرسية'];
  return ['لوازم مدرسية', 'دعم تلميذ واحد', 'مساهمة في البناء'];
};

// ─── Shared UI: Top Bar ───────────────────────────────────────────────────────
const TopBar = ({ onBack }) => (
  <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: '1px solid #E5E9EB', flexShrink: 0, background: 'white' }}>
    <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: 'none', cursor: 'pointer' }}>←</button>
    <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-arabic)' }}>إتمام التبرع</div>
    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#64748b' }}>?</div>
  </div>
);

// ─── Shared UI: Segmented Progress ───────────────────────────────────────────
const SegProgress = ({ step }) => (
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
const ProjectCtx = ({ project, step, amount }) => (
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
const Step0Auth = ({ authMode, setAuthMode, authFormData, handleAuthChange, handlePhoneChange, phoneInputRef, countryCode, setCountryCode, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, authErrors, otpSent, otpValues, setOtpValues, otpRefs, otpTimer, setOtpTimer, lang, formatPhoneDisplay }) => {
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 3) otpRefs[index + 1].current?.focus();
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
          {[0, 1, 2, 3].map(i => (
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
            <button onClick={() => setOtpTimer(120)} style={{ fontSize: 13, color: '#0d7477', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>إعادة إرسال الرمز</button>
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
              {[0, 1, 2, 3].map(i => (
                <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={otpValues[i]}
                  onChange={e => { const v = e.target.value; if (v.length > 1) return; if (!/^\d*$/.test(v)) return; const n = [...otpValues]; n[i] = v; setOtpValues(n); if (v && i < 3) otpRefs[i + 1].current?.focus(); }}
                  onKeyDown={e => { if (e.key === 'Backspace' && !otpValues[i] && i > 0) otpRefs[i - 1].current?.focus(); }}
                  style={{ width: 56, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 700, border: `2px solid ${otpValues[i] ? '#0d7477' : '#E5E9EB'}`, borderRadius: 12, outline: 'none', fontFamily: 'Inter, sans-serif', background: otpValues[i] ? '#E6F4F4' : 'white' }}
                />
              ))}
            </div>
            <div style={{ textAlign: 'center' }}>
              {otpTimer > 0
                ? <div style={{ fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>إعادة الإرسال بعد {String(Math.floor(otpTimer / 60)).padStart(2, '0')}:{String(otpTimer % 60).padStart(2, '0')}</div>
                : <button onClick={() => setOtpTimer(120)} style={{ fontSize: 13, color: '#0d7477', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>إعادة إرسال الرمز</button>
              }
            </div>
          </div>
        ) : (
          <div style={{ padding: '16px', background: '#F0F7F7', borderRadius: 16, border: '1px solid #CCF0F0' }}>
            {authMode === 'register' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
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
const Step1Amount = ({ donationData, setDonationData }) => {
  const amount = donationData.customAmount ? (parseFloat(donationData.customAmount) || 0) : donationData.amount;
  const impactItems = getImpactItems(amount);

  return (
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>كم تريد أن تتبرع؟</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 18 }}>اختر مبلغاً أو أدخل مبلغاً مخصصاً</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
        {DONATION_AMOUNTS.map(amt => {
          const isActive = donationData.amount === amt && !donationData.customAmount;
          return (
            <button key={amt} onClick={() => setDonationData(p => ({ ...p, amount: amt, customAmount: '' }))}
              style={{ height: 64, border: `2px solid ${isActive ? '#0d7477' : '#E5E9EB'}`, borderRadius: 16, background: isActive ? '#E6F4F4' : 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: isActive ? '0 0 0 3px rgba(13,116,119,.1)' : 'none', transition: 'all .15s' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: isActive ? '#0A5F62' : '#0e1a1b', fontFamily: 'Inter, sans-serif' }}>{amt >= 1000 ? `${(amt / 1000).toLocaleString('fr-MA')}k` : amt}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>درهم{amt === 500 ? ' ⭐' : ''}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>أو أدخل مبلغاً آخر:</div>
      <div style={{ position: 'relative', marginBottom: 18 }}>
        <input type="number" inputMode="numeric" value={donationData.customAmount}
          onChange={e => { const v = e.target.value; if (v === '' || /^\d*$/.test(v)) setDonationData(p => ({ ...p, customAmount: v, amount: 0 })); }}
          placeholder="0"
          style={{ width: '100%', height: 60, padding: '0 56px 0 16px', border: `2px solid ${donationData.customAmount ? '#0d7477' : '#E5E9EB'}`, borderRadius: 14, fontSize: 26, fontWeight: 800, color: '#0A5F62', outline: 'none', background: donationData.customAmount ? '#E6F4F4' : 'white', fontFamily: 'Inter, var(--font-arabic), sans-serif', boxSizing: 'border-box', boxShadow: donationData.customAmount ? '0 0 0 3px rgba(13,116,119,.1)' : 'none' }}
          dir="ltr"
        />
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 700, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>د.م</span>
      </div>

      {amount > 0 && (
        <div style={{ background: '#F0F7F7', borderRadius: 14, padding: 14, marginBottom: 16, border: '1px solid #CCF0F0' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#0A5F62', marginBottom: 10 }}>✨ {amount} درهم ستغطي:</div>
          {impactItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 6 }}>
              <span style={{ color: '#0d7477', fontWeight: 700 }}>✓</span><span>{item}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, background: '#F0FFF4', borderRadius: 10, border: '1px solid #BBF7D0', marginBottom: 14 }}>
        <input type="checkbox" checked={donationData.coverFees} onChange={e => setDonationData(p => ({ ...p, coverFees: e.target.checked }))}
          style={{ width: 18, height: 18, accentColor: '#0d7477', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>أريد تغطية رسوم المعالجة حتى تصل كامل تبرعتي للمشروع</div>
      </div>

      <div style={{ padding: '10px 14px', background: '#F0F7F7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
        🔒 <span>تبرعك سيصل كاملاً للمشروع</span>
      </div>
    </div>
  );
};

// ─── Step 2: Payment Method ───────────────────────────────────────────────────
const Step2Payment = ({ donationData, setDonationData, bankInfo, showToast, lang }) => {
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast(lang === 'ar' ? 'تم النسخ' : 'Copied', 'success');
  };

  const METHODS = [
    { id: 'transfer', icon: '🏦', title: 'تحويل بنكي أو وكالة نقد', desc: 'حوّل وأرفق وصل الإيداع', badge: 'الأكثر استخداماً' },
    { id: 'card', icon: '💳', title: 'بطاقة بنكية', desc: 'فيزا، ماستركارد — مباشر وآمن', badge: 'متاح' },
  ];

  const transferType = donationData.transferType || 'bank';

  return (
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>كيف تريد الدفع؟</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>اختر طريقة الدفع المناسبة لك</div>

      {METHODS.map(m => {
        const sel = donationData.paymentMethod === m.id;
        return (
          <div key={m.id} onClick={() => setDonationData(p => ({ ...p, paymentMethod: m.id }))}
            style={{ border: `2px solid ${sel ? '#0d7477' : '#E5E9EB'}`, borderRadius: 18, padding: 18, marginBottom: 12, cursor: 'pointer', background: sel ? '#E6F4F4' : 'white', boxShadow: sel ? '0 0 0 3px rgba(13,116,119,.08)' : 'none', transition: 'all .15s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? '#0d7477' : '#E5E9EB'}`, background: sel ? '#0d7477' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
              </div>
              <div style={{ fontSize: 24 }}>{m.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{m.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{m.desc}</div>
                {m.badge && <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: m.id === 'card' ? '#FEF3C7' : '#E6F4F4', color: m.id === 'card' ? '#b45309' : '#0A5F62', padding: '2px 8px', borderRadius: 100, marginTop: 4 }}>{m.badge}</div>}
              </div>
            </div>

            {/* Expanded transfer details with sub-toggle */}
            {sel && m.id === 'transfer' && (
              <div style={{ marginTop: 14 }}>
                {/* Sub-toggle */}
                <div style={{ display: 'flex', background: '#F0F7F7', borderRadius: 10, padding: 4, marginBottom: 14, border: '1px solid #CCF0F0' }}>
                  {[{ id: 'bank', label: '🏦 تحويل بنكي' }, { id: 'cash', label: '💳 Wafacash · Cash Plus' }].map(t => (
                    <button key={t.id} onClick={e => { e.stopPropagation(); setDonationData(p => ({ ...p, transferType: t.id })); }}
                      style={{ flex: 1, height: 34, borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-arabic)',
                        background: transferType === t.id ? 'white' : 'transparent',
                        color: transferType === t.id ? '#0A5F62' : '#64748b',
                        boxShadow: transferType === t.id ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                        transition: 'all .15s' }}>
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Bank transfer details */}
                {transferType === 'bank' && (
                  <div style={{ padding: 14, background: 'white', borderRadius: 12, border: '1px solid #CCF0F0' }}>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>البنك</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{bankInfo.bankName || 'بنك التجاري وفا بنك'}</div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>رقم الحساب (RIB)</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif', letterSpacing: '.08em', margin: '2px 0' }} dir="ltr">{bankInfo.rib || '—'}</div>
                      <button onClick={e => { e.stopPropagation(); copyToClipboard((bankInfo.rib || '').replace(/\s/g, '')); }}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#0d7477', background: '#E6F4F4', padding: '3px 10px', borderRadius: 100, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-arabic)', marginTop: 4 }}>
                        📋 نسخ الرقم
                      </button>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>اسم المستفيد</div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{bankInfo.accountHolder || 'جمعية ابتسام للأعمال الخيرية'}</div>
                    </div>
                    <div style={{ background: '#F0F7F7', borderRadius: 10, padding: 12, marginTop: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0A5F62', marginBottom: 6 }}>📋 خطوات التحويل:</div>
                      {['حوّل المبلغ عبر تطبيق بنكك', 'احتفظ بوصل التحويل', 'ارفع الوصل في الخطوة التالية'].map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0d7477', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cash agency details */}
                {transferType === 'cash' && (
                  <div style={{ padding: 14, background: 'white', borderRadius: 12, border: '1px solid #CCF0F0' }}>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 12 }}>
                      حوّل المبلغ عبر <strong>Wafacash</strong> أو <strong>Cash Plus</strong> — في خانة المستفيد أدخل رقم هاتف الجمعية
                    </div>
                    <div style={{ background: '#F0F7F7', borderRadius: 10, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0A5F62', marginBottom: 6 }}>📋 خطوات الإيداع:</div>
                      {['توجه لأقرب وكالة Wafacash أو Cash Plus', 'أدخل رقم هاتف الجمعية في خانة المستفيد', 'احتفظ بوصل الإيداع', 'ارفع الوصل في الخطوة التالية'].map((s, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#0d7477', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ padding: '10px 14px', background: '#F0F7F7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', marginTop: 4 }}>
        🔒 <span>جميع معاملاتك آمنة ومحمية</span>
      </div>
    </div>
  );
};

const MOROCCAN_BANKS = ['CIH Bank', 'Attijariwafa Bank', 'BMCE Bank (Bank of Africa)', 'Banque Populaire', 'BCP (Banque Centrale Populaire)', 'Société Générale Maroc', 'BMCI', 'Crédit Agricole du Maroc', 'CDG Capital', 'CFG Bank', 'Al Barid Bank', 'Umnia Bank', 'Wafa Cash', 'Cash Plus', 'أخرى'];

// ─── Step 3: Receipt Upload ───────────────────────────────────────────────────
const Step3Receipt = ({ uploadedFile, setUploadedFile, dragActive, setDragActive, showToast, lang, amount, donationData, setDonationData }) => {
  const handleDrag = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };
  const handleFile = (file) => {
    if (file.size > 10 * 1024 * 1024) { showToast('الملف كبير جداً (الحد 10MB)', 'error'); return; }
    setUploadedFile(file);
  };

  return (
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>ارفع وصل التحويل</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>أرفق صورة وصل التحويل البنكي للتحقق من تبرعك</div>

      {uploadedFile ? (
        <div style={{ border: '2px solid #0d7477', borderRadius: 20, padding: 16, marginBottom: 16, background: '#E6F4F4', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{ width: 72, height: 72, borderRadius: 12, background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>🧾</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{uploadedFile.name}</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, background: '#D1FAE5', color: '#16a34a', padding: '3px 10px', borderRadius: 100 }}>✓ تم الرفع بنجاح</div>
            <button onClick={() => setUploadedFile(null)} style={{ display: 'block', fontSize: 11, color: '#ef4444', cursor: 'pointer', textDecoration: 'underline', marginTop: 6, background: 'none', border: 'none', fontFamily: 'var(--font-arabic)' }}>× حذف والاستبدال</button>
          </div>
        </div>
      ) : (
        <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
          style={{ border: `2px dashed ${dragActive ? '#0d7477' : '#E5E9EB'}`, borderRadius: 20, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: dragActive ? '#E6F4F4' : '#f6f8f8', transition: 'all .2s', marginBottom: 16 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📄</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>اسحب وأفلت الوصل هنا</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 14 }}>أو استخدم الكاميرا مباشرةً</div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, background: '#0d7477', color: 'white', padding: '8px 20px', borderRadius: 100, boxShadow: '0 4px 14px rgba(13,116,119,.25)', cursor: 'pointer' }}>
            📷 اختر من الجهاز
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 10 }}>PNG · JPG · PDF · حتى 10 ميغابايت</div>
        </div>
      )}

      {/* Structured transfer details */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: '#0e1a1b' }}>تفاصيل التحويل</div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>اسم البنك / الوكالة <span style={{ color: '#ef4444' }}>*</span></div>
          <select
            value={donationData?.bankName || ''}
            onChange={e => setDonationData(p => ({ ...p, bankName: e.target.value }))}
            style={{ width: '100%', height: 52, border: `1.5px solid ${donationData?.bankName ? '#33C0C0' : '#E5E9EB'}`, borderRadius: 14, padding: '0 16px', fontSize: 14, fontFamily: 'var(--font-arabic)', color: '#0e1a1b', background: 'white', outline: 'none', boxSizing: 'border-box', appearance: 'none', cursor: 'pointer' }}
          >
            <option value="">-- اختر البنك أو الوكالة --</option>
            {MOROCCAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>اسم صاحب الحساب المُحوِّل</div>
          <input
            type="text"
            value={donationData?.senderName || ''}
            onChange={e => setDonationData(p => ({ ...p, senderName: e.target.value }))}
            placeholder="الاسم الكامل كما هو في البطاقة البنكية"
            style={{ width: '100%', height: 52, border: '1.5px solid #E5E9EB', borderRadius: 14, padding: '0 16px', fontSize: 14, fontFamily: 'var(--font-arabic)', color: '#0e1a1b', background: 'white', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ marginBottom: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>رقم المرجع (اختياري)</div>
          <input
            type="text"
            value={donationData?.transactionReference || ''}
            onChange={e => setDonationData(p => ({ ...p, transactionReference: e.target.value }))}
            placeholder="رقم الوصل من البنك"
            dir="ltr"
            style={{ width: '100%', height: 52, border: '1.5px solid #E5E9EB', borderRadius: 14, padding: '0 16px', fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#0e1a1b', background: 'white', outline: 'none', boxSizing: 'border-box', letterSpacing: '.04em' }}
          />
        </div>
      </div>

      <div style={{ background: '#F0F7F7', borderRadius: 14, padding: 14, marginBottom: 14, border: '1px solid #CCF0F0' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0A5F62', marginBottom: 10 }}>📋 ما الذي يجب أن يظهر في الوصل؟</div>
        {[`المبلغ: ${amount} درهم`, 'رقم الحساب المستفيد', 'تاريخ ووقت العملية', 'ختم / توقيع البنك أو الرقم المرجعي'].map((s, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0d7477', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
            <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{s}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', background: '#F0F7F7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
        🔒 <span>صورة الوصل محمية ولا تُشارك مع أي طرف ثالث</span>
      </div>
    </div>
  );
};

// ─── Step 4: Personal Info ────────────────────────────────────────────────────
const Step4Info = ({ donationData, setDonationData, lang }) => {
  const inputStyle = { width: '100%', height: 52, border: '1.5px solid #E5E9EB', borderRadius: 14, padding: '0 16px', fontSize: 15, fontFamily: 'var(--font-arabic)', color: '#0e1a1b', background: 'white', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s' };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 };

  return (
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>بياناتك الشخصية</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>للتواصل معك وإرسال وصل التبرع الرسمي</div>

      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>الاسم الكامل <span style={{ color: '#ef4444' }}>*</span></div>
        <input type="text" value={donationData.donorName || ''} onChange={e => setDonationData(p => ({ ...p, donorName: e.target.value }))}
          placeholder="أدخل اسمك الكامل"
          style={{ ...inputStyle, borderColor: donationData.donorName ? '#33C0C0' : '#E5E9EB' }} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>رقم الهاتف <span style={{ color: '#ef4444' }}>*</span></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ height: 52, padding: '0 14px', background: '#F0F7F7', border: '1.5px solid #E5E9EB', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>🇲🇦 +212</div>
          <input type="tel" value={donationData.donorPhone || ''} onChange={e => setDonationData(p => ({ ...p, donorPhone: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
            placeholder="661234567" dir="ltr" inputMode="numeric"
            style={{ ...inputStyle, flex: 1, fontFamily: 'Inter, sans-serif', borderColor: donationData.donorPhone ? '#33C0C0' : '#E5E9EB' }} />
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>سنرسل إليك رسالة تأكيد على واتساب</div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>البريد الإلكتروني <span style={{ color: '#94a3b8', fontWeight: 500 }}>(اختياري)</span></div>
        <input type="email" value={donationData.donorEmail || ''} onChange={e => setDonationData(p => ({ ...p, donorEmail: e.target.value }))}
          placeholder="example@email.com" dir="ltr"
          style={inputStyle} />
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>لإرسال وصل التبرع الرسمي بالبريد</div>
      </div>

      <div onClick={() => setDonationData(p => ({ ...p, isAnonymous: !p.isAnonymous }))}
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: '#E6F4F4', borderRadius: 14, border: '1.5px solid #CCF0F0', marginBottom: 16, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 24, background: donationData.isAnonymous ? '#0d7477' : '#94a3b8', borderRadius: 100, position: 'relative', flexShrink: 0, transition: 'background .15s' }}>
          <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: donationData.isAnonymous ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .15s' }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>التبرع باسم مجهول</div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>لن يظهر اسمك في قائمة المتبرعين العامة</div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={labelStyle}>إهداء التبرع <span style={{ color: '#94a3b8', fontWeight: 500 }}>(اختياري)</span></div>
        <textarea value={donationData.dedication || ''} onChange={e => setDonationData(p => ({ ...p, dedication: e.target.value.slice(0, 150) }))}
          placeholder="مثال: باسم والدي رحمه الله..."
          style={{ width: '100%', minHeight: 80, border: '1.5px solid #E5E9EB', borderRadius: 14, padding: '14px 16px', fontSize: 14, fontFamily: 'var(--font-arabic)', color: '#0e1a1b', background: 'white', outline: 'none', resize: 'none', lineHeight: 1.6, boxSizing: 'border-box' }} />
        <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'left', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>{(donationData.dedication || '').length} / 150</div>
      </div>

      <div style={{ padding: '10px 14px', background: '#F0F7F7', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
        🔒 <span>بياناتك لن تُشارك مع أي طرف ثالث</span>
      </div>
    </div>
  );
};

// ─── Step 5: Review ───────────────────────────────────────────────────────────
const Step5Review = ({ donationData, project, uploadedFile, amount, agreedTerms, setAgreedTerms, setStep }) => {
  const paymentLabel = donationData.paymentMethod === 'transfer'
    ? (donationData.transferType === 'cash' ? '💵 وكالة نقد (Wafacash / Cash Plus)' : '🏦 تحويل بنكي')
    : '💳 بطاقة بنكية';

  return (
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>راجع تبرعك</div>
      <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>تأكد من صحة التفاصيل قبل الإرسال</div>

      {/* Total highlight */}
      <div style={{ background: '#0A5F62', borderRadius: 16, padding: 16, marginBottom: 14, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>إجمالي تبرعك</div>
        <div><span style={{ fontSize: 36, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{amount}</span>{' '}<span style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', fontFamily: 'Inter, sans-serif' }}>درهم مغربي</span></div>
      </div>

      {/* Summary card */}
      <div style={{ background: 'white', border: '1.5px solid #E5E9EB', borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ background: '#F0F7F7', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #CCF0F0' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#0A5F62,#33C0C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>🎓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{project?.title || 'تبرع لجمعية ابتسام'}</div>
            <div style={{ fontSize: 11, color: '#0A5F62', fontWeight: 600, marginTop: 2 }}>✓ مشروع معتمد</div>
          </div>
        </div>

        {[
          { label: 'المبلغ', value: `${amount} درهم`, editStep: 1, teal: true },
          { label: 'طريقة الدفع', value: paymentLabel, editStep: 2 },
          ...(uploadedFile ? [{ label: 'وصل التحويل', value: uploadedFile.name, editStep: 3, isFile: true }] : []),
          { label: 'المتبرع', value: donationData.isAnonymous ? 'مجهول الهوية 🙈' : (donationData.donorName || '—'), editStep: 4 },
          { label: 'رقم الهاتف', value: `+212 ${donationData.donorPhone || '—'}`, editStep: null },
          ...(donationData.dedication ? [{ label: 'الإهداء', value: donationData.dedication, editStep: null }] : []),
        ].map((row, i, arr) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px', borderBottom: i < arr.length - 1 ? '1px solid #E5E9EB' : 'none' }}>
            <div style={{ fontSize: 13, color: '#64748b' }}>{row.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {row.isFile ? (
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg,#e0e7ff,#c7d2fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧾</div>
              ) : null}
              <div style={{ fontSize: row.isFile ? 12 : 14, fontWeight: 700, color: row.teal ? '#0A5F62' : '#0e1a1b', maxWidth: 150, textAlign: 'left', direction: row.label === 'رقم الهاتف' ? 'ltr' : 'rtl', fontFamily: row.label === 'رقم الهاتف' ? 'Inter, sans-serif' : 'var(--font-arabic)' }}>{row.value}</div>
              {row.editStep != null && (
                <button onClick={() => setStep(row.editStep)} style={{ fontSize: 12, fontWeight: 600, color: '#0d7477', padding: '3px 8px', background: '#E6F4F4', borderRadius: 100, cursor: 'pointer', border: 'none', fontFamily: 'var(--font-arabic)' }}>تعديل</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Trust badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {['🔒 SSL 256-bit', '✓ جمعية معتمدة', '📋 وصل رسمي'].map(b => (
          <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 100, background: '#F0F7F7', color: '#0A5F62' }}>{b}</div>
        ))}
      </div>

      {/* Terms */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
          style={{ width: 20, height: 20, accentColor: '#0d7477', marginTop: 2, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          أوافق على <span style={{ color: '#0d7477', textDecoration: 'underline', cursor: 'pointer' }}>شروط الاستخدام</span> و<span style={{ color: '#0d7477', textDecoration: 'underline', cursor: 'pointer' }}>سياسة الخصوصية</span> لجمعية ابتسام
        </div>
      </div>
    </div>
  );
};

// ─── Step 6: Success ──────────────────────────────────────────────────────────
const Step6Success = ({ donationReference, project, navigate, resetDonation, lang }) => {
  const displayReference = donationReference ? String(donationReference) : '--------';
  const handleShare = (platform) => {
    const text = `تبرعت لجمعية ابتسام! انضم إليّ في دعم ${project?.title || 'مشاريع الخير'}`;
    const url = window.location.origin;
    if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    else window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 24px', overflowY: 'auto' }}>
      {/* Success checkmark */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <div style={{ position: 'absolute', inset: -16, background: 'rgba(13,116,119,.1)', borderRadius: '50%', filter: 'blur(16px)' }} />
        <div style={{ position: 'relative', width: 88, height: 88, background: '#0d7477', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid white', boxShadow: '0 8px 24px rgba(13,116,119,.3)' }}>
          <span style={{ fontSize: 40, color: 'white', fontWeight: 900 }}>✓</span>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>شكراً لك!</div>
        <div style={{ fontSize: 18, color: '#64748b', fontWeight: 500 }}>Thank you!</div>
      </div>

      {/* Reference card */}
      <div style={{ width: '100%', background: 'white', border: '1.5px solid #CCF0F0', borderRadius: 20, padding: 20, marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#0d7477', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>رقم مرجع التبرع</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'Inter, sans-serif', letterSpacing: '.02em' }} dir="ltr">{displayReference}</div>
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #E5E9EB', fontSize: 13, color: '#64748b', lineHeight: 1.7 }}>
          سنقوم بالتحقق من التبرع وإرسال تأكيد عبر واتساب
        </div>
      </div>

      {/* Status timeline */}
      <div style={{ width: '100%', background: '#F0F7F7', borderRadius: 16, padding: 16, marginBottom: 20, border: '1px solid #CCF0F0' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A5F62', marginBottom: 12 }}>ما الذي سيحدث بعد ذلك؟</div>
        {[
          { icon: '✅', text: 'تم استلام طلب تبرعك', done: true },
          { icon: '🔍', text: 'مراجعة الوصل خلال 24 ساعة', done: false },
          { icon: '📲', text: 'إشعار تأكيد على واتساب', done: false },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < 2 ? 10 : 0 }}>
            <div style={{ fontSize: 18 }}>{s.icon}</div>
            <div style={{ fontSize: 13, color: s.done ? '#0A5F62' : '#64748b', fontWeight: s.done ? 700 : 400 }}>{s.text}</div>
          </div>
        ))}
      </div>

      {/* Share */}
      <div style={{ width: '100%', marginBottom: 20 }}>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 12 }}>انشر الخير مع أصدقائك</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => handleShare('whatsapp')}
            style={{ flex: 1, height: 48, background: '#25D366', border: 'none', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: '0 4px 14px rgba(37,211,102,.3)' }}>
            واتساب
          </button>
          <button onClick={() => handleShare('facebook')}
            style={{ flex: 1, height: 48, background: '#1877F2', border: 'none', borderRadius: 14, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: '0 4px 14px rgba(24,119,242,.3)' }}>
            فيسبوك
          </button>
        </div>
      </div>

      <button onClick={() => { resetDonation(); navigate('/', { replace: true }); }}
        style={{ width: '100%', height: 52, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: '0 4px 14px rgba(13,116,119,.25)' }}>
        العودة للرئيسية
      </button>
    </div>
  );
};

// ============================================================
// MAIN DONATION FLOW COMPONENT
// ============================================================

export default function DonationFlow() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, user, isAuthenticated, login, showToast, formatCurrency } = useApp();

  // ── Local donation state (not persisted to global context) ──
  const [donationState, setDonationState] = useState({
    projectId: null,
    amount: null,
    paymentMethod: null,
    phoneNumber: null,
    receipt: null,
    step: 1,
  });
  const updateDonation = (updates) => setDonationState(prev => ({ ...prev, ...updates }));
  const resetDonation = () => setDonationState({ projectId: null, amount: null, paymentMethod: null, phoneNumber: null, receipt: null, step: 1 });
  const nextDonationStep = () => setDonationState(prev => ({ ...prev, step: Math.min(prev.step + 1, 5) }));
  const prevDonationStep = () => setDonationState(prev => ({ ...prev, step: Math.max(prev.step - 1, 1) }));

  // ── Convex mutations (preserved exactly) ──
  const loginWithPassword = useMutation(api.auth.loginWithPassword);
  const registerUser = useMutation(api.auth.registerUser);
  const requestOTP = useMutation(api.auth.requestOTP);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const createDonation = useMutation(api.donations.createDonation);
  const uploadReceiptMutation = useMutation(api.donations.uploadReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const startWhopCheckout = useAction(api.payments.startWhopCheckout);
  const setPassword = useMutation(api.auth.setPassword);

  // ── Convex queries (preserved exactly) ──
  const convexProject = useQuery(api.projects.getProjectById, projectId ? { projectId } : 'skip');
  const bankConfigRaw = useQuery(api.config.getConfig, { key: 'bank_info' });
  const bankInfo = bankConfigRaw
    ? (() => { try { return JSON.parse(bankConfigRaw); } catch { return DEFAULT_BANK_INFO; } })()
    : DEFAULT_BANK_INFO;

  const lang = currentLanguage?.code || 'ar';

  // ── Project data ──
  const project = convexProject ? {
    id: convexProject._id,
    title: convexProject.title?.[lang] || convexProject.title?.ar || convexProject.title?.en || '',
    image: convexFileUrl(convexProject.mainImage) || convexProject.mainImage,
    category: convexProject.category,
  } : null;

  // ── Step state ──
  const getInitialStep = () => (!isAuthenticated ? 0 : 1);
  const [step, setStep] = useState(getInitialStep);
  const [isLoading, setIsLoading] = useState(false);

  // If auth state loads after mount and user is already logged in, skip auth step
  useEffect(() => {
    if (isAuthenticated && step === 0) setStep(1);
  }, [isAuthenticated]);

  // ── Donation data ──
  const [donationData, setDonationData] = useState({
    amount: donationState?.amount || 200,
    customAmount: '',
    paymentMethod: donationState?.paymentMethod || null,
    transferType: 'bank',
    coverFees: false,
    donorName: user?.name || '',
    donorPhone: (user?.phone || '').replace('+212', '').replace(/\s/g, ''),
    donorEmail: user?.email || '',
    isAnonymous: false,
    dedication: '',
    message: '',
    transactionReference: '',
  });

  // Pre-fill info from user when they log in
  useEffect(() => {
    if (user) {
      setDonationData(p => ({
        ...p,
        donorName: p.donorName || user.name || '',
        donorPhone: p.donorPhone || (user.phone || '').replace('+212', '').replace(/\s/g, ''),
        donorEmail: p.donorEmail || user.email || '',
      }));
    }
  }, [user]);

  // ── Auth state (preserved exactly) ──
  const [authMode, setAuthMode] = useState(null);
  const [authFormData, setAuthFormData] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authErrors, setAuthErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(120);
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const [countryCode, setCountryCode] = useState('+212');
  const phoneInputRef = useRef(null);
  const cursorPositionRef = useRef(0);

  // ── Upload state ──
  const [uploadedFile, setUploadedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [donationReference, setDonationReference] = useState(null);

  // ── Review state ──
  const [agreedTerms, setAgreedTerms] = useState(false);

  // ── Calculate total ──
  const calculateTotal = () => {
    const base = donationData.customAmount ? (parseFloat(donationData.customAmount) || 0) : donationData.amount;
    return base;
  };
  const calculateTotalAmount = () => Number(calculateTotal().toFixed(2));

  // ── Phone handling (preserved exactly) ──
  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthFormData(p => ({ ...p, [name]: value }));
    if (authErrors[name]) setAuthErrors(p => ({ ...p, [name]: null }));
  };

  const handlePhoneChange = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const previousValue = input.value;
    const rawValue = input.value.replace(/\D/g, '').slice(0, 10);
    const diff = previousValue.length - rawValue.length;
    cursorPositionRef.current = Math.max(0, cursorPosition - diff);
    setAuthFormData(p => ({ ...p, phone: rawValue }));
    if (authErrors.phone) setAuthErrors(p => ({ ...p, phone: null }));
  };

  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
    }
  }, [authFormData.phone]);

  const formatPhoneDisplay = (phone) => formatPhoneForDisplay(phone, countryCode);

  const validatePhone = (phone) => validatePhoneByCountry(phone, countryCode);
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ── Auth mode switch (preserved exactly) ──
  const handleAuthModeSwitch = (mode) => {
    setAuthMode(mode);
    setAuthErrors({});
    if (otpSent) { setOtpSent(false); setOtpValues(['', '', '', '']); }
  };

  // ── Login (preserved exactly) ──
  const handleLogin = async () => {
    const errors = {};
    if (!validatePhone(authFormData.phone)) errors.phone = 'رقم هاتف غير صحيح';
    if (!authFormData.password || authFormData.password.length < 6) errors.password = 'كلمة المرور مطلوبة';
    if (Object.keys(errors).length > 0) { setAuthErrors(errors); return; }
    setIsLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await loginWithPassword({ phoneNumber: fullPhone, password: authFormData.password });
      if (result.success && result.user) {
        login({ id: result.user._id, name: result.user.fullName, phone: result.user.phoneNumber, email: result.user.email, preferredLanguage: result.user.preferredLanguage, isVerified: result.user.isVerified });
        setStep(1);
        showToast('تم تسجيل الدخول', 'success');
      } else if (result.requiresOtpVerification) {
        try { await requestOTP({ phoneNumber: countryCode + authFormData.phone }); } catch {}
        setOtpSent(true); setOtpTimer(120);
        showToast('حسابك غير مفعّل. تم إرسال رمز التحقق مجدداً.', 'info');
      } else {
        setAuthErrors({ password: result.message || 'فشل تسجيل الدخول' });
        showToast(result.message || 'Login failed', 'error');
      }
    } catch { showToast('خطأ في الاتصال', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── Register (preserved exactly) ──
  const handleRegister = async () => {
    const errors = {};
    if (!authFormData.fullName.trim()) errors.fullName = 'الاسم مطلوب';
    if (!validateEmail(authFormData.email)) errors.email = 'بريد غير صحيح';
    if (!validatePhone(authFormData.phone)) errors.phone = 'رقم هاتف غير صحيح';
    if (!authFormData.password || authFormData.password.length < 6) errors.password = '6 أحرف على الأقل';
    if (authFormData.password !== authFormData.confirmPassword) errors.confirmPassword = 'كلمات المرور غير متطابقة';
    if (Object.keys(errors).length > 0) { setAuthErrors(errors); return; }
    setIsLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await registerUser({ fullName: authFormData.fullName, email: authFormData.email, phoneNumber: fullPhone, preferredLanguage: lang });
      if (result.success) {
        if (result.userId) await setPassword({ userId: result.userId, password: authFormData.password });
        await requestOTP({ phoneNumber: fullPhone });
        setOtpSent(true); setOtpTimer(120);
        showToast('تم إرسال الرمز', 'success');
      } else { setAuthErrors({ phone: result.message }); showToast(result.message, 'error'); }
    } catch { showToast('خطأ في التسجيل', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── OTP verify (preserved exactly) ──
  const handleOtpVerify = async () => {
    const isComplete = otpValues.every(v => v.length === 1);
    if (!isComplete) return;
    setIsLoading(true);
    try {
      const phoneNumber = `${countryCode}${authFormData.phone}`;
      const code = otpValues.join('');
      const result = await verifyOTP({ phoneNumber, code });
      if (!result.success) { showToast(result.message, 'error'); return; }
      login({ id: result.userId, name: authFormData.fullName || '', phone: phoneNumber, email: authFormData.email || '', avatar: null });
      setStep(1);
      showToast('تم إنشاء الحساب', 'success');
    } catch { showToast('خطأ في التحقق', 'error'); }
    finally { setIsLoading(false); }
  };

  // ── Final submission (bank/cash) ──
  const handleSubmitDonation = async () => {
    if (!uploadedFile) { showToast('يرجى رفع صورة الإيصال', 'error'); return; }
    setIsLoading(true);
    try {
      const donationId = await createDonation({
        userId: user?.userId || user?.id,
        projectId,
        amount: calculateTotalAmount(),
        paymentMethod: donationData.paymentMethod === 'transfer' ? (donationData.transferType === 'cash' ? 'cash_agency' : 'bank_transfer') : 'bank_transfer',
        coversFees: donationData.coverFees,
        isAnonymous: donationData.isAnonymous,
        message: donationData.dedication || donationData.message || '',
        bankName: donationData.bankName || '',
        transactionReference: donationData.transactionReference || '',
      });
      const uploadUrl = await generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': uploadedFile.type }, body: uploadedFile });
      if (!uploadResponse.ok) throw new Error('Receipt upload failed');
      const { storageId } = await uploadResponse.json();
      await uploadReceiptMutation({ donationId, receiptUrl: storageId });
      setDonationReference(donationData.transactionReference?.trim() || donationId);
      setStep(6);
      showToast('تم إرسال التبرع بنجاح', 'success');
    } catch (err) {
      console.error('Donation error:', err);
      showToast('فشل إرسال التبرع', 'error');
    } finally { setIsLoading(false); }
  };

  // ── Card checkout (Whop) ──
  const handleWhopCheckout = async () => {
    setIsLoading(true);
    try {
      const { purchaseUrl } = await startWhopCheckout({
        userId: user?.userId || user?.id,
        projectId,
        amount: calculateTotalAmount(),
        coversFees: donationData.coverFees,
        isAnonymous: donationData.isAnonymous,
        message: donationData.dedication || '',
      });
      window.location.href = purchaseUrl;
    } catch (err) {
      console.error('Whop checkout error:', err);
      setIsLoading(false);
      showToast('فشل إنشاء جلسة الدفع', 'error');
    }
  };

  // ── Navigation helpers ──
  const getNextStep = () => {
    if (step === 2 && donationData.paymentMethod === 'card') return isAuthenticated ? 5 : 4;
    if (step === 3 && isAuthenticated) return 5; // skip personal info for logged-in users
    return step + 1;
  };

  const handleBack = () => {
    if (step === 0) { navigate(-1); return; }
    if (step === 4 && donationData.paymentMethod === 'card') { setStep(2); return; }
    if (step === 5 && isAuthenticated) { setStep(donationData.paymentMethod === 'card' ? 2 : 3); return; }
    if (step === 1 && !isAuthenticated) { setStep(0); return; }
    setStep(s => s - 1);
  };

  // ── Bottom bar action ──
  const handleNext = async () => {
    if (step === 0) {
      if (authMode === 'guest') { setStep(1); return; }
      if (authMode === 'login') { if (otpSent) { await handleOtpVerify(); } else { await handleLogin(); } return; }
      if (authMode === 'register') { if (otpSent) { await handleOtpVerify(); } else { await handleRegister(); } return; }
    }
    if (step === 5) {
      // Review confirm
      if (donationData.paymentMethod === 'card') { await handleWhopCheckout(); }
      else { await handleSubmitDonation(); }
      return;
    }
    setStep(getNextStep());
  };

  const isNextDisabled = () => {
    if (isLoading) return true;
    if (step === 1 && calculateTotal() <= 0) return true;
    if (step === 2 && !donationData.paymentMethod) return true;
    if (step === 3 && !uploadedFile && !donationData.transactionReference?.trim()) return true;
    if (step === 4 && !isAuthenticated && (!donationData.donorName?.trim() || !donationData.donorPhone?.trim())) return true;
    if (step === 5 && !agreedTerms) return true;
    return false;
  };

  const getNextLabel = () => {
    if (step === 0) return authMode === 'guest' ? 'التالي: اختيار المبلغ →' : otpSent ? 'تحقق' : authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب';
    if (step === 5) return isLoading ? '...' : (donationData.paymentMethod === 'card' ? '💳 الدفع بالبطاقة' : '🤲 أرسل تبرعي الآن');
    const labels = ['', 'التالي: طريقة الدفع →', 'التالي: رفع الوصل →', 'التالي: بياناتك →', 'التالي: المراجعة →'];
    if (step === 2 && donationData.paymentMethod === 'card') return 'التالي: بياناتك →';
    return labels[step] || 'التالي';
  };

  const amount = calculateTotal();

  // ── Render ──
  return (
    <div style={{ height: '100dvh', background: '#F0F7F7', fontFamily: 'var(--font-arabic)', color: '#0e1a1b', display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{ width: '100%', maxWidth: 430, height: '100%', background: 'white', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

        {/* Top bar */}
        {step < 6 && <TopBar onBack={handleBack} />}

        {/* Segmented progress */}
        {step < 6 && <SegProgress step={step} />}

        {/* Project context card (steps 0-4) */}
        {step < 5 && project !== undefined && (
          <ProjectCtx project={project} step={step} amount={amount} />
        )}

        {/* Step content */}
        {step === 0 && (
          <Step0Auth
            authMode={authMode} setAuthMode={mode => { handleAuthModeSwitch(mode); }}
            authFormData={authFormData} handleAuthChange={handleAuthChange}
            handlePhoneChange={handlePhoneChange} phoneInputRef={phoneInputRef}
            countryCode={countryCode} setCountryCode={setCountryCode}
            showPassword={showPassword} setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
            authErrors={authErrors} otpSent={otpSent}
            otpValues={otpValues} setOtpValues={setOtpValues}
            otpRefs={otpRefs} otpTimer={otpTimer} setOtpTimer={setOtpTimer}
            lang={lang} formatPhoneDisplay={formatPhoneDisplay}
          />
        )}
        {step === 1 && <Step1Amount donationData={donationData} setDonationData={setDonationData} />}
        {step === 2 && <Step2Payment donationData={donationData} setDonationData={setDonationData} bankInfo={bankInfo} showToast={showToast} lang={lang} />}
        {step === 3 && <Step3Receipt uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} dragActive={dragActive} setDragActive={setDragActive} showToast={showToast} lang={lang} amount={amount} donationData={donationData} setDonationData={setDonationData} />}
        {step === 4 && <Step4Info donationData={donationData} setDonationData={setDonationData} lang={lang} />}
        {step === 5 && <Step5Review donationData={donationData} project={project} uploadedFile={uploadedFile} amount={amount} agreedTerms={agreedTerms} setAgreedTerms={setAgreedTerms} setStep={setStep} />}
        {step === 6 && <Step6Success donationReference={donationReference} project={project} navigate={navigate} resetDonation={resetDonation} lang={lang} />}

        {/* Bottom action bar */}
        {step < 6 && (
          <div style={{ flexShrink: 0, padding: '14px 16px', background: 'white', borderTop: '1px solid #E5E9EB' }}>
            {step === 0 ? (
              <button onClick={handleNext} disabled={isLoading}
                style={{ width: '100%', height: 52, background: isLoading ? '#94a3b8' : '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'var(--font-arabic)' }}>
                {isLoading ? '...' : getNextLabel()}
              </button>
            ) : step === 5 ? (
              <div>
                <button onClick={handleNext} disabled={isNextDisabled()}
                  style={{ width: '100%', height: 56, background: isNextDisabled() ? '#E5E9EB' : '#0d7477', color: isNextDisabled() ? '#94a3b8' : 'white', border: 'none', borderRadius: 16, fontSize: 17, fontWeight: 800, cursor: isNextDisabled() ? 'not-allowed' : 'pointer', boxShadow: isNextDisabled() ? 'none' : '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'var(--font-arabic)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {getNextLabel()}
                </button>
                <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>ستصلك رسالة تأكيد فور إرسال التبرع</div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>
                  المجموع<br />
                  <strong style={{ fontSize: 18, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>{amount}</strong>{' '}
                  <span style={{ fontSize: 11 }}>د.م</span>
                </div>
                <button onClick={handleNext} disabled={isNextDisabled()}
                  style={{ flex: 1, height: 52, background: isNextDisabled() ? '#E5E9EB' : '#0d7477', color: isNextDisabled() ? '#94a3b8' : 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: isNextDisabled() ? 'not-allowed' : 'pointer', boxShadow: isNextDisabled() ? 'none' : '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'var(--font-arabic)' }}>
                  {isLoading ? '...' : getNextLabel()}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
