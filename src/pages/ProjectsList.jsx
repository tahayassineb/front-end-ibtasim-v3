import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';

// ============================================
// PROJECTS LIST PAGE
// ============================================

const getLocalizedText = (obj, language) => {
  if (typeof obj === 'string') return obj;
  if (!obj) return '';
  return obj[language] || obj.ar || obj.en || '';
};

const categoryMeta = {
  education: { icon: '🎓', label: 'التعليم', gradient: 'linear-gradient(160deg,#063a3b,#0d7477)' },
  water:     { icon: '💧', label: 'المياه',  gradient: 'linear-gradient(160deg,#1a4a6b,#48aadf)' },
  health:    { icon: '❤️', label: 'الصحة',   gradient: 'linear-gradient(160deg,#7c1e0e,#e74c3c)' },
  food:      { icon: '🍞', label: 'الغذاء',  gradient: 'linear-gradient(160deg,#1a4520,#27ae60)' },
  housing:   { icon: '🏠', label: 'السكن',   gradient: 'linear-gradient(160deg,#4a1a6b,#9b59b6)' },
  default:   { icon: '🤝', label: 'خيري',    gradient: 'linear-gradient(160deg,#063a3b,#0d7477)' },
};
const getCatMeta = (cat) => categoryMeta[cat] || categoryMeta.default;

const getProgressColor = (pct) => {
  if (pct >= 80) return '#22c55e';
  if (pct >= 50) return '#0d7477';
  return '#f59e0b';
};
const getBadgeStyle = (pct) => {
  if (pct >= 80) return { background: '#D1FAE5', color: '#16a34a' };
  if (pct >= 50) return { background: '#E6F4F4', color: '#0A5F62' };
  return { background: '#FEF3C7', color: '#d97706' };
};

