import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import JSZip from 'jszip';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { can } from '../../../lib/adminPermissions';

const statusLabels = {
  awaiting_receipt: 'بانتظار الوصل',
  awaiting_verification: 'بانتظار التحقق',
  verified: 'مقبول',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  pending: 'قيد الانتظار',
};

export default function AdminReceipts() {
  const { user } = useApp();
  const [filters, setFilters] = useState({ type: '', status: '', search: '' });
  const [selected, setSelected] = useState({});
  const [exporting, setExporting] = useState(false);
  const logExport = useMutation(api.receipts.logExport);
  const data = useQuery(api.receipts.list, user?.id ? {
    adminId: user.id,
    type: filters.type || undefined,
    status: filters.status || undefined,
    search: filters.search || undefined,
    limit: 250,
  } : 'skip');
  const rows = useMemo(() => data?.rows || [], [data?.rows]);
  const selectedRows = useMemo(() => rows.filter((r) => selected[r.id]), [rows, selected]);
  const canExport = can(user?.role, 'receipts:export');

  const csvFor = (items) => {
    const headers = ['Date', 'Donor Name', 'Donor Phone', 'Amount MAD', 'Type', 'Project/Kafala', 'Payment Method', 'Status', 'Verified Date', 'Transaction Reference', 'Bank Name', 'Receipt URL'];
    const body = items.map((r) => [
      new Date(r.createdAt).toISOString(),
      r.donorName,
      r.donorPhone,
      (r.amount / 100).toFixed(2),
      r.type,
      r.entityTitle,
      r.paymentMethod,
      r.status,
      r.verifiedAt ? new Date(r.verifiedAt).toISOString() : '',
      r.transactionReference || '',
      r.bankName || '',
      r.receiptUrl || '',
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','));
    return [headers.join(','), ...body].join('\n');
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const exportCsv = async (items) => {
    await logExport({ adminId: user.id, count: items.length, exportType: 'csv', filters });
    downloadBlob(new Blob([csvFor(items)], { type: 'text/csv;charset=utf-8' }), 'receipts.csv');
  };

  const exportPackage = async (items) => {
    setExporting(true);
    try {
      const zip = new JSZip();
      zip.file('receipts.csv', csvFor(items));
      for (const r of items.filter((item) => item.receiptUrl)) {
        try {
          const res = await fetch(r.receiptUrl);
          const blob = await res.blob();
          const safeName = `${r.type}-${r.id}.jpg`;
          zip.file(`receipts/${safeName}`, blob);
        } catch {
          zip.file(`missing/${r.id}.txt`, r.receiptUrl || 'missing receipt');
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      await logExport({ adminId: user.id, count: items.length, exportType: 'package', filters });
      downloadBlob(blob, 'accounting-receipts.zip');
    } finally {
      setExporting(false);
    }
  };

  const targetRows = selectedRows.length ? selectedRows : rows;

  return (
    <div style={{ padding: 24, fontFamily: 'var(--font-arabic)' }} dir="rtl">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>مركز الوصولات</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b' }}>تجميع وتصدير وصولات التبرعات والكفالات للمحاسبة.</p>
        </div>
        {canExport && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => exportCsv(targetRows)} style={buttonStyle}>CSV</button>
            <button onClick={() => exportPackage(targetRows)} disabled={exporting} style={{ ...buttonStyle, background: '#0d7477', color: 'white' }}>{exporting ? '...' : 'حزمة المحاسبة'}</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
        <Stat label="عدد الوصولات" value={data?.totals?.count ?? 0} />
        <Stat label="المبلغ" value={`${((data?.totals?.amount ?? 0) / 100).toFixed(0)} د.م`} />
        <Stat label="بدون وصل" value={data?.totals?.missingReceipts ?? 0} />
      </div>

      <div style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 14, padding: 14, display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))} style={filterStyle}>
          <option value="">كل الأنواع</option>
          <option value="donation">تبرعات المشاريع</option>
          <option value="kafala">الكفالة</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} style={filterStyle}>
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="بحث باسم المتبرع أو الهاتف" style={{ ...filterStyle, flex: 1 }} />
      </div>

      <div style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 16, overflowX: 'auto' }}>
        {data === undefined ? <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div> : (
          <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFA', color: '#64748b', fontSize: 12 }}>
                {['', 'المتبرع', 'النوع', 'المشروع/الكفالة', 'المبلغ', 'الحالة', 'الوصل', 'التاريخ'].map((h) => <th key={h} style={{ textAlign: 'right', padding: 12 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: '1px solid #E5E9EB' }}>
                  <td style={td}><input type="checkbox" checked={!!selected[r.id]} onChange={(e) => setSelected((s) => ({ ...s, [r.id]: e.target.checked }))} /></td>
                  <td style={td}><strong>{r.donorName}</strong><div style={{ color: '#94a3b8', fontSize: 12 }}>{r.donorPhone}</div></td>
                  <td style={td}>{r.type === 'kafala' ? 'كفالة' : 'تبرع'}</td>
                  <td style={td}>{r.entityTitle}</td>
                  <td style={td}>{(r.amount / 100).toFixed(0)} د.م</td>
                  <td style={td}>{statusLabels[r.status] || r.status}</td>
                  <td style={td}>{r.receiptUrl ? <a href={r.receiptUrl} target="_blank" rel="noreferrer" style={{ color: '#0d7477', fontWeight: 800 }}>عرض</a> : <span style={{ color: '#ef4444' }}>مفقود</span>}</td>
                  <td style={td}>{new Date(r.createdAt).toLocaleDateString('ar-MA')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return <div style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 14, padding: 16 }}><div style={{ color: '#64748b', fontSize: 12 }}>{label}</div><div style={{ fontSize: 24, fontWeight: 900, marginTop: 4 }}>{value}</div></div>;
}

const filterStyle = { height: 40, border: '1px solid #E5E9EB', borderRadius: 10, background: '#fff', padding: '0 12px', fontFamily: 'var(--font-arabic)' };
const buttonStyle = { height: 40, border: '1px solid #E5E9EB', borderRadius: 10, background: 'white', padding: '0 14px', fontFamily: 'var(--font-arabic)', cursor: 'pointer', fontWeight: 800 };
const td = { padding: 12, fontSize: 14, verticalAlign: 'middle' };
