// All monetary values in the database are stored in MAD.

export const normalizeMAD = (mad) => {
  if (mad == null || isNaN(mad)) return 0;
  return Number(Number(mad).toFixed(2));
};

export const formatMAD = (amount, lang = 'ar') => {
  if (amount == null || isNaN(amount)) return lang === 'ar' ? '— درهم' : '— MAD';
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-MA' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(amount));
  return lang === 'ar' ? `${formatted} درهم` : `${formatted} MAD`;
};
