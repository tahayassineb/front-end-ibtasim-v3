import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import HeroScrollAnimation from '../components/HeroScrollAnimation';

// ============================================
// HOME PAGE - ibtasim Design v3
// ============================================

// Scroll Reveal Hook using Intersection Observer
const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: options.threshold || 0.15, rootMargin: options.rootMargin || '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);

  return [ref, isVisible];
};

// Animated Counter Hook
const useAnimatedCounter = (end, duration = 2000, startCounting = false) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!startCounting) return;
    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration, startCounting]);
  return count;
};

// Animated Counter Component
const AnimatedCounter = ({ end, suffix = '', prefix = '' }) => {
  const [ref, isVisible] = useScrollReveal();
  const count = useAnimatedCounter(end, 2000, isVisible);
  return <span ref={ref}>{prefix}{count.toLocaleString('en-US')}{suffix}</span>;
};

// Fade-in section wrapper
const FadeIn = ({ children, delay = 0 }) => {
  const [ref, isVisible] = useScrollReveal();
  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

const Home = () => {
  const { language } = useApp();
  const navigate = useNavigate();

  // Fetch active projects from Convex
  const activeProjectsData = useQuery(api.projects.getProjects, { status: 'active', limit: 12 });
  const dashboardStats = useQuery(api.admin.getDashboardStats);

  const activeProjects = useMemo(() => {
    if (!activeProjectsData) return [];
    return activeProjectsData.map(project => ({
      id: project._id,
      title: project.title,
      shortDescription: project.description,
      description: project.description,
      category: project.category,
      raised: project.raisedAmount,
      goal: project.goalAmount,
      progress: Math.round((project.raisedAmount / (project.goalAmount || 1)) * 100),
      mainImage: project.mainImage,
      image: convexFileUrl(project.mainImage) || project.mainImage,
      location: project.location,
      status: 'active',
    }));
  }, [activeProjectsData]);

  const handleDonateClick = useCallback(() => navigate('/projects'), [navigate]);
  const handleProjectClick = useCallback((id) => navigate(`/projects/${id}`), [navigate]);
  const handleViewAllProjects = useCallback(() => navigate('/projects'), [navigate]);

  const getProjectTitle = (project) => {
    if (typeof project.title === 'string') return project.title;
    if (typeof project.title === 'object') {
      return project.title[language] || project.title.ar || project.title.en || 'مشروع';
    }
    return project.name || 'مشروع';
  };

  const getProjectDescription = (project) => {
    if (typeof project.shortDescription === 'string') return project.shortDescription;
    if (project.shortDescription && typeof project.shortDescription === 'object') {
      return project.shortDescription[language] || project.shortDescription.ar || '';
    }
    if (typeof project.description === 'string') return project.description;
    if (project.description && typeof project.description === 'object') {
      return project.description[language] || project.description.ar || '';
    }
    return '';
  };

  const displayProjects = activeProjects.slice(0, 3);

  // Category icon/color mapping
  const categoryMeta = {
    education: { icon: '🎓', label: 'التعليم', gradient: 'linear-gradient(160deg,#063a3b,#0A5F62,#0d7477)' },
    water: { icon: '💧', label: 'المياه', gradient: 'linear-gradient(160deg,#1a4a6b,#1e6fa0,#48aadf)' },
    health: { icon: '❤️', label: 'الصحة', gradient: 'linear-gradient(160deg,#7c1e0e,#c0392b,#e74c3c)' },
    food: { icon: '🍞', label: 'الغذاء', gradient: 'linear-gradient(160deg,#5a3e1b,#a0682a,#d4973a)' },
    default: { icon: '🤝', label: 'خيري', gradient: 'linear-gradient(160deg,#063a3b,#0A5F62,#0d7477)' },
  };

  const getCategoryMeta = (cat) => categoryMeta[cat] || categoryMeta.default;

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

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>

      {/* ── HERO SCROLL ANIMATION (preserved) ── */}
      <HeroScrollAnimation onDonate={handleDonateClick} />

      {/* ══════════════════════════════════════════
          FEATURED PROJECTS
      ══════════════════════════════════════════ */}
      <section style={{ background: 'white', padding: '72px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
                FEATURED PROJECTS
              </div>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: '#0e1a1b', lineHeight: 1.2, marginBottom: 12 }}>مشاريعنا المميزة</h2>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
                اختر المشروع الذي تريد دعمه — كل درهم يصل مباشرة إلى المستفيدين
              </p>
            </div>
          </FadeIn>

          {/* Projects grid */}
          {activeProjectsData === undefined ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>جاري التحميل...</div>
          ) : displayProjects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>لا توجد مشاريع نشطة حالياً</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 24 }}>
              {displayProjects.map((project, i) => {
                const meta = getCategoryMeta(project.category);
                const pct = Math.min(project.progress || 0, 100);
                const hasImage = project.image && !project.image.includes('undefined');
                return (
                  <FadeIn key={project.id} delay={i * 0.1}>
                    <div
                      style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                      onClick={() => handleProjectClick(project.id)}
                      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,.10)'; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)'; }}
                    >
                      {/* Card image */}
                      <div style={{ height: 180, background: hasImage ? `url(${project.image}) center/cover` : meta.gradient, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 14 }}>
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                        <span style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.92)', color: '#0e1a1b', borderRadius: 100, fontWeight: 600, fontSize: 11, padding: '3px 10px' }}>
                          {meta.icon} {meta.label}
                        </span>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: 18 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>{getProjectTitle(project)}</div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 16, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {getProjectDescription(project)}
                        </div>

                        {/* Progress */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                            {(project.raised || 0).toLocaleString('en-US')} د.م
                          </span>
                          <span style={{ ...getBadgeStyle(pct), borderRadius: 100, fontWeight: 600, fontSize: 11, padding: '3px 10px' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 8, background: '#E5E9EB', borderRadius: 100, overflow: 'hidden', marginBottom: 6 }}>
                          <div style={{ height: '100%', background: getProgressColor(pct), borderRadius: 100, width: `${pct}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 14 }}>
                          <span style={{ color: '#94a3b8' }}>الهدف: {(project.goal || 0).toLocaleString('en-US')} د.م</span>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
                          style={{ width: '100%', height: 44, borderRadius: 100, background: '#0d7477', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(13,116,119,0.25)' }}
                        >
                          تبرع الآن
                        </button>
                      </div>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <button
              onClick={handleViewAllProjects}
              style={{ height: 44, padding: '0 22px', fontSize: 14, fontWeight: 600, borderRadius: 100, border: '1.5px solid #0d7477', background: 'white', color: '#0d7477', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
            >
              عرض جميع المشاريع ({activeProjects.length || 12}) →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          IMPACT NUMBERS BAND
      ══════════════════════════════════════════ */}
      <section style={{ background: '#0A5F62', padding: 0 }}>
        <div className="grid grid-cols-2 lg:grid-cols-4" style={{ gap: 2 }}>
          {[
            { num: Math.round((dashboardStats?.totalDonations || 0) / 100), suffix: '', unit: 'درهم مغربي', label: 'إجمالي التبرعات المستلمة' },
            { num: dashboardStats?.activeKafala || 0, suffix: '', unit: 'يتيم', label: 'تحت رعاية الكفالة الشهرية' },
            { num: dashboardStats?.donationCount || 0, suffix: '', unit: 'تبرع', label: 'تبرع وصلنا حتى الآن' },
            { num: (activeProjectsData || []).filter(p => p.status === 'active').length, suffix: '', unit: 'مشروع', label: 'مشاريع نشطة الآن' },
          ].map((stat, i) => (
            <div key={i} style={{ padding: '40px 24px', textAlign: 'center', background: 'rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
                <AnimatedCounter end={stat.num} suffix={stat.suffix} />
              </div>
              <div style={{ fontSize: 14, color: '#33C0C0', fontWeight: 600, marginTop: 4 }}>{stat.unit}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 8 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          KAFALA BANNER
      ══════════════════════════════════════════ */}
      <section style={{ background: 'linear-gradient(135deg, #8B6914, #C4A882, #E8D4B0)', padding: '60px 28px', textAlign: 'center' }}>
        <FadeIn>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#5C3D0B', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
              KAFALA PROGRAM · برنامج الكفالة
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 900, color: '#3D2506', marginBottom: 14 }}>اكفل يتيماً وغيّر حياته</h2>
            <p style={{ fontSize: 16, color: '#6B4F12', lineHeight: 1.7, marginBottom: 28 }}>
              48 يتيماً ينتظرون كافلاً رحيماً — بـ 300 درهم شهرياً فقط تكفل يتيماً وتضمن له التعليم والغذاء والرعاية الصحية
            </p>
            <Link
              to="/kafala"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6B4F12', color: 'white', height: 52, padding: '0 32px', borderRadius: 100, fontSize: 16, fontWeight: 700, fontFamily: 'Tajawal, sans-serif', textDecoration: 'none', boxShadow: '0 4px 14px rgba(107,79,18,0.35)' }}
            >
              🤲 ابدأ الكفالة الآن
            </Link>
            <div style={{ marginTop: 16, fontSize: 13, color: '#8B6914' }}>يمكنك الإلغاء في أي وقت · بدون التزام طويل المدى</div>
          </div>
        </FadeIn>
      </section>

      {/* ══════════════════════════════════════════
          IMPACT STORIES
      ══════════════════════════════════════════ */}
      <section style={{ background: '#f6f8f8', padding: '72px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
          <FadeIn>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
                SUCCESS STORIES
              </div>
              <h2 style={{ fontSize: 34, fontWeight: 800, color: '#0e1a1b', lineHeight: 1.2, marginBottom: 12 }}>قصص النجاح</h2>
              <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 540, margin: '0 auto' }}>
                تبرعاتكم غيّرت حياة هؤلاء — اقرأ قصصهم
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 24 }}>
            {/* Story 1 */}
            <FadeIn delay={0}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)' }}>
                <div style={{ height: 160, background: 'linear-gradient(160deg,#0A5F62,#33C0C0)' }} />
                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#0d7477', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🎓 التعليم</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>كيف حوّل مشروع المدرسة مستقبل 200 طفل في تافيلالت</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>بفضل تبرعاتكم، أصبح لدى أطفال القرية فصول دراسية حديثة وكتب مدرسية ومعلمون متخصصون...</div>
                </div>
              </div>
            </FadeIn>

            {/* Story 2 */}
            <FadeIn delay={0.1}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)' }}>
                <div style={{ height: 160, background: 'linear-gradient(160deg,#8B6914,#C4A882)' }} />
                <div style={{ padding: 18 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8B6914', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>🤲 الكفالة</div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4 }}>يوسف — من اليتم إلى الحلم: قصة كفالة نجحت</div>
                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>يوسف البالغ من العمر 12 عاماً أصبح متفوقاً في دراسته بعد عامين من الكفالة الشهرية التي وفّرت له كل ما يحتاجه...</div>
                </div>
              </div>
            </FadeIn>
          </div>

          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link
              to="/impact"
              style={{ height: 44, padding: '0 22px', fontSize: 14, fontWeight: 600, borderRadius: 100, background: '#E6F4F4', color: '#0A5F62', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
            >
              عرض جميع القصص →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          PARTNERS
      ══════════════════════════════════════════ */}
      <section style={{ background: 'white', borderTop: '1px solid #E5E9EB', borderBottom: '1px solid #E5E9EB', padding: '40px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>شركاء وجهات الدعم</div>
          {['🏛 وزارة الأوقاف', '🌙 صندوق محمد الخامس', '🌍 UNICEF', '🏪 التعاضدية العامة'].map((p) => (
            <div key={p} style={{ height: 44, padding: '0 24px', background: '#f6f8f8', borderRadius: 100, border: '1px solid #E5E9EB', display: 'flex', alignItems: 'center', fontSize: 13, fontWeight: 600, color: '#64748b', gap: 8 }}>
              {p}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;
