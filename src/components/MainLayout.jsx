import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ============================================
// MAIN LAYOUT - Public Pages Layout
// ============================================

const MainLayout = ({ children }) => {
  const { language, currentLanguage, changeLanguage, isAuthenticated, user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = location.pathname;
      if (isMobileMenuOpen) setIsMobileMenuOpen(false);
    }
  }, [location.pathname, isMobileMenuOpen]);

  const navItems = [
    { path: '/', label: 'الرئيسية' },
    { path: '/projects', label: 'المشاريع' },
    { path: '/kafala', label: 'الكفالة' },
    { path: '/impact', label: 'قصص النجاح' },
    { path: '/about', label: 'حول الجمعية' },
    { path: '/contact', label: 'تواصل معنا' },
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
    <div className="min-h-screen flex flex-col" style={{ background: '#f6f8f8', color: '#0e1a1b', fontFamily: 'Tajawal, sans-serif' }} dir="rtl">
      {/* ── HEADER ── */}
      <header
        className="sticky top-0 z-50 bg-white transition-shadow duration-300"
        style={{
          borderBottom: '1px solid #E5E9EB',
          boxShadow: isScrolled ? '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)' : 'none',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, background: '#0d7477', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16 }}>ا</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#0e1a1b' }}>ابتسام</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex" style={{ gap: 2 }}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  height: 36,
                  padding: '0 14px',
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: isActive(item.path) ? 600 : 500,
                  color: isActive(item.path) ? '#0A5F62' : '#64748b',
                  background: isActive(item.path) ? '#E6F4F4' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Header Actions */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
            {/* Language Selector */}
            <div className="relative group hidden md:block">
              <button
                style={{
                  height: 36,
                  padding: '0 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 100,
                  background: '#E6F4F4',
                  color: '#0A5F62',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                  whiteSpace: 'nowrap',
                }}
              >
                🌍 {language === 'ar' ? 'العربية' : language === 'fr' ? 'Français' : 'English'}
              </button>
              <div
                className="absolute top-full mt-2 w-32 py-2 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                style={{ left: 0, border: '1px solid #E5E9EB' }}
              >
                {['ar', 'fr', 'en'].map((langCode) => (
                  <button
                    key={langCode}
                    onClick={() => changeLanguage(langCode)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      fontSize: 13,
                      textAlign: 'center',
                      fontWeight: 600,
                      background: language === langCode ? '#E6F4F4' : 'transparent',
                      color: language === langCode ? '#0d7477' : '#64748b',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'Tajawal, sans-serif',
                    }}
                  >
                    {langCode === 'ar' ? 'العربية' : langCode === 'fr' ? 'Français' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth: Login button or user dropdown */}
            {isAuthenticated ? (
              <div className="relative group hidden md:block">
                <button style={{ height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600, borderRadius: 100, border: '1.5px solid #0d7477', background: 'white', color: '#0d7477', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
                  {user?.name || 'حسابي'}
                </button>
                <div
                  className="absolute top-full mt-2 w-48 py-2 bg-white rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50"
                  style={{ left: 0, border: '1px solid #E5E9EB' }}
                >
                  <div style={{ padding: '8px 16px', borderBottom: '1px solid #E5E9EB' }}>
                    <p style={{ fontWeight: 600, fontSize: 14, color: '#0e1a1b' }}>{user?.name}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8' }}>{user?.email}</p>
                  </div>
                  <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_outline</span>
                    الملف الشخصي
                  </Link>
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 16px', fontSize: 13, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                    تسجيل الخروج
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex"
                style={{ height: 36, padding: '0 16px', fontSize: 13, fontWeight: 600, borderRadius: 100, border: '1.5px solid #0d7477', background: 'white', color: '#0d7477', textDecoration: 'none', alignItems: 'center' }}
              >
                دخول
              </Link>
            )}

            {/* Donate Now CTA */}
            <Link
              to="/projects"
              className="hidden md:flex"
              style={{ height: 36, padding: '0 18px', fontSize: 13, fontWeight: 700, borderRadius: 100, background: '#0d7477', color: 'white', textDecoration: 'none', alignItems: 'center', boxShadow: '0 4px 14px rgba(13,116,119,0.25)' }}
            >
              تبرع الآن
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
              style={{ padding: 8, borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden animate-slide-down" style={{ background: 'white', borderTop: '1px solid #E5E9EB' }}>
            <nav style={{ padding: '12px 16px' }}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: 10,
                    fontSize: 15,
                    fontWeight: isActive(item.path) ? 600 : 500,
                    color: isActive(item.path) ? '#0A5F62' : '#64748b',
                    background: isActive(item.path) ? '#E6F4F4' : 'transparent',
                    textDecoration: 'none',
                    marginBottom: 2,
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid #E5E9EB', paddingTop: 12, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {!isAuthenticated ? (
                  <>
                    <Link to="/login" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#64748b', textDecoration: 'none' }}>
                      دخول
                    </Link>
                    <Link to="/register" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#64748b', textDecoration: 'none' }}>
                      إنشاء حساب
                    </Link>
                  </>
                ) : (
                  <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 10, fontSize: 15, fontWeight: 500, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', width: '100%' }}>
                    تسجيل الخروج
                  </button>
                )}
                <Link
                  to="/projects"
                  style={{ display: 'flex', justifyContent: 'center', padding: '14px 16px', borderRadius: 100, fontSize: 15, fontWeight: 700, background: '#0d7477', color: 'white', textDecoration: 'none', boxShadow: '0 4px 14px rgba(13,116,119,0.25)', marginTop: 4 }}
                >
                  تبرع الآن
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

      {/* ── FOOTER ── */}
      <footer style={{ background: '#0e1a1b', color: 'rgba(255,255,255,0.8)', padding: '56px 0 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          {/* Footer Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 48, marginBottom: 48 }}>
            {/* Col 1: Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: '#0d7477', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16 }}>ا</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>ابتسام</div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: 'rgba(255,255,255,0.55)', maxWidth: 260 }}>
                جمعية ابتسام للأعمال الخيرية — معتمدة رسمياً، نعمل من أجل مستقبل أفضل للأسر المحتاجة في المغرب منذ 2018
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {[{ icon: '📘', label: 'Facebook' }, { icon: '📷', label: 'Instagram' }, { icon: '💬', label: 'WhatsApp' }].map(({ icon, label }) => (
                  <a key={label} href="#" aria-label={label} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, cursor: 'pointer', textDecoration: 'none' }}>
                    {icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2: Quick Links */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16 }}>روابط سريعة</div>
              {[
                { path: '/', label: 'الصفحة الرئيسية' },
                { path: '/projects', label: 'المشاريع' },
                { path: '/kafala', label: 'الكفالة' },
                { path: '/impact', label: 'قصص النجاح' },
                { path: '/about', label: 'حول الجمعية' },
              ].map((item) => (
                <Link key={item.path} to={item.path} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10, textDecoration: 'none' }}>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Col 3: Trust */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16 }}>تبرع بثقة</div>
              {['🔒 تحويل بنكي آمن', '💳 بطاقة بنكية', '📜 الشفافية المالية', '📊 تقارير الإنجاز'].map((item) => (
                <div key={item} style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>{item}</div>
              ))}
            </div>

            {/* Col 4: Contact */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'white', marginBottom: 16 }}>تواصل معنا</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>📞 +212 5 XX XX XX XX</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>✉ contact@ibtasim.ma</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 10 }}>📍 الرباط، المغرب</div>
              <div style={{ fontSize: 13, color: '#33C0C0', marginBottom: 10, cursor: 'pointer' }}>💬 واتساب للدعم</div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', flexWrap: 'wrap', gap: 8 }}>
            <span>© 2026 جمعية ابتسام — جميع الحقوق محفوظة</span>
            <span>🔒 محمي بتشفير SSL · معتمد HTTPS</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
