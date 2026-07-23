import React, { useState, useRef, useEffect } from 'react';

// ============================================
// COUNTRY CODE SELECTOR - Dropdown with flags
// ============================================

// Common countries with emoji flags
const COUNTRIES = [
  { code: 'MA', name: 'Morocco', nameAr: 'المغرب', nameFr: 'Maroc', flag: '🇲🇦', dialCode: '+212' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', nameFr: 'France', flag: '🇫🇷', dialCode: '+33' },
  { code: 'ES', name: 'Spain', nameAr: 'إسبانيا', nameFr: 'Espagne', flag: '🇪🇸', dialCode: '+34' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', nameFr: 'États-Unis', flag: '🇺🇸', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', nameFr: 'Royaume-Uni', flag: '🇬🇧', dialCode: '+44' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات', nameFr: 'Émirats', flag: '🇦🇪', dialCode: '+971' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'السعودية', nameFr: 'Arabie Saoudite', flag: '🇸🇦', dialCode: '+966' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا', nameFr: 'Canada', flag: '🇨🇦', dialCode: '+1' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', nameFr: 'Allemagne', flag: '🇩🇪', dialCode: '+49' },
  { code: 'IT', name: 'Italy', nameAr: 'إيطاليا', nameFr: 'Italie', flag: '🇮🇹', dialCode: '+39' },
  { code: 'BE', name: 'Belgium', nameAr: 'بلجيكا', nameFr: 'Belgique', flag: '🇧🇪', dialCode: '+32' },
  { code: 'NL', name: 'Netherlands', nameAr: 'هولندا', nameFr: 'Pays-Bas', flag: '🇳🇱', dialCode: '+31' },
  { code: 'CH', name: 'Switzerland', nameAr: 'سويسرا', nameFr: 'Suisse', flag: '🇨🇭', dialCode: '+41' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', nameFr: 'Turquie', flag: '🇹🇷', dialCode: '+90' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', nameFr: 'Qatar', flag: '🇶🇦', dialCode: '+974' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', nameFr: 'Koweït', flag: '🇰🇼', dialCode: '+965' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', nameFr: 'Bahreïn', flag: '🇧🇭', dialCode: '+973' },
  { code: 'OM', name: 'Oman', nameAr: 'عمان', nameFr: 'Oman', flag: '🇴🇲', dialCode: '+968' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', nameFr: 'Égypte', flag: '🇪🇬', dialCode: '+20' },
  { code: 'TN', name: 'Tunisia', nameAr: 'تونس', nameFr: 'Tunisie', flag: '🇹🇳', dialCode: '+216' },
  { code: 'DZ', name: 'Algeria', nameAr: 'الجزائر', nameFr: 'Algérie', flag: '🇩🇿', dialCode: '+213' },
  { code: 'LY', name: 'Libya', nameAr: 'ليبيا', nameFr: 'Libye', flag: '🇱🇾', dialCode: '+218' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', nameFr: 'Jordanie', flag: '🇯🇴', dialCode: '+962' },
  { code: 'LB', name: 'Lebanon', nameAr: 'لبنان', nameFr: 'Liban', flag: '🇱🇧', dialCode: '+961' },
  { code: 'SY', name: 'Syria', nameAr: 'سوريا', nameFr: 'Syrie', flag: '🇸🇾', dialCode: '+963' },
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', nameFr: 'Irak', flag: '🇮🇶', dialCode: '+964' },
  { code: 'YE', name: 'Yemen', nameAr: 'اليمن', nameFr: 'Yémen', flag: '🇾🇪', dialCode: '+967' },
  { code: 'SD', name: 'Sudan', nameAr: 'السودان', nameFr: 'Soudan', flag: '🇸🇩', dialCode: '+249' },
  { code: 'MA-OTHER', name: 'Other', nameAr: 'أخرى', nameFr: 'Autre', flag: '🌍', dialCode: '' },
];

const CountryCodeSelector = ({
  value,
  onChange,
  lang = 'en',
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get display name based on language
  const getDisplayName = (country) => {
    if (lang === 'ar') return country.nameAr;
    if (lang === 'fr') return country.nameFr;
    return country.name;
  };

  // Find selected country
  const selectedCountry = COUNTRIES.find(c => c.dialCode === value) || COUNTRIES[0];

  // Filter countries for search
  const filteredCountries = searchQuery
    ? COUNTRIES.filter(c => 
        getDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.dialCode.includes(searchQuery)
      )
    : COUNTRIES;

  const handleSelect = (dialCode) => {
    onChange(dialCode);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          flex items-center gap-2 h-12 px-3
          bg-white dark:bg-gray-800
          border border-gray-200 dark:border-gray-700
          rounded-xl
          text-base
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isOpen ? 'ring-2 ring-primary border-primary' : ''}
        `}
        dir="ltr"
      >
        <span className="text-xl">{selectedCountry.flag}</span>
        <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
          {selectedCountry.dialCode || '+'}
        </span>
        <span className="material-symbols-outlined text-gray-400 text-lg transition-transform duration-200">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-2 w-72 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl">
          {/* Search Input */}
          <div className="px-3 pb-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 text-lg">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث...' : lang === 'fr' ? 'Rechercher...' : 'Search...'}
                className="w-full h-10 pl-10 pr-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Countries List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                {lang === 'ar' ? 'لا توجد نتائج' : lang === 'fr' ? 'Aucun résultat' : 'No results found'}
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country.dialCode)}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 text-left
                    transition-colors duration-150
                    ${value === country.dialCode 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  dir="ltr"
                >
                  <span className="text-2xl">{country.flag}</span>
                  <span className="font-medium">{country.dialCode}</span>
                  <span className="flex-1 text-sm truncate">
                    {getDisplayName(country)}
                  </span>
                  {value === country.dialCode && (
                    <span className="material-symbols-outlined text-primary">check</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryCodeSelector;
