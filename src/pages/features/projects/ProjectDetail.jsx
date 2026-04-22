import React, { useState, useEffect, useMemo } from 'react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
};
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';

// ============================================
// PROJECT DETAIL PAGE
// ============================================

const getLocalizedText = (obj, lang = 'ar') => {
  if (typeof obj === 'string') return obj;
  if (!obj) return '';
  return obj[lang] || obj.ar || obj.en || '';
};

const categoryMeta = {
  education: { icon: '🎓', label: 'التعليم' },
  water:     { icon: '💧', label: 'المياه' },
  health:    { icon: '❤️', label: 'الصحة' },
  food:      { icon: '🍞', label: 'الغذاء' },
  housing:   { icon: '🏠', label: 'السكن' },
  default:   { icon: '🤝', label: 'خيري' },
};

const ProjectDetail = ({ preview = false }) => {
  const { language } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const [previewData, setPreviewData] = useState(null);
  const [copied, setCopied] = useState(false);
  const isMobile = useIsMobile();
  const [now] = useState(() => Date.now());

  // Fetch project from Convex backend — PRESERVED
  const convexProject = useQuery(api.projects.getProjectById, { projectId: id });

  // Fetch recent verified donations for donors section — PRESERVED
  const convexDonations = useQuery(
    api.donations.getDonationsByProject,
    id ? { projectId: id, limit: 10 } : 'skip'
  );

  // Load preview data from sessionStorage if in preview mode — PRESERVED
  useEffect(() => {
    if (preview) {
      const stored = sessionStorage.getItem('projectPreview');
      if (stored) setPreviewData(JSON.parse(stored));
    }
  }, [preview]);

  const project = useMemo(() => {
    if (previewData) return previewData;
    if (!convexProject) return null;

    const progress = Math.round((convexProject.raisedAmount / (convexProject.goalAmount || 1)) * 100);

    return {
      id: convexProject._id,
      title: convexProject.title,
      location: convexProject.location || 'المغرب',
      description: convexProject.description,
      raised: convexProject.raisedAmount / 100,
      goal: convexProject.goalAmount / 100,
      progress: Math.min(progress, 100),
      daysLeft: convexProject.endDate
        ? Math.max(0, Math.ceil((convexProject.endDate - now) / (1000 * 60 * 60 * 24)))
        : 30,
      category: convexProject.category,
      image: convexFileUrl(convexProject.mainImage) || convexProject.mainImage,
    };
  }, [convexProject, previewData, now]);

  const handleDonateClick = () => {
    if (project) navigate(`/donate/${project.id}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Loading state ──
  if (!preview && convexProject === undefined) {
    return (
      <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8' }}>
        <div style={{ textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #E5E9EB', borderTopColor: '#0d7477', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
          جاري التحميل...
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (!preview && convexProject === null) {
    return (
      <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8', padding: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0e1a1b', marginBottom: 8 }}>المشروع غير موجود</h1>
        <p style={{ color: '#64748b', marginBottom: 24 }}>المشروع الذي تبحث عنه غير متوفر</p>
        <button onClick={() => navigate('/projects')} style={{ height: 44, padding: '0 24px', background: '#0d7477', color: 'white', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(13,116,119,0.25)' }}>
          عرض جميع المشاريع
        </button>
      </div>
    );
  }

  if (!project) {
    return (
      <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8' }}>
        <div style={{ color: '#94a3b8' }}>جاري التحميل...</div>
      </div>
    );
  }

  const cat = categoryMeta[project.category] || categoryMeta.default;
  const pct = project.progress;
  const hasImage = project.image && !String(project.image).includes('undefined');
  const remaining = Math.max(0, project.goal - project.raised);
  const donors = convexDonations?.length || 0;

  const heroStyle = hasImage
    ? { backgroundImage: `url(${project.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(160deg,#021718,#052E2F,#0d7477)' };

  return (
    <div dir="rtl" style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', background: '#f6f8f8', minHeight: '100vh' }}>

      {/* Preview Banner */}
      {preview && (
        <div style={{ position: 'sticky', top: 0, zIndex: 60, background: '#0d7477', color: 'white', padding: '12px 24px', textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
          وضع المعاينة — هذا المشروع لم يُنشر بعد
        </div>
      )}

      {/* ── PROJECT HERO ── */}
      <div style={{ position: 'relative', height: isMobile ? 280 : 420, ...heroStyle, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.75) 0%,rgba(0,0,0,.2) 50%,transparent 100%)' }} />
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{ position: 'absolute', top: 20, right: 20, zIndex: 3, width: 40, height: 40, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, cursor: 'pointer', border: 'none' }}
        >
          ←
        </button>
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1200, width: '100%', margin: '0 auto', padding: isMobile ? '0 16px 24px' : '0 28px 32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 600, marginBottom: 12 }}>
            {cat.icon} {cat.label}
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, color: 'white', marginBottom: 8 }}>
            {getLocalizedText(project.title, language)}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.7)', flexWrap: 'wrap' }}>
            <span>📍 {getLocalizedText(project.location, language)}</span>
            <span>|</span>
            <span>⏳ {project.daysLeft} يوماً متبقياً</span>
          </div>
        </div>
      </div>

      {/* ── STICKY FUNDING BAR (desktop only — avoid covering mobile screen) ── */}
      <div style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : 64, zIndex: 40, background: 'white', borderBottom: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '12px 16px' : '12px 28px', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0A5F62', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
            {project.raised.toLocaleString('en-US')} د.م
          </div>
          <div style={{ flex: 1, height: 8, background: '#E5E9EB', borderRadius: 100, overflow: 'hidden', minWidth: 80 }}>
            <div style={{ height: '100%', background: '#0d7477', borderRadius: 100, width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{pct}% من الهدف</div>
          <button
            onClick={handleDonateClick}
            style={{ height: 44, padding: '0 22px', background: '#0d7477', color: 'white', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(13,116,119,0.25)', flexShrink: 0 }}
          >
            تبرع الآن
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]" style={{ gap: 40, alignItems: 'start', maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '40px 28px' }}>

          {/* ── LEFT: Description & Donors ── */}
          <div>
            {/* About */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#0d7477', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
              ABOUT THE PROJECT
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>عن المشروع</h2>
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>
              {getLocalizedText(project.description, language)}
            </p>

            <div style={{ height: 1, background: '#E5E9EB', margin: '28px 0' }} />

            {/* Impact — only shown if the project has custom benefit cards */}
            {project.benefitCards && project.benefitCards.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#0d7477', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                  YOUR IMPACT
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>ماذا يفعل تبرعك؟</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3" style={{ gap: 16 }}>
                  {project.benefitCards.map((card, i) => (
                    <div key={i} style={{ background: '#F0F7F7', borderRadius: 14, padding: 18, textAlign: 'center' }}>
                      <div style={{ width: 44, height: 44, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', fontSize: 28, lineHeight: 1 }}>{card.icon}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>{card.value}</div>
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{card.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: '#E5E9EB', margin: '28px 0' }} />
              </>
            )}

            {/* Donors */}
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#0d7477', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
              GENEROUS DONORS
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
              المتبرعون الكرام{' '}
              <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>({donors} متبرع)</span>
            </h2>

            {convexDonations && convexDonations.length > 0 ? (
              convexDonations.map((donation, i) => (
                <div key={donation._id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #E5E9EB' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#CCF0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>👤</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>
                      {donation.isAnonymous ? 'متبرع مجهول' : (donation.donorName || 'متبرع كريم')}
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>
                      {donation._creationTime ? new Date(donation._creationTime).toLocaleDateString('ar-MA') : ''}
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A5F62', fontFamily: 'Inter, sans-serif', marginRight: 'auto', marginLeft: 0 }}>
                    {((donation.amount || 0) / 100).toLocaleString('en-US')} د.م
                  </div>
                </div>
              ))
            ) : (
              <p style={{ fontSize: 14, color: '#94a3b8', padding: '16px 0' }}>كن أول من يتبرع لهذا المشروع!</p>
            )}

            <div style={{ marginTop: 16 }}>
              <button
                style={{ height: 36, padding: '0 16px', background: '#E6F4F4', color: '#0A5F62', border: 'none', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
              >
                عرض جميع المتبرعين →
              </button>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div style={{ background: 'white', borderRadius: 18, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)', padding: 24, position: 'sticky', top: 130 }}>
            {/* Goal numbers */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>تم جمع</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                    {project.raised.toLocaleString('en-US')} د.م
                  </div>
                </div>
                <div style={{ textAlign: 'left', fontSize: 13, color: '#94a3b8' }}>
                  <div>من أصل</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#0e1a1b' }}>{project.goal.toLocaleString('en-US')} د.م</div>
                </div>
              </div>
              <div style={{ height: 12, background: '#E5E9EB', borderRadius: 100, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ height: '100%', background: '#0d7477', borderRadius: 100, width: `${pct}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8' }}>
                <span><strong style={{ color: '#0d7477' }}>{pct}%</strong> مكتمل</span>
                <span>⏳ {project.daysLeft} يوم متبقي</span>
              </div>
            </div>

            {/* Stats strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: '#E5E9EB', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
              {[
                { num: donors, label: 'متبرع' },
                { num: remaining.toLocaleString('en-US'), label: 'درهم متبقي' },
                { num: project.daysLeft, label: 'يوم متبقي' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#0e1a1b', fontFamily: 'Inter, sans-serif' }}>{s.num}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Donate button */}
            <button
              onClick={handleDonateClick}
              style={{ width: '100%', height: 56, background: '#0d7477', color: 'white', border: 'none', borderRadius: 16, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,0.25)', fontFamily: 'Tajawal, sans-serif', marginBottom: 12 }}
            >
              تبرع الآن 💚
            </button>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#94a3b8' }}>
              🔒 تبرعك آمن ومحمي بالكامل
            </div>

            {/* Share row */}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: '1px solid #E5E9EB' }}>
              {[
                { icon: '📘', label: 'شارك' },
                { icon: '💬', label: 'واتساب' },
                { icon: copied ? '✅' : '🔗', label: copied ? 'تم النسخ' : 'نسخ الرابط' },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={i === 2 ? handleCopyLink : undefined}
                  style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 600, border: '1.5px solid #E5E9EB', background: 'white', color: '#64748b', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>

            {/* Certification box */}
            <div style={{ marginTop: 20, padding: 14, background: '#F0F7F7', borderRadius: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0A5F62', marginBottom: 6 }}>✓ جمعية معتمدة رسمياً</div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>تبرعاتكم تصل مباشرة إلى المشروع · نشر تقارير دورية للإنجاز</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
