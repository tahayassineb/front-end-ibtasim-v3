import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';

const MATERIAL_ICONS = ['school', 'water_drop', 'health_and_safety', 'restaurant', 'home', 'volunteer_activism', 'emergency', 'favorite', 'groups', 'menu_book', 'public'];
const ICON_LABELS = { school: 'التعليم', water_drop: 'الماء', health_and_safety: 'الصحة', restaurant: 'الغذاء', home: 'السكن', volunteer_activism: 'الرعاية', emergency: 'الطوارئ', favorite: 'المحبة', groups: 'المجتمع', menu_book: 'المعرفة', public: 'عام' };
const blank = () => ({ slug: '', name: { ar: '', fr: '', en: '' }, icon: { type: 'material', value: 'category' } });

function CategoryIcon({ icon, size = 28 }) {
  if (icon?.type === 'image') return <img src={convexFileUrl(icon.value) || icon.value} alt="" style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8 }} />;
  if (icon?.type === 'emoji') return <span style={{ fontSize: size }}>{icon.value}</span>;
  return <span className="material-symbols-outlined no-flip" style={{ fontSize: size }}>{icon?.value || 'category'}</span>;
}

export default function AdminCategories() {
  const { user, showToast } = useApp();
  const adminId = user?.id;
  const categories = useQuery(api.projectCategories.getAdminCategories, adminId ? { adminId } : 'skip');
  const createCategory = useMutation(api.projectCategories.createCategory);
  const updateCategory = useMutation(api.projectCategories.updateCategory);
  const archiveCategory = useMutation(api.projectCategories.archiveCategory);
  const seedDefaults = useMutation(api.projectCategories.seedDefaultCategories);
  const uploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const inputRef = useRef(null);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const ordered = useMemo(() => [...(categories || [])].sort((a, b) => a.sortOrder - b.sortOrder), [categories]);
  const setName = (language, value) => setForm((current) => ({ ...current, name: { ...current.name, [language]: value } }));
  const reset = () => { setEditing(null); setForm(blank()); };

  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'image/png' || file.size > 1024 * 1024) { showToast('يجب أن تكون الصورة بصيغة PNG وألا يتجاوز حجمها 1 ميغابايت', 'error'); return; }
    const image = new Image();
    image.onload = async () => {
      URL.revokeObjectURL(image.src);
      if (image.width !== 256 || image.height !== 256) { showToast('يجب أن تكون أبعاد صورة الفئة 256 × 256 بكسل بالضبط', 'error'); return; }
      try {
        const url = await uploadUrl();
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: file });
        if (!response.ok) throw new Error('Upload failed');
        const { storageId } = await response.json();
        setForm((current) => ({ ...current, icon: { type: 'image', value: storageId } }));
        showToast('تم رفع صورة الفئة بنجاح', 'success');
      } catch { showToast('تعذر رفع صورة الفئة', 'error'); }
    };
    image.src = URL.createObjectURL(file);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!adminId) return;
    if (!editing && !form.slug.trim()) { showToast('أدخل المعرّف الدائم للفئة', 'error'); return; }
    if (Object.values(form.name).some((value) => !value.trim())) { showToast('أدخل اسم الفئة بالعربية والفرنسية والإنجليزية', 'error'); return; }
    setSaving(true);
    try {
      if (editing) await updateCategory({ adminId, categoryId: editing._id, name: form.name, icon: form.icon, sortOrder: editing.sortOrder });
      else await createCategory({ adminId, slug: form.slug, name: form.name, icon: form.icon, sortOrder: ordered.length + 1 });
      showToast('تم حفظ الفئة', 'success'); reset();
    } catch (error) { showToast(error?.message || 'تعذر حفظ الفئة', 'error'); }
    finally { setSaving(false); }
  };

  const beginEdit = (category) => { setEditing(category); setForm({ slug: category.slug, name: category.name, icon: category.icon }); };
  const archive = async (category) => {
    if (!adminId || !window.confirm(`هل تريد أرشفة فئة «${category.name.ar}»؟ ستبقى ظاهرة في المشاريع القديمة ولن يمكن اختيارها لمشروع جديد.`)) return;
    try { await archiveCategory({ adminId, categoryId: category._id }); showToast('تمت أرشفة الفئة', 'success'); } catch { showToast('تعذر أرشفة الفئة', 'error'); }
  };

  return <div style={{ padding: 24, maxWidth: 1120, margin: '0 auto', fontFamily: 'var(--font-arabic)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <div><div style={{ fontSize: 12, color: '#0d7477', fontWeight: 900, letterSpacing: '.1em' }}>المشاريع</div><h2 style={{ margin: '4px 0 8px', fontSize: 26 }}>إدارة الفئات</h2><p style={{ margin: 0, color: '#64748b' }}>أنشئ الفئة بثلاث لغات واختر أيقونة جاهزة أو رمزاً تعبيرياً أو ارفع صورة خاصة.</p></div>
      <button type="button" onClick={async () => { const count = await seedDefaults({ adminId }); showToast(count ? `تمت إضافة ${count} فئات جاهزة` : 'الفئات الجاهزة موجودة بالفعل', 'success'); }} style={{ height: 40, border: '1px solid #0d7477', color: '#0d7477', background: 'white', borderRadius: 10, padding: '0 14px', fontWeight: 800, cursor: 'pointer' }}>استرجاع الفئات الجاهزة</button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 22, alignItems: 'start' }}>
      <div style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 16, overflow: 'hidden' }}>
        {categories === undefined ? <div style={{ padding: 40, color: '#94a3b8' }}>جاري تحميل الفئات...</div> : ordered.map((category) => <div key={category._id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 16, borderBottom: '1px solid #E5E9EB', opacity: category.isActive ? 1 : .55 }}>
          <CategoryIcon icon={category.icon} /><div style={{ flex: 1 }}><strong>{category.name.ar}</strong><div style={{ fontSize: 12, color: '#64748b' }}>{category.name.fr} · {category.name.en} · <code>{category.slug}</code></div></div>
          <button type="button" onClick={() => beginEdit(category)} style={{ border: 'none', color: '#0d7477', background: '#E6F4F4', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}>تعديل</button>
          {category.isActive && <button type="button" onClick={() => archive(category)} style={{ border: 'none', color: '#b45309', background: '#FEF3C7', borderRadius: 8, padding: '7px 10px', cursor: 'pointer' }}>أرشفة</button>}
        </div>)}</div>

      <form onSubmit={save} style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 16, padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><strong>{editing ? 'تعديل الفئة' : 'فئة جديدة'}</strong>{editing && <button type="button" onClick={reset} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}>إلغاء</button>}</div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 5 }}>المعرّف الدائم (بالإنجليزية)</label><input disabled={Boolean(editing)} value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="education" dir="ltr" style={{ width: '100%', height: 40, boxSizing: 'border-box', border: '1px solid #E5E9EB', borderRadius: 8, padding: '0 10px', marginBottom: 14 }} />
        {[['ar', 'الاسم بالعربية', 'rtl'], ['fr', 'الاسم بالفرنسية', 'ltr'], ['en', 'الاسم بالإنجليزية', 'ltr']].map(([language, label, dir]) => <div key={language}><label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 5 }}>{label}</label><input lang={language} dir={dir} value={form.name[language]} onChange={(event) => setName(language, event.target.value)} style={{ width: '100%', height: 40, boxSizing: 'border-box', border: '1px solid #E5E9EB', borderRadius: 8, padding: '0 10px', marginBottom: 12 }} /></div>)}
        <label style={{ display: 'block', fontSize: 12, fontWeight: 800, marginBottom: 7 }}>شكل الفئة</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><button type="button" onClick={() => setForm((current) => ({ ...current, icon: { type: 'material', value: 'category' } }))}>أيقونة جاهزة</button><button type="button" onClick={() => setForm((current) => ({ ...current, icon: { type: 'emoji', value: '✨' } }))}>رمز تعبيري</button><button type="button" onClick={() => inputRef.current?.click()}>رفع صورة PNG</button><input ref={inputRef} onChange={handleImage} type="file" accept="image/png" hidden /></div>
        <div style={{ background: '#F0F7F7', color: '#475569', padding: 10, borderRadius: 9, fontSize: 11, lineHeight: 1.7, marginBottom: 12 }}><strong>مواصفات الصورة المطلوبة:</strong> PNG بخلفية شفافة، مربعة 256 × 256 بكسل، وبحجم أقصى 1 ميغابايت.</div>
        {form.icon.type === 'material' && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>{MATERIAL_ICONS.map((icon) => <button key={icon} type="button" title={ICON_LABELS[icon]} aria-label={ICON_LABELS[icon]} onClick={() => setForm((current) => ({ ...current, icon: { type: 'material', value: icon } }))} style={{ border: form.icon.value === icon ? '2px solid #0d7477' : '1px solid #E5E9EB', borderRadius: 8, background: 'white', padding: 6, cursor: 'pointer' }}><span className="material-symbols-outlined no-flip">{icon}</span></button>)}</div>}
        {form.icon.type === 'emoji' && <input value={form.icon.value} maxLength={8} onChange={(event) => setForm((current) => ({ ...current, icon: { type: 'emoji', value: event.target.value } }))} style={{ width: '100%', height: 40, boxSizing: 'border-box', border: '1px solid #E5E9EB', borderRadius: 8, padding: '0 10px', marginBottom: 14 }} placeholder="ألصق رمزاً تعبيرياً من لوحة المفاتيح" />}
        {form.icon.type === 'image' && <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}><CategoryIcon icon={form.icon} size={42} /><span style={{ fontSize: 12, color: '#64748b' }}>تم رفع صورة PNG بالمقاس الصحيح (256 × 256)</span></div>}
        <button disabled={saving} style={{ width: '100%', height: 44, border: 'none', background: '#0d7477', color: 'white', borderRadius: 10, fontWeight: 800, cursor: 'pointer' }}>{saving ? 'جاري الحفظ...' : 'حفظ الفئة'}</button>
      </form>
    </div>
  </div>;
}
