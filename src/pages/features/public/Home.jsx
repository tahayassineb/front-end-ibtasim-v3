import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import { formatMAD } from '../../../lib/money';
import HeroScrollAnimation from '../../../components/HeroScrollAnimation';

const copy = {
  ar: {
    featuredProjects: 'مشاريع مختارة',
    projectsText: 'اختر المشروع الذي تريد دعمه. كل تبرع مؤكد يظهر أثره مباشرة.',
    viewProjects: 'عرض جميع المشاريع',
    donate: 'تبرع الآن',
    kafala: 'كفالات مختارة',
    kafalaText: 'اكفل يتيما وساهم في رعايته الشهرية وتعليمه واستقراره.',
    sponsor: 'اكفل الآن',
    stories: 'قصص وأخبار',
    storiesText: 'تابع أثر التبرعات والكفالات على أرض الواقع.',
    read: 'قراءة المزيد',
    aboutTitle: 'من هي ابتسام؟',
    aboutText: 'تعرف على رسالتنا وطريقة عملنا مع المشاريع والكفالة والتواصل مع المحسنين.',
    aboutCta: 'تعرف علينا',
    contactTitle: 'تواصل معنا',
    contactText: 'لديك سؤال أو تريد مساعدة في التبرع؟ فريقنا يتابع الرسائل من لوحة الإدارة.',
    contactCta: 'اتصل بنا',
  },
  fr: {
    featuredProjects: 'Projets sélectionnés',
    projectsText: 'Choisissez le projet à soutenir. Chaque don vérifié alimente les statistiques en direct.',
    viewProjects: 'Voir tous les projets',
    donate: 'Donner',
    kafala: 'Kafala sélectionnée',
    kafalaText: 'Parrainez un enfant et soutenez ses besoins mensuels, son éducation et sa stabilité.',
    sponsor: 'Parrainer',
    stories: 'Histoires et actualités',
    storiesText: 'Suivez l’impact réel des dons et des parrainages.',
    read: 'Lire',
    aboutTitle: 'Qui est Ibtasim ?',
    aboutText: 'Découvrez notre mission et notre manière de gérer projets, kafala et relation donateurs.',
    aboutCta: 'Découvrir',
    contactTitle: 'Contactez-nous',
    contactText: 'Une question ou besoin d’aide pour donner ? Notre équipe suit les messages depuis l’administration.',
    contactCta: 'Contact',
  },
  en: {
    featuredProjects: 'Featured projects',
    projectsText: 'Choose the project you want to support. Every verified donation is reflected in live stats.',
    viewProjects: 'View all projects',
    donate: 'Donate now',
    kafala: 'Featured kafala',
    kafalaText: 'Sponsor a child and support monthly care, education, and stability.',
    sponsor: 'Sponsor now',
    stories: 'Stories and updates',
    storiesText: 'Follow the real-world impact of donations and sponsorships.',
    read: 'Read more',
    aboutTitle: 'Who is Ibtasim?',
    aboutText: 'Learn about our mission and how we manage projects, kafala, and donor communication.',
    aboutCta: 'About us',
    contactTitle: 'Contact us',
    contactText: 'Have a question or need help donating? Our team follows messages from the admin panel.',
    contactCta: 'Contact',
  },
};

const getText = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.ar || value.fr || value.en || '';
};

const sectionStyle = { maxWidth: 1180, margin: '0 auto', padding: '64px 24px' };

