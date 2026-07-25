import React, { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import { convexFileUrl } from '../../../../lib/convex';
import { optimizeImageFile } from '../../../../lib/imageOptimization';
import { parseSiteContent, SITE_CONTENT_KEY } from '../../../../lib/siteContent';

const PAGES = {
  home: {
    label: 'الصفحة الرئيسية',
    groups: [
      { label: 'الواجهة الرئيسية', fields: [['hero.eyebrow', 'النص الصغير'], ['hero.titlePrimary', 'العنوان الرئيسي'], ['hero.titleAccent', 'العنوان المميز'], ['hero.lead', 'الوصف'], ['hero.primaryCta', 'زر المشاريع'], ['hero.secondaryCta', 'زر الكفالة']] },
      { label: 'ماذا نفعل', fields: [['summary.kicker', 'النص الصغير'], ['summary.title', 'العنوان'], ['summary.lead', 'الوصف'], ['summary.quote', 'الاقتباس']] },
      { label: 'المشاريع', fields: [['projects.kicker', 'النص الصغير'], ['projects.title', 'العنوان'], ['projects.lead', 'الوصف'], ['projects.allCta', 'زر عرض المشاريع'], ['projects.action', 'زر المساهمة']] },
      { label: 'الكفالة', fields: [['kafala.kicker', 'النص الصغير'], ['kafala.title', 'العنوان'], ['kafala.lead', 'الوصف'], ['kafala.quote', 'الاقتباس'], ['kafala.allCta', 'زر عرض الكفالات'], ['kafala.sponsorCta', 'زر الكفالة'], ['kafala.centerTitle', 'عنوان رسالة الأثر'], ['kafala.centerText', 'وصف رسالة الأثر'], ['kafala.band', 'الشريط الختامي']] },
      { label: 'من نحن', fields: [['about.kicker', 'النص الصغير'], ['about.title', 'العنوان'], ['about.lead', 'الوصف'], ['about.quote', 'الاقتباس'], ['about.cta', 'زر التعرف علينا'], ['about.badgeTop', 'شارة الصورة — أعلى'], ['about.badgeMain', 'شارة الصورة — الوسط'], ['about.badgeBottom', 'شارة الصورة — أسفل']] },
      { label: 'التواصل', fields: [['contact.titlePrimary', 'العنوان الأول'], ['contact.titleAccent', 'العنوان المميز'], ['contact.lead', 'الوصف'], ['contact.primaryCta', 'زر المساهمة'], ['contact.secondaryCta', 'زر التواصل'], ['contact.footer', 'النص الختامي']] },
    ],
  },
  projects: { label: 'صفحة المشاريع', groups: [{ label: 'مقدمة الصفحة', fields: [['title', 'العنوان'], ['subtitle', 'الوصف']] }] },
  kafala: { label: 'صفحة الكفالة', groups: [{ label: 'مقدمة الصفحة', fields: [['title', 'العنوان'], ['subtitle', 'الوصف']] }] },
  about: { label: 'صفحة من نحن', groups: [{ label: 'مقدمة الصفحة', fields: [['title', 'العنوان'], ['lead', 'الوصف']] }] },
  contact: { label: 'صفحة التواصل', groups: [{ label: 'مقدمة الصفحة', fields: [['title', 'العنوان'], ['subtitle', 'الوصف']] }] },
};

const IMAGE_SPECS = {
  hero: { label: 'صورة الواجهة الرئيسية', width: 1600, height: 900 },
  summary: { label: 'صورة قسم ماذا نفعل', width: 1200, height: 900 },
  kafala: { label: 'صورة قسم الكفالة', width: 1200, height: 900 },
  about: { label: 'صورة قسم من نحن', width: 1200, height: 900 },
  contact: { label: 'صورة قسم التواصل', width: 1200, height: 800 },
};

const inputStyle = { width: '100%', minHeight: 44, border: '1px solid #DDE5E7', borderRadius: 10, padding: '10px 12px', boxSizing: 'border-box', fontFamily: 'var(--font-arabic)', lineHeight: 1.6 };

const readPath = (object, path) => path.split('.').reduce((value, key) => value?.[key], object) || '';
const writePath = (object, path, value) => {
  const result = structuredClone(object);
  const keys = path.split('.');
  let cursor = result;
  keys.slice(0, -1).forEach((key) => { cursor[key] = cursor[key] || {}; cursor = cursor[key]; });
  cursor[keys.at(-1)] = value;
  return result;
};

export default function AdminSiteContent() {
  const { user, showToast } = useApp();
  const raw = useQuery(api.config.getConfig, { key: SITE_CONTENT_KEY });
  const saveConfig = useMutation(api.config.setAdminConfig);
  const getUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);
  const [content, setContent] = useState(() => parseSiteContent(null));
  const [page, setPage] = useState('home');
  const [language, setLanguage] = useState('ar');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(null);
  const fileRef = useRef(null);
  const pendingImageKey = useRef(null);

  useEffect(() => { if (raw !== undefined) setContent(parseSiteContent(raw)); }, [raw]);

  const pageContent = content.translations?.[language]?.[page] || {};
  const setField = (path, value) => setContent((current) => ({
    ...current,
    translations: {
      ...current.translations,
      [language]: {
        ...(current.translations?.[language] || {}),
        [page]: writePath(current.translations?.[language]?.[page] || {}, path, value),
      },
    },
  }));

  const save = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await saveConfig({ adminId: user.id, key: SITE_CONTENT_KEY, value: JSON.stringify(content) });
      showToast('تم حفظ محتوى الموقع ونشره', 'success');
    } catch (error) { showToast(error?.message || 'تعذر حفظ المحتوى', 'error'); }
    finally { setSaving(false); }
  };

  const chooseImage = (key) => { pendingImageKey.current = key; fileRef.current?.click(); };
  const handleImage = async (event) => {
    const file = event.target.files?.[0];
    const key = pendingImageKey.current;
    event.target.value = '';
    if (!file || !key) return;
    const spec = IMAGE_SPECS[key];
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      showToast('استخدم صورة PNG أو JPG أو WebP بحجم لا يتجاوز 5 ميغابايت', 'error'); return;
    }
    const dimensions = await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => { URL.revokeObjectURL(image.src); resolve({ width: image.width, height: image.height }); };
      image.onerror = () => resolve(null);
      image.src = URL.createObjectURL(file);
    });
    if (!dimensions || dimensions.width < spec.width || dimensions.height < spec.height) {
      showToast(`هذه الصورة صغيرة. الحد الأدنى المطلوب ${spec.width} × ${spec.height} بكسل`, 'error'); return;
    }
    setUploading(key);
    try {
      const optimized = await optimizeImageFile(file, { maxWidth: 1800, maxHeight: 1800, quality: 0.84 });
      const uploadUrl = await getUploadUrl();
      const response = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': optimized.file.type }, body: optimized.file });
      if (!response.ok) throw new Error('Upload failed');
      const { storageId } = await response.json();
      setContent((current) => ({ ...current, images: { ...current.images, [key]: storageId } }));
      showToast('تم رفع الصورة. اضغط حفظ لنشرها.', 'success');
    } catch { showToast('تعذر رفع الصورة', 'error'); }
    finally { setUploading(null); }
  };

  return <div dir="rtl" style={{ padding: 24, maxWidth: 1180, margin: '0 auto', fontFamily: 'var(--font-arabic)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'start', flexWrap: 'wrap', marginBottom: 22 }}>
      <div><div style={{ fontSize: 12, fontWeight: 900, color: '#0d7477' }}>المحتوى</div><h2 style={{ margin: '5px 0 7px' }}>تخصيص الموقع</h2><p style={{ margin: 0, color: '#64748b' }}>عدّل النصوص والصور التي تظهر للزوار. الحقول الفارغة تستخدم النص الأصلي تلقائياً.</p></div>
      <button type="button" onClick={save} disabled={saving} style={{ height: 44, border: 0, borderRadius: 11, background: '#0d7477', color: 'white', padding: '0 22px', fontWeight: 900, cursor: 'pointer' }}>{saving ? 'جاري الحفظ...' : 'حفظ ونشر التغييرات'}</button>
    </div>

    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>{Object.entries(PAGES).map(([key, item]) => <button key={key} type="button" onClick={() => setPage(key)} style={{ border: `1px solid ${page === key ? '#0d7477' : '#DDE5E7'}`, background: page === key ? '#0d7477' : 'white', color: page === key ? 'white' : '#475569', borderRadius: 9, padding: '8px 13px', fontWeight: 800, cursor: 'pointer' }}>{item.label}</button>)}</div>
    <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>{[['ar', 'العربية'], ['fr', 'الفرنسية'], ['en', 'الإنجليزية']].map(([key, label]) => <button key={key} type="button" onClick={() => setLanguage(key)} style={{ border: `1px solid #0d7477`, background: language === key ? '#E6F4F4' : 'white', color: '#0d7477', borderRadius: 8, padding: '6px 11px', fontWeight: 800, cursor: 'pointer' }}>{label}</button>)}</div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
      {PAGES[page].groups.map((group) => <section key={group.label} style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 15, padding: 17 }}><h3 style={{ margin: '0 0 14px', fontSize: 16 }}>{group.label}</h3>{group.fields.map(([path, label]) => <label key={path} style={{ display: 'block', marginBottom: 13 }}><span style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#64748b', marginBottom: 5 }}>{label}</span><textarea dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language} value={readPath(pageContent, path)} onChange={(event) => setField(path, event.target.value)} rows={path.includes('lead') || path.includes('subtitle') ? 3 : 2} style={inputStyle} /></label>)}</section>)}
    </div>

    {page === 'home' && <section style={{ marginTop: 18, background: 'white', border: '1px solid #E5E9EB', borderRadius: 15, padding: 18 }}><h3 style={{ margin: '0 0 6px' }}>صور الصفحة الرئيسية</h3><p style={{ color: '#64748b', fontSize: 12, margin: '0 0 16px' }}>الصيغ المقبولة: PNG أو JPG أو WebP · الحجم الأقصى: 5 ميغابايت. لا تُقبل الصور الأصغر من المقاس الموضح.</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14 }}>{Object.entries(IMAGE_SPECS).map(([key, spec]) => { const imageUrl = convexFileUrl(content.images?.[key]) || content.images?.[key]; return <div key={key} style={{ border: '1px solid #E5E9EB', borderRadius: 12, overflow: 'hidden' }}><div style={{ height: 115, background: '#F0F7F7', display: 'grid', placeItems: 'center' }}>{imageUrl ? <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span className="material-symbols-outlined no-flip" style={{ fontSize: 35, color: '#94a3b8' }}>image</span>}</div><div style={{ padding: 11 }}><strong style={{ display: 'block', fontSize: 13 }}>{spec.label}</strong><span style={{ display: 'block', fontSize: 11, color: '#64748b', margin: '4px 0 9px' }}>الحد الأدنى {spec.width} × {spec.height} بكسل</span><button type="button" onClick={() => chooseImage(key)} disabled={uploading === key} style={{ width: '100%', height: 34, border: '1px solid #0d7477', color: '#0d7477', background: 'white', borderRadius: 8, cursor: 'pointer', fontWeight: 800 }}>{uploading === key ? 'جاري الرفع...' : imageUrl ? 'تغيير الصورة' : 'رفع الصورة'}</button></div></div>; })}</div><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleImage} hidden /></section>}
  </div>;
}
