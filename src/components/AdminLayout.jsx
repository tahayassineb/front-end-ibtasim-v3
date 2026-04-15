import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ============================================
// ADMIN LAYOUT - Admin Pages Layout
// ============================================

const AdminLayout = () => {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const prevPathnameRef = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPathnameRef.current) {
      prevPathnameRef.current = location.pathname;
      if (isSidebarOpen) setIsSidebarOpen(false);
    }
  }, [location.pathname, isSidebarOpen]);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Sidebar sections & items
  const sidebarSections = [
    {
      label: 'الرئيسية',
      items: [
        { path: '/admin', label: 'لوحة التحكم', icon: '📊', exact: true },
      ],
    },
    {
      label: 'المحتوى',
      items: [
        { path: '/admin/projects', label: 'المشاريع', icon: '📁' },
        { path: '/admin/kafala', label: 'الكفالة', icon: '🤲' },
      ],
    },
    {
      label: 'المالية',
      items: [
        { path: '/admin/donations', label: 'التبرعات', icon: '💰' },
        { path: '/admin/verification', label: 'التحقق', icon: '✅' },
        { path: '/admin/kafala/verifications', label: 'تجديدات الكفالة', icon: '🔄' },
      ],
    },
    {
      label: 'المستخدمون',
      items: [
        { path: '/admin/donors', label: 'المتبرعون', icon: '👥' },
      ],
    },
    {
      label: 'النظام',
      items: [
        { path: '/admin/settings', label: 'الإعدادات', icon: '⚙️' },
        { path: '/admin/error-logs', label: 'سجل الأخطاء', icon: '🔴' },
      ],
    },
  ];

  // All items flat (for page title lookup)
  const allItems = sidebarSections.flatMap((s) => s.items);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path || location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(item.path);
  };

  const currentPageLabel = allItems.find((item) => isActive(item))?.label || 'لوحة التحكم';

  // Bottom nav items (mobile)
  const bottomNavItems = [
    { path: '/admin', label: 'الرئيسية', icon: '📊', exact: true },
    { path: '/admin/projects', label: 'المشاريع', icon: '📁' },
    { path: '/admin/donations', label: 'التبرعات', icon: '💰' },
    { path: '/admin/settings', label: 'المزيد', icon: '⚙️' },
  ];

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{ padding: '20px 18px', borderBottom: '1px solid #E5E9EB' }}>
        <Link to="/admin" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
          <div style={{ width: 38, height: 38, background: '#0d7477', borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 16, marginLeft: 8, flexShrink: 0 }}>ا</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0e1a1b' }}>ابتسام</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>لوحة الإدارة</div>
          </div>
        </Link>
      </div>

      {/* Navigation Sections */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 8 }}>
        {sidebarSections.map((section) => (
          <div key={section.label}>
            <div style={{ padding: '16px 12px 4px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
              {section.label}
            </div>
            {section.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 10,
                    margin: '2px 8px',
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    color: active ? 'white' : '#64748b',
                    background: active ? '#0d7477' : 'transparent',
                    boxShadow: active ? '0 4px 14px rgba(13,116,119,0.25)' : 'none',
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #E5E9EB' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10 }}>
          <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>👤</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0e1a1b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'المدير'}</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>admin</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#f6f8f8', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }} dir="rtl">
      {/* Desktop Sidebar — fixed right */}
      <aside
        className="hidden lg:block"
        style={{ width: 240, background: 'white', borderLeft: '1px solid #E5E9EB', position: 'fixed', right: 0, top: 0, height: '100vh', zIndex: 40, overflowY: 'auto' }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer — slides from right */}
      <aside
        className="lg:hidden"
        style={{
          width: 280,
          background: 'white',
          borderLeft: '1px solid #E5E9EB',
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          zIndex: 50,
          overflowY: 'auto',
          transform: isSidebarOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 16px', borderBottom: '1px solid #E5E9EB' }}>
          <button onClick={() => setIsSidebarOpen(false)} style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main Content Area — margin on right for sidebar */}
      <div className="lg:mr-[240px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header
          className="sticky top-0 z-30 bg-white"
          style={{ height: 56, borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}
        >
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden"
            style={{ padding: 6, borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}
          >
            <span className="material-symbols-outlined">menu</span>
          </button>

          {/* Page Title */}
          <div style={{ fontSize: 18, fontWeight: 800, flex: 1, color: '#0e1a1b' }}>{currentPageLabel}</div>

          {/* Search (desktop) */}
          <input
            className="hidden md:block"
            placeholder="بحث في النظام..."
            style={{ height: 36, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 10, fontSize: 13, fontFamily: 'Tajawal, sans-serif', outline: 'none', width: 240, background: '#f6f8f8', color: '#0e1a1b' }}
          />

          {/* New Project Button (desktop) */}
          <Link
            to="/admin/projects/new"
            className="hidden md:flex"
            style={{ height: 36, padding: '0 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: '#0d7477', color: 'white', textDecoration: 'none', alignItems: 'center', boxShadow: '0 4px 14px rgba(13,116,119,0.25)', whiteSpace: 'nowrap' }}
          >
            + مشروع جديد
          </Link>

          {/* Notification Bell */}
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            🔔
            <div style={{ width: 8, height: 8, background: '#ef4444', borderRadius: '50%', position: 'absolute', top: 6, left: 6, border: '2px solid white' }} />
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 pb-20 lg:pb-8" style={{ padding: 24 }}>
          <Outlet />
        </div>

        {/* Mobile Bottom Navigation */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white"
          style={{ borderTop: '1px solid #E5E9EB', height: 64 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
            {bottomNavItems.map((item, index) => {
              const active = item.exact
                ? location.pathname === item.path || location.pathname === '/admin/dashboard'
                : location.pathname.startsWith(item.path);
              const isMiddle = index === 1;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textDecoration: 'none', color: active ? '#0d7477' : '#94a3b8' }}
                >
                  {isMiddle ? (
                    <div style={{ width: 48, height: 48, marginTop: -24, borderRadius: '50%', background: '#0d7477', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, boxShadow: '0 4px 14px rgba(13,116,119,0.25)' }}>
                      {item.icon}
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: 20 }}>{item.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 500, marginTop: 2 }}>{item.label}</span>
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
};

export default AdminLayout;