export default function Home() {
  const { language, currentLanguage } = useApp();
  const lang = currentLanguage?.code || language || 'ar';
  const t = copy[lang] || copy.ar;
  const navigate = useNavigate();

  const projects = useQuery(api.projects.getProjects, { featured: true, limit: 6 });
  const kafala = useQuery(api.kafala.getPublicKafalaList, { featured: true, limit: 6 });
  const stories = useQuery(api.stories.getPublishedStories, {});
  const stats = useQuery(api.admin.getDashboardStats, {});

  const featuredStories = useMemo(() => (stories || []).filter((story) => story.isFeatured).slice(0, 3), [stories]);

  return (
    <div dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ fontFamily: lang === 'ar' ? 'var(--font-arabic)' : 'Inter, sans-serif', color: '#0e1a1b', background: 'white' }}>
      <HeroScrollAnimation onDonate={() => navigate('/projects')} />

      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'end', marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <div style={{ color: '#0d7477', fontWeight: 900, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase' }}>PROJECTS</div>
            <h2 style={{ fontSize: 34, fontWeight: 900, margin: '8px 0' }}>{t.featuredProjects}</h2>
            <p style={{ color: '#64748b', maxWidth: 560, lineHeight: 1.7 }}>{t.projectsText}</p>
          </div>
          <Link to="/projects" style={{ color: '#0d7477', fontWeight: 900, textDecoration: 'none' }}>{t.viewProjects}</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
          {(projects || []).slice(0, 3).map((project) => {
            const image = convexFileUrl(project.mainImage) || project.mainImage;
            const pct = project.goalAmount ? Math.min(Math.round((project.raisedAmount || 0) / project.goalAmount * 100), 100) : 0;
            return (
              <article key={project._id} onClick={() => navigate(`/projects/${project._id}`)} style={{ border: '1px solid #E5E9EB', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,.05)' }}>
                <div style={{ height: 180, background: '#E6F4F4' }}>{image && <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                <div style={{ padding: 18 }}>
                  <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 900 }}>{getText(project.title, lang)}</h3>
                  <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.6, height: 42, overflow: 'hidden' }}>{getText(project.description, lang)}</p>
                  <div style={{ height: 8, background: '#E5E9EB', borderRadius: 99, overflow: 'hidden', margin: '14px 0 8px' }}><div style={{ width: `${pct}%`, height: '100%', background: '#0d7477' }} /></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}><strong>{formatMAD(project.raisedAmount || 0, lang)}</strong><span>{pct}%</span></div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section style={{ background: '#0A5F62', color: 'white' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '34px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 20, textAlign: 'center' }}>
          <div><strong style={{ fontSize: 30 }}>{formatMAD(stats?.projectStats?.collected || 0, lang)}</strong><div style={{ color: '#8ee4e4', marginTop: 6 }}>{t.featuredProjects}</div></div>
          <div><strong style={{ fontSize: 30 }}>{stats?.kafalaStats?.activeSponsorships || 0}</strong><div style={{ color: '#8ee4e4', marginTop: 6 }}>{t.kafala}</div></div>
          <div><strong style={{ fontSize: 30 }}>{stats?.projectStats?.donationCount || 0}</strong><div style={{ color: '#8ee4e4', marginTop: 6 }}>{t.donate}</div></div>
        </div>
      </section>

      <section style={{ ...sectionStyle, background: '#F8F4EC', maxWidth: 'none' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ color: '#8B6914', fontWeight: 900, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase' }}>KAFALA</div>
            <h2 style={{ fontSize: 34, fontWeight: 900, margin: '8px 0' }}>{t.kafala}</h2>
            <p style={{ color: '#6B4F12', maxWidth: 560, lineHeight: 1.7 }}>{t.kafalaText}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 18 }}>
            {(kafala || []).slice(0, 4).map((item) => {
              const image = item.photo ? (convexFileUrl(item.photo) || item.photo) : null;
              return (
                <article key={item._id} style={{ background: 'white', border: '1px solid #E8D4B0', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ height: 160, background: 'linear-gradient(135deg,#3D2506,#8B6914)' }}>{image && <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                  <div style={{ padding: 16 }}>
                    <h3 style={{ margin: '0 0 6px', color: '#6B4F12', fontWeight: 900 }}>{item.name}</h3>
                    <div style={{ color: '#8B6914', fontSize: 12, marginBottom: 12 }}>{item.age} · {item.location}</div>
                    <Link to={item.status === 'active' ? `/kafala/${item._id}/sponsor` : `/kafala/${item._id}`} style={{ height: 40, borderRadius: 99, background: '#6B4F12', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', fontWeight: 900 }}>{t.sponsor}</Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ color: '#0d7477', fontWeight: 900, fontSize: 12, letterSpacing: '.14em', textTransform: 'uppercase' }}>STORIES</div>
          <h2 style={{ fontSize: 34, fontWeight: 900, margin: '8px 0' }}>{t.stories}</h2>
          <p style={{ color: '#64748b', maxWidth: 560, lineHeight: 1.7 }}>{t.storiesText}</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 18 }}>
          {featuredStories.map((story) => (
            <Link key={story._id} to={`/stories/${story._id}`} style={{ border: '1px solid #E5E9EB', borderRadius: 16, overflow: 'hidden', textDecoration: 'none', color: '#0e1a1b', background: 'white' }}>
              <div style={{ height: 150, background: story.gradient || 'linear-gradient(135deg,#0A5F62,#33C0C0)' }} />
              <div style={{ padding: 16 }}>
                <h3 style={{ margin: '0 0 8px', fontWeight: 900 }}>{story.title}</h3>
                <p style={{ margin: 0, color: '#64748b', lineHeight: 1.6, fontSize: 13 }}>{story.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section style={{ background: '#f6f8f8' }}>
        <div style={{ ...sectionStyle, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 900 }}>{t.aboutTitle}</h2>
            <p style={{ color: '#64748b', lineHeight: 1.8 }}>{t.aboutText}</p>
            <Link to="/about" style={{ color: '#0d7477', fontWeight: 900, textDecoration: 'none' }}>{t.aboutCta}</Link>
          </div>
          <div>
            <h2 style={{ fontSize: 30, fontWeight: 900 }}>{t.contactTitle}</h2>
            <p style={{ color: '#64748b', lineHeight: 1.8 }}>{t.contactText}</p>
            <Link to="/contact" style={{ color: '#0d7477', fontWeight: 900, textDecoration: 'none' }}>{t.contactCta}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
