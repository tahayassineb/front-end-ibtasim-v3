import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';

// ============================================
// LOGIN PAGE - User Authentication (Email + Password)
// ============================================

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, currentLanguage, login, showToast } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const isRTL = currentLanguage.dir === 'rtl';
  
  // Translations
  const translations = {
    ar: {
      title: 'تسجيل الدخول',
      welcome: 'مرحباً بك مجدداً في جمعية الأمل',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'example@mail.com',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      forgotPassword: 'هل نسيت كلمة المرور؟',
      loginButton: 'تسجيل الدخول',
      noAccount: 'ليس لديك حساب؟',
      registerNow: 'سجل الآن',
      termsText: 'بالتسجيل، أنت توافق على شروط الخدمة وسياسة الخصوصية الخاصة بالجمعية',
      emailError: 'يرجى إدخال بريد إلكتروني صحيح',
      passwordError: 'يرجى إدخال كلمة المرور',
      loginError: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    },
    fr: {
      title: 'Connexion',
      welcome: 'Bon retour à Association Espoir',
      emailLabel: 'Adresse email',
      emailPlaceholder: 'exemple@mail.com',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      forgotPassword: 'Mot de passe oublié?',
      loginButton: 'Se connecter',
      noAccount: 'Vous n\'avez pas de compte?',
      registerNow: 'Inscrivez-vous',
      termsText: 'En vous inscrivant, vous acceptez les conditions de service et la politique de confidentialité',
      emailError: 'Veuillez entrer une adresse email valide',
      passwordError: 'Veuillez entrer votre mot de passe',
      loginError: 'Email ou mot de passe incorrect',
    },
    en: {
      title: 'Login',
      welcome: 'Welcome back to Association Espoir',
      emailLabel: 'Email Address',
      emailPlaceholder: 'example@mail.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      forgotPassword: 'Forgot password?',
      loginButton: 'Login',
      noAccount: 'Don\'t have an account?',
      registerNow: 'Register now',
      termsText: 'By registering, you agree to the terms of service and privacy policy',
      emailError: 'Please enter a valid email address',
      passwordError: 'Please enter your password',
      loginError: 'Invalid email or password',
    },
  };
  
  const tx = translations[currentLanguage.code] || translations.fr;
  
  // Validate email format
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Handle email input change
  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors(prev => ({ ...prev, email: null }));
  }, [errors.email]);
  
  // Handle password change
  const handlePasswordChange = useCallback((e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors(prev => ({ ...prev, password: null }));
  }, [errors.password]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {};
    
    if (!validateEmail(email)) {
      newErrors.email = tx.emailError;
    }
    
    if (!password || password.length < 6) {
      newErrors.password = tx.passwordError;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Demo login - accept any valid format
      const userData = {
        id: 'user_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        phone: '+212 6XX XXX XXX',
        avatar: null,
        createdAt: new Date().toISOString(),
        donations: [
          {
            id: 'DON-001',
            amount: 500,
            project: 'Atlas Mountain Education',
            date: '2024-01-15',
            status: 'verified',
          },
          {
            id: 'DON-002',
            amount: 200,
            project: 'Clean Water Initiative',
            date: '2024-02-01',
            status: 'pending',
          },
        ],
      };
      
      login(userData);
      showToast(currentLanguage.code === 'ar' ? 'تم تسجيل الدخول بنجاح' :
                 currentLanguage.code === 'fr' ? 'Connexion réussie' :
                 'Login successful', 'success');
      
      // Redirect to intended page or home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
      
    } catch (error) {
      setErrors({ general: tx.loginError });
      showToast(tx.loginError, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center">
      <div className="relative flex h-full min-h-screen w-full max-w-[430px] flex-col bg-background-light dark:bg-background-dark overflow-x-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
          <button 
            onClick={handleBack}
            className="text-primary dark:text-white flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">
              {isRTL ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
          <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">
            Association Espoir
          </h2>
          <div className="size-12"></div>
        </div>
        
        {/* Logo & Title */}
        <div className="flex flex-col items-center justify-center pt-10 pb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-primary text-4xl">volunteer_activism</span>
          </div>
          <h2 className="text-slate-900 dark:text-white tracking-tight text-[28px] font-bold leading-tight px-4 text-center">
            {tx.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pb-3 pt-1 px-8 text-center">
            {tx.welcome}
          </p>
        </div>
        
        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-3">
          
          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-700 dark:text-slate-200 text-sm font-medium px-1">
              {tx.emailLabel}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                email
              </span>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                placeholder={tx.emailPlaceholder}
                dir="ltr"
                className={`
                  w-full h-14 pr-12 pl-4 rounded-xl border
                  ${errors.email ? 'border-error focus:border-error focus:ring-error/20' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20'}
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white
                  focus:ring-2 transition-all text-base
                `}
              />
            </div>
            {errors.email && (
              <p className="text-error text-xs px-1">{errors.email}</p>
            )}
          </div>
          
          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-700 dark:text-slate-200 text-sm font-medium px-1">
              {tx.passwordLabel}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                placeholder={tx.passwordPlaceholder}
                className={`
                  w-full h-14 pr-12 pl-12 rounded-xl border 
                  ${errors.password ? 'border-error focus:border-error focus:ring-error/20' : 'border-slate-200 dark:border-slate-700 focus:border-primary focus:ring-primary/20'}
                  bg-white dark:bg-slate-800 text-slate-900 dark:text-white 
                  focus:ring-2 transition-all text-base
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.password && (
              <p className="text-error text-xs px-1">{errors.password}</p>
            )}
          </div>
          
          {/* Forgot Password */}
          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <Link 
              to="/forgot-password" 
              className="text-primary text-sm font-medium hover:underline"
            >
              {tx.forgotPassword}
            </Link>
          </div>
          
          {/* General Error */}
          {errors.general && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl">
              <p className="text-error text-sm text-center">{errors.general}</p>
            </div>
          )}
          
          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            loading={isLoading}
            className="mt-4 shadow-lg shadow-primary/20"
          >
            {tx.loginButton}
          </Button>
        </form>
        
        {/* Footer */}
        <div className="mt-auto p-8 flex flex-col items-center gap-6">
          <p className="text-slate-600 dark:text-slate-400 text-sm">
            {tx.noAccount}
            <Link to="/register" className="text-primary font-bold hover:underline mx-1">
              {tx.registerNow}
            </Link>
          </p>
          <p className="text-slate-400 text-[11px] text-center px-4">
            {tx.termsText}
          </p>
        </div>
        
        <div className="h-8 w-full"></div>
      </div>
    </div>
  );
};

export default Login;
