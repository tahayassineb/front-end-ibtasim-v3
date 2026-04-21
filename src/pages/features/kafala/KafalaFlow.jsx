import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import KafalaAvatar from '../../../components/kafala/KafalaAvatar';
import CountryCodeSelector, { validatePhoneByCountry } from '../../../components/CountryCodeSelector';

// ============================================
// KAFALA FLOW — Sponsorship Wizard (Warm Sand Palette)
// Steps: 0=Auth, 1=Plan, 2=Payment, 3=Review, 4=Submit
// ============================================

const STEPS = 4;

const STEP_LABELS = [
  'الخطوة 1 من 4 — تسجيل الدخول',
  'الخطوة 2 من 4 — اختيار خطة الكفالة',
  'الخطوة 3 من 4 — طريقة الدفع',
  'الخطوة 4 من 4 — مراجعة وتأكيد',
];

// Kafala color tokens
const K = {
  kdark: '#8B6914',
  k: '#C4A882',
  kbg: '#F5EBD9',
  k100: '#E8D4B0',
};

export default function KafalaFlow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, showToast, user: appUser, isAuthenticated, login } = useApp();
  const lang = currentLanguage?.code || 'ar';

  // ── Auth mutations (preserved exactly) ──
  const loginWithPassword = useMutation(api.auth.loginWithPassword);
  const registerUser = useMutation(api.auth.registerUser);
  const requestOTP = useMutation(api.auth.requestOTP);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const setPasswordMut = useMutation(api.auth.setPassword);

  // ── Kafala mutations (preserved exactly) ──
  const createSponsorship = useMutation(api.kafala.createSponsorship);
  const cancelSponsorship = useMutation(api.kafala.cancelSponsorship);
  const uploadKafalaReceipt = useMutation(api.kafala.uploadKafalaReceipt);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const createCheckout = useAction(api.kafalaPayments.createKafalaWhopCheckout);

  // ── Queries (preserved exactly) ──
  const kafalaData = useQuery(api.kafala.getKafalaById, { kafalaId: id });
  const bankInfoRaw = useQuery(api.config.getConfig, { key: 'bank_info' });

  const bankInfo = React.useMemo(() => {
    if (!bankInfoRaw) return { name: '—', rib: '—', bank: '—' };
    try { return JSON.parse(bankInfoRaw); } catch { return { name: '—', rib: '—', bank: '—' }; }
  }, [bankInfoRaw]);

  // ── Step state ──
  const [step, setStep] = useState(isAuthenticated ? 1 : 0);

  // Skip auth step if user is already authenticated when the component mounts or auth loads
  useEffect(() => {
    if (isAuthenticated && step === 0) setStep(1);
  }, [isAuthenticated]);

  // ── Auth state ──
  const [authMode, setAuthMode] = useState(null);
  const [authFormData, setAuthFormData] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [authErrors, setAuthErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+212');
  const phoneInputRef = useRef();
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];

  // ── Payment state ──
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentCategory, setPaymentCategory] = useState('bank_agency'); // 'card' | 'bank_agency'
  const [planType, setPlanType] = useState('monthly'); // monthly or annual
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [reference, setReference] = useState('');
  const [bankName, setBankName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => validatePhoneByCountry(phone, countryCode);

  useEffect(() => {
    if (isAuthenticated && step === 0) setStep(1);
  }, [isAuthenticated]);

  // ── Auth handlers (preserved exactly) ──
  const handleAuthModeSwitch = (mode) => {
    setAuthMode(mode); setAuthErrors({});
    if (otpSent) { setOtpSent(false); setOtpValues(['', '', '', '']); }
  };
  const handleAuthChange = (e) => {
    const { name, value } = e.target;
    setAuthFormData(p => ({ ...p, [name]: value }));
    if (authErrors[name]) setAuthErrors(p => ({ ...p, [name]: null }));
  };
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, '');
    setAuthFormData(p => ({ ...p, phone: value }));
    if (authErrors.phone) setAuthErrors(p => ({ ...p, phone: null }));
  };

  const handleLogin = async () => {
    const errors = {};
    if (!validatePhone(authFormData.phone)) errors.phone = 'رقم هاتف غير صحيح';
    if (!authFormData.password || authFormData.password.length < 6) errors.password = 'كلمة المرور مطلوبة';
    if (Object.keys(errors).length) { setAuthErrors(errors); return; }
    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await loginWithPassword({ phoneNumber: fullPhone, password: authFormData.password });
      if (result.success && result.user) {
        login({ id: result.user._id, userId: result.user._id, name: result.user.fullName, phone: result.user.phoneNumber, email: result.user.email });
        setStep(1);
        showToast('تم تسجيل الدخول', 'success');
      } else if (result.requiresOtpVerification) {
        try { await requestOTP({ phoneNumber: fullPhone }); } catch {}
        setOtpSent(true); setOtpTimer(120);
        showToast('حسابك غير مفعّل. تم إرسال رمز التحقق مجدداً.', 'info');
      } else {
        setAuthErrors({ password: result.message || 'فشل تسجيل الدخول' });
      }
    } catch { setAuthErrors({ password: 'خطأ في الاتصال' }); }
    finally { setIsAuthLoading(false); }
  };

  const handleRegister = async () => {
    const errors = {};
    if (!authFormData.fullName.trim()) errors.fullName = 'الاسم مطلوب';
    if (!validateEmail(authFormData.email)) errors.email = 'بريد غير صحيح';
    if (!validatePhone(authFormData.phone)) errors.phone = 'رقم هاتف غير صحيح';
    if (!authFormData.password || authFormData.password.length < 6) errors.password = '6 أحرف على الأقل';
    if (authFormData.password !== authFormData.confirmPassword) errors.confirmPassword = 'كلمات المرور غير متطابقة';
    if (Object.keys(errors).length) { setAuthErrors(errors); return; }
    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await registerUser({ fullName: authFormData.fullName, email: authFormData.email, phoneNumber: fullPhone, preferredLanguage: lang });
      if (result.success) {
        if (result.userId) await setPasswordMut({ userId: result.userId, password: authFormData.password });
        await requestOTP({ phoneNumber: fullPhone });
        setOtpSent(true); setOtpTimer(120);
        showToast('تم إرسال الرمز', 'success');
      } else { setAuthErrors({ phone: result.message }); }
    } catch { showToast('خطأ في التسجيل', 'error'); }
    finally { setIsAuthLoading(false); }
  };

  const handleOtpVerify = async () => {
    if (!otpValues.every(v => v.length === 1)) return;
    setIsAuthLoading(true);
    try {
      const phoneNumber = countryCode + authFormData.phone;
      const result = await verifyOTP({ phoneNumber, code: otpValues.join('') });
      if (!result.success) { showToast(result.message, 'error'); return; }
      login({ id: result.userId, userId: result.userId, name: authFormData.fullName, phone: phoneNumber, email: authFormData.email });
      setStep(1);
      showToast('تم إنشاء الحساب', 'success');
    } catch { showToast('خطأ في التحقق', 'error'); }
    finally { setIsAuthLoading(false); }
  };

  // ── Submit (preserved exactly) ──
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const userId = appUser?.userId || appUser?.id;
      if (!userId) { showToast('يرجى تسجيل الدخول أولاً', 'error'); setStep(0); return; }
      const result = await createSponsorship({ kafalaId: id, userId, paymentMethod, isAnonymous });

      if (paymentMethod === 'card_whop') {
        let userCountry;
        try { const g = await fetch('https://ipapi.co/json/'); if (g.ok) userCountry = (await g.json()).country_code; } catch {}
        let purchaseUrl;
        try { purchaseUrl = await createCheckout({ kafalaId: id, donationId: result.donationId, userCountry }); }
        catch (whopErr) { try { await cancelSponsorship({ sponsorshipId: result.sponsorshipId, donationId: result.donationId }); } catch {} throw whopErr; }
        window.location.href = purchaseUrl;
        return;
      }

      if (paymentMethod === 'bank_transfer') {
        let storageId = '';
        if (receipt) {
          const uploadUrl = await generateUploadUrl();
          const uploadRes = await fetch(uploadUrl, { method: 'POST', body: receipt, headers: { 'Content-Type': receipt.type } });
          const uploadData = await uploadRes.json();
          storageId = uploadData.storageId;
        }
        await uploadKafalaReceipt({ donationId: result.donationId, receiptUrl: storageId, bankName, transactionReference: reference || undefined });
      }

      if (paymentMethod === 'cash_agency') {
        let storageId = '';
        if (receipt) {
          const uploadUrl = await generateUploadUrl();
          const uploadRes = await fetch(uploadUrl, { method: 'POST', body: receipt, headers: { 'Content-Type': receipt.type } });
          const uploadData = await uploadRes.json();
          storageId = uploadData.storageId;
        }
        await uploadKafalaReceipt({ donationId: result.donationId, receiptUrl: storageId, transactionReference: reference || undefined, bankName: bankName || 'cash_agency' });
      }

      setDone(true);
    } catch (err) {
      const msg = err?.message || 'حدث خطأ. يرجى المحاولة مرة أخرى.';
      showToast(msg.includes('مكفول') ? 'هذا اليتيم مكفول بالفعل. الرجاء اختيار يتيم آخر.' : msg, 'error');
    } finally { setSubmitting(false); }
  };

  // ── Loading / guards ──
  if (kafalaData === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: K.kbg, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div><p style={{ color: '#94a3b8' }}>جاري التحميل...</p></div>
      </div>
    );
  }
  if (!kafalaData) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>الكفالة غير موجودة</div>;
  }
  if (kafalaData.status === 'sponsored') {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤲</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: K.kdark, marginBottom: 20 }}>هذا اليتيم مكفول بالفعل. الرجاء اختيار يتيم آخر.</p>
          <button onClick={() => navigate('/kafala')} style={{ background: K.kdark, color: 'white', padding: '12px 28px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>العودة للقائمة</button>
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
        <div style={{ background: 'white', borderRadius: 28, boxShadow: '0 10px 40px rgba(0,0,0,.12)', padding: 40, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 40 }}>✅</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: K.kdark, marginBottom: 12 }}>تم تسجيل كفالتك!</h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>جزاك الله خيراً على هذا العمل الصالح. ستتلقى رسالة تأكيد عبر واتساب.</p>
          {paymentMethod !== 'card_whop' && (
            <p style={{ fontSize: 12, color: '#b45309', background: '#FEF3C7', borderRadius: 10, padding: '10px 16px', marginBottom: 20 }}>سيتم مراجعة تبرعك وتأكيده خلال 24 ساعة.</p>
          )}
          <button onClick={() => navigate('/')} style={{ background: K.kdark, color: 'white', padding: '14px 32px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15, fontFamily: 'Tajawal, sans-serif', boxShadow: `0 4px 14px rgba(196,168,130,.4)` }}>
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  const kafala = kafalaData;
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceMAD = (kafala.monthlyPrice / 100).toLocaleString('fr-MA');
  const annualPrice = Math.round(kafala.monthlyPrice * 12 * 0.9 / 100).toLocaleString('fr-MA');
  const isFemale = kafala.gender === 'female';
  const donorName = isAnonymous ? 'مجهول الهوية' : (appUser?.name || '—');
  const inputStyle = { width: '100%', height: 52, border: `1.5px solid ${K.k100}`, borderRadius: 14, padding: '0 16px', fontSize: 15, fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', background: 'white', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: K.kbg, fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', display: 'flex', justifyContent: 'center' }} dir="rtl">
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: `1px solid ${K.k100}`, flexShrink: 0, background: 'white' }}>
          <button onClick={() => { if (step > 1) setStep(s => s - 1); else if (step === 1) navigate(`/kafala/${id}`); else navigate(-1); }}
            style={{ width: 36, height: 36, borderRadius: '50%', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: 'none', cursor: 'pointer' }}>←</button>
          <div style={{ fontSize: 15, fontWeight: 700 }}>🤲 إتمام الكفالة</div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: K.kdark }}>?</div>
        </div>

        {/* Segmented progress (4 segments, steps 1-4) */}
        {step > 0 && (
          <div style={{ padding: '14px 20px 0', flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 100, background: i < step ? K.kdark : i === step ? K.k : '#E5E9EB' }} />
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{STEP_LABELS[step - 1] || ''}</div>
          </div>
        )}

        {/* Orphan context card */}
        {step > 0 && (
          <div style={{ margin: '14px 16px', background: K.kbg, borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, border: `1px solid ${K.k100}`, flexShrink: 0 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg,${K.kdark},${K.k})`, border: `2px solid ${K.k100}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={52} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: K.kdark }}>{kafala.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>🎂 {kafala.age} سنة · 📍 {kafala.location}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{priceMAD}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>درهم/شهر</div>
            </div>
          </div>
        )}

        {/* Step content */}
        <div style={{ flex: 1, padding: '0 16px 16px', overflowY: 'auto' }}>

          {/* ── STEP 0: Auth ── */}
          {step === 0 && (
            <div style={{ padding: '20px 0' }}>
              {/* When authMode is selected: show ONLY the form (full screen within step) */}
              {authMode ? (
                <>
                  <button onClick={() => setAuthMode(null)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: K.kdark, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'Tajawal, sans-serif' }}>
                    ← تغيير الخيار
                  </button>

                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                    {authMode === 'login' ? '🔑 تسجيل الدخول' : '✨ إنشاء حساب'}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                    {authMode === 'login' ? 'أدخل رقم هاتفك وكلمة المرور' : 'انضم إلى مجتمع الكافلين'}
                  </div>

                  {otpSent ? (
                    <div style={{ background: K.kbg, borderRadius: 16, padding: 20, border: `1px solid ${K.k100}`, textAlign: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>أدخل رمز التحقق</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12, direction: 'ltr' }}>
                        {[0, 1, 2, 3].map(i => (
                          <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={otpValues[i]}
                            onChange={e => { const v = e.target.value.replace(/\D/, ''); if (v.length <= 1) { const n = [...otpValues]; n[i] = v; setOtpValues(n); if (v && i < 3) otpRefs[i + 1].current?.focus(); } }}
                            onKeyDown={e => { if (e.key === 'Backspace' && !otpValues[i] && i > 0) otpRefs[i - 1].current?.focus(); }}
                            style={{ width: 52, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, border: `2px solid ${otpValues[i] ? K.kdark : K.k100}`, borderRadius: 12, outline: 'none', background: otpValues[i] ? K.kbg : 'white', fontFamily: 'Inter, sans-serif' }}
                          />
                        ))}
                      </div>
                      {otpTimer > 0 ? (
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>إعادة الإرسال بعد {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</div>
                      ) : (
                        <button onClick={() => setOtpTimer(120)} style={{ fontSize: 13, color: K.kdark, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>إعادة إرسال الرمز</button>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', background: K.kbg, borderRadius: 16, border: `1px solid ${K.k100}`, marginBottom: 14 }}>
                      {authMode === 'register' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>الاسم *</div>
                            <input type="text" name="fullName" value={authFormData.fullName} onChange={handleAuthChange} placeholder="الاسم" style={{ ...inputStyle, height: 44 }} />
                            {authErrors.fullName && <p style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>{authErrors.fullName}</p>}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>البريد *</div>
                            <input type="email" name="email" value={authFormData.email} onChange={handleAuthChange} placeholder="email@..." dir="ltr" style={{ ...inputStyle, height: 44 }} />
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>رقم الهاتف *</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <CountryCodeSelector value={countryCode} onChange={setCountryCode} lang={lang} />
                        <input ref={phoneInputRef} type="tel" name="phone" value={authFormData.phone} onChange={handlePhoneChange} placeholder="6XXXXXXXX" maxLength={15} dir="ltr" inputMode="numeric" style={{ ...inputStyle, flex: 1, height: 44 }} />
                      </div>
                      {authErrors.phone && <p style={{ color: '#ef4444', fontSize: 11, marginTop: -6, marginBottom: 8 }}>{authErrors.phone}</p>}
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>كلمة المرور *</div>
                      <div style={{ position: 'relative', marginBottom: authMode === 'register' ? 10 : 0 }}>
                        <input type={showPassword ? 'text' : 'password'} name="password" value={authFormData.password} onChange={handleAuthChange} placeholder="••••••••" style={{ ...inputStyle, height: 44, paddingLeft: 40 }} />
                        <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPassword ? '🙈' : '👁'}</button>
                      </div>
                      {authErrors.password && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{authErrors.password}</p>}
                      {authMode === 'register' && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>تأكيد كلمة المرور *</div>
                          <input type="password" name="confirmPassword" value={authFormData.confirmPassword} onChange={handleAuthChange} placeholder="••••••••" style={{ ...inputStyle, height: 44 }} />
                          {authErrors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{authErrors.confirmPassword}</p>}
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '10px 14px', background: K.kbg, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', border: `1px solid ${K.k100}` }}>
                    🔒 <span>بياناتك محمية بتشفير آمن</span>
                  </div>
                </>
              ) : (
                /* No auth mode selected yet — show the 2 option cards */
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>كيف تريد المتابعة؟</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>سجّل دخولك لمتابعة كفالاتك</div>
                  {[
                    { id: 'login', icon: '🔑', title: 'تسجيل الدخول', desc: 'لديك حساب؟ سجّل دخولك', badge: '✓ الأسرع' },
                    { id: 'register', icon: '✨', title: 'إنشاء حساب', desc: 'انضم إلى مجتمع الكافلين', badge: '🎁 مجاني' },
                  ].map(opt => (
                    <div key={opt.id} onClick={() => setAuthMode(opt.id)}
                      style={{ background: 'white', border: `1.5px solid ${K.k100}`, borderRadius: 16, padding: 18, marginBottom: 12, cursor: 'pointer' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{opt.icon}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{opt.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{opt.desc}</div>
                      <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: K.kbg, color: K.kdark, padding: '2px 8px', borderRadius: 100, marginTop: 6, border: `1px solid ${K.k100}` }}>{opt.badge}</div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 14px', background: K.kbg, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', border: `1px solid ${K.k100}` }}>
                    🔒 <span>بياناتك محمية بتشفير آمن</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 1: Plan selection ── */}
          {step === 1 && (
            <div style={{ paddingTop: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>اختر خطة الكفالة</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>الكفالة الشهرية تُجدَّد تلقائياً — يمكنك الإيقاف في أي وقت</div>

              {/* Monthly */}
              {[
                { id: 'monthly', title: 'كفالة شهرية', desc: 'تجديد تلقائي كل شهر', badge: '⭐ الأكثر اختياراً', price: priceMAD, unit: 'درهم/شهر', badgeBg: K.kbg, badgeColor: K.kdark },
                { id: 'annual', title: 'كفالة سنوية', desc: 'ادفع مرة واحدة وفّر 10%', badge: `توفير 360 درهم`, price: annualPrice, unit: 'درهم/سنة', badgeBg: '#FEF3C7', badgeColor: '#b45309' },
              ].map(plan => {
                const sel = planType === plan.id;
                return (
                  <div key={plan.id} onClick={() => setPlanType(plan.id)}
                    style={{ border: `2px solid ${sel ? K.kdark : '#E5E9EB'}`, borderRadius: 16, padding: 16, marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: sel ? K.kbg : 'white', boxShadow: sel ? `0 0 0 3px rgba(139,105,20,.1)` : 'none', transition: 'all .15s' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${sel ? K.kdark : '#E5E9EB'}`, background: sel ? K.kdark : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{plan.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{plan.desc}</div>
                      <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: plan.badgeBg, color: plan.badgeColor, padding: '2px 8px', borderRadius: 100, marginTop: 4, border: `1px solid ${K.k100}` }}>{plan.badge}</div>
                    </div>
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{plan.price}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{plan.unit}</div>
                    </div>
                  </div>
                );
              })}

              {/* Impact card */}
              <div style={{ background: K.kbg, borderRadius: 14, padding: 14, marginBottom: 14, border: `1px solid ${K.k100}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: K.kdark, marginBottom: 10 }}>🤲 كفالتك الشهرية ستغطي:</div>
                {['كتب ولوازم مدرسية كاملة', 'وجبات يومية صحية', 'رعاية صحية شهرية', 'تقرير ربع سنوي عن أحوال ' + kafala.name].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                    <span style={{ color: K.kdark, fontWeight: 700 }}>✓</span><span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Payment note */}
              <div style={{ background: 'white', border: `1px solid ${K.k100}`, borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                💳 <strong>طريقة الدفع:</strong> يمكنك الدفع بتحويل بنكي شهري أو بطاقة بنكية. ستُرسَل لك تذكيرات على واتساب قبل كل تجديد.
              </div>
            </div>
          )}

          {/* ── STEP 2: Payment method (2 options) ── */}
          {step === 2 && (
            <div style={{ paddingTop: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>طريقة الدفع</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>اختر الطريقة المناسبة لك</div>

              {/* Option 1: Card */}
              <div
                onClick={() => { setPaymentCategory('card'); setPaymentMethod('card_whop'); }}
                style={{ border: `2px solid ${paymentCategory === 'card' ? K.kdark : '#E5E9EB'}`, borderRadius: 18, padding: 18, marginBottom: 12, cursor: 'pointer', background: paymentCategory === 'card' ? K.kbg : 'white', boxShadow: paymentCategory === 'card' ? `0 0 0 3px rgba(139,105,20,.08)` : 'none', transition: 'all .15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentCategory === 'card' ? K.kdark : '#E5E9EB'}`, background: paymentCategory === 'card' ? K.kdark : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {paymentCategory === 'card' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <div style={{ fontSize: 22 }}>💳</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>بطاقة بنكية</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Visa، Mastercard — اشتراك تلقائي شهري</div>
                  </div>
                </div>
                {paymentCategory === 'card' && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${K.k100}`, fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
                    ستُوجَّه إلى صفحة دفع آمنة عبر Whop. يتجدد الاشتراك تلقائياً كل شهر ويمكنك الإلغاء في أي وقت.
                  </div>
                )}
              </div>

              {/* Option 2: Bank / Agency */}
              <div
                onClick={() => { setPaymentCategory('bank_agency'); if (paymentMethod === 'card_whop') setPaymentMethod('bank_transfer'); }}
                style={{ border: `2px solid ${paymentCategory === 'bank_agency' ? K.kdark : '#E5E9EB'}`, borderRadius: 18, padding: 18, marginBottom: 12, cursor: 'pointer', background: paymentCategory === 'bank_agency' ? K.kbg : 'white', boxShadow: paymentCategory === 'bank_agency' ? `0 0 0 3px rgba(139,105,20,.08)` : 'none', transition: 'all .15s' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${paymentCategory === 'bank_agency' ? K.kdark : '#E5E9EB'}`, background: paymentCategory === 'bank_agency' ? K.kdark : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {paymentCategory === 'bank_agency' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                  </div>
                  <div style={{ fontSize: 22 }}>🏦</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>تحويل بنكي أو وكالة</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>بنك · Wafacash · Cash Plus</div>
                  </div>
                </div>

                {paymentCategory === 'bank_agency' && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${K.k100}` }}>
                    {/* Bank account details */}
                    <div style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${K.k100}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: K.kdark, marginBottom: 10 }}>🏦 بيانات الحساب البنكي</div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>صاحب الحساب</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0e1a1b' }}>{bankInfo.name}</div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>رقم الحساب (RIB)</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: K.kdark, fontFamily: 'Inter, sans-serif', letterSpacing: '.04em' }} dir="ltr">{bankInfo.rib}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((bankInfo.rib || '').replace(/\s/g, '')); showToast('تم نسخ الرقم', 'success'); }}
                        style={{ fontSize: 11, background: K.kbg, color: K.kdark, border: `1px solid ${K.k100}`, padding: '4px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
                      >
                        📋 نسخ رقم الحساب
                      </button>
                    </div>

                    {/* Sub-method toggle */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      {[
                        { id: 'bank_transfer', label: '🏦 تحويل بنكي' },
                        { id: 'cash_agency', label: '💵 وكالة نقد' },
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={(e) => { e.stopPropagation(); setPaymentMethod(sub.id); }}
                          style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1.5px solid ${paymentMethod === sub.id ? K.kdark : K.k100}`, background: paymentMethod === sub.id ? K.kdark : 'white', color: paymentMethod === sub.id ? 'white' : '#64748b', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', transition: 'all .15s' }}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>

                    {/* Shared hidden file input — always mounted so fileRef is valid for both sub-methods */}
                    <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setReceipt(e.target.files?.[0] || null)} />

                    {/* Bank transfer: receipt upload */}
                    {paymentMethod === 'bank_transfer' && (
                      <div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>رفع وصل الدفع</div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                          style={{ width: '100%', border: `2px dashed ${K.k100}`, borderRadius: 12, padding: '14px', textAlign: 'center', background: 'white', cursor: 'pointer', fontSize: 13, color: receipt ? '#16a34a' : '#64748b', fontFamily: 'Tajawal, sans-serif' }}
                        >
                          {receipt ? `✓ ${receipt.name}` : '📷 اختر ملف الوصل (اختياري)'}
                        </button>
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>رقم المرجع (اختياري)</div>
                          <input
                            type="text" placeholder="رقم الوصل من البنك" value={reference}
                            onClick={(e) => e.stopPropagation()}
                            onChange={e => setReference(e.target.value)}
                            style={{ ...inputStyle, height: 44, borderColor: K.k100 }} dir="ltr"
                          />
                        </div>
                      </div>
                    )}

                    {/* Cash agency: receipt upload + reference input */}
                    {paymentMethod === 'cash_agency' && (
                      <div>
                        <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10, lineHeight: 1.6 }}>
                          حوّل المبلغ عبر أي وكالة نقد (Wafacash، Cash Plus...) ثم ارفع وصل الدفع أدناه.
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>رفع وصل الدفع</div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                          style={{ width: '100%', border: `2px dashed ${K.k100}`, borderRadius: 12, padding: '14px', textAlign: 'center', background: 'white', cursor: 'pointer', fontSize: 13, color: receipt ? '#16a34a' : '#64748b', fontFamily: 'Tajawal, sans-serif', marginBottom: 10 }}
                        >
                          {receipt ? `✓ ${receipt.name}` : '📷 اختر ملف الوصل (اختياري)'}
                        </button>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>رقم الوصل / المرجع</div>
                        <input
                          type="text" placeholder="أدخل رقم الوصل من الوكالة" value={reference}
                          onClick={(e) => e.stopPropagation()}
                          onChange={e => setReference(e.target.value)}
                          style={{ ...inputStyle, height: 44, borderColor: K.k100 }} dir="ltr"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 3 && (
            <div style={{ paddingTop: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>مراجعة التفاصيل</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>تأكد من صحة التفاصيل</div>

              {/* Total */}
              <div style={{ background: K.kdark, borderRadius: 16, padding: 16, marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>إجمالي الكفالة الشهرية</div>
                <div><span style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{priceMAD}</span>{' '}<span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>درهم / شهر</span></div>
              </div>

              {/* Summary card */}
              <div style={{ background: 'white', border: `1.5px solid ${K.k100}`, borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ background: K.kbg, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${K.k100}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg,${K.kdark},${K.k})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                    <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={44} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: K.kdark }}>{kafala.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>✓ {planType === 'monthly' ? 'كفالة شهرية' : 'كفالة سنوية'}</div>
                  </div>
                </div>
                {[
                  { label: 'المبلغ الشهري', value: `${priceMAD} درهم/شهر`, teal: true },
                  { label: 'طريقة الدفع', value: paymentMethod === 'bank_transfer' ? '🏦 تحويل بنكي' : paymentMethod === 'card_whop' ? '💳 بطاقة بنكية' : '💵 وكالة نقد' },
                  { label: 'المتبرع', value: donorName },
                ].map((row, i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${K.k100}` : 'none' }}>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{row.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: row.teal ? K.kdark : '#0e1a1b' }}>{row.value}</div>
                  </div>
                ))}
              </div>

              {/* Anonymous toggle */}
              <div onClick={() => setIsAnonymous(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: K.kbg, borderRadius: 14, border: `1.5px solid ${K.k100}`, marginBottom: 14, cursor: 'pointer' }}>
                <div style={{ width: 44, height: 24, background: isAnonymous ? K.kdark : '#94a3b8', borderRadius: 100, position: 'relative', flexShrink: 0, transition: 'background .15s' }}>
                  <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: isAnonymous ? 22 : 2, transition: 'left .15s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>التبرع باسم مجهول</div>
              </div>

              {/* Trust note */}
              <div style={{ background: K.kbg, borderRadius: 12, padding: '10px 14px', border: `1px solid ${K.k100}`, marginBottom: 14, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                🔒 بياناتك محمية · يمكنك الإلغاء في أي وقت · جمعية معتمدة رسمياً
              </div>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div style={{ flexShrink: 0, padding: '14px 16px', background: 'white', borderTop: `1px solid ${K.k100}` }}>
          {step === 0 ? (
            <button onClick={otpSent ? handleOtpVerify : (authMode === 'login' ? handleLogin : handleRegister)}
              disabled={isAuthLoading}
              style={{ width: '100%', height: 52, background: isAuthLoading ? '#94a3b8' : K.kdark, color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: isAuthLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: `0 4px 14px rgba(196,168,130,.35)` }}>
              {isAuthLoading ? '...' : otpSent ? 'تحقق من الرمز' : authMode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
            </button>
          ) : step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ width: '100%', height: 56, background: K.kdark, color: 'white', border: 'none', borderRadius: 16, fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: `0 4px 14px rgba(196,168,130,.35)` }}>
              {step === 1 ? `🤲 اكفل${isFemale ? 'ها' : 'ه'} — ${priceMAD} درهم/شهر` : 'التالي: مراجعة التفاصيل →'}
            </button>
          ) : (
            <div>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ width: '100%', height: 56, background: submitting ? '#94a3b8' : K.kdark, color: 'white', border: 'none', borderRadius: 16, fontSize: 17, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: submitting ? 'none' : `0 4px 14px rgba(196,168,130,.35)` }}>
                {submitting ? (paymentMethod === 'card_whop' ? 'جاري التحويل...' : 'جاري الإرسال...') : (paymentMethod === 'card_whop' ? '💳 الدفع بالبطاقة' : `🤲 إرسال طلب الكفالة`)}
              </button>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>بدون التزام طويل المدى · إلغاء مجاني في أي وقت</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
