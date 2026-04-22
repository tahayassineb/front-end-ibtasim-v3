import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
};

// ============================================
// ABOUT PAGE - Mission, Vision & Team
// ============================================

const ABOUT_COPY = {
  ar: {
    hero_badge: 'ABOUT US · من نحن',
    hero_title: 'نحن أداةٌ للخير\nفي أيدي المحسنين',
    hero_sub: 'جمعية ابتسام للأعمال الخيرية تعمل منذ 2018 على ربط قلوب المحسنين باحتياجات الأسر المحتاجة في المغرب بكل شفافية وأمانة',
    hero_badge2: '🏛 تأسست عام 2018 · الرباط، المغرب',
    stats: [
      { num: '7', unit: 'سنوات', label: 'من العمل الخيري' },
      { num: '142K', unit: 'درهم', label: 'إجمالي التبرعات' },
      { num: '4,218', unit: 'متبرع', label: 'يثقون بنا' },
      { num: '1,200+', unit: 'أسرة', label: 'استفادت' },
      { num: '7', unit: 'مشاريع', label: 'مكتملة بنجاح' },
    ],
    mission_badge: 'MISSION & VISION',
    mission_title: 'رسالتنا ورؤيتنا',
    mission_heading: 'رسالتنا',
    mission_text: 'توفير منصة موثوقة وشفافة تربط المحسنين بالأسر المحتاجة، من خلال مشاريع تنموية مدروسة تحقق أثراً حقيقياً ومستداماً في مجالات التعليم والصحة والمياه والغذاء والسكن.',
    vision_heading: 'رؤيتنا',
    vision_text: 'مجتمع متكافل خالٍ من الفقر والحرمان، حيث تتوفر لكل أسرة مقومات الحياة الكريمة من تعليم وصحة وغذاء ومسكن لائق — وذلك بفضل التضامن والتكافل الاجتماعي.',
    values_badge: 'OUR VALUES',
    values_title: 'قيمنا الأساسية',
    values_sub: 'هذه القيم تحكم كل قرار نتخذه وكل مشروع نطلقه',
    values: [
      { icon: '🔍', title: 'الشفافية', text: 'ننشر تقارير مالية دورية تفصيلية ونشارك صور وأدلة إنجاز كل مشروع' },
      { icon: '🤝', title: 'الأمانة', text: 'كل درهم تتبرع به يصل إلى المستفيد — لا مصاريف إدارية مخفية' },
      { icon: '📊', title: 'الأثر الحقيقي', text: 'نختار المشاريع بعناية بناءً على دراسات احتياج ميدانية وقياس الأثر' },
      { icon: '🌱', title: 'الاستدامة', text: 'مشاريعنا مصممة لتكون مستدامة ذاتياً وتخدم المجتمع لعقود' },
    ],
    team_badge: 'OUR TEAM',
    team_title: 'فريق العمل',
    team_sub: 'متطوعون وموظفون شغوفون يعملون من أجل خدمة المجتمع',
    team: [
      { avatar: '👨', name: 'عبد الرحمن الحسني', role: 'المدير التنفيذي', bio: '15 سنة في المجال الخيري، خبير في إدارة المشاريع التنموية' },
      { avatar: '👩', name: 'مريم العلوي', role: 'مسؤولة المشاريع', bio: 'متخصصة في العمل الميداني وتقييم الاحتياجات الاجتماعية' },
      { avatar: '👨‍💻', name: 'يوسف بنموسى', role: 'مسؤول المالية', bio: 'محاسب معتمد مع خبرة في المنظمات غير الربحية' },
      { avatar: '👩‍🎓', name: 'آمنة الشرقاوي', role: 'مسؤولة التواصل', bio: 'إعلامية متخصصة في التواصل الاجتماعي والعلاقات العامة' },
    ],
    timeline_badge: 'OUR JOURNEY',
    timeline_title: 'مسيرتنا',
    timeline: [
      { year: '2018', title: 'التأسيس', text: 'تأسست الجمعية برؤية واضحة ومشروع أول ناجح لتوفير المياه في إقليم الرشيدية', current: false },
      { year: '2020', title: 'إطلاق برنامج الكفالة', text: 'إضافة برنامج كفالة الأيتام بكفالة 12 يتيماً في السنة الأولى', current: false },
      { year: '2022', title: 'منصة التبرع الرقمية', text: 'إطلاق المنصة الإلكترونية لتيسير التبرع ومتابعة المشاريع آنياً', current: false },
      { year: '2024', title: 'الاعتراف الوطني', text: 'حصول الجمعية على جائزة أفضل جمعية خيرية في المغرب من وزارة التضامن', current: false },
      { year: '2026', title: 'اليوم — نستمر 🌱', text: '12 مشروع نشط · 48 يتيم مكفول · 4,218 متبرع يثقون بنا', current: true },
    ],
    certs_badge: 'CERTIFICATIONS',
    certs_title: 'شهاداتنا واعتماداتنا',
    certs: [
      { icon: '🏛', name: 'معتمدة من وزارة الداخلية', desc: 'رقم الاعتماد: 2018/4521' },
      { icon: '🌙', name: 'عضو صندوق محمد الخامس', desc: 'منذ 2020' },
      { icon: '📋', name: 'معفاة من الضرائب', desc: 'قرار وزاري 2019' },
      { icon: '🔒', name: 'شفافية مالية معتمدة', desc: 'مدققة سنوياً' },
      { icon: '🌍', name: 'شريك UNICEF', desc: 'منذ 2022' },
      { icon: '🏆', name: 'جائزة التميز الخيري', desc: 'وزارة التضامن 2024' },
    ],
  },
  fr: {
    hero_badge: 'À PROPOS DE NOUS',
    hero_title: 'Un instrument du bien\nentre les mains des bienfaiteurs',
    hero_sub: "L'association Ibtasim œuvre depuis 2018 pour relier les donateurs aux familles dans le besoin au Maroc, en toute transparence et honnêteté.",
    hero_badge2: '🏛 Fondée en 2018 · Rabat, Maroc',
    stats: [
      { num: '7', unit: 'ans', label: "d'action caritative" },
      { num: '142K', unit: 'MAD', label: 'de dons collectés' },
      { num: '4 218', unit: 'donateurs', label: 'nous font confiance' },
      { num: '1 200+', unit: 'familles', label: 'bénéficiaires' },
      { num: '7', unit: 'projets', label: 'achevés avec succès' },
    ],
    mission_badge: 'MISSION & VISION',
    mission_title: 'Notre mission et vision',
    mission_heading: 'Notre mission',
    mission_text: "Offrir une plateforme fiable et transparente qui relie les donateurs aux familles dans le besoin, à travers des projets de développement soigneusement sélectionnés dans les domaines de l'éducation, de la santé, de l'eau, de l'alimentation et du logement.",
    vision_heading: 'Notre vision',
    vision_text: "Une société solidaire, libre de la pauvreté, où chaque famille a accès aux conditions d'une vie digne : éducation, santé, alimentation et logement décent — grâce à la solidarité et à l'entraide sociale.",
    values_badge: 'NOS VALEURS',
    values_title: 'Nos valeurs',
    values_sub: 'Ces valeurs guident chaque décision que nous prenons et chaque projet que nous lançons.',
    values: [
      { icon: '🔍', title: 'Transparence', text: 'Nous publions des rapports financiers détaillés et partageons photos et preuves de réalisation pour chaque projet.' },
      { icon: '🤝', title: 'Intégrité', text: "Chaque dirham que vous donnez parvient au bénéficiaire — aucun frais administratif caché." },
      { icon: '📊', title: 'Impact réel', text: "Nous sélectionnons les projets avec soin, sur la base d'études de terrain et d'une mesure rigoureuse de l'impact." },
      { icon: '🌱', title: 'Durabilité', text: 'Nos projets sont conçus pour être autonomes et servir la communauté pendant des décennies.' },
    ],
    team_badge: 'NOTRE ÉQUIPE',
    team_title: 'Notre équipe',
    team_sub: 'Des bénévoles et employés passionnés au service de la communauté.',
    team: [
      { avatar: '👨', name: 'Abderrahman Al-Hassani', role: 'Directeur général', bio: '15 ans dans le secteur caritatif, expert en gestion de projets de développement.' },
      { avatar: '👩', name: 'Maryam Al-Alawi', role: 'Responsable projets', bio: 'Spécialisée dans le travail de terrain et l\'évaluation des besoins sociaux.' },
      { avatar: '👨‍💻', name: 'Youssef Benmoussa', role: 'Responsable financier', bio: 'Comptable certifié avec expérience dans les organisations à but non lucratif.' },
      { avatar: '👩‍🎓', name: 'Amina Charqawi', role: 'Responsable communication', bio: 'Journaliste spécialisée en communication digitale et relations publiques.' },
    ],
    timeline_badge: 'NOTRE PARCOURS',
    timeline_title: 'Notre parcours',
    timeline: [
      { year: '2018', title: 'Fondation', text: "L'association est fondée avec une vision claire et un premier projet réussi d'approvisionnement en eau dans la province d'Errachidia.", current: false },
      { year: '2020', title: 'Programme Kafala', text: "Lancement du programme de parrainage d'orphelins avec 12 enfants pris en charge la première année.", current: false },
      { year: '2022', title: 'Plateforme numérique', text: 'Lancement de la plateforme en ligne pour faciliter les dons et suivre les projets en temps réel.', current: false },
      { year: '2024', title: 'Reconnaissance nationale', text: "L'association reçoit le prix de la meilleure association caritative au Maroc décerné par le ministère de la Solidarité.", current: false },
      { year: '2026', title: "Aujourd'hui — nous continuons 🌱", text: '12 projets actifs · 48 orphelins parrainés · 4 218 donateurs nous font confiance', current: true },
    ],
    certs_badge: 'CERTIFICATIONS',
    certs_title: 'Certifications et accréditations',
    certs: [
      { icon: '🏛', name: "Agréée par le ministère de l'Intérieur", desc: "N° d'agrément : 2018/4521" },
      { icon: '🌙', name: 'Membre du Fonds Mohammed V', desc: 'Depuis 2020' },
      { icon: '📋', name: 'Exonérée fiscalement', desc: 'Décret ministériel 2019' },
      { icon: '🔒', name: 'Transparence financière certifiée', desc: 'Auditée chaque année' },
      { icon: '🌍', name: 'Partenaire UNICEF', desc: 'Depuis 2022' },
      { icon: '🏆', name: "Prix d'excellence caritative", desc: 'Ministère de la Solidarité 2024' },
    ],
  },
  en: {
    hero_badge: 'ABOUT US',
    hero_title: 'An instrument of good\nin the hands of benefactors',
    hero_sub: 'Ibtasim Charitable Association has been working since 2018 to connect generous donors with families in need across Morocco — with full transparency and trust.',
    hero_badge2: '🏛 Founded 2018 · Rabat, Morocco',
    stats: [
      { num: '7', unit: 'years', label: 'of charitable work' },
      { num: '142K', unit: 'MAD', label: 'total donations' },
      { num: '4,218', unit: 'donors', label: 'trust us' },
      { num: '1,200+', unit: 'families', label: 'benefited' },
      { num: '7', unit: 'projects', label: 'completed' },
    ],
    mission_badge: 'MISSION & VISION',
    mission_title: 'Our Mission & Vision',
    mission_heading: 'Our Mission',
    mission_text: 'To provide a reliable and transparent platform connecting donors with families in need, through carefully designed development projects that create real, lasting impact in education, health, water, food, and housing.',
    vision_heading: 'Our Vision',
    vision_text: 'A cohesive society free of poverty and deprivation, where every family has access to the foundations of a dignified life: education, healthcare, food, and decent housing — made possible through solidarity and social solidarity.',
    values_badge: 'OUR VALUES',
    values_title: 'Our Core Values',
    values_sub: 'These values guide every decision we make and every project we launch.',
    values: [
      { icon: '🔍', title: 'Transparency', text: 'We publish detailed periodic financial reports and share photos and proof of completion for every project.' },
      { icon: '🤝', title: 'Integrity', text: 'Every dirham you donate reaches the beneficiary — no hidden administrative fees.' },
      { icon: '📊', title: 'Real Impact', text: 'We carefully select projects based on field needs assessments and measurable impact criteria.' },
      { icon: '🌱', title: 'Sustainability', text: 'Our projects are designed to be self-sustaining and serve the community for decades.' },
    ],
    team_badge: 'OUR TEAM',
    team_title: 'Our Team',
    team_sub: 'Passionate volunteers and staff dedicated to serving the community.',
    team: [
      { avatar: '👨', name: 'Abderrahman Al-Hassani', role: 'Executive Director', bio: '15 years in charity work, expert in development project management.' },
      { avatar: '👩', name: 'Maryam Al-Alawi', role: 'Projects Manager', bio: 'Specialist in field work and social needs assessment.' },
      { avatar: '👨‍💻', name: 'Youssef Benmoussa', role: 'Finance Manager', bio: 'Certified accountant with experience in non-profit organizations.' },
      { avatar: '👩‍🎓', name: 'Amina Charqawi', role: 'Communications Manager', bio: 'Media specialist in digital communications and public relations.' },
    ],
    timeline_badge: 'OUR JOURNEY',
    timeline_title: 'Our Journey',
    timeline: [
      { year: '2018', title: 'Founded', text: 'The association was founded with a clear vision and a first successful water supply project in the Errachidia province.', current: false },
      { year: '2020', title: 'Kafala Program Launch', text: 'Launched the orphan sponsorship program with 12 children sponsored in the first year.', current: false },
      { year: '2022', title: 'Digital Platform', text: 'Launched the online platform to facilitate donations and track projects in real time.', current: false },
      { year: '2024', title: 'National Recognition', text: 'The association received the Best Charitable Association in Morocco award from the Ministry of Solidarity.', current: false },
      { year: '2026', title: 'Today — We continue 🌱', text: '12 active projects · 48 orphans sponsored · 4,218 donors trust us', current: true },
    ],
    certs_badge: 'CERTIFICATIONS',
    certs_title: 'Certifications & Accreditations',
    certs: [
      { icon: '🏛', name: 'Accredited by Ministry of Interior', desc: 'Accreditation No: 2018/4521' },
      { icon: '🌙', name: 'Member of Mohammed V Foundation', desc: 'Since 2020' },
      { icon: '📋', name: 'Tax Exempt', desc: 'Ministerial decree 2019' },
      { icon: '🔒', name: 'Certified Financial Transparency', desc: 'Audited annually' },
      { icon: '🌍', name: 'UNICEF Partner', desc: 'Since 2022' },
      { icon: '🏆', name: 'Charitable Excellence Award', desc: 'Ministry of Solidarity 2024' },
    ],
  },
};

