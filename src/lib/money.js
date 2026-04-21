// All monetary values in the database are stored in centimes (MAD × 100).
// Exception: Whop API initial_price takes actual MAD — do NOT use toCentimes for Whop calls.

export const toCentimes = (mad) => {
  if (mad == null || isNaN(mad)) return 0;
  return Math.round(mad * 100);
};

export const fromCentimes = (centimes) => {
  if (centimes == null || isNaN(centimes)) return 0;
  return centimes / 100;
};

export const formatMAD = (centimes, lang = 'ar') => {
  if (centimes == null || isNaN(centimes)) return lang === 'ar' ? '— درهم' : '— MAD';
  const amount = centimes / 100;
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-MA' : 'en-US';
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return lang === 'ar' ? `${formatted} درهم` : `${formatted} MAD`;
};
