import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';

const COPY = {
  ar: { badge: 'المدونة · القصص', title: 'مدونة الجمعية', subtitle: 'قصص النجاح والأنشطة وآخر أخبار جمعية ابتسام.', all: 'الكل', featured: 'منشور مميز', posts: 'جميع المنشورات', count: (n) => `${n} منشور`, loading: 'جاري تحميل المنشورات...', emptyTitle: 'لا توجد منشورات بعد', emptyBody: 'ستظهر المقالات والأخبار والفعاليات هنا بمجرد نشرها من لوحة الإدارة.', read: 'اقرأ القصة', categories: { education: 'التعليم', water: 'المياه', health: 'الصحة', kafala: 'الكفالة', food: 'الغذاء', housing: 'السكن' }, types: { story: 'قصص نجاح', activity: 'أنشطة وفعاليات', update: 'أخبار وتحديثات' } },
  fr: { badge: 'BLOG · ACTUALITÉS', title: "Blog de l’association", subtitle: "Histoires de réussite, activités et dernières nouvelles de l’Association Ibtasim.", all: 'Tous', featured: 'À la une', posts: 'Tous les articles', count: (n) => `${n} article${n > 1 ? 's' : ''}`, loading: 'Chargement des articles...', emptyTitle: 'Aucun article pour le moment', emptyBody: 'Les articles, actualités et événements apparaîtront ici une fois publiés depuis le tableau de bord.', read: "Lire l’article", categories: { education: 'Éducation', water: 'Eau', health: 'Santé', kafala: 'Kafala', food: 'Alimentation', housing: 'Logement' }, types: { story: 'Histoires de réussite', activity: 'Activités et événements', update: 'Actualités' } },
  en: { badge: 'BLOG · STORIES', title: 'Association Blog', subtitle: 'Success stories, activities, and the latest news from Association Ibtasim.', all: 'All', featured: 'Featured', posts: 'All posts', count: (n) => `${n} post${n === 1 ? '' : 's'}`, loading: 'Loading posts...', emptyTitle: 'No posts yet', emptyBody: 'Articles, news, and events will appear here once published from the admin dashboard.', read: 'Read story', categories: { education: 'Education', water: 'Water', health: 'Health', kafala: 'Kafala', food: 'Food', housing: 'Housing' }, types: { story: 'Success stories', activity: 'Activities and events', update: 'News and updates' } },
};

const ICONS = { education: 'school', water: 'water_drop', health: 'health_and_safety', kafala: 'diversity_1', food: 'restaurant', housing: 'home' };
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => { const update = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', update); return () => window.removeEventListener('resize', update); }, []);
  return isMobile;
};

