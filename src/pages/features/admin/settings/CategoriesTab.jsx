import React, { useEffect, useState } from 'react';
import { DEFAULT_PROJECT_CATEGORIES, LANGUAGES, normalizeI18nText } from '../../../../lib/i18nContent';
import { BORDER, fieldInput, PRIMARY, TEXT2, TEXTM } from './tokens';
import { FieldLabel, SaveBtn, SettingsCard } from './components';

const blankCategory = () => ({
  id: '',
  icon: 'category',
  label: { ar: '', fr: '', en: '' },
});

const langLabels = { ar: 'AR', fr: 'FR', en: 'EN' };

export default function CategoriesTab({ categories, handleSaveCategories, isSavingCategories }) {
  const [draft, setDraft] = useState(categories?.length ? categories : DEFAULT_PROJECT_CATEGORIES);

  useEffect(() => {
    setDraft(categories?.length ? categories : DEFAULT_PROJECT_CATEGORIES);
  }, [categories]);

  const updateCategory = (index, patch) => {
    setDraft((previous) => previous.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const updateLabel = (index, lang, value) => {
    setDraft((previous) =>
      previous.map((item, i) =>
        i === index
          ? { ...item, label: { ...normalizeI18nText(item.label), [lang]: value } }
          : item
      )
    );
  };

  const addCategory = () => setDraft((previous) => [...previous, blankCategory()]);
  const removeCategory = (index) => setDraft((previous) => previous.filter((_, i) => i !== index));

  const save = () => {
    const normalized = draft
      .map((item) => ({
        id: String(item.id || '').trim().toLowerCase().replace(/\s+/g, '_'),
        icon: String(item.icon || 'category').trim() || 'category',
        label: normalizeI18nText(item.label),
      }))
      .filter((item) => item.id && (item.label.ar || item.label.fr || item.label.en));
    handleSaveCategories(normalized);
  };

  return (
    <SettingsCard icon={<span className="material-symbols-outlined no-flip">category</span>} title="فئات المشاريع">
      <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.7, marginTop: 0 }}>
        أضف أو احذف فئات المشاريع، واكتب اسم كل فئة بالعربية والفرنسية والإنجليزية.
      </p>

      <div style={{ display: 'grid', gap: 12 }}>
        {draft.map((category, index) => (
          <div key={`${category.id || 'new'}-${index}`} style={{ border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, background: '#F8FAFC' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px auto', gap: 10, alignItems: 'end' }}>
              <div>
                <FieldLabel>المعرف</FieldLabel>
                <input
                  value={category.id}
                  onChange={(event) => updateCategory(index, { id: event.target.value })}
                  placeholder="education"
                  dir="ltr"
                  style={{ ...fieldInput, background: 'white', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <div>
                <FieldLabel>الأيقونة</FieldLabel>
                <input
                  value={category.icon}
                  onChange={(event) => updateCategory(index, { icon: event.target.value })}
                  placeholder="school"
                  dir="ltr"
                  style={{ ...fieldInput, background: 'white', fontFamily: 'Inter, sans-serif' }}
                />
              </div>
              <button
                type="button"
                onClick={() => removeCategory(index)}
                style={{ height: 48, width: 48, border: 'none', borderRadius: 12, background: '#FEE2E2', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Delete category"
              >
                <span className="material-symbols-outlined no-flip">delete</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 12 }}>
              {LANGUAGES.map((lang) => (
                <div key={lang}>
                  <FieldLabel>{langLabels[lang]}</FieldLabel>
                  <input
                    value={normalizeI18nText(category.label)[lang]}
                    onChange={(event) => updateLabel(index, lang, event.target.value)}
                    placeholder={lang === 'ar' ? 'التعليم' : lang === 'fr' ? 'Education' : 'Education'}
                    dir={lang === 'ar' ? 'rtl' : 'ltr'}
                    style={{ ...fieldInput, background: 'white' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16 }}>
        <button
          type="button"
          onClick={addCategory}
          style={{ height: 40, padding: '0 16px', border: `1.5px dashed ${BORDER}`, borderRadius: 10, background: 'white', color: PRIMARY, fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}
        >
          إضافة فئة
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: TEXTM }}>{draft.length} فئة</span>
          <SaveBtn onClick={save} loading={isSavingCategories}>حفظ الفئات</SaveBtn>
        </div>
      </div>
    </SettingsCard>
  );
}
