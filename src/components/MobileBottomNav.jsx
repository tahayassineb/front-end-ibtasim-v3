import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const labels = {
  ar: { stories: 'القصص', more: 'المزيد', account: 'الحساب', close: 'إغلاق' },
  fr: { stories: 'Histoires', more: 'Plus', account: 'Compte', close: 'Fermer' },
  en: { stories: 'Stories', more: 'More', account: 'Account', close: 'Close' },
};

export default function MobileBottomNav() {
  const { t, currentLanguage } = useApp();
  const location = useLocation();
  const lang = currentLanguage?.code || 'ar';
  const local = labels[lang] || labels.ar;
  const items = [
    { path: '/', label: t('home'), icon: 'home' },
    { path: '/projects', label: t('projects'), icon: 'volunteer_activism' },
    { path: '/kafala', label: 'Kafala', icon: 'diversity_1' },
    { path: '/stories', label: local.stories, icon: 'newspaper' },
    { path: '/contact', label: local.more, icon: 'menu' },
  ];

  const active = (path) => (path === '/' ? location.pathname === '/' : location.pathname.startsWith(path));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-border-light safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-mobile mx-auto">
        {items.map((item) => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${active(item.path) ? 'text-primary' : 'text-text-muted'}`}>
            <span className={`material-symbols-outlined text-xl ${active(item.path) ? 'filled' : ''}`}>{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export const MobileMoreMenu = ({ isOpen, onClose }) => {
  const { t, isAuthenticated, user, logout, currentLanguage, changeLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const local = labels[lang] || labels.ar;
  const menuItems = [
    { path: '/about', label: t('about'), icon: 'info' },
    { path: '/contact', label: t('contact'), icon: 'mail' },
  ];
  const accountItems = isAuthenticated
    ? [{ path: '/profile', label: t('profile'), icon: 'person' }, { action: logout, label: t('logout'), icon: 'logout', danger: true }]
    : [{ path: '/login', label: t('login'), icon: 'login' }, { path: '/register', label: t('register'), icon: 'person_add' }];

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 md:hidden" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl max-h-[80vh] overflow-auto md:hidden">
        {isAuthenticated && (
          <div className="px-4 py-4 border-b border-border-light">
            <p className="font-semibold text-text-primary">{user?.name || 'User'}</p>
            <p className="text-sm text-text-muted">{user?.email}</p>
          </div>
        )}
        <div className="p-2">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-primary/5">
              <span className="material-symbols-outlined text-text-muted">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
          <div className="mt-3 pt-3 border-t border-border-light">
            <div className="px-4 text-xs font-semibold text-text-muted uppercase mb-2">Language</div>
            {['ar', 'fr', 'en'].map((code) => (
              <button key={code} type="button" onClick={() => changeLanguage(code)} className={`w-full text-left px-4 py-2 rounded-xl ${lang === code ? 'bg-primary/10 text-primary' : 'text-text-primary'}`}>
                {code === 'ar' ? 'العربية' : code === 'fr' ? 'Français' : 'English'}
              </button>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border-light">
            <div className="px-4 text-xs font-semibold text-text-muted uppercase mb-2">{local.account}</div>
            {accountItems.map((item) => item.action ? (
              <button key={item.label} onClick={() => { item.action(); onClose(); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-error hover:bg-error/5">
                <span className="material-symbols-outlined">{item.icon}</span><span>{item.label}</span>
              </button>
            ) : (
              <Link key={item.path} to={item.path} onClick={onClose} className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary hover:bg-primary/5">
                <span className="material-symbols-outlined">{item.icon}</span><span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-border-light">
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-bg-teal-wash text-text-primary font-medium">{local.close}</button>
        </div>
      </div>
    </>
  );
};
