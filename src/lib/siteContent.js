export const SITE_CONTENT_KEY = 'site_content_v1';

export const emptyLocalizedPageContent = () => ({
  ar: {},
  fr: {},
  en: {},
});

export const parseSiteContent = (raw) => {
  if (!raw) return { translations: emptyLocalizedPageContent(), images: {} };
  try {
    const parsed = JSON.parse(raw);
    return {
      translations: { ...emptyLocalizedPageContent(), ...(parsed.translations || {}) },
      images: parsed.images || {},
    };
  } catch {
    return { translations: emptyLocalizedPageContent(), images: {} };
  }
};

export const mergeContent = (base, overrides) => {
  if (!overrides || typeof overrides !== 'object') return base;
  const result = { ...base };
  Object.entries(overrides).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    if (value && typeof value === 'object' && !Array.isArray(value) && base?.[key] && typeof base[key] === 'object' && !Array.isArray(base[key])) {
      result[key] = mergeContent(base[key], value);
    } else {
      result[key] = value;
    }
  });
  return result;
};
