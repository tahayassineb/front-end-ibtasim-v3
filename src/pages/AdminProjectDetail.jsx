import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

// ============================================
// ADMIN PROJECT DETAIL PAGE - Project Overview
// Connected to Convex backend
// ============================================

const AdminProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentLanguage, formatCurrency } = useApp();

  // Convex queries
  const project = useQuery(api.projects.getProjectById, id ? { projectId: id } : 'skip');
  const projectDonations = useQuery(api.donations.getDonationsByProject, id ? { projectId: id } : 'skip');
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

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
      recentDonations: 'أحدث التبرعات',
      donor: 'المتبرع',
      amount: 'المبلغ',
      date: 'التاريخ',
      noDonations: 'لا توجد تبرعات بعد',
      noGallery: 'لا توجد صور بعد',
      confirmDelete: 'هل أنت متأكد من حذف هذا المشروع؟',
      anonymous: 'متبرع مجهول',
      loading: 'جار التحميل...',
      notFound: 'المشروع غير موجود',
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
      recentDonations: 'Dons Récents',
      donor: 'Donateur',
      amount: 'Montant',
      date: 'Date',
      noDonations: 'Aucun don pour l\'instant',
      noGallery: 'Aucune image pour l\'instant',
      confirmDelete: 'Êtes-vous sûr de vouloir supprimer ce projet ?',
      anonymous: 'Donateur Anonyme',
      loading: 'Chargement...',
      notFound: 'Projet introuvable',
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
      recentDonations: 'Recent Donations',
      donor: 'Donor',
      amount: 'Amount',
      date: 'Date',
      noDonations: 'No donations yet',
      noGallery: 'No gallery images yet',
      confirmDelete: 'Are you sure you want to delete this project?',
      anonymous: 'Anonymous Donor',
      loading: 'Loading...',
      notFound: 'Project not found',
    },
  };

  const t = translations[currentLanguage?.code] || translations.en;

  const getContent = (field) => {
    if (typeof field === 'object' && field !== null) {
      return field[currentLanguage?.code] || field.en || '';
    }
    return field || '';
  };

  const handleDelete = async () => {
    if (window.confirm(t.confirmDelete)) {
      await deleteProjectMutation({ projectId: id });
      navigate('/admin/projects');
    }
  };

  // Loading state
  if (project === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 animate-spin">progress_activity</span>
          <p className="text-slate-500 mt-3">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Not found
  if (project === null) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300">folder_off</span>
          <p className="text-slate-500 mt-3 mb-4">{t.notFound}</p>
          <Link to="/admin/projects">
            <Button variant="primary" icon="arrow_back">{t.back}</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Computed values
  const goalMAD = project.goalAmount / 100;
  const raisedMAD = project.raisedAmount / 100;
  const progress = goalMAD > 0 ? Math.min((raisedMAD / goalMAD) * 100, 100) : 0;
  const donorCount = projectDonations?.length || 0;
  const daysLeft = project.endDate
    ? Math.max(0, Math.ceil((project.endDate - Date.now()) / (1000 * 60 * 60 * 24)))
    : '—';
  const imageUrl = convexFileUrl(project.mainImage) || project.mainImage;
  const galleryUrls = (project.gallery || []).map(storageId => convexFileUrl(storageId) || storageId);

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
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={getContent(project.title)}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-slate-300">image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2">
            <Badge variant={project.status === 'active' ? 'success' : 'neutral'} size="lg">
              {project.status}
            </Badge>
            {project.isFeatured && (
              <Badge variant="primary" size="lg">
                <span className="material-symbols-outlined text-sm mr-1">star</span>
                Featured
              </Badge>
            )}
          </div>
          <h2 className="text-white text-xl font-bold mt-2 drop-shadow-lg">
            {getContent(project.title)}
          </h2>
          <p className="text-white/80 text-sm mt-1 drop-shadow capitalize">
            {project.category} · {project.location || '—'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.goal}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-white">
            {goalMAD.toLocaleString()} DH
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.raised}</p>
          <p className="text-2xl font-bold text-primary">
            {raisedMAD.toLocaleString()} DH
          </p>
        </Card>
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.donors}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-white">{donorCount}</p>
        </Card>
        <Card padding="lg">
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">{t.daysLeft}</p>
          <p className="text-2xl font-bold text-text-primary dark:text-white">{daysLeft}</p>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card padding="lg">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-text-primary dark:text-white">
            {Math.round(progress)}% {t.raised}
          </span>
          <span className="text-sm text-slate-500">
            {t.goal}: {goalMAD.toLocaleString()} DH
          </span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Description & Gallery */}
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
            {project.beneficiaries && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-sm text-slate-500">
                <span className="material-symbols-outlined text-base">group</span>
                <span>{project.beneficiaries.toLocaleString()} beneficiaries</span>
              </div>
            )}
          </Card>

          {/* Gallery */}
          <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">photo_library</span>
              <h2 className="text-lg font-bold text-text-primary dark:text-white">{t.gallery}</h2>
              <span className="text-sm text-slate-400 ml-auto">{galleryUrls.length} images</span>
            </div>
            {galleryUrls.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryUrls.map((url, index) => (
                  <div key={index} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {url ? (
                      <img
                        src={url}
                        alt={`Gallery ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-3xl text-slate-300">image</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">photo_library</span>
                <p className="text-slate-500">{t.noGallery}</p>
              </div>
            )}
          </Card>
        </div>

        {/* Right Column - Donations */}
        <div>
          <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">{t.recentDonations}</h2>
            {projectDonations === undefined ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-3xl text-slate-300 animate-spin">progress_activity</span>
              </div>
            ) : projectDonations.length > 0 ? (
              <div className="space-y-4">
                {projectDonations.slice(0, 10).map((donation) => (
                  <div
                    key={donation._id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
                  >
                    <div>
                      <p className="font-medium text-text-primary dark:text-white text-sm">
                        {donation.isAnonymous ? t.anonymous : t.donor}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(donation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-sm">
                        {formatCurrency(donation.amount / 100)}
                      </p>
                      <Badge
                        variant={donation.status === 'completed' ? 'success' : donation.status === 'pending' ? 'warning' : 'neutral'}
                        size="sm"
                        className="text-[10px]"
                      >
                        {donation.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">volunteer_activism</span>
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
