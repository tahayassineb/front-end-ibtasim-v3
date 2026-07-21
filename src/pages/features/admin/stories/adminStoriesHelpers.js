import { normalizeI18nText } from "../../../../lib/i18nContent";
import { CMS_IMAGE_ALLOWED_TYPES, CMS_IMAGE_MAX_BYTES, validateUploadFile } from "../../../../lib/uploadValidation";

export const BORDER = "#E5E9EB";
export const PRIMARY = "#0d7477";
export const P600 = "#0A5F62";
export const P50 = "#E6F4F4";
export const TEXT2 = "#64748b";
export const TEXTM = "#94a3b8";
export const SHADOW = "0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)";
export const SHADOW_P = "0 4px 14px rgba(13,116,119,.25)";

export const POST_TYPES = [
  { id: "story", label: "قصة نجاح" },
  { id: "activity", label: "نشاط وفعالية" },
  { id: "update", label: "خبر وتحديث" },
];

export const POST_TYPE_DEFAULTS = {
  story: {
    gradient: "linear-gradient(160deg,#063a3b,#0d7477)",
    badgeIcon: "star",
    badgeText: { ar: "قصة نجاح", fr: "Histoire", en: "Story" },
    catLabel: { ar: "قصة نجاح", fr: "Success story", en: "Success story" },
    catColor: "#0A5F62",
    category: "education",
  },
  activity: {
    gradient: "linear-gradient(160deg,#1a4520,#27ae60)",
    badgeIcon: "celebration",
    badgeText: { ar: "نشاط وفعالية", fr: "Activite", en: "Activity" },
    catLabel: { ar: "نشاط", fr: "Activity", en: "Activity" },
    catColor: "#16a34a",
    category: "education",
  },
  update: {
    gradient: "linear-gradient(160deg,#1a4a6b,#48aadf)",
    badgeIcon: "campaign",
    badgeText: { ar: "خبر وتحديث", fr: "Actualite", en: "Update" },
    catLabel: { ar: "أخبار", fr: "News", en: "News" },
    catColor: "#0d7477",
    category: "education",
  },
};

export const EMPTY_FORM = {
  title: { ar: "", fr: "", en: "" },
  excerpt: { ar: "", fr: "", en: "" },
  ...POST_TYPE_DEFAULTS.story,
  isPublished: false,
  isFeatured: false,
  coverImage: "",
  body: { ar: "", fr: "", en: "" },
  postType: "story",
  slug: "",
  metaDescription: "",
  metaTitle: "",
  imageAlt: "",
};

export const fieldInput = {
  width: "100%",
  height: 44,
  border: `1.5px solid ${BORDER}`,
  borderRadius: 10,
  padding: "0 12px",
  fontSize: 13,
  fontFamily: "var(--font-arabic)",
  color: "#0e1a1b",
  outline: "none",
  background: "white",
  boxSizing: "border-box",
};

export function slugifyStoryTitle(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
    .slice(0, 80);
}

export function buildStoryForm(story) {
  const postType = story.postType || "story";
  const defaults = POST_TYPE_DEFAULTS[postType] || POST_TYPE_DEFAULTS.story;
  return {
    title: normalizeI18nText(story.title),
    excerpt: normalizeI18nText(story.excerpt),
    ...defaults,
    isPublished: story.isPublished,
    isFeatured: story.isFeatured ?? false,
    coverImage: story.coverImage || "",
    badgeText: normalizeI18nText(story.badgeText || defaults.badgeText),
    catLabel: normalizeI18nText(story.catLabel || defaults.catLabel),
    body: normalizeI18nText(story.body),
    postType,
    slug: story.slug || "",
    metaDescription: story.metaDescription || "",
    metaTitle: story.metaTitle || "",
    imageAlt: story.imageAlt || "",
  };
}

export function buildStoryPayload(form) {
  const body = normalizeI18nText(form.body);
  return {
    title: normalizeI18nText(form.title),
    excerpt: normalizeI18nText(form.excerpt),
    category: form.category,
    gradient: form.gradient,
    badgeIcon: form.badgeIcon,
    badgeText: normalizeI18nText(form.badgeText),
    catLabel: normalizeI18nText(form.catLabel),
    catColor: form.catColor,
    isPublished: form.isPublished,
    isFeatured: form.isFeatured,
    coverImage: form.coverImage || undefined,
    body: body.ar || body.fr || body.en ? body : undefined,
    postType: form.postType || "story",
    slug: form.slug || undefined,
    metaDescription: form.metaDescription || undefined,
    metaTitle: form.metaTitle || undefined,
    imageAlt: form.imageAlt || undefined,
  };
}

export function validateStoryImageFile(file) {
  return validateUploadFile(file, {
    allowedTypes: CMS_IMAGE_ALLOWED_TYPES,
    maxBytes: CMS_IMAGE_MAX_BYTES,
    label: "صورة الغلاف",
  });
}

export function validateStoryInlineImageFile(file) {
  return validateUploadFile(file, {
    allowedTypes: CMS_IMAGE_ALLOWED_TYPES,
    maxBytes: CMS_IMAGE_MAX_BYTES,
    label: "الصورة",
  });
}