export default function ImpactStories() {
  const { language, currentLanguage } = useApp();
  const lang = language || 'ar';
  const tx = COPY[lang] || COPY.ar;
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [category, setCategory] = useState('all');
  const [postType, setPostType] = useState('all');
  const storiesData = useQuery(api.stories.getPublishedStories);
  const stories = storiesData || [];
  const categories = [...new Set(stories.map((story) => story.category).filter(Boolean))];
  const postTypes = [...new Set(stories.map((story) => story.postType).filter(Boolean))];
  const filtered = stories.filter((story) => (category === 'all' || story.category === category) && (postType === 'all' || story.postType === postType));
  const featured = filtered.find((story) => story.isFeatured) || filtered[0];
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';

  const StoryCard = ({ story, feature = false }) => {
    const image = convexFileUrl(story.coverImage);
    const categoryLabel = tx.categories[story.category] || story.catLabel || story.category;
    const typeLabel = tx.types[story.postType] || categoryLabel;
    return <article onClick={() => navigate(`/stories/${story.slug || story._id}`)} style={{ cursor: 'pointer', background: 'white', borderRadius: 18, overflow: 'hidden', border: '1px solid #E5E9EB', boxShadow: feature ? '0 10px 24px rgba(0,0,0,.10)' : '0 3px 10px rgba(0,0,0,.05)', display: feature ? 'grid' : 'block', gridTemplateColumns: feature && !isMobile ? '1fr 1fr' : undefined }}>
      <div style={{ minHeight: feature ? 260 : 180, background: story.gradient || 'linear-gradient(135deg,#052E2F,#0d7477)', position: 'relative' }}>
        {image && <img src={image} alt={story.imageAlt || story.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <span style={{ position: 'absolute', bottom: 14, insetInlineStart: 14, padding: '5px 10px', borderRadius: 99, background: 'rgba(255,255,255,.92)', color: story.catColor || '#0A5F62', fontWeight: 800, fontSize: 12 }}><span className="material-symbols-outlined no-flip" style={{ fontSize: 15, verticalAlign: 'middle', marginInlineEnd: 4 }}>{ICONS[story.category] || 'article'}</span>{categoryLabel}</span>
      </div>
      <div style={{ padding: feature ? 32 : 18 }}>
        <div style={{ color: '#0d7477', fontSize: 11, fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>{typeLabel}</div>
        <h2 style={{ margin: '0 0 10px', fontSize: feature ? 25 : 17, lineHeight: 1.35, fontWeight: 900 }}>{story.title}</h2>
        {story.excerpt && <p style={{ margin: '0 0 14px', color: '#64748b', lineHeight: 1.7, fontSize: 14 }}>{story.excerpt}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: 12 }}><span>{story.publishedAt ? new Date(story.publishedAt).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</span><span style={{ color: '#0d7477', fontWeight: 800 }}>{tx.read} <span className="material-symbols-outlined no-flip" style={{ fontSize: 16, verticalAlign: 'middle' }}>arrow_forward</span></span></div>
      </div>
    </article>;
  };

  return <div dir={currentLanguage?.dir || (lang === 'ar' ? 'rtl' : 'ltr')} style={{ minHeight: '100vh', background: '#f6f8f8', color: '#0e1a1b', fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'Inter, sans-serif' }}>
    <section style={{ background: 'linear-gradient(135deg,#052E2F,#0A5F62,#0d7477)', padding: isMobile ? '42px 16px' : '64px 28px', textAlign: 'center', color: 'white' }}>
      <div style={{ maxWidth: 780, margin: 'auto' }}><div style={{ fontWeight: 900, letterSpacing: '.14em', fontSize: 12, color: '#8ee4e4' }}>{tx.badge}</div><h1 style={{ margin: '12px 0', fontSize: isMobile ? 32 : 42 }}>{tx.title}</h1><p style={{ margin: '0 auto 25px', maxWidth: 600, lineHeight: 1.7, color: 'rgba(255,255,255,.8)' }}>{tx.subtitle}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>{['all', ...categories].map((item) => <button key={item} onClick={() => setCategory(item)} style={{ border: `1px solid ${category === item ? 'white' : 'rgba(255,255,255,.4)'}`, background: category === item ? 'white' : 'transparent', color: category === item ? '#0A5F62' : 'white', borderRadius: 99, padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 800 }}>{item === 'all' ? tx.all : tx.categories[item] || item}</button>)}</div>
        {postTypes.length > 0 && <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>{['all', ...postTypes].map((item) => <button key={item} onClick={() => setPostType(item)} style={{ border: 'none', background: postType === item ? 'rgba(255,255,255,.22)' : 'transparent', color: 'white', borderRadius: 99, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>{item === 'all' ? tx.all : tx.types[item] || item}</button>)}</div>}
      </div>
    </section>
    <main style={{ maxWidth: 1180, margin: 'auto', padding: isMobile ? '28px 16px 56px' : '46px 28px 64px' }}>
      {storiesData === undefined ? <div style={{ textAlign: 'center', padding: 64, color: '#64748b' }}>{tx.loading}</div> : stories.length === 0 ? <div style={{ textAlign: 'center', padding: 64, background: 'white', borderRadius: 18, border: '1px solid #E5E9EB' }}><span className="material-symbols-outlined no-flip" style={{ fontSize: 48, color: '#0d7477' }}>auto_stories</span><h2>{tx.emptyTitle}</h2><p style={{ color: '#64748b' }}>{tx.emptyBody}</p></div> : <>
        {featured && <><div style={{ fontSize: 12, letterSpacing: '.12em', fontWeight: 900, color: '#0d7477', marginBottom: 14 }}>{tx.featured}</div><StoryCard story={featured} feature /></>}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '40px 0 18px' }}><h2 style={{ margin: 0, fontSize: 24 }}>{tx.posts}</h2><span style={{ color: '#64748b' }}>{tx.count(filtered.length)}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill,minmax(${isMobile ? '100%' : '280px'},1fr))`, gap: 20 }}>{filtered.filter((story) => story._id !== featured?._id).map((story) => <StoryCard key={story._id} story={story} />)}</div>
      </>}
    </main>
  </div>;
}
