import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

// ============================================
// APP CONTEXT - Global State Management
// ============================================

const AppContext = createContext();

// Supported languages
export const LANGUAGES = {
  ar: {
    code: 'ar',
    name: 'العربية',
    dir: 'rtl',
    fontFamily: "'Tajawal', sans-serif",
  },
  fr: {
    code: 'fr',
    name: 'Français',
    dir: 'ltr',
    fontFamily: "'Inter', sans-serif",
  },
  en: {
    code: 'en',
    name: 'English',
    dir: 'ltr',
    fontFamily: "'Inter', sans-serif",
  },
};

// Translation dictionary
const TRANSLATIONS = {
  ar: {
    // Navigation
    home: 'الرئيسية',
    projects: 'المشاريع',
    donate: 'تبرع الآن',
    about: 'من نحن',
    contact: 'اتصل بنا',
    login: 'تسجيل الدخول',
    register: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    profile: 'الملف الشخصي',
    
    // Actions
    save: 'حفظ',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    delete: 'حذف',
    edit: 'تعديل',
    view: 'عرض',
    search: 'بحث',
    filter: 'تصفية',
    sort: 'ترتيب',
    
    // Donation
    amount: 'المبلغ',
    goal: 'الهدف',
    raised: 'تم جمعه',
    donors: 'المتبرعون',
    daysLeft: 'يوم متبقي',
    contribute: 'ساهم في هذا المشروع',
    
    // Status
    pending: 'قيد الانتظار',
    verified: 'تم التحقق',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    active: 'نشط',
    
    // Messages
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    success: 'تم بنجاح',
    noData: 'لا توجد بيانات',
    
    // Currency
    currency: 'درهم',
    currencyCode: 'MAD',
  },
  fr: {
    // Navigation
    home: 'Accueil',
    projects: 'Projets',
    donate: 'Faire un don',
    about: 'À propos',
    contact: 'Contact',
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    profile: 'Profil',
    
    // Actions
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    view: 'Voir',
    search: 'Rechercher',
    filter: 'Filtrer',
    sort: 'Trier',
    
    // Donation
    amount: 'Montant',
    goal: 'Objectif',
    raised: 'Collecté',
    donors: 'Donateurs',
    daysLeft: 'jours restants',
    contribute: 'Contribuer à ce projet',
    
    // Status
    pending: 'En attente',
    verified: 'Vérifié',
    rejected: 'Rejeté',
    completed: 'Terminé',
    active: 'Actif',
    
    // Messages
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    success: 'Succès',
    noData: 'Aucune donnée',
    
    // Currency
    currency: 'Dirham',
    currencyCode: 'MAD',
  },
  en: {
    // Navigation
    home: 'Home',
    projects: 'Projects',
    donate: 'Donate Now',
    about: 'About',
    contact: 'Contact',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    profile: 'Profile',
    
    // Actions
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    
    // Donation
    amount: 'Amount',
    goal: 'Goal',
    raised: 'Raised',
    donors: 'Donors',
    daysLeft: 'days left',
    contribute: 'Contribute to this project',
    
    // Status
    pending: 'Pending',
    verified: 'Verified',
    rejected: 'Rejected',
    completed: 'Completed',
    active: 'Active',
    
    // Messages
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    noData: 'No data available',
    
    // Currency
    currency: 'Dirham',
    currencyCode: 'MAD',
  },
};

// ============================================
// PROVIDER COMPONENT
// ============================================

