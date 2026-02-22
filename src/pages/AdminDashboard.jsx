import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ============================================
// ADMIN DASHBOARD PAGE - Connected to Convex
// ============================================

const AdminDashboard = () => {
  const { currentLanguage, showToast } = useApp();
  const navigate = useNavigate();

  // Fetch dashboard stats from Convex
  const stats = useQuery(api.admin.getDashboardStats);

  // Fetch pending verifications
  const pendingVerifications = useQuery(api.admin.getVerifications, { 
    status: "awaiting_verification",
    limit: 5 
  });

  // Fetch featured projects
  const featuredProjectsData = useQuery(api.projects.getFeaturedProjects, { limit: 6 });

  // Local state for drag-and-drop (initialized from query data)
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  // Update local state when query data changes
  React.useEffect(() => {
    if (featuredProjectsData) {
      setFeaturedProjects(featuredProjectsData);
    }
  }, [featuredProjectsData]);

  const [draggedIndex, setDraggedIndex] = useState(null);
  
  // Mutation for updating featured order
  const updateFeaturedOrder = useMutation(api.projects.updateFeaturedOrder);

  // Translations
  const translations = {
    ar: {
      welcome: 'مرحباً، مشرف',
      newProject: 'مشروع جديد',
      addDonation: 'إضافة تبرع',
      stats: {
        totalDonations: 'إجمالي التبرعات',
        activeProjects: 'المشاريع النشطة',
        totalDonors: 'إجمالي المتبرعين',
        pendingVerifications: 'التحقق المعلق',
      },
      trendUp: '+12%',
      trendDown: '-2%',
      steady: 'ثابت',
      actionRequired: 'يتطلب إجراء',
      donationTrends: 'اتجاهات التبرعات',
      activity30Days: 'النشاط لآخر 30 يوماً',
      daily: 'يومي',
      weekly: 'أسبوعي',
      recentDonations: 'أحدث التبرعات',
      viewAll: 'عرض الكل',
      donor: 'المتبرع',
      project: 'المشروع',
      amount: 'المبلغ',
      status: 'الحالة',
      statuses: {
        completed: 'مكتمل',
        processing: 'قيد المعالجة',
      },
      featuredProjects: 'المشاريع المميزة',
      featuredDesc: 'المشاريع المعروضة على الصفحة الرئيسية',
      manageFeatured: 'إدارة المشاريع المميزة',
      dragToReorder: 'اسحب لإعادة الترتيب',
      maxFeatured: 'الحد الأقصى 6 مشاريع',
      addFeatured: 'إضافة مشروع مميز',
      removeFeatured: 'إزالة',
      saveOrder: 'حفظ الترتيب',
      orderSaved: 'تم حفظ الترتيب',
      loading: 'جاري التحميل...',
    },
    fr: {
      welcome: 'Bienvenue, Admin',
      newProject: 'Nouveau Projet',
      addDonation: 'Ajouter Don',
      stats: {
        totalDonations: 'Dons Totaux',
        activeProjects: 'Projets Actifs',
        totalDonors: 'Donateurs Totaux',
        pendingVerifications: 'Vérifications En Attente',
      },
      trendUp: '+12%',
      trendDown: '-2%',
      steady: 'Stable',
      actionRequired: 'Action Requise',
      donationTrends: 'Tendances des Dons',
      activity30Days: 'Activité des 30 derniers jours',
      daily: 'Quotidien',
      weekly: 'Hebdomadaire',
      recentDonations: 'Dons Récents',
      viewAll: 'Voir Tout',
      donor: 'Donateur',
      project: 'Projet',
      amount: 'Montant',
      status: 'Statut',
      statuses: {
        completed: 'Terminé',
        processing: 'En cours',
      },
      featuredProjects: 'Projets en Vedette',
      featuredDesc: 'Projets affichés sur la page d\'accueil',
      manageFeatured: 'Gérer les projets en vedette',
      dragToReorder: 'Glisser pour réorganiser',
      maxFeatured: 'Maximum 6 projets',
      addFeatured: 'Ajouter un projet en vedette',
      removeFeatured: 'Retirer',
      saveOrder: 'Sauvegarder l\'ordre',
      orderSaved: 'Ordre sauvegardé',
      loading: 'Chargement...',
    },
    en: {
      welcome: 'Welcome, Admin',
      newProject: 'New Project',
      addDonation: 'Add Donation',
      stats: {
        totalDonations: 'Total Donations',
        activeProjects: 'Active Projects',
        totalDonors: 'Total Donors',
        pendingVerifications: 'Pending Verifications',
      },
      trendUp: '+12%',
      trendDown: '-2%',
      steady: 'Steady',
      actionRequired: 'Action Required',
      donationTrends: 'Donation Trends',
      activity30Days: 'Activity over last 30 days',
      daily: 'Daily',
      weekly: 'Weekly',
      recentDonations: 'Recent Donations',
      viewAll: 'View All',
      donor: 'Donor',
      project: 'Project',
      amount: 'Amount',
      status: 'Status',
      statuses: {
        completed: 'Completed',
        processing: 'Processing',
      },
      featuredProjects: 'Featured Projects',
      featuredDesc: 'Projects displayed on the home page',
      manageFeatured: 'Manage Featured Projects',
      dragToReorder: 'Drag to reorder',
      maxFeatured: 'Maximum 6 projects',
      addFeatured: 'Add Featured Project',
      removeFeatured: 'Remove',
      saveOrder: 'Save Order',
      orderSaved: 'Order saved',
      loading: 'Loading...',
    },
  };

  const t = translations[currentLanguage?.code || 'en'];

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount / 100); // Convert cents to MAD
  };

  // Loading state
  if (stats === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-text-secondary">{t.loading}</p>
        </div>
      </div>
    );
  }

  // Stats cards data from Convex
  const statsCards = [
    { 
      key: 'totalDonations', 
      value: stats?.totalDonations?.toString() || '0', 
      label: t.stats.totalDonations,
      icon: 'payments',
      trend: '+12%',
      color: 'bg-emerald-500'
    },
    { 
      key: 'activeProjects', 
      value: stats?.activeProjects?.toString() || '0', 
      label: t.stats.activeProjects,
      icon: 'folder_open',
      trend: '+5%',
      color: 'bg-blue-500'
    },
    { 
      key: 'totalDonors', 
      value: stats?.totalDonors?.toString() || '0', 
      label: t.stats.totalDonors,
      icon: 'people',
      trend: '+8%',
      color: 'bg-violet-500'
    },
    { 
      key: 'pendingVerifications', 
      value: stats?.pendingVerifications?.toString() || '0', 
      label: t.stats.pendingVerifications,
      icon: 'pending_actions',
      trend: null,
      alert: stats?.pendingVerifications > 0,
      color: 'bg-amber-500'
    },
  ];

  // Mock chart data (replace with actual data from Convex)
  const donationData = stats?.monthlyDonations?.map(m => ({
    name: m.month,
    amount: m.amount / 100, // Convert cents to MAD
  })) || [];

  const recentDonations = pendingVerifications?.slice(0, 5).map(d => ({
    id: d._id,
    donor: d.user?.fullName || 'Anonymous',
    project: d.project?.title || 'Unknown Project',
    amount: d.amount / 100,
    status: d.status,
  })) || [];

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj?.[currentLanguage?.code] || obj?.en || '';
  };

  // Drag and drop handlers for featured projects
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder the projects
    const newProjects = [...featuredProjects];
    const draggedProject = newProjects[draggedIndex];
    newProjects.splice(draggedIndex, 1);
    newProjects.splice(index, 0, draggedProject);
    
    setFeaturedProjects(newProjects);
    setDraggedIndex(index);
    setHasOrderChanged(true);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Save the new order to Convex
  const handleSaveOrder = useCallback(async () => {
    if (!hasOrderChanged) return;
    
    setIsSavingOrder(true);
    try {
      // Prepare the projects array with new order values
      const projectsWithOrder = featuredProjects.map((project, index) => ({
        projectId: project._id,
        order: index + 1, // 1-based order
      }));
      
      await updateFeaturedOrder({ projects: projectsWithOrder });
      showToast(t.orderSaved, 'success');
      setHasOrderChanged(false);
    } catch (error) {
      console.error('Failed to save order:', error);
      showToast('Failed to save order', 'error');
    } finally {
      setIsSavingOrder(false);
    }
  }, [featuredProjects, hasOrderChanged, updateFeaturedOrder, showToast, t.orderSaved]);

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="px-6 py-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-white">
              {t.welcome}
            </h1>
            <p className="text-text-secondary mt-1">
              {new Date().toLocaleDateString(currentLanguage?.code === 'ar' ? 'ar-MA' : currentLanguage?.code === 'fr' ? 'fr-FR' : 'en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => navigate('/admin/projects/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-medium transition-colors shadow-lg shadow-primary/25"
            >
              <span className="material-symbols-outlined text-xl">add</span>
              {t.newProject}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.key} variant="default" className="p-5 relative overflow-hidden">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-text-secondary text-sm font-medium">{stat.label}</p>
                  <p className="text-3xl font-bold text-text-primary dark:text-white mt-2">
                    {stat.value}
                  </p>
                  {stat.trend && (
                    <p className={`text-sm mt-1 font-medium ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                      {stat.trend}
                    </p>
                  )}
                </div>
                <div className={`${stat.color} p-3 rounded-xl text-white`}>
                  <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
                </div>
              </div>
              {stat.alert && (
                <div className="absolute top-2 right-2">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="px-6 max-w-7xl mx-auto mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Donation Trends Chart */}
          <Card variant="default" className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-text-primary dark:text-white">
                  {t.donationTrends}
                </h3>
                <p className="text-sm text-text-secondary">{t.activity30Days}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-sm font-medium text-primary bg-primary/10 rounded-lg">
                  {t.daily}
                </button>
                <button className="px-3 py-1 text-sm font-medium text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  {t.weekly}
                </button>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={donationData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d7377" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0d7377" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value} MAD`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value) => [`${value} MAD`, 'Amount']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#0d7377" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card variant="default" className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-text-primary dark:text-white">
                {t.recentDonations}
              </h3>
              <Link to="/admin/donations" className="text-sm text-primary hover:text-primary-dark font-medium">
                {t.viewAll}
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentDonations.length === 0 ? (
                <p className="text-text-secondary text-center py-8">No pending verifications</p>
              ) : (
                recentDonations.map((donation) => (
                  <div key={donation.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text-primary dark:text-white truncate">
                        {donation.donor}
                      </p>
                      <p className="text-sm text-text-secondary truncate">
                        {donation.project}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-text-primary dark:text-white">
                        {donation.amount} MAD
                      </p>
                      <Badge 
                        variant={donation.status === 'verified' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {donation.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Featured Projects Section */}
      <div className="px-6 max-w-7xl mx-auto mt-8">
        <Card variant="default" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-text-primary dark:text-white">
                {t.featuredProjects}
              </h3>
              <p className="text-sm text-text-secondary">{t.featuredDesc}</p>
              <p className="text-xs text-text-secondary mt-1">{t.dragToReorder}</p>
            </div>
            <div className="flex items-center gap-3">
              {hasOrderChanged && (
                <Button
                  onClick={handleSaveOrder}
                  loading={isSavingOrder}
                  size="sm"
                >
                  <span className="material-symbols-outlined text-sm mr-1">save</span>
                  {t.saveOrder}
                </Button>
              )}
              <Link
                to="/admin/projects"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-medium transition-colors"
              >
                <span className="material-symbols-outlined">settings</span>
                {t.manageFeatured}
              </Link>
            </div>
          </div>

          {/* Featured Projects Grid with Drag & Drop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredProjects.map((project, index) => (
              <div
                key={project._id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video cursor-move hover:ring-2 ring-primary transition-all ${
                  draggedIndex === index ? 'opacity-50 ring-2 ring-primary' : ''
                }`}
              >
                <img
                  src={convexFileUrl(project.mainImage) || project.mainImage || ''}
                  alt={getLocalizedText(project.title)}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary" size="sm">
                      #{index + 1}
                    </Badge>
                    <span className="text-white/80 text-xs uppercase tracking-wider">
                      {project.category}
                    </span>
                  </div>
                  <h4 className="text-white font-semibold line-clamp-1">
                    {getLocalizedText(project.title)}
                  </h4>
                </div>
                {/* Drag Handle Indicator */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm">drag_indicator</span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add New Slot */}
            {(!featuredProjects || featuredProjects.length < 6) && (
              <button
                onClick={() => navigate('/admin/projects')}
                className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors aspect-video"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">add</span>
                </div>
                <span className="text-sm text-text-secondary">{t.addFeatured}</span>
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
