import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ============================================
// KAFALA DETAIL PAGE — Public orphan profile + sponsor CTA
// ============================================

export default function KafalaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage } = useApp();
  const lang = currentLanguage?.code || 'ar';

  const data = useQuery(api.kafala.getKafalaById, { kafalaId: id });

  // Show success toast if redirected from Whop
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('sponsored') === 'true') {
      // Small delay to let the page render first
      setTimeout(() => {
        window.history.replaceState({}, '', window.location.pathname);
      }, 3000);
    }
  }, []);

  const t = {
    ar: {
      back: 'العودة',
      age: 'العمر',
      location: 'المدينة',
      monthly: 'الكفالة الشهرية',
      perMonth: 'درهم/شهر',
      bio: 'قصة اليتيم',
      sponsor_btn: 'اكفل هذا اليتيم',
      sponsored_msg: 'هذا اليتيم مكفول حالياً',
      sponsored_sub: 'شكراً لكافله الكريم. يمكنك الاطلاع على كفالات أخرى.',
      browse_more: 'تصفح كفالات أخرى',
      loading: 'جاري التحميل...',
      notfound: 'الكفالة غير موجودة',
      male: 'ذكر',
      female: 'أنثى',
      success_msg: 'تم تسجيل كفالتك بنجاح! جزاك الله خيراً.',
    },
    fr: {
      back: 'Retour',
      age: 'Âge',
      location: 'Ville',
      monthly: 'Kafala mensuelle',
      perMonth: 'MAD/mois',
      bio: 'Histoire',
      sponsor_btn: 'Parrainer cet orphelin',
      sponsored_msg: 'Cet orphelin est déjà parrainé',
      sponsored_sub: 'Merci à son parrain. Découvrez d\'autres kafalas.',
      browse_more: 'Voir d\'autres kafalas',
      loading: 'Chargement...',
      notfound: 'Kafala introuvable',
      male: 'Garçon',
      female: 'Fille',
      success_msg: 'Votre kafala a été enregistrée! Jazak Allah Khayran.',
    },
    en: {
      back: 'Back',
      age: 'Age',
      location: 'City',
      monthly: 'Monthly Kafala',
      perMonth: 'MAD/month',
      bio: 'Story',
      sponsor_btn: 'Sponsor This Orphan',
      sponsored_msg: 'This orphan is already sponsored',
      sponsored_sub: 'Thank you to their sponsor. Browse other available kafalas.',
      browse_more: 'Browse other kafalas',
      loading: 'Loading...',
      notfound: 'Kafala not found',
      male: 'Male',
      female: 'Female',
      success_msg: 'Your kafala has been registered! Jazak Allah Khayran.',
    },
  };
  const tx = t[lang] || t.ar;

  const getBioText = (bio) => {
    if (!bio) return '';
    if (typeof bio === 'string') return bio;
    return bio[lang] || bio.ar || bio.en || '';
  };

  if (data === undefined) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center text-text-secondary">
        {tx.notfound}
      </div>
    );
  }

  const kafala = data;
  const isSponsored = kafala.status === 'sponsored';
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;

  // Check for Whop success redirect
  const params = new URLSearchParams(window.location.search);
  const justSponsored = params.get('sponsored') === 'true';

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen pb-24">
      {/* Back navigation */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/kafala')}
          className="flex items-center gap-2 text-text-secondary hover:text-primary text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          {tx.back}
        </button>
      </div>

      {/* Success banner (after Whop redirect) */}
      {justSponsored && (
        <div className="mx-4 mt-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-600 text-2xl">check_circle</span>
          <p className="text-emerald-800 dark:text-emerald-200 font-semibold text-sm">{tx.success_msg}</p>
        </div>
      )}

      {/* Profile card */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <div className="bg-white dark:bg-bg-dark-card rounded-3xl shadow-card overflow-hidden">
          {/* Top section with avatar */}
          <div className="bg-gradient-to-br from-primary/10 to-emerald-100 dark:from-primary/20 dark:to-emerald-900/20 py-10 flex flex-col items-center gap-4">
            <KafalaAvatar
              gender={kafala.gender}
              photo={kafala.photo}
              photoUrl={photoUrl}
              size={120}
              className="ring-4 ring-white dark:ring-bg-dark-card shadow-xl"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold text-text-primary dark:text-white">{kafala.name}</h1>
              <p className="text-text-secondary text-sm mt-1">
                {kafala.gender === 'female' ? tx.female : tx.male}
              </p>
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold ${
                isSponsored
                  ? 'bg-gray-100 text-gray-500'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isSponsored ? 'bg-gray-400' : 'bg-emerald-500'}`} />
              {isSponsored ? (lang === 'ar' ? 'مكفول' : lang === 'fr' ? 'Parrainé' : 'Sponsored') : (lang === 'ar' ? 'متاح' : lang === 'fr' ? 'Disponible' : 'Available')}
            </span>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {/* Info row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-text-muted mb-1">{tx.age}</p>
                <p className="text-xl font-bold text-text-primary dark:text-white">{kafala.age}</p>
              </div>
              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 text-center">
                <p className="text-xs text-text-muted mb-1">{tx.location}</p>
                <p className="text-base font-bold text-text-primary dark:text-white">{kafala.location}</p>
              </div>
            </div>

            {/* Monthly price */}
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-5 text-center">
              <p className="text-sm text-text-secondary mb-1">{tx.monthly}</p>
              <p className="text-3xl font-bold text-primary">
                {(kafala.monthlyPrice / 100).toLocaleString('fr-MA')}
                <span className="text-base font-medium text-text-secondary mr-1"> {tx.perMonth}</span>
              </p>
            </div>

            {/* Bio */}
            {getBioText(kafala.bio) && (
              <div>
                <h2 className="text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">{tx.bio}</h2>
                <p className="text-text-secondary leading-relaxed text-sm">{getBioText(kafala.bio)}</p>
              </div>
            )}

            {/* CTA */}
            {isSponsored ? (
              <div className="text-center pt-2">
                <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-5 mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-4xl mb-2 block">volunteer_activism</span>
                  <p className="text-text-primary dark:text-white font-semibold">{tx.sponsored_msg}</p>
                  <p className="text-text-secondary text-sm mt-1">{tx.sponsored_sub}</p>
                </div>
                <Link
                  to="/kafala"
                  className="inline-block bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
                >
                  {tx.browse_more}
                </Link>
              </div>
            ) : (
              <button
                onClick={() => navigate(`/kafala/${kafala._id}/sponsor`)}
                className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 active:scale-[.98] transition-all shadow-primary"
              >
                {tx.sponsor_btn}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
