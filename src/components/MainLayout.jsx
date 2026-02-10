import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ============================================
// MAIN LAYOUT - Public Pages Layout
// ============================================

const MainLayout = ({ children }) => {
  const { language, currentLanguage, changeLanguage, t, isAuthenticated, user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prevPathnameRef = useRef(location.pathname);

  // Logo URL
  const logoUrl = 'https://nlfixnhoufntbbcccnwr.supabase.co/storage/v1/object/public/campaigns/Gemini_Generated_Image_7ce0up7ce0up7ce0-Photoroom%20(1).png';

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    if (location.pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = location.pathname;
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    }
  }, [location.pathname, isMobileMenuOpen]);

  const navItems = [
    { path: '/', label: t('home'), icon: 'home' },
    { path: '/projects', label: t('projects'), icon: 'volunteer_activism' },
    { path: '/about', label: t('about'), icon: 'info' },
    { path: '/contact', label: t('contact'), icon: 'mail' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark" dir={currentLanguage.dir}>
      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-bg-dark-card/95 backdrop-blur-md shadow-sm'
            : 'bg-bg-light dark:bg-bg-dark'
        }`}
      >
        <div className="max-w-desktop mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={logoUrl} 
                alt="جمعية ابتسم" 
                className="w-10 h-10 md:w-12 md:h-12 object-contain rounded-xl"
              />
              <div className="hidden sm:block">
                <h1 className="text-lg md:text-xl font-bold text-text-primary dark:text-white font-arabic">
                  {language === 'ar' ? 'جمعية ابتسم' : language === 'fr' ? 'Association Ibtasam' : 'Ibtasam Association'}
                </h1>
                <p className="text-xs text-text-muted hidden md:block">
                  {language === 'ar' ? 'للأعمال الاجتماعية والخيرية' : language === 'fr' ? 'Œuvres Sociales et Caritatives' : 'Social & Charitable Works'}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right Section: Language + Auth */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Language Selector */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-sm font-medium
                           text-text-secondary hover:text-primary hover:bg-primary/5
                           transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-lg">language</span>
                  <span className="uppercase font-bold">{language}</span>
                  <span className="material-symbols-outlined text-sm">expand_more</span>
                </button>
                
                {/* Language Dropdown */}
                <div className={`absolute ${currentLanguage.dir === 'rtl' ? 'left-0' : 'right-0'} top-full mt-2 w-32 py-2 bg-white dark:bg-bg-dark-card rounded-xl shadow-xl border border-border-light dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                  {['ar', 'fr', 'en'].map((langCode) => (
                    <button
                      key={langCode}
                      onClick={() => changeLanguage(langCode)}
                      className={`w-full px-4 py-2 text-sm text-center font-bold transition-colors duration-200 ${
                        language === langCode
                          ? 'text-primary bg-primary/10'
                          : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                      }`}
                    >
                      {langCode === 'ar' ? 'العربية' : langCode === 'fr' ? 'Français' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Donate Button (Desktop) */}
              <Link
                to="/projects"
                className="hidden md:flex btn-primary"
              >
                <span className="material-symbols-outlined">favorite</span>
                {t('donate')}
              </Link>

              {/* Admin Link (Desktop) */}
              <Link
                to="/admin/login"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                title={language === 'ar' ? 'لوحة الإدارة' : language === 'fr' ? 'Administration' : 'Admin'}
              >
                <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
              </Link>

              {/* Auth Buttons or User Menu */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 p-1.5 rounded-full hover:bg-primary/5 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">person</span>
                    </div>
                  </button>
                  
                  {/* User Dropdown */}
                  <div className={`absolute ${currentLanguage.dir === 'rtl' ? 'left-0' : 'right-0'} top-full mt-2 w-48 py-2 bg-white dark:bg-bg-dark-card rounded-xl shadow-xl border border-border-light dark:border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50`}>
                    <div className="px-4 py-2 border-b border-border-light dark:border-white/10">
                      <p className="font-semibold text-text-primary dark:text-white">{user?.name || t('profile')}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">person_outline</span>
                      {t('profile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-error/5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg">logout</span>
                      {t('logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                           text-primary hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined">login</span>
                  {t('login')}
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">
                  {isMobileMenuOpen ? 'close' : 'menu'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-bg-dark-card border-t border-border-light dark:border-white/10 animate-slide-down">
            <nav className="px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-text-secondary hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              
              <div className="pt-4 mt-4 border-t border-border-light dark:border-white/10">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/login"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined">login</span>
                      {t('login')}
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                    >
                      <span className="material-symbols-outlined">person_add</span>
                      {t('register')}
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium text-error hover:bg-error/5 transition-colors"
                  >
                    <span className="material-symbols-outlined">logout</span>
                    {t('logout')}
                  </button>
                )}
                {/* Admin Access */}
                <Link
                  to="/admin/login"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors border-t border-border-light dark:border-white/10 mt-2 pt-2"
                >
                  <span className="material-symbols-outlined">admin_panel_settings</span>
                  {language === 'ar' ? 'لوحة الإدارة' : language === 'fr' ? 'Administration' : 'Admin Panel'}
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1" role="main">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-bg-dark-card border-t border-border-light dark:border-white/10">
        <div className="max-w-desktop mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={logoUrl} 
                  alt="جمعية ابتسم" 
                  className="w-12 h-12 object-contain rounded-xl"
                />
                <div>
                  <h3 className="font-bold text-text-primary dark:text-white font-arabic">
                    {language === 'ar' ? 'جمعية ابتسم' : language === 'fr' ? 'Association Ibtasam' : 'Ibtasam Association'}
                  </h3>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                {language === 'ar'
                  ? 'جمعية خيرية مرخصة تعمل على رعاية الأيتام وتقديم الدعم الشامل لهم في المغرب.'
                  : language === 'fr'
                  ? 'Association caritative agréée travaillant pour la prise en charge des orphelins au Maroc.'
                  : 'Licensed charity working to care for orphans in Morocco.'}
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">facebook</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">chat</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-text-primary dark:text-white mb-4">
                {language === 'ar' ? 'روابط سريعة' : language === 'fr' ? 'Liens Rapides' : 'Quick Links'}
              </h4>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className="text-sm text-text-secondary hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-text-primary dark:text-white mb-4">
                {t('contact')}
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <span>Casablanca, Morocco</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <span className="material-symbols-outlined text-primary">phone</span>
                  <span>+212 5XX-XXXXXX</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <span className="material-symbols-outlined text-primary">email</span>
                  <span>contact@ibtasam.org</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold text-text-primary dark:text-white mb-4">
                {language === 'ar' ? 'النشرة البريدية' : language === 'fr' ? 'Newsletter' : 'Newsletter'}
              </h4>
              <p className="text-sm text-text-secondary mb-4">
                {language === 'ar'
                  ? 'اشترك للحصول على آخر الأخبار والمشاريع'
                  : language === 'fr'
                  ? 'Abonnez-vous pour recevoir les dernières actualités et projets'
                  : 'Subscribe to receive the latest news and projects'}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={language === 'ar' ? 'بريدك الإلكتروني' : language === 'fr' ? 'Votre email' : 'Your email'}
                  className="flex-1 h-11 px-4 rounded-xl bg-bg-teal-wash dark:bg-bg-dark border-0 text-sm focus:ring-2 focus:ring-primary/20"
                />
                <button className="h-11 px-4 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-border-light dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              © {new Date().getFullYear()} {language === 'ar' ? 'جمعية ابتسم' : language === 'fr' ? 'Association Ibtasam' : 'Ibtasam Association'}. {language === 'ar' ? 'جميع الحقوق محفوظة' : language === 'fr' ? 'Tous droits réservés' : 'All rights reserved'}.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-text-muted hover:text-primary transition-colors">
                {language === 'ar' ? 'سياسة الخصوصية' : language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
              </Link>
              <Link to="/terms" className="text-sm text-text-muted hover:text-primary transition-colors">
                {language === 'ar' ? 'شروط الاستخدام' : language === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Use'}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
