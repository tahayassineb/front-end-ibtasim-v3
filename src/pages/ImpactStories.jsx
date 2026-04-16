import React, { useState, useEffect } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';

// ============================================
// IMPACT STORIES PAGE - Success Stories
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

const ImpactStories = () => {
  const { t, language } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('all');
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

  const filters = [
    { id: 'all', label: `الكل (${stories.length})`, icon: '' },
    ...CATEGORIES.map(c => ({
      id: c,
      label: `${CAT_LABELS[c]} (${stories.filter(s => s.category === c).length})`,
      icon: CAT_ICONS[c],
    })).filter(f => stories.some(s => s.category === f.id)),
  ];

  const filteredStories = selectedFilter === 'all'
    ? stories
    : stories.filter((s) => s.category === selectedFilter);

  const featuredStory = stories.find(s => s.isFeatured) || stories[0] || null;

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#052E2F,#0A5F62,#0d7477)', padding: isMobile ? '40px 20px' : '60px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0' : '0 28px', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#33C0C0', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            SUCCESS STORIES · قصص ملهمة
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: 'white', marginBottom: 12 }}>تبرعاتكم غيّرت حياتهم</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 28px' }}>
            قصص حقيقية لأسر وأطفال استفادوا من كرم متبرعينا الأوفياء
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
                  fontFamily: 'Tajawal, sans-serif',
                }}
              >
                {f.icon && <>{f.icon} </>}{f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Story — only when there is one */}
      {featuredStory && (
        <div style={{ maxWidth: 1200, margin: isMobile ? '28px auto 0' : '48px auto 0', padding: isMobile ? '0 16px' : '0 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
            STORY OF THE MONTH · قصة الشهر
          </div>
          <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 10px 15px rgba(0,0,0,.10)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            {/* Gradient side */}
            <div style={{ background: featuredStory.gradient || 'linear-gradient(160deg,#052E2F,#0d7477)', minHeight: isMobile ? 220 : 360, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 32 }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.6),transparent)' }} />
              <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', color: 'white', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
                {featuredStory.badgeIcon} {featuredStory.badgeText}
              </span>
            </div>
            {/* Body */}
            <div style={{ padding: isMobile ? 24 : 40 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
                SUCCESS STORY · قصة نجاح
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
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>جميع القصص</h2>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>{filteredStories.length} قصة</div>
        </div>

        {convexStories === undefined && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontSize: 13 }}>جاري التحميل...</div>
        )}
        {convexStories !== undefined && filteredStories.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1px solid #E5E9EB' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📖</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>لا توجد قصص منشورة بعد</div>
            <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>
              ستظهر قصص النجاح هنا بمجرد نشرها من لوحة الإدارة
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '100%' : '300px'}, 1fr))`, gap: isMobile ? 16 : 24 }}>
          {filteredStories.map((story) => (
            <div
              key={story.id}
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
              <div style={{ height: isMobile ? 160 : 200, background: story.gradient, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.5),transparent)' }} />
                <div style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 1 }}>
                  <span style={{ background: story.badgeBg, color: story.badgeColor, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>
                    {story.badgeIcon} {story.badgeText}
                  </span>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: story.catColor, marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                  {story.catLabel}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.4, marginBottom: 10 }}>{story.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 14 }}>{story.excerpt}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                  <span>{story.date}</span>
                  <span style={{ color: '#0d7477', fontWeight: 600, fontSize: 13 }}>اقرأ المزيد ←</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default ImpactStories;
