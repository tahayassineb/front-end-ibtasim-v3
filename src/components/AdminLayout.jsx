import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { canAccessPath, roleLabels } from '../lib/adminPermissions';

const sections = [
  { label: 'الرئيسية', items: [{ path: '/admin', label: 'لوحة التحكم', icon: 'dashboard', exact: true }] },
  {
    label: 'المحتوى',
    items: [
      { path: '/admin/projects', label: 'المشاريع', icon: 'folder_open' },
      { path: '/admin/kafala', label: 'الكفالة', icon: 'diversity_1' },
      { path: '/admin/stories', label: 'القصص', icon: 'auto_stories' },
    ],
  },
  {
    label: 'المالية',
    items: [
      { path: '/admin/donations', label: 'التبرعات', icon: 'payments' },
      { path: '/admin/verification', label: 'التحقق', icon: 'verified' },
      { path: '/admin/kafala/verifications', label: 'تجديدات الكفالة', icon: 'published_with_changes' },
      { path: '/admin/receipts', label: 'الوصولات', icon: 'receipt_long' },
    ],
  },
  {
    label: 'العلاقات',
    items: [
      { path: '/admin/donors', label: 'المتبرعون', icon: 'groups' },
      { path: '/admin/contacts', label: 'رسائل التواصل', icon: 'mail' },
    ],
  },
  {
    label: 'النظام',
    items: [
      { path: '/admin/settings', label: 'الإعدادات', icon: 'settings' },
      { path: '/admin/activity', label: 'سجل النشاط', icon: 'manage_history' },
      { path: '/admin/team-performance', label: 'أداء الفريق', icon: 'monitoring' },
      { path: '/admin/error-logs', label: 'سجل الأخطاء', icon: 'report' },
    ],
  },
];

function SidebarContent({ user, onLogout, onNavigate, isActive }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Link to="/admin" onClick={onNavigate} style={{ padding: 20, borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#0e1a1b' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: '#0d7477', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>ا</div>
        <div>
          <div style={{ fontWeight: 900 }}>ابتسام</div>
          <div style={{ fontSize: 11, color: '#94a3b8' }}>لوحة الإدارة</div>
        </div>
      </Link>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
        {sections.map((section) => {
          const visibleItems = section.items.filter((item) => canAccessPath(user?.role, item.path));
          if (visibleItems.length === 0) return null;
          return (
            <div key={section.label}>
              <div style={{ padding: '14px 14px 5px', fontSize: 10, color: '#94a3b8', fontWeight: 900 }}>{section.label}</div>
              {visibleItems.map((item) => {
                const active = isActive(item);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    style={{ margin: '3px 8px', padding: '10px 12px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', fontSize: 14, fontWeight: active ? 800 : 600, background: active ? '#0d7477' : 'transparent', color: active ? 'white' : '#64748b' }}
                  >
                    <span className="material-symbols-outlined no-flip" style={{ fontSize: 20 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid #E5E9EB', padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{user?.name || 'المدير'}</div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{roleLabels[user?.role] || 'مالك'}</div>
        <button type="button" onClick={onLogout} style={{ width: '100%', height: 36, borderRadius: 10, border: 'none', background: '#FEE2E2', color: '#dc2626', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>تسجيل الخروج</button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path || location.pathname === '/admin/dashboard';
    return location.pathname.startsWith(item.path);
  };

  const current = sections.flatMap((section) => section.items).find(isActive)?.label || 'لوحة التحكم';

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f6f8f8', fontFamily: 'var(--font-arabic)', color: '#0e1a1b' }} dir="rtl">
      <aside className="hidden lg:block" style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 248, background: 'white', borderLeft: '1px solid #E5E9EB', zIndex: 40 }}>
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setOpen(false)} isActive={isActive} />
      </aside>

      {open && <div className="fixed inset-0 lg:hidden" style={{ background: 'rgba(0,0,0,.45)', zIndex: 45 }} onClick={() => setOpen(false)} />}
      <aside className="lg:hidden" style={{ position: 'fixed', top: 0, bottom: 0, right: open ? 0 : -285, width: 280, background: 'white', zIndex: 50, transition: 'right .2s', boxShadow: open ? '-10px 0 30px rgba(0,0,0,.16)' : 'none' }}>
        <SidebarContent user={user} onLogout={handleLogout} onNavigate={() => setOpen(false)} isActive={isActive} />
      </aside>

      <main style={{ marginRight: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 248 : 0, minHeight: '100vh' }}>
        <header style={{ height: 64, background: 'white', borderBottom: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'sticky', top: 0, zIndex: 30 }}>
          <button type="button" className="lg:hidden" onClick={() => setOpen(true)} style={{ width: 38, height: 38, borderRadius: 10, border: '1px solid #E5E9EB', background: 'white', cursor: 'pointer' }}>
            <span className="material-symbols-outlined no-flip">menu</span>
          </button>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{current}</h1>
          <Link to="/" style={{ color: '#0d7477', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>عرض الموقع</Link>
        </header>
        <Outlet />
      </main>
    </div>
  );
}

