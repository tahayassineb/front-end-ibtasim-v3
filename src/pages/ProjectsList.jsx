import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { Card, Button, Badge, ProgressBar } from '../components';

// ============================================
// PROJECTS LIST PAGE - Connected to Convex
// ============================================

const ProjectsList = () => {
  const { t, currentLanguage } = useApp();
  const language = currentLanguage?.code || 'en';
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch projects from Convex backend
  const convexProjects = useQuery(api.projects.getProjects, { 
    status: "active",
    limit: 100 
  });

  // Transform Convex data to match component format
  const projects = useMemo(() => {
    if (!convexProjects) return [];
    
    return convexProjects.map(project => ({
      id: project._id,
      title: project.title,
      description: project.description,
      category: project.category,
      raised: project.raisedAmount,
      goal: project.goalAmount,
      progress: Math.round((project.raisedAmount / project.goalAmount) * 100),
      image: project.mainImage,
      location: project.location,
      beneficiaries: project.beneficiaries,
    }));
  }, [convexProjects]);

  // Categories with translations
  const categories = [
    { id: 'all', label: { en: 'All', fr: 'Tous', ar: 'الكل' }, icon: 'apps' },
    { id: 'education', label: { en: 'Education', fr: 'Éducation', ar: 'التعليم' }, icon: 'school' },
    { id: 'health', label: { en: 'Health', fr: 'Santé', ar: 'الصحة' }, icon: 'health_and_safety' },
    { id: 'water', label: { en: 'Water', fr: 'Eau', ar: 'الماء' }, icon: 'water_drop' },
  ];

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en;
  };

  // Filter projects by search
  const filteredProjects = projects.filter((project) => {
    const matchesSearch = getLocalizedText(project.title)
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Loading state
  if (convexProjects === undefined) {
    return (
      <div className="bg-bg-light dark:bg-bg-dark min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
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
            {/* Image Container */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={project.image}
                alt={getLocalizedText(project.title)}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              {/* Category Badge */}
              <div className="absolute top-3 left-3">
                <Badge 
                  variant="primary" 
                  className="bg-white/90 dark:bg-bg-dark-card/90 backdrop-blur-sm text-xs font-medium px-3 py-1 shadow-sm"
                >
                  {project.category}
                </Badge>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1">
              <h4 className="text-text-primary dark:text-white text-lg font-bold leading-tight mb-2 line-clamp-2">
                {getLocalizedText(project.title)}
              </h4>
              
              <p className="text-text-secondary dark:text-text-secondary text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                {getLocalizedText(project.description)}
              </p>

              {/* Progress Bar */}
              <div className="mb-4">
                <ProgressBar 
                  progress={project.progress} 
                  size="md"
                  className="mb-2"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-primary font-semibold">
                    {project.raised.toLocaleString()} MAD
                  </span>
                  <span className="text-text-secondary">
                    {language === 'ar' ? 'هدف' : language === 'fr' ? 'objectif' : 'goal'}: {project.goal.toLocaleString()} MAD
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <Link to={`/projects/${project.id}`} className="w-full">
                <Button 
                  variant="primary" 
                  fullWidth
                  className="shadow-primary hover:shadow-lg transition-shadow"
                >
                  {language === 'ar' 
                    ? 'تبرع الآن' 
                    : language === 'fr' 
                    ? 'Faire un don' 
                    : 'Donate Now'}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">folder_open</span>
          <p className="text-text-secondary text-lg">
            {language === 'ar' 
              ? 'لا توجد مشاريع متاحة حالياً' 
              : language === 'fr' 
              ? 'Aucun projet disponible pour le moment' 
              : 'No projects available at the moment'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ProjectsList;
