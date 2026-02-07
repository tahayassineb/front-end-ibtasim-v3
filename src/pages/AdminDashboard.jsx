import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
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
// ADMIN DASHBOARD PAGE - Executive Overview
// With Featured Projects Management
// ============================================

const AdminDashboard = () => {
  const { currentLanguage, showToast } = useApp();
  const navigate = useNavigate();

  // Featured Projects State
  const [featuredProjects, setFeaturedProjects] = useState([
    { id: 1, title: 'Clean Water Initiative', category: 'Water', image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=400', order: 1 },
    { id: 2, title: 'Atlas Education Hub', category: 'Education', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400', order: 2 },
    { id: 3, title: 'Winter Relief Program', category: 'Humanitarian', image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400', order: 3 },
  ]);

  const [draggedFeatured, setDraggedFeatured] = useState(null);

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
      // Featured Projects
      featuredProjects: 'المشاريع المميزة',
      featuredDesc: 'المشاريع المعروضة على الصفحة الرئيسية',
      manageFeatured: 'إدارة المشاريع المميزة',
      dragToReorder: 'اسحب لإعادة الترتيب',
      maxFeatured: 'الحد الأقصى 6 مشاريع',
      addFeatured: 'إضافة مشروع مميز',
      removeFeatured: 'إزالة',
      saveOrder: 'حفظ الترتيب',
      orderSaved: 'تم حفظ الترتيب',
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
        processing: 'En Cours',
      },
      // Featured Projects
      featuredProjects: 'Projets en Vedette',
      featuredDesc: 'Projets affichés sur la page d\'accueil',
      manageFeatured: 'Gérer les Projets en Vedette',
      dragToReorder: 'Glisser pour réorganiser',
      maxFeatured: 'Maximum 6 projets',
      addFeatured: 'Ajouter un Projet en Vedette',
      removeFeatured: 'Retirer',
      saveOrder: 'Enregistrer l\'ordre',
      orderSaved: 'Ordre enregistré',
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
      activity30Days: 'Activity for the last 30 days',
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
      // Featured Projects
      featuredProjects: 'Featured Projects',
      featuredDesc: 'Projects displayed on homepage',
      manageFeatured: 'Manage Featured Projects',
      dragToReorder: 'Drag to reorder',
      maxFeatured: 'Maximum 6 projects',
      addFeatured: 'Add Featured Project',
      removeFeatured: 'Remove',
      saveOrder: 'Save Order',
      orderSaved: 'Order saved',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Mock stats data
  const stats = [
    { 
      label: t.stats.totalDonations, 
      value: '125,400 DH', 
      icon: 'account_balance_wallet', 
      trend: '+12%',
      trendType: 'up',
      borderColor: 'border-primary/20'
    },
    { 
      label: t.stats.activeProjects, 
      value: '12', 
      icon: 'rocket_launch', 
      trend: t.steady,
      trendType: 'neutral',
      borderColor: 'border-slate-200 dark:border-slate-700'
    },
    { 
      label: t.stats.totalDonors, 
      value: '458', 
      icon: 'groups', 
      trend: '+5.2%',
      trendType: 'up',
      borderColor: 'border-slate-200 dark:border-slate-700'
    },
    { 
      label: t.stats.pendingVerifications, 
      value: '3', 
      icon: 'pending_actions', 
      trend: t.actionRequired,
      trendType: 'warning',
      borderColor: 'border-orange-200 dark:border-orange-900/30',
      bgColor: 'bg-orange-50/50 dark:bg-orange-900/10'
    },
  ];

  // Mock recent donations
  const recentDonations = [
    { id: 1, donor: 'Mohammed Alami', initials: 'MA', project: 'Clean Water Init.', amount: '5,000 DH', status: 'completed' },
    { id: 2, donor: 'Sara Fassi', initials: 'SF', project: 'School Supplies', amount: '1,200 DH', status: 'processing' },
    { id: 3, donor: 'Yassine Kabbaj', initials: 'YK', project: 'Winter Relief', amount: '850 DH', status: 'completed' },
    { id: 4, donor: 'Leila Benani', initials: 'LB', project: 'Medical Aid', amount: '2,500 DH', status: 'completed' },
    { id: 5, donor: 'Amine Jilali', initials: 'AJ', project: 'Clean Water Init.', amount: '10,000 DH', status: 'completed' },
  ];

  // Chart data for donations
  const donationChartData = [
    { name: '01', amount: 2400 },
    { name: '05', amount: 1398 },
    { name: '10', amount: 9800 },
    { name: '15', amount: 3908 },
    { name: '20', amount: 4800 },
    { name: '25', amount: 3800 },
    { name: '30', amount: 4300 },
  ];

  // Handle featured projects reordering
  const handleFeaturedDragStart = (index) => {
    setDraggedFeatured(index);
  };

  const handleFeaturedDragOver = (e, index) => {
    e.preventDefault();
    if (draggedFeatured === null || draggedFeatured === index) return;

    const newFeatured = [...featuredProjects];
    const item = newFeatured[draggedFeatured];
    newFeatured.splice(draggedFeatured, 1);
    newFeatured.splice(index, 0, item);
    
    // Update order values
    const updatedWithOrder = newFeatured.map((p, i) => ({ ...p, order: i + 1 }));
    
    setFeaturedProjects(updatedWithOrder);
    setDraggedFeatured(index);
  };

  const handleFeaturedDragEnd = () => {
    setDraggedFeatured(null);
  };

  const handleRemoveFeatured = (id) => {
    setFeaturedProjects(prev => prev.filter(p => p.id !== id).map((p, i) => ({ ...p, order: i + 1 })));
    showToast('Project removed from featured', 'success');
  };

  const handleSaveOrder = () => {
    // In real app, save to backend
    showToast(t.orderSaved, 'success');
  };

  const handleAddDonation = () => {
    showToast('Add donation - coming soon', 'info');
  };

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 justify-start lg:justify-end">
        <Link
          to="/admin/projects/new"
          className="flex-1 lg:flex-none flex min-w-[140px] items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          <span>{t.newProject}</span>
        </Link>
        <button 
          onClick={handleAddDonation}
          className="flex-1 lg:flex-none flex min-w-[140px] items-center justify-center gap-2 rounded-xl h-12 px-6 bg-primary/10 text-primary text-sm font-bold border border-primary/20 hover:bg-primary/20 transition-colors"
        >
          <span className="material-symbols-outlined text-lg">payments</span>
          <span>{t.addDonation}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card
            key={index}
            padding="lg"
            className={`${stat.bgColor || ''} ${stat.borderColor ? `border ${stat.borderColor}` : ''}`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{stat.label}</p>
                <span className={`material-symbols-outlined ${stat.trendType === 'warning' ? 'text-orange-500' : 'text-primary/60'}`}>
                  {stat.icon}
                </span>
              </div>
              <p className={`text-xl font-bold ${stat.trendType === 'warning' ? 'text-orange-800 dark:text-orange-200' : 'text-text-primary dark:text-white'}`}>
                {stat.value}
              </p>
              <p className={`text-xs font-bold flex items-center gap-1 ${
                stat.trendType === 'up' ? 'text-green-600' : 
                stat.trendType === 'warning' ? 'text-orange-600' : 
                'text-slate-400'
              }`}>
                {stat.trendType === 'up' && <span className="material-symbols-outlined text-sm">trending_up</span>}
                {stat.trend}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Featured Projects Section */}
      <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary">star</span>
            </div>
            <div>
              <h3 className="font-bold text-text-primary dark:text-white text-lg">{t.featuredProjects}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.featuredDesc}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveOrder}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {t.saveOrder}
            </button>
            <Link
              to="/admin/projects"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
              {t.manageFeatured}
            </Link>
          </div>
        </div>

        {/* Featured Projects List */}
        <div className="space-y-3">
          {featuredProjects.map((project, index) => (
            <div
              key={project.id}
              draggable
              onDragStart={() => handleFeaturedDragStart(index)}
              onDragOver={(e) => handleFeaturedDragOver(e, index)}
              onDragEnd={handleFeaturedDragEnd}
              className={`flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 transition-all cursor-move ${
                draggedFeatured === index 
                  ? 'border-primary opacity-50' 
                  : 'border-transparent hover:border-primary/30'
              }`}
            >
              {/* Order Number */}
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                {project.order}
              </div>
              
              {/* Project Image */}
              <img
                src={project.image}
                alt={project.title}
                className="w-16 h-16 rounded-lg object-cover"
              />
              
              {/* Project Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-text-primary dark:text-white truncate">{project.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">{project.category}</p>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRemoveFeatured(project.id)}
                  className="p-2 text-slate-400 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title={t.removeFeatured}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
                <div className="p-2 text-slate-400 cursor-grab active:cursor-grabbing">
                  <span className="material-symbols-outlined">drag_indicator</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <p>{t.dragToReorder}</p>
          <p>{featuredProjects.length}/6 {t.maxFeatured}</p>
        </div>

        {/* Mobile Save Button */}
        <button
          onClick={handleSaveOrder}
          className="sm:hidden w-full mt-4 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-bold"
        >
          <span className="material-symbols-outlined">save</span>
          {t.saveOrder}
        </button>
      </Card>

      {/* Donation Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Placeholder */}
        <Card padding="lg" className="lg:col-span-2 dark:bg-bg-dark-card dark:border-white/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-text-primary dark:text-white text-lg">{t.donationTrends}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t.activity30Days}</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg">
                {t.daily}
              </button>
              <button className="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                {t.weekly}
              </button>
            </div>
          </div>
          
          {/* Donations Chart */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donationChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0d7477" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0d7477" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  tickFormatter={(value) => `${value/1000}k`}
                  dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value.toLocaleString()} DH`, 'Amount']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#0d7477"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorAmount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Donations */}
        <Card padding="lg" className="dark:bg-bg-dark-card dark:border-white/10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-text-primary dark:text-white text-lg">{t.recentDonations}</h3>
            <Link 
              to="/admin/donations" 
              className="text-primary text-sm font-bold hover:underline"
            >
              {t.viewAll}
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentDonations.map((donation) => (
              <div key={donation.id} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {donation.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary dark:text-white truncate">{donation.donor}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{donation.project}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary text-sm">{donation.amount}</p>
                  <Badge 
                    variant={donation.status === 'completed' ? 'success' : 'warning'} 
                    size="sm"
                  >
                    {t.statuses[donation.status]}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
