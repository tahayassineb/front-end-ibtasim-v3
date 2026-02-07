import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button, Badge, ProgressBar } from '../components';

// ============================================
// PROJECTS LIST PAGE - Projects Gallery
// ============================================

const ProjectsList = () => {
  const { t, language } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories with translations
  const categories = [
    { id: 'all', label: { en: 'All', fr: 'Tous', ar: 'الكل' }, icon: 'apps' },
    { id: 'education', label: { en: 'Education', fr: 'Éducation', ar: 'التعليم' }, icon: 'school' },
    { id: 'health', label: { en: 'Health', fr: 'Santé', ar: 'الصحة' }, icon: 'health_and_safety' },
    { id: 'water', label: { en: 'Water', fr: 'Eau', ar: 'الماء' }, icon: 'water_drop' },
  ];

  // Projects data
  const projects = [
    {
      id: 1,
      title: {
        en: 'Build a School in Atlas',
        fr: 'Construire une École dans l\'Atlas',
        ar: 'بناء مدرسة في الأطلس',
      },
      description: {
        en: 'Providing quality modern education for 200 children in the Atlas Mountains region.',
        fr: 'Fourniture d\'une éducation moderne de qualité pour 200 enfants dans la région des montagnes de l\'Atlas.',
        ar: 'توفير تعليم حديث عالي الجودة لـ 200 طفل في منطقة جبال الأطلس.',
      },
      category: 'education',
      raised: 45000,
      goal: 70000,
      progress: 65,
      daysLeft: 25,
      donors: 142,
      image: 'https://images.unsplash.com/photo-1564429238984-b3cd3a5ba0b4?w=800&q=80',
    },
    {
      id: 2,
      title: {
        en: 'Clean Water Initiative',
        fr: 'Initiative Eau Propre',
        ar: 'مبادرة المياه النظيفة',
      },
      description: {
        en: 'Developing sustainable water filtration systems for remote villages in Southern Morocco.',
        fr: 'Développement de systèmes de filtration d\'eau durables pour les villages reculés du Sud du Maroc.',
        ar: 'تطوير أنظمة ترشيح مياه مستدامة للقرى النائية في جنوب المغرب.',
      },
      category: 'water',
      raised: 18200,
      goal: 22000,
      progress: 82,
      daysLeft: 12,
      donors: 89,
      image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&q=80',
    },
    {
      id: 3,
      title: {
        en: 'Rural Health Clinics',
        fr: 'Cliniques de Santé Rurales',
        ar: 'عيادات الصحة الريفية',
      },
      description: {
        en: 'Support our mobile clinics providing essential medical care to high-altitude communities.',
        fr: 'Soutenez nos cliniques mobiles fournissant des soins médicaux essentiels aux communautés en altitude.',
        ar: 'ادعم عياداتنا المتنقلة التي تقدم الرعاية الطبية الأساسية للمجتمعات في المناطق المرتفعة.',
      },
      category: 'health',
      raised: 105000,
      goal: 350000,
      progress: 30,
      daysLeft: 45,
      donors: 234,
      image: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80',
    },
  ];

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en;
  };

  // Filter projects
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = getLocalizedText(project.title)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || project.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-2xl text-text-primary dark:text-white focus:outline-0 focus:ring-0 border-none bg-bg-sage-light dark:bg-primary/10 h-full placeholder:text-primary/60 px-4 pl-2 text-base font-normal"
              placeholder={
                language === 'ar'
                  ? 'ابحث عن مشاريع مؤثرة...'
                  : language === 'fr'
                  ? 'Trouver des projets impactants...'
                  : 'Find impactful projects...'
              }
            />
          </div>
        </label>
      </div>

      {/* Category Filter Chips */}
      <div className="flex gap-3 px-4 pb-6 overflow-x-auto no-scrollbar max-w-desktop mx-auto">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 transition-all ${
              selectedCategory === category.id
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'bg-bg-sage-light dark:bg-primary/10 text-primary border border-primary/5 hover:bg-primary/10'
            }`}
          >
            {category.id !== 'all' && (
              <span className="material-symbols-outlined text-[18px]">{category.icon}</span>
            )}
            <p className={`text-sm ${selectedCategory === category.id ? 'font-semibold' : 'font-medium'}`}>
              {getLocalizedText(category.label)}
            </p>
          </button>
        ))}
      </div>

      {/* Header with count */}
      <div className="px-4 flex items-center justify-between max-w-desktop mx-auto mb-4">
        <h3 className="text-text-primary dark:text-white text-xl font-bold leading-tight tracking-tight">
          {language === 'ar' ? 'المشاريع النشطة' : language === 'fr' ? 'Projets Actifs' : 'Active Projects'}
        </h3>
        <span className="text-primary text-sm font-semibold">
          {filteredProjects.length} {language === 'ar' ? 'المجموع' : language === 'fr' ? 'Total' : 'Total'}
        </span>
      </div>

      {/* Project Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-desktop mx-auto">
        {filteredProjects.map((project) => (
          <Card
            key={project.id}
            variant="default"
            padding="none"
            hoverable
            className="overflow-hidden shadow-lg shadow-black/5 border border-border-light dark:border-white/10 h-full flex flex-col"
          >
            {/* Image with overlay */}
            <div
              className="relative w-full aspect-[16/10] bg-center bg-no-repeat bg-cover overflow-hidden"
              style={{ backgroundImage: `url("${project.image}")` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              {/* Category badge */}
              <div className="absolute bottom-4 right-4 glass-effect px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20">
                <p className="text-white text-xs font-bold uppercase tracking-widest">
                  {getLocalizedText(categories.find((c) => c.id === project.category)?.label || project.category)}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="flex w-full flex-col gap-4 p-5">
              <div className="flex flex-col gap-1">
                <p className="text-text-primary dark:text-white text-xl font-bold leading-tight">
                  {getLocalizedText(project.title)}
                </p>
                <p className="text-primary/70 dark:text-primary/80 text-sm font-normal leading-relaxed">
                  {getLocalizedText(project.description)}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-primary">{project.progress}% {language === 'ar' ? 'ممول' : language === 'fr' ? 'Financé' : 'Funded'}</span>
                  <span className="text-text-muted dark:text-text-white/50">
                    {project.daysLeft} {language === 'ar' ? 'يوم متبقي' : language === 'fr' ? 'jours restants' : 'days left'}
                  </span>
                </div>
                <ProgressBar value={project.progress} size="sm" />
              </div>

              {/* Footer with amount and button */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col">
                  <p className="text-text-primary dark:text-white text-lg font-bold">
                    MAD {project.raised.toLocaleString()}
                  </p>
                  <p className="text-text-muted text-xs">
                    {language === 'ar' ? 'من أصل' : language === 'fr' ? 'sur' : 'of'} MAD {project.goal.toLocaleString()}
                  </p>
                </div>
                <Link to={`/projects/${project.id}`}>
                  <Button className="min-w-[120px] h-12">
                    {language === 'ar' ? 'تبرع الآن' : language === 'fr' ? 'Faire un Don' : 'Donate Now'}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <span className="material-symbols-outlined text-6xl text-text-muted mb-4">search_off</span>
          <p className="text-text-secondary text-lg">
            {language === 'ar'
              ? 'لم يتم العثور على مشاريع'
              : language === 'fr'
              ? 'Aucun projet trouvé'
              : 'No projects found'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
