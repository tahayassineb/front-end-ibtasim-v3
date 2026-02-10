import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';

// ============================================
// REGISTER PAGE - Phone + Password with OTP
// Matching DonationFlow auth design
// ============================================

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentLanguage, login, showToast } = useApp();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // OTP states
  const [otpSent, setOtpSent] = useState(false);
  const [otpValues, setOtpValues] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(120);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  
  const phoneInputRef = useRef(null);
  const cursorPositionRef = useRef(0);
  
  const isRTL = currentLanguage.dir === 'rtl';
  const lang = currentLanguage.code;
  
  // Get return URL from location state or default to home
  const returnUrl = location.state?.returnUrl || '/';
  
  // Translations
  const translations = {
    ar: {
      welcome: 'إنشاء حساب',
      subtitle: 'أنشئ حساباً للمتابعة',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'محمد العلوي',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'exemple@mail.com',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '6XXXXXXXX',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      registerButton: 'إنشاء حساب',
      haveAccount: 'لديك حساب؟',
      loginNow: 'سجل الدخول',
      enterOtp: 'أدخل رمز التحقق',
      otpSent: 'تم إرسال رمز التحقق إلى',
      resendCode: 'إعادة إرسال الرمز',
      continueToAccount: 'المتابعة إلى الحساب',
      fullNameError: 'الاسم مطلوب',
      emailError: 'بريد إلكتروني غير صحيح',
      phoneError: 'رقم هاتف غير صحيح',
      passwordError: '6 أحرف على الأقل',
      confirmPasswordError: 'كلمات المرور غير متطابقة',
    },
    fr: {
      welcome: 'Créer un compte',
      subtitle: 'Créez un compte pour continuer',
      fullNameLabel: 'Nom complet',
      fullNamePlaceholder: 'Jean Dupont',
      emailLabel: 'Adresse email',
      emailPlaceholder: 'exemple@mail.com',
      phoneLabel: 'Numéro de téléphone',
      phonePlaceholder: '6XXXXXXXX',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirmer le mot de passe',
      registerButton: 'Continuer',
      haveAccount: 'Vous avez un compte?',
      loginNow: 'Connectez-vous',
      enterOtp: 'Entrez le code de vérification',
      otpSent: 'Un code a été envoyé à',
      resendCode: 'Renvoyer le code',
      continueToAccount: 'Continuer vers le compte',
      fullNameError: 'Nom requis',
      emailError: 'Email invalide',
      phoneError: 'Numéro invalide',
      passwordError: '6 caractères minimum',
      confirmPasswordError: 'Mots de passe différents',
    },
    en: {
      welcome: 'Create Account',
      subtitle: 'Create an account to continue',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'John Doe',
      emailLabel: 'Email Address',
      emailPlaceholder: 'example@mail.com',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '6XXXXXXXX',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirm Password',
      registerButton: 'Continue',
      haveAccount: 'Have an account?',
      loginNow: 'Login',
      enterOtp: 'Enter Verification Code',
      otpSent: 'A code has been sent to',
      resendCode: 'Resend Code',
      continueToAccount: 'Continue to Account',
      fullNameError: 'Name required',
      emailError: 'Invalid email',
      phoneError: 'Invalid phone',
      passwordError: '6 characters minimum',
      confirmPasswordError: 'Passwords do not match',
    },
  };
  
  const tx = translations[currentLanguage.code] || translations.fr;
  
  // Validate email
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Validate phone
  const validatePhone = (phone) => {
    return /^[56]\d{8}$/.test(phone);
  };
  
  // Format phone for display
  const formatPhoneDisplay = (phone) => {
    if (phone.length <= 2) return phone;
    if (phone.length <= 5) return `${phone.slice(0, 2)} ${phone.slice(2)}`;
    if (phone.length <= 8) return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5)}`;
    return `${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 8)} ${phone.slice(8)}`;
  };
  
  // Handle phone input with cursor position fix
  const handlePhoneChange = (e) => {
    const input = e.target;
    const cursorPosition = input.selectionStart;
    const previousValue = input.value;
    const rawValue = input.value.replace(/\D/g, '').slice(0, 10);
    const diff = previousValue.length - rawValue.length;
    cursorPositionRef.current = Math.max(0, cursorPosition - diff);
    setPhone(rawValue);
    if (errors.phone) setErrors(prev => ({ ...prev, phone: null }));
  };
  
  // Restore cursor position
  useEffect(() => {
    if (phoneInputRef.current) {
      phoneInputRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
    }
  }, [phone]);
  
  // OTP timer
  useEffect(() => {
    if (otpSent && otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpSent, otpTimer]);
  
  // Handle OTP input
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }
  };
  
  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Handle initial registration submit
  const handleRegister = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!fullName.trim()) {
      newErrors.fullName = tx.fullNameError;
    }
    if (!validateEmail(email)) {
      newErrors.email = tx.emailError;
    }
    if (!validatePhone(phone)) {
      newErrors.phone = tx.phoneError;
    }
    if (!password || password.length < 6) {
      newErrors.password = tx.passwordError;
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = tx.confirmPasswordError;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Send OTP
    setOtpSent(true);
    setOtpTimer(120);
    showToast(lang === 'ar' ? 'تم إرسال الرمز' : lang === 'fr' ? 'Code envoyé' : 'Code sent', 'success');
  };
  
  // Handle OTP verification
  const handleOtpVerify = async () => {
    const isOtpComplete = otpValues.every(v => v.length === 1);
    if (!isOtpComplete) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create user
    const userData = {
      id: 'user_' + Date.now(),
      name: fullName,
      phone: '+212 ' + formatPhoneDisplay(phone),
      email: email,
      avatar: null,
    };
    
    login(userData);
    setIsLoading(false);
    showToast(lang === 'ar' ? 'تم إنشاء الحساب' : lang === 'fr' ? 'Compte créé' : 'Account created', 'success');
    
    // Redirect to return URL
    navigate(returnUrl, { replace: true });
  };
  
  // OTP Screen
  if (otpSent) {
    const isOtpComplete = otpValues.every(v => v.length === 1);
    
    return (
      <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
        {/* Header */}
        <header className="px-6 pt-12 pb-4">
          <button 
            onClick={() => setOtpSent(false)}
            className="inline-flex items-center text-gray-500 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </header>
        
        {/* OTP Content */}
        <div className="flex-1 flex flex-col items-center px-6 pt-6 pb-8">
          <div className="mb-8 p-4 bg-primary/10 rounded-full">
            <span className="material-symbols-outlined text-primary text-5xl">phonelink_ring</span>
          </div>
          
          <h1 className="text-gray-900 dark:text-white text-2xl font-bold text-center pb-3">
            {tx.enterOtp}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base text-center max-w-xs">
            {tx.otpSent} <span className="font-bold text-primary" dir="ltr">+212 {formatPhoneDisplay(phone)}</span>
          </p>
          
          <div className="mt-10 w-full max-w-sm">
            <fieldset className="flex justify-between gap-2 sm:gap-4" dir="ltr">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={otpRefs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otpValues[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  className="flex h-14 w-12 sm:w-14 text-center text-xl font-bold bg-white dark:bg-gray-800 border-0 rounded-xl shadow-lg shadow-primary/5 focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
                  placeholder="-"
                />
              ))}
            </fieldset>
          </div>
          
          <div className="mt-10 flex flex-col items-center gap-4 w-full max-w-sm">
            {otpTimer > 0 ? (
              <div className="flex items-center gap-3 py-2 px-6 bg-primary/5 dark:bg-primary/10 rounded-full border border-primary/10">
                <span className="material-symbols-outlined text-primary text-sm">schedule</span>
                <p className="text-primary text-sm font-bold tracking-widest" dir="ltr">
                  {formatTime(otpTimer)}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setOtpTimer(120)}
                className="text-primary font-bold hover:underline"
              >
                {tx.resendCode}
              </button>
            )}
            
            <Button
              onClick={handleOtpVerify}
              disabled={!isOtpComplete || isLoading}
              fullWidth
              size="xl"
              loading={isLoading}
              className="mt-6"
            >
              {tx.continueToAccount}
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Registration Form
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-4">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
        <h1 className="text-gray-900 dark:text-white text-2xl font-bold text-center mb-2">
          {tx.welcome}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8">
          {tx.subtitle}
        </p>
        
        <form onSubmit={handleRegister} className="space-y-4 flex-1">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tx.fullNameLabel}
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (errors.fullName) setErrors(prev => ({ ...prev, fullName: null }));
              }}
              placeholder={tx.fullNamePlaceholder}
              className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
            />
            {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName}</p>}
          </div>
          
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tx.emailLabel}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: null }));
              }}
              placeholder={tx.emailPlaceholder}
              className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              dir="ltr"
            />
            {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
          </div>
          
          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tx.phoneLabel}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">+212</span>
              <input
                ref={phoneInputRef}
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder={tx.phonePlaceholder}
                maxLength={10}
                className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-16 pr-4 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
                dir="ltr"
                inputMode="numeric"
                pattern="[0-9]*"
              />
            </div>
            {errors.phone && <p className="text-error text-xs mt-1">{errors.phone}</p>}
          </div>
          
          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tx.passwordLabel}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors(prev => ({ ...prev, password: null }));
                }}
                placeholder={tx.passwordPlaceholder}
                className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 pr-12 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.password && <p className="text-error text-xs mt-1">{errors.password}</p>}
          </div>
          
          {/* Confirm Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {tx.confirmPasswordLabel}
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: null }));
                }}
                placeholder={tx.passwordPlaceholder}
                className="w-full h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 pr-12 text-base focus:ring-2 focus:ring-primary focus:outline-none dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
              </button>
            </div>
            {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword}</p>}
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              fullWidth
              size="xl"
              loading={isLoading}
            >
              {tx.registerButton}
            </Button>
          </div>
        </form>
        
        {/* Login Link */}
        <div className="mt-6 text-center">
          <span className="text-gray-500 dark:text-gray-400 text-sm">{tx.haveAccount} </span>
          <Link 
            to="/login" 
            state={{ returnUrl }}
            className="text-primary text-sm font-bold hover:underline"
          >
            {tx.loginNow}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
