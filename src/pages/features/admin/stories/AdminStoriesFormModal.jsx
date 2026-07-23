import React, { useState } from "react";
import RichTextEditor from "../../../../components/RichTextEditor";
import { normalizeI18nText } from "../../../../lib/i18nContent";
import {
  BORDER,
  fieldInput,
  P50,
  P600,
  POST_TYPE_DEFAULTS,
  POST_TYPES,
  PRIMARY,
  SHADOW_P,
  TEXT2,
  TEXTM,
} from "./adminStoriesHelpers";

function FieldLabel({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 6 }}>{children}</div>;
}

function LanguageTabs({ activeLang, setActiveLang }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
      {["ar", "fr", "en"].map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setActiveLang(lang)}
          style={{
            height: 28,
            padding: "0 12px",
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 700,
            cursor: "pointer",
            border: `1.5px solid ${activeLang === lang ? PRIMARY : BORDER}`,
            background: activeLang === lang ? PRIMARY : "white",
            color: activeLang === lang ? "white" : TEXT2,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default function AdminStoriesFormModal(props) {
  const [activeLang, setActiveLang] = useState("ar");
  const {
    coverInputRef,
    coverPreview,
    editingId,
    form,
    handleCoverUpload,
    handleField,
    handleInlineImageUpload,
    handleSave,
    saving,
    seoOpen,
    setCoverPreview,
    setForm,
    setSeoOpen,
    setShowForm,
    slugifyStoryTitle,
    uploadingCover,
  } = props;

  const setLocalizedField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: { ...normalizeI18nText(previous[field]), [activeLang]: value },
    }));
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.4)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 28,
          width: "100%",
          maxWidth: 600,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{editingId ? "تعديل المنشور" : "منشور جديد"}</h2>
          <button
            onClick={() => setShowForm(false)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: TEXT2 }}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <FieldLabel>صورة الغلاف</FieldLabel>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(event) => handleCoverUpload(event.target.files?.[0])}
          />
          {coverPreview ? (
            <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", height: 140 }}>
              <img src={coverPreview} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                type="button"
                onClick={() => {
                  handleField("coverImage", "");
                  setCoverPreview(null);
                }}
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,.5)",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              style={{
                width: "100%",
                height: 100,
                border: `2px dashed ${BORDER}`,
                borderRadius: 12,
                background: "#F8FAFC",
                cursor: "pointer",
                fontSize: 13,
                color: TEXT2,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 24 }}>🖼️</span>
              <span>{uploadingCover ? "جاري الرفع..." : "اضغط لرفع صورة الغلاف"}</span>
            </button>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>نوع المنشور</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            {POST_TYPES.map((postType) => (
              <button
                key={postType.id}
                type="button"
                onClick={() => setForm((previous) => ({ ...previous, postType: postType.id, ...POST_TYPE_DEFAULTS[postType.id] }))}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  border: `1.5px solid ${form.postType === postType.id ? PRIMARY : BORDER}`,
                  background: form.postType === postType.id ? P50 : "white",
                  color: form.postType === postType.id ? P600 : TEXT2,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--font-arabic)",
                }}
              >
                {postType.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>العنوان *</FieldLabel>
          <LanguageTabs activeLang={activeLang} setActiveLang={setActiveLang} />
          <input
            style={fieldInput}
            value={normalizeI18nText(form.title)[activeLang]}
            onChange={(event) => {
              setLocalizedField("title", event.target.value);
              if (!form.slug) {
                handleField("slug", slugifyStoryTitle(event.target.value));
              }
            }}
            placeholder="عنوان المنشور"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>المختصر * (جملة أو جملتان)</FieldLabel>
          <textarea
            value={normalizeI18nText(form.excerpt)[activeLang]}
            onChange={(event) => setLocalizedField("excerpt", event.target.value)}
            placeholder="وصف مختصر يظهر في بطاقة المنشور..."
            style={{ ...fieldInput, height: 64, paddingTop: 10, resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>المحتوى (يدعم النص المنسق وإدراج الصور)</FieldLabel>
          <RichTextEditor
            value={normalizeI18nText(form.body)[activeLang]}
            onChange={(value) => setLocalizedField("body", value)}
            placeholder="اكتب محتوى المنشور هنا..."
            rows={10}
            onInsertImage={handleInlineImageUpload}
          />
        </div>

        <div style={{ display: "flex", gap: 20, marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={form.isPublished}
              onChange={(event) => handleField("isPublished", event.target.checked)}
              style={{ accentColor: PRIMARY }}
            />
            نشر فوراً
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(event) => handleField("isFeatured", event.target.checked)}
              style={{ accentColor: PRIMARY }}
            />
            منشور مميز
          </label>
        </div>

        <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setSeoOpen((open) => !open)}
            style={{
              width: "100%",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#F8FAFC",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: TEXT2,
              fontFamily: "var(--font-arabic)",
            }}
          >
            <span>🔍 إعدادات SEO</span>
            <span>{seoOpen ? "▲" : "▼"}</span>
          </button>
          {seoOpen && (
            <div style={{ padding: "14px" }}>
              <div style={{ marginBottom: 12 }}>
                <FieldLabel>الرابط (Slug) — يُملأ تلقائياً</FieldLabel>
                <input
                  style={{ ...fieldInput, fontFamily: "Inter, monospace", fontSize: 12 }}
                  value={form.slug}
                  onChange={(event) => handleField("slug", event.target.value)}
                  placeholder="my-post-slug"
                  dir="ltr"
                />
                <input
                  style={{ ...fieldInput, marginTop: 10 }}
                  value={form.metaTitle}
                  onChange={(event) => handleField("metaTitle", event.target.value)}
                  placeholder="Meta title"
                />
                <input
                  style={{ ...fieldInput, marginTop: 10 }}
                  value={form.imageAlt}
                  onChange={(event) => handleField("imageAlt", event.target.value)}
                  placeholder="Image alt text"
                />
              </div>
              <div>
                <FieldLabel>وصف الصفحة (Meta Description) — حتى 160 حرفاً</FieldLabel>
                <textarea
                  value={form.metaDescription}
                  onChange={(event) => handleField("metaDescription", event.target.value.slice(0, 160))}
                  placeholder="وصف مختصر يظهر في نتائج محركات البحث..."
                  style={{ ...fieldInput, height: 56, paddingTop: 10, resize: "none" }}
                />
                <div style={{ fontSize: 11, color: TEXTM, textAlign: "left", fontFamily: "Inter, sans-serif" }}>
                  {(form.metaDescription || "").length} / 160
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={() => setShowForm(false)}
            style={{
              height: 40,
              padding: "0 18px",
              border: `1.5px solid ${BORDER}`,
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-arabic)",
              background: "white",
              color: TEXT2,
            }}
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              height: 40,
              padding: "0 20px",
              background: PRIMARY,
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "var(--font-arabic)",
              boxShadow: SHADOW_P,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "..." : editingId ? "💾 حفظ" : "✅ إنشاء"}
          </button>
        </div>
      </div>
    </div>
  );
}
