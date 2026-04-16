import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import CountryCodeSelector, { validatePhoneByCountry, formatPhoneForDisplay } from '../components/CountryCodeSelector';

// ============================================
// REGISTER PAGE - 3-step wizard with stepper
// ============================================

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentLanguage, login, showToast } = useApp();

  const registerUser = useMutation(api.auth.registerUser);
  const requestOTP = useMutation(api.auth.requestOTP);
  const verifyOTP = useMutation(api.auth.verifyOTP);
  const setUserPassword = useMutation(api.auth.setPassword);

  const [registeredUserId, setRegisteredUserId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+212');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  const phoneInputRef = useRef(null);
  const cursorPositionRef = useRef(0);

  const lang = currentLanguage.code;
  const returnUrl = location.state?.returnUrl || '/';

  const translations = {
    ar: {
      step1Title: 'ادخل رقم هاتفك',
      step1Sub: 'سنرسل لك رمز تحقق عبر واتساب',
      step2Title: 'رمز التحقق 📱',
      step2Sub: 'أدخل الرمز المكون من 6 أرقام',
      step3Title: 'معلوماتك الشخصية',
      step3Sub: 'بياناتك آمنة ومحمية',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '6 XX XX XX XX',
      fullNameLabel: 'الاسم الكامل *',
      fullNamePlaceholder: 'محمد العلوي',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'exemple@mail.com',
      passwordLabel: 'كلمة المرور *',
      confirmPasswordLabel: 'تأكيد كلمة المرور *',
      sendOtp: 'إرسال رمز التحقق →',
      verifyOtp: 'تأكيد الرمز ✓',
      createAccount: 'إنشاء الحساب 🎉',
      haveAccount: 'لديك حساب؟',
      loginNow: 'تسجيل الدخول',
      resendLabel: 'لم يصلك الرمز؟',
      resendLink: 'إعادة الإرسال',
      termsText: 'بإنشاء حساب، أوافق على',
      termsLink: 'شروط الاستخدام',
      privacyLink: 'سياسة الخصوصية',
      fullNameError: 'الاسم مطلوب',
      emailError: 'بريد إلكتروني غير صحيح',
      phoneError: 'رقم هاتف غير صحيح',
      passwordError: '6 أحرف على الأقل',
      confirmPasswordError: 'كلمات المرور غير متطابقة',
      steps: ['الهاتف', 'التحقق', 'البيانات'],
    },
    fr: { step1Title: 'Entrez votre numéro', step1Sub: 'Nous vous enverrons un code de vérification', step2Title: 'Code de vérification 📱', step2Sub: 'Entrez le code à 6 chiffres', step3Title: 'Vos informations', step3Sub: 'Vos données sont sécurisées', phoneLabel: 'Numéro de téléphone', phonePlaceholder: '6 XX XX XX XX', fullNameLabel: 'Nom complet *', fullNamePlaceholder: 'Jean Dupont', emailLabel: 'Email', emailPlaceholder: 'exemple@mail.com', passwordLabel: 'Mot de passe *', confirmPasswordLabel: 'Confirmer *', sendOtp: 'Envoyer le code →', verifyOtp: 'Confirmer ✓', createAccount: 'Créer le compte 🎉', haveAccount: 'Vous avez un compte?', loginNow: 'Connexion', resendLabel: 'Pas reçu?', resendLink: 'Renvoyer', termsText: 'En créant un compte, j\'accepte les', termsLink: "Conditions", privacyLink: "Confidentialité", fullNameError: 'Nom requis', emailError: 'Email invalide', phoneError: 'Numéro invalide', passwordError: '6 caractères minimum', confirmPasswordError: 'Mots de passe différents', steps: ['Tél.', 'Vérif.', 'Infos'] },
    en: { step1Title: 'Enter your phone', step1Sub: 'We will send a verification code', step2Title: 'Verification Code 📱', step2Sub: 'Enter the 6-digit code', step3Title: 'Your information', step3Sub: 'Your data is safe', phoneLabel: 'Phone Number', phonePlaceholder: '6 XX XX XX XX', fullNameLabel: 'Full Name *', fullNamePlaceholder: 'John Doe', emailLabel: 'Email', emailPlaceholder: 'example@mail.com', passwordLabel: 'Password *', confirmPasswordLabel: 'Confirm *', sendOtp: 'Send code →', verifyOtp: 'Confirm ✓', createAccount: 'Create Account 🎉', haveAccount: 'Have an account?', loginNow: 'Login', resendLabel: 'Not received?', resendLink: 'Resend', termsText: 'By creating an account, I agree to the', termsLink: 'Terms', privacyLink: 'Privacy', fullNameError: 'Name required', emailError: 'Invalid email', phoneError: 'Invalid phone', passwordError: '6 characters minimum', confirmPasswordError: 'Passwords do not match', steps: ['Phone', 'Verify', 'Details'] },
  };

  const tx = translations[lang] || translations.ar;

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validatePhone = (v) => validatePhoneByCountry(v, countryCode);

  const handlePhoneChange = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const previousValue = input.value;
    const rawValue = input.value.replace(/\D/g, '').slice(0, 10);
    const diff = previousValue.length - rawValue.length;
    cursorPositionRef.current = Math.max(0, cursorPosition - diff);
    setPhone(rawValue);
    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
  };

  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
    }
  }, [phone]);

  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSent, otpTimer]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    if (value && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) otpRefs[index - 1].current?.focus();
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleRegister = async () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = tx.fullNameError;
    if (!validateEmail(email)) newErrors.email = tx.emailError;
    if (!validatePhone(phone)) newErrors.phone = tx.phoneError;
    if (!password || password.length < 6) newErrors.password = tx.passwordError;
    if (password !== confirmPassword) newErrors.confirmPassword = tx.confirmPasswordError;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    const fullPhone = countryCode + phone;
    try {
      const regResult = await registerUser({ fullName: fullName.trim(), email: email.trim(), phoneNumber: fullPhone, preferredLanguage: lang });
      if (!regResult.success) { showToast(regResult.message, 'error'); setIsLoading(false); return; }
      setRegisteredUserId(regResult.userId);
      const otpResult = await requestOTP({ phoneNumber: fullPhone });
      if (!otpResult.success) { showToast(otpResult.message, 'error'); setIsLoading(false); return; }
      setOtpSent(true);
      setOtpTimer(120);
      showToast(lang === 'ar' ? 'تم إرسال الرمز' : 'Code sent', 'success');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async () => {
    if (!otpValues.every((v) => v.length === 1)) return;
    setIsLoading(true);
    const code = otpValues.join('');
    const fullPhone = countryCode + phone;
    try {
      const verifyResult = await verifyOTP({ phoneNumber: fullPhone, code });
      if (!verifyResult.success) { showToast(verifyResult.message, 'error'); setIsLoading(false); return; }
      const userId = verifyResult.userId || registeredUserId;
      if (userId && password) await setUserPassword({ userId, password });
      login({ id: userId, name: fullName, phone: fullPhone, email, avatar: null, role: 'user' });
      showToast(lang === 'ar' ? 'تم إنشاء الحساب' : 'Account created', 'success');
      navigate(returnUrl, { replace: true });
    } catch (err) {
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStep = otpSent ? 2 : 1; // 1 = register form, 2 = OTP

  const inputStyle = { width: '100%', height: 50, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, color: '#0e1a1b', outline: 'none', background: 'white' };
  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F7', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>
      <div style={{ width: '100%', maxWidth: 390 }}>

        {/* Top bar */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 4px', marginBottom: 4 }}>
          <button
            onClick={() => otpSent ? setOtpSent(false) : navigate('/')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,.05)', border: 'none' }}
          >
            ←
          </button>
        </div>

        {/* Logo */}
        <div style={{ textAlign: 'center', padding: '12px 20px 16px' }}>
          <div style={{ width: 52, height: 52, background: '#0d7477', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 22, margin: '0 auto 10px', boxShadow: '0 4px 14px rgba(13,116,119,.25)' }}>ا</div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>
            {currentStep === 1 ? 'إنشاء حساب' : currentStep === 2 ? 'التحقق من الهاتف' : 'أكمل ملفك الشخصي'}
          </div>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 24px', marginBottom: 20 }}>
          {tx.steps.map((label, i) => {
            const stepNum = i + 1;
            const isDone = currentStep > stepNum;
            const isCurrent = currentStep === stepNum;
            return (
              <React.Fragment key={label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1 }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, background: isDone ? '#0d7477' : isCurrent ? 'white' : 'white', color: isDone ? 'white' : isCurrent ? '#0d7477' : '#94a3b8', border: isDone ? 'none' : isCurrent ? '2.5px solid #0d7477' : '2px solid #E5E9EB', boxShadow: isCurrent ? '0 0 0 4px rgba(13,116,119,.12)' : 'none' }}>
                    {isDone ? '✓' : stepNum}
                  </div>
                  <div style={{ fontSize: 10, color: isCurrent ? '#0A5F62' : '#94a3b8', fontWeight: isCurrent ? 600 : 400 }}>{label}</div>
                </div>
                {i < tx.steps.length - 1 && (
                  <div style={{ flex: 1, height: 2, background: isDone ? '#33C0C0' : '#E5E9EB', marginBottom: 16 }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Auth Card */}
        <div style={{ margin: '0 4px', background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 10px 15px rgba(0,0,0,.10)' }}>

          {/* OTP step */}
          {otpSent ? (
            <>
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{tx.step2Title}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>
                {tx.step2Sub} <span style={{ direction: 'ltr', display: 'inline', fontWeight: 700, color: '#0d7477' }}>{countryCode} {formatPhoneForDisplay(phone, countryCode)}</span>
              </div>

              {/* OTP cells */}
              <div style={{ display: 'flex', gap: 8, direction: 'ltr', justifyContent: 'center', margin: '16px 0' }}>
                {otpValues.map((val, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    style={{ width: 44, height: 54, border: `1.5px solid ${val ? '#0d7477' : '#E5E9EB'}`, borderRadius: 10, textAlign: 'center', fontSize: 20, fontWeight: 700, color: '#0A5F62', outline: 'none', fontFamily: 'Inter, sans-serif' }}
                  />
                ))}
              </div>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                {tx.resendLabel}{' '}
                {otpTimer > 0 ? (
                  <span style={{ color: '#94a3b8' }}>{tx.resendLink} ({formatTime(otpTimer)})</span>
                ) : (
                  <button
                    onClick={async () => {
                      try {
                        await requestOTP({ phoneNumber: countryCode + phone });
                        setOtpTimer(120);
                        showToast(lang === 'ar' ? 'تم إرسال الرمز' : 'Code resent', 'success');
                      } catch (e) { showToast('Failed to resend', 'error'); }
                    }}
                    style={{ color: '#0d7477', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontSize: 13 }}
                  >
                    {tx.resendLink}
                  </button>
                )}
              </div>

              <button
                onClick={handleOtpVerify}
                disabled={!otpValues.every((v) => v.length === 1) || isLoading}
                style={{ width: '100%', height: 50, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'Tajawal, sans-serif', marginTop: 8, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? '...' : tx.verifyOtp}
              </button>
            </>
          ) : (
            <>
              {/* Step 1+3 combined: phone + details */}
              <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{tx.step1Title}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>{tx.step1Sub}</div>

              {/* Phone */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{tx.phoneLabel}</label>
                <div style={{ display: 'flex', height: 50, border: `1.5px solid ${errors.phone ? '#ef4444' : '#E5E9EB'}`, borderRadius: 12, overflow: 'hidden' }}>
                  <CountryCodeSelector value={countryCode} onChange={setCountryCode} lang={lang} disabled={isLoading} />
                  <input ref={phoneInputRef} type="tel" value={phone} onChange={handlePhoneChange} placeholder={tx.phonePlaceholder} maxLength={15} style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontFamily: 'Tajawal, sans-serif', fontSize: 14, background: 'transparent', direction: 'ltr' }} inputMode="numeric" pattern="[0-9]*" />
                </div>
                {errors.phone && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
              </div>

              {/* Full Name */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{tx.fullNameLabel}</label>
                <input style={{ ...inputStyle, borderColor: errors.fullName ? '#ef4444' : '#E5E9EB' }} type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors((p) => ({ ...p, fullName: null })); }} placeholder={tx.fullNamePlaceholder} />
                {errors.fullName && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{tx.emailLabel}</label>
                <input style={{ ...inputStyle, direction: 'ltr', borderColor: errors.email ? '#ef4444' : '#E5E9EB' }} type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: null })); }} placeholder={tx.emailPlaceholder} />
                {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email}</p>}
              </div>

              {/* Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{tx.passwordLabel}</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, padding: '0 48px 0 16px', borderColor: errors.password ? '#ef4444' : '#E5E9EB' }} type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: null })); }} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none', fontSize: 16 }}>{showPassword ? '🙈' : '👁'}</button>
                </div>
                {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>{tx.confirmPasswordLabel}</label>
                <div style={{ position: 'relative' }}>
                  <input style={{ ...inputStyle, padding: '0 48px 0 16px', borderColor: errors.confirmPassword ? '#ef4444' : '#E5E9EB' }} type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: null })); }} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none', fontSize: 16 }}>{showConfirmPassword ? '🙈' : '👁'}</button>
                </div>
                {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16, lineHeight: 1.6 }}>
                {tx.termsText} <span style={{ color: '#0d7477', fontWeight: 600, cursor: 'pointer' }}>{tx.termsLink}</span> و<span style={{ color: '#0d7477', fontWeight: 600, cursor: 'pointer' }}>{tx.privacyLink}</span>
              </div>

              <button
                onClick={handleRegister}
                disabled={!fullName || !email || !phone || !password || !confirmPassword || isLoading}
                style={{ width: '100%', height: 50, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'Tajawal, sans-serif', marginTop: 8, opacity: isLoading ? 0.7 : 1 }}
              >
                {isLoading ? '...' : tx.sendOtp}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b', padding: 16 }}>
                {tx.haveAccount}{' '}
                <Link to="/login" state={{ returnUrl }} style={{ color: '#0d7477', fontWeight: 700 }}>{tx.loginNow}</Link>
              </div>
            </>
          )}
        </div>

        {/* Privacy note */}
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>🔒 رقمك محمي ولن يُستخدم للإعلانات</div>
        </div>
      </div>
    </div>
  );
};

export default Register;
