import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Badge from '../components/Badge';

// ============================================
// USER PROFILE PAGE - User info & donation history
// ============================================

const UserProfile = () => {
  const navigate = useNavigate();
  const { currentLanguage, user, logout, updateUser, showToast, formatCurrency, formatDate, changeLanguage } = useApp();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const isRTL = currentLanguage.dir === 'rtl';
  
  // Translations
  const translations = {
    ar: {
      title: 'الملف الشخصي',
      editProfile: 'تعديل الملف',
      saveChanges: 'حفظ التغييرات',
      cancel: 'إلغاء',
      logout: 'تسجيل الخروج',
      logoutConfirm: 'هل أنت متأكد من تسجيل الخروج؟',
      nameLabel: 'الاسم',
      emailLabel: 'البريد الإلكتروني',
      phoneLabel: 'رقم الهاتف',
      memberSince: 'عضو منذ',
      donationHistory: 'سجل التبرعات',
      noDonations: 'لم تقم بأي تبرعات بعد',
      startDonating: 'ابدأ بالتبرع الآن',
      totalDonated: 'إجمالي التبرعات',
      donationsCount: 'عدد التبرعات',
      donationRef: 'رقم المرجع',
      donationDate: 'التاريخ',
      donationAmount: 'المبلغ',
      donationStatus: 'الحالة',
      donationProject: 'المشروع',
      editSuccess: 'تم تحديث الملف الشخصي بنجاح',
      editError: 'حدث خطأ أثناء التحديث',
      languagePreference: 'اللغة المفضلة',
      selectLanguage: 'اختر اللغة',
      languageUpdated: 'تم تحديث اللغة بنجاح',
    },
    fr: {
      title: 'Profil',
      editProfile: 'Modifier le profil',
      saveChanges: 'Enregistrer',
      cancel: 'Annuler',
      logout: 'Déconnexion',
      logoutConfirm: 'Êtes-vous sûr de vouloir vous déconnecter?',
      nameLabel: 'Nom',
      emailLabel: 'Email',
      phoneLabel: 'Téléphone',
      memberSince: 'Membre depuis',
      donationHistory: 'Historique des dons',
      noDonations: 'Vous n\'avez pas encore fait de dons',
      startDonating: 'Commencer à donner',
      totalDonated: 'Total donné',
      donationsCount: 'Nombre de dons',
      donationRef: 'Référence',
      donationDate: 'Date',
      donationAmount: 'Montant',
      donationStatus: 'Statut',
      donationProject: 'Projet',
      editSuccess: 'Profil mis à jour avec succès',
      editError: 'Erreur lors de la mise à jour',
      languagePreference: 'Langue préférée',
      selectLanguage: 'Choisir la langue',
      languageUpdated: 'Langue mise à jour avec succès',
    },
    en: {
      title: 'Profile',
      editProfile: 'Edit Profile',
      saveChanges: 'Save Changes',
      cancel: 'Cancel',
      logout: 'Logout',
      logoutConfirm: 'Are you sure you want to logout?',
      nameLabel: 'Name',
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      memberSince: 'Member since',
      donationHistory: 'Donation History',
      noDonations: 'You haven\'t made any donations yet',
      startDonating: 'Start donating now',
      totalDonated: 'Total donated',
      donationsCount: 'Donations count',
      donationRef: 'Reference',
      donationDate: 'Date',
      donationAmount: 'Amount',
      donationStatus: 'Status',
      donationProject: 'Project',
      editSuccess: 'Profile updated successfully',
      editError: 'Error updating profile',
      languagePreference: 'Language Preference',
      selectLanguage: 'Select Language',
      languageUpdated: 'Language updated successfully',
    },
  };
  
  const tx = translations[currentLanguage.code] || translations.ar;
  
  // Calculate stats
  const donations = user?.donations || [];
  const totalDonated = donations.reduce((sum, d) => sum + (d.amount || 0), 0);
  // eslint-disable-next-line no-unused-vars
  const _verifiedDonations = donations.filter(d => d.status === 'verified');
  
  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel - reset data
      setEditData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
      });
    }
    setIsEditing(!isEditing);
  };
  
  // Handle input changes
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    changeLanguage(newLang);
    localStorage.setItem('user-language-preference', newLang);
    showToast(tx.languageUpdated, 'success');
  };
  
  // Handle save
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateUser({
        name: editData.name,
        email: editData.email,
        phone: editData.phone,
      });
      
      showToast(tx.editSuccess, 'success');
      setIsEditing(false);
    } catch (error) {
      showToast(tx.editError, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    if (window.confirm(tx.logoutConfirm)) {
      logout();
      navigate('/', { replace: true });
      showToast(currentLanguage.code === 'ar' ? 'تم تسجيل الخروج' : 
                 currentLanguage.code === 'fr' ? 'Déconnexion réussie' : 
                 'Logged out successfully', 'info');
    }
  };
  
  // Status badge helper
  const getStatusBadge = (status) => {
    const statusMap = {
      verified: { variant: 'success', label: currentLanguage.code === 'ar' ? 'تم التحقق' : currentLanguage.code === 'fr' ? 'Vérifié' : 'Verified' },
      pending: { variant: 'warning', label: currentLanguage.code === 'ar' ? 'قيد الانتظار' : currentLanguage.code === 'fr' ? 'En attente' : 'Pending' },
      rejected: { variant: 'danger', label: currentLanguage.code === 'ar' ? 'مرفوض' : currentLanguage.code === 'fr' ? 'Rejeté' : 'Rejected' },
    };
    const config = statusMap[status] || statusMap.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-lg mx-auto">
        
        {/* Header */}
        <div className="bg-primary text-white p-6 pb-12 rounded-b-[2rem] shadow-lg shadow-primary/20">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">{tx.title}</h1>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
              <span>{tx.logout}</span>
            </button>
          </div>
          
          {/* User Info Card */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-white/30">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-white/80 text-sm">{user?.email}</p>
              <p className="text-white/60 text-xs mt-1">
                {tx.memberSince} {user?.createdAt ? formatDate(user.createdAt, { year: 'numeric', month: 'long' }) : '-'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="px-4 -mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">payments</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{tx.totalDonated}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalDonated)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-success text-lg">check_circle</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{tx.donationsCount}</span>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{donations.length}</p>
            </div>
          </div>
        </div>
        
        {/* Edit Profile Section */}
        <div className="px-4 mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                {isEditing ? tx.editProfile : tx.editProfile}
              </h3>
              <button
                onClick={handleEditToggle}
                className="text-primary text-sm font-medium hover:underline"
              >
                {isEditing ? tx.cancel : tx.editProfile}
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{tx.nameLabel}</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={editData.name}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium">{user?.name}</p>
                )}
              </div>
              
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{tx.emailLabel}</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleChange}
                    dir="ltr"
                    className={`w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium" dir="ltr">{user?.email}</p>
                )}
              </div>
              
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{tx.phoneLabel}</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={editData.phone}
                    onChange={handleChange}
                    dir="ltr"
                    className={`w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary ${isRTL ? 'text-right' : 'text-left'}`}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white font-medium" dir="ltr">{user?.phone}</p>
                )}
              </div>
              
              {isEditing && (
                <Button
                  onClick={handleSave}
                  loading={isLoading}
                  fullWidth
                  className="mt-2"
                >
                  {tx.saveChanges}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Language Preference Section */}
        <div className="px-4 mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">language</span>
              <h3 className="font-bold text-gray-900 dark:text-white">{tx.languagePreference}</h3>
            </div>
            
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-2 block">{tx.selectLanguage}</label>
              <select
                value={currentLanguage.code}
                onChange={handleLanguageChange}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="ar">العربية</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Donation History */}
        <div className="px-4 mt-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary">history</span>
              {tx.donationHistory}
            </h3>
            
            {donations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-gray-400 text-3xl">volunteer_activism</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 mb-4">{tx.noDonations}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/projects')}
                >
                  {tx.startDonating}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {donations.map((donation, index) => (
                  <div
                    key={donation.id || index}
                    className="border border-gray-100 dark:border-gray-700 rounded-xl p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {donation.project}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {tx.donationRef}: {donation.id}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(donation.date)}
                        </p>
                      </div>
                      <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                        <p className="font-bold text-primary">{formatCurrency(donation.amount)}</p>
                        <div className="mt-1">
                          {getStatusBadge(donation.status)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
