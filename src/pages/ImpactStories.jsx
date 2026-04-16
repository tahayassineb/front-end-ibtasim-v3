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

  const filters = [
    { id: 'all', label: 'الكل (24)', icon: '' },
    { id: 'education', label: 'التعليم (8)', icon: '🎓' },
    { id: 'water', label: 'المياه (5)', icon: '💧' },
    { id: 'health', label: 'الصحة (4)', icon: '❤️' },
    { id: 'kafala', label: 'الكفالة (7)', icon: '🤲' },
  ];

  const STATIC_STORIES = [
    {
      id: 1,
      category: 'kafala',
      catLabel: 'KAFALA · كفالة',
      catColor: '#8B6914',
      badgeBg: 'rgba(255,255,255,.9)',
      badgeColor: '#6B4F12',
      badgeIcon: '🤲',
      badgeText: 'الكفالة',
      gradient: 'linear-gradient(160deg,#8B6914,#C4A882)',
      title: 'يوسف — من اليتم إلى الأمل: قصة كفالة نجحت',
      excerpt: 'بعد عامين من الكفالة، أصبح يوسف متفوقاً في دراسته ويحلم بأن يصبح طبيباً...',
      date: '15 أبريل 2026',
    },
    {
      id: 2,
      category: 'water',
      catLabel: 'WATER · مياه',
      catColor: '#1a4a6b',
      badgeBg: 'rgba(255,255,255,.9)',
      badgeColor: '#1a4a6b',
      badgeIcon: '💧',
      badgeText: 'المياه',
      gradient: 'linear-gradient(160deg,#1a4a6b,#48aadf)',
      title: 'البئر التي أعادت الحياة لقرية كاملة في أوطاط الحاج',
      excerpt: '500 أسرة كانت تسير ساعات للحصول على الماء — اليوم لديهم صنبور في كل بيت...',
      date: '2 أبريل 2026',
    },
    {
      id: 3,
      category: 'health',
      catLabel: 'HEALTH · صحة',
      catColor: '#7c1e0e',
      badgeBg: 'rgba(255,255,255,.9)',
      badgeColor: '#7c1e0e',
      badgeIcon: '❤️',
      badgeText: 'الصحة',
      gradient: 'linear-gradient(160deg,#7c1e0e,#e74c3c)',
      title: 'العيادة المتنقلة أنقذت حياة أم وطفلها في منطقة نائية',
      excerpt: 'في أقصى جنوب المغرب، حيث لا مستشفى على بعد 200 كيلومتر، وصلت عيادتنا في اللحظة المناسبة...',
      date: '18 مارس 2026',
    },
    {
      id: 4,
      category: 'food',
      catLabel: 'FOOD · غذاء',
      catColor: '#1a4520',
      badgeBg: 'rgba(255,255,255,.9)',
      badgeColor: '#1a4520',
      badgeIcon: '🍞',
      badgeText: 'الغذاء',
      gradient: 'linear-gradient(160deg,#1a4520,#27ae60)',
      title: '1000 سلة رمضانية — ابتسامات في بيوت المعوزين',
      excerpt: 'في أول أيام رمضان، وزّعنا السلال الغذائية على الأسر الأكثر هشاشة في 12 دوار...',
      date: '5 مارس 2026',
    },
    {
      id: 5,
      category: 'housing',
      catLabel: 'HOUSING · سكن',
      catColor: '#4a1a6b',
      badgeBg: 'rgba(255,255,255,.9)',
      badgeColor: '#4a1a6b',
      badgeIcon: '🏠',
      badgeText: 'السكن',
      gradient: 'linear-gradient(160deg,#4a1a6b,#9b59b6)',
      title: 'منزل الأرملة خديجة — من الخراب إلى الدفء',
      excerpt: 'خديجة (72 عاماً) كانت تعيش في منزل آيل للسقوط مع حفيدتها. اليوم تعيشان في أمان...',
      date: '20 فبراير 2026',
    },
    {
      id: 6,
      category: 'education',
      catLabel: 'EDUCATION · تعليم',
      catColor: '#0A5F62',
      badgeBg: 'rgba(255,255,255,.9)',
      badgeColor: '#0A5F62',
      badgeIcon: '🎓',
      badgeText: 'التعليم',
      gradient: 'linear-gradient(160deg,#063a3b,#0d7477)',
      title: 'سلمى — أول فتاة من قريتها تنجح في البكالوريا',
      excerpt: 'بفضل منحة دراسية من برنامجنا، أصبحت سلمى أول خريجة جامعية من قريتها الصغيرة...',
      date: '10 فبراير 2026',
    },
  ];

  // Use Convex stories if available, fallback to static
  const stories = (convexStories && convexStories.length > 0)
    ? convexStories.map(s => ({ ...s, id: s._id, date: s.publishedAt ? new Date(s.publishedAt).toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' }) : '' }))
    : STATIC_STORIES;

  const filteredStories = selectedFilter === 'all'
    ? stories
    : stories.filter((s) => s.category === selectedFilter);

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

      {/* Featured Story */}
      <div style={{ maxWidth: 1200, margin: isMobile ? '28px auto 0' : '48px auto 0', padding: isMobile ? '0 16px' : '0 28px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>
          STORY OF THE MONTH · قصة الشهر
        </div>
        <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', boxShadow: '0 10px 15px rgba(0,0,0,.10)', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
          {/* Image side */}
          <div style={{ background: 'linear-gradient(160deg,#052E2F,#0d7477,#33C0C0)', minHeight: isMobile ? 220 : 360, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 32 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.6),transparent)' }} />
            <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(8px)', color: 'white', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600 }}>
              🎓 التعليم
            </span>
          </div>
          {/* Body */}
          <div style={{ padding: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
              SUCCESS STORY · قصة نجاح
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.3, marginBottom: 14 }}>
              كيف حوّل مشروع المدرسة مستقبل 200 طفل في قرية أيت بنحدو
            </h2>
            <blockquote style={{ fontSize: 16, color: '#64748b', lineHeight: 1.85, borderRight: '3px solid #33C0C0', paddingRight: 16, marginBottom: 20, fontStyle: 'italic' }}>
              "قبل بناء المدرسة، كان أطفالنا يمشون 12 كيلومتراً يومياً للدراسة. اليوم، ابنتي الصغيرة تتصدر قائمة المتفوقين في فصلها."
            </blockquote>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E6F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>👩</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>فاطمة — أم لثلاثة أطفال</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>من قرية أيت بنحدو، منطقة ورزازات</div>
              </div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button style={{ height: 44, padding: '0 22px', borderRadius: 100, fontSize: 14, fontWeight: 600, background: '#0d7477', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'Tajawal, sans-serif' }}>
                اقرأ القصة كاملة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '28px 16px 48px' : '40px 28px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>جميع القصص</h2>
          <div style={{ fontSize: 13, color: '#94a3b8' }}>{filteredStories.length} قصة</div>
        </div>

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

        {/* Load more */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button style={{ height: 44, padding: '0 22px', borderRadius: 100, fontSize: 14, fontWeight: 600, background: '#E6F4F4', color: '#0A5F62', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            تحميل المزيد من القصص →
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImpactStories;
