import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ============================================
// MOBILE BOTTOM NAVIGATION - Public Pages
// ============================================

const MobileBottomNav = () => {
  const { t, isAuthenticated } = useApp();
  const location = useLocation();

  const navItems = [
    { path: '/', label: t('home'), icon: 'home', filledIcon: 'home' },
    { path: '/projects', label: t('projects'), icon: 'volunteer_activism', filledIcon: 'volunteer_activism' },
    { 
      path: '/projects', 
      label: t('donate'), 
      icon: 'favorite',
      isCenter: true 
    },
    { path: '/stories', label: 'Updates', icon: 'newspaper', filledIcon: 'newspaper' },
    { path: '/more', label: 'More', icon: 'menu', filledIcon: 'menu' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-bg-dark-card/95 backdrop-blur-lg border-t border-border-light dark:border-white/10 safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-mobile mx-auto">
        {navItems.map((item, index) => {
          const active = isActive(item.path);
          const isCenter = item.isCenter;
          
          if (isCenter) {
            // Center "Donate" button - elevated style
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -mt-6"
              >
                <div className="w-14 h-14 rounded-full bg-primary text-white flex flex-col items-center justify-center shadow-primary hover:shadow-lg hover:scale-105 transition-all duration-300">
                  <span className="material-symbols-outlined text-2xl filled">
                    {item.icon}
                  </span>
                </div>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-primary whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${
                active ? 'text-primary' : 'text-text-muted'
              }`}
            >
              <span className={`material-symbols-outlined text-xl ${active ? 'filled' : ''}`}>
                {active && item.filledIcon ? item.filledIcon : item.icon}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

// ============================================
// ALTERNATIVE: More Menu Sheet
// ============================================

export const MobileMoreMenu = ({ isOpen, onClose }) => {
  const { t, isAuthenticated, user, logout } = useApp();

  const menuItems = [
    { path: '/about', label: t('about'), icon: 'info' },
    { path: '/contact', label: t('contact'), icon: 'mail' },
    { path: '/impact', label: 'Impact Stories', icon: 'auto_stories' },
  ];

  const accountItems = isAuthenticated
    ? [
        { path: '/profile', label: t('profile'), icon: 'person' },
        { action: logout, label: t('logout'), icon: 'logout', danger: true },
      ]
    : [
        { path: '/login', label: t('login'), icon: 'login' },
        { path: '/register', label: t('register'), icon: 'person_add' },
      ];

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-bg-dark-card rounded-t-2xl max-h-[80vh] overflow-auto animate-slide-up md:hidden">
        {/* Handle */}
        <div className="sticky top-0 bg-white dark:bg-bg-dark-card pt-3 pb-2 px-4 border-b border-border-light dark:border-white/10">
          <div className="w-12 h-1.5 bg-border-default rounded-full mx-auto" />
        </div>

        {/* User Info (if authenticated) */}
        {isAuthenticated && (
          <div className="px-4 py-4 border-b border-border-light dark:border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">person</span>
              </div>
              <div>
                <p className="font-semibold text-text-primary dark:text-white">{user?.name || 'User'}</p>
                <p className="text-sm text-text-muted">{user?.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="p-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-text-primary dark:text-white hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-text-muted">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Account Section */}
          <div className="mt-4 pt-4 border-t border-border-light dark:border-white/10">
            <p className="px-4 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Account
            </p>
            <div className="space-y-1">
              {accountItems.map((item) =>
                item.action ? (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action();
                      onClose();
                    }}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${
                      item.danger
                        ? 'text-error hover:bg-error/5'
                        : 'text-text-primary dark:text-white hover:bg-primary/5'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      item.danger
                        ? 'text-error hover:bg-error/5'
                        : 'text-text-primary dark:text-white hover:bg-primary/5'
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-border-light dark:border-white/10">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-bg-teal-wash dark:bg-bg-dark text-text-primary dark:text-white font-medium hover:bg-primary/10 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileBottomNav;
