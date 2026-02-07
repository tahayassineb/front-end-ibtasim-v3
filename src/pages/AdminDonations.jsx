import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';

// ============================================
// ADMIN DONATIONS PAGE - Donations Management Ledger
// ============================================

const AdminDonations = () => {
  const { currentLanguage } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Translations
  const translations = {
    ar: {
      title: 'سجل التبرعات',
      back: 'عودة',
      export: 'تصدير',
      more: 'المزيد',
      stats: {
        confirmed: 'مؤكد',
        pending: 'معلق',
        rejected: 'مرفوض',
        total: 'إجمالي الإيرادات',
      },
      search: 'البحث برقم الهوية، الاسم أو الهاتف...',
      dateRange: 'نطاق التاريخ',
      status: 'الحالة',
      all: 'الكل',
      project: 'المشروع',
      recentDonations: 'أحدث التبرعات',
      bulkActions: 'إجراءات جماعية',
      confirm: 'تأكيد',
      reject: 'رفض',
      view: 'عرض',
      viewReceipt: 'عرض الإيصال',
      retry: 'إعادة المعالجة',
      viewDetails: 'عرض التفاصيل',
      card: 'بطاقة',
      bankTransfer: 'تحويل بنكي',
      cash: 'نقدي',
      swift: 'سويفت',
    },
    fr: {
      title: 'Registre des Dons',
      back: 'Retour',
      export: 'Exporter',
      more: 'Plus',
      stats: {
        confirmed: 'Confirmé',
        pending: 'En Attente',
        rejected: 'Rejeté',
        total: 'Revenus Totaux',
      },
      search: 'Rechercher ID, Nom ou Téléphone...',
      dateRange: 'Plage de Dates',
      status: 'Statut',
      all: 'Tous',
      project: 'Projet',
      recentDonations: 'Dons Récents',
      bulkActions: 'Actions en Masse',
      confirm: 'Confirmer',
      reject: 'Rejeter',
      view: 'Voir',
      viewReceipt: 'Voir le Reçu',
      retry: 'Réessayer',
      viewDetails: 'Voir Détails',
      card: 'Carte',
      bankTransfer: 'Virement Bancaire',
      cash: 'Espèces',
      swift: 'Swift',
    },
    en: {
      title: 'Donations Ledger',
      back: 'Back',
      export: 'Export',
      more: 'More',
      stats: {
        confirmed: 'Confirmed',
        pending: 'Pending',
        rejected: 'Rejected',
        total: 'Total Revenue',
      },
      search: 'Search ID, Name or Phone...',
      dateRange: 'Date Range',
      status: 'Status',
      all: 'All',
      project: 'Project',
      recentDonations: 'Recent Donations',
      bulkActions: 'Bulk Actions',
      confirm: 'Confirm',
      reject: 'Reject',
      view: 'View',
      viewReceipt: 'View Receipt',
      retry: 'Retry Processing',
      viewDetails: 'View Details',
      card: 'Card',
      bankTransfer: 'Bank Transfer',
      cash: 'Cash',
      swift: 'Swift',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Mock stats
  const stats = [
    { label: t.stats.confirmed, value: '45.2k', trend: '+12%', trendUp: true, color: 'primary' },
    { label: t.stats.pending, value: '12.8k', trend: '+5%', trendUp: true, color: 'gold' },
    { label: t.stats.rejected, value: '3.1k', trend: '-2%', trendUp: false, color: 'red' },
    { label: t.stats.total, value: '61.1k', trend: '+8%', trendUp: true, color: 'dark' },
  ];

  // Mock donations data
  const donations = [
    {
      id: 1,
      donor: 'Sarah Jenkins',
      phone: '+1 234 567 890',
      amount: 250,
      trxId: 'TRX-9482',
      project: 'Education Fund',
      method: 'card',
      status: 'pending',
    },
    {
      id: 2,
      donor: 'Michael Chen',
      phone: '+1 987 654 321',
      amount: 1200,
      trxId: 'TRX-8821',
      project: 'Clean Water Project',
      method: 'bank',
      status: 'confirmed',
    },
    {
      id: 3,
      donor: 'Alice Rivera',
      phone: '+1 555 019 992',
      amount: 45,
      trxId: 'TRX-7712',
      project: 'Food Program',
      method: 'cash',
      status: 'rejected',
    },
    {
      id: 4,
      donor: 'Robert Wilson',
      phone: '+1 442 990 123',
      amount: 3500,
      trxId: 'TRX-9490',
      project: 'Shelter Relief',
      method: 'swift',
      status: 'pending',
    },
  ];

  const getStatusStyles = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30';
      case 'confirmed':
        return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';
      case 'rejected':
        return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80';
      default:
        return 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800';
    }
  };

  const getMethodIcon = (method) => {
    const icons = {
      card: 'credit_card',
      bank: 'account_balance',
      cash: 'payments',
      swift: 'account_balance',
    };
    return icons[method] || 'payments';
  };

  const getMethodLabel = (method) => {
    const labels = {
      card: t.card,
      bank: t.bankTransfer,
      cash: t.cash,
      swift: t.swift,
    };
    return labels[method] || method;
  };

  const filteredDonations = donations.filter(d => {
    const matchesSearch = d.donor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         d.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">{t.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined">download</span>
          </button>
          <button className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((stat, index) => (
          <Card
            key={index}
            padding="md"
            className={`border ${
              stat.color === 'gold'
                ? 'border-yellow-200 dark:border-yellow-900/30'
                : stat.color === 'red'
                ? 'border-red-200 dark:border-red-900/30'
                : stat.color === 'dark'
                ? 'bg-slate-800 dark:bg-slate-950 border-slate-700'
                : 'border-primary/20'
            }`}
          >
            <div className="flex flex-col gap-1">
              <p className={`text-xs font-medium ${stat.color === 'dark' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {stat.label}
              </p>
              <p className={`text-xl font-bold ${
                stat.color === 'gold'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : stat.color === 'red'
                  ? 'text-red-600 dark:text-red-400'
                  : stat.color === 'dark'
                  ? 'text-white'
                  : 'text-primary'
              }`}>
                ${stat.value}
              </p>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${
                stat.trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                <span className="material-symbols-outlined text-sm">
                  {stat.trendUp ? 'trending_up' : 'trending_down'}
                </span>
                {stat.trend}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <div className="flex w-full items-stretch rounded-xl h-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-400 flex items-center justify-center pl-4">
            <span className="material-symbols-outlined">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.search}
            className="w-full border-none bg-transparent focus:ring-0 text-sm placeholder:text-slate-400 text-text-primary dark:text-white"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        <button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-medium text-text-primary dark:text-white">
          <span className="material-symbols-outlined text-lg">calendar_today</span>
          {t.dateRange}
        </button>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-medium text-text-primary dark:text-white"
        >
          <option value="all">{t.status}: {t.all}</option>
          <option value="pending">{t.status}: {t.stats.pending}</option>
          <option value="confirmed">{t.status}: {t.stats.confirmed}</option>
          <option value="rejected">{t.status}: {t.stats.rejected}</option>
        </select>
        <button className="flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 text-xs font-medium text-text-primary dark:text-white">
          {t.project}: {t.all}
          <span className="material-symbols-outlined text-lg">expand_more</span>
        </button>
      </div>

      {/* Recent Donations Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-text-primary dark:text-white text-base font-bold">{t.recentDonations}</h3>
        <button className="text-primary text-xs font-semibold flex items-center gap-1 hover:underline">
          {t.bulkActions}
          <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
        </button>
      </div>

      {/* Donations List */}
      <div className="flex flex-col gap-3">
        {filteredDonations.map((donation) => (
          <Card
            key={donation.id}
            padding="md"
            className={getStatusStyles(donation.status)}
          >
            <div className="flex flex-col gap-3">
              {/* Main Info */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <Badge
                    variant={
                      donation.status === 'confirmed'
                        ? 'success'
                        : donation.status === 'pending'
                        ? 'warning'
                        : 'error'
                    }
                    size="sm"
                    className="w-fit mb-1 text-[10px] uppercase tracking-wider"
                  >
                    {donation.status === 'confirmed' ? t.stats.confirmed : donation.status === 'pending' ? t.stats.pending : t.stats.rejected}
                  </Badge>
                  <h4 className="text-sm font-bold text-text-primary dark:text-white">{donation.donor}</h4>
                  <p className="text-xs text-slate-500">{donation.phone}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${donation.status === 'rejected' ? 'text-slate-400' : 'text-primary'}`}>
                    ${donation.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-slate-400">#{donation.trxId}</p>
                </div>
              </div>

              {/* Project & Method */}
              <div className="flex items-center justify-between text-xs border-t border-slate-100 dark:border-slate-800 pt-2">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm">school</span>
                  <span>{donation.project}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="material-symbols-outlined text-sm">{getMethodIcon(donation.method)}</span>
                  <span>{getMethodLabel(donation.method)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-1">
                {donation.status === 'pending' && (
                  <>
                    <button className="flex-1 bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors">
                      {t.confirm}
                    </button>
                    <button className="flex-1 bg-white dark:bg-slate-800 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                      {t.reject}
                    </button>
                    <button className="w-10 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </button>
                  </>
                )}
                {donation.status === 'confirmed' && (
                  <button className="flex-1 border border-primary/30 text-primary text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                    <span className="material-symbols-outlined text-sm">receipt</span>
                    {t.viewReceipt}
                  </button>
                )}
                {donation.status === 'rejected' && (
                  <>
                    <button className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-bold py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      {t.viewDetails}
                    </button>
                    <button className="flex-1 border border-primary/20 text-primary text-xs font-bold py-2 rounded-lg hover:bg-primary/5 transition-colors">
                      {t.retry}
                    </button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-bold uppercase">Page 1 of 12</span>
          <span className="text-xs text-slate-600 dark:text-slate-300">Showing 1-4 of 48</span>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-400 disabled:opacity-50" disabled>
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-primary hover:bg-primary/5 transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDonations;
