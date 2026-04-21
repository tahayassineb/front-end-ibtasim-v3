import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import KafalaAvatar from '../../../components/kafala/KafalaAvatar';

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
// KAFALA LIST PAGE — Public orphan sponsorship listing
// ============================================

export default function KafalaList() {
  const { currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const [filter, setFilter] = useState('all');
  const isMobile = useIsMobile();

  const kafalaList = useQuery(api.kafala.getPublicKafalaList, {});

  const t = {
    ar: {
      title: 'كفالة الأيتام',
      subtitle: 'اكفل يتيماً وأضئ حياته بنور رعايتك',
      all: 'الكل',
      available: 'متاح للكفالة',
      sponsored: 'مكفول',
      loading: 'جاري التحميل...',
      empty: 'لا توجد كفالات متاحة حالياً',
      perMonth: 'درهم / شهر',
      available_badge: '● متاح',
      sponsored_badge: '🤲 مكفول',
      age: 'سنة',
      sponsor_btn: '🤲 اكفله الآن',
      sponsor_btn_f: '🤲 اكفلها الآن',
      sponsored_btn: 'مكفول بالفعل',
    },
    fr: {
      title: 'Kafala — Parrainage',
      subtitle: 'Parrainer un orphelin et illuminer sa vie',
      all: 'Tous',
      available: 'Disponible',
      sponsored: 'Parrainé',
      loading: 'Chargement...',
      empty: 'Aucune kafala disponible',
      perMonth: 'MAD / mois',
      available_badge: '● Disponible',
      sponsored_badge: '🤲 Parrainé',
      age: 'ans',
      sponsor_btn: '🤲 Parrainer',
      sponsor_btn_f: '🤲 Parrainer',
      sponsored_btn: 'Déjà parrainé',
    },
    en: {
      title: 'Orphan Kafala Sponsorship',
      subtitle: 'Sponsor an orphan and light up their life',
      all: 'All',
      available: 'Available',
      sponsored: 'Sponsored',
      loading: 'Loading...',
      empty: 'No kafala available',
      perMonth: 'MAD / month',
      available_badge: '● Available',
      sponsored_badge: '🤲 Sponsored',
      age: 'yrs',
      sponsor_btn: '🤲 Sponsor Now',
      sponsor_btn_f: '🤲 Sponsor Now',
      sponsored_btn: 'Already Sponsored',
    },
  };
  const tx = t[lang] || t.ar;

  const filtered = (kafalaList || []).filter((k) => {
    if (filter === 'available') return k.status === 'active';
    if (filter === 'sponsored') return k.status === 'sponsored';
    return true;
  });

  const getPhotoUrl = (k) => {
    if (!k.photo) return null;
    return convexFileUrl(k.photo) || k.photo;
  };

  const getBioText = (bio) => {
    if (!bio) return '';
    if (typeof bio === 'string') return bio;
    return bio[lang] || bio.ar || bio.en || '';
  };

  const total = (kafalaList || []).length;
  const availableCount = (kafalaList || []).filter((k) => k.status === 'active').length;
  const sponsoredCount = (kafalaList || []).filter((k) => k.status === 'sponsored').length;

  if (kafalaList === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f6f8f8', fontFamily: 'Tajawal, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤲</div>
          <p style={{ color: '#94a3b8' }}>{tx.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b' }}>

      {/* Kafala Hero — warm sand, NOT teal */}
      <div style={{ background: 'linear-gradient(160deg,#3D2506,#6B4F12,#C4A882)', padding: isMobile ? '48px 20px' : '68px 0', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '0' : '0 28px', position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', color: '#E8D4B0', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            KAFALA PROGRAM · برنامج الكفالة
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 900, color: 'white', marginBottom: 14, lineHeight: 1.1 }}>
            اكفل <span style={{ color: '#C4A882' }}>يتيماً</span><br />وغيّر حياته
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.75)', lineHeight: 1.8, marginBottom: 28 }}>
            بـ 300 درهم شهرياً فقط، توفر لطفل يتيم التعليم والغذاء والرعاية الصحية والحب الذي يحتاجه
          </p>
          <button
            onClick={() => setFilter('available')}
            style={{ height: 56, padding: '0 36px', background: 'white', color: '#6B4F12', border: 'none', borderRadius: 100, fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(0,0,0,.2)' }}
          >
            🤲 ابدأ الكفالة الآن
          </button>
          <div style={{ display: 'flex', justifyContent: 'center', gap: isMobile ? 24 : 40, marginTop: 32, flexWrap: 'wrap' }}>
            {[
              { num: sponsoredCount, label: 'يتيم تحت الرعاية' },
              { num: availableCount, label: 'متاح للكفالة' },
              { num: '300 د.م', label: 'فقط شهرياً' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: 'white', fontFamily: 'Inter, sans-serif' }}>{s.num}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,.65)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: 'white', borderBottom: '1px solid #E5E9EB', position: 'sticky', top: 64, zIndex: 40, boxShadow: '0 2px 4px rgba(0,0,0,.03)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '10px 16px' : '14px 28px', display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
          {[
            { id: 'all', label: `الكل (${total})` },
            { id: 'available', label: `متاح للكفالة (${availableCount})` },
            { id: 'sponsored', label: `مكفول (${sponsoredCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                height: 36, padding: '0 18px', borderRadius: 100, fontSize: 13, fontWeight: 500,
                border: `1.5px solid ${filter === f.id ? '#8B6914' : '#E5E9EB'}`,
                background: filter === f.id ? '#8B6914' : 'white',
                color: filter === f.id ? 'white' : '#64748b',
                cursor: 'pointer',
                boxShadow: filter === f.id ? '0 4px 14px rgba(196,168,130,.35)' : 'none',
                fontFamily: 'Tajawal, sans-serif',
              }}
            >
              {f.label}
            </button>
          ))}
          <div style={{ fontSize: 13, color: '#94a3b8', marginRight: 'auto' }}>يتيم مكفول يعني: ممول شهرياً بالكامل</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '36px 28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#64748b' }}>
            الأيتام المتاحون للكفالة{' '}
            <span style={{ fontSize: 11, fontWeight: 700, background: '#F5EBD9', color: '#8B6914', padding: '2px 10px', borderRadius: 100 }}>
              {filtered.length}
            </span>
          </span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🤲</div>
            <p>{tx.empty}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fill,minmax(260px,1fr))', gap: isMobile ? 14 : 24 }}>
            {filtered.map((kafala) => {
              const isSponsored = kafala.status === 'sponsored';
              const photoUrl = getPhotoUrl(kafala);
              const isFemale = kafala.gender === 'female';

              return (
                <Link
                  key={kafala._id}
                  to={`/kafala/${kafala._id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: 20,
                      border: '1px solid #E5E9EB',
                      boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)',
                      overflow: 'hidden',
                      transition: 'transform .2s,box-shadow .2s',
                      opacity: isSponsored ? 0.85 : 1,
                    }}
                    onMouseEnter={(e) => { if (!isSponsored) { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,.10)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)'; }}
                  >
                    {/* Card top — warm sand gradient */}
                    <div style={{ padding: '24px 20px 16px', textAlign: 'center', background: 'linear-gradient(180deg,#F5EBD9 0%,white 100%)' }}>
                      <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,#8B6914,#C4A882)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid white', boxShadow: '0 4px 12px rgba(196,168,130,.4)', overflow: 'hidden' }}>
                        <KafalaAvatar
                          gender={kafala.gender}
                          photo={kafala.photo}
                          photoUrl={photoUrl}
                          size={88}
                        />
                      </div>
                      <div style={{ fontSize: 17, fontWeight: 800 }}>{kafala.name}</div>
                      <div style={{ fontSize: 13, color: '#8B6914', fontWeight: 600, marginTop: 2 }}>{kafala.age} {tx.age}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>📍 {kafala.location}</div>
                      <div style={{ marginTop: 8 }}>
                        {isSponsored ? (
                          <span style={{ background: '#E8D4B0', color: '#8B6914', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>🤲 مكفول</span>
                        ) : (
                          <span style={{ background: '#D1FAE5', color: '#16a34a', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100 }}>● متاح</span>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: isSponsored ? '#94a3b8' : '#8B6914', textAlign: 'center', marginBottom: 12 }}>
                        {((kafala.monthlyPrice || 30000) / 100).toLocaleString('fr-MA')} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>درهم / شهر</span>
                      </div>
                      {isSponsored ? (
                        <button disabled style={{ width: '100%', height: 44, background: '#E8D4B0', color: '#8B6914', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'not-allowed', fontFamily: 'Tajawal, sans-serif' }}>
                          مكفول بالفعل
                        </button>
                      ) : (
                        <button style={{ width: '100%', height: 44, background: '#8B6914', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 4px 14px rgba(196,168,130,.35)' }}>
                          {isFemale ? tx.sponsor_btn_f : tx.sponsor_btn}
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Impact CTA */}
        <div style={{ background: 'linear-gradient(135deg,#3D2506,#6B4F12)', borderRadius: 20, padding: 36, textAlign: 'center', marginTop: 40 }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: 'white', marginBottom: 8 }}>💛 لماذا الكفالة؟</div>
          <div style={{ fontSize: 15, color: 'rgba(255,255,255,.75)', marginBottom: 20 }}>
            كفالتك الشهرية توفر لليتيم: التعليم، الغذاء، الرعاية الصحية، والملابس — بـ 10 درهم فقط يومياً
          </div>
          <button
            onClick={() => setFilter('available')}
            style={{ height: 56, padding: '0 36px', background: 'white', color: '#6B4F12', border: 'none', borderRadius: 100, fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: '0 6px 20px rgba(0,0,0,.2)' }}
          >
            ابدأ الكفالة الآن →
          </button>
        </div>
      </div>
    </div>
  );
}