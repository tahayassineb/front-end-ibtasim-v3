import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ============================================
// KAFALA LIST PAGE — Public orphan sponsorship listing
// ============================================

export default function KafalaList() {
  const { currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';
  const [filter, setFilter] = useState('all'); // all | available | sponsored

  const kafalaList = useQuery(api.kafala.getPublicKafalaList, {});

  const t = {
    ar: {
      title: 'كفالة الأيتام',
      subtitle: 'اكفل يتيماً وأضئ حياته بنور رعايتك',
      all: 'الجميع',
      available: 'متاح',
      sponsored: 'مكفول',
      loading: 'جاري التحميل...',
      empty: 'لا توجد كفالات متاحة حالياً',
      perMonth: 'درهم / شهر',
      available_badge: 'متاح',
      sponsored_badge: 'مكفول',
      age: 'سنة',
      sponsor_btn: 'اكفل الآن',
      view_btn: 'عرض الملف',
    },
    fr: {
      title: 'Kafala — Parrainage d\'orphelins',
      subtitle: 'Parrainer un orphelin et illuminer sa vie',
      all: 'Tous',
      available: 'Disponible',
      sponsored: 'Parrainé',
      loading: 'Chargement...',
      empty: 'Aucune kafala disponible pour le moment',
      perMonth: 'MAD / mois',
      available_badge: 'Disponible',
      sponsored_badge: 'Parrainé',
      age: 'ans',
      sponsor_btn: 'Parrainer',
      view_btn: 'Voir le profil',
    },
    en: {
      title: 'Orphan Kafala Sponsorship',
      subtitle: 'Sponsor an orphan and light up their life',
      all: 'All',
      available: 'Available',
      sponsored: 'Sponsored',
      loading: 'Loading...',
      empty: 'No kafala available at the moment',
      perMonth: 'MAD / month',
      available_badge: 'Available',
      sponsored_badge: 'Sponsored',
      age: 'yrs',
      sponsor_btn: 'Sponsor Now',
      view_btn: 'View Profile',
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

  if (kafalaList === undefined) {
    return (
      <div className="bg-bg-light dark:bg-bg-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-text-secondary">{tx.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-primary to-emerald-700 text-white py-12 px-4 text-center">
        <span className="material-symbols-outlined text-5xl mb-3 block opacity-80">child_care</span>
        <h1 className="text-3xl font-bold mb-2">{tx.title}</h1>
        <p className="text-white/80 text-base max-w-md mx-auto">{tx.subtitle}</p>
      </div>

      {/* Filter Tabs */}
      <div className="sticky top-0 z-10 bg-white dark:bg-bg-dark-card border-b border-border-light dark:border-white/10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex gap-2 py-3 overflow-x-auto">
          {['all', 'available', 'sponsored'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                filter === f
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-white/10 text-text-secondary hover:bg-primary/10 hover:text-primary'
              }`}
            >
              {tx[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            <span className="material-symbols-outlined text-5xl mb-4 block opacity-40">child_care</span>
            <p>{tx.empty}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((kafala) => {
              const isSponsored = kafala.status === 'sponsored';
              const photoUrl = getPhotoUrl(kafala);
              return (
                <Link
                  key={kafala._id}
                  to={`/kafala/${kafala._id}`}
                  className={`group relative bg-white dark:bg-bg-dark-card rounded-2xl overflow-hidden shadow-card hover:shadow-lg transition-all duration-300 border ${
                    isSponsored
                      ? 'border-gray-200 dark:border-white/10 opacity-75'
                      : 'border-transparent hover:border-primary/20'
                  }`}
                >
                  {/* Status badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                        isSponsored
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSponsored ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                      {isSponsored ? tx.sponsored_badge : tx.available_badge}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className="flex justify-center pt-8 pb-4">
                    <KafalaAvatar
                      gender={kafala.gender}
                      photo={kafala.photo}
                      photoUrl={photoUrl}
                      size={96}
                      className="ring-4 ring-white dark:ring-bg-dark-card shadow-md"
                    />
                  </div>

                  {/* Info */}
                  <div className="px-5 pb-5 text-center">
                    <h3 className="text-lg font-bold text-text-primary dark:text-white mb-1">{kafala.name}</h3>
                    <div className="flex items-center justify-center gap-2 text-text-secondary text-sm mb-3">
                      <span>{kafala.age} {tx.age}</span>
                      <span>•</span>
                      <span>{kafala.location}</span>
                    </div>
                    <p className="text-text-secondary text-xs line-clamp-2 mb-4 leading-relaxed">
                      {getBioText(kafala.bio)}
                    </p>

                    {/* Price */}
                    <div className="bg-primary/5 dark:bg-primary/10 rounded-xl py-3 px-4 mb-4">
                      <span className="text-2xl font-bold text-primary">
                        {(kafala.monthlyPrice / 100).toLocaleString('fr-MA')}
                      </span>
                      <span className="text-sm text-text-secondary mr-1">{tx.perMonth}</span>
                    </div>

                    {/* CTA */}
                    {!isSponsored && (
                      <div className="w-full bg-primary text-white py-2.5 rounded-xl text-sm font-bold group-hover:bg-primary/90 transition-colors">
                        {tx.sponsor_btn}
                      </div>
                    )}
                    {isSponsored && (
                      <div className="w-full bg-gray-100 dark:bg-white/10 text-gray-400 py-2.5 rounded-xl text-sm font-bold">
                        {tx.view_btn}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
