import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import { formatMAD } from '../../../lib/money';
import { mergeContent, parseSiteContent, SITE_CONTENT_KEY } from '../../../lib/siteContent';

const getText = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.ar || value.fr || value.en || '';
};

const COPY = {
  ar: { eyebrow: 'المشاريع', title: 'مشاريعنا الخيرية', subtitle: 'تعرّف على المشاريع التي تحتاج إلى دعمك. الكفالات متاحة في صفحة الكفالة.', search: 'ابحث عن مشروع...', all: 'الكل', empty: 'لا توجد مشاريع مطابقة', donate: 'تبرع الآن', loading: 'جاري تحميل المشاريع...' },
  fr: { eyebrow: 'PROJETS', title: 'Nos projets solidaires', subtitle: 'Découvrez les projets qui ont besoin de votre soutien. Les parrainages sont disponibles sur la page Kafala.', search: 'Rechercher un projet...', all: 'Tous', empty: 'Aucun projet correspondant', donate: 'Faire un don', loading: 'Chargement des projets...' },
  en: { eyebrow: 'PROJECTS', title: 'Our charitable projects', subtitle: 'Discover the projects that need your support. Sponsorships are available on the Kafala page.', search: 'Search for a project...', all: 'All', empty: 'No matching projects', donate: 'Donate now', loading: 'Loading projects...' },
};

const DEFAULT_CATEGORIES = [
  ['education', { ar: 'التعليم', fr: 'Éducation', en: 'Education' }, { type: 'material', value: 'school' }],
  ['water', { ar: 'المياه', fr: 'Eau', en: 'Water' }, { type: 'material', value: 'water_drop' }],
  ['health', { ar: 'الصحة', fr: 'Santé', en: 'Health' }, { type: 'material', value: 'health_and_safety' }],
  ['food', { ar: 'الغذاء', fr: 'Alimentation', en: 'Food' }, { type: 'material', value: 'restaurant' }],
  ['housing', { ar: 'السكن', fr: 'Logement', en: 'Housing' }, { type: 'material', value: 'home' }],
  ['orphan_care', { ar: 'رعاية الأيتام', fr: 'Soutien aux orphelins', en: 'Orphan care' }, { type: 'material', value: 'volunteer_activism' }],
  ['emergency', { ar: 'الطوارئ', fr: 'Urgences', en: 'Emergency' }, { type: 'material', value: 'emergency' }],
].map(([slug, name, icon]) => ({ slug, name, icon }));

const CategoryIcon = ({ icon }) => icon?.type === 'image'
  ? <img src={convexFileUrl(icon.value) || icon.value} alt="" style={{ width: 17, height: 17, objectFit: 'cover', borderRadius: 4, verticalAlign: 'middle' }} />
  : icon?.type === 'emoji' ? <span>{icon.value}</span> : <span className="material-symbols-outlined no-flip" style={{ fontSize: 17, verticalAlign: 'middle' }}>{icon?.value || 'category'}</span>;

export default function ProjectsList() {
  const { currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const siteContentRaw = useQuery(api.config.getConfig, { key: SITE_CONTENT_KEY });
  const siteContent = parseSiteContent(siteContentRaw);
  const tx = mergeContent(COPY[lang] || COPY.ar, siteContent.translations?.[lang]?.projects);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const category = searchParams.get('category') || 'all';
  const projectsData = useQuery(api.projects.getProjects, { status: 'active', limit: 100 });
  const categories = useQuery(api.projectCategories.getPublicCategories, {});
  const visibleCategories = categories?.length ? categories : DEFAULT_CATEGORIES;

  const projects = useMemo(() => (projectsData || []).map((project) => ({
    ...project,
    titleText: getText(project.title, lang),
    shortDescriptionText: getText(project.shortDescription, lang) || getText(project.description, lang),
    imageUrl: convexFileUrl(project.mainImage) || project.mainImage,
  })), [projectsData, lang]);

  const filtered = projects.filter((project) => {
    if (category !== 'all' && project.category !== category) return false;
    if (!search.trim()) return true;
    return `${project.titleText} ${project.shortDescriptionText}`.toLocaleLowerCase(lang).includes(search.toLocaleLowerCase(lang));
  });

  if (projectsData === undefined) {
    return <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'Inter, sans-serif', color: '#94a3b8' }}>{tx.loading}</div>;
  }

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'Inter, sans-serif', background: '#f6f8f8', minHeight: '100vh', color: '#0e1a1b', paddingBottom: 80 }}>
      <div style={{ background: 'linear-gradient(135deg,#0A5F62,#0d7477)', padding: '52px 24px', color: 'white' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '.16em', fontWeight: 900, color: '#8ee4e4' }}>{tx.eyebrow}</div>
          <h1 style={{ fontSize: 36, fontWeight: 900, margin: '10px 0' }}>{tx.title}</h1>
          <p style={{ maxWidth: 560, color: 'rgba(255,255,255,.75)', lineHeight: 1.8 }}>{tx.subtitle}</p>
        </div>
      </div>

      <div style={{ background: 'white', borderBottom: '1px solid #E5E9EB' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '16px 24px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={tx.search} aria-label={tx.search} style={{ flex: 1, minWidth: 220, height: 40, border: '1.5px solid #E5E9EB', borderRadius: 10, padding: '0 14px', fontFamily: 'inherit' }} />
          {['all', ...visibleCategories.map((item) => item.slug)].map((key) => {
            const item = visibleCategories.find((candidate) => candidate.slug === key);
            return <button key={key} type="button" onClick={() => setSearchParams(key === 'all' ? {} : { category: key })} style={{ height: 36, padding: '0 14px', borderRadius: 99, border: `1.5px solid ${category === key ? '#0d7477' : '#E5E9EB'}`, background: category === key ? '#0d7477' : 'white', color: category === key ? 'white' : '#64748b', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800 }}>
              {key === 'all' ? tx.all : <><CategoryIcon icon={item?.icon} /> {getText(item?.name, lang)}</>}
            </button>;
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px' }}>
        {filtered.length === 0 ? <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>{tx.empty}</div> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }}>
            {filtered.map((project) => {
              const meta = visibleCategories.find((item) => item.slug === project.category);
              const pct = project.goalAmount ? Math.min(Math.round((project.raisedAmount || 0) / project.goalAmount * 100), 100) : 0;
              return <article key={project._id} onClick={() => navigate(`/projects/${project._id}`)} style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
                <div style={{ height: 180, background: '#E6F4F4', position: 'relative' }}>
                  {project.imageUrl && <img src={project.imageUrl} alt={project.titleText} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <span style={{ position: 'absolute', right: 12, bottom: 12, background: 'rgba(255,255,255,.92)', borderRadius: 99, padding: '4px 10px', fontSize: 12, fontWeight: 800 }}><CategoryIcon icon={meta?.icon} /> {getText(meta?.name, lang) || project.category}</span>
                </div>
                <div style={{ padding: 18 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 900 }}>{project.titleText}</h3>
                  <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 13, lineHeight: 1.7, height: 44, overflow: 'hidden' }}>{project.shortDescriptionText}</p>
                  <div style={{ height: 8, background: '#E5E9EB', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}><div style={{ width: `${pct}%`, height: '100%', background: '#0d7477' }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 12, marginBottom: 14 }}><strong style={{ color: '#0A5F62' }}>{formatMAD(project.raisedAmount || 0, lang)}</strong><span>{pct}%</span></div>
                  <button onClick={(event) => { event.stopPropagation(); navigate(`/donate/${project._id}`); }} style={{ width: '100%', height: 40, background: '#0d7477', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{tx.donate}</button>
                </div>
              </article>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
