import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import Card from '../components/Card';
import Badge from '../components/Badge';

// ============================================
// ADMIN PROJECTS PAGE - Project Management
// With Featured Indicator and Working Buttons
// ============================================

// Helper function to safely get string value from potentially i18n object
const getStringValue = (value, currentLang = 'en') => {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return value[currentLang] || value.en || value.fr || value.ar || '';
  }
  return String(value || '');
};

const AdminProjects = () => {
  const { currentLanguage, showToast, isDarkMode } = useApp();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  // Convex hooks
  const convexProjects = useQuery(api.projects.getProjects, {});
  const deleteProjectMutation = useMutation(api.projects.deleteProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);

  // Translations
  const translations = {
    ar: {
      title: 'إدارة المشاريع',
      newProject: 'مشروع جديد',
      search: 'البحث في المشاريع...',
      all: 'الكل',
      active: 'نشط',
      completed: 'مكتمل',
      draft: 'مسودة',
      grid: 'شبكة',
      list: 'قائمة',
      goal: 'الهدف',
      raised: 'تم جمعه',
      donors: 'متبرعون',
      daysLeft: 'يوم متبقي',
      edit: 'تعديل',
      view: 'عرض',
      delete: 'حذف',
      featured: 'مميز',
      confirmDelete: 'هل أنت متأكد من الحذف؟',
      cancel: 'إلغاء',
      confirm: 'تأكيد',
      projectDeleted: 'تم حذف المشروع',
      statusUpdated: 'تم تحديث الحالة',
      noProjects: 'لا توجد مشاريع',
      showing: 'عرض',
      of: 'من',
      projects: 'مشاريع',
      previous: 'السابق',
      next: 'التالي',
      toggleStatus: 'تغيير الحالة',
      markAsFeatured: 'تمييز كمشروع مميز',
      removeFeatured: 'إزالة من المميز',
    },
    fr: {
      title: 'Gestion des Projets',
      newProject: 'Nouveau Projet',
      search: 'Rechercher des projets...',
      all: 'Tous',
      active: 'Actif',
      completed: 'Terminé',
      draft: 'Brouillon',
      grid: 'Grille',
      list: 'Liste',
      goal: 'Objectif',
      raised: 'Collecté',
      donors: 'Donateurs',
      daysLeft: 'jours restants',
      edit: 'Modifier',
      view: 'Voir',
      delete: 'Supprimer',
      featured: 'En Vedette',
      confirmDelete: 'Confirmer la suppression?',
      cancel: 'Annuler',
      confirm: 'Confirmer',
      projectDeleted: 'Projet supprimé',
      statusUpdated: 'Statut mis à jour',
      noProjects: 'Aucun projet trouvé',
      showing: 'Affichage',
      of: 'sur',
      projects: 'projets',
      previous: 'Précédent',
      next: 'Suivant',
      toggleStatus: 'Changer le statut',
      markAsFeatured: 'Marquer comme en vedette',
      removeFeatured: 'Retirer des vedettes',
    },
    en: {
      title: 'Project Management',
      newProject: 'New Project',
      search: 'Search projects...',
      all: 'All',
      active: 'Active',
      completed: 'Completed',
      draft: 'Draft',
      grid: 'Grid',
      list: 'List',
      goal: 'Goal',
      raised: 'Raised',
      donors: 'Donors',
      daysLeft: 'days left',
      edit: 'Edit',
      view: 'View',
      delete: 'Delete',
      featured: 'Featured',
      confirmDelete: 'Confirm deletion?',
      cancel: 'Cancel',
      confirm: 'Confirm',
      projectDeleted: 'Project deleted',
      statusUpdated: 'Status updated',
      noProjects: 'No projects found',
      showing: 'Showing',
      of: 'of',
      projects: 'projects',
      previous: 'Previous',
      next: 'Next',
      toggleStatus: 'Toggle status',
      markAsFeatured: 'Mark as featured',
      removeFeatured: 'Remove from featured',
    },
  };

  const t = translations[currentLanguage?.code] || translations.en;

  // Map Convex projects to component shape (no mock fallback)
  const projects = (convexProjects ?? []).map(p => ({
    id: p._id,
    _id: p._id,
    title: p.title,
    category: p.category,
    status: p.status,
    featured: p.isFeatured,
    goal: p.goalAmount,
    raised: p.raisedAmount,
    donors: 0,
    daysLeft: p.endDate ? Math.ceil((p.endDate - Date.now()) / (1000 * 60 * 60 * 24)) : null,
    image: convexFileUrl(p.mainImage) || p.mainImage,
    location: p.location,
    beneficiaries: p.beneficiaries,
  }));

  // Filter projects with safe string handling
  const filteredProjects = projects.filter(project => {
    const title = getStringValue(project.title, currentLanguage?.code).toLowerCase();
    const category = getStringValue(project.category, currentLanguage?.code).toLowerCase();
    const matchesSearch = title.includes(searchQuery.toLowerCase()) ||
                         category.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const paginatedProjects = filteredProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', label: t.active },
      completed: { variant: 'neutral', label: t.completed },
      draft: { variant: 'warning', label: t.draft },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  // Handle delete project
  const handleDelete = async (id) => {
    if (deleteConfirmId === id) {
      try {
        await deleteProjectMutation({ projectId: id });
        setDeleteConfirmId(null);
        showToast(t.projectDeleted, 'success');
      } catch (error) {
        console.error('Delete error:', error);
        showToast('Failed to delete project', 'error');
      }
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    const statuses = ['active', 'completed', 'draft'];
    const currentIndex = statuses.indexOf(project.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    
    try {
      await updateProjectMutation({
        projectId: id,
        updates: { status: nextStatus }
      });
      showToast(t.statusUpdated, 'success');
    } catch (error) {
      console.error('Update error:', error);
      showToast('Failed to update status', 'error');
    }
  };

  // Handle toggle featured
  const handleToggleFeatured = async (id) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;
    
    try {
      await updateProjectMutation({
        projectId: id,
        updates: { isFeatured: !project.featured }
      });
      showToast(!project.featured ? t.markAsFeatured : t.removeFeatured, 'success');
    } catch (error) {
      console.error('Update error:', error);
      showToast('Failed to update featured status', 'error');
    }
  };

  // Handle view project
  const handleView = (id) => {
    navigate(`/admin/projects/${id}`);
  };

  // Handle edit project
  const handleEdit = (id) => {
    navigate(`/admin/projects/${id}/edit`);
  };

  // Show loading while Convex fetches
  if (convexProjects === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">
            {currentLanguage?.code === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary dark:text-white">{t.title}</h1>
        <Link
          to="/admin/projects/new"
          className="flex items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined">add</span>
          <span>{t.newProject}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t.search}
            className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-primary dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">{t.all}</option>
            <option value="active">{t.active}</option>
            <option value="completed">{t.completed}</option>
            <option value="draft">{t.draft}</option>
          </select>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-500 hover:text-primary'}`}
            >
              <span className="material-symbols-outlined">view_list</span>
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedProjects.map((project) => (
            <Card key={project.id} padding="none" className="overflow-hidden hover:shadow-lg transition-shadow dark:bg-bg-dark-card dark:border-white/10">
              {/* Image */}
              <div className="relative h-48">
                <img
                  src={project.image || project.mainImage || 'https://via.placeholder.com/400x200?text=No+Image'}
                  alt={getStringValue(project.title, currentLanguage?.code)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3">
                  {getStatusBadge(project.status)}
                </div>
                {/* Featured Badge */}
                {project.featured && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="primary" size="sm" className="bg-primary text-white">
                      <span className="material-symbols-outlined text-xs mr-1">star</span>
                      {t.featured}
                    </Badge>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <span className="text-white/80 text-sm">{getStringValue(project.category, currentLanguage?.code)}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <h3 className="font-bold text-text-primary dark:text-white text-lg mb-3">{getStringValue(project.title, currentLanguage?.code)}</h3>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500 dark:text-slate-400">{t.raised}</span>
                    <span className="font-bold text-primary">{(project.raised || 0).toLocaleString()} DH</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min(((project.raised || 0) / (project.goal || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{Math.round(((project.raised || 0) / (project.goal || 1)) * 100)}% {t.goal}</span>
                    <span>{(project.goal || 0).toLocaleString()} DH</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm mb-4">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">people</span>
                    <span>{project.donors || 0} {t.donors}</span>
                  </div>
                  {(project.daysLeft || 0) > 0 && (
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      <span>{project.daysLeft} {t.daysLeft}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleEdit(project.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    {t.edit}
                  </button>
                  <button
                    onClick={() => handleView(project.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    {t.view}
                  </button>
                  <button
                    onClick={() => handleToggleFeatured(project.id)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      project.featured 
                        ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary'
                    }`}
                    title={project.featured ? t.removeFeatured : t.markAsFeatured}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {project.featured ? 'star' : 'star_border'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
                    className={`p-2.5 rounded-lg transition-colors ${
                      deleteConfirmId === project.id
                        ? 'bg-error text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-error'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {deleteConfirmId === project.id ? 'check' : 'delete'}
                    </span>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <Card padding="none" className="overflow-hidden dark:bg-bg-dark-card dark:border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Project</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Progress</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Donors</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={project.image || project.mainImage || 'https://via.placeholder.com/48?text=No+Image'}
                            alt={getStringValue(project.title, currentLanguage?.code)}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          {project.featured && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-[10px] text-white">star</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-text-primary dark:text-white">{getStringValue(project.title, currentLanguage?.code)}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{getStringValue(project.category, currentLanguage?.code)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleToggleStatus(project.id)}>
                        {getStatusBadge(project.status)}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">{Math.round(((project.raised || 0) / (project.goal || 1)) * 100)}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.min(((project.raised || 0) / (project.goal || 1)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-text-primary dark:text-white">{project.donors || 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(project.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                          title={t.edit}
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => handleView(project.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-colors"
                          title={t.view}
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </button>
                        <button
                          onClick={() => handleToggleFeatured(project.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            project.featured ? 'text-primary bg-primary/10' : 'text-slate-500 hover:text-primary'
                          }`}
                          title={project.featured ? t.removeFeatured : t.markAsFeatured}
                        >
                          <span className="material-symbols-outlined">
                            {project.featured ? 'star' : 'star_border'}
                          </span>
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            deleteConfirmId === project.id
                              ? 'bg-error text-white'
                              : 'text-slate-500 hover:text-error'
                          }`}
                        >
                          <span className="material-symbols-outlined">
                            {deleteConfirmId === project.id ? 'check' : 'delete'}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t.showing} {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredProjects.length)} {t.of} {filteredProjects.length} {t.projects}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t.previous}
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {t.next}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-400">folder_off</span>
          </div>
          <h3 className="text-lg font-medium text-text-primary dark:text-white mb-2">{t.noProjects}</h3>
          <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
