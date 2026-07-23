import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import KafalaAvatar from '../../../components/kafala/KafalaAvatar';
import { updatePageSeo } from '../../../lib/seo';

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

  const data = useQuery(api.kafala.getKafalaBySlugOrId, id ? { ref: id } : 'skip');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sponsored') === 'true') {
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 3000);
    }
  }, []);

  const t = {
    ar: { back: '← العودة لقائمة الأيتام', age: 'العمر', location: 'المدينة', monthly: 'التكلفة الشهرية', perMonth: 'درهم / شهر', currency: 'د.م', bio: 'قصة اليتيم', sponsor_btn: 'اكفله الآن', sponsored_msg: 'هذا اليتيم مكفول حالياً', sponsored_sub: 'شكراً لكافله الكريم. يمكنك الاطلاع على كفالات أخرى.', browse_more: 'تصفح كفالات أخرى', loading: 'جاري التحميل...', notfound: 'الكفالة غير موجودة', male: 'ذكر', female: 'أنثى', success_msg: 'تم تسجيل كفالتك بنجاح! جزاك الله خيراً.', sponsored: 'مكفول', available: 'متاح للكفالة', storyOf: 'قصة', whoIs: 'من هو', monthlyNeeds: 'احتياجاته الشهرية', covers: 'ما الذي تغطيه الكفالة؟', education: 'التعليم', food: 'الغذاء', health: 'الصحة', perMonthShort: '/ شهر', coversAll: 'شهرياً تغطي كافة احتياجاته', sponsorBenefits: 'مزايا الكافل', benefitsTitle: 'ماذا تحصل عليه كافلاً؟', benefitItems: ['تقارير ربع سنوية عن الطفل ودراسته', 'صور دورية لأحوال الطفل ونموه', 'تواصل مباشر مع فريق الكفالة', 'دفع آمن ومحمي بالكامل', 'جمعية معتمدة رسمياً من الدولة', 'إلغاء مجاني في أي وقت دون شروط'], sponsorFor: 'اكفل', noCommitment: 'بدون التزام طويل المدى · يمكنك الإلغاء متى شئت', availableNow: 'متاح للكفالة الآن', renews: 'كفالتك الشهرية تُجدَّد تلقائياً — يمكنك الإلغاء في أي وقت' },
    fr: { back: '← Retour à la liste', age: 'Âge', location: 'Ville', monthly: 'Kafala mensuelle', perMonth: 'MAD/mois', currency: 'MAD', bio: 'Histoire', sponsor_btn: 'Parrainer maintenant', sponsored_msg: 'Cet orphelin est déjà parrainé', sponsored_sub: "Découvrez d'autres kafalas.", browse_more: 'Voir d\'autres kafalas', loading: 'Chargement...', notfound: 'Kafala introuvable', male: 'Garçon', female: 'Fille', success_msg: 'Votre kafala a été enregistrée!', sponsored: 'Déjà parrainé', available: 'Disponible au parrainage', storyOf: 'L’histoire de', whoIs: 'Qui est', monthlyNeeds: 'BESOINS MENSUELS', covers: 'Que couvre le parrainage ?', education: 'Éducation', food: 'Alimentation', health: 'Santé', perMonthShort: '/ mois', coversAll: 'par mois couvrent tous ses besoins', sponsorBenefits: 'AVANTAGES DU PARRAIN', benefitsTitle: 'Ce que vous recevez en tant que parrain', benefitItems: ['Des rapports trimestriels sur l’enfant et ses études', 'Des photos régulières de son évolution', 'Un contact direct avec l’équipe kafala', 'Un paiement entièrement sécurisé', 'Une association officiellement agréée', 'Annulation gratuite à tout moment'], sponsorFor: 'Parrainer', noCommitment: 'Sans engagement à long terme · Annulation possible à tout moment', availableNow: 'Disponible au parrainage', renews: 'Votre parrainage est renouvelé automatiquement chaque mois — annulation possible à tout moment' },
    en: { back: '← Back to list', age: 'Age', location: 'City', monthly: 'Monthly Kafala', perMonth: 'MAD/month', currency: 'MAD', bio: 'Story', sponsor_btn: 'Sponsor Now', sponsored_msg: 'This orphan is already sponsored', sponsored_sub: 'Browse other available kafalas.', browse_more: 'Browse other kafalas', loading: 'Loading...', notfound: 'Kafala not found', male: 'Male', female: 'Female', success_msg: 'Your kafala has been registered!', sponsored: 'Sponsored', available: 'Available to sponsor', storyOf: 'THE STORY OF', whoIs: 'Who is', monthlyNeeds: 'MONTHLY NEEDS', covers: 'What does sponsorship cover?', education: 'Education', food: 'Food', health: 'Healthcare', perMonthShort: '/ month', coversAll: 'per month covers all essential needs', sponsorBenefits: 'SPONSOR BENEFITS', benefitsTitle: 'What do you receive as a sponsor?', benefitItems: ['Quarterly updates on the child and their education', 'Regular photos of the child’s wellbeing and growth', 'Direct contact with the kafala team', 'Fully secure payments', 'Officially accredited association', 'Free cancellation at any time'], sponsorFor: 'Sponsor', noCommitment: 'No long-term commitment · Cancel whenever you wish', availableNow: 'Available to sponsor now', renews: 'Your monthly sponsorship renews automatically — you can cancel at any time' },
  };
  const tx = t[lang] || t.ar;
  const fallbackBio = lang === 'fr'
    ? [`${data?.name || ''} est un enfant orphelin de ${data?.age || ''} ans qui vit à ${data?.location || ''}. Il a besoin d’un soutien continu pour poursuivre son éducation et réaliser ses rêves.`, 'Votre soutien mensuel lui apporte l’éducation, l’alimentation et les soins de santé nécessaires pour grandir en sécurité.']
    : lang === 'en'
      ? [`${data?.name || ''} is an orphaned child, ${data?.age || ''} years old, living in ${data?.location || ''}. Ongoing support helps them continue their education and pursue their dreams.`, 'Your monthly sponsorship provides the education, food, and healthcare every child needs to grow safely and confidently.']
      : [`${data?.name || ''} طفل يتيم بالغ من العمر ${data?.age || ''} سنوات، يعيش في منطقة ${data?.location || ''}. يحتاج إلى دعم مستمر ليواصل تعليمه ويحقق أحلامه.`, 'كفالتك الشهرية ستوفر له التعليم والغذاء والرعاية الصحية التي يحتاجها كل طفل لينمو بصحة وأمان.'];

  const getBioText = (bio) => {
    if (!bio) return '';
    if (typeof bio === 'string') return bio;
    return bio[lang] || bio.ar || bio.en || '';
  };

  const kafala = data;
  const photoUrl = kafala?.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;

  useEffect(() => {
    if (!kafala) return;
    const bio = !kafala.bio
      ? ''
      : typeof kafala.bio === 'string'
        ? kafala.bio
        : kafala.bio[lang] || kafala.bio.ar || kafala.bio.en || '';
    updatePageSeo({
      title: `${kafala.metaTitle || kafala.name} | Kafala | Association Espoir`,
      description: kafala.metaDescription || bio,
      canonicalPath: kafala.canonicalPath || `/kafala/${kafala.slug || kafala._id}`,
      image: photoUrl,
      schema: {
        '@context': 'https://schema.org',
        '@type': 'DonateAction',
        name: kafala.name,
        description: kafala.metaDescription || bio,
        url: `${window.location.origin}/kafala/${kafala.slug || kafala._id}`,
        recipient: { '@type': 'NGO', name: 'Association Espoir' },
      },
    });
  }, [kafala, photoUrl, lang]);

  if (data === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8', fontFamily: 'var(--font-arabic)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
          <p style={{ color: '#94a3b8' }}>{tx.loading}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8', fontFamily: 'var(--font-arabic)', color: '#64748b' }}>
        {tx.notfound}
      </div>
    );
  }

  const isSponsored = kafala.status === 'sponsored';
  const params = new URLSearchParams(window.location.search);
  const justSponsored = params.get('sponsored') === 'true';
  const monthlyAmount = Number(kafala.monthlyPrice || 300).toLocaleString('fr-MA');

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'var(--font-arabic)', color: '#0e1a1b' }}>

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
            <button onClick={() => navigate('/kafala')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,.75)', fontSize: 13, fontWeight: 600, marginBottom: 14, cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-arabic)' }}>
              {tx.back}
            </button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', color: 'rgba(255,255,255,.9)', borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
              🤲 {isSponsored ? tx.sponsored : tx.available}
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
              {monthlyAmount} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>{tx.perMonth}</span>
            </div>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => navigate(`/kafala/${kafala._id}/sponsor`)}
              style={{ height: 44, padding: '0 22px', background: '#8B6914', color: 'white', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: '0 4px 14px rgba(196,168,130,.35)', flexShrink: 0 }}
            >
              🤲 {tx.sponsor_btn}
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
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#8B6914', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{tx.storyOf} {kafala.name}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{tx.whoIs} {kafala.name}?</h2>
          {getBioText(kafala.bio) ? (
            <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>{getBioText(kafala.bio)}</p>
          ) : (
            <>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85 }}>
                {fallbackBio[0]}
              </p>
              <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.85, marginTop: 12 }}>
                {fallbackBio[1]}
              </p>
            </>
          )}

          <div style={{ height: 1, background: '#E5E9EB', margin: '24px 0' }} />

          {/* Needs breakdown */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#8B6914', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{tx.monthlyNeeds}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{tx.covers}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 14 }}>
            {[
              { icon: '📚', label: tx.education, amount: `120 ${tx.currency || 'MAD'}` },
              { icon: '🍞', label: tx.food, amount: `100 ${tx.currency || 'MAD'}` },
              { icon: '🏥', label: tx.health, amount: `80 ${tx.currency || 'MAD'}` },
            ].map((need, i) => (
              <div key={i} style={{ background: '#F5EBD9', borderRadius: 14, padding: 18, textAlign: 'center', border: '1px solid #E8D4B0' }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{need.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8B6914', marginBottom: 4 }}>{need.label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#8B6914' }}>{need.amount}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>{tx.perMonthShort}</div>
              </div>
            ))}
          </div>

          {/* Coverage bar */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
              <span style={{ fontWeight: 600, color: '#8B6914' }}>{monthlyAmount} {tx.perMonth} {tx.coversAll}</span>
              <span style={{ color: '#94a3b8' }}>100%</span>
            </div>
            <div style={{ height: 10, background: '#E8D4B0', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: '#8B6914', borderRadius: 100 }} />
            </div>
          </div>

          {/* What you get as a sponsor */}
          <div style={{ height: 1, background: '#E5E9EB', margin: '24px 0' }} />
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#8B6914', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{tx.sponsorBenefits}</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 14 }}>{tx.benefitsTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2,1fr)', gap: 12 }}>
            {[
              { icon: '📊', text: tx.benefitItems[0] },
              { icon: '📸', text: tx.benefitItems[1] },
              { icon: '💬', text: tx.benefitItems[2] },
              { icon: '🔒', text: tx.benefitItems[3] },
              { icon: '✅', text: tx.benefitItems[4] },
              { icon: '🔄', text: tx.benefitItems[5] },
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
              <button
                onClick={() => navigate(`/kafala/${kafala._id}/sponsor`)}
                style={{ width: '100%', height: 52, background: '#8B6914', color: 'white', border: 'none', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)', boxShadow: '0 4px 14px rgba(196,168,130,.35)', marginBottom: 8 }}
              >
                {tx.sponsorFor} {kafala.name} — {monthlyAmount} {tx.perMonth}
              </button>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>{tx.noCommitment}</div>
            </div>
          )}

          <div style={{ height: 1, background: '#E5E9EB', margin: '24px 0' }} />

          <div style={{ marginTop: 16 }}>
            <Link to="/kafala" style={{ display: 'inline-flex', height: 44, padding: '0 22px', background: '#E6F4F4', color: '#0A5F62', borderRadius: 100, fontSize: 14, fontWeight: 600, textDecoration: 'none', alignItems: 'center' }}>
              ← {tx.browse_more}
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
                ✓ {tx.availableNow}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>{tx.monthly}</div>
                <span style={{ fontSize: 36, fontWeight: 900, color: '#8B6914', fontFamily: 'Inter, sans-serif' }}>{monthlyAmount}</span>
                <span style={{ fontSize: 14, color: '#94a3b8' }}> {tx.perMonth}</span>
              </div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.7, padding: 12, background: '#F5EBD9', borderRadius: 10, marginTop: 8 }}>
                🤲 {tx.renews}
              </div>
              <button
                onClick={() => navigate(`/kafala/${kafala._id}/sponsor`)}
                style={{ width: '100%', height: 56, background: '#8B6914', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(196,168,130,.35)', fontFamily: 'var(--font-arabic)', margin: '20px 0 8px' }}
              >
                🤲 {tx.sponsorFor} {kafala.name}
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>{tx.noCommitment}</div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
