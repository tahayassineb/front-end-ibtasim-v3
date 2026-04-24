import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const LABELS = {
  ar: {
    brand: 'ابتسم',
    home: 'الرئيسية',
    projects: 'المشاريع',
    kafala: 'الكفالة',
    stories: 'القصص',
    about: 'من نحن',
    contact: 'تواصل',
    donate: 'تبرع الآن',
    login: 'دخول',
    profile: 'حسابي',
    admin: 'الإدارة',
    legal: '© 2026 جمعية ابتسم',
    rights: 'جميع الحقوق محفوظة',
    menu: 'القائمة',
  },
  fr: {
    brand: 'Ibtassim',
    home: 'Accueil',
    projects: 'Projets',
    kafala: 'Kafala',
    stories: 'Histoires',
    about: 'A propos',
    contact: 'Contact',
    donate: 'Donner',
    login: 'Connexion',
    profile: 'Mon compte',
    admin: 'Admin',
    legal: '© 2026 Association Ibtassim',
    rights: 'Tous droits reserves',
    menu: 'Menu',
  },
  en: {
    brand: 'Ibtassim',
    home: 'Home',
    projects: 'Projects',
    kafala: 'Kafala',
    stories: 'Stories',
    about: 'About',
    contact: 'Contact',
    donate: 'Donate now',
    login: 'Login',
    profile: 'Account',
    admin: 'Admin',
    legal: '© 2026 Association Ibtassim',
    rights: 'All rights reserved',
    menu: 'Menu',
  },
};

const LANGUAGE_OPTIONS = [
  { code: 'ar', label: 'AR' },
  { code: 'fr', label: 'FR' },
  { code: 'en', label: 'EN' },
];

