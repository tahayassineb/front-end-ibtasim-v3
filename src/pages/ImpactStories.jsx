import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button } from '../components';

// ============================================
// IMPACT STORIES PAGE - Success Stories
// ============================================

const ImpactStories = () => {
  const { t, language } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Filters with translations
  const filters = [
    { id: 'all', label: { en: 'All Stories', fr: 'Toutes les Histoires', ar: 'جميع القصص' } },
    { id: 'education', label: { en: 'Education', fr: 'Éducation', ar: 'التعليم' } },
    { id: 'healthcare', label: { en: 'Healthcare', fr: 'Santé', ar: 'الرعاية الصحية' } },
    { id: 'housing', label: { en: 'Housing', fr: 'Logement', ar: 'السكن' } },
  ];

  // Stories data
  const stories = [
    {
      id: 1,
      name: {
        en: "Amina's New Path",
        fr: 'La Nouvelle Voie de Amina',
        ar: 'طريق أمينة الجديد',
      },
      quote: {
        en: '"I finally have the books I need..."',
        fr: '"J\'ai enfin les livres dont j\'ai besoin..."',
        ar: '"لدي أخيراً الكتب التي أحتاجها..."',
      },
      category: 'education',
      image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80',
    },
    {
      id: 2,
      name: {
        en: "Hassan's Legacy",
        fr: "L'Héritage de Hassan",
        ar: 'إرث حسن',
      },
      quote: {
        en: '"My craft is alive again thanks to you."',
        fr: '"Mon métier revit grâce à vous."',
        ar: '"حرفتي حية مرة أخرى بفضلكم."',
      },
      category: 'housing',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=600&q=80',
    },
    {
      id: 3,
      name: {
        en: 'Pure Water Village',
        fr: 'Village Eau Pure',
        ar: 'قرية الماء النقي',
      },
      quote: {
        en: '"No more walking miles for water."',
        fr: '"Plus besoin de marcher des kilomètres pour de l\'eau."',
        ar: '"لا مزيد من المشي لأميال للحصول على الماء."',
      },
      category: 'healthcare',
      image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=600&q=80',
    },
    {
      id: 4,
      name: {
        en: "Omar's Dream",
        fr: 'Le Rêve de Omar',
        ar: 'حلم عمر',
      },
      quote: {
        en: '"I finally have a real team to play with."',
        fr: '"J\'ai enfin une vraie équipe avec qui jouer."',
        ar: '"لدي أخيراً فريق حقيقي للعب معهم."',
      },
      category: 'education',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&q=80',
    },
  ];

  // Stats data
  const stats = [
    {
      value: '12k+',
      label: { en: 'Families Helped', fr: 'Familles Aidées', ar: 'عائلة مساعدة' },
    },
    {
      value: '85',
      label: { en: 'Villages Reached', fr: 'Villages Atteints', ar: 'قرية تم الوصول إليها' },
    },
  ];

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en;
  };

  // Filter stories
  const filteredStories = selectedFilter === 'all' 
    ? stories 
    : stories.filter((story) => story.category === selectedFilter);

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen pb-24">
      {/* Header Section */}
      <div className="pt-10 pb-6 px-6 text-center max-w-desktop mx-auto">
        <h4 className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-4">
          {language === 'ar' ? 'تأثيرنا' : language === 'fr' ? 'Notre Impact' : 'Our Impact'}
        </h4>
        <h1 className="text-text-primary dark:text-white text-3xl md:text-4xl font-bold leading-tight mb-3">
          {language === 'ar' ? 'قصص الأمل' : language === 'fr' ? 'Histoires d\'Espoir' : 'Stories of Hope'}
        </h1>
        <h2 className="text-primary text-2xl md:text-3xl font-arabic font-bold mb-6" dir="rtl">
          تغيير حياة، قصة تلو الأخرى
        </h2>
        <p className="text-text-secondary dark:text-text-white/70 text-lg font-light leading-relaxed max-w-md mx-auto">
          {language === 'ar'
            ? 'اكتشف كيف تُحدث كرَمك تحولاً في الحياة عبر المغرب من خلال قصص حقيقية عن الأمل والصمود.'
            : language === 'fr'
            ? 'Découvrez comment votre générosité transforme des vies à travers le Maroc à travers des histoires réelles d\'espoir et de résilience.'
            : 'Discover how your generosity transforms lives across Morocco through real stories of hope and resilience.'}
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto px-6 py-4 no-scrollbar max-w-desktop mx-auto justify-center">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setSelectedFilter(filter.id)}
            className={`px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
              selectedFilter === filter.id
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-bg-dark-card text-text-secondary dark:text-text-white/80 hover:bg-bg-sage-light'
            }`}
          >
            {getLocalizedText(filter.label)}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 gap-4 p-6 max-w-desktop mx-auto">
        {filteredStories.map((story, index) => (
          <div
            key={story.id}
            className={`relative group aspect-[3/4] overflow-hidden rounded-2xl shadow-sm bg-gray-200 cursor-pointer ${
              index % 2 === 1 ? 'translate-y-6' : ''
            }`}
            style={{
              backgroundImage: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.85)), url("${story.image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 bg-black/10 group-active:bg-black/30 transition-all duration-300"></div>
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <span className="text-[9px] uppercase tracking-widest font-bold text-primary bg-white px-2 py-0.5 rounded-full mb-2 inline-block">
                {getLocalizedText(filters.find((f) => f.id === story.category)?.label || story.category)}
              </span>
              <p className="text-base font-bold leading-tight">{getLocalizedText(story.name)}</p>
              <p className="text-[10px] mt-1 opacity-80 font-light line-clamp-2 italic">
                {getLocalizedText(story.quote)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats Counter Section */}
      <div className="px-6 pt-16 pb-12 max-w-desktop mx-auto">
        <Card className="rounded-3xl p-8 text-center border border-border-light dark:border-white/10">
          <div className="grid grid-cols-2 gap-8 mb-10">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-primary text-3xl font-bold">{stat.value}</p>
                <p className="text-text-muted dark:text-text-white/60 text-[10px] uppercase tracking-widest mt-1">
                  {getLocalizedText(stat.label)}
                </p>
              </div>
            ))}
          </div>
          <Link to="/projects">
            <Button fullWidth size="lg" className="shadow-xl shadow-primary/20 active:scale-95 transition-transform">
              {language === 'ar' ? 'انضم للمهمة' : language === 'fr' ? 'Rejoignez la Mission' : 'Join the Mission'}
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default ImpactStories;
