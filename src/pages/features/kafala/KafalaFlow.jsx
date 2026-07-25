import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import KafalaAvatar from '../../../components/kafala/KafalaAvatar';
import CountryCodeSelector, { validatePhoneByCountry } from '../../../components/CountryCodeSelector';
import { getKafalaFlowCopy } from './kafalaFlowCopy';

// ============================================
// KAFALA FLOW — Sponsorship Wizard (Warm Sand Palette)
// Steps: 0=Auth, 1=Plan, 2=Payment, 3=Review, 4=Submit
// ============================================

const STEPS = 4;

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
  const tx = getKafalaFlowCopy(lang);

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
  }, [isAuthenticated, step]);

  // ── Auth state ──
  const [authMode, setAuthMode] = useState(null);
  const [authFormData, setAuthFormData] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [authErrors, setAuthErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [countryCode, setCountryCode] = useState('+212');
  const phoneInputRef = useRef();
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // ── Payment state ──
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentCategory, setPaymentCategory] = useState('bank_agency'); // 'card' | 'bank_agency'
  const [planType, setPlanType] = useState('monthly'); // monthly or annual
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [reference, setReference] = useState('');
  const bankName = '';
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => validatePhoneByCountry(phone, countryCode);

  // ── OTP countdown ──
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const t = setTimeout(() => setOtpTimer(p => p - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [otpSent, otpTimer]);

  useEffect(() => {
    const plans = kafalaData?.availablePlans?.length ? kafalaData.availablePlans : ['monthly', 'annual'];
    if (!plans.includes(planType)) setPlanType(plans[0]);
  }, [kafalaData, planType]);

  const handleResendOtp = async () => {
    try {
      const result = await requestOTP({ phoneNumber: countryCode + authFormData.phone });
      if (!result?.success) {
        showToast(result?.message || tx.resendFailed, 'error');
        return;
      }
      setOtpTimer(120);
      showToast(tx.codeSent, 'success');
    } catch {
      showToast(tx.resendFailed, 'error');
    }
  };

  // ── Auth handlers (preserved exactly) ──
  const handleAuthModeSwitch = (mode) => {
    setAuthMode(mode); setAuthErrors({});
    if (otpSent) { setOtpSent(false); setOtpValues(['', '', '', '', '', '']); }
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
    if (!validatePhone(authFormData.phone)) errors.phone = tx.phoneInvalid;
    if (!authFormData.password || authFormData.password.length < 6) errors.password = tx.passwordRequired;
    if (Object.keys(errors).length) { setAuthErrors(errors); return; }
    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await loginWithPassword({ phoneNumber: fullPhone, password: authFormData.password });
      if (result.success && result.user) {
        login({ id: result.user._id, userId: result.user._id, name: result.user.fullName, phone: result.user.phoneNumber, email: result.user.email });
        setStep(1);
        showToast(tx.loginDone, 'success');
      } else if (result.requiresOtpVerification) {
        try { await requestOTP({ phoneNumber: fullPhone }); } catch { /* remain on verification form */ }
        setOtpSent(true); setOtpTimer(120);
        showToast(tx.unverified, 'info');
      } else {
        setAuthErrors({ password: result.message || tx.loginFailed });
      }
    } catch { setAuthErrors({ password: tx.connectionError }); }
    finally { setIsAuthLoading(false); }
  };

  const handleRegister = async () => {
    const errors = {};
    if (!authFormData.fullName.trim()) errors.fullName = tx.nameRequired;
    if (!validateEmail(authFormData.email)) errors.email = tx.emailInvalid;
    if (!validatePhone(authFormData.phone)) errors.phone = tx.phoneInvalid;
    if (!authFormData.password || authFormData.password.length < 6) errors.password = tx.passwordLength;
    if (authFormData.password !== authFormData.confirmPassword) errors.confirmPassword = tx.passwordMismatch;
    if (Object.keys(errors).length) { setAuthErrors(errors); return; }
    setIsAuthLoading(true);
    try {
      const fullPhone = countryCode + authFormData.phone;
      const result = await registerUser({ fullName: authFormData.fullName, email: authFormData.email, phoneNumber: fullPhone, preferredLanguage: lang });
      if (result.success) {
        if (result.userId) await setPasswordMut({ userId: result.userId, password: authFormData.password });
        await requestOTP({ phoneNumber: fullPhone });
        setOtpSent(true); setOtpTimer(120);
        showToast(tx.codeSent, 'success');
      } else { setAuthErrors({ phone: result.message }); }
    } catch { showToast(tx.registrationError, 'error'); }
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
      showToast(tx.accountCreated, 'success');
    } catch { showToast(tx.verificationError, 'error'); }
    finally { setIsAuthLoading(false); }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const userId = appUser?.userId || appUser?.id;
      if (!userId) { showToast(tx.signInFirst, 'error'); setStep(0); return; }

      if (paymentMethod === 'bank_transfer' && !receipt && !reference.trim()) {
        showToast(tx.receiptRequired, 'error');
        setSubmitting(false);
        return;
      }
      if (paymentMethod === 'cash_agency' && !receipt && !reference.trim()) {
        showToast(tx.receiptRequired, 'error');
        setSubmitting(false);
        return;
      }
      const result = await createSponsorship({ kafalaId: id, userId, paymentMethod, isAnonymous, planType });

      if (paymentMethod === 'card_whop') {
        let userCountry;
        try { const g = await fetch('https://ipapi.co/json/'); if (g.ok) userCountry = (await g.json()).country_code; } catch { /* country is optional checkout metadata */ }
        let purchaseUrl;
        try { purchaseUrl = await createCheckout({ kafalaId: id, donationId: result.donationId, userCountry }); }
        catch (whopErr) { try { await cancelSponsorship({ sponsorshipId: result.sponsorshipId, donationId: result.donationId }); } catch { /* preserve the original checkout error */ } throw whopErr; }
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
      const msg = err?.message || tx.genericError;
      showToast(msg.includes('مكفول') || msg.toLowerCase().includes('sponsored') ? tx.alreadySponsored : msg, 'error');
    } finally { setSubmitting(false); }
  };

  // ── Loading / guards ──
  if (kafalaData === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: K.kbg, fontFamily: 'var(--font-arabic)' }}>
        <div style={{ textAlign: 'center' }}><span className="material-symbols-outlined no-flip" style={{ fontSize: 40, marginBottom: 12 }}>volunteer_activism</span><p style={{ color: '#94a3b8' }}>{tx.loading}</p></div>
      </div>
    );
  }
  if (!kafalaData) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-arabic)' }}>{tx.notFound}</div>;
  }
  if (kafalaData.status === 'sponsored') {
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={currentLanguage?.dir || 'rtl'}>
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🤲</div>
          <p style={{ fontSize: 17, fontWeight: 700, color: K.kdark, marginBottom: 20 }}>{tx.alreadySponsored}</p>
          <button onClick={() => navigate('/kafala')} style={{ background: K.kdark, color: 'white', padding: '12px 28px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>{tx.backList}</button>
        </div>
      </div>
    );
  }

  // ── Success screen ──
  if (done) {
    const isPending = paymentMethod !== 'card_whop';
    return (
      <div style={{ minHeight: '100vh', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-arabic)' }} dir={currentLanguage?.dir || 'rtl'}>
        <div style={{ background: 'white', borderRadius: 28, boxShadow: '0 10px 40px rgba(0,0,0,.12)', padding: 40, maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ width: 88, height: 88, background: isPending ? '#FEF3C7' : '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 40 }}>{isPending ? '⏳' : '✅'}</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: K.kdark, marginBottom: 12 }}>
            {isPending ? tx.pendingTitle : tx.successTitle}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginBottom: 16 }}>
            {isPending
              ? tx.pendingBody
              : tx.successBody
            }
          </p>
          <button onClick={() => navigate('/')} style={{ background: K.kdark, color: 'white', padding: '14px 32px', borderRadius: 14, fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 15, fontFamily: 'var(--font-arabic)', boxShadow: `0 4px 14px rgba(196,168,130,.4)` }}>
            {tx.backHome}
          </button>
        </div>
      </div>
    );
  }

  const kafala = kafalaData;
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceMAD = Number(kafala.monthlyPrice || 0).toLocaleString('fr-MA');
  const annualPriceValue = Number(kafala.annualPrice || Math.round((kafala.monthlyPrice || 0) * 12 * 0.9));
  const annualPrice = annualPriceValue.toLocaleString('fr-MA');
  const availablePlans = kafala.availablePlans?.length ? kafala.availablePlans : ['monthly', 'annual'];
  const selectedPrice = planType === 'annual' ? annualPrice : priceMAD;
  const selectedUnit = planType === 'annual' ? tx.perYear : tx.perMonth;
  const isFemale = kafala.gender === 'female';
  const donorName = isAnonymous ? tx.anonymousName : (appUser?.name || '—');
  const inputStyle = { width: '100%', height: 52, border: `1.5px solid ${K.k100}`, borderRadius: 14, padding: '0 16px', fontSize: 15, fontFamily: 'var(--font-arabic)', color: '#0e1a1b', background: 'white', outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', background: K.kbg, fontFamily: 'var(--font-arabic)', color: '#0e1a1b', display: 'flex', justifyContent: 'center' }} dir={currentLanguage?.dir || 'rtl'}>
      <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: 'white', display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', borderBottom: `1px solid ${K.k100}`, flexShrink: 0, background: 'white' }}>
          <button onClick={() => { if (step > 1) setStep(s => s - 1); else if (step === 1) navigate(`/kafala/${id}`); else navigate(-1); }}
            style={{ width: 36, height: 36, borderRadius: '50%', background: K.kbg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, border: 'none', cursor: 'pointer' }}>←</button>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{tx.complete}</div>
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
            <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{tx.steps[step - 1] || ''}</div>
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
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{kafala.age} {tx.year} · {kafala.location}</div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: K.kdark, fontFamily: 'Inter, sans-serif' }}>{priceMAD}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.perMonth}</div>
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
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: K.kdark, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0, fontFamily: 'var(--font-arabic)' }}>
                    ← {tx.changeOption}
                  </button>

                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>
                    {authMode === 'login' ? tx.signIn : tx.createAccount}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                    {authMode === 'login' ? tx.signInHelp : tx.registerHelp}
                  </div>

                  {otpSent ? (
                    <div style={{ background: K.kbg, borderRadius: 16, padding: 20, border: `1px solid ${K.k100}`, textAlign: 'center', marginBottom: 14 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{tx.enterCode}</div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12, direction: 'ltr' }}>
                        {[0, 1, 2, 3, 4, 5].map(i => (
                          <input key={i} ref={otpRefs[i]} type="text" inputMode="numeric" maxLength={1} value={otpValues[i]}
                            onChange={e => { const v = e.target.value.replace(/\D/, ''); if (v.length <= 1) { const n = [...otpValues]; n[i] = v; setOtpValues(n); if (v && i < 5) otpRefs[i + 1].current?.focus(); } }}
                            onKeyDown={e => { if (e.key === 'Backspace' && !otpValues[i] && i > 0) otpRefs[i - 1].current?.focus(); }}
                            style={{ width: 52, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, border: `2px solid ${otpValues[i] ? K.kdark : K.k100}`, borderRadius: 12, outline: 'none', background: otpValues[i] ? K.kbg : 'white', fontFamily: 'Inter, sans-serif' }}
                          />
                        ))}
                      </div>
                      {otpTimer > 0 ? (
                        <div style={{ fontSize: 13, color: '#94a3b8' }}>{tx.resendAfter} {Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</div>
                      ) : (
                        <button onClick={handleResendOtp} style={{ fontSize: 13, color: K.kdark, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>{tx.resend}</button>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '16px', background: K.kbg, borderRadius: 16, border: `1px solid ${K.k100}`, marginBottom: 14 }}>
                      {authMode === 'register' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{tx.name}</div>
                            <input type="text" name="fullName" value={authFormData.fullName} onChange={handleAuthChange} placeholder={tx.namePlaceholder} style={{ ...inputStyle, height: 44 }} />
                            {authErrors.fullName && <p style={{ color: '#ef4444', fontSize: 10, marginTop: 2 }}>{authErrors.fullName}</p>}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{tx.email}</div>
                            <input type="email" name="email" value={authFormData.email} onChange={handleAuthChange} placeholder="email@..." dir="ltr" style={{ ...inputStyle, height: 44 }} />
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{tx.phone}</div>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <CountryCodeSelector value={countryCode} onChange={setCountryCode} lang={lang} />
                        <input ref={phoneInputRef} type="tel" name="phone" value={authFormData.phone} onChange={handlePhoneChange} placeholder="6XXXXXXXX" maxLength={15} dir="ltr" inputMode="numeric" style={{ ...inputStyle, flex: 1, height: 44 }} />
                      </div>
                      {authErrors.phone && <p style={{ color: '#ef4444', fontSize: 11, marginTop: -6, marginBottom: 8 }}>{authErrors.phone}</p>}
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{tx.password}</div>
                      <div style={{ position: 'relative', marginBottom: authMode === 'register' ? 10 : 0 }}>
                        <input type={showPassword ? 'text' : 'password'} name="password" value={authFormData.password} onChange={handleAuthChange} placeholder="••••••••" style={{ ...inputStyle, height: 44, paddingLeft: 40 }} />
                        <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>{showPassword ? '🙈' : '👁'}</button>
                      </div>
                      {authErrors.password && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{authErrors.password}</p>}
                      {authMode === 'register' && (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>{tx.confirm}</div>
                          <input type="password" name="confirmPassword" value={authFormData.confirmPassword} onChange={handleAuthChange} placeholder="••••••••" style={{ ...inputStyle, height: 44 }} />
                          {authErrors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 11, marginTop: 2 }}>{authErrors.confirmPassword}</p>}
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ padding: '10px 14px', background: K.kbg, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', border: `1px solid ${K.k100}` }}>
                    <span className="material-symbols-outlined no-flip" style={{ fontSize: 16 }}>lock</span><span>{tx.secure}</span>
                  </div>
                </>
              ) : (
                /* No auth mode selected yet — show the 2 option cards */
                <>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>{tx.continueQuestion}</div>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{tx.continueHelp}</div>
                  {[
                    { id: 'login', icon: 'key', title: tx.signIn, desc: tx.signInHelp, badge: tx.fastest },
                    { id: 'register', icon: 'person_add', title: tx.createAccount, desc: tx.registerHelp, badge: tx.free },
                  ].map(opt => (
                    <div key={opt.id} onClick={() => handleAuthModeSwitch(opt.id)}
                      style={{ background: 'white', border: `1.5px solid ${K.k100}`, borderRadius: 16, padding: 18, marginBottom: 12, cursor: 'pointer' }}>
                      <span className="material-symbols-outlined no-flip" style={{ fontSize: 28, marginBottom: 8, color: K.kdark }}>{opt.icon}</span>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{opt.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>{opt.desc}</div>
                      <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 700, background: K.kbg, color: K.kdark, padding: '2px 8px', borderRadius: 100, marginTop: 6, border: `1px solid ${K.k100}` }}>{opt.badge}</div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 14px', background: K.kbg, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b', border: `1px solid ${K.k100}` }}>
                    <span className="material-symbols-outlined no-flip" style={{ fontSize: 16 }}>lock</span><span>{tx.secure}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── STEP 1: Plan selection ── */}
          {step === 1 && (
            <div style={{ paddingTop: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{tx.planTitle}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{tx.planHelp}</div>

              {/* Monthly */}
              {[
                { id: 'monthly', title: tx.monthlyPlan, desc: tx.monthlyDesc, badge: tx.mostChosen, price: priceMAD, unit: tx.perMonth, badgeBg: K.kbg, badgeColor: K.kdark },
                { id: 'annual', title: tx.annualPlan, desc: tx.annualDesc, badge: tx.saving(Math.round((kafala.monthlyPrice || 0) * 12 * .1)), price: annualPrice, unit: tx.perYear, badgeBg: '#FEF3C7', badgeColor: '#b45309' },
              ].filter((plan) => availablePlans.includes(plan.id)).map(plan => {
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
                <div style={{ fontSize: 12, fontWeight: 700, color: K.kdark, marginBottom: 10 }}>{tx.coversTitle}</div>
                {tx.covers(kafala.name).map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b', marginBottom: 6 }}>
                    <span style={{ color: K.kdark, fontWeight: 700 }}>✓</span><span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Payment note */}
              <div style={{ background: 'white', border: `1px solid ${K.k100}`, borderRadius: 12, padding: 12, marginBottom: 14, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                <span className="material-symbols-outlined no-flip" style={{ fontSize: 16, verticalAlign: 'middle' }}>payments</span> <strong>{tx.paymentTitle}:</strong> {tx.paymentNote}
              </div>
            </div>
          )}

          {/* ── STEP 2: Payment method (2 options) ── */}
          {step === 2 && (
            <div style={{ paddingTop: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{tx.paymentTitle}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>{tx.paymentHelp}</div>

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
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{tx.card}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{tx.cardHelp}</div>
                  </div>
                </div>
                {paymentCategory === 'card' && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${K.k100}`, fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>
                    {tx.cardNote}
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
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{tx.transfer}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{tx.transferHelp}</div>
                  </div>
                </div>

                {paymentCategory === 'bank_agency' && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${K.k100}` }}>
                    {/* Bank account details */}
                    <div style={{ background: 'white', borderRadius: 12, padding: 14, marginBottom: 14, border: `1px solid ${K.k100}` }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: K.kdark, marginBottom: 10 }}>{tx.bankDetails}</div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{tx.accountHolder}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: '#0e1a1b' }}>{bankInfo.name}</div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>{tx.rib}</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: K.kdark, fontFamily: 'Inter, sans-serif', letterSpacing: '.04em' }} dir="ltr">{bankInfo.rib}</div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText((bankInfo.rib || '').replace(/\s/g, '')); showToast(tx.copied, 'success'); }}
                        style={{ fontSize: 11, background: K.kbg, color: K.kdark, border: `1px solid ${K.k100}`, padding: '4px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}
                      >
                        {tx.copyRib}
                      </button>
                    </div>

                    {/* Sub-method toggle */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                      {[
                        { id: 'bank_transfer', label: tx.bankTransfer },
                        { id: 'cash_agency', label: tx.cashAgency },
                      ].map(sub => (
                        <button
                          key={sub.id}
                          onClick={(e) => { e.stopPropagation(); setPaymentMethod(sub.id); }}
                          style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 12, fontWeight: 700, border: `1.5px solid ${paymentMethod === sub.id ? K.kdark : K.k100}`, background: paymentMethod === sub.id ? K.kdark : 'white', color: paymentMethod === sub.id ? 'white' : '#64748b', cursor: 'pointer', fontFamily: 'var(--font-arabic)', transition: 'all .15s' }}
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
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{tx.uploadReceipt}</div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                          style={{ width: '100%', border: `2px dashed ${K.k100}`, borderRadius: 12, padding: '14px', textAlign: 'center', background: 'white', cursor: 'pointer', fontSize: 13, color: receipt ? '#16a34a' : '#64748b', fontFamily: 'var(--font-arabic)' }}
                        >
                          {receipt ? `✓ ${receipt.name}` : tx.attachReceipt}
                        </button>
                        <div style={{ marginTop: 10 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{tx.referenceOptional}</div>
                          <input
                            type="text" placeholder={tx.referencePlaceholder} value={reference}
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
                          {tx.cashHelp}
                        </div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{tx.uploadReceipt}</div>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                          style={{ width: '100%', border: `2px dashed ${K.k100}`, borderRadius: 12, padding: '14px', textAlign: 'center', background: 'white', cursor: 'pointer', fontSize: 13, color: receipt ? '#16a34a' : '#64748b', fontFamily: 'var(--font-arabic)', marginBottom: 10 }}
                        >
                          {receipt ? `✓ ${receipt.name}` : tx.attachReceipt}
                        </button>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{tx.receiptReference}</div>
                        <input
                          type="text" placeholder={tx.receiptPlaceholder} value={reference}
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
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{tx.reviewTitle}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{tx.reviewHelp}</div>

              {/* Total */}
              <div style={{ background: K.kdark, borderRadius: 16, padding: 16, marginBottom: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,.7)', marginBottom: 4 }}>{tx.total}</div>
                <div><span style={{ fontSize: 32, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{selectedPrice}</span>{' '}<span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>{selectedUnit}</span></div>
              </div>

              {/* Summary card */}
              <div style={{ background: 'white', border: `1.5px solid ${K.k100}`, borderRadius: 20, overflow: 'hidden', marginBottom: 14 }}>
                <div style={{ background: K.kbg, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${K.k100}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: `linear-gradient(135deg,${K.kdark},${K.k})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, overflow: 'hidden' }}>
                    <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={44} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: K.kdark }}>{kafala.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>✓ {planType === 'monthly' ? tx.monthly : tx.annual}</div>
                  </div>
                </div>
                {[
                  { label: planType === 'annual' ? tx.annualPlan : tx.monthlyAmount, value: `${selectedPrice} ${selectedUnit}`, teal: true },
                  { label: tx.paymentMethod, value: paymentMethod === 'bank_transfer' ? tx.bankTransfer : paymentMethod === 'card_whop' ? tx.card : tx.cashAgency },
                  { label: tx.donor, value: donorName },
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
                <div style={{ fontSize: 14, fontWeight: 700 }}>{tx.anonymous}</div>
              </div>

              {/* Trust note */}
              <div style={{ background: K.kbg, borderRadius: 12, padding: '10px 14px', border: `1px solid ${K.k100}`, marginBottom: 14, fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                <span className="material-symbols-outlined no-flip" style={{ fontSize: 15, verticalAlign: 'middle' }}>lock</span> {tx.finalTrust}
              </div>
            </div>
          )}
        </div>

        {/* Bottom action */}
        <div style={{ flexShrink: 0, padding: '14px 16px', background: 'white', borderTop: `1px solid ${K.k100}` }}>
          {step === 0 ? (
            <button onClick={otpSent ? handleOtpVerify : (authMode === 'login' ? handleLogin : handleRegister)}
              disabled={isAuthLoading}
              style={{ width: '100%', height: 52, background: isAuthLoading ? '#94a3b8' : K.kdark, color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: isAuthLoading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: `0 4px 14px rgba(196,168,130,.35)` }}>
              {isAuthLoading ? '...' : otpSent ? tx.verify : authMode === 'login' ? tx.signIn : tx.createAccount}
            </button>
          ) : step < 3 ? (
            <button onClick={() => setStep(s => s + 1)}
              style={{ width: '100%', height: 56, background: K.kdark, color: 'white', border: 'none', borderRadius: 16, fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: `0 4px 14px rgba(196,168,130,.35)` }}>
              {step === 1 ? tx.sponsor(isFemale, priceMAD) : tx.nextReview}
            </button>
          ) : (
            <div>
              <button onClick={handleSubmit} disabled={submitting}
                style={{ width: '100%', height: 56, background: submitting ? '#94a3b8' : K.kdark, color: 'white', border: 'none', borderRadius: 16, fontSize: 17, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: submitting ? 'none' : `0 4px 14px rgba(196,168,130,.35)` }}>
                {submitting ? (paymentMethod === 'card_whop' ? tx.paying : tx.sending) : (paymentMethod === 'card_whop' ? tx.payCard : tx.submitRequest)}
              </button>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 8 }}>{tx.noCommitment}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