export default function HomeShell({ children }) {
  const { language, currentLanguage, changeLanguage, isAuthenticated, user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLanguages, setShowLanguages] = useState(false);

  const lang = currentLanguage?.code || language || 'ar';
  const dir = currentLanguage?.dir || (lang === 'ar' ? 'rtl' : 'ltr');
  const copy = LABELS[lang] || LABELS.ar;

  const navItems = useMemo(
    () => [
      { to: '/', label: copy.home },
      { to: '/projects', label: copy.projects },
      { to: '/kafala', label: copy.kafala },
      { to: '/stories', label: copy.stories },
      { to: '/about', label: copy.about },
      { to: '/contact', label: copy.contact },
    ],
    [copy]
  );

  const accountHref = isAuthenticated ? '/profile' : '/login';
  const accountLabel = isAuthenticated ? (user?.name || copy.profile) : copy.login;

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
  };

  const renderLanguageButtons = (compact = false) => (
    <div className={`home-shell__lang ${compact ? 'is-compact' : ''}`} role="group" aria-label="Language switcher">
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={option.code === lang ? 'is-active' : ''}
          onClick={() => {
            changeLanguage(option.code);
            setShowLanguages(false);
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="home-shell" dir={dir}>
      <style>
        {`
          .home-shell {
            min-height: 100vh;
            background: var(--color-bg-light);
            color: var(--color-text-primary);
            font-family: var(--font-arabic);
          }
          .home-shell__header {
            position: sticky;
            top: 0;
            z-index: 70;
            backdrop-filter: blur(18px);
            background: rgba(255, 255, 255, 0.9);
            border-bottom: 1px solid rgba(13, 116, 119, 0.08);
          }
          .home-shell__header-inner,
          .home-shell__footer-inner {
            width: min(1180px, calc(100% - 32px));
            margin: 0 auto;
          }
          .home-shell__header-inner {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 24px;
            min-height: 78px;
          }
          .home-shell__brand {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: inherit;
            text-decoration: none;
            white-space: nowrap;
          }
          .home-shell__mark {
            width: 34px;
            height: 34px;
            border-radius: 999px;
            background: radial-gradient(circle at 30% 30%, #f0d9a2, #c89c4c 62%, #8f6d2a 100%);
            display: grid;
            place-items: center;
            color: #ffffff;
            font-size: 14px;
            font-weight: 700;
            box-shadow: 0 8px 18px rgba(210, 157, 47, 0.22);
          }
          .home-shell__brand-text {
            font-size: 1.25rem;
            font-weight: 800;
            letter-spacing: 0;
          }
          .home-shell__nav {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
          }
          .home-shell__nav a {
            padding: 10px 14px;
            border-radius: 999px;
            text-decoration: none;
            color: var(--color-text-secondary);
            font-size: 0.95rem;
            font-weight: 600;
            transition: background-color 180ms ease, color 180ms ease;
          }
          .home-shell__nav a:hover,
          .home-shell__nav a.is-active {
            background: rgba(13, 116, 119, 0.09);
            color: var(--color-primary-dark);
          }
          .home-shell__actions {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .home-shell__lang {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px;
            border-radius: 999px;
            background: rgba(13, 116, 119, 0.08);
          }
          .home-shell__lang button {
            border: 0;
            background: transparent;
            color: var(--color-text-secondary);
            font: inherit;
            font-size: 0.8rem;
            font-weight: 700;
            min-width: 40px;
            height: 34px;
            border-radius: 999px;
            cursor: pointer;
            transition: background-color 180ms ease, color 180ms ease;
          }
          .home-shell__lang button.is-active {
            background: #ffffff;
            color: var(--color-primary-dark);
            box-shadow: 0 6px 16px rgba(13, 116, 119, 0.08);
          }
          .home-shell__button,
          .home-shell__ghost {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-decoration: none;
            font-size: 0.94rem;
            font-weight: 700;
            min-height: 44px;
            padding: 0 18px;
            border-radius: 999px;
            transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, color 180ms ease;
          }
          .home-shell__button:hover,
          .home-shell__ghost:hover {
            transform: translateY(-1px);
          }
          .home-shell__ghost {
            background: #ffffff;
            color: var(--color-primary-dark);
            border: 1px solid rgba(13, 116, 119, 0.12);
            box-shadow: 0 10px 24px rgba(13, 116, 119, 0.05);
          }
          .home-shell__button {
            background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
            color: #ffffff;
            box-shadow: 0 14px 28px rgba(13, 116, 119, 0.22);
          }
          .home-shell__menu-toggle {
            display: none;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            border-radius: 14px;
            border: 1px solid rgba(13, 116, 119, 0.12);
            background: rgba(255, 255, 255, 0.84);
            color: var(--color-primary-dark);
            cursor: pointer;
          }
          .home-shell__main {
            position: relative;
          }
          .home-shell__footer {
            padding: 24px 0 34px;
          }
          .home-shell__footer-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            color: var(--color-text-secondary);
            font-size: 0.86rem;
            border-top: 1px solid rgba(13, 116, 119, 0.08);
            padding-top: 22px;
          }
          .home-shell__footer-links {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .home-shell__footer-links a,
          .home-shell__footer-links button {
            color: inherit;
            text-decoration: none;
            background: none;
            border: 0;
            padding: 0;
            font: inherit;
            cursor: pointer;
          }
          .home-shell__mobile-panel {
            display: none;
          }
          @media (max-width: 1024px) {
            .home-shell__header-inner {
              grid-template-columns: auto 1fr auto;
              gap: 12px;
              min-height: 72px;
            }
            .home-shell__nav,
            .home-shell__actions > .home-shell__lang,
            .home-shell__actions > .home-shell__ghost {
              display: none;
            }
            .home-shell__menu-toggle {
              display: inline-flex;
            }
            .home-shell__actions {
              gap: 10px;
            }
            .home-shell__mobile-panel {
              display: block;
              overflow: hidden;
              max-height: 0;
              opacity: 0;
              transition: max-height 240ms ease, opacity 180ms ease, padding 180ms ease;
              border-top: 1px solid rgba(13, 116, 119, 0.08);
              background: rgba(255, 255, 255, 0.97);
            }
            .home-shell__mobile-panel.is-open {
              max-height: 520px;
              opacity: 1;
            }
            .home-shell__mobile-panel-inner {
              width: min(1180px, calc(100% - 32px));
              margin: 0 auto;
              padding: 12px 0 16px;
              display: grid;
              gap: 8px;
            }
          .home-shell__mobile-link {
            display: flex;
            align-items: center;
            justify-content: space-between;
            text-decoration: none;
            color: var(--color-text-primary);
            font-size: 1rem;
            font-weight: 650;
            padding: 12px 14px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.78);
            border: 1px solid rgba(13, 116, 119, 0.08);
          }
          .home-shell__mobile-link.is-active {
            background: rgba(13, 116, 119, 0.09);
            color: var(--color-primary-dark);
          }
            .home-shell__mobile-block {
              display: grid;
              gap: 10px;
              margin-top: 6px;
            }
          }
          @media (max-width: 640px) {
            .home-shell__header-inner,
            .home-shell__footer-inner,
            .home-shell__mobile-panel-inner {
              width: min(100% - 20px, 1180px);
            }
            .home-shell__header-inner {
              min-height: 68px;
            }
            .home-shell__brand {
              gap: 8px;
            }
            .home-shell__brand-text {
              font-size: 1.08rem;
            }
            .home-shell__button {
              min-height: 42px;
              padding: 0 14px;
              font-size: 0.86rem;
            }
            .home-shell__footer-inner {
              flex-direction: column;
              align-items: flex-start;
            }
            .home-shell__footer-links {
              flex-wrap: wrap;
            }
          }
        `}
      </style>

      <header className="home-shell__header">
        <div className="home-shell__header-inner">
          <button
            type="button"
            className="home-shell__menu-toggle"
            aria-label={copy.menu}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          <Link className="home-shell__brand" to="/">
            <span className="home-shell__mark">ب</span>
            <span className="home-shell__brand-text">{copy.brand}</span>
          </Link>

          <nav className="home-shell__nav" aria-label="Primary">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} className={isActive(item.to) ? 'is-active' : ''}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="home-shell__actions">
            {renderLanguageButtons()}
            <Link className="home-shell__ghost" to={accountHref}>
              {accountLabel}
            </Link>
            <Link className="home-shell__button" to="/projects">
              {copy.donate}
            </Link>
          </div>
        </div>

        <div className={`home-shell__mobile-panel ${isMenuOpen ? 'is-open' : ''}`}>
          <div className="home-shell__mobile-panel-inner">
            {navItems.map((item) => (
              <Link
                key={item.to}
                className={`home-shell__mobile-link ${isActive(item.to) ? 'is-active' : ''}`}
                to={item.to}
                onClick={() => setIsMenuOpen(false)}
              >
                <span>{item.label}</span>
                <span className="material-symbols-outlined">chevron_left</span>
              </Link>
            ))}

            <div className="home-shell__mobile-block">
              <button
                type="button"
                className="home-shell__mobile-link"
                onClick={() => setShowLanguages((open) => !open)}
              >
                <span>{lang.toUpperCase()}</span>
                <span className="material-symbols-outlined">
                  {showLanguages ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {showLanguages ? renderLanguageButtons(true) : null}

              <Link className="home-shell__mobile-link" to={accountHref} onClick={() => setIsMenuOpen(false)}>
                <span>{accountLabel}</span>
                <span className="material-symbols-outlined">person</span>
              </Link>

              {isAuthenticated && user?.role ? (
                <Link className="home-shell__mobile-link" to="/admin" onClick={() => setIsMenuOpen(false)}>
                  <span>{copy.admin}</span>
                  <span className="material-symbols-outlined">shield_person</span>
                </Link>
              ) : null}

              {isAuthenticated ? (
                <button type="button" className="home-shell__mobile-link" onClick={handleLogout}>
                  <span>{lang === 'ar' ? 'تسجيل الخروج' : lang === 'fr' ? 'Déconnexion' : 'Logout'}</span>
                  <span className="material-symbols-outlined">logout</span>
                </button>
              ) : null}

              <Link className="home-shell__button" to="/projects" onClick={() => setIsMenuOpen(false)}>
                {copy.donate}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="home-shell__main" role="main">
        {children}
      </main>

      <footer className="home-shell__footer">
        <div className="home-shell__footer-inner">
          <div>
            <strong>{copy.legal}</strong>
            <span> · {copy.rights}</span>
          </div>
          <div className="home-shell__footer-links">
            <Link to="/about">{copy.about}</Link>
            <Link to="/contact">{copy.contact}</Link>
            {isAuthenticated && user?.role ? <Link to="/admin">{copy.admin}</Link> : null}
          </div>
        </div>
      </footer>
    </div>
  );
}
