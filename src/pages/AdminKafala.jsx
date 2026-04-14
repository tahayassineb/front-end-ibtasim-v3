import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import KafalaAvatar from '../components/kafala/KafalaAvatar';

// ============================================
// ADMIN KAFALA PAGE — Manage orphan sponsorship profiles
// ============================================

const STATUS_COLORS = {
  draft:     'bg-gray-100 text-gray-600',
  active:    'bg-emerald-100 text-emerald-700',
  sponsored: 'bg-blue-100 text-blue-700',
  inactive:  'bg-red-100 text-red-600',
};

const STATUS_LABELS = {
  ar:    { draft: 'مسودة', active: 'متاح', sponsored: 'مكفول', inactive: 'غير نشط' },
  fr:    { draft: 'Brouillon', active: 'Disponible', sponsored: 'Parrainé', inactive: 'Inactif' },
  en:    { draft: 'Draft', active: 'Active', sponsored: 'Sponsored', inactive: 'Inactive' },
};

export default function AdminKafala() {
  const navigate = useNavigate();
  const { showToast, user: adminUser } = useApp();
  const lang = 'ar'; // Admin UI is Arabic

  const kafalaList = useQuery(api.kafala.getKafalaList, {});
  const deleteMutation = useMutation(api.kafala.deleteKafala);
  const publishMutation = useMutation(api.kafala.publishKafala);
  const resetMutation = useMutation(api.kafala.resetKafala);

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = (kafalaList || []).filter((k) => {
    if (statusFilter !== 'all' && k.status !== statusFilter) return false;
    if (search && !k.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async (kafalaId) => {
    try {
      await deleteMutation({ kafalaId });
      showToast?.('تم حذف الكفالة', 'success');
    } catch (e) {
      showToast?.(e?.message || 'حدث خطأ', 'error');
    }
    setDeleteConfirm(null);
  };

  const handlePublish = async (kafalaId) => {
    try {
      await publishMutation({ kafalaId });
      showToast?.('تم نشر الكفالة', 'success');
    } catch (e) {
      showToast?.(e?.message || 'حدث خطأ', 'error');
    }
  };

  const handleReset = async (kafalaId) => {
    try {
      await resetMutation({ kafalaId });
      showToast?.('تم إعادة فتح كفالة اليتيم', 'success');
    } catch (e) {
      showToast?.(e?.message || 'حدث خطأ', 'error');
    }
    setResetConfirm(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-white">إدارة الكفالات</h1>
          <p className="text-text-secondary text-sm mt-1">{kafalaList?.length ?? '—'} كفالة إجمالاً</p>
        </div>
        <Link
          to="/admin/kafala/new"
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors text-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          إضافة يتيم جديد
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="بحث بالاسم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-border-light dark:border-white/20 rounded-xl px-4 py-2 bg-white dark:bg-bg-dark-card text-text-primary dark:text-white placeholder:text-text-muted focus:outline-none focus:border-primary text-sm"
        />
        <div className="flex gap-2">
          {['all', 'draft', 'active', 'sponsored', 'inactive'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statusFilter === s ? 'bg-primary text-white' : 'bg-white dark:bg-bg-dark-card text-text-secondary border border-border-light dark:border-white/10 hover:border-primary/30'
              }`}
            >
              {s === 'all' ? 'الكل' : STATUS_LABELS.ar[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {kafalaList === undefined && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      )}

      {/* Empty */}
      {kafalaList !== undefined && filtered.length === 0 && (
        <div className="text-center py-20 text-text-muted">
          <span className="material-symbols-outlined text-5xl mb-4 block opacity-30">child_care</span>
          <p>لا توجد كفالات تطابق البحث</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((kafala) => {
          const photoUrl = kafala.photo ? (convexFileUrl(kafala.photo) || kafala.photo) : null;
          const nextRenewal = kafala.sponsorship?.nextRenewalDate
            ? new Date(kafala.sponsorship.nextRenewalDate).toLocaleDateString('ar-MA')
            : null;

          return (
            <div
              key={kafala._id}
              className="bg-white dark:bg-bg-dark-card rounded-2xl shadow-card border border-border-light dark:border-white/10 overflow-hidden"
            >
              {/* Top */}
              <div className="p-5 flex items-center gap-4">
                <KafalaAvatar
                  gender={kafala.gender}
                  photo={kafala.photo}
                  photoUrl={photoUrl}
                  size={56}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-text-primary dark:text-white truncate">{kafala.name}</h3>
                  <p className="text-text-secondary text-xs">{kafala.age} سنة — {kafala.location}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${STATUS_COLORS[kafala.status]}`}>
                  {STATUS_LABELS.ar[kafala.status]}
                </span>
              </div>

              {/* Info row */}
              <div className="px-5 pb-3 flex items-center justify-between text-sm border-b border-border-light dark:border-white/10">
                <span className="text-text-muted">الكفالة الشهرية</span>
                <span className="font-bold text-primary">{(kafala.monthlyPrice / 100).toLocaleString('fr-MA')} MAD</span>
              </div>

              {/* Renewal info (if sponsored) */}
              {kafala.status === 'sponsored' && nextRenewal && (
                <div className="px-5 py-2 bg-blue-50 dark:bg-blue-900/10 text-xs text-blue-600 dark:text-blue-300 border-b border-border-light dark:border-white/10">
                  <span className="material-symbols-outlined text-sm align-text-bottom ml-1">calendar_month</span>
                  التجديد القادم: {nextRenewal}
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/admin/kafala/${kafala._id}/edit`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-text-secondary hover:text-primary rounded-lg text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  تعديل
                </button>

                {kafala.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(kafala._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">publish</span>
                    نشر
                  </button>
                )}

                {kafala.status === 'sponsored' && (
                  <button
                    onClick={() => setResetConfirm(kafala._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">lock_open</span>
                    إعادة فتح
                  </button>
                )}

                <button
                  onClick={() => setDeleteConfirm(kafala._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  حذف
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirm modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 max-w-sm w-full shadow-xl" dir="rtl">
            <span className="material-symbols-outlined text-red-500 text-4xl mb-3 block">warning</span>
            <h3 className="font-bold text-text-primary dark:text-white mb-2">تأكيد الحذف</h3>
            <p className="text-text-secondary text-sm mb-5">سيتم حذف الكفالة وجميع بياناتها نهائياً. هل أنت متأكد؟</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border-light dark:border-white/20 text-text-secondary font-semibold text-sm">
                إلغاء
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm">
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirm modal */}
      {resetConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-bg-dark-card rounded-2xl p-6 max-w-sm w-full shadow-xl" dir="rtl">
            <span className="material-symbols-outlined text-amber-500 text-4xl mb-3 block">lock_open</span>
            <h3 className="font-bold text-text-primary dark:text-white mb-2">إعادة فتح الكفالة</h3>
            <p className="text-text-secondary text-sm mb-5">سيتم إنهاء الاشتراك الحالي وإعادة فتح الكفالة للتبرع. هل تريد المتابعة؟</p>
            <div className="flex gap-3">
              <button onClick={() => setResetConfirm(null)} className="flex-1 py-2.5 rounded-xl border border-border-light dark:border-white/20 text-text-secondary font-semibold text-sm">
                إلغاء
              </button>
              <button onClick={() => handleReset(resetConfirm)} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold text-sm">
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
