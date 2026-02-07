import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ============================================
// ADMIN LAYOUT - Admin Pages Layout
// ============================================

const AdminLayout = () => {
  const { t, user, logout, isDarkMode, toggleDarkMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const prevPathnameRef = useRef(location.pathname);

  // Handle scroll for header shadow
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close sidebar on route change (mobile) - using flushSync pattern
  useEffect(() => {
    if (location.pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = location.pathname;
      // Only close sidebar when route actually changes
      if (isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    }
  }, [location.pathname, isSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Sidebar navigation items
  const sidebarItems = [
    { path: '/admin', label: t('home') || 'Dashboard', icon: 'dashboard', exact: true },
    { path: '/admin/projects', label: 'Projects', icon: 'folder_special' },
    { path: '/admin/donations', label: 'Donations', icon: 'payments' },
    { path: '/admin/donors', label: 'Donors', icon: 'people' },
    { path: '/admin/verification', label: 'Verification', icon: 'verified' },
    { path: '/admin/settings', label: 'Settings', icon: 'settings' },
  ];

  // Bottom navigation items (mobile)
  const bottomNavItems = [
    { path: '/admin', label: t('home') || 'Home', icon: 'dashboard' },
    { path: '/admin/projects', label: 'Projects', icon: 'folder_special' },
    { path: '/admin/donations', label: 'Donations', icon: 'payments' },
    { path: '/admin/settings', label: 'More', icon: 'more_horiz' },
  ];

  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex">
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full w-64 bg-white dark:bg-bg-dark-card border-r border-border-light dark:border-white/10 z-40 transition-all duration-300`}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-border-light dark:border-white/10">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-primary">
              <span className="material-symbols-outlined text-white">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="font-bold text-text-primary dark:text-white">Admin</h1>
              <p className="text-xs text-text-muted">Association Espoir</p>
            </div>
          </Link>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item)
                  ? 'bg-primary text-white shadow-primary'
                  : 'text-text-secondary hover:text-primary hover:bg-primary/5'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive(item) ? 'filled' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border-light dark:border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg-teal-wash dark:bg-bg-dark">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary dark:text-white text-sm truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-text-muted truncate">{user?.email || 'admin@espoir.ma'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 mt-2 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-white dark:bg-bg-dark-card border-r border-border-light dark:border-white/10 z-50 lg:hidden transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Sidebar Header */}
        <div className="p-4 border-b border-border-light dark:border-white/10 flex items-center justify-between">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-primary">
              <span className="material-symbols-outlined text-white">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="font-bold text-text-primary dark:text-white">Admin</h1>
              <p className="text-xs text-text-muted">Association Espoir</p>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary/5"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Mobile Sidebar Navigation */}
        <nav className="p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item)
                  ? 'bg-primary text-white shadow-primary'
                  : 'text-text-secondary hover:text-primary hover:bg-primary/5'
              }`}
            >
              <span className={`material-symbols-outlined ${isActive(item) ? 'filled' : ''}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-light dark:border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error/5 transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <header
          className={`sticky top-0 z-30 bg-white/95 dark:bg-bg-dark-card/95 backdrop-blur-md border-b border-border-light dark:border-white/10 transition-shadow duration-300 ${
            isScrolled ? 'shadow-sm' : ''
          }`}
        >
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            {/* Left: Menu Button + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
              >
                <span className="material-symbols-outlined text-2xl">menu</span>
              </button>
              <h2 className="font-semibold text-text-primary dark:text-white">
                {sidebarItems.find(item => isActive(item))?.label || 'Dashboard'}
              </h2>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors"
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                <span className="material-symbols-outlined">
                  {isDarkMode ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              {/* Notifications */}
              <button className="relative p-2 rounded-xl text-text-secondary hover:text-primary hover:bg-primary/5 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full"></span>
              </button>

              {/* User Avatar (Mobile) */}
              <div className="lg:hidden w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-bg-dark-card/95 backdrop-blur-lg border-t border-border-light dark:border-white/10 safe-area-pb">
          <div className="flex items-center justify-around h-16">
            {bottomNavItems.map((item, index) => {
              const active = isActive(item);
              const isMiddle = index === 1;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full ${
                    active ? 'text-primary' : 'text-text-muted'
                  }`}
                >
                  {isMiddle ? (
                    <div className="w-12 h-12 -mt-6 rounded-full bg-primary text-white flex items-center justify-center shadow-primary">
                      <span className={`material-symbols-outlined ${active ? 'filled' : ''}`}>
                        {item.icon}
                      </span>
                    </div>
                  ) : (
                    <span className={`material-symbols-outlined text-xl ${active ? 'filled' : ''}`}>
                      {item.icon}
                    </span>
                  )}
                  {!isMiddle && (
                    <span className="text-[10px] font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
};

export default AdminLayout;
