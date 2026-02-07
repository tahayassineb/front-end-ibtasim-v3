import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

// ============================================
// ADMIN PROJECT DETAIL PAGE - Project Overview
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
      recentDonations: 'Recent Donations',
      donor: 'Donor',
      amount: 'Amount',
      date: 'Date',
      noDonations: 'No donations yet',
      confirmDelete: 'Are you sure you want to delete this project?',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Mock project data
  const project = {
    id: parseInt(id) || 1,
    title: 'Clean Water Initiative',
    category: 'Water',
    status: 'active',
    goal: 50000,
    raised: 32500,
    donors: 142,
    daysLeft: 45,
    description: 'Providing sustainable clean water solutions for rural communities in the Atlas Mountains region. This project aims to install water purification systems and build wells in 10 villages, benefiting over 5,000 residents.',
    image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=400',
      'https://images.unsplash.com/photo-1541544537156-21c5299228d8?w=400',
      'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=400',
    ],
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
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">{project.title}</h1>
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

      {/* Project Image */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <Badge variant={project.status === 'active' ? 'success' : 'neutral'} size="lg">
            {project.status === 'active' ? 'Active' : project.status}
          </Badge>
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
        {/* Left Column - Description & Gallery */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">{t.description}</h2>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{project.description}</p>
          </Card>

          {/* Gallery */}
          <Card padding="lg">
            <h2 className="text-lg font-bold text-text-primary dark:text-white mb-4">{t.gallery}</h2>
            <div className="grid grid-cols-3 gap-4">
              {project.gallery.map((image, index) => (
                <div key={index} className="aspect-square rounded-xl overflow-hidden">
                  <img
                    src={image}
                    alt={`Gallery ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform"
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column - Donations */}
        <div>
          <Card padding="lg">
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
