import React, { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';

const actionLabels = {
  'admin.invitation_created': 'دعوة عضو',
  'admin.invitation_cancelled': 'إلغاء دعوة',
  'admin.role_changed': 'تغيير دور',
  'admin.deactivated': 'تعطيل عضو',
  'admin.reactivated': 'تفعيل عضو',
  'verification.donation_approved': 'قبول تبرع',
  'verification.donation_rejected': 'رفض تبرع',
  'verification.kafala_approved': 'قبول كفالة',
  'verification.kafala_rejected': 'رفض كفالة',
  'receipt.export': 'تصدير وصولات',
};

export default function AdminActivity() {
  const { user } = useApp();
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const activities = useQuery(api.activities.list, user?.id ? {
    adminId: user.id,
    action: action || undefined,
    entityType: entityType || undefined,
    limit: 100,
  } : 'skip');

  return (
    <div style={{ padding: 24, fontFamily: 'var(--font-arabic)' }} dir="rtl">
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900 }}>سجل النشاط</h2>
        <p style={{ margin: '6px 0 0', color: '#64748b' }}>كل العمليات المهمة داخل لوحة الإدارة.</p>
      </div>

      <div style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 14, padding: 14, display: 'flex', gap: 12, marginBottom: 16 }}>
        <select value={action} onChange={(e) => setAction(e.target.value)} style={filterStyle}>
          <option value="">كل العمليات</option>
          {Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={filterStyle}>
          <option value="">كل الأنواع</option>
          {['admin', 'donation', 'kafalaDonation', 'project', 'story', 'kafala', 'receipt'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div style={{ background: 'white', border: '1px solid #E5E9EB', borderRadius: 16, overflow: 'hidden' }}>
        {activities === undefined ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</div>
        ) : activities.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>لا يوجد نشاط مطابق</div>
        ) : activities.map((row, index) => (
          <div key={row._id} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 160px', gap: 12, padding: 16, borderBottom: index < activities.length - 1 ? '1px solid #E5E9EB' : 'none', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 900 }}>{actionLabels[row.action] || row.action}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>{row.entityType} · {row.entityId}</div>
            </div>
            <div style={{ color: '#0d7477', fontWeight: 800 }}>{row.actorName}</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>{new Date(row.createdAt).toLocaleString('ar-MA')}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const filterStyle = {
  height: 40,
  border: '1px solid #E5E9EB',
  borderRadius: 10,
  background: '#fff',
  padding: '0 12px',
  fontFamily: 'var(--font-arabic)',
};

