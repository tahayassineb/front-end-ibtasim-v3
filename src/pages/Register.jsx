import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';

// ============================================
// REGISTER PAGE - User Registration (Email + Password)
// ============================================

const Register = () => {
  const navigate = useNavigate();
  const { t, currentLanguage, login, showToast } = useApp();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const isRTL = currentLanguage.dir === 'rtl';
  
  // Translations
  const translations = {
    ar: {
      title: 'أنشئ حسابك',
      subtitle: 'انضم إلى مجتمعنا من المتبرعين وساهم في دعم المشاريع الإنسانية.',
      fullNameLabel: 'الاسم الكامل',
      fullNamePlaceholder: 'أدخل اسمك الكامل',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'example@mail.com',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'تأكيد كلمة المرور',
      confirmPasswordPlaceholder: '••••••••',
      termsText: 'أوافق على ',
      termsLink: 'الشروط والأحكام',
      andText: ' و ',
      privacyLink: 'سياسة الخصوصية',
      termsSuffix: ' لجمعية الأمل.',
      submitButton: 'إنشاء حساب',
      haveAccount: 'لديك حساب بالفعل؟',
      loginLink: 'تسجيل الدخول',
      nameError: 'يرجى إدخال الاسم الكامل',
      emailError: 'يرجى إدخال بريد إلكتروني صحيح',
      passwordError: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
      confirmPasswordError: 'كلمتا المرور غير متطابقتين',
      termsError: 'يجب الموافقة على الشروط والأحكام',
    },
    fr: {
      title: 'Créez votre compte',
      subtitle: 'Rejoignez notre communauté de donateurs et contribuez à des projets humanitaires.',
      fullNameLabel: 'Nom complet',
      fullNamePlaceholder: 'Entrez votre nom complet',
      emailLabel: 'Adresse email',
      emailPlaceholder: 'exemple@mail.com',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirmer le mot de passe',
      confirmPasswordPlaceholder: '••••••••',
      termsText: 'J\'accepte les ',
      termsLink: 'Conditions d\'utilisation',
      andText: ' et la ',
      privacyLink: 'Politique de confidentialité',
      termsSuffix: ' d\'Association Espoir.',
      submitButton: 'Créer un compte',
      haveAccount: 'Vous avez déjà un compte?',
      loginLink: 'Connexion',
      nameError: 'Veuillez entrer votre nom complet',
      emailError: 'Veuillez entrer une adresse email valide',
      passwordError: 'Le mot de passe doit contenir au moins 6 caractères',
      confirmPasswordError: 'Les mots de passe ne correspondent pas',
      termsError: 'Vous devez accepter les conditions d\'utilisation',
    },
    en: {
      title: 'Create your account',
      subtitle: 'Join our donor community and contribute to humanitarian projects.',
      fullNameLabel: 'Full Name',
      fullNamePlaceholder: 'Enter your full name',
      emailLabel: 'Email Address',
      emailPlaceholder: 'example@mail.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirm Password',
      confirmPasswordPlaceholder: '••••••••',
      termsText: 'I agree to the ',
      termsLink: 'Terms & Conditions',
      andText: ' and ',
      privacyLink: 'Privacy Policy',
      termsSuffix: ' of Association Espoir.',
      submitButton: 'Create Account',
      haveAccount: 'Already have an account?',
      loginLink: 'Login',
      nameError: 'Please enter your full name',
      emailError: 'Please enter a valid email address',
      passwordError: 'Password must be at least 6 characters',
      confirmPasswordError: 'Passwords do not match',
      termsError: 'You must agree to the terms and conditions',
    },
  };
  
  const tx = translations[currentLanguage.code] || translations.fr;
  
  // Validation functions
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  
  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
  }, [errors]);
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim() || formData.fullName.length < 2) {
      newErrors.fullName = tx.nameError;
    }
    
    if (!validateEmail(formData.email)) {
      newErrors.email = tx.emailError;
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = tx.passwordError;
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = tx.confirmPasswordError;
    }
    
    if (!acceptedTerms) {
      newErrors.terms = tx.termsError;
    }
    
    return newErrors;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const userData = {
        id: 'user_' + Date.now(),
        name: formData.fullName,
        email: formData.email,
        avatar: null,
        createdAt: new Date().toISOString(),
        donations: [],
      };
      
      login(userData);
      showToast(currentLanguage.code === 'ar' ? 'تم إنشاء الحساب بنجاح' : 
                 currentLanguage.code === 'fr' ? 'Compte créé avec succès' : 
                 'Account created successfully', 'success');
      
      navigate('/', { replace: true });
      
    } catch (error) {
      showToast(currentLanguage.code === 'ar' ? 'حدث خطأ' : 
                 currentLanguage.code === 'fr' ? 'Une erreur est survenue' : 
                 'An error occurred', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle back navigation
  const handleBack = () => {
    navigate(-1);
  };
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="relative flex h-full min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden max-w-[430px] mx-auto shadow-2xl">
        
        {/* Top Navigation */}
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
          <button 
            onClick={handleBack}
            className="text-primary flex size-12 shrink-0 items-center justify-center rounded-full hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
              {isRTL ? 'arrow_forward' : 'arrow_back'}
            </span>
          </button>
          <h2 className="text-primary font-bold text-lg leading-tight tracking-tight flex-1 text-center">
            {isRTL ? 'جمعية الأمل' : 'Association Espoir'}
          </h2>
          <div className="size-12"></div>
        </div>
        
        {/* Header Section */}
        <div className="px-6 pt-10 pb-4">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 40 }}>person_add</span>
            </div>
          </div>
          <h2 className="text-primary text-[28px] font-bold leading-tight text-center pb-3">
            {tx.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-relaxed text-center px-4">
            {tx.subtitle}
          </p>
        </div>
        
        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 py-6">
          
          {/* Full Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold leading-normal px-1">
              {tx.fullNameLabel}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary/60">
                person
              </span>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder={tx.fullNamePlaceholder}
                className={`
                  flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl 
                  text-gray-800 dark:text-white focus:outline-0 focus:ring-2 
                  ${errors.fullName ? 'focus:ring-error/50 border-error' : 'focus:ring-primary/50 border-transparent'}
                  border-none bg-white dark:bg-gray-800 shadow-sm h-14 placeholder:text-gray-400 pr-12 text-base font-normal leading-normal
                `}
              />
            </div>
            {errors.fullName && (
              <p className="text-error text-xs px-1">{errors.fullName}</p>
            )}
          </div>
          
          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold leading-normal px-1">
              {tx.emailLabel}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary/60">
                mail
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={tx.emailPlaceholder}
                dir="ltr"
                className={`
                  flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl 
                  text-gray-800 dark:text-white focus:outline-0 focus:ring-2 
                  ${errors.email ? 'focus:ring-error/50 border-error' : 'focus:ring-primary/50 border-transparent'}
                  border-none bg-white dark:bg-gray-800 shadow-sm h-14 placeholder:text-gray-400 pr-12 text-base font-normal leading-normal text-right
                `}
              />
            </div>
            {errors.email && (
              <p className="text-error text-xs px-1">{errors.email}</p>
            )}
          </div>
          
          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold leading-normal px-1">
              {tx.passwordLabel}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary/60">
                lock
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={tx.passwordPlaceholder}
                className={`
                  flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl 
                  text-gray-800 dark:text-white focus:outline-0 focus:ring-2 
                  ${errors.password ? 'focus:ring-error/50 border-error' : 'focus:ring-primary/50 border-transparent'}
                  border-none bg-white dark:bg-gray-800 shadow-sm h-14 placeholder:text-gray-400 pr-12 pl-12 text-base font-normal leading-normal
                `}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
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
          
          {/* Confirm Password Input */}
          <div className="flex flex-col gap-2">
            <label className="text-primary text-sm font-semibold leading-normal px-1">
              {tx.confirmPasswordLabel}
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary/60">
                lock_reset
              </span>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder={tx.confirmPasswordPlaceholder}
                className={`
                  flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl 
                  text-gray-800 dark:text-white focus:outline-0 focus:ring-2 
                  ${errors.confirmPassword ? 'focus:ring-error/50 border-error' : 'focus:ring-primary/50 border-transparent'}
                  border-none bg-white dark:bg-gray-800 shadow-sm h-14 placeholder:text-gray-400 pr-12 pl-12 text-base font-normal leading-normal
                `}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-error text-xs px-1">{errors.confirmPassword}</p>
            )}
          </div>
          
          {/* Terms & Conditions */}
          <div className="py-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="mt-1">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => {
                    setAcceptedTerms(e.target.checked);
                    if (errors.terms) setErrors(prev => ({ ...prev, terms: null }));
                  }}
                  className="rounded text-primary focus:ring-primary border-gray-300 w-5 h-5 cursor-pointer"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-tight">
                {tx.termsText}
                <span className="text-primary font-bold cursor-pointer hover:underline">{tx.termsLink}</span>
                {tx.andText}
                <span className="text-primary font-bold cursor-pointer hover:underline">{tx.privacyLink}</span>
                {tx.termsSuffix}
              </p>
            </label>
            {errors.terms && (
              <p className="text-error text-xs px-1 mt-2">{errors.terms}</p>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="mt-auto pt-4">
            <Button
              type="submit"
              variant="primary"
              size="xl"
              fullWidth
              loading={isLoading}
              icon={!isLoading && 'how_to_reg'}
              iconPosition={isRTL ? 'right' : 'left'}
              className="shadow-lg shadow-primary/30"
            >
              {tx.submitButton}
            </Button>
            
            <p className="text-center mt-6 text-gray-500 text-sm">
              {tx.haveAccount}{' '}
              <Link to="/login" className="text-primary font-bold cursor-pointer hover:underline">
                {tx.loginLink}
              </Link>
            </p>
          </div>
        </form>
        
        {/* Decorative Elements */}
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-20 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none"></div>
      </div>
    </div>
  );
};

export default Register;
