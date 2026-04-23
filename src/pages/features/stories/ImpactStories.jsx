import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';

// ============================================
// BLOG PAGE - المدونة
// ============================================

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

const STORIES_COPY = {
  ar: {
    hero_badge: 'BLOG · المدونة',
    title: 'مدونة الجمعية',
    subtitle: 'قصص النجاح، الأنشطة والفعاليات، وآخر الأخبار من جمعية ابتسام',
    all: 'الكل',
    featured_badge: 'FEATURED · المنشور المميز',
    all_posts: 'جميع المنشورات',
    posts_count: (n) => `${n} منشور`,
    loading: 'جاري التحميل...',
    no_posts_title: 'لا توجد منشورات بعد',
    no_posts_body: 'ستظهر المقالات والأخبار والفعاليات هنا بمجرد نشرها من لوحة الإدارة',
  },
  fr: {
    hero_badge: 'BLOG · ACTUALITÉS',
    title: "Blog de l'association",
    subtitle: "Histoires de succès, activités et dernières nouvelles d'Ibtasim",
    all: 'Tous',
    featured_badge: 'À LA UNE',
    all_posts: 'Tous les articles',
    posts_count: (n) => `${n} article${n > 1 ? 's' : ''}`,
    loading: 'Chargement...',
    no_posts_title: 'Aucun article pour le moment',
    no_posts_body: 'Les articles, actualités et événements apparaîtront ici une fois publiés depuis le tableau de bord.',
  },
  en: {
    hero_badge: 'BLOG · STORIES',
    title: 'Association Blog',
    subtitle: 'Success stories, activities, and latest news from Ibtasim',
    all: 'All',
    featured_badge: 'FEATURED',
    all_posts: 'All Posts',
    posts_count: (n) => `${n} post${n !== 1 ? 's' : ''}`,
    loading: 'Loading...',
    no_posts_title: 'No posts yet',
    no_posts_body: 'Articles, news, and events will appear here once published from the admin dashboard.',
  },
};

