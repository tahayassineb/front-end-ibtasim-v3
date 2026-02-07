import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';

// ============================================
// ADMIN DONORS PAGE - Donor Directory & CRM
// ============================================

const AdminDonors = () => {
  const { currentLanguage } = useApp();
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Translations
  const translations = {
    ar: {
      title: 'دليل المتبرعين',
      search: 'البحث بالاسم أو البريد الإلكتروني...',
      allDonors: 'جميع المتبرعين',
      goldTier: 'الفئة الذهبية',
      silverTier: 'الفئة الفضية',
      bronzeTier: 'الفئة البرونزية',
      donorDetails: 'تفاصيل المتبرع',
      contribution: 'المساهمة',
      totalDonated: 'إجمالي التبرعات',
      donations: 'تبرعات',
      lastActive: 'آخر نشاط',
      view: 'عرض',
      noDonors: 'لا يوجد متبرعون',
    },
    fr: {
      title: 'Annuaire des Donateurs',
      search: 'Rechercher par nom ou email...',
      allDonors: 'Tous les Donateurs',
      goldTier: 'Niveau Or',
      silverTier: 'Niveau Argent',
      bronzeTier: 'Niveau Bronze',
      donorDetails: 'Détails du Donateur',
      contribution: 'Contribution',
      totalDonated: 'Total Donné',
      donations: 'Dons',
      lastActive: 'Dernière Activité',
      view: 'Voir',
      noDonors: 'Aucun donateur trouvé',
    },
    en: {
      title: 'Donors Directory',
      search: 'Search by name or email...',
      allDonors: 'All Donors',
      goldTier: 'Gold Tier',
      silverTier: 'Silver Tier',
      bronzeTier: 'Bronze Tier',
      donorDetails: 'Donor Details',
      contribution: 'Contribution',
      totalDonated: 'Total Donated',
      donations: 'Donations',
      lastActive: 'Last Active',
      view: 'View',
      noDonors: 'No donors found',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Mock donors data
  const donors = [
    {
      id: 1,
      name: 'Ahmed Mansouri',
      email: 'ahmed.m@email.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      tier: 'gold',
      totalDonated: 25000,
      donationsCount: 12,
      lastActive: '2 days ago',
    },
    {
      id: 2,
      name: 'Fatima Zahra',
      email: 'f.zahra@email.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      tier: 'silver',
      totalDonated: 8500,
      donationsCount: 5,
      lastActive: 'Oct 12, 2023',
    },
    {
      id: 3,
      name: 'Omar Berrada',
      email: 'o.berrada@email.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100',
      tier: 'bronze',
      totalDonated: 1200,
      donationsCount: 1,
      lastActive: 'Sept 05, 2023',
    },
    {
      id: 4,
      name: 'Leila Benani',
      email: 'leila.b@email.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      tier: 'gold',
      totalDonated: 15000,
      donationsCount: 8,
      lastActive: '1 week ago',
    },
    {
      id: 5,
      name: 'Karim Idrissi',
      email: 'karim.i@email.com',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      tier: 'silver',
      totalDonated: 5200,
      donationsCount: 3,
      lastActive: '3 days ago',
    },
    {
      id: 6,
      name: 'Samira Tazi',
      email: 'samira.t@email.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      tier: 'bronze',
      totalDonated: 800,
      donationsCount: 2,
      lastActive: '1 month ago',
    },
  ];

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         donor.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || donor.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const getTierBadge = (tier) => {
    const tierConfig = {
      gold: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800/50', label: t.goldTier },
      silver: { bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-600', label: t.silverTier },
      bronze: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800/50', label: t.bronzeTier },
    };
    const config = tierConfig[tier] || tierConfig.bronze;
    return (
      <span className={`${config.bg} ${config.text} ${config.border} text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest border`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-text-primary dark:text-white">{t.title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-slate-500 hover:text-primary hover:bg-primary/10'}`}
          >
            <span className="material-symbols-outlined">grid_view</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'text-slate-500 hover:text-primary hover:bg-primary/10'}`}
          >
            <span className="material-symbols-outlined">view_list</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex w-full flex-1 items-stretch rounded-xl h-14 shadow-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="text-primary flex items-center justify-center pl-4 rounded-l-xl">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full border-none bg-transparent focus:ring-0 text-base text-text-primary dark:text-white placeholder:text-slate-400 px-4"
          />
        </div>
      </div>

      {/* Tier Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: t.allDonors },
          { key: 'gold', label: t.goldTier },
          { key: 'silver', label: t.silverTier },
          { key: 'bronze', label: t.bronzeTier },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setTierFilter(filter.key)}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 transition-colors ${
              tierFilter === filter.key
                ? 'bg-primary text-white shadow-md'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <span className="text-sm font-medium">{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Column Headers (List View Only) */}
      {viewMode === 'list' && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
          <div className="flex items-center gap-1">
            <span>{t.donorDetails}</span>
            <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
          </div>
          <div className="flex items-center gap-1">
            <span>{t.contribution}</span>
            <span className="material-symbols-outlined text-[14px]">unfold_more</span>
          </div>
        </div>
      )}

      {/* Donors Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'flex flex-col gap-3'}>
        {filteredDonors.map((donor) => (
          <Card key={donor.id} padding="lg" className="flex flex-col gap-3">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center overflow-hidden">
                  {donor.avatar ? (
                    <img src={donor.avatar} alt={donor.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-primary">person</span>
                  )}
                </div>
                <div>
                  <p className="text-text-primary dark:text-white font-bold text-base">{donor.name}</p>
                  <p className="text-slate-500 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">mail</span>
                    {donor.email}
                  </p>
                </div>
              </div>
              {getTierBadge(donor.tier)}
            </div>

            {/* Stats */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-700/50">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-bold">{t.totalDonated}</p>
                <p className="text-primary font-bold">{donor.totalDonated.toLocaleString()} DH</p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] text-slate-400 uppercase font-bold">{t.donations}</p>
                <p className="text-slate-700 dark:text-slate-200 font-medium">{donor.donationsCount} Gifts</p>
              </div>
              <Link
                to={`/admin/donors/${donor.id}`}
                className="flex gap-2"
              >
                <button className="p-2 text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                  <span className="material-symbols-outlined text-xl">visibility</span>
                </button>
              </Link>
            </div>

            {/* Last Active */}
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-slate-400 italic">{t.lastActive}: {donor.lastActive}</span>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredDonors.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl text-slate-400">person_off</span>
          </div>
          <h3 className="text-lg font-medium text-text-primary dark:text-white mb-2">{t.noDonors}</h3>
          <p className="text-slate-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <button className="p-2 text-slate-400 hover:text-primary transition-colors disabled:opacity-30" disabled>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <div className="flex items-center gap-1 px-2">
            <span className="text-sm font-bold text-primary">1</span>
            <span className="text-sm text-slate-400">/</span>
            <span className="text-sm text-slate-400">12</span>
          </div>
          <button className="p-2 text-primary hover:bg-primary/5 rounded-lg transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDonors;
