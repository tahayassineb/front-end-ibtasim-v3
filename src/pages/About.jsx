import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ============================================
// ABOUT PAGE - Mission, Vision & Team
// ============================================

const About = () => {
  const { t, language } = useApp();

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.ar;
  };

  const stats = [
    { num: '7', unit: 'سنوات', label: 'من العمل الخيري' },
    { num: '142K', unit: 'درهم', label: 'إجمالي التبرعات' },
    { num: '4,218', unit: 'متبرع', label: 'يثقون بنا' },
    { num: '1,200+', unit: 'أسرة', label: 'استفادت' },
    { num: '7', unit: 'مشاريع', label: 'مكتملة بنجاح' },
  ];

  const values = [
    { icon: '🔍', title: 'الشفافية', text: 'ننشر تقارير مالية دورية تفصيلية ونشارك صور وأدلة إنجاز كل مشروع' },
    { icon: '🤝', title: 'الأمانة', text: 'كل درهم تتبرع به يصل إلى المستفيد — لا مصاريف إدارية مخفية' },
    { icon: '📊', title: 'الأثر الحقيقي', text: 'نختار المشاريع بعناية بناءً على دراسات احتياج ميدانية وقياس الأثر' },
    { icon: '🌱', title: 'الاستدامة', text: 'مشاريعنا مصممة لتكون مستدامة ذاتياً وتخدم المجتمع لعقود' },
  ];

  const team = [
    { avatar: '👨', name: 'عبد الرحمن الحسني', role: 'المدير التنفيذي', bio: '15 سنة في المجال الخيري، خبير في إدارة المشاريع التنموية' },
    { avatar: '👩', name: 'مريم العلوي', role: 'مسؤولة المشاريع', bio: 'متخصصة في العمل الميداني وتقييم الاحتياجات الاجتماعية' },
    { avatar: '👨‍💻', name: 'يوسف بنموسى', role: 'مسؤول المالية', bio: 'محاسب معتمد مع خبرة في المنظمات غير الربحية' },
    { avatar: '👩‍🎓', name: 'آمنة الشرقاوي', role: 'مسؤولة التواصل', bio: 'إعلامية متخصصة في التواصل الاجتماعي والعلاقات العامة' },
  ];

  const timeline = [
    { year: '2018', title: 'التأسيس', text: 'تأسست الجمعية برؤية واضحة ومشروع أول ناجح لتوفير المياه في إقليم الرشيدية', current: false },
    { year: '2020', title: 'إطلاق برنامج الكفالة', text: 'إضافة برنامج كفالة الأيتام بكفالة 12 يتيماً في السنة الأولى', current: false },
    { year: '2022', title: 'منصة التبرع الرقمية', text: 'إطلاق المنصة الإلكترونية لتيسير التبرع ومتابعة المشاريع آنياً', current: false },
    { year: '2024', title: 'الاعتراف الوطني', text: 'حصول الجمعية على جائزة أفضل جمعية خيرية في المغرب من وزارة التضامن', current: false },
    { year: '2026', title: 'اليوم — نستمر 🌱', text: '12 مشروع نشط · 48 يتيم مكفول · 4,218 متبرع يثقون بنا', current: true },
  ];

  const certs = [
    { icon: '🏛', name: 'معتمدة من وزارة الداخلية', desc: 'رقم الاعتماد: 2018/4521' },
    { icon: '🌙', name: 'عضو صندوق محمد الخامس', desc: 'منذ 2020' },
    { icon: '📋', name: 'معفاة من الضرائب', desc: 'قرار وزاري 2019' },
    { icon: '🔒', name: 'شفافية مالية معتمدة', desc: 'مدققة سنوياً' },
    { icon: '🌍', name: 'شريك UNICEF', desc: 'منذ 2022' },
    { icon: '🏆', name: 'جائزة التميز الخيري', desc: 'وزارة التضامن 2024' },
  ];

  const sectionStyle = { padding: '72px 0' };
  const innerStyle = { maxWidth: 1200, margin: '0 auto', padding: '0 28px' };

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#021718,#052E2F 60%,#0d7477)', padding: '80px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#33C0C0', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            ABOUT US · من نحن
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: 'white', lineHeight: 1.15, marginBottom: 16 }}>
            نحن أداةٌ للخير<br />في أيدي المحسنين
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,.7)', lineHeight: 1.8, marginBottom: 28 }}>
            جمعية ابتسام للأعمال الخيرية تعمل منذ 2018 على ربط قلوب المحسنين باحتياجات الأسر المحتاجة في المغرب بكل شفافية وأمانة
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: 'rgba(255,255,255,.8)', borderRadius: 100, padding: '8px 18px', fontSize: 13, fontWeight: 500 }}>
            🏛 تأسست عام 2018 · الرباط، المغرب
          </div>
        </div>
      </div>

      {/* Stats band */}
      <div style={{ background: '#0A5F62', padding: '32px 0' }}>
        <div style={{ ...innerStyle, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '0 16px', borderLeft: i < stats.length - 1 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{s.num}</div>
              <div style={{ fontSize: 12, color: '#33C0C0', fontWeight: 600, marginTop: 2 }}>{s.unit}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mission & Vision */}
      <div style={{ ...sectionStyle, background: 'white' }}>
        <div style={innerStyle}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>MISSION & VISION</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>رسالتنا ورؤيتنا</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(135deg,#F0F7F7,#E6F4F4)' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🎯</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>رسالتنا</div>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>توفير منصة موثوقة وشفافة تربط المحسنين بالأسر المحتاجة، من خلال مشاريع تنموية مدروسة تحقق أثراً حقيقياً ومستداماً في مجالات التعليم والصحة والمياه والغذاء والسكن.</p>
            </div>
            <div style={{ padding: 32, borderRadius: 20, background: 'linear-gradient(135deg,#F5EBD9,#E8D4B0)' }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>🌟</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>رؤيتنا</div>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>مجتمع متكافل خالٍ من الفقر والحرمان، حيث تتوفر لكل أسرة مقومات الحياة الكريمة من تعليم وصحة وغذاء ومسكن لائق — وذلك بفضل التضامن والتكافل الاجتماعي.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Values */}
      <div style={sectionStyle}>
        <div style={innerStyle}>
          <div style={{ marginBottom: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>OUR VALUES</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>قيمنا الأساسية</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>هذه القيم تحكم كل قرار نتخذه وكل مشروع نطلقه</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
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
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>OUR TEAM</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2, marginBottom: 12 }}>فريق العمل</h2>
            <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }}>متطوعون وموظفون شغوفون يعملون من أجل خدمة المجتمع</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
            {team.map((m, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', padding: 24, textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#CCF0F0,#E6F4F4)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34 }}>{m.avatar}</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 13, color: '#0A5F62', fontWeight: 600, marginBottom: 8 }}>{m.role}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>{m.bio}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline + Certifications */}
      <div style={sectionStyle}>
        <div style={innerStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
            {/* Timeline */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>OUR JOURNEY</div>
              <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 32 }}>مسيرتنا</h2>
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
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>CERTIFICATIONS</div>
              <h2 style={{ fontSize: 34, fontWeight: 800, marginBottom: 28 }}>شهاداتنا واعتماداتنا</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
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
