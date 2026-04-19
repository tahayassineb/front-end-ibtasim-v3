import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

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
// KAFALA DETAIL PAGE — Orphan profile + sponsor CTA
// ============================================

export default function KafalaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage } = useApp();
  const isMobile = useIsMobile();
  const lang = currentLanguage?.code || 'ar';

  const data = useQuery(api.kafala.getKafalaById, { kafalaId: id });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sponsored') === 'true') {
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 3000);
    }
  }, []);

  const t = {
    ar: { back: '← العودة لقائمة الأيتام', age: 'العمر', location: 'المدينة', monthly: 'التكلفة الشهرية', perMonth: 'درهم / شهر', bio: 'قصة اليتيم', sponsor_btn: 'اكفله الآن', sponsored_msg: 'هذا اليتيم مكفول حالياً', sponsored_sub: 'شكراً لكافله الكريم. يمكنك الاطلاع على كفالات أخرى.', browse_more: 'تصفح كفالات أخرى', loading: 'جاري التحميل...', notfound: 'الكفالة غير موجودة', male: 'ذكر', female: 'أنثى', success_msg: 'تم تسجيل كفالتك بنجاح! جزاك الله خيراً.' },
    fr: { back: '← Retour à la liste', age: 'Âge', location: 'Ville', monthly: 'Kafala mensuelle', perMonth: 'MAD/mois', bio: 'Histoire', sponsor_btn: 'Parrainer maintenant', sponsored_msg: 'Cet orphelin est déjà parrainé', sponsored_sub: "Découvrez d'autres kafalas.", browse_more: 'Voir d\'autres kafalas', loading: 'Chargement...', notfound: 'Kafala introuvable', male: 'Garçon', female: 'Fille', success_msg: 'Votre kafala a été enregistrée!' },
    en: { back: '← Back to list', age: 'Age', location: 'City', monthly: 'Monthly Kafala', perMonth: 'MAD/month', bio: 'Story', sponsor_btn: 'Sponsor Now', sponsored_msg: 'This orphan is already sponsored', sponsored_sub: 'Browse other available kafalas.', browse_more: 'Browse other kafalas', loading: 'Loading...', notfound: 'Kafala not found', male: 'Male', female: 'Female', success_msg: 'Your kafala has been registered!' },
  };
  const tx = t[lang] || t.ar;

  const getBioText = (bio) => {
    if (!bio) return '';
    if (typeof bio === 'string') return bio;
    return bio[lang] || bio.ar || bio.en || '';
  };

  if (data === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
          <p style={{ color: '#94a3b8' }}>{tx.loading}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8', fontFamily: 'Tajawal, sans-serif', color: '#64748b' }}>
        {tx.notfound}
      </div>
    );
  }

  const kafala = data;
  const isSponsored = kafala.status === 'sponsored';
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const params = new URLSearchParams(window.location.search);
  const justSponsored = params.get('sponsored') === 'true';
  const monthlyAmount = ((kafala.monthlyPrice || 30000) / 100).toLocaleString('fr-MA');

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(160deg,#3D2506,#6B4F12,#C4A882)', padding: isMobile ? '36px 0 28px' : '60px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px' : '0 28px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'center', gap: isMobile ? 16 : 48, textAlign: isMobile ? 'center' : 'right' }}>
          {/* Avatar */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: isMobile ? 100 : 180, height: isMobile ? 100 : 180, borderRadius: '50%', background: 'linear-gradient(135deg,#6B4F12,#C4A882)', border: '5px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 44 : 80, boxShadow: '0 12px 32px rgba(0,0,0,.3)', overflow: 'hidden' }}>
              <KafalaAvatar gender={kafala.gender} photo={kafala.photo} photoUrl={photoUrl} size={isMobile ? 100 : 180} />
            </div>
          </div>
          {/* Text */}
          <div style={{ width: isMobile ? '100%' : 'auto' }}>
            <button onClick={() => navigate('/kafala')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.75)', fontSize: 13, fontWeight: 600, marginBottom: 14, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'Tajawal, sans-serif' }}>
              {tx.back}
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.9)', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
              {isSponsored ? '🤲 مكفول · Sponsored' : '🤲 متاح للكفالة · Available'}
            </div>
            <h1 style={{ fontSize: isMobile ? 26 : 40, fontWeight: 900, color: 'white', marginBottom: 6 }}>{kafala.name}</h1>
            <div style={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap', gap: isMobile ? 10 : 20, fontSize: 14, color: 'rgba(255,255,255,.75)' }}>
              <span>🎂 {kafala.age} {lang === 'ar' ? 'سنوات' : lang === 'fr' ? 'ans' : 'yrs'}</span>
              <span>📍 {kafala.location}</span>
              <span>{kafala.gender === 'female' ? `👧 ${tx.female}` : `👦 ${tx.male}`}</span>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', justifyContent: isMobile ? 'center' : 'flex-start', gap: 4 }}>
              <span style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{monthlyAmount}</span>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>{tx.perMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky CTA bar (mirrors ProjectDetail sticky funding bar) */}
      {!isSponsored && (
        <div style={{ position: isMobile ? 'relative' : 'sticky', top: isMobile ? 'auto' : 64, zIndex: 40, background: 'white', borderBottom: '1px solid #E8D4B0', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '12px 16px' : '12px 28px', display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24 }}>
            <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#8B6914', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
              {monthlyAmount} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>درهم/شهر</span>
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => navigate(`/kafala/${kafala._id}/sponsor`)}
              style={{ height: 44, padding: '0 22px', background: '#8B6914', color: 'white', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(196,168,130,.35)', flexShrink: 0 }}
            >
              🤲 اكفله الآن
            </button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {justSponsored && (
        <div style={{ maxWidth: 1200, margin: '20px auto 0', padding: '0 28px' }}>
          <div style={{ background: '#D1FAE5', border: '1px solid #6ee7b7', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24 }}>✅</span>
            <p style={{ color: '#065f46', fontWeight: 600 }}>{tx.success_msg}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '40px 28px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 360px', gap: isMobile ? 24 : 40, alignItems: 'start' }}>

        {/* Left column */}
        <div>
          {/* Bio */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#8B6914', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>قصة {kafala.name}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>من هو {kafala.name}؟</h2>
          {getBioText(kafala.bio) ? (
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>{getBioText(kafala.bio)}</p>
          ) : (
            <>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>
                {kafala.name} طفل يتيم بالغ من العمر {kafala.age} سنوات، يعيش في منطقة {kafala.location}. يحتاج إلى دعم مستمر ليواصل تعليمه ويحقق أحلامه.
              </p>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85, marginTop: 12 }}>
                كفالتك الشهرية ستوفر له التعليم والغذاء والرعاية الصحية التي يحتاجها كل طفل لينمو بصحة وأمان.
              </p>
            </>
          )}

          <div style={{ height: 1, background: '#E5E9EB', margin: '24px 0' }} />

          {/* Needs breakdown */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#8B6914', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>احتياجاته الشهرية</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>ما الذي تغطيه الكفالة؟</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 14 }}>
            {[
              { icon: '📚', label: 'التعليم', amount: '120 د.م' },
              { icon: '🍞', label: 'الغذاء', amount: '100 د.م' },
              { icon: '🏥', label: 'الصحة', amount: '80 د.م' },
            ].map((need, i) => (
              <div key={i} style={{ background: '#F5EBD9', borderRadius: 14, padding: 18, textAlign: 'center', border: '1px solid #E8D4B0' }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{need.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8B6914', marginBottom: 4 }}>{need.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#8B6914' }}>{need.amount}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>/ شهر</div>
              </div>
            ))}
          </div>

          {/* Coverage bar */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: '#8B6914' }}>{monthlyAmount} درهم شهرياً تغطي كافة احتياجاته</span>
              <span style={{ color: '#94a3b8' }}>100%</span>
            </div>
            <div style={{ height: 10, background: '#E8D4B0', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: '#8B6914', borderRadius: 100 }} />
            </div>
          </div>

          {/* What you get as a sponsor */}
          <div style={{ height: 1, background: '#E5E9EB', margin: '24px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#8B6914', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>مزايا الكافل</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>ماذا تحصل عليه كافلاً؟</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 12 }}>
            {[
              { icon: '📊', text: 'تقارير ربع سنوية عن الطفل ودراسته' },
              { icon: '📸', text: 'صور دورية لأحوال الطفل ونموه' },
              { icon: '💬', text: 'تواصل مباشر مع فريق الكفالة' },
              { icon: '🔒', text: 'دفع آمن ومحمي بالكامل' },
              { icon: '✅', text: 'جمعية معتمدة رسمياً من الدولة' },
              { icon: '🔄', text: 'إلغاء مجاني في أي وقت دون شروط' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F5EBD9', borderRadius: 12, padding: '12px 16px', border: '1px solid #E8D4B0' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(139,105,20,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{f.icon}</div>
                <span style={{ fontSize: 13, color: '#64748b', lineHeight: 1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Mid-page sponsor CTA */}
          {!isSponsored && (
            <div style={{ margin: '24px 0', background: '#F5EBD9', borderRadius: 18, padding: '20px 24px', border: '1.5px solid #E8D4B0', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#8B6914', fontWeight: 600, marginBottom: 12 }}>
                🤲 كفالتك الشهرية تغطي تعليم {kafala.name} وغذاءه وصحته
              </div>
              <button
                onClick={() => navigate(`/kafala/${kafala._id}/sponsor`)}
                style={{ width: '100%', height: 52, background: '#8B6914', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(196,168,130,.35)', marginBottom: 8 }}
              >
                اكفل {kafala.name} بـ {monthlyAmount} درهم/شهر
              </button>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>بدون التزام طويل المدى · يمكنك الإلغاء متى شئت</div>
            </div>
          )}

          <div style={{ height: 1, background: '#E5E9EB', margin: '24px 0' }} />

          {/* Testimonials */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#8B6914', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>شهادات الكافلين</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>ماذا قال من كفلوا قبلك؟</h2>
          {[
            { text: '"تجربة الكفالة غيّرت طريقة تفكيري — أصبحت أشعر بأن لي فرداً آخر في أسرتي يحتاجني ويدعو لي."', author: 'أحمد الإدريسي — كافل منذ 2023' },
            { text: '"أروع قرار اتخذته في حياتي — الجمعية ترسل لي تقارير ربع سنوية عن الطفل المكفول وهذا يمنحني الطمأنينة الكاملة."', author: 'فاطمة العلوي — كافلة منذ 2022' },
          ].map((t, i) => (
            <div key={i} style={{ background: '#F5EBD9', borderRadius: 14, padding: 20, borderRight: '3px solid #C4A882', marginBottom: 12 }}>
              <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 10 }}>{t.text}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#8B6914' }}>{t.author}</div>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <Link to="/kafala" style={{ display: 'inline-flex', height: 44, padding: '0 22px', background: '#E6F4F4', color: '#0A5F62', borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: 'none', alignItems: 'center' }}>
              ← تصفح أيتاماً آخرين
            </Link>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ background: 'white', borderRadius: 18, border: '1.5px solid #E8D4B0', boxShadow: '0 4px 14px rgba(196,168,130,.35)', padding: 24, position: isMobile ? 'static' : 'sticky', top: 80 }}>
          {isSponsored ? (
            <>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤲</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{tx.sponsored_msg}</div>
                <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, marginBottom: 20 }}>{tx.sponsored_sub}</div>
                <Link to="/kafala" style={{ display: 'inline-flex', height: 52, padding: '0 28px', background: '#8B6914', color: 'white', borderRadius: 14, fontSize: 15, fontWeight: 700, textDecoration: 'none', alignItems: 'center', boxShadow: '0 4px 14px rgba(196,168,130,.35)' }}>
                  {tx.browse_more}
                </Link>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#D1FAE5', color: '#16a34a', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
                ✓ متاح للكفالة الآن
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>التكلفة الشهرية</div>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#8B6914', fontFamily: 'Inter, sans-serif' }}>{monthlyAmount}</span>
                <span style={{ fontSize: 14, color: '#94a3b8' }}> {tx.perMonth}</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, padding: 12, background: '#F5EBD9', borderRadius: 10, marginTop: 8 }}>
                🤲 كفالتك الشهرية تُجدَّد تلقائياً — يمكنك الإلغاء في أي وقت
              </div>
              <button
                onClick={() => navigate(`/kafala/${kafala._id}/sponsor`)}
                style={{ width: '100%', height: 56, background: '#8B6914', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(196,168,130,.35)', fontFamily: 'Tajawal, sans-serif', margin: '20px 0 8px' }}
              >
                🤲 اكفل {kafala.name} الآن
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>بدون التزام طويل المدى · يمكنك الإلغاء متى شئت</div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}