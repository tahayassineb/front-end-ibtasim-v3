import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import { Card, Button, Badge, ProgressBar } from '../components';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ============================================
// PROJECTS LIST PAGE - Projects + Kafala mixed
// ============================================

const getLocalizedText = (obj, language) => {
  if (typeof obj === 'string') return obj;
  if (!obj) return '';
  return obj[language] || obj.ar || obj.en || '';
};

// ── Kafala card (shown inline with project cards) ─────────────────────────
const KafalaCard = ({ kafala, language }) => {
  const isSponsored = kafala.status === 'sponsored';
  const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
  const priceMAD = (kafala.monthlyPrice / 100).toLocaleString('fr-MA');

  const label = {
    sponsored: { ar: 'مكفول', fr: 'Parrainé', en: 'Sponsored' },
    available: { ar: 'متاح', fr: 'Disponible', en: 'Available' },
    kafala:    { ar: 'كفالة يتيم', fr: 'Kafala', en: 'Kafala' },
    perMonth:  { ar: 'درهم/شهر', fr: 'MAD/mois', en: 'MAD/month' },
    age:       { ar: 'سنة', fr: 'ans', en: 'yrs' },
    cta:       { ar: 'اكفل الآن', fr: 'Parrainer', en: 'Sponsor Now' },
    view:      { ar: 'عرض الملف', fr: 'Voir le profil', en: 'View Profile' },
  };
  const L = (key) => label[key]?.[language] || label[key]?.ar;

  return (
    <Card
      variant="default"
      padding="none"
      hoverable
      className="overflow-hidden shadow-lg shadow-black/5 border border-border-light dark:border-white/10 h-full flex flex-col"
    >
      {/* Top section — avatar on coloured bg */}
      <div className="relative bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-primary/20 dark:to-emerald-900/20 pt-6 pb-4 flex flex-col items-center gap-2">
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant="primary"
            className="bg-white/90 dark:bg-bg-dark-card/90 backdrop-blur-sm text-xs font-medium px-3 py-1 shadow-sm"
          >
            {L('kafala')}
          </Badge>
        </div>

        {/* Status badge */}
        <div className="absolute top-3 right-3">
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            isSponsored ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isSponsored ? 'bg-gray-400' : 'bg-emerald-500'}`} />
            {isSponsored ? L('sponsored') : L('available')}
          </span>
        </div>

        <KafalaAvatar
          gender={kafala.gender}
          photo={kafala.photo}
          photoUrl={photoUrl}
          size={88}
          className="ring-4 ring-white dark:ring-bg-dark-card shadow-md"
        />

        <div className="text-center px-4">
          <p className="font-bold text-text-primary dark:text-white text-base">{kafala.name}</p>
          <p className="text-text-secondary text-xs">{kafala.age} {L('age')} · {kafala.location}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
          {getLocalizedText(kafala.bio, language)}
        </p>

        {/* Monthly price */}
        <div className="bg-primary/5 dark:bg-primary/10 rounded-xl py-3 px-4 text-center mb-4">
          <span className="text-xl font-bold text-primary">{priceMAD}</span>
          <span className="text-xs text-text-secondary mr-1">{L('perMonth')}</span>
        </div>

        {/* CTA */}
        <Link to={`/kafala/${kafala._id}`} className="w-full">
          <Button
            variant={isSponsored ? 'secondary' : 'primary'}
            fullWidth
            className={isSponsored ? '' : 'shadow-primary hover:shadow-lg transition-shadow'}
          >
            {isSponsored ? L('view') : L('cta')}
          </Button>
        </Link>
      </div>
    </Card>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────
const ProjectsList = () => {
  const { t, currentLanguage } = useApp();
  const language = currentLanguage?.code || 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // Fetch projects
  const convexProjects = useQuery(api.projects.getProjects, { status: 'active', limit: 100 });

  // Fetch kafala
  const convexKafala = useQuery(api.kafala.getPublicKafalaList, {});

  const projects = useMemo(() => {
    if (!convexProjects) return [];
    return convexProjects.map(p => ({
      _type: 'project',
      id: p._id,
      title: p.title,
      description: p.description,
      category: p.category,
      raised: p.raisedAmount,
      goal: p.goalAmount,
      progress: Math.round((p.raisedAmount / p.goalAmount) * 100),
      image: convexFileUrl(p.mainImage) || p.mainImage,
      location: p.location,
      beneficiaries: p.beneficiaries,
    }));
  }, [convexProjects]);

  const kafalaItems = useMemo(() => {
    if (!convexKafala) return [];
    return convexKafala.map(k => ({ _type: 'kafala', ...k }));
  }, [convexKafala]);

  const categories = [
    { id: 'all',         label: { en: 'All', fr: 'Tous', ar: 'الكل' },                  icon: 'apps' },
    { id: 'kafala',      label: { en: 'Kafala', fr: 'Kafala', ar: 'كفالة الأيتام' },      icon: 'child_care' },
    { id: 'education',   label: { en: 'Education', fr: 'Éducation', ar: 'التعليم' },     icon: 'school' },
    { id: 'health',      label: { en: 'Health', fr: 'Santé', ar: 'الصحة' },              icon: 'health_and_safety' },
    { id: 'water',       label: { en: 'Water', fr: 'Eau', ar: 'الماء' },                 icon: 'water_drop' },
  ];

  const allItems = useMemo(() => {
    // Interleave: kafala appear after first 2 projects, then continue
    const result = [];
    const proj = [...projects];
    const kaf = [...kafalaItems];

    if (activeCategory === 'kafala') return kaf;
    if (activeCategory !== 'all') return proj.filter(p => p.category === activeCategory);

    // Mix: show all projects then all kafala (kafala at the end for "all")
    return [...proj, ...kaf];
  }, [projects, kafalaItems, activeCategory]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    const q = searchQuery.toLowerCase();
    return allItems.filter(item => {
      if (item._type === 'project') {
        return getLocalizedText(item.title, language).toLowerCase().includes(q);
      }
      // kafala: search by name, location
      return item.name?.toLowerCase().includes(q) || item.location?.toLowerCase().includes(q);
    });
  }, [allItems, searchQuery, language]);

  const isLoading = convexProjects === undefined || convexKafala === undefined;

  if (isLoading) {
    return (
      <div className="bg-bg-light dark:bg-bg-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-text-secondary">
            {language === 'ar' ? 'جاري التحميل...' : language === 'fr' ? 'Chargement...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen pb-24">
      {/* Search Bar */}
      <div className="px-4 py-6 max-w-desktop mx-auto">
        <label className="flex flex-col min-w-40 h-14 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-2xl h-full shadow-sm">
            <div className="text-primary flex border-none bg-bg-sage-light dark:bg-primary/10 items-center justify-center pl-5 rounded-l-2xl">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-2xl text-text-primary dark:text-white focus:outline-0 focus:ring-0 border-none bg-bg-sage-light dark:bg-primary/10 h-full placeholder:text-primary/60 px-4 pl-2 text-base font-normal"
              placeholder={
                language === 'ar' ? 'ابحث عن مشاريع أو كفالات...'
                : language === 'fr' ? 'Chercher projets ou kafalas...'
                : 'Search projects or kafalas...'
              }
            />
          </div>
        </label>
      </div>

      {/* Category tabs */}
      <div className="px-4 max-w-desktop mx-auto mb-5 overflow-x-auto">
        <div className="flex gap-2 w-max">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white dark:bg-bg-dark-card text-text-secondary border border-border-light dark:border-white/10 hover:border-primary/30 hover:text-primary'
              }`}
            >
              <span className="material-symbols-outlined text-base">{cat.icon}</span>
              {getLocalizedText(cat.label, language)}
            </button>
          ))}
        </div>
      </div>

      {/* Header with count */}
      <div className="px-4 flex items-center justify-between max-w-desktop mx-auto mb-4">
        <h3 className="text-text-primary dark:text-white text-xl font-bold leading-tight tracking-tight">
          {activeCategory === 'kafala'
            ? (language === 'ar' ? 'كفالة الأيتام' : language === 'fr' ? 'Kafala' : 'Orphan Kafala')
            : (language === 'ar' ? 'المشاريع النشطة' : language === 'fr' ? 'Projets Actifs' : 'Active Projects')}
        </h3>
        <span className="text-primary text-sm font-semibold">
          {filtered.length} {language === 'ar' ? 'المجموع' : language === 'fr' ? 'Total' : 'Total'}
        </span>
      </div>

      {/* Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-desktop mx-auto">
        {filtered.map(item => {
          if (item._type === 'kafala') {
            return <KafalaCard key={`kafala-${item._id}`} kafala={item} language={language} />;
          }

          // Regular project card
          return (
            <Card
              key={item.id}
              variant="default"
              padding="none"
              hoverable
              className="overflow-hidden shadow-lg shadow-black/5 border border-border-light dark:border-white/10 h-full flex flex-col"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={item.image}
                  alt={getLocalizedText(item.title, language)}
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute top-3 left-3">
                  <Badge
                    variant="primary"
                    className="bg-white/90 dark:bg-bg-dark-card/90 backdrop-blur-sm text-xs font-medium px-3 py-1 shadow-sm"
                  >
                    {item.category}
                  </Badge>
                </div>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h4 className="text-text-primary dark:text-white text-lg font-bold leading-tight mb-2 line-clamp-2">
                  {getLocalizedText(item.title, language)}
                </h4>
                <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                  {getLocalizedText(item.description, language)}
                </p>

                <div className="mb-4">
                  <ProgressBar progress={item.progress} size="md" className="mb-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-primary font-semibold">{item.raised.toLocaleString()} MAD</span>
                    <span className="text-text-secondary">
                      {language === 'ar' ? 'هدف' : language === 'fr' ? 'objectif' : 'goal'}: {item.goal.toLocaleString()} MAD
                    </span>
                  </div>
                </div>

                <Link to={`/projects/${item.id}`} className="w-full">
                  <Button variant="primary" fullWidth className="shadow-primary hover:shadow-lg transition-shadow">
                    {language === 'ar' ? 'تبرع الآن' : language === 'fr' ? 'Faire un don' : 'Donate Now'}
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">folder_open</span>
          <p className="text-text-secondary text-lg">
            {language === 'ar' ? 'لا توجد نتائج' : language === 'fr' ? 'Aucun résultat' : 'No results'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
