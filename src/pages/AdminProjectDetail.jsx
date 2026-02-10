import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

// ============================================
// ADMIN PROJECT DETAIL PAGE - Project Overview
// With Impact Section, Updates, and Full Gallery
// ============================================

const AdminProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage } = useApp();

  // Translations
  const translations = {
    ar: {
      back: 'العودة للمشاريع',
      edit: 'تعديل المشروع',
      delete: 'حذف المشروع',
      overview: 'نظرة عامة',
      donations: 'التبرعات',
      gallery: 'معرض الصور',
      status: 'الحالة',
      category: 'التصنيف',
      goal: 'الهدف',
      raised: 'تم جمعه',
      donors: 'المتبرعون',
      daysLeft: 'الأيام المتبقية',
      description: 'الوصف',
      impact: 'التأثير المباشر',
      impactDescription: 'وصف التأثير',
      impactMetrics: 'مؤشرات التأثير',
      updates: 'التحديثات',
      latestUpdate: 'آخر تحديث',
      noUpdates: 'لا توجد تحديثات بعد',
      recentDonations: 'أحدث التبرعات',
      donor: 'المتبرع',
      amount: 'المبلغ',
      date: 'التاريخ',
      noDonations: 'لا توجد تبرعات بعد',
      confirmDelete: 'هل أنت متأكد من حذف هذا المشروع؟',
    },
    fr: {
      back: 'Retour aux Projets',
      edit: 'Modifier le Projet',
      delete: 'Supprimer le Projet',
      overview: 'Aperçu',
      donations: 'Dons',
      gallery: 'Galerie',
      status: 'Statut',
      category: 'Catégorie',
      goal: 'Objectif',
      raised: 'Collecté',
      donors: 'Donateurs',
      daysLeft: 'Jours Restants',
      description: 'Description',
      impact: 'Impact Direct',
      impactDescription: 'Description de l\'impact',
      impactMetrics: 'Indicateurs d\'Impact',
      updates: 'Mises à Jour',
      latestUpdate: 'Dernière Mise à Jour',
      noUpdates: 'Aucune mise à jour pour l\'instant',
      recentDonations: 'Dons Récents',
      donor: 'Donateur',
      amount: 'Montant',
      date: 'Date',
      noDonations: 'Aucun don pour l\'instant',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce projet ?',
    },
    en: {
      back: 'Back to Projects',
      edit: 'Edit Project',
      delete: 'Delete Project',
      overview: 'Overview',
      donations: 'Donations',
      gallery: 'Gallery',
      status: 'Status',
      category: 'Category',
      goal: 'Goal',
      raised: 'Raised',
      donors: 'Donors',
      daysLeft: 'Days Left',
      description: 'Description',
      impact: 'Direct Impact',
      impactDescription: 'Impact Description',
      impactMetrics: 'Impact Metrics',
      updates: 'Updates',
      latestUpdate: 'Latest Update',
      noUpdates: 'No updates yet',
      recentDonations: 'Recent Donations',
      donor: 'Donor',
      amount: 'Amount',
      date: 'Date',
      noDonations: 'No donations yet',
      confirmDelete: 'Are you sure you want to delete this project?',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Mock project data with complete structure matching AdminProjectForm
  const project = {
    id: parseInt(id) || 1,
    title: {
      en: 'Clean Water Initiative',
      fr: 'Initiative d\'Accès à l\'Eau',
      ar: 'مبادرة الوصول إلى المياه النظيفة',
    },
    category: 'Water',
    status: 'active',
    goal: 50000,
    raised: 32500,
    donors: 142,
    daysLeft: 45,
    description: {
      en: '<p>In the heart of the Atlas Mountains, access to clean water remains a critical challenge for many communities. This project aims to provide sustainable water solutions through modern infrastructure while respecting traditional practices.</p><p><strong>Our Approach:</strong></p><ul><li>Community-led planning and implementation</li><li>Sustainable technology adapted to local conditions</li><li>Long-term maintenance and training programs</li></ul>',
      fr: '<p>Au cœur des montagnes de l\'Atlas, l\'accès à l\'eau potable reste un défi critique pour de nombreuses communautés. Ce projet vise à fournir des solutions durables grâce à une infrastructure moderne tout en respectant les pratiques traditionnelles.</p><p><strong>Notre Approche:</strong></p><ul><li>Planification et mise en œuvre dirigées par la communauté</li><li>Technologie durable adaptée aux conditions locales</li><li>Programmes de maintenance et de formation à long terme</li></ul>',
      ar: '<p>في قلب جبال الأطلس، يظل الوصول إلى المياه النظيفة تحدياً حرجاً للعديد من المجتمعات. يهدف هذا المشروع إلى توفير حلول مياه مستدامة من خلال بنية تحتية حديثة مع احترام الممارسات التقليدية.</p><p><strong>نهجنا:</strong></p><ul><li>التخطيط والتنفيذ بقيادة المجتمع</li><li>تقنية مستدامة مكيفة مع الظروف المحلية</li><li>برامج الصيانة والتدريب على المدى الطويل</li></ul>',
    },
    shortDescription: {
      en: 'Providing sustainable clean water solutions for rural communities in the Atlas Mountains region.',
      fr: 'Fournir des solutions d\'eau potable durables pour les communautés rurales de la région de l\'Atlas.',
      ar: 'توفير حلول مياه نظيفة مستدامة للمجتمعات الريفية في منطقة جبال الأطلس.',
    },
    mainImage: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800',
    image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800',
    gallery: [
      { id: 1, url: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=400', caption: 'Water well construction' },
      { id: 2, url: 'https://images.unsplash.com/photo-1541544537156-21c5299228d8?w=400', caption: 'Community meeting' },
      { id: 3, url: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400', caption: 'Water distribution' },
      { id: 4, url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400', caption: 'Local volunteers' },
    ],
    impact: {
      description: {
        en: 'This project will directly benefit over 5,000 residents across 10 villages by providing access to clean, safe drinking water. Expected outcomes include reduced waterborne diseases, improved school attendance, and economic growth through time savings.',
        fr: 'Ce projet bénéficiera directement à plus de 5 000 résidents dans 10 villages en fournissant un accès à l\'eau potable propre et sûre. Les résultats attendus incluent la réduction des maladies d\'origine hydrique, l\'amélioration de la fréquentation scolaire et la croissance économique grâce aux économies de temps.',
        ar: 'سيستفيد هذا المشروع مباشرة من أكثر من 5000 مقيم في 10 قرى من خلال توفير الوصول إلى مياه شرب نظيفة وآمنة. تشمل النتائج المتوقعة تقليل الأمراض المنقولة عن طريق المياه وتحسين الحضور المدرسي والنمو الاقتصادي من خلال توفير الوقت.',
      },
      metrics: [
        { id: 1, label: { en: 'People Benefited', fr: 'Personnes Bénéficiées', ar: 'الأشخاص المستفيدين' }, value: '5,000+', target: '5000' },
        { id: 2, label: { en: 'Wells Installed', fr: 'Puits Installés', ar: 'الآبار المثبتة' }, value: '10', target: '10' },
        { id: 3, label: { en: 'Villages Covered', fr: 'Villages Couverts', ar: 'القرى المشمولة' }, value: '10', target: '10' },
        { id: 4, label: { en: 'Disease Reduction', fr: 'Réduction des Maladies', ar: 'تقليل الأمراض' }, value: '60%', target: '50%' },
      ],
    },
    updates: [
      {
        id: 1,
        date: '2024-02-01',
        title: {
          en: 'First Well Completed',
          fr: 'Premier Puits Terminé',
          ar: 'اكتمال البئر الأول',
        },
        content: {
          en: 'We are excited to announce that the first well has been successfully completed in Tighza village. The community celebrated with a special ceremony.',
          fr: 'Nous sommes ravis d\'annoncer que le premier puits a été terminé avec succès dans le village de Tighza. La communauté a célébré avec une cérémonie spéciale.',
          ar: 'يسعدنا الإعلان عن اكتمال البئر الأول بنجاح في قرية تيغزا. احتفل المجتمع بحفل خاص.',
        },
      },
      {
        id: 2,
        date: '2024-01-15',
        title: {
          en: 'Project Launch',
          fr: 'Lancement du Projet',
          ar: 'إطلاق المشروع',
        },
        content: {
          en: 'The Clean Water Initiative has officially launched. We have begun community consultations and site assessments in all target villages.',
          fr: 'L\'Initiative d\'Accès à l\'Eau a été officiellement lancée. Nous avons commencé les consultations communautaires et les évaluations de sites dans tous les villages cibles.',
          ar: 'تم إطلاق مبادرة الوصول إلى المياه النظيفة رسمياً. لقد بدأنا الاستشارات المجتمعية وتقييمات المواقع في جميع القرى المستهدفة.',
        },
      },
    ],
    featured: true,
    createdAt: '2024-01-15',
  };

  // Mock donations for this project
  const donations = [
    { id: 1, donor: 'Mohammed Alami', amount: 5000, date: '2024-02-01', status: 'completed' },
    { id: 2, donor: 'Sara Fassi', amount: 1200, date: '2024-01-28', status: 'completed' },
    { id: 3, donor: 'Yassine Kabbaj', amount: 850, date: '2024-01-25', status: 'completed' },
    { id: 4, donor: 'Leila Benani', amount: 2500, date: '2024-01-20', status: 'completed' },
    { id: 5, donor: 'Amine Jilali', amount: 10000, date: '2024-01-18', status: 'completed' },
  ];

  const progress = Math.min((project.raised / project.goal) * 100, 100);

  // Get current language content
  const getContent = (field) => {
    if (typeof field === 'object' && field !== null) {
      return field[currentLanguage.code] || field.en || '';
    }
    return field || '';
  };

  const handleDelete = () => {
    if (window.confirm(t.confirmDelete)) {
      // Delete logic here
      navigate('/admin/projects');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/projects"
            className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">
            {getContent(project.title)}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="md"
            icon="edit"
            onClick={() => navigate(`/admin/projects/${id}/edit`)}
          >
            {t.edit}
          </Button>
          <Button
            variant="danger"
            size="md"
            icon="delete"
            onClick={handleDelete}
          >
            {t.delete}
          </Button>
        </div>
      </div>

      {/* Project Main Image */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
        <img
          src={project.mainImage || project.image}
          alt={getContent(project.title)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2">
            <Badge variant={project.status === 'active' ? 'success' : 'neutral'} size="lg">
              {project.status === 'active' ? 'Active' : project.status}
            </Badge>
            {project.featured && (
              <Badge variant="primary" size="lg">
                <span className="material-symbols-outlined text-sm mr-1">star</span>
                Featured
              </Badge>
            )}
          </div>
          <h2 className="text-white text-xl font-bold mt-2 drop-shadow-lg">
            {getContent(project.title)}
          </h2>
          <p className="text-white/80 text-sm mt-1 drop-shadow">
            {getContent(project.shortDescription)}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.goal}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-white">{project.goal.toLocaleString()} DH</p>
        </Card>
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.raised}</p>
          <p className="text-2xl font-bold text-primary">{project.raised.toLocaleString()} DH</p>
        </Card>
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.donors}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-white">{project.donors}</p>
        </Card>
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.daysLeft}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-white">{project.daysLeft}</p>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card padding="lg">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-text-primary dark:text-white">{Math.round(progress)}% {t.raised}</span>
          <span className="text-sm text-slate-500">{t.goal}: {project.goal.toLocaleString()} DH</span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Description, Impact, Updates & Gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">description</span>
              <h2 className="text-lg font-bold text-text-primary dark:text-white">{t.description}</h2>
            </div>
            <div 
              className="text-slate-600 dark:text-slate-300 leading-relaxed prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: getContent(project.description) }}
            />
          </Card>

          {/* Impact Section */}
          <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-xl">volunteer_activism</span>
              <h2 className="text-lg font-bold text-text-primary dark:text-white">{t.impact}</h2>
            </div>
            
            {/* Impact Description */}
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {getContent(project.impact.description)}
            </p>

            {/* Impact Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.impact.metrics.map((metric) => (
                <div 
                  key={metric.id}
                  className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                >
                  <p className="text-2xl font-bold text-primary mb-1">{metric.value}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {getContent(metric.label)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Updates Section */}
          <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">update</span>
                <h2 className="text-lg font-bold text-text-primary dark:text-white">{t.updates}</h2>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon="add"
                onClick={() => navigate(`/admin/projects/${id}/edit`)}
              >
                Add Update
              </Button>
            </div>

            {project.updates.length > 0 ? (
              <div className="space-y-4">
                {project.updates.map((update, index) => (
                  <div 
                    key={update.id}
                    className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-4 border-primary"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-text-primary dark:text-white">
                          {getContent(update.title)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">{update.date}</p>
                      </div>
                      {index === 0 && (
                        <Badge variant="primary" size="sm">{t.latestUpdate}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {getContent(update.content)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">update_disabled</span>
                <p className="text-slate-500">{t.noUpdates}</p>
              </div>
            )}
          </Card>

          {/* Gallery */}
          <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">photo_library</span>
              <h2 className="text-lg font-bold text-text-primary dark:text-white">{t.gallery}</h2>
              <span className="text-sm text-slate-400 ml-auto">{project.gallery.length} images</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {project.gallery.map((item, index) => (
                <div key={item.id || index} className="group relative aspect-square rounded-xl overflow-hidden">
                  <img
                    src={item.url || item}
                    alt={item.caption || `Gallery ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {item.caption && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-xs truncate">{item.caption}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Donations */}
        <div>
          <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">{t.recentDonations}</h2>
            {donations.length > 0 ? (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium text-text-primary dark:text-white text-sm">{donation.donor}</p>
                      <p className="text-xs text-slate-400">{donation.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">{donation.amount.toLocaleString()} DH</p>
                      <Badge variant="success" size="sm" className="text-[10px]">Completed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500">{t.noDonations}</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProjectDetail;
