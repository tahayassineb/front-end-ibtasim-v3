export const LANGUAGES = ["ar", "fr", "en"];

export const EMPTY_I18N_TEXT = { ar: "", fr: "", en: "" };

export const DEFAULT_PROJECT_CATEGORIES = [
  { id: "education", icon: "school", label: { ar: "التعليم", fr: "Education", en: "Education" } },
  { id: "water", icon: "water_drop", label: { ar: "الماء", fr: "Eau", en: "Water" } },
  { id: "health", icon: "medical_services", label: { ar: "الصحة", fr: "Sante", en: "Health" } },
  { id: "food", icon: "bakery_dining", label: { ar: "الغذاء", fr: "Alimentation", en: "Food" } },
  { id: "housing", icon: "home", label: { ar: "السكن", fr: "Logement", en: "Housing" } },
  { id: "orphan_care", icon: "person_heart", label: { ar: "الكفالة", fr: "Kafala", en: "Kafala" } },
  { id: "emergency", icon: "emergency_home", label: { ar: "الطوارئ", fr: "Urgence", en: "Emergency" } },
];

export function getLocalizedText(value, lang = "ar") {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[lang] || value.ar || value.fr || value.en || "";
}

export function normalizeI18nText(value) {
  if (!value) return { ...EMPTY_I18N_TEXT };
  if (typeof value === "string") return { ar: value, fr: "", en: "" };
  return {
    ar: value.ar || "",
    fr: value.fr || "",
    en: value.en || "",
  };
}

export function parseProjectCategories(value) {
  if (!value) return DEFAULT_PROJECT_CATEGORIES;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!Array.isArray(parsed)) return DEFAULT_PROJECT_CATEGORIES;
    const normalized = parsed
      .map((category) => ({
        id: String(category.id || "").trim(),
        icon: String(category.icon || "category").trim() || "category",
        label: normalizeI18nText(category.label),
      }))
      .filter((category) => category.id && getLocalizedText(category.label));
    return normalized.length ? normalized : DEFAULT_PROJECT_CATEGORIES;
  } catch {
    return DEFAULT_PROJECT_CATEGORIES;
  }
}

export function getProjectCategoryMeta(categories, categoryId, lang = "ar") {
  const category = (categories || DEFAULT_PROJECT_CATEGORIES).find((item) => item.id === categoryId);
  if (!category) {
    return { icon: "category", label: categoryId || (lang === "ar" ? "خيري" : "Charity") };
  }
  return {
    icon: category.icon || "category",
    label: getLocalizedText(category.label, lang) || category.id,
  };
}
