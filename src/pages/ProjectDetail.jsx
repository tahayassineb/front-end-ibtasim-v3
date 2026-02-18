import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { Card, Button, ProgressBar } from '../components';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// ============================================
// PROJECT DETAIL PAGE - Connected to Convex
// ============================================

const ProjectDetail = ({ preview = false }) => {
  const { t, language, isAuthenticated } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Fetch project from Convex backend
  const convexProject = useQuery(api.projects.getProjectById, { projectId: id });

  // Load preview data from sessionStorage if in preview mode
  useEffect(() => {
    if (preview) {
      const stored = sessionStorage.getItem('projectPreview');
      if (stored) {
        setPreviewData(JSON.parse(stored));
      }
    }
  }, [preview]);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Transform project data for display
  const project = useMemo(() => {
    if (previewData) return previewData;
    if (!convexProject) return null;

    const progress = Math.round((convexProject.raisedAmount / convexProject.goalAmount) * 100);

    return {
      id: convexProject._id,
      title: convexProject.title,
      location: { 
        ar: convexProject.location || 'المغرب', 
        fr: convexProject.location || 'Maroc', 
        en: convexProject.location || 'Morocco' 
      },
      description: convexProject.description,
      description2: { ar: '', fr: '', en: '' },
      impact: { ar: '', fr: '', en: '' },
      raised: convexProject.raisedAmount / 100,
      goal: convexProject.goalAmount / 100,
      progress: progress,
      donors: 0,
      daysLeft: convexProject.endDate 
        ? Math.max(0, Math.ceil((convexProject.endDate - Date.now()) / (1000 * 60 * 60 * 24))) 
        : 30,
      category: convexProject.category,
      image: convexProject.mainImage,
      gallery: convexProject.gallery?.length > 0 ? convexProject.gallery : [
        'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80',
        'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600&q=80',
        'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
      ],
      updates: [],
    };
  }, [convexProject, previewData]);

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en;
  };

  const handleDonateClick = () => {
    if (project) {
      navigate(`/donate/${project.id}`);
    }
  };

  // Loading state
  if (!preview && convexProject === undefined) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  // Not found state
  if (!preview && convexProject === null) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex flex-col items-center justify-center p-4">
        <span className="material-symbols-outlined text-6xl text-text-secondary mb-4">error_outline</span>
        <h1 className="text-2xl font-bold text-text-primary dark:text-white mb-2">
          {language === 'ar' ? 'المشروع غير موجود' : language === 'fr' ? 'Projet non trouvé' : 'Project Not Found'}
        </h1>
        <p className="text-text-secondary mb-6">
          {language === 'ar' ? 'المشروع الذي تبحث عنه غير متوفر' : language === 'fr' ? 'Le projet que vous recherchez n\'est pas disponible' : 'The project you are looking for is not available'}
        </p>
        <Button onClick={() => navigate('/projects')}>
          {language === 'ar' ? 'عرض جميع المشاريع' : language === 'fr' ? 'Voir tous les projets' : 'View All Projects'}
        </Button>
      </div>
    );
  }

  // No project data yet
  if (!project) {
    return (
      <div className="min-h-screen bg-bg-light dark:bg-bg-dark flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen">
      {/* Preview Banner */}
      {preview && (
        <div className="sticky top-0 z-50 bg-primary text-white px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">visibility</span>
            <span className="font-bold">
              {language === 'ar' ? 'وضع المعاينة - هذا ليس منشوراً بعد' :
               language === 'fr' ? 'Mode Aperçu - Ce n\'est pas encore publié' :
               'Preview Mode - Not Published Yet'}
            </span>
          </div>
        </div>
      )}
      {/* Main Content Container - Two Column Layout on Desktop */}
      <div className="flex flex-col lg:flex-row gap-8 px-4 pb-24 max-w-7xl mx-auto">
        
        {/* LEFT COLUMN - Sticky on Desktop */}
        <div className="lg:w-1/3 lg:sticky lg:top-24 lg:self-start space-y-6">
          {/* Main Project Image */}
          <div className="w-full">
            <div
              className="w-full bg-center bg-no-repeat bg-cover flex flex-col justify-end overflow-hidden rounded-2xl min-h-[250px] md:min-h-[300px] shadow-lg"
              style={{ backgroundImage: `url("${project.image}")` }}
            />
          </div>

          {/* Project Title */}
          <div className="flex flex-col">
            <h1 className="text-text-primary dark:text-white tracking-tight text-2xl md:text-3xl font-bold leading-tight">
              {getLocalizedText(project.title)}
            </h1>
            <div className="flex items-center gap-2 mt-2 text-primary font-medium">
              <span className="material-symbols-outlined text-sm">location_on</span>
              <span className="text-sm">{getLocalizedText(project.location)}</span>
            </div>
          </div>

          {/* Top Donate Button - Prominent CTA at top of page */}
          <button
            onClick={handleDonateClick}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
          >
            <span className="material-symbols-outlined">favorite</span>
            {language === 'ar' ? 'تبرع الآن' : language === 'fr' ? 'Faire un Don' : 'Donate Now'}
          </button>

          {/* Donation Progress Card - NOT sticky on mobile, sticky container on desktop */}
          <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 shadow-lg border border-border-light dark:border-white/10">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-text-secondary dark:text-text-white/60">
                    {language === 'ar'
                      ? `تم جمعه من أصل ${project.goal.toLocaleString()} MAD`
                      : language === 'fr'
                      ? `Collecté sur ${project.goal.toLocaleString()} MAD`
                      : `Raised of ${project.goal.toLocaleString()} MAD`}
                  </p>
                  <h3 className="text-2xl font-bold text-primary">{project.raised.toLocaleString()} MAD</h3>
                </div>
                <p className="text-sm font-bold text-text-primary dark:text-white">{project.progress}%</p>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-primary/20 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs font-medium text-text-secondary dark:text-text-white/70">
                <span>
                  {project.donors} {language === 'ar' ? 'متبرع' : language === 'fr' ? 'Donateurs' : 'Donors'}
                </span>
                <span>
                  {project.daysLeft} {language === 'ar' ? 'يوم متبقي' : language === 'fr' ? 'Jours Restants' : 'Days Left'}
                </span>
              </div>
              
              {/* Donate Button - Desktop only (mobile has button at bottom) */}
              <button
                onClick={handleDonateClick}
                className="hidden lg:flex w-full items-center justify-center gap-2 py-4 px-6 rounded-xl bg-primary text-white font-bold text-base shadow-lg shadow-primary/25 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98] transition-all duration-200"
              >
                <span className="material-symbols-outlined">favorite</span>
                {language === 'ar' ? 'تبرع الآن' : language === 'fr' ? 'Faire un Don' : 'Donate Now'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - Scrollable Content */}
        <div className="lg:w-2/3 space-y-8">
          {/* About Section */}
          <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 shadow-sm border border-border-light dark:border-white/10">
            <h3 className="text-text-primary dark:text-white text-xl font-bold leading-tight mb-4">
              {language === 'ar' ? 'عن هذا المشروع' : language === 'fr' ? 'À propos de ce projet' : 'About this project'}
            </h3>
            <div className="space-y-4 text-text-secondary dark:text-text-white/80 text-base font-normal leading-relaxed">
              <p>{getLocalizedText(project.description)}</p>
              {getLocalizedText(project.description2) && <p>{getLocalizedText(project.description2)}</p>}
            </div>
          </div>

          {/* Impact Section */}
          {getLocalizedText(project.impact) && (
            <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">volunteer_activism</span>
                </div>
                <h3 className="text-text-primary dark:text-white text-lg font-bold">
                  {language === 'ar' ? 'التأثير' : language === 'fr' ? 'Impact' : 'Impact'}
                </h3>
              </div>
              <p className="text-text-secondary dark:text-text-white/80 leading-relaxed">
                {getLocalizedText(project.impact)}
              </p>
            </div>
          )}

          {/* Gallery Section */}
          {project.gallery && project.gallery.length > 0 && (
            <div>
              <h3 className="text-text-primary dark:text-white text-lg font-bold leading-tight mb-4">
                {language === 'ar' ? 'المجتمع والتقدم' : language === 'fr' ? 'Communauté et Progrès' : 'Community & Progress'}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {project.gallery[0] && (
                  <div className="aspect-square rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={project.gallery[0]}
                      alt="Community"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                {project.gallery[1] && (
                  <div className="aspect-square rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={project.gallery[1]}
                      alt="Construction"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                {project.gallery[2] && (
                  <div className="col-span-2 h-48 rounded-xl overflow-hidden shadow-sm">
                    <img
                      src={project.gallery[2]}
                      alt="Landscape"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Project Progress Updates */}
          {project.updates && project.updates.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-text-primary dark:text-white text-lg font-bold">
                  {language === 'ar' ? 'آخر التحديثات' : language === 'fr' ? 'Dernières Mises à Jour' : 'Latest Updates'}
                </h3>
                <span className="text-primary text-sm font-bold cursor-pointer hover:underline">
                  {language === 'ar' ? 'عرض الكل' : language === 'fr' ? 'Voir Tout' : 'View All'}
                </span>
              </div>
              {project.updates.map((update) => (
                <div
                  key={update.id}
                  className="flex gap-4 p-5 rounded-xl bg-white dark:bg-bg-dark-card border border-border-light dark:border-white/10 shadow-sm"
                >
                  <div className="flex-shrink-0 size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">{update.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted dark:text-text-white/50">{update.date}</p>
                    <h4 className="font-bold text-text-primary dark:text-white">{getLocalizedText(update.title)}</h4>
                    <p className="text-sm text-text-secondary dark:text-text-white/70">
                      {getLocalizedText(update.description)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Action - Transparency */}
          <div className="py-8 flex flex-col items-center gap-4 text-center bg-white dark:bg-bg-dark-card rounded-2xl p-6 border border-border-light dark:border-white/10">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <span className="material-symbols-outlined text-4xl">verified_user</span>
            </div>
            <h4 className="font-bold text-text-primary dark:text-white text-xl">
              {language === 'ar' ? '100٪ شفافية' : language === 'fr' ? '100% de Transparence' : '100% Transparency'}
            </h4>
            <p className="text-sm text-text-secondary dark:text-text-white/60 px-8 max-w-md">
              {language === 'ar'
                ? 'يتم تتبع كل درهم وتدقيقه لضمان الاستفادة المباشرة للمجتمع.'
                : language === 'fr'
                ? 'Chaque dirham est suivi et audité pour garantir qu\'il profite directement à la communauté.'
                : 'Every dirham is tracked and audited to ensure it directly benefits the community.'}
            </p>
          </div>

          {/* Mobile: Donate Button at Bottom */}
          <div className="lg:hidden">
            <button
              onClick={handleDonateClick}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-primary text-white font-bold text-lg shadow-lg shadow-primary/25 hover:bg-primary-600 active:scale-[0.98] transition-all duration-200"
            >
              <span className="material-symbols-outlined">favorite</span>
              {language === 'ar' ? 'تبرع الآن' : language === 'fr' ? 'Faire un Don' : 'Donate Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-50 w-12 h-12 rounded-full bg-white dark:bg-bg-dark-card shadow-lg border border-border-light dark:border-white/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all duration-300 ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Scroll to top"
      >
        <span className="material-symbols-outlined">arrow_upward</span>
      </button>
    </div>
  );
};

export default ProjectDetail;
