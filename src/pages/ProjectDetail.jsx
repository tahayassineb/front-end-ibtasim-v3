import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button, ProgressBar } from '../components';

// ============================================
// PROJECT DETAIL PAGE - Two-Column Layout
// ============================================

const ProjectDetail = ({ preview = false }) => {
  const { t, language, isAuthenticated } = useApp();
  const { id } = useParams();
  const navigate = useNavigate();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Load preview data from sessionStorage if in preview mode
  useEffect(() => {
    if (preview) {
      const stored = sessionStorage.getItem('projectPreview');
      if (stored) {
        setPreviewData(JSON.parse(stored));
      }
    }
  }, [preview]);

  // Mock project data - in real app, fetch by id
  const mockProject = {
    id: id,
    title: {
      en: 'Sustainable Atlas Education Hub',
      fr: 'Centre d\'Éducation Durable de l\'Atlas',
      ar: 'مركز التعليم المستدام في الأطلس',
    },
    location: {
      en: 'High Atlas Mountains, Morocco',
      fr: 'Haut Atlas, Maroc',
      ar: 'جبال الأطلس العالي، المغرب',
    },
    description: {
      en: 'In the heart of the High Atlas, children travel hours to reach basic education. Our mission is to build a sustainable, eco-friendly school that serves as a beacon of hope for three surrounding villages.',
      fr: 'Au cœur du Haut Atlas, les enfants parcourent des heures pour accéder à l\'éducation de base. Notre mission est de construire une école durable et écologique qui serve de phare d\'espoir pour trois villages environnants.',
      ar: 'في قلب الأطلس العالي، يسافر الأطفال ساعات للوصول إلى التعليم الأساسي. مهمتنا هي بناء مدرسة مستدامة وصديقة للبيئة تكون منارة أمل لثلاث قرى مجاورة.',
    },
    description2: {
      en: 'The architecture draws inspiration from traditional earth-building techniques, ensuring natural thermal regulation during harsh winters and hot summers, combined with modern solar energy and digital facilities.',
      fr: 'L\'architecture s\'inspire des techniques traditionnelles de construction en terre, assurant une régulation thermique naturelle pendant les hivers rigoureux et les étés chauds, combinée avec l\'énergie solaire moderne et les installations numériques.',
      ar: 'يستلهم العمارة التقنيات التقليدية للبناء بالطين، مما يضمن التنظيم الحراري الطبيعي خلال فصول الشتاء القاسية والصيف الحار، بالإضافة إلى الطاقة الشمسية الحديثة والمرافق الرقمية.',
    },
    impact: {
      en: 'This project will directly impact 150 children across three villages, providing them with access to quality education, digital literacy, and a safe learning environment year-round.',
      fr: 'Ce projet impactera directement 150 enfants dans trois villages, leur donnant accès à une éducation de qualité, à la littératie numérique et à un environnement d\'apprentissage sûr toute l\'année.',
      ar: 'سيؤثر هذا المشروع بشكل مباشر على 150 طفلاً في ثلاث قرى، مما يوفر لهم الوصول إلى تعليم عالي الجودة والمعرفة الرقمية وبيئة تعليمية آمنة على مدار العام.',
    },
    raised: 52480,
    goal: 75000,
    progress: 70,
    donors: 124,
    daysLeft: 12,
    category: 'education',
    image: 'https://images.unsplash.com/photo-1564429238984-b3cd3a5ba0b4?w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&q=80',
      'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?w=600&q=80',
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
    ],
    updates: [
      {
        id: 1,
        date: 'Oct 24, 2023',
        title: {
          en: 'Foundation Completed',
          fr: 'Fondation Terminée',
          ar: 'اكتمل الأساس',
        },
        description: {
          en: 'The main structure base is now secure and ready for wall assembly.',
          fr: 'La base de la structure principale est maintenant sécurisée et prête pour l\'assemblage des murs.',
          ar: 'قاعدة الهيكل الرئيسي آمنة الآن وجاهزة لتجميع الجدران.',
        },
        icon: 'foundation',
      },
      {
        id: 2,
        date: 'Nov 15, 2023',
        title: {
          en: 'Materials Delivered',
          fr: 'Matériaux Livrés',
          ar: 'تم تسليم المواد',
        },
        description: {
          en: 'All sustainable building materials have arrived at the construction site.',
          fr: 'Tous les matériaux de construction durables sont arrivés sur le chantier.',
          ar: 'وصلت جميع مواد البناء المستدامة إلى موقع البناء.',
        },
        icon: 'local_shipping',
      },
    ],
  };

  // Use preview data if in preview mode
  const project = previewData || mockProject;

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en;
  };

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

  const handleDonateClick = () => {
    navigate(`/donate/${project.id}`);
  };

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

          {/* Donation Progress Card - NOT sticky on mobile, sticky container on desktop */}
          <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 shadow-lg border border-border-light dark:border-white/10">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm text-text-secondary dark:text-text-white/60">
                    {language === 'ar'
                      ? 'تم جمعه من أصل $75,000'
                      : language === 'fr'
                      ? 'Collecté sur $75,000'
                      : 'Raised of $75,000'}
                  </p>
                  <h3 className="text-2xl font-bold text-primary">${project.raised.toLocaleString()}</h3>
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
              <p>{getLocalizedText(project.description2)}</p>
            </div>
          </div>

          {/* Impact Section */}
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

          {/* Gallery Section */}
          <div>
            <h3 className="text-text-primary dark:text-white text-lg font-bold leading-tight mb-4">
              {language === 'ar' ? 'المجتمع والتقدم' : language === 'fr' ? 'Communauté et Progrès' : 'Community & Progress'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="aspect-square rounded-xl overflow-hidden shadow-sm">
                <img
                  src={project.gallery[0]}
                  alt="Community"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="aspect-square rounded-xl overflow-hidden shadow-sm">
                <img
                  src={project.gallery[1]}
                  alt="Construction"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="col-span-2 h-48 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={project.gallery[2]}
                  alt="Landscape"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>
          </div>

          {/* Project Progress Updates */}
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
