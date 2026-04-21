import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import CountryCodeSelector, { validatePhoneByCountry, formatPhoneForDisplay } from '../../../components/CountryCodeSelector';

// ============================================
// LOGIN PAGE - Phone + Password Authentication
// ============================================

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentLanguage, login, showToast } = useApp();

  const loginWithPassword = useMutation(api.auth.loginWithPassword);

  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+212');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const phoneInputRef = useRef(null);
  const cursorPositionRef = useRef(0);

  const isRTL = currentLanguage.dir === 'rtl';
  const lang = currentLanguage.code;

  const returnUrl = location.state?.returnUrl || '/';

  const translations = {
    ar: {
      welcome: 'مرحباً بعودتك 👋',
      subtitle: 'سجّل دخولك للمتابعة ومتابعة تبرعاتك',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '6 XX XX XX XX',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      loginButton: 'تسجيل الدخول',
      noAccount: 'ليس لديك حساب؟',
      registerNow: 'إنشاء حساب جديد',
      forgotPassword: 'نسيت كلمة المرور؟',
      rememberMe: 'تذكرني',
      or: 'أو',
      phoneError: 'رقم هاتف غير صحيح',
      passwordError: 'كلمة المرور مطلوبة',
      loginError: 'رقم الهاتف أو كلمة المرور غير صحيحة',
      socialProof: '+4,200 متبرع',
      socialProofText: 'انضم إلى',
      socialProofSuffix: 'يثقون بنا',
    },
    fr: {
      welcome: 'Bienvenue 👋',
      subtitle: 'Connectez-vous pour continuer',
      phoneLabel: 'Numéro de téléphone',
      phonePlaceholder: '6 XX XX XX XX',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      loginButton: 'Connexion',
      noAccount: "Vous n'avez pas de compte?",
      registerNow: "Créer un compte",
      forgotPassword: 'Mot de passe oublié?',
      rememberMe: 'Se souvenir',
      or: 'ou',
      phoneError: 'Numéro invalide',
      passwordError: 'Mot de passe requis',
      loginError: 'Numéro ou mot de passe incorrect',
      socialProof: '+4 200 donateurs',
      socialProofText: 'Rejoignez',
      socialProofSuffix: 'qui nous font confiance',
    },
    en: {
      welcome: 'Welcome Back 👋',
      subtitle: 'Sign in to continue',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '6 XX XX XX XX',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      loginButton: 'Login',
      noAccount: "Don't have an account?",
      registerNow: 'Create account',
      forgotPassword: 'Forgot password?',
      rememberMe: 'Remember me',
      or: 'or',
      phoneError: 'Invalid phone number',
      passwordError: 'Password required',
      loginError: 'Invalid phone or password',
      socialProof: '+4,200 donors',
      socialProofText: 'Join',
      socialProofSuffix: 'who trust us',
    },
  };

  const tx = translations[lang] || translations.ar;

  const validatePhone = (phone) => validatePhoneByCountry(phone, countryCode);

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

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!validatePhone(phone)) newErrors.phone = tx.phoneError;
    if (!password || password.length < 6) newErrors.password = tx.passwordError;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setIsLoading(true);
    try {
      const fullPhoneNumber = countryCode + phone;
      const result = await loginWithPassword({ phoneNumber: fullPhoneNumber, password });
      if (result.success && result.user) {
        const userData = {
          id: result.user._id,
          name: result.user.fullName,
          phone: result.user.phoneNumber,
          email: result.user.email,
          preferredLanguage: result.user.preferredLanguage,
          isVerified: result.user.isVerified,
        };
        login(userData);
        showToast(lang === 'ar' ? 'تم تسجيل الدخول' : lang === 'fr' ? 'Connecté' : 'Logged in', 'success');
        navigate(returnUrl, { replace: true });
      } else {
        setErrors({ password: result.message || tx.loginError });
        showToast(result.message || tx.loginError, 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ password: tx.loginError });
      showToast(tx.loginError, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F7', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>
      <div style={{ width: '100%', maxWidth: 390, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{ height: 52, display: 'flex', alignItems: 'center', padding: '0 4px', justifyContent: 'space-between', marginBottom: 4 }}>
          <button
            onClick={() => navigate('/')}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,.05)', border: 'none' }}
          >
            ←
          </button>
          <div style={{ fontSize: 13, color: '#0d7477', fontWeight: 600 }}>تحتاج مساعدة؟</div>
        </div>

        {/* Logo section */}
        <div style={{ textAlign: 'center', padding: '24px 20px 20px' }}>
          <div style={{ width: 60, height: 60, background: '#0d7477', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 26, margin: '0 auto 12px', boxShadow: '0 4px 14px rgba(13,116,119,.25)' }}>ا</div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>ابتسام</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>جمعية خيرية معتمدة</div>
        </div>

        {/* Auth card */}
        <div style={{ margin: '0 4px', background: 'white', borderRadius: 24, padding: 24, boxShadow: '0 10px 15px rgba(0,0,0,.10)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{tx.welcome}</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>{tx.subtitle}</p>

          <form onSubmit={handleSubmit}>
            {/* Phone */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>{tx.phoneLabel}</label>
              <div style={{ display: 'flex', height: 52, border: `1.5px solid ${errors.phone ? '#ef4444' : '#33C0C0'}`, borderRadius: 12, overflow: 'hidden' }}>
                <CountryCodeSelector
                  value={countryCode}
                  onChange={setCountryCode}
                  lang={lang}
                  disabled={isLoading}
                />
                <input
                  ref={phoneInputRef}
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder={tx.phonePlaceholder}
                  maxLength={15}
                  style={{ flex: 1, border: 'none', outline: 'none', padding: '0 12px', fontFamily: 'Tajawal, sans-serif', fontSize: 14, background: 'transparent', direction: 'ltr' }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
              </div>
              {errors.phone && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.phone}</p>}
            </div>

            {/* Password */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 7 }}>{tx.passwordLabel}</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder={tx.passwordPlaceholder}
                  style={{ width: '100%', height: 52, padding: '0 48px 0 16px', border: `1.5px solid ${errors.password ? '#ef4444' : '#E5E9EB'}`, borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, color: '#0e1a1b', outline: 'none', background: 'white' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', cursor: 'pointer', background: 'none', border: 'none', fontSize: 18 }}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
              {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password}</p>}
            </div>

            {/* Forgot / Remember row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                <input type="checkbox" style={{ accentColor: '#0d7477' }} /> {tx.rememberMe}
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: '#0d7477', fontWeight: 600 }}>{tx.forgotPassword}</Link>
            </div>

            <button
              type="submit"
              disabled={!phone || !password || isLoading}
              style={{ width: '100%', height: 52, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'Tajawal, sans-serif', marginBottom: 16, opacity: isLoading ? 0.7 : 1 }}
            >
              {isLoading ? '...' : tx.loginButton}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#E5E9EB' }} />
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{tx.or}</div>
              <div style={{ flex: 1, height: 1, background: '#E5E9EB' }} />
            </div>

            <div style={{ textAlign: 'center', fontSize: 14, color: '#64748b' }}>
              {tx.noAccount}{' '}
              <Link to="/register" state={{ returnUrl }} style={{ color: '#0d7477', fontWeight: 700 }}>{tx.registerNow}</Link>
            </div>
          </form>
        </div>

        {/* Trust section */}
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
            {tx.socialProofText} <strong style={{ color: '#0A5F62' }}>{tx.socialProof}</strong> {tx.socialProofSuffix}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[['🔒', 'SSL محمي'], ['✓', 'معتمد رسمياً'], ['💬', 'دعم 24/7']].map(([icon, label]) => (
              <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 12px', background: 'white', border: '1px solid #E5E9EB', borderRadius: 100, fontSize: 11, fontWeight: 600, color: '#64748b', boxShadow: '0 2px 4px rgba(0,0,0,.03)' }}>
                {icon} {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
