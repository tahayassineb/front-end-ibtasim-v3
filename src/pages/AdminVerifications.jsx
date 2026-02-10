import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';

// ============================================
// ADMIN VERIFICATIONS PAGE - Donation Verification Workflow
// Shows ONLY pending donations (excluding auto-verified card/paypal payments)
// ============================================

const AdminVerifications = () => {
  const { currentLanguage, showToast } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [editedAmount, setEditedAmount] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationChecks, setVerificationChecks] = useState({
    amountMatches: false,
    referenceVisible: false,
    dateRecent: false,
    accountCorrect: false,
  });
  const [imageExpanded, setImageExpanded] = useState(false);

  // Mock donations data - in production, this would come from API
  const [donations, setDonations] = useState([
    {
      id: 1,
      donor: 'Ahmed Al-Farsi',
      phone: '+212 600-000000',
      amount: 5000,
      trxId: 'DON-88291',
      project: 'Water Well',
      method: 'bank',
      status: 'pending',
      receiptImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
      date: '2024-01-15',
    },
    {
      id: 2,
      donor: 'Fatima Benali',
      phone: '+212 612-345678',
      amount: 2500,
      trxId: 'DON-88292',
      project: 'Education Fund',
      method: 'agency',
      status: 'pending',
      receiptImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
      date: '2024-01-14',
    },
    {
      id: 3,
      donor: 'Youssef Mansouri',
      phone: '+212 623-456789',
      amount: 10000,
      trxId: 'DON-88293',
      project: 'Medical Aid',
      method: 'bank',
      status: 'pending',
      receiptImage: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
      date: '2024-01-13',
    },
    // Card payments - auto-verified, should NOT appear in this list
    {
      id: 4,
      donor: 'Sarah Jenkins',
      phone: '+1 234 567 890',
      amount: 250,
      trxId: 'TRX-9482',
      project: 'Education Fund',
      method: 'card',
      status: 'confirmed', // Auto-verified
    },
    {
      id: 5,
      donor: 'Michael Chen',
      phone: '+1 987 654 321',
      amount: 1200,
      trxId: 'TRX-8821',
      project: 'Clean Water Project',
      method: 'paypal',
      status: 'confirmed', // Auto-verified
    },
  ]);

  // Auto-verify card and paypal payments on component mount
  React.useEffect(() => {
    setDonations(prev => prev.map(d => {
      // Auto-verify card and paypal payments
      if ((d.method === 'card' || d.method === 'paypal') && d.status === 'pending') {
        return { ...d, status: 'confirmed' };
      }
      return d;
    }));
  }, []);

  // Filter to show ONLY pending donations (excluding card/paypal which are auto-verified)
  const pendingDonations = useMemo(() => {
    return donations.filter(d => 
      d.status === 'pending' && 
      d.method !== 'card' && 
      d.method !== 'paypal'
    );
  }, [donations]);

  // Filter by search query
  const filteredDonations = useMemo(() => {
    if (!searchQuery) return pendingDonations;
    return pendingDonations.filter(d => 
      d.donor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.trxId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery)
    );
  }, [pendingDonations, searchQuery]);

  // Translations
  const translations = {
    ar: {
      title: 'التحقق من التبرعات',
      subtitle: 'مراجعة وتوثيق التبرعات المعلقة',
      search: 'البحث بالاسم، الهاتف أو رقم العملية...',
      pendingCount: 'تبرع معلق',
      noDonations: 'لا توجد تبرعات معلقة للتحقق',
      allCaughtUp: 'تم التحقق من جميع التبرعات!',
      verifyDonation: 'التحقق من التبرع',
      donorInfo: 'معلومات المتبرع',
      donorName: 'اسم المتبرع',
      phone: 'رقم الهاتف',
      amount: 'المبلغ المعلن',
      editAmount: 'تعديل المبلغ إذا اختلف عن الفاتورة',
      transactionId: 'رقم العملية',
      paymentMethod: 'طريقة الدفع',
      targetProject: 'المشروع المستهدف',
      receiptImage: 'صورة الإيصال',
      tapToEnlarge: 'انقر للتكبير',
      verificationChecklist: 'قائمة التحقق',
      amountMatches: 'المبلغ يطابق الإيصال',
      referenceVisible: 'رقم المرجع مرئي',
      dateRecent: 'التاريخ حديث (< 7 أيام)',
      accountCorrect: 'حساب المستلم صحيح',
      rejectionReason: 'سبب الرفض (داخلي فقط)',
      rejectionPlaceholder: 'اشرح سبب عدم استيفاء هذا التبرع للمتطلبات...',
      cancel: 'إلغاء',
      reject: 'رفض',
      approve: 'الموافقة على التبرع',
      approveSuccess: 'تم التحقق من التبرع بنجاح',
      rejectSuccess: 'تم رفض التبرع',
      bank: 'تحويل بنكي',
      agency: 'وكالة',
      whatsappChat: 'محادثة واتساب',
      verificationWorkflow: 'سير عمل التحقق',
      donationDetails: 'تفاصيل التبرع',
    },
    fr: {
      title: 'Vérification des Dons',
      subtitle: 'Révision et vérification des dons en attente',
      search: 'Rechercher par nom, téléphone ou ID...',
      pendingCount: 'don en attente',
      noDonations: 'Aucun don en attente à vérifier',
      allCaughtUp: 'Tous les dons ont été vérifiés!',
      verifyDonation: 'Vérifier le Don',
      donorInfo: 'Informations du Donateur',
      donorName: 'Nom du Donateur',
      phone: 'Téléphone',
      amount: 'Montant Déclaré',
      editAmount: 'Modifier si le montant diffère de la facture',
      transactionId: 'ID Transaction',
      paymentMethod: 'Méthode de Paiement',
      targetProject: 'Projet Cible',
      receiptImage: 'Image du Reçu',
      tapToEnlarge: 'Appuyer pour agrandir',
      verificationChecklist: 'Liste de Vérification',
      amountMatches: 'Le montant correspond au reçu',
      referenceVisible: 'Numéro de référence visible',
      dateRecent: 'Date récente (< 7 jours)',
      accountCorrect: 'Compte destinataire correct',
      rejectionReason: 'Raison du Rejet (Interne)',
      rejectionPlaceholder: 'Expliquez pourquoi ce don ne répond pas aux exigences...',
      cancel: 'Annuler',
      reject: 'Rejeter',
      approve: 'Approuver le Don',
      approveSuccess: 'Don vérifié avec succès',
      rejectSuccess: 'Don rejeté',
      bank: 'Virement Bancaire',
      agency: 'Agence',
      whatsappChat: 'Chat WhatsApp',
      verificationWorkflow: 'Workflow de Vérification',
      donationDetails: 'Détails du Don',
    },
    en: {
      title: 'Donation Verification',
      subtitle: 'Review and verify pending donations',
      search: 'Search by name, phone or transaction ID...',
      pendingCount: 'pending donation',
      pendingCountPlural: 'pending donations',
      noDonations: 'No pending donations to verify',
      allCaughtUp: 'All caught up!',
      verifyDonation: 'Verify Donation',
      donorInfo: 'Donor Information',
      donorName: 'Donor Name',
      phone: 'Phone Number',
      amount: 'Declared Amount',
      editAmount: 'Edit amount if it differs from invoice',
      transactionId: 'Transaction ID',
      paymentMethod: 'Payment Method',
      targetProject: 'Target Project',
      receiptImage: 'Receipt Image',
      tapToEnlarge: 'Tap to enlarge',
      verificationChecklist: 'Verification Checklist',
      amountMatches: 'Amount matches receipt',
      referenceVisible: 'Reference number visible',
      dateRecent: 'Date is recent (< 7 days)',
      accountCorrect: 'Recipient account correct',
      rejectionReason: 'Rejection Reason (Internal Only)',
      rejectionPlaceholder: 'Explain why this donation doesn\'t meet requirements...',
      cancel: 'Cancel',
      reject: 'Reject',
      approve: 'Approve Donation',
      approveSuccess: 'Donation verified successfully',
      rejectSuccess: 'Donation rejected',
      bank: 'Bank Transfer',
      agency: 'Agency',
      whatsappChat: 'WhatsApp Chat',
      verificationWorkflow: 'Verification Workflow',
      donationDetails: 'Donation Details',
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  const getMethodLabel = (method) => {
    const labels = {
      bank: t.bank,
      agency: t.agency,
      card: 'Card',
      paypal: 'PayPal',
    };
    return labels[method] || method;
  };

  const getMethodIcon = (method) => {
    const icons = {
      bank: 'account_balance',
      agency: 'store',
      card: 'credit_card',
      paypal: 'payments',
    };
    return icons[method] || 'payments';
  };

  const handleOpenModal = (donation) => {
    setSelectedDonation(donation);
    setEditedAmount(donation.amount.toString());
    setRejectionReason('');
    setVerificationChecks({
      amountMatches: false,
      referenceVisible: false,
      dateRecent: false,
      accountCorrect: false,
    });
  };

  const handleCloseModal = () => {
    setSelectedDonation(null);
    setEditedAmount('');
    setRejectionReason('');
    setImageExpanded(false);
  };

  const handleVerify = () => {
    if (!selectedDonation) return;
    
    // Use the edited amount (admin may have corrected it)
    const finalAmount = parseFloat(editedAmount) || selectedDonation.amount;
    
    setDonations(prev => prev.map(d => 
      d.id === selectedDonation.id 
        ? { ...d, status: 'confirmed', amount: finalAmount }
        : d
    ));
    
    showToast(
      currentLanguage.code === 'ar' ? 'تم التحقق من التبرع بنجاح' :
      currentLanguage.code === 'fr' ? 'Don vérifié avec succès' :
      'Donation verified successfully', 
      'success'
    );
    
    handleCloseModal();
  };

  const handleReject = () => {
    if (!selectedDonation) return;
    
    setDonations(prev => prev.map(d => 
      d.id === selectedDonation.id 
        ? { ...d, status: 'rejected', rejectionReason }
        : d
    ));
    
    showToast(
      currentLanguage.code === 'ar' ? 'تم رفض التبرع' :
      currentLanguage.code === 'fr' ? 'Don rejeté' :
      'Donation rejected', 
      'error'
    );
    
    handleCloseModal();
  };

  const handleCheckChange = (checkName) => {
    setVerificationChecks(prev => ({
      ...prev,
      [checkName]: !prev[checkName]
    }));
  };

  const formatWhatsAppLink = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">{t.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="warning" size="md" className="text-sm">
            {filteredDonations.length} {filteredDonations.length === 1 ? (t.pendingCount || 'pending donation') : (t.pendingCountPlural || 'pending donations')}
          </Badge>
        </div>
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

      {/* Pending Donations List */}
      {filteredDonations.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filteredDonations.map((donation) => (
            <Card
              key={donation.id}
              padding="md"
              className="border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50/30 dark:bg-yellow-900/5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpenModal(donation)}
            >
              <div className="flex flex-col gap-3">
                {/* Main Info */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {donation.donor.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary dark:text-white">{donation.donor}</h4>
                      <p className="text-xs text-slate-500">{donation.phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="warning" size="sm" className="text-[10px]">
                          {currentLanguage.code === 'ar' ? 'معلق' : currentLanguage.code === 'fr' ? 'En attente' : 'Pending'}
                        </Badge>
                        <span className="text-[10px] text-slate-400">#{donation.trxId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatAmount(donation.amount)} <span className="text-sm">MAD</span>
                    </p>
                    <p className="text-xs text-slate-400">{donation.project}</p>
                  </div>
                </div>

                {/* Method & Action Hint */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="material-symbols-outlined text-sm">{getMethodIcon(donation.method)}</span>
                    <span>{getMethodLabel(donation.method)}</span>
                  </div>
                  <span className="text-xs text-primary font-medium flex items-center gap-1">
                    {currentLanguage.code === 'ar' ? 'اضغط للتحقق' : currentLanguage.code === 'fr' ? 'Appuyer pour vérifier' : 'Click to verify'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          </div>
          <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">{t.allCaughtUp}</h3>
          <p className="text-slate-500 max-w-sm">{t.noDonations}</p>
        </div>
      )}

      {/* Verification Modal */}
      {selectedDonation && (
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
                {t.verifyDonation}
              </h2>
              <div className="flex w-10 items-center justify-end">
                <button className="flex cursor-pointer items-center justify-center rounded-full size-10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-400">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto ios-scroller">
              <div className="flex flex-col">
                {/* Donor Info Section */}
                <div className="p-6 space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary opacity-80">
                      {t.verificationWorkflow}
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.donationDetails}</h3>
                  </div>

                  {/* Donor Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-12 w-12 border-2 border-white dark:border-slate-700 shadow-sm bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                        {selectedDonation.donor.charAt(0)}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="text-text-secondary dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          {t.donorName}
                        </p>
                        <p className="text-slate-900 dark:text-white text-base font-bold">{selectedDonation.donor}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-200/60 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 block font-bold uppercase mb-1">
                          {t.transactionId}
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200">#{selectedDonation.trxId}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary dark:text-slate-400 block font-bold uppercase mb-1">
                          {t.targetProject}
                        </span>
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedDonation.project}</span>
                      </div>
                    </div>

                    {/* WhatsApp Chat Link */}
                    <div className="pt-1">
                      <a 
                        className="flex items-center gap-3 p-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-green-200 dark:hover:border-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg transition-all group"
                        href={formatWhatsAppLink(selectedDonation.phone)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="material-symbols-outlined text-xl">chat</span>
                        <span className="text-sm font-bold flex-1">{selectedDonation.phone}</span>
                        <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward_ios</span>
                      </a>
                    </div>
                  </div>

                  {/* Declared Amount - Editable */}
                  <div className="text-center py-4 bg-white dark:bg-slate-900">
                    <p className="text-[11px] font-bold text-text-secondary dark:text-slate-400 uppercase tracking-[0.2em] mb-2">
                      {t.amount}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        value={editedAmount}
                        onChange={(e) => setEditedAmount(e.target.value)}
                        className="text-3xl sm:text-5xl font-black text-primary tracking-tighter bg-transparent border-b-2 border-primary/30 focus:border-primary focus:outline-none text-center w-48 sm:w-64"
                      />
                      <span className="text-lg font-bold text-primary ml-1">MAD</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2">{t.editAmount}</p>
                  </div>
                </div>

                {/* Receipt & Verification Section */}
                <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  {/* Receipt Image */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-text-secondary dark:text-slate-400">
                        {t.receiptImage}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400 italic">{t.tapToEnlarge}</span>
                    </div>
                    <div 
                      className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video sm:aspect-[4/3] bg-slate-100 dark:bg-slate-800 cursor-zoom-in"
                      onClick={() => setImageExpanded(true)}
                    >
                      <img 
                        className="w-full h-full object-cover" 
                        src={selectedDonation.receiptImage} 
                        alt="Receipt"
                      />
                      <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="bg-white/90 dark:bg-slate-800/90 p-2 rounded-full shadow-lg">
                          <span className="material-symbols-outlined text-slate-800 dark:text-white">zoom_in</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Display */}
                  <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {t.paymentMethod}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">{getMethodIcon(selectedDonation.method)}</span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{getMethodLabel(selectedDonation.method)}</span>
                    </div>
                  </div>

                  {/* Verification Checklist */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      {t.verificationChecklist}
                    </p>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all hover:shadow-sm">
                        <input 
                          type="checkbox"
                          checked={verificationChecks.amountMatches}
                          onChange={() => handleCheckChange('amountMatches')}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.amountMatches}</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all hover:shadow-sm">
                        <input 
                          type="checkbox"
                          checked={verificationChecks.referenceVisible}
                          onChange={() => handleCheckChange('referenceVisible')}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.referenceVisible}</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all hover:shadow-sm">
                        <input 
                          type="checkbox"
                          checked={verificationChecks.dateRecent}
                          onChange={() => handleCheckChange('dateRecent')}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.dateRecent}</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer active:scale-[0.98] transition-all hover:shadow-sm">
                        <input 
                          type="checkbox"
                          checked={verificationChecks.accountCorrect}
                          onChange={() => handleCheckChange('accountCorrect')}
                          className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t.accountCorrect}</span>
                      </label>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  <div className="pt-2">
                    <label className="block text-[10px] font-bold text-red-500 uppercase tracking-widest mb-2">
                      {t.rejectionReason}
                    </label>
                    <textarea 
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm focus:ring-red-200 focus:border-red-400 min-h-[80px] text-slate-700 dark:text-slate-300"
                      placeholder={t.rejectionPlaceholder}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
              <div className="flex gap-3 flex-1">
                <button 
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleReject}
                  disabled={!rejectionReason.trim()}
                  className="flex-1 px-4 py-3.5 rounded-xl font-bold text-red-500 border border-red-100 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t.reject}
                </button>
              </div>
              <button 
                onClick={handleVerify}
                className="flex-[1.5] px-6 py-3.5 rounded-xl font-bold bg-primary text-white hover:opacity-95 active:scale-[0.99] transition-all shadow-lg shadow-[#0D737722]"
              >
                {t.approve}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Image Modal */}
      {imageExpanded && selectedDonation && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setImageExpanded(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setImageExpanded(false)}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            src={selectedDonation.receiptImage}
            alt="Receipt - Full Size"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