const ImpactStories = () => {
  const { language } = useApp();
  const navigate = useNavigate();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPostType, setSelectedPostType] = useState('all');
  const isMobile = useIsMobile();

  const convexStories = useQuery(api.stories.getPublishedStories);

  // Real stories from Convex only — no mock fallback
  const stories = (convexStories || []).map(s => ({
    ...s,
    id: s._id,
    badgeBg: 'rgba(255,255,255,.9)',
    badgeColor: s.catColor || '#0A5F62',
    date: s.publishedAt ? new Date(s.publishedAt).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' }) : '',
  }));

  const CATEGORIES = ['education', 'water', 'health', 'kafala', 'food', 'housing'];
  const CAT_LABELS = { education: 'التعليم', water: 'المياه', health: 'الصحة', kafala: 'الكفالة', food: 'الغذاء', housing: 'السكن' };
  const CAT_ICONS  = { education: '🎓', water: '💧', health: '❤️', kafala: '🤲', food: '🍞', housing: '🏠' };

  const sc = STORIES_COPY[language] || STORIES_COPY.ar;

  const filters = [
    { id: 'all', label: `${sc.all} (${stories.length})`, icon: '' },
    ...CATEGORIES.map(c => ({
      id: c,
      label: `${CAT_LABELS[c]} (${stories.filter(s => s.category === c).length})`,
      icon: CAT_ICONS[c],
    })).filter(f => stories.some(s => s.category === f.id)),
  ];

  const POST_TYPE_LABELS = { story: '🌟 قصص نجاح', activity: '🎉 أنشطة وفعاليات', update: '📢 أخبار وتحديثات' };
  const hasPostTypes = stories.some(s => s.postType);
  const filteredStories = stories.filter(s => {
    const categoryMatch = selectedFilter === 'all' || s.category === selectedFilter;
    const postTypeMatch = selectedPostType === 'all' || s.postType === selectedPostType;
    return categoryMatch && postTypeMatch;
  });

  const featuredStory = stories.find(s => s.isFeatured) || stories[0] || null;

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'var(--font-arabic)', color: '#0e1a1b' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#052E2F,#0A5F62,#0d7477)', padding: isMobile ? '40px 20px' : '60px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0' : '0 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#33C0C0', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            {sc.hero_badge}
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: 'white', marginBottom: 12 }}>{sc.title}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 28px' }}>
            {sc.subtitle}
          </p>
          {/* Filter chips */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                style={{
                  height: 36,
                  padding: '0 18px',
                  borderRadius: 100,
                  fontSize: 13,
                  fontWeight: 500,
                  border: '1.5px solid',
                  borderColor: selectedFilter === f.id ? 'white' : 'rgba(255,255,255,.3)',
                  background: selectedFilter === f.id ? 'white' : 'transparent',
                  color: selectedFilter === f.id ? '#0A5F62' : 'white',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-arabic)',
                }}
              >
                {f.icon && <>{f.icon} </>}{f.label}
              </button>
            ))}
          </div>
          {/* Post type filter — only shown when at least one story has a postType */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {[{ id: 'all', label: 'الكل' }, ...Object.entries(POST_TYPE_LABELS).map(([id, label]) => ({ id, label }))].map(pt => (
              <button key={pt.id} onClick={() => setSelectedPostType(pt.id)}
                style={{ height: 30, padding: '0 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid', borderColor: selectedPostType === pt.id ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.2)', background: selectedPostType === pt.id ? 'rgba(255,255,255,.15)' : 'transparent', color: 'white', cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}>
                {pt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Story — only when there is one */}
      {featuredStory && (
        <div style={{ maxWidth: 1200, margin: isMobile ? '28px auto 0' : '48px auto 0', padding: isMobile ? '0 16px' : '0 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
            {sc.featured_badge}
          </div>
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 10px 15px rgba(0,0,0,.10)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {/* Image / Gradient side */}
            <div style={{ background: featuredStory.gradient || 'linear-gradient(160deg,#052E2F,#0d7477)', minHeight: isMobile ? 220 : 360, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 32, overflow: 'hidden' }}>
              {convexFileUrl(featuredStory.coverImage) && (
                <img
                  src={convexFileUrl(featuredStory.coverImage)}
                  alt=""
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.6),transparent)' }} />
              <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', color: 'white', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
                {featuredStory.badgeIcon} {featuredStory.badgeText}
              </span>
            </div>
            {/* Body */}
            <div style={{ padding: isMobile ? 24 : 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
                {POST_TYPE_LABELS[featuredStory.postType] || 'المدونة'}
              </div>
              <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 14 }}>
                {featuredStory.title}
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85, borderRight: '3px solid #33C0C0', paddingRight: 16, marginBottom: 20 }}>
                {featuredStory.excerpt}
              </p>
              {featuredStory.date && (
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{featuredStory.date}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stories Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '28px 16px 48px' : '40px 28px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>{sc.all_posts}</h2>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>{sc.posts_count(filteredStories.length)}</div>
        </div>

        {convexStories === undefined && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>{sc.loading}</div>
        )}
        {convexStories !== undefined && filteredStories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1px solid #E5E9EB' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📖</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{sc.no_posts_title}</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{sc.no_posts_body}</div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '300px'}, 1fr))`, gap: isMobile ? 16 : 24 }}>
          {filteredStories.map((story) => (
            <div
              key={story.id}
              onClick={() => navigate('/impact/' + story.id)}
              style={{
                background: 'white',
                borderRadius: 16,
                border: '1px solid #E5E9EB',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)',
                transition: 'transform .2s,box-shadow .2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,.10)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
              }}
            >
              {/* Image */}
              <div style={{ height: isMobile ? 140 : 180, background: story.gradient || 'linear-gradient(135deg,#052E2F,#0d7477)', position: 'relative', overflow: 'hidden' }}>
                {convexFileUrl(story.coverImage) && (
                  <img
                    src={convexFileUrl(story.coverImage)}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.5),transparent)' }} />
                <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 1 }}>
                  <span style={{ background: story.badgeBg, color: story.badgeColor, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>
                    {story.badgeIcon} {story.badgeText}
                  </span>
                </div>
              </div>
              {/* Body — title only */}
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: story.catColor, marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                  {story.catLabel}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.45 }}>{story.title}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ImpactStories;
