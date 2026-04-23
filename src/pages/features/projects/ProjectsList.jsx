import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import { formatMAD } from '../../../lib/money';

const getText = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.ar || value.fr || value.en || '';
};

const categoryMeta = {
  education: { icon: '🎓', label: 'التعليم' },
  water: { icon: '💧', label: 'المياه' },
  health: { icon: '❤️', label: 'الصحة' },
  food: { icon: '🍞', label: 'الغذاء' },
  housing: { icon: '🏠', label: 'السكن' },
  emergency: { icon: '⚡', label: 'الطوارئ' },
  orphan_care: { icon: '🤲', label: 'رعاية الأيتام' },
};

export default function ProjectsList() {
  const { currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const projectsData = useQuery(api.projects.getProjects, { status: 'active', limit: 100 });

  const projects = useMemo(() => (projectsData || []).map((project) => ({
    ...project,
    titleText: getText(project.title, lang),
    descriptionText: getText(project.description, lang),
    imageUrl: convexFileUrl(project.mainImage) || project.mainImage,
  })), [projectsData, lang]);

  const filtered = projects.filter((project) => {
    if (category !== 'all' && project.category !== category) return false;
    if (!search.trim()) return true;
    return project.titleText.toLowerCase().includes(search.toLowerCase());
  });

  if (projectsData === undefined) {
    return <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-arabic)', color: '#94a3b8' }}>جاري تحميل المشاريع...</div>;
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'Inter, sans-serif', background: '#f6f8f8', minHeight: '100vh', color: '#0e1a1b', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0A5F62,#0d7477)', padding: '52px 24px', color: 'white' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '.16em', fontWeight: 900, color: '#8ee4e4' }}>PROJECTS</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '10px 0' }}>مشاريعنا الخيرية</h1>
          <p style={{ maxWidth: 560, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>هذه الصفحة تعرض المشاريع فقط. الكفالات تجدها في صفحة الكفالة.</p>
        </div>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid #E5E9EB' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن مشروع..." style={{ flex: 1, minWidth: 220, height: 40, border: '1.5px solid #E5E9EB', borderRadius: 10, padding: '0 14px', fontFamily: 'inherit' }} />
          {['all', ...Object.keys(categoryMeta)].map((key) => (
            <button key={key} type="button" onClick={() => setCategory(key)} style={{ height: 36, padding: '0 14px', borderRadius: 99, border: `1.5px solid ${category === key ? '#0d7477' : '#E5E9EB'}`, background: category === key ? '#0d7477' : 'white', color: category === key ? 'white' : '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800 }}>
              {key === 'all' ? 'الكل' : `${categoryMeta[key].icon} ${categoryMeta[key].label}`}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>لا توجد مشاريع مطابقة</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {filtered.map((project) => {
              const meta = categoryMeta[project.category] || { icon: '🤝', label: 'خيري' };
              const pct = project.goalAmount ? Math.min(Math.round((project.raisedAmount || 0) / project.goalAmount * 100), 100) : 0;
              return (
                <article key={project._id} onClick={() => navigate(`/projects/${project._id}`)} style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
                  <div style={{ height: 180, background: '#E6F4F4', position: 'relative' }}>
                    {project.imageUrl && <img src={project.imageUrl} alt={project.titleText} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    <span style={{ position: 'absolute', right: 12, bottom: 12, background: 'rgba(255,255,255,.92)', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}>{meta.icon} {meta.label}</span>
                  </div>
                  <div style={{ padding: 18 }}>
                    <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 900 }}>{project.titleText}</h3>
                    <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 13, lineHeight: 1.7, height: 44, overflow: 'hidden' }}>{project.descriptionText}</p>
                    <div style={{ height: 8, background: '#E5E9EB', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}><div style={{ width: `${pct}%`, height: '100%', background: '#0d7477' }} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12 }}>
                      <strong style={{ color: '#0A5F62' }}>{formatMAD(project.raisedAmount || 0, lang)}</strong>
                      <span>{pct}%</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