const About = () => {
  const { language } = useApp();
  const isMobile = useIsMobile();
  const c = ABOUT_COPY[language] || ABOUT_COPY.ar;
  const { stats, values, team, timeline, certs } = c;

  const sectionStyle = { padding: isMobile ? '40px 0' : '72px 0' };
  const innerStyle = { maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 16px' : '0 28px' };

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#021718,#052E2F 60%,#0d7477)', padding: isMobile ? '48px 20px' : '80px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '0' : '0 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#33C0C0', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            {c.hero_badge}
          </div>
          <h1 style={{ fontSize: isMobile ? 32 : 44, fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 16, whiteSpace: 'pre-line' }}>
            {c.hero_title}
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: 28 }}>
            {c.hero_sub}
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.8)', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 500 }}>
            {c.hero_badge2}
          </div>
        </div>
      </div>

      {/* Stats band */}
      <div style={{ background: '#0A5F62', padding: isMobile ? '24px 0' : '32px 0' }}>
        <div style={{ ...innerStyle, display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', rowGap: isMobile ? 16 : 0 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: isMobile ? '0 8px' : '0 16px', borderLeft: !isMobile && i < stats.length - 1 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
              <div style={{ fontSize: isMobile ? 24 : 34, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{s.num}</div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: '#33C0C0', fontWeight: 600, marginTop: 2 }}>{s.unit}</div>
              <div style={{ fontSize: isMobile ? 11 : 12, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission & Vision */}
      <div style={{ ...sectionStyle, background: 'white' }}>
        <div style={innerStyle}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{c.mission_badge}</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>{c.mission_title}</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 32 }}>
            <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(135deg,#F0F7F7,#E6F4F4)' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{c.mission_heading}</div>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>{c.mission_text}</p>
            </div>
            <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(135deg,#F5EBD9,#E8D4B0)' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🌟</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{c.vision_heading}</div>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>{c.vision_text}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={sectionStyle}>
        <div style={innerStyle}>
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{c.values_badge}</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>{c.values_title}</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>{c.values_sub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 12 : 24 }}>
            {values.map((v, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', padding: 24, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: '#E6F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>{v.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{v.title}</div>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team */}
      <div style={{ ...sectionStyle, background: 'white' }}>
        <div style={innerStyle}>
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{c.team_badge}</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>{c.team_title}</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>{c.team_sub}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 12 : 24 }}>
            {team.map((m, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', padding: isMobile ? 16 : 24, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
                <div style={{ width: isMobile ? 60 : 80, height: isMobile ? 60 : 80, borderRadius: '50%', background: 'linear-gradient(135deg,#CCF0F0,#E6F4F4)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 26 : 34 }}>{m.avatar}</div>
                <div style={{ fontSize: isMobile ? 13 : 16, fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: '#0A5F62', fontWeight: 600, marginBottom: 6 }}>{m.role}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{m.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline + Certifications */}
      <div style={sectionStyle}>
        <div style={innerStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 40 : 60, alignItems: 'start' }}>
            {/* Timeline */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{c.timeline_badge}</div>
              <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 32 }}>{c.timeline_title}</h2>
              <div style={{ position: 'relative', paddingRight: 28 }}>
                {/* Vertical line */}
                <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom,#33C0C0,#E6F4F4)' }} />
                {timeline.map((item, i) => (
                  <div key={i} style={{ position: 'relative', marginBottom: 36, paddingRight: 24 }}>
                    <div style={{ position: 'absolute', right: -6, top: 6, width: 12, height: 12, borderRadius: '50%', background: item.current ? '#33C0C0' : '#0d7477', border: '2px solid white', boxShadow: '0 0 0 3px #E6F4F4' }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0d7477', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>{item.year}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7 }}>{item.text}</div>
                  </div>
                ))}
              </div>
            </div>
            {/* Certifications */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{c.certs_badge}</div>
              <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 28 }}>{c.certs_title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: isMobile ? 12 : 20 }}>
                {certs.map((c, i) => (
                  <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E9EB', padding: 20, display: 'flex', alignItems: 'center', gap: 14, boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#E6F4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{c.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{c.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
