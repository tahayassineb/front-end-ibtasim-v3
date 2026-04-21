import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';

// ============================================
// ADMIN DONATIONS — Table with pending highlight rows
// ============================================

const STATUS_CFG = {
  verified:              { label: '✓ مؤكد',    bg: '#D1FAE5', color: '#16a34a' },
  awaiting_verification: { label: '⏳ انتظار',  bg: '#FEF3C7', color: '#92400e' },
  awaiting_receipt:      { label: '⏳ انتظار',  bg: '#FEF3C7', color: '#92400e' },
  rejected:              { label: '✗ مرفوض',   bg: '#FEE2E2', color: '#dc2626' },
  pending:               { label: '⏳ انتظار',  bg: '#FEF3C7', color: '#92400e' },
};

const isPending = (status) =>
  status === 'awaiting_verification' || status === 'awaiting_receipt' || status === 'pending';

export default function AdminDonations() {
  const { currentLanguage } = useApp();
  const navigate = useNavigate();
  const lang = currentLanguage?.code || 'ar';

  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewingDonation, setViewingDonation] = useState(null);
  const [selectedIds, setSelectedIds]   = useState(new Set());
  const [isBulkLoading, setBulkLoading] = useState(false);
  const [currentPage, setCurrentPage]   = useState(1);
  const PER_PAGE = 10;

  // ── Convex ────────────────────────────────────────────────────────────────────
  const rawDonations   = useQuery(api.donations.getAllDonations, {});
  const dashboardStats = useQuery(api.admin.getDashboardStats);
  const verifyDonation = useMutation(api.donations.verifyDonation);
  const rejectDonation = useMutation(api.donations.rejectDonation);

  // ── Transform ─────────────────────────────────────────────────────────────────
  const donations = useMemo(() => {
    if (!rawDonations) return [];
    return rawDonations.map(d => ({
      id:           d._id,
      _id:          d._id,
      donor:        d.donorName || 'مجهول الهوية',
      phone:        d.donorPhone || '—',
      amount:       d.amount || 0,
      trxId:        `IB-${String(d._id).slice(-8).toUpperCase()}`,
      project:      (typeof d.projectTitle === 'string' ? d.projectTitle : d.projectTitle?.[lang] || d.projectTitle?.ar) || '—',
      method:       d.paymentMethod,
      status:       d.status || 'pending',
      receiptImage: d.receiptUrl || null,
      date:         d.createdAt ? new Date(d.createdAt).toISOString().split('T')[0] : '—',
    }));
  }, [rawDonations, lang]);

  const tabCounts = useMemo(() => ({
    all:       donations.length,
    pending:   donations.filter(d => isPending(d.status)).length,
    verified:  donations.filter(d => d.status === 'verified').length,
    rejected:  donations.filter(d => d.status === 'rejected').length,
  }), [donations]);

  const filtered = donations.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.donor.toLowerCase().includes(q) ||
                        d.trxId.toLowerCase().includes(q) ||
                        d.phone.includes(q);
    const matchStatus =
      statusFilter === 'all'     ? true :
      statusFilter === 'pending' ? isPending(d.status) :
      d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const page = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // ── Handlers ──────────────────────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleAll = () =>
    setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(d => d.id)));

  const handleBulkVerify = async () => {
    setBulkLoading(true);
    try { await Promise.all([...selectedIds].map(id => verifyDonation({ donationId: id, verified: true }))); setSelectedIds(new Set()); }
    finally { setBulkLoading(false); }
  };

  const handleBulkReject = async () => {
    setBulkLoading(true);
    try { await Promise.all([...selectedIds].map(id => rejectDonation({ donationId: id }))); setSelectedIds(new Set()); }
    finally { setBulkLoading(false); }
  };

  const kpis = [
    { num: (dashboardStats?.totalDonations || 0).toLocaleString(), label: 'إجمالي التبرعات', color: '#0A5F62' },
    { num: (dashboardStats?.verifiedDonations || tabCounts.verified).toLocaleString(), label: 'مؤكدة', color: '#16a34a' },
    { num: (dashboardStats?.pendingVerifications || tabCounts.pending).toLocaleString(), label: 'في انتظار التحقق', color: '#f59e0b' },
    { num: (dashboardStats?.rejectedDonations || tabCounts.rejected).toLocaleString(), label: 'مرفوضة', color: '#ef4444' },
  ];

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'Inter, sans-serif', color: k.color }}>{k.num}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E5E9EB', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          placeholder="ابحث بالاسم، رقم المرجع..."
          style={{ flex: 1, minWidth: 200, height: 38, padding: '0 16px', border: '1.5px solid #E5E9EB', borderRadius: 10, fontSize: 14, fontFamily: 'Tajawal, sans-serif', outline: 'none' }}
          onFocus={e => e.target.style.borderColor = '#0d7477'}
          onBlur={e => e.target.style.borderColor = '#E5E9EB'}
        />
        {[
          ['all',      'الكل'],
          ['verified', '✅ مؤكد'],
          ['pending',  `⏳ انتظار (${tabCounts.pending})`],
          ['rejected', '❌ مرفوض'],
        ].map(([val, label]) => (
          <button key={val} onClick={() => { setStatusFilter(val); setCurrentPage(1); }}
            style={{
              height: 34, padding: '0 14px', borderRadius: 100, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif',
              border: `1.5px solid ${statusFilter === val ? (val === 'pending' ? '#f59e0b' : '#0d7477') : '#E5E9EB'}`,
              background: statusFilter === val ? (val === 'pending' ? '#FEF3C7' : '#0d7477') : 'white',
              color: statusFilter === val ? (val === 'pending' ? '#92400e' : 'white') : '#64748b',
            }}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', overflow: 'hidden', marginBottom: 16 }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 100px', background: '#F0F7F7', borderBottom: '1px solid #E5E9EB' }}>
          <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
            <input type="checkbox" style={{ accentColor: '#0d7477' }}
              checked={filtered.length > 0 && selectedIds.size === filtered.length}
              onChange={toggleAll} />
          </div>
          {['المتبرع', 'المشروع', 'المبلغ', 'التاريخ', 'الحالة', 'إجراء'].map(h => (
            <div key={h} style={{ padding: '12px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{h}</div>
          ))}
        </div>

        {/* Rows */}
        {page.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
            <p>لا توجد تبرعات</p>
          </div>
        ) : page.map((d, i) => {
          const pend = isPending(d.status);
          const st = STATUS_CFG[d.status] || STATUS_CFG.pending;
          return (
            <div key={d._id}
              style={{
                display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 100px',
                borderBottom: i < page.length - 1 ? '1px solid #E5E9EB' : 'none',
                alignItems: 'center',
                borderRight: pend ? '4px solid #f59e0b' : 'none',
                background: pend ? '#FFFBEB' : (i % 2 === 1 ? '#fafbfc' : 'white'),
              }}>
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center' }}>
                <input type="checkbox" style={{ accentColor: '#0d7477' }}
                  checked={selectedIds.has(d.id)}
                  onChange={() => toggleSelect(d.id)} />
              </div>
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{d.donor}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>#{d.trxId}</div>
                </div>
              </div>
              <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>{d.project}</div>
              <div style={{ padding: '12px 14px', fontSize: 13, fontWeight: 800, color: d.status === 'rejected' ? '#ef4444' : '#0A5F62', fontFamily: 'Inter, sans-serif' }}>
                {(d.amount / 100).toLocaleString('fr-MA')} د.م
              </div>
              <div style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8', fontFamily: 'Inter, sans-serif' }}>{d.date}</div>
              <div style={{ padding: '12px 14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <button
                  onClick={() => setViewingDonation(d)}
                  style={{ height: 28, padding: '0 10px', borderRadius: 8, border: `1px solid ${pend ? '#0d7477' : '#E5E9EB'}`, color: pend ? '#0d7477' : '#64748b', background: 'white', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
                  {pend ? 'راجع' : 'عرض'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
        <span>عرض {filtered.length === 0 ? 0 : (currentPage - 1) * PER_PAGE + 1}–{Math.min(currentPage * PER_PAGE, filtered.length)} من {filtered.length} تبرع</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
            style={{ height: 32, padding: '0 12px', border: '1px solid #E5E9EB', borderRadius: 8, background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontSize: 13 }}>
            ‹ السابق
          </button>
          <button style={{ height: 32, padding: '0 12px', border: '1px solid #0d7477', borderRadius: 8, background: '#0d7477', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'default' }}>
            {currentPage}
          </button>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0}
            style={{ height: 32, padding: '0 12px', border: '1px solid #E5E9EB', borderRadius: 8, background: 'white', cursor: (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer', opacity: (currentPage === totalPages || totalPages === 0) ? 0.5 : 1, fontSize: 13 }}>
            التالي ›
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', background: '#0e1a1b', borderRadius: 16, boxShadow: '0 10px 15px rgba(0,0,0,.2)', border: '1px solid rgba(255,255,255,.1)', fontFamily: 'Tajawal, sans-serif' }}>
          <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}>{selectedIds.size} محدد</span>
          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.2)' }} />
          <button onClick={handleBulkVerify} disabled={isBulkLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 10, background: '#0d7477', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            ✓ تحقق من المحدد
          </button>
          <button onClick={handleBulkReject} disabled={isBulkLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 10, background: '#ef4444', color: 'white', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}>
            ✗ رفض المحدد
          </button>
          <button onClick={() => setSelectedIds(new Set())}
            style={{ color: 'rgba(255,255,255,.5)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Donation detail modal */}
      {viewingDonation && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 40px rgba(0,0,0,.2)', width: '100%', maxWidth: 480, overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} dir="rtl">
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E5E9EB' }}>
              <button onClick={() => setViewingDonation(null)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0F7F7', border: 'none', cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              <h2 style={{ fontSize: 16, fontWeight: 800 }}>تفاصيل التبرع</h2>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: (STATUS_CFG[viewingDonation.status] || STATUS_CFG.pending).bg, color: (STATUS_CFG[viewingDonation.status] || STATUS_CFG.pending).color }}>
                {(STATUS_CFG[viewingDonation.status] || STATUS_CFG.pending).label}
              </span>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {viewingDonation.receiptImage && (
                <img src={viewingDonation.receiptImage} alt="الوصل" style={{ width: '100%', borderRadius: 12, marginBottom: 16, objectFit: 'cover', maxHeight: 200 }} />
              )}

              {/* Amount */}
              <div style={{ textAlign: 'center', padding: '16px 0', background: '#F0F7F7', borderRadius: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>المبلغ</div>
                <div style={{ fontSize: 36, fontWeight: 900, color: '#0d7477', fontFamily: 'Inter, sans-serif' }}>
                  {(viewingDonation.amount / 100).toLocaleString('fr-MA')} <span style={{ fontSize: 18 }}>د.م</span>
                </div>
              </div>

              {/* Details grid */}
              {[
                ['المتبرع', viewingDonation.donor],
                ['رقم المرجع', `#${viewingDonation.trxId}`],
                ['المشروع', viewingDonation.project],
                ['التاريخ', viewingDonation.date],
                ['الهاتف', viewingDonation.phone],
                ['طريقة الدفع', viewingDonation.method === 'bank_transfer' ? 'تحويل بنكي' : viewingDonation.method === 'card_whop' ? 'بطاقة' : 'نقدي'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #E5E9EB', fontSize: 13 }}>
                  <span style={{ color: '#64748b' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid #E5E9EB' }}>
              <button onClick={() => setViewingDonation(null)}
                style={{ width: '100%', height: 44, background: '#F0F7F7', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', color: '#64748b', fontFamily: 'Tajawal, sans-serif' }}>
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}