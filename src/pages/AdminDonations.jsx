import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';

// ============================================
// ADMIN DONATIONS PAGE - Donations Management Ledger
// ============================================

const AdminDonations = () => {
  const { currentLanguage, showToast } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingDonation, setViewingDonation] = useState(null);
  
  // Convex hooks
  const rawDonations = useQuery(api.donations.getAllDonations, {});
  const dashboardStats = useQuery(api.admin.getDashboardStats);
  const verifyDonationMutation = useMutation(api.donations.verifyDonation);
  const rejectDonationMutation = useMutation(api.donations.rejectDonation);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Transform Convex data to match component structure
  const donations = useMemo(() => {
    if (!rawDonations) return [];
    return rawDonations.map(d => ({
      id: d._id,
      _id: d._id,
      donor: d.donorName,
      phone: d.donorPhone,
      amount: d.amount,
      trxId: `TRX-${String(d._id).slice(-6).toUpperCase()}`,
      project: d.projectTitle[currentLanguage?.code] || d.projectTitle.ar,
      method: d.paymentMethod === 'bank_transfer' ? 'bank' :
              d.paymentMethod === 'card_whop' ? 'card' : 'cash',
      status: d.status,
      receiptImage: d.receiptUrl || null,
      date: new Date(d.createdAt).toISOString().split('T')[0],
    }));
  }, [rawDonations, currentLanguage]);

  // Handle view donation details
  const handleViewDonation = (id) => {
    const donation = donations.find(d => d.id === id);
    if (donation) {
      setViewingDonation(donation);
    }
  };

  const handleCloseModal = () => {
    setViewingDonation(null);
  };

  const handleVerify = async (donation) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await verifyDonationMutation({ donationId: donation._id, verified: true });
      showToast(
        currentLanguage?.code === 'ar' ? 'تم التحقق من التبرع' : 'Donation verified',
        'success'
      );
      handleCloseModal();
    } catch {
      showToast(currentLanguage?.code === 'ar' ? 'حدث خطأ' : 'Error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (donation) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await rejectDonationMutation({ donationId: donation._id });
      showToast(
        currentLanguage?.code === 'ar' ? 'تم رفض التبرع' : 'Donation rejected',
        'error'
      );
      handleCloseModal();
    } catch {
      showToast(currentLanguage?.code === 'ar' ? 'حدث خطأ' : 'Error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      view: 'عرض',
      viewReceipt: 'عرض الإيصال',
      viewDetails: 'عرض التفاصيل',
      card: 'بطاقة',
      bankTransfer: 'تحويل بنكي',
      cash: 'نقدي',
      swift: 'سويفت',
      close: 'إغلاق',
      donationDetails: 'تفاصيل التبرع',
      donor: 'المتبرع',
      amount: 'المبلغ',
      transactionId: 'رقم المعاملة',
      paymentMethod: 'طريقة الدفع',
      phone: 'الهاتف',
      date: 'التاريخ',
      notes: 'ملاحظات',
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
      view: 'Voir',
      viewReceipt: 'Voir le Reçu',
      viewDetails: 'Voir Détails',
      card: 'Carte',
      bankTransfer: 'Virement Bancaire',
      cash: 'Espèces',
      swift: 'Swift',
      close: 'Fermer',
      donationDetails: 'Détails du Don',
      donor: 'Donateur',
      amount: 'Montant',
      transactionId: 'ID Transaction',
      paymentMethod: 'Méthode de Paiement',
      phone: 'Téléphone',
      date: 'Date',
      notes: 'Notes',
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
      view: 'View',
      viewReceipt: 'View Receipt',
      viewDetails: 'View Details',
      card: 'Card',
      bankTransfer: 'Bank Transfer',
      cash: 'Cash',
      swift: 'Swift',
      close: 'Close',
      donationDetails: 'Donation Details',
      donor: 'Donor',
      amount: 'Amount',
      transactionId: 'Transaction ID',
      paymentMethod: 'Payment Method',
      phone: 'Phone',
      date: 'Date',
      notes: 'Notes',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Real stats from Convex
  const stats = [
    {
      label: t.stats.confirmed,
      value: dashboardStats ? String(dashboardStats.totalDonations) : '—',
      color: 'primary',
    },
    {
      label: t.stats.pending,
      value: dashboardStats ? String(dashboardStats.pendingVerifications) : '—',
      color: 'gold',
    },
    {
      label: t.stats.rejected,
      value: dashboardStats ? String(dashboardStats.rejectedDonations) : '—',
      color: 'red',
    },
    {
      label: t.stats.total,
      value: dashboardStats
        ? `${(dashboardStats.totalRaised / 100).toLocaleString()} MAD`
        : '—',
      color: 'dark',
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
                {stat.value}
              </p>
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
                    {donation.amount.toFixed(2)} MAD
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

              {/* Actions - View Details button for all donations */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => handleViewDonation(donation.id)}
                  className="flex-1 border border-primary/30 text-primary text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">receipt</span>
                  {t.viewReceipt}
                </button>
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

      {/* View Donation Modal */}
      {viewingDonation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 sm:rounded-2xl shadow-xl overflow-hidden flex flex-col h-screen sm:h-auto sm:max-h-[92vh] border-0 sm:border border-slate-100 dark:border-slate-800">
            {/* Modal Header */}
            <div className="flex items-center bg-white dark:bg-slate-900 p-4 border-b border-slate-100 dark:border-slate-800 justify-between sticky top-0 z-10">
              <button
                onClick={handleCloseModal}
                className="text-slate-400 flex size-10 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-tight flex-1 text-center">
                {t.donationDetails}
              </h2>
              <div className="flex w-10 items-center justify-end">
                <Badge
                  variant={
                    viewingDonation.status === 'confirmed'
                      ? 'success'
                      : viewingDonation.status === 'pending'
                      ? 'warning'
                      : 'error'
                  }
                  size="sm"
                >
                  {viewingDonation.status === 'confirmed' ? t.stats.confirmed : viewingDonation.status === 'pending' ? t.stats.pending : t.stats.rejected}
                </Badge>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto ios-scroller">
              <div className="flex flex-col">
                {/* Receipt Image */}
                {viewingDonation.receiptImage && (
                  <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-800">
                    <img
                      src={viewingDonation.receiptImage}
                      alt="Donation Receipt"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{t.transactionId}</p>
                      <p className="text-white text-lg font-mono font-bold">#{viewingDonation.trxId}</p>
                    </div>
                  </div>
                )}

                <div className="p-6 space-y-6">
                  {/* Amount Section */}
                  <div className="text-center py-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[11px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-[0.2em] mb-2">
                      {t.amount}
                    </p>
                    <p className="text-4xl font-black text-primary tracking-tighter">
                      {viewingDonation.amount.toFixed(2)} MAD
                    </p>
                  </div>

                  {/* Donor Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        {viewingDonation.donor.charAt(0)}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-text-secondary dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          {t.donor}
                        </p>
                        <p className="text-slate-900 dark:text-white text-base font-bold">{viewingDonation.donor}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-200/60 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 block font-bold uppercase mb-1">
                          {t.phone}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{viewingDonation.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 block font-bold uppercase mb-1">
                          {t.date}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{viewingDonation.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Project & Method */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {t.project}
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{viewingDonation.project}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                        {t.paymentMethod}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">{getMethodIcon(viewingDonation.method)}</span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{getMethodLabel(viewingDonation.method)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {viewingDonation?.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(viewingDonation)}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? '...' : (currentLanguage?.code === 'ar' ? 'رفض' : 'Reject')}
                  </button>
                  <button
                    onClick={() => handleVerify(viewingDonation)}
                    disabled={isSubmitting}
                    className="flex-[2] px-4 py-3 rounded-xl font-bold bg-primary text-white hover:opacity-95 transition-all shadow-lg shadow-[#0D737722] disabled:opacity-70"
                  >
                    {isSubmitting ? '...' : (currentLanguage?.code === 'ar' ? 'تأكيد التبرع' : 'Verify Donation')}
                  </button>
                </div>
              )}
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDonations;
