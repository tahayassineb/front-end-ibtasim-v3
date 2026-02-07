import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';

// ============================================
// ADMIN LOGIN PAGE - Secure authentication
// ============================================

const AdminLogin = () => {
  const { login, currentLanguage, isDarkMode } = useApp();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Translations
  const translations = {
    ar: {
      title: 'Association Espoir',
      subtitle: 'مصادقة آمنة لأعضاء الفريق',
      emailLabel: 'البريد الإلكتروني للمشرف',
      emailPlaceholder: 'name@espoir.org',
      passwordLabel: 'كلمة المرور',
      passwordPlaceholder: '••••••••',
      rememberMe: 'تذكرني',
      forgotPassword: 'نسيت كلمة المرور؟',
      loginButton: 'تسجيل الدخول الآمن',
      backButton: 'العودة للموقع',
      encrypted: 'اتصال مشفر',
      encryptionType: 'تشفير AES 256-bit',
      errorInvalid: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      errorRequired: 'جميع الحقول مطلوبة',
    },
    fr: {
      title: 'Association Espoir',
      subtitle: 'Authentification sécurisée pour le personnel',
      emailLabel: 'Email Admin',
      emailPlaceholder: 'nom@espoir.org',
      passwordLabel: 'Mot de passe',
      passwordPlaceholder: '••••••••',
      rememberMe: 'Se souvenir de moi',
      forgotPassword: 'Mot de passe oublié ?',
      loginButton: 'Connexion Sécurisée',
      backButton: 'Retour au site',
      encrypted: 'Connexion Chiffrée',
      encryptionType: 'Chiffrement AES 256-bit',
      errorInvalid: 'Email ou mot de passe invalide',
      errorRequired: 'Tous les champs sont obligatoires',
    },
    en: {
      title: 'Association Espoir',
      subtitle: 'Secure authentication for staff members',
      emailLabel: 'Admin Email',
      emailPlaceholder: 'name@espoir.org',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      rememberMe: 'Remember me',
      forgotPassword: 'Forgot password?',
      loginButton: 'Secure Login',
      backButton: 'Back to Website',
      encrypted: 'Encrypted Connection',
      encryptionType: '256-bit AES Encryption',
      errorInvalid: 'Invalid email or password',
      errorRequired: 'All fields are required',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError(t.errorRequired);
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock authentication - in production this would be a real API call
      if (formData.email.includes('@') && formData.password.length >= 6) {
        login({
          id: 1,
          name: 'Admin User',
          email: formData.email,
          role: 'admin',
        });
        navigate('/admin');
      } else {
        setError(t.errorInvalid);
      }
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 pb-2 justify-between">
        <Link 
          to="/" 
          className="text-primary flex size-12 shrink-0 items-center cursor-pointer hover:bg-primary/10 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h2 className="text-text-primary dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-12">
          Admin Portal
        </h2>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        {/* Glassmorphism Card */}
        <div className="w-full max-w-[400px] rounded-xl p-8 shadow-2xl flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/30 dark:border-white/10">
          {/* Shield Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-5xl">shield_person</span>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8 text-center">
            <h1 className="text-text-primary dark:text-white text-2xl font-bold leading-tight mb-2">
              {t.title}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{t.subtitle}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label className="text-text-primary dark:text-white text-sm font-semibold px-1">
                {t.emailLabel}
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder={t.emailPlaceholder}
                  className="flex w-full rounded-lg text-text-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 h-14 placeholder:text-slate-400 p-4 pl-12 text-base"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  mail
                </span>
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <label className="text-text-primary dark:text-white text-sm font-semibold px-1">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder={t.passwordPlaceholder}
                  className="flex w-full rounded-lg text-text-primary dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 h-14 placeholder:text-slate-400 p-4 pl-12 pr-12 text-base"
                />
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  lock
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
                  {t.rememberMe}
                </span>
              </label>
              <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                {t.forgotPassword}
              </Link>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-error text-sm text-center bg-error/10 rounded-lg p-3">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                icon="login"
                className="shadow-lg shadow-primary/30"
              >
                {t.loginButton}
              </Button>
            </div>
          </form>

          {/* Encryption Badge */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
              {t.encrypted}
            </p>
            <div className="flex justify-center gap-2 mt-2">
              <span className="material-symbols-outlined text-[16px] text-green-500">verified_user</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{t.encryptionType}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto p-8 text-center">
        <div className="mx-auto w-full max-w-[300px] h-[120px] bg-center bg-no-repeat bg-contain opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230D7377' fill-opacity='1' d='M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")`
          }}
        />
        <p className="text-slate-400 dark:text-slate-600 text-xs mt-4">
          © 2024 Association Espoir. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