// ── Kafala inline card ────────────────────────────────────────────────────
const KafalaCard = ({ kafala }) => {
  const isSponsored = kafala.status === 'sponsored';
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceDisplay = kafala.monthlyPrice
    ? (kafala.monthlyPrice / 100).toLocaleString('fr-MA')
    : '300';

  return (
    <div style={{ background: 'linear-gradient(135deg,#F5EBD9,#E8D4B0)', borderRadius: 18, border: '1.5px solid #E8D4B0', padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      {/* Avatar */}
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: photoUrl ? `url(${photoUrl}) center/cover` : 'linear-gradient(135deg,#8B6914,#C4A882)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
        {!photoUrl && (kafala.gender === 'female' ? '👧' : '👦')}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#8B6914', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>KAFALA</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#3D2506' }}>{kafala.name} — {kafala.age} سنة</div>
        <div style={{ fontSize: 12, color: '#8B6914', marginTop: 2 }}>{kafala.location || 'المغرب'}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#6B4F12', marginTop: 6, fontFamily: 'Inter, sans-serif' }}>{priceDisplay} د.م / شهر</div>
      </div>

      {/* CTA */}
      {!isSponsored ? (
        <Link
          to={`/kafala/${kafala._id}/sponsor`}
          style={{ background: '#6B4F12', color: 'white', height: 40, padding: '0 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, fontFamily: 'Tajawal, sans-serif', textDecoration: 'none', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', boxShadow: '0 4px 14px rgba(107,79,18,0.3)', flexShrink: 0 }}
        >
          🤲 اكفله
        </Link>
      ) : (
        <Link
          to={`/kafala/${kafala._id}`}
          style={{ background: 'rgba(107,79,18,0.1)', color: '#6B4F12', height: 40, padding: '0 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, fontFamily: 'Tajawal, sans-serif', textDecoration: 'none', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', flexShrink: 0 }}
        >
          مكفول
        </Link>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────
const ProjectsList = () => {
  const { currentLanguage } = useApp();
  const language = currentLanguage?.code || 'ar';
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Convex queries — PRESERVED
  const convexProjects = useQuery(api.projects.getProjects, { status: 'active', limit: 100 });
  const convexKafala = useQuery(api.kafala.getPublicKafalaList, {});

  const projects = useMemo(() => {
    if (!convexProjects) return [];
    return convexProjects.map(p => ({
      _type: 'project',
      id: p._id,
      title: p.title,
      description: p.description,
      category: p.category,
      raised: p.raisedAmount,
      goal: p.goalAmount,
      progress: Math.round((p.raisedAmount / (p.goalAmount || 1)) * 100),
      image: convexFileUrl(p.mainImage) || p.mainImage,
      location: p.location,
    }));
  }, [convexProjects]);

  const kafalaItems = useMemo(() => {
    if (!convexKafala) return [];
    return convexKafala.map(k => ({ _type: 'kafala', ...k }));
  }, [convexKafala]);

  const chips = [
    { id: 'all',       icon: '',   label: `الكل (${projects.length || 12})` },
    { id: 'education', icon: '🎓', label: `التعليم` },
    { id: 'water',     icon: '💧', label: 'المياه' },
    { id: 'health',    icon: '❤️', label: 'الصحة' },
    { id: 'food',      icon: '🍞', label: 'الغذاء' },
    { id: 'housing',   icon: '🏠', label: 'السكن' },
    { id: 'kafala',    icon: '🤲', label: 'الكفالة' },
  ];

  const allItems = useMemo(() => {
    if (activeCategory === 'kafala') return kafalaItems;
    if (activeCategory !== 'all') return projects.filter(p => p.category === activeCategory);
    // Interleave: insert one kafala card after every 2 projects
    const result = [];
    let ki = 0;
    projects.forEach((p, i) => {
      result.push(p);
      if ((i + 1) % 2 === 0 && ki < kafalaItems.length) {
        result.push(kafalaItems[ki++]);
      }
    });
    return result;
  }, [projects, kafalaItems, activeCategory]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => {
      if (item._type === 'project') return getLocalizedText(item.title, language).toLowerCase().includes(q);
      return item.name?.toLowerCase().includes(q) || item.location?.toLowerCase().includes(q);
    });
  }, [allItems, searchQuery, language]);

  const isLoading = convexProjects === undefined || convexKafala === undefined;

  if (isLoading) {
    return (
      <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E5E9EB', borderTopColor: '#0d7477', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          جاري التحميل...
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', background: '#f6f8f8', minHeight: '100vh', paddingBottom: 80 }}>

      {/* ── PAGE HERO ── */}
      <div style={{ background: 'linear-gradient(135deg,#0A5F62,#0d7477)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#33C0C0', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>ALL PROJECTS</div>
            <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 8 }}>مشاريعنا الخيرية</h1>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>تصفح جميع مشاريعنا واختر الذي يلامس قلبك</p>
          </div>
          <div style={{ display: 'flex', gap: 32 }}>
            {[
              { num: projects.length || 12, label: 'مشروع نشط' },
              { num: 7, label: 'مكتمل' },
              { num: 3, label: 'قريباً' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FILTERS BAR ── */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, maxWidth: 340 }}>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مشروع..."
              style={{ width: '100%', height: 44, padding: '0 44px 0 16px', border: '1.5px solid #E5E9EB', borderRadius: 100, background: '#F0F7F7', fontFamily: 'Tajawal, sans-serif', fontSize: 14, color: '#0e1a1b', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#33C0C0'}
              onBlur={e => e.target.style.borderColor = '#E5E9EB'}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }}>🔍</span>
          </div>

          {/* Chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {chips.map(chip => (
              <button
                key={chip.id}
                onClick={() => setActiveCategory(chip.id)}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: chip.id === activeCategory ? 700 : 500,
                  border: `1.5px solid ${chip.id === activeCategory ? '#0d7477' : '#E5E9EB'}`,
                  background: chip.id === activeCategory ? '#0d7477' : 'white',
                  color: chip.id === activeCategory ? 'white' : '#64748b',
                  cursor: 'pointer',
                  fontFamily: 'Tajawal, sans-serif',
                  boxShadow: chip.id === activeCategory ? '0 4px 14px rgba(13,116,119,0.25)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {chip.icon && `${chip.icon} `}{chip.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            style={{ height: 44, padding: '0 14px', border: '1.5px solid #E5E9EB', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 13, color: '#64748b', background: 'white', outline: 'none', marginRight: 'auto', cursor: 'pointer' }}
          >
            <option>الأحدث</option>
            <option>الأكثر تمويلاً</option>
            <option>الأقرب للهدف</option>
            <option>الأقل تمويلاً</option>
          </select>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 28px' }}>
        {/* Section label */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            المشاريع النشطة{' '}
            <span style={{ fontSize: 11, fontWeight: 700, background: '#E6F4F4', color: '#0A5F62', padding: '3px 10px', borderRadius: 100, fontFamily: 'Inter, sans-serif' }}>
              {filtered.length}
            </span>
          </span>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>عرض: شبكة ▦</span>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 16 }}>لا توجد نتائج</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 24, marginBottom: 48 }}>
            {filtered.map((item, i) => {
              if (item._type === 'kafala') {
                return (
                  <div key={`kafala-${item._id || i}`} className="md:col-span-2 lg:col-span-1">
                    <KafalaCard kafala={item} />
                  </div>
                );
              }

              const meta = getCatMeta(item.category);
              const pct = Math.min(item.progress || 0, 100);
              const hasImage = item.image && !String(item.image).includes('undefined');

              return (
                <div
                  key={item.id}
                  style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onClick={() => navigate(`/projects/${item.id}`)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,.10)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)'; }}
                >
                  {/* Image */}
                  <div style={{ height: 180, background: hasImage ? `url(${item.image}) center/cover` : meta.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 14 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.5),transparent)' }} />
                    <span style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.92)', color: '#0e1a1b', borderRadius: 100, fontWeight: 600, fontSize: 11, padding: '3px 10px' }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>

                  {/* Body */}
                  <div style={{ padding: 18 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>
                      {getLocalizedText(item.title, language)}
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {getLocalizedText(item.description, language)}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                        {(item.raised || 0).toLocaleString('en-US')} د.م
                      </span>
                      <span style={{ ...getBadgeStyle(pct), borderRadius: 100, fontWeight: 600, fontSize: 11, padding: '3px 10px' }}>{pct}%</span>
                    </div>
                    <div style={{ height: 8, background: '#E5E9EB', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
                      <div style={{ height: '100%', background: getProgressColor(pct), borderRadius: 100, width: `${pct}%` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 14 }}>
                      <span style={{ color: '#94a3b8' }}>الهدف: {(item.goal || 0).toLocaleString('en-US')} د.م</span>
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/projects/${item.id}`); }}
                      style={{ width: '100%', height: 44, borderRadius: 100, background: '#0d7477', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(13,116,119,0.25)' }}
                    >
                      تبرع الآن
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, padding: '12px 0' }}>
            {['←', '1', '2', '3', '...', '→'].map((p, i) => (
              <button
                key={i}
                style={{
                  width: p === '...' ? 'auto' : 40,
                  height: 40,
                  padding: p === '...' ? '0 8px' : 0,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: p === '...' ? 11 : 14,
                  fontWeight: 600,
                  border: `1.5px solid ${p === '1' ? '#0d7477' : '#E5E9EB'}`,
                  background: p === '1' ? '#0d7477' : 'white',
                  color: p === '1' ? 'white' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: p === '1' ? '0 4px 14px rgba(13,116,119,0.25)' : 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsList;
