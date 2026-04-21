import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';

// ============================================
// ADMIN PROJECTS — Table layout with filter bar
// ============================================

const getStr = (val, lang = 'ar') => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val[lang] || val.ar || val.en || val.fr || '';
};

const STATUS_CFG = {
  active:    { label: '● نشط',    cls: { background: '#D1FAE5', color: '#16a34a' } },
  draft:     { label: '○ مسودة',   cls: { background: '#F0F7F7', color: '#94a3b8' } },
  completed: { label: '✓ منتهي',  cls: { background: '#FEE2E2', color: '#dc2626' } },
  paused:    { label: '⏸ موقوف',  cls: { background: '#FFFBEB', color: '#92400e' } },
};

const ICONS = ['🎓', '💧', '🏥', '🌱', '📚', '🤝', '🕌', '⚡'];

export default function AdminProjects() {
  const { currentLanguage, showToast } = useApp();
  const navigate = useNavigate();
  const lang = currentLanguage?.code || 'ar';

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirmId, setDeleteId]  = useState(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const PER_PAGE = 8;

  // ── Convex ────────────────────────────────────────────────────────────────────
  const convexProjects     = useQuery(api.projects.getProjects, {});
  const deleteProject      = useMutation(api.projects.deleteProject);
  const updateProject      = useMutation(api.projects.updateProject);

  // ── Derived ───────────────────────────────────────────────────────────────────
  const projects = (convexProjects ?? []).map((p, i) => ({
    _id:      p._id,
    title:    getStr(p.title, lang),
    category: getStr(p.category, lang),
    status:   p.status || 'draft',
    featured: p.isFeatured,
    goal:     p.goalAmount || 0,
    raised:   p.raisedAmount || 0,
    icon:     ICONS[i % ICONS.length],
    image:    convexFileUrl(p.mainImage) || p.mainImage,
  }));

  const counts = {
    all:       projects.length,
    active:    projects.filter(p => p.status === 'active').length,
    draft:     projects.filter(p => p.status === 'draft').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                        p.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const page = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (deleteConfirmId === id) {
      try {
        await deleteProject({ projectId: id });
        setDeleteId(null);
        showToast('تم حذف المشروع', 'success');
      } catch { showToast('فشل الحذف', 'error'); }
    } else {
      setDeleteId(id);
      setTimeout(() => setDeleteId(null), 3000);
    }
  };

  const handlePublish = async (id) => {
    try {
      await updateProject({ projectId: id, updates: { status: 'active' } });
      showToast('تم نشر المشروع', 'success');
    } catch { showToast('فشل النشر', 'error'); }
  };

  const handleToggleFeatured = async (id, current) => {
    try {
      await updateProject({ projectId: id, updates: { isFeatured: !current } });
      showToast(!current ? 'تم تمييز المشروع' : 'تم إزالة التمييز', 'success');
    } catch { showToast('فشل التحديث', 'error'); }
  };

  if (convexProjects === undefined) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80, fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📁</div>
          <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* Filter bar */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E9EB', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="ابحث عن مشروع..."
          style={{ flex: 1, minWidth: 200, height: 38, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 10, fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#0d7477'}
          onBlur={e => e.target.style.borderColor = '#E5E9EB'}
        />
        {[
          ['all',       `الكل (${counts.all})`],
          ['active',    `نشط (${counts.active})`],
          ['draft',     `مسودة (${counts.draft})`],
          ['completed', `منتهي (${counts.completed})`],
        ].map(([val, label]) => (
          <button key={val} onClick={() => { setStatusFilter(val); setCurrentPage(1); }}
            style={{ height: 34, padding: '0 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${statusFilter === val ? '#0d7477' : '#E5E9EB'}`, background: statusFilter === val ? '#0d7477' : 'white', color: statusFilter === val ? 'white' : '#64748b', fontFamily: 'Tajawal, sans-serif' }}>
            {label}
          </button>
        ))}
        <Link to="/admin/projects/new"
          style={{ height: 38, padding: '0 18px', background: '#0d7477', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', textDecoration: 'none', display: 'flex', alignItems: 'center', fontFamily: 'Tajawal, sans-serif', marginRight: 'auto' }}>
          + إضافة مشروع
        </Link>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', background: '#F0F7F7', borderBottom: '1px solid #E5E9EB' }}>
          {['المشروع', 'الهدف', 'المحصّل', 'التقدم', 'الحالة', 'إجراءات'].map(h => (
            <div key={h} style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {page.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
            <p>لا توجد مشاريع</p>
          </div>
        ) : page.map((p, i) => {
          const pct = p.goal > 0 ? Math.min(Math.round(p.raised / p.goal * 100), 100) : 0;
          const st = STATUS_CFG[p.status] || STATUS_CFG.draft;
          const isDraft = p.status === 'draft';
          const isCompleted = p.status === 'completed';
          const progressColor = isCompleted ? '#16a34a' : '#0d7477';

          return (
            <div key={p._id}
              style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', borderBottom: i < page.length - 1 ? '1px solid #E5E9EB' : 'none', alignItems: 'center', background: i % 2 === 1 ? '#fafbfc' : 'white', transition: 'background .15s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = '#E6F4F4'}
              onMouseLeave={e => e.currentTarget.style.background = i % 2 === 1 ? '#fafbfc' : 'white'}
            >
              {/* Project */}
              <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: isDraft ? '#E5E9EB' : isCompleted ? 'linear-gradient(135deg,#64748b,#94a3b8)' : 'linear-gradient(135deg,#0A5F62,#33C0C0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                  {p.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{p.title || '—'}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>
                    #{String(p._id).slice(-6).toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Goal */}
              <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                {(p.goal / 100).toLocaleString('fr-MA')} د.م
              </div>

              {/* Raised */}
              <div style={{ padding: '14px 16px', fontSize: 13, fontWeight: 700, color: isCompleted ? '#16a34a' : isDraft ? '#94a3b8' : '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                {isDraft ? '—' : `${(p.raised / 100).toLocaleString('fr-MA')} د.م`}
              </div>

              {/* Progress */}
              <div style={{ padding: '14px 16px' }}>
                {isDraft ? (
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>لم يبدأ</span>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, background: '#E5E9EB', borderRadius: 100 }}>
                      <div style={{ height: '100%', borderRadius: 100, background: progressColor, width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: progressColor, fontFamily: 'Inter, sans-serif', minWidth: 32 }}>{pct}%</span>
                  </div>
                )}
              </div>

              {/* Status */}
              <div style={{ padding: '14px 16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, ...st.cls }}>
                  {st.label}
                </span>
              </div>

              {/* Actions */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {isDraft ? (
                    <button onClick={() => handlePublish(p._id)} title="نشر"
                      style={{ height: 28, width: 28, borderRadius: 8, border: '1px solid #E5E9EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                      ▶
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/admin/projects/${p._id}/edit`)} title="تعديل"
                      style={{ height: 28, width: 28, borderRadius: 8, border: '1px solid #E5E9EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                      ✏️
                    </button>
                  )}
                  <button onClick={() => navigate(`/admin/projects/${p._id}`)} title="عرض"
                    style={{ height: 28, width: 28, borderRadius: 8, border: '1px solid #E5E9EB', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                    👁
                  </button>
                  <button onClick={() => handleDelete(p._id)} title={deleteConfirmId === p._id ? 'تأكيد الحذف' : 'حذف'}
                    style={{ height: 28, width: 28, borderRadius: 8, border: `1px solid ${deleteConfirmId === p._id ? '#ef4444' : '#E5E9EB'}`, background: deleteConfirmId === p._id ? '#ef4444' : 'white', color: deleteConfirmId === p._id ? 'white' : 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                    {deleteConfirmId === p._id ? '✓' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, fontSize: 13, color: '#64748b' }}>
        <span>عرض {Math.min((currentPage - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(currentPage * PER_PAGE, filtered.length)} من {filtered.length} مشروع</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ height: 32, width: 32, border: '1px solid #E5E9EB', borderRadius: 8, background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}>‹</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setCurrentPage(n)}
              style={{ height: 32, width: 32, border: `1px solid ${currentPage === n ? '#0d7477' : '#E5E9EB'}`, borderRadius: 8, background: currentPage === n ? '#0d7477' : 'white', color: currentPage === n ? 'white' : 'inherit', cursor: 'pointer', fontWeight: currentPage === n ? 700 : 400 }}>
              {n}
            </button>
          ))}
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            style={{ height: 32, width: 32, border: '1px solid #E5E9EB', borderRadius: 8, background: 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1 }}>›</button>
        </div>
      </div>
    </div>
  );
}