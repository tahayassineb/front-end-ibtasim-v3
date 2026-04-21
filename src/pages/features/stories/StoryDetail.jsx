import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { convexFileUrl } from '../../../lib/convex';

// ============================================
// STORY DETAIL PAGE — Full story view
// ============================================

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
};

export default function StoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const allStories = useQuery(api.stories.getPublishedStories);

  if (allStories === undefined) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
          <p style={{ color: '#94a3b8' }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const story = allStories.find(s => s._id === id);

  if (!story) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'Tajawal, sans-serif', gap: 16 }}>
        <div style={{ fontSize: 48 }}>📭</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>القصة غير موجودة</div>
        <button
          onClick={() => navigate('/impact')}
          style={{ height: 44, padding: '0 22px', borderRadius: 100, fontSize: 14, fontWeight: 600, background: '#E6F4F4', color: '#0A5F62', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
        >
          ← العودة للقصص
        </button>
      </div>
    );
  }

  const date = story.publishedAt
    ? new Date(story.publishedAt).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', overflowX: 'hidden' }}>

      {/* Hero — use cover image if available, otherwise gradient */}
      <div style={{
        background: story.coverImage
          ? `url(${convexFileUrl(story.coverImage)}) center/cover`
          : (story.gradient || 'linear-gradient(160deg,#052E2F,#0d7477)'),
        minHeight: isMobile ? 220 : 340, position: 'relative', display: 'flex', alignItems: 'flex-end'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.65) 0%,rgba(0,0,0,.2) 60%,transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: '0 auto', width: '100%', padding: isMobile ? '0 20px 28px' : '0 28px 40px' }}>
          {/* Category badge */}
          <div style={{ marginBottom: 12 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', color: 'white', padding: '5px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
              {story.badgeIcon} {story.badgeText}
            </span>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, color: 'white', lineHeight: 1.3, marginBottom: 0 }}>
            {story.title}
          </h1>
        </div>
      </div>

      {/* Back button row */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '16px 20px 0' : '20px 28px 0' }}>
        <button
          onClick={() => navigate('/impact')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0A5F62', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'Tajawal, sans-serif', padding: 0 }}
        >
          ← العودة لجميع القصص
        </button>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '20px 20px 56px' : '32px 28px 72px' }}>
        {/* Meta */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em', color: story.catColor || '#0d7477', fontFamily: 'Inter, sans-serif' }}>
            {story.catLabel}
          </span>
          {date && (
            <>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#CBD5E1', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{date}</span>
            </>
          )}
        </div>

        {/* Story body */}
        <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E9EB', padding: isMobile ? 20 : 36, boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
          {/* Excerpt — always shown as pull-quote */}
          <p style={{ fontSize: isMobile ? 15 : 17, color: '#374151', lineHeight: 2, borderRight: '3px solid #33C0C0', paddingRight: 16, margin: 0, marginBottom: story.body ? 24 : 0 }}>
            {story.excerpt}
          </p>
          {/* Rich body — rendered as HTML if present */}
          {story.body && (
            <div
              style={{ fontSize: isMobile ? 15 : 16, color: '#374151', lineHeight: 1.9 }}
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: story.body }}
            />
          )}
        </div>

        {/* Share / back CTA */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/impact')}
            style={{ height: 48, padding: '0 28px', background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(13,116,119,.25)' }}
          >
            ← اقرأ قصصاً أخرى
          </button>
        </div>
      </div>
    </div>
  );
}
