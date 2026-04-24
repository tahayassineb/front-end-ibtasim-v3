import React, { useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';
import {
  getDonationReference,
  getInclusiveDateRange,
  getPaymentMethodLabel,
  isHiddenLegacyDonation,
  isCardPayment,
  matchesInclusiveDateRange,
  requiresReceipt,
} from '../../../../lib/donationUi';

const STATUS_CFG = {
  verified: { label: '✓ مؤكد', bg: '#D1FAE5', color: '#16a34a' },
  completed: { label: '✓ مكتمل', bg: '#D1FAE5', color: '#16a34a' },
  awaiting_verification: { label: '⏳ انتظار', bg: '#FEF3C7', color: '#92400e' },
  awaiting_receipt: { label: '⏳ انتظار', bg: '#FEF3C7', color: '#92400e' },
  rejected: { label: '✕ مرفوض', bg: '#FEE2E2', color: '#dc2626' },
  pending: { label: '⏳ انتظار', bg: '#FEF3C7', color: '#92400e' },
  cancelled: { label: '✕ ملغي', bg: '#F3F4F6', color: '#6B7280' },
  failed: { label: '✕ فشل', bg: '#FEE2E2', color: '#dc2626' },
};

const isPending = (status) =>
  status === 'awaiting_verification' || status === 'awaiting_receipt' || status === 'pending';

const getStatusConfig = (donation) => {
  if (!isCardPayment(donation.method)) return STATUS_CFG[donation.status] || STATUS_CFG.pending;
  if (donation.status === 'verified' || donation.status === 'completed') {
    return { label: '✓ مدفوع بالبطاقة', bg: '#D1FAE5', color: '#16a34a' };
  }
  if (donation.status === 'rejected' || donation.status === 'failed') {
    return STATUS_CFG.rejected;
  }
  if (donation.status === 'cancelled') {
    return STATUS_CFG.cancelled;
  }
  return { label: '⏳ معالجة البطاقة', bg: '#DBEAFE', color: '#1d4ed8' };
};

export default function AdminDonations() {
  const { currentLanguage, user, showToast } = useApp();
  const lang = currentLanguage?.code || 'ar';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilters, setDateFilters] = useState({ startDate: '', endDate: '' });
  const [viewingDonation, setViewingDonation] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isBulkLoading, setBulkLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 10;

  const dateRange = useMemo(() => getInclusiveDateRange(dateFilters), [dateFilters]);
  const rawDonations = useQuery(api.donations.getAllDonations, {
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  });
  const dashboardStats = useQuery(api.admin.getDashboardStats);
  const verifyDonation = useMutation(api.donations.verifyDonation);
  const rejectDonation = useMutation(api.donations.rejectDonation);

  const donations = useMemo(() => {
    if (!rawDonations) return [];
    return rawDonations
      .filter((donation) => !isHiddenLegacyDonation(donation))
      .map((donation) => {
      const reference = getDonationReference(donation);
      return {
        id: donation._id,
        _id: donation._id,
        donor: donation.donorName || 'مجهول الهوية',
        phone: donation.donorPhone || '—',
        amount: donation.amount || 0,
        referenceLabel: reference.label,
        referenceShortLabel: reference.shortLabel,
        referenceValue: reference.value,
        project: (typeof donation.projectTitle === 'string'
          ? donation.projectTitle
          : donation.projectTitle?.[lang] || donation.projectTitle?.ar) || '—',
        method: donation.paymentMethod,
        methodLabel: getPaymentMethodLabel(donation.paymentMethod),
        status: donation.status || 'pending',
        receiptImage: donation.receiptUrl || null,
        receiptRequired: requiresReceipt(donation.paymentMethod),
        createdAtTs: donation.createdAt ?? donation._creationTime ?? null,
        date: donation.createdAt ? new Date(donation.createdAt).toISOString().split('T')[0] : '—',
      };
      });
  }, [rawDonations, lang]);

  const tabCounts = useMemo(() => ({
    all: donations.length,
    pending: donations.filter((donation) => isPending(donation.status)).length,
    verified: donations.filter((donation) => donation.status === 'verified' || donation.status === 'completed').length,
    rejected: donations.filter((donation) => donation.status === 'rejected' || donation.status === 'failed').length,
  }), [donations]);

  const filtered = useMemo(() => donations.filter((donation) => {
    const query = search.toLowerCase().trim();
    const matchesSearch = !query
      || donation.donor.toLowerCase().includes(query)
      || String(donation.referenceValue || '').toLowerCase().includes(query)
      || donation.phone.includes(query);
    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'pending'
        ? isPending(donation.status)
        : statusFilter === 'verified'
          ? donation.status === 'verified' || donation.status === 'completed'
          : statusFilter === 'rejected'
            ? donation.status === 'rejected' || donation.status === 'failed'
            : donation.status === statusFilter;
    const hasDateFilter = dateRange.startDate != null || dateRange.endDate != null;
    const matchesDate = !hasDateFilter || matchesInclusiveDateRange(donation.createdAtTs, dateRange);
    return matchesSearch && matchesStatus && matchesDate;
  }), [donations, search, statusFilter, dateRange]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const page = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const toggleSelect = (id) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleAll = () =>
    setSelectedIds((prev) => prev.size === filtered.length ? new Set() : new Set(filtered.map((donation) => donation.id)));

  const handleBulkVerify = async () => {
    if (!user?.id) {
      showToast('تعذر تحديد المشرف الحالي', 'error');
      return;
    }
    const eligibleIds = [...selectedIds].filter((id) =>
      donations.some((donation) => donation.id === id && donation.status === 'awaiting_verification')
    );
    if (!eligibleIds.length) {
      showToast('اختر تبرعات بانتظار التحقق فقط', 'error');
      return;
    }
    setBulkLoading(true);
    try {
      await Promise.all(eligibleIds.map((id) => verifyDonation({ donationId: id, adminId: user.id, verified: true })));
      setSelectedIds(new Set());
      showToast('تم التحقق من التبرعات المحددة', 'success');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (!user?.id) {
      showToast('تعذر تحديد المشرف الحالي', 'error');
      return;
    }
    const eligibleIds = [...selectedIds].filter((id) =>
      donations.some((donation) => donation.id === id && donation.status === 'awaiting_verification')
    );
    if (!eligibleIds.length) {
      showToast('اختر تبرعات بانتظار التحقق فقط', 'error');
      return;
    }
    setBulkLoading(true);
    try {
      await Promise.all(eligibleIds.map((id) => rejectDonation({ donationId: id, adminId: user.id })));
      setSelectedIds(new Set());
      showToast('تم رفض التبرعات المحددة', 'success');
    } finally {
      setBulkLoading(false);
    }
  };

  const kpis = [
    { num: (dashboardStats?.totalDonations || 0).toLocaleString(), label: 'إجمالي التبرعات', color: '#0A5F62' },
    { num: (dashboardStats?.verifiedDonations || tabCounts.verified).toLocaleString(), label: 'مؤكدة', color: '#16a34a' },
    { num: (dashboardStats?.pendingVerifications || tabCounts.pending).toLocaleString(), label: 'في انتظار التحقق', color: '#f59e0b' },
    { num: (dashboardStats?.rejectedDonations || tabCounts.rejected).toLocaleString(), label: 'مرفوضة', color: '#ef4444' },
  ];

  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: '#0e1a1b', padding: 24 }} dir="rtl">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {kpis.map((kpi, index) => (
          <div key={index} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Inter, sans-serif', color: kpi.color }}>{kpi.num}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E9EB', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
          placeholder="ابحث بالاسم، المرجع، الهاتف..."
          style={{ flex: 1, minWidth: 200, height: 38, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-arabic)', outline: 'none' }}
          onFocus={(event) => { event.target.style.borderColor = '#0d7477'; }}
          onBlur={(event) => { event.target.style.borderColor = '#E5E9EB'; }}
        />
        <input
          type="date"
          value={dateFilters.startDate}
          onChange={(event) => {
            setDateFilters((prev) => ({ ...prev, startDate: event.target.value }));
            setCurrentPage(1);
          }}
          style={{ height: 38, padding: '0 12px', border: '1.5px solid #E5E9EB', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-arabic)', outline: 'none' }}
        />
        <input
          type="date"
          value={dateFilters.endDate}
          onChange={(event) => {
            setDateFilters((prev) => ({ ...prev, endDate: event.target.value }));
            setCurrentPage(1);
          }}
          style={{ height: 38, padding: '0 12px', border: '1.5px solid #E5E9EB', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-arabic)', outline: 'none' }}
        />
        {(dateFilters.startDate || dateFilters.endDate) && (
          <button
            onClick={() => {
              setDateFilters({ startDate: '', endDate: '' });
              setCurrentPage(1);
            }}
            style={{ height: 34, padding: '0 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-arabic)', border: '1.5px solid #E5E9EB', background: 'white', color: '#64748b' }}
          >
            مسح التاريخ
          </button>
        )}
        {[
          ['all', 'الكل'],
          ['verified', '✅ مؤكد'],
          ['pending', `⏳ انتظار (${tabCounts.pending})`],
          ['rejected', '❌ مرفوض'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => { setStatusFilter(value); setCurrentPage(1); }}
            style={{
              height: 34,
              padding: '0 14px',
              borderRadius: 100,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-arabic)',
              border: `1.5px solid ${statusFilter === value ? (value === 'pending' ? '#f59e0b' : '#0d7477') : '#E5E9EB'}`,
              background: statusFilter === value ? (value === 'pending' ? '#FEF3C7' : '#0d7477') : 'white',
              color: statusFilter === value ? (value === 'pending' ? '#92400e' : 'white') : '#64748b',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 100px', background: '#F0F7F7', borderBottom: '1px solid #E5E9EB' }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
            <input
              type="checkbox"
              style={{ accentColor: '#0d7477' }}
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={toggleAll}
            />
          </div>
          {['المتبرع', 'المشروع', 'المبلغ', 'التاريخ', 'الحالة', 'إجراء'].map((header) => (
            <div key={header} style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{header}</div>
          ))}
        </div>

        {page.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
            <p>لا توجد تبرعات</p>
          </div>
        ) : page.map((donation, index) => {
          const pending = isPending(donation.status);
          const statusConfig = getStatusConfig(donation);
          return (
            <div
              key={donation._id}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 100px',
                borderBottom: index < page.length - 1 ? '1px solid #E5E9EB' : 'none',
                alignItems: 'center',
                borderRight: pending ? '4px solid #f59e0b' : 'none',
                background: pending ? '#FFFBEB' : (index % 2 === 1 ? '#fafbfc' : 'white'),
              }}
            >
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  style={{ accentColor: '#0d7477' }}
                  checked={selectedIds.has(donation.id)}
                  onChange={() => toggleSelect(donation.id)}
                />
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{donation.donor}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{donation.referenceShortLabel}: {donation.referenceValue}</div>
                </div>
              </div>
              <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{donation.project}</div>
              <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: donation.status === 'rejected' ? '#ef4444' : '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                {Number(donation.amount || 0).toLocaleString('fr-MA')} د.م
              </div>
              <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{donation.date}</div>
              <div style={{ padding: '12px 14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: statusConfig.bg, color: statusConfig.color }}>
                  {statusConfig.label}
                </span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <button
                  onClick={() => setViewingDonation(donation)}
                  style={{ height: 28, padding: '0 10px', borderRadius: 8, border: `1px solid ${pending ? '#0d7477' : '#E5E9EB'}`, color: pending ? '#0d7477' : '#64748b', background: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}
                >
                  {pending ? 'راجع' : 'عرض'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
        <span>عرض {filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} من {filtered.length} تبرع</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setCurrentPage((pageNumber) => Math.max(1, pageNumber - 1))}
            disabled={currentPage === 1}
            style={{ height: 32, padding: '0 12px', border: '1px solid #E5E9EB', borderRadius: 8, background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontSize: 13 }}
          >
            ‹ السابق
          </button>
          <button style={{ height: 32, padding: '0 12px', border: '1px solid #0d7477', borderRadius: 8, background: '#0d7477', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'default' }}>
            {currentPage}
          </button>
          <button
            onClick={() => setCurrentPage((pageNumber) => Math.min(totalPages, pageNumber + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            style={{ height: 32, padding: '0 12px', border: '1px solid #E5E9EB', borderRadius: 8, background: 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1, fontSize: 13 }}
          >
            التالي ›
          </button>
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: '#0e1a1b', borderRadius: 16, boxShadow: '0 10px 15px rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.1)', fontFamily: 'var(--font-arabic)' }}>
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>{selectedIds.size} محدد</span>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.2)' }} />
          <button
            onClick={handleBulkVerify}
            disabled={isBulkLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 10, background: '#0d7477', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}
          >
            ✓ تحقق من المحدد
          </button>
          <button
            onClick={handleBulkReject}
            disabled={isBulkLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 10, background: '#ef4444', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-arabic)' }}
          >
            ✕ رفض المحدد
          </button>
          <button onClick={() => setSelectedIds(new Set())} style={{ color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}

      {viewingDonation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,.2)', width: '100%', maxWidth: 480, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} dir="rtl">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E9EB' }}>
              <button
                onClick={() => setViewingDonation(null)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F7F7', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ×
              </button>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>تفاصيل التبرع</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: getStatusConfig(viewingDonation).bg, color: getStatusConfig(viewingDonation).color }}>
                {getStatusConfig(viewingDonation).label}
              </span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {viewingDonation.receiptImage && (
                <img src={viewingDonation.receiptImage} alt="الوصل" style={{ width: '100%', borderRadius: 12, marginBottom: 16, objectFit: 'cover', maxHeight: 200 }} />
              )}

              {!viewingDonation.receiptRequired && !viewingDonation.receiptImage && (
                <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 12, background: '#F0F7F7', color: '#0d7477', fontSize: 13, fontWeight: 700 }}>
                  هذا الدفع بالبطاقة ولا يحتاج إلى وصل يدوي.
                </div>
              )}

              <div style={{ textAlign: 'center', padding: '16px 0', background: '#F0F7F7', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>المبلغ</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#0d7477', fontFamily: 'Inter, sans-serif' }}>
                  {Number(viewingDonation.amount || 0).toLocaleString('fr-MA')} <span style={{ fontSize: 18 }}>د.م</span>
                </div>
              </div>

              {[
                ['المتبرع', viewingDonation.donor],
                [viewingDonation.referenceLabel, viewingDonation.referenceValue],
                ['المشروع', viewingDonation.project],
                ['التاريخ', viewingDonation.date],
                ['الهاتف', viewingDonation.phone],
                ['طريقة الدفع', viewingDonation.methodLabel],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E5E9EB', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E9EB' }}>
              <button
                onClick={() => setViewingDonation(null)}
                style={{ width: '100%', height: 44, background: '#F0F7F7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b', fontFamily: 'var(--font-arabic)' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
