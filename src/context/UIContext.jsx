import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { LANGUAGES, TRANSLATIONS } from '../lib/i18n';

const UIContext = createContext(null);

export const UIProvider = ({ children }) => {
  // Language State - Default to Arabic
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('app-language');
    return saved || 'ar';
  });

  // Toast/Notification State
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

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
  // TOAST FUNCTIONS
  // ============================================

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
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

    // Clean up stale donation state from existing sessions
    localStorage.removeItem('donation-state');
    return () => clearTimeout(toastTimerRef.current);
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
    toast, showToast, hideToast,
    isDarkMode, toggleDarkMode, setDarkMode,
    formatCurrency, formatDate, formatPhoneNumber, formatRelativeTime, calculateProgress, daysRemaining,
  ]);

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used inside UIProvider');
  return ctx;
};
