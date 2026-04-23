import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { roleLabels } from '../../../lib/adminPermissions';

export default function AdminTeamPerformance() {
  const { user } = useApp();
  const rows = useQuery(api.activities.getTeamPerformance, user?.id ? { adminId: user.id } : 'skip');

  return (
    <div style={{ padding: 24, fontFamily: 'var(--font-arabic)' }} dir="rtl">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>أداء الفريق</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>مؤشرات عملية مبنية على سجل النشاط.</p>
      </div>

      <div style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 16, overflowX: 'auto' }}>
        {rows === undefined ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 880 }}>
            <thead>
              <tr style={{ background: '#F8FAFA', color: '#64748b', fontSize: 12 }}>
                {['العضو', 'الدور', 'الحالة', 'التحققات', 'المشاريع', 'القصص', 'الكفالة', 'تصدير الوصولات', 'آخر نشاط'].map((h) => (
                  <th key={h} style={{ textAlign: 'right', padding: 14, fontWeight: 900 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.adminId} style={{ borderTop: '1px solid #E5E9EB' }}>
                  <td style={td}><strong>{row.fullName}</strong><div style={{ color: '#94a3b8', fontSize: 12 }}>{row.email}</div></td>
                  <td style={td}>{roleLabels[row.role] || row.role}</td>
                  <td style={td}>{row.isActive ? 'نشط' : 'معطل'}</td>
                  <td style={td}>{row.verifications}</td>
                  <td style={td}>{row.projects}</td>
                  <td style={td}>{row.stories}</td>
                  <td style={td}>{row.kafala}</td>
                  <td style={td}>{row.receiptExports}</td>
                  <td style={td}>{row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleDateString('ar-MA') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const td = { padding: 14, fontSize: 14, verticalAlign: 'middle' };

