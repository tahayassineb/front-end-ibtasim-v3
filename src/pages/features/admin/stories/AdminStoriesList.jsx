import React from "react";
import { getLocalizedText } from "../../../../lib/i18nContent";
import { BORDER, P50, P600, POST_TYPES, PRIMARY, SHADOW, SHADOW_P, TEXT2, TEXTM } from "./adminStoriesHelpers";

export default function AdminStoriesList(props) {
  const { handleDelete, handleOpenEdit, handleOpenNew, handleTogglePublish, stories } = props;

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>📖 المدونة</h1>
          <div style={{ fontSize: 13, color: TEXT2, marginTop: 4 }}>{stories?.length ?? 0} منشور في قاعدة البيانات</div>
        </div>
        <button
          onClick={handleOpenNew}
          style={{
            height: 40,
            padding: "0 18px",
            background: PRIMARY,
            color: "white",
            border: "none",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "var(--font-arabic)",
            boxShadow: SHADOW_P,
          }}
        >
          ➕ منشور جديد
        </button>
      </div>

      {stories === undefined ? (
        <div style={{ textAlign: "center", padding: 60, color: TEXTM }}>جاري التحميل...</div>
      ) : stories.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, background: "white", borderRadius: 16, border: `1px solid ${BORDER}` }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📖</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>لا توجد منشورات بعد</div>
          <div style={{ fontSize: 13, color: TEXT2 }}>أضف أول منشور في المدونة</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {stories.map((story) => (
            <div
              key={story._id}
              style={{
                background: "white",
                border: `1px solid ${BORDER}`,
                borderRadius: 14,
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                boxShadow: SHADOW,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 40,
                  borderRadius: 8,
                  background: story.gradient,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                <span className="material-symbols-outlined no-flip">{story.badgeIcon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getLocalizedText(story.title, "ar")}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "Inter, sans-serif", color: story.catColor }}>
                    {getLocalizedText(story.catLabel, "ar")}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: 100,
                      background: story.isPublished ? "#D1FAE5" : "#F1F5F9",
                      color: story.isPublished ? "#16a34a" : TEXTM,
                    }}
                  >
                    {story.isPublished ? "✓ منشورة" : "مسودة"}
                  </span>
                  {story.isFeatured && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: "#FEF3C7",
                        color: "#b45309",
                      }}
                    >
                      ⭐ مميزة
                    </span>
                  )}
                  {story.postType && story.postType !== "story" && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 100,
                        background: "#F1F5F9",
                        color: TEXT2,
                      }}
                    >
                      {POST_TYPES.find((postType) => postType.id === story.postType)?.label}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => handleTogglePublish(story)}
                  style={{
                    height: 34,
                    padding: "0 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-arabic)",
                    border: "none",
                    background: story.isPublished ? "#FEE2E2" : P50,
                    color: story.isPublished ? "#dc2626" : P600,
                  }}
                >
                  {story.isPublished ? "إلغاء النشر" : "نشر"}
                </button>
                <button
                  onClick={() => handleOpenEdit(story)}
                  style={{
                    height: 34,
                    padding: "0 12px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "var(--font-arabic)",
                    border: `1px solid ${BORDER}`,
                    background: "white",
                    color: TEXT2,
                  }}
                >
                  تعديل
                </button>
                <button
                  onClick={() => handleDelete(story._id)}
                  style={{
                    height: 34,
                    padding: "0 10px",
                    borderRadius: 10,
                    fontSize: 14,
                    cursor: "pointer",
                    border: "none",
                    background: "#FEE2E2",
                    color: "#dc2626",
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
