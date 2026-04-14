import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ============================================
// ADMIN KAFALA FORM — Create / Edit orphan profile
// ============================================

const TABS = ['ar', 'fr', 'en'];
const TAB_LABELS = { ar: 'عربي', fr: 'Français', en: 'English' };

export default function AdminKafalaForm() {
  const { id } = useParams(); // present when editing
  const navigate = useNavigate();
  const { showToast, user: adminUser } = useApp();
  const isEdit = !!id;

  const existingKafala = useQuery(
    api.kafala.getKafalaById,
    isEdit ? { kafalaId: id } : 'skip'
  );

  const createKafala = useMutation(api.kafala.createKafala);
  const updateKafala = useMutation(api.kafala.updateKafala);
  const generateUploadUrl = useMutation(api.storage.generateProjectImageUploadUrl);

  // Form state
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [age, setAge] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState({ ar: '', fr: '', en: '' });
  const [monthlyPrice, setMonthlyPrice] = useState(''); // MAD (displayed), stored as cents
  const [bioTab, setBioTab] = useState('ar');
  const [photo, setPhoto] = useState(null); // File object
  const [photoPreview, setPhotoPreview] = useState(null); // preview URL
  const [existingPhoto, setExistingPhoto] = useState(null); // storageId from DB
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  // Pre-fill form when editing
  useEffect(() => {
    if (existingKafala && isEdit) {
      setName(existingKafala.name || '');
      setGender(existingKafala.gender || 'male');
      setAge(String(existingKafala.age || ''));
      setLocation(existingKafala.location || '');
      setBio(existingKafala.bio || { ar: '', fr: '', en: '' });
      setMonthlyPrice(String(Math.round(existingKafala.monthlyPrice / 100)));
      setExistingPhoto(existingKafala.photo || null);
    }
  }, [existingKafala, isEdit]);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const validate = () => {
    if (!name.trim()) { showToast?.('الاسم مطلوب', 'error'); return false; }
    if (!age || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 18) {
      showToast?.('العمر يجب أن يكون بين 1 و 18', 'error'); return false;
    }
    if (!location.trim()) { showToast?.('المدينة مطلوبة', 'error'); return false; }
    if (!bio.ar.trim()) { showToast?.('النبذة بالعربية مطلوبة', 'error'); return false; }
    if (!monthlyPrice || isNaN(Number(monthlyPrice)) || Number(monthlyPrice) < 1) {
      showToast?.('السعر الشهري مطلوب', 'error'); return false;
    }
    return true;
  };

  const uploadPhoto = async () => {
    if (!photo) return existingPhoto; // keep existing if no new file
    const uploadUrl = await generateUploadUrl();
    const res = await fetch(uploadUrl, { method: 'POST', body: photo, headers: { 'Content-Type': photo.type } });
    const { storageId } = await res.json();
    return storageId;
  };

  const handleSave = async (publish = false) => {
    if (!validate()) return;
    if (saving) return;
    setSaving(true);

    try {
      const photoStorageId = await uploadPhoto();
      const priceInCents = Math.round(Number(monthlyPrice) * 100);

      if (isEdit) {
        await updateKafala({
          kafalaId: id,
          name,
          gender,
          age: Number(age),
          location,
          bio,
          photo: photoStorageId || undefined,
          monthlyPrice: priceInCents,
          ...(publish ? { status: 'active' } : {}),
        });
        showToast?.(publish ? 'تم نشر الكفالة' : 'تم حفظ التغييرات', 'success');
      } else {
        const adminId = adminUser?.userId || adminUser?.id;
        if (!adminId) throw new Error('لم يتم التعرف على الأدمن');
        await createKafala({
          adminId,
          name,
          gender,
          age: Number(age),
          location,
          bio,
          photo: photoStorageId || undefined,
          monthlyPrice: priceInCents,
        });
        if (publish) {
          // createKafala always creates as draft; publish separately after getting the ID
          // We handle this by navigating to admin list
          showToast?.('تم إنشاء الكفالة. انشرها من قائمة الكفالات', 'success');
        } else {
          showToast?.('تم حفظ الكفالة كمسودة', 'success');
        }
      }
      navigate('/admin/kafala');
    } catch (e) {
      showToast?.(e?.message || 'حدث خطأ أثناء الحفظ', 'error');
    } finally {
      setSaving(false);
    }
  };

  const currentPhotoUrl = photoPreview
    || (existingPhoto ? convexFileUrl(existingPhoto) : null);

  if (isEdit && existingKafala === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/admin/kafala')} className="text-text-secondary hover:text-primary">
          <span className="material-symbols-outlined text-2xl">arrow_forward</span>
        </button>
        <div>
          <h1 className="text-xl font-bold text-text-primary dark:text-white">
            {isEdit ? 'تعديل الكفالة' : 'إضافة يتيم جديد'}
          </h1>
          <p className="text-text-secondary text-sm">{isEdit ? 'تعديل ملف اليتيم' : 'إنشاء ملف كفالة جديد'}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Photo upload */}
        <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 shadow-sm border border-border-light dark:border-white/10">
          <h2 className="text-sm font-bold text-text-secondary mb-4 uppercase tracking-wide">صورة اليتيم (اختياري)</h2>
          <div className="flex items-center gap-5">
            <KafalaAvatar
              gender={gender}
              photoUrl={currentPhotoUrl}
              size={80}
              className="ring-2 ring-border-light dark:ring-white/20"
            />
            <div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-lg">upload</span>
                {currentPhotoUrl ? 'تغيير الصورة' : 'رفع صورة'}
              </button>
              <p className="text-xs text-text-muted mt-1">JPG، PNG — إذا لم ترفع صورة سيظهر رمز الجنس</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 shadow-sm border border-border-light dark:border-white/10 space-y-4">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wide">المعلومات الأساسية</h2>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">الاسم *</label>
            <input
              type="text"
              placeholder="اسم اليتيم"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-bg-light dark:bg-bg-dark text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-2">الجنس *</label>
            <div className="flex gap-4">
              {[
                { value: 'male', label: 'ذكر', icon: 'male' },
                { value: 'female', label: 'أنثى', icon: 'female' },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(g.value)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-semibold text-sm transition-all ${
                    gender === g.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border-light dark:border-white/20 text-text-secondary hover:border-primary/40'
                  }`}
                >
                  <span className="material-symbols-outlined">{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age + Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">العمر *</label>
              <input
                type="number"
                min="1"
                max="18"
                placeholder="مثال: 8"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-bg-light dark:bg-bg-dark text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1">المدينة *</label>
              <input
                type="text"
                placeholder="مثال: مراكش"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-bg-light dark:bg-bg-dark text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Monthly price */}
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1">الكفالة الشهرية (درهم) *</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="مثال: 300"
                value={monthlyPrice}
                onChange={e => setMonthlyPrice(e.target.value)}
                className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 pl-16 bg-bg-light dark:bg-bg-dark text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary"
                dir="ltr"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted text-sm font-medium">MAD</span>
            </div>
            <p className="text-xs text-text-muted mt-1">هذا المبلغ ثابت — لن يتمكن المتبرع من تغييره</p>
          </div>
        </div>

        {/* Bio (multilingual) */}
        <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 shadow-sm border border-border-light dark:border-white/10">
          <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4">قصة اليتيم *</h2>

          {/* Language tabs */}
          <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-white/10 p-1 rounded-xl w-fit">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setBioTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  bioTab === t ? 'bg-white dark:bg-bg-dark-card text-primary shadow-sm' : 'text-text-muted'
                }`}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          <textarea
            rows={5}
            placeholder={bioTab === 'ar' ? 'اكتب نبذة عن اليتيم وظروفه...' : bioTab === 'fr' ? 'Rédigez une description...' : 'Write a short description...'}
            value={bio[bioTab]}
            onChange={e => setBio(prev => ({ ...prev, [bioTab]: e.target.value }))}
            dir={bioTab === 'ar' ? 'rtl' : 'ltr'}
            className="w-full border border-border-light dark:border-white/20 rounded-xl px-4 py-3 bg-bg-light dark:bg-bg-dark text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary resize-none"
          />
          {bioTab === 'ar' && !bio.ar.trim() && (
            <p className="text-xs text-red-400 mt-1">النبذة بالعربية مطلوبة</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl border border-border-light dark:border-white/20 text-text-secondary font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition-colors"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-primary"
          >
            {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ ونشر' : 'إنشاء ونشر'}
          </button>
        </div>
      </div>
    </div>
  );
}