export const AppProvider = ({ children }) => {
  // Language State - Default to Arabic
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app-language');
    return saved || 'ar';
  });

  // User Authentication State
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('app-user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('app-user');
  });

  // Donation Flow State
  const [donationState, setDonationState] = useState(() => {
    const saved = localStorage.getItem('donation-state');
    return saved ? JSON.parse(saved) : {
      projectId: null,
      amount: null,
      paymentMethod: null,
      phoneNumber: null,
      receipt: null,
      step: 1,
    };
  });

  // Toast/Notification State
  const [toast, setToast] = useState(null);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('app-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  // ============================================
  // LANGUAGE FUNCTIONS
  // ============================================

  const changeLanguage = useCallback((langCode) => {
    if (LANGUAGES[langCode]) {
      setLanguage(langCode);
      localStorage.setItem('app-language', langCode);
      document.documentElement.dir = LANGUAGES[langCode].dir;
      document.documentElement.lang = langCode;
    }
  }, []);

  const t = useCallback((key) => {
    return TRANSLATIONS[language]?.[key] || key;
  }, [language]);

  const currentLanguage = useMemo(() => LANGUAGES[language], [language]);

  // ============================================
  // AUTHENTICATION FUNCTIONS
  // ============================================

  const login = useCallback((userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('app-user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('app-user');
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('app-user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ============================================
  // DONATION FLOW FUNCTIONS
  // ============================================

  const updateDonation = useCallback((updates) => {
    setDonationState(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('donation-state', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetDonation = useCallback(() => {
    const initial = {
      projectId: null,
      amount: null,
      paymentMethod: null,
      phoneNumber: null,
      receipt: null,
      step: 1,
    };
    setDonationState(initial);
    localStorage.removeItem('donation-state');
  }, []);

  const nextDonationStep = useCallback(() => {
    setDonationState(prev => {
      const updated = { ...prev, step: Math.min(prev.step + 1, 5) };
      localStorage.setItem('donation-state', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const prevDonationStep = useCallback(() => {
    setDonationState(prev => {
      const updated = { ...prev, step: Math.max(prev.step - 1, 1) };
      localStorage.setItem('donation-state', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ============================================
  // TOAST FUNCTIONS
  // ============================================

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), duration);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // ============================================
  // THEME FUNCTIONS
  // ============================================

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('app-dark-mode', JSON.stringify(newValue));
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  }, []);

  const setDarkMode = useCallback((value) => {
    setIsDarkMode(value);
    localStorage.setItem('app-dark-mode', JSON.stringify(value));
    if (value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const formatCurrency = useCallback((amount, showCurrency = true) => {
    if (amount === null || amount === undefined) return '-';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(numAmount);
    
    if (showCurrency) {
      return language === 'ar' 
        ? `${formatted} ${TRANSLATIONS.ar.currency}`
        : `${formatted} ${TRANSLATIONS[language].currencyCode}`;
    }
    return formatted;
  }, [language]);

  const formatDate = useCallback((date, options = {}) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    const defaultOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options,
    };
    return new Intl.DateTimeFormat(
      language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-FR' : 'en-US',
      defaultOptions
    ).format(d);
  }, [language]);

  const formatPhoneNumber = useCallback((phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    if (cleaned.length === 12 && cleaned.startsWith('212')) {
      return cleaned.replace(/(212)(\d{3})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
    }
    return phone;
  }, []);

  const formatRelativeTime = useCallback((date) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - d) / 1000);
    
    const rtf = new Intl.RelativeTimeFormat(language === 'ar' ? 'ar' : language === 'fr' ? 'fr' : 'en', { numeric: 'auto' });
    
    if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
    if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    if (diffInSeconds < 604800) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 604800), 'week');
    if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
  }, [language]);

  const calculateProgress = useCallback((raised, goal) => {
    if (!goal || goal === 0) return 0;
    return Math.min(Math.round((raised / goal) * 100), 100);
  }, []);

  const daysRemaining = useCallback((endDate) => {
    if (!endDate) return null;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, []);

  // ============================================
  // INITIALIZATION EFFECTS
  // ============================================

  useEffect(() => {
    // Set initial direction and language
    document.documentElement.dir = currentLanguage.dir;
    document.documentElement.lang = language;
    
    // Set initial dark mode
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value = useMemo(() => ({
    // Language
    language,
    currentLanguage,
    changeLanguage,
    t,
    languages: LANGUAGES,
    
    // Authentication
    user,
    isAuthenticated,
    login,
    logout,
    updateUser,
    
    // Donation
    donationState,
    updateDonation,
    resetDonation,
    nextDonationStep,
    prevDonationStep,
    
    // Toast
    toast,
    showToast,
    hideToast,
    
    // Theme
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    
    // Helpers
    formatCurrency,
    formatDate,
    formatPhoneNumber,
    formatRelativeTime,
    calculateProgress,
    daysRemaining,
  }), [
    language, currentLanguage, changeLanguage, t,
    user, isAuthenticated, login, logout, updateUser,
    donationState, updateDonation, resetDonation, nextDonationStep, prevDonationStep,
    toast, showToast, hideToast,
    isDarkMode, toggleDarkMode, setDarkMode,
    formatCurrency, formatDate, formatPhoneNumber, formatRelativeTime, calculateProgress, daysRemaining,
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK
// ============================================

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
