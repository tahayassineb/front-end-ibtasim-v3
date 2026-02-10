import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';

// ============================================
// LOGIN PAGE - Phone + Password Authentication
// Matching DonationFlow auth design
// ============================================

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentLanguage, login, showToast } = useApp();
  
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const phoneInputRef = useRef(null);
  const cursorPositionRef = useRef(0);
  
  const isRTL = currentLanguage.dir === 'rtl';
  const lang = currentLanguage.code;
  
  // Get return URL from location state or default to home
  const returnUrl = location.state?.returnUrl || '/';
  
  // Translations
  const translations = {
    ar: {
      welcome: 'مرحباً بك',
      subtitle: 'سجل الدخول للمتابعة',
      phoneLabel: 'رقم الهاتف',
      phonePlaceholder: '6XXXXXXXX',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      loginButton: 'تسجيل الدخول',
      noAccount: 'ليس لديك حساب؟',
      registerNow: 'سجل الآن',
      forgotPassword: 'نسيت كلمة المرور؟',
      phoneError: 'رقم هاتف غير صحيح',
      passwordError: 'كلمة المرور مطلوبة',
      loginError: 'رقم الهاتف أو كلمة المرور غير صحيحة',
    },
    fr: {
      welcome: 'Bienvenue',
      subtitle: 'Connectez-vous pour continuer',
      phoneLabel: 'Numéro de téléphone',
      phonePlaceholder: '6XXXXXXXX',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      loginButton: 'Connexion',
      noAccount: 'Vous n\'avez pas de compte?',
      registerNow: 'Inscrivez-vous',
      forgotPassword: 'Mot de passe oublié?',
      phoneError: 'Numéro invalide',
      passwordError: 'Mot de passe requis',
      loginError: 'Numéro ou mot de passe incorrect',
    },
    en: {
      welcome: 'Welcome',
      subtitle: 'Login to continue',
      phoneLabel: 'Phone Number',
      phonePlaceholder: '6XXXXXXXX',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      loginButton: 'Login',
      noAccount: 'Don\'t have an account?',
      registerNow: 'Register now',
      forgotPassword: 'Forgot password?',
      phoneError: 'Invalid phone number',
      passwordError: 'Password required',
      loginError: 'Invalid phone or password',
    },
  };
  
  const tx = translations[currentLanguage.code] || translations.fr;
  
  // Validate phone number
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
  
  // Handle password change
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    if (!validatePhone(phone)) {
      newErrors.phone = tx.phoneError;
    }
    if (!password || password.length < 6) {
      newErrors.password = tx.passwordError;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Demo login
    const userData = {
      id: 'user_' + Date.now(),
      name: 'Demo User',
      phone: '+212 ' + formatPhoneDisplay(phone),
      email: 'demo@example.com',
      avatar: null,
    };
    
    login(userData);
    setIsLoading(false);
    showToast(lang === 'ar' ? 'تم تسجيل الدخول' : lang === 'fr' ? 'Connecté' : 'Logged in', 'success');
    
    // Redirect to return URL
    navigate(returnUrl, { replace: true });
  };
  
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
        
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
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
                onChange={handlePasswordChange}
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
          
          {/* Forgot Password */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-primary text-sm font-medium hover:underline">
              {tx.forgotPassword}
            </Link>
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <Button
              type="submit"
              fullWidth
              size="xl"
              loading={isLoading}
            >
              {tx.loginButton}
            </Button>
          </div>
        </form>
        
        {/* Register Link */}
        <div className="mt-6 text-center">
          <span className="text-gray-500 dark:text-gray-400 text-sm">{tx.noAccount} </span>
          <Link 
            to="/register" 
            state={{ returnUrl }}
            className="text-primary text-sm font-bold hover:underline"
          >
            {tx.registerNow}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
