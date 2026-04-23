import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';
import { formatMAD } from '../../../../lib/money';

const BORDER = '#E5E9EB';
const PRIMARY = '#0d7477';
const TEXT = '#0e1a1b';
const MUTED = '#64748b';
const SHADOW = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';

const statusMeta = {
  active: { label: 'نشط', color: '#16a34a', bg: '#D1FAE5' },
  draft: { label: 'مسودة', color: MUTED, bg: '#F0F7F7' },
  funded: { label: 'ممول', color: PRIMARY, bg: '#E6F4F4' },
  completed: { label: 'مكتمل', color: '#16a34a', bg: '#D1FAE5' },
  cancelled: { label: 'ملغى', color: '#dc2626', bg: '#FEE2E2' },
};

const getText = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.ar || value.fr || value.en || '';
};

export default function AdminProjects() {
  const { currentLanguage, showToast } = useApp();
  const navigate = useNavigate();
  const lang = currentLanguage?.code || 'ar';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const data = useQuery(api.projects.getProjects, { limit: 200 });
  const deleteProject = useMutation(api.projects.deleteProject);
  const updateProject = useMutation(api.projects.updateProject);

  const projects = useMemo(() => (data || []).map((project) => ({
    ...project,
    titleText: getText(project.title, lang),
    descriptionText: getText(project.description, lang),
    imageUrl: convexFileUrl(project.mainImage) || project.mainImage,
  })), [data, lang]);

  const filtered = projects.filter((project) => {
    if (status !== 'all' && project.status !== status) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return project.titleText.toLowerCase().includes(q) || project.category.toLowerCase().includes(q);
  });

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    collected: projects.reduce((sum, p) => sum + (p.raisedAmount || 0), 0),
    featured: projects.filter((p) => p.isFeatured).length,
  };

  const toggleFeatured = async (project) => {
    try {
      await updateProject({ projectId: project._id, updates: { isFeatured: !project.isFeatured } });
      showToast?.(!project.isFeatured ? 'تم إظهار المشروع في الرئيسية' : 'تم إخفاء المشروع من الرئيسية', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل التحديث', 'error');
    }
  };

  const publishProject = async (projectId) => {
    try {
      await updateProject({ projectId, updates: { status: 'active' } });
      showToast?.('تم نشر المشروع', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل النشر', 'error');
    }
  };

  const removeProject = async (projectId) => {
    if (deleteConfirm !== projectId) {
      setDeleteConfirm(projectId);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    try {
      await deleteProject({ projectId });
      setDeleteConfirm(null);
      showToast?.('تم حذف المشروع', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل الحذف', 'error');
    }
  };

  if (data === undefined) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontFamily: 'var(--font-arabic)' }}>جاري تحميل المشاريع...</div>;
  }

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: TEXT, padding: 24 }} dir="rtl">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'إجمالي المشاريع', value: stats.total },
          { label: 'مشاريع نشطة', value: stats.active },
          { label: 'محصل من المشاريع', value: formatMAD(stats.collected, lang) },
          { label: 'ظاهرة في الرئيسية', value: stats.featured },
        ].map((card) => (
          <div key={card.label} style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 18 }}>
            <div style={{ fontSize: 26, fontWeight: 900, color: PRIMARY, fontFamily: 'Inter, sans-serif' }}>{card.value}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, padding: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن مشروع..." style={{ flex: 1, minWidth: 220, height: 38, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: '0 14px', fontFamily: 'var(--font-arabic)' }} />
        {['all', 'active', 'draft', 'funded', 'completed'].map((key) => (
          <button key={key} type="button" onClick={() => setStatus(key)} style={{ height: 34, padding: '0 14px', borderRadius: 99, border: `1.5px solid ${status === key ? PRIMARY : BORDER}`, background: status === key ? PRIMARY : 'white', color: status === key ? 'white' : MUTED, cursor: 'pointer', fontFamily: 'var(--font-arabic)', fontWeight: 800 }}>
            {key === 'all' ? 'الكل' : statusMeta[key]?.label}
          </button>
        ))}
        <Link to="/admin/projects/new" style={{ height: 38, padding: '0 18px', borderRadius: 10, background: PRIMARY, color: 'white', display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 800 }}>+ إضافة مشروع</Link>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 50, textAlign: 'center', color: '#94a3b8' }}>لا توجد مشاريع مطابقة</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {filtered.map((project) => {
            const pct = project.goalAmount ? Math.min(Math.round((project.raisedAmount || 0) / project.goalAmount * 100), 100) : 0;
            const st = statusMeta[project.status] || statusMeta.draft;
            return (
              <div key={project._id} style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden' }}>
                <div style={{ height: 156, background: '#E6F4F4', position: 'relative' }}>
                  {project.imageUrl && <img src={project.imageUrl} alt={project.titleText} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <span style={{ position: 'absolute', top: 10, right: 10, borderRadius: 99, padding: '4px 10px', background: st.bg, color: st.color, fontSize: 11, fontWeight: 900 }}>{st.label}</span>
                  <button type="button" onClick={() => toggleFeatured(project)} style={{ position: 'absolute', top: 10, left: 10, height: 30, borderRadius: 99, border: 'none', padding: '0 10px', background: project.isFeatured ? '#FEF3C7' : 'rgba(255,255,255,.92)', color: project.isFeatured ? '#92400e' : MUTED, cursor: 'pointer', fontWeight: 900 }}>
                    {project.isFeatured ? '★ الرئيسية' : '☆ الرئيسية'}
                  </button>
                </div>
                <div style={{ padding: 16 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 900, lineHeight: 1.4 }}>{project.titleText || 'بدون عنوان'}</h3>
                  <p style={{ margin: '0 0 14px', color: MUTED, fontSize: 13, lineHeight: 1.6, height: 42, overflow: 'hidden' }}>{project.descriptionText}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: MUTED, marginBottom: 6 }}>
                    <strong style={{ color: PRIMARY }}>{formatMAD(project.raisedAmount || 0, lang)}</strong>
                    <span>{pct}%</span>
                  </div>
                  <div style={{ height: 8, background: '#E5E9EB', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: PRIMARY, borderRadius: 99 }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <button type="button" onClick={() => navigate(`/admin/projects/${project._id}/edit`)} style={{ height: 34, border: 'none', borderRadius: 9, background: '#E6F4F4', color: PRIMARY, fontWeight: 800, cursor: 'pointer' }}>تعديل</button>
                    <button type="button" onClick={() => navigate(`/admin/projects/${project._id}`)} style={{ height: 34, border: `1px solid ${BORDER}`, borderRadius: 9, background: 'white', color: MUTED, fontWeight: 800, cursor: 'pointer' }}>عرض</button>
                    {project.status === 'draft' ? (
                      <button type="button" onClick={() => publishProject(project._id)} style={{ height: 34, border: 'none', borderRadius: 9, background: '#D1FAE5', color: '#16a34a', fontWeight: 800, cursor: 'pointer' }}>نشر</button>
                    ) : (
                      <button type="button" onClick={() => removeProject(project._id)} style={{ height: 34, border: 'none', borderRadius: 9, background: deleteConfirm === project._id ? '#dc2626' : '#FEE2E2', color: deleteConfirm === project._id ? 'white' : '#dc2626', fontWeight: 800, cursor: 'pointer' }}>{deleteConfirm === project._id ? 'تأكيد' : 'حذف'}</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
