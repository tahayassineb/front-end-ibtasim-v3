import React, { useMemo, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useApp } from '../../../../context/AppContext';

const BORDER = '#E5E9EB';
const PRIMARY = '#0d7477';
const TEXT = '#0e1a1b';
const MUTED = '#64748b';
const SHADOW = '0 2px 4px rgba(0,0,0,.03), 0 4px 6px rgba(0,0,0,.05)';

const statusMeta = {
  all: { label: 'الكل', color: PRIMARY },
  new: { label: 'جديد', color: '#dc2626' },
  read: { label: 'تمت القراءة', color: MUTED },
  replied: { label: 'تم التواصل', color: '#16a34a' },
};

export default function AdminContacts() {
  const { showToast } = useApp();
  const [filter, setFilter] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const stats = useQuery(api.contact.getContactStats, {});
  const messages = useQuery(api.contact.getContactMessages, filter === 'all' ? { limit: 100 } : { status: filter, limit: 100 });
  const updateStatus = useMutation(api.contact.updateContactStatus);

  const selected = useMemo(() => (messages || []).find((m) => m._id === selectedId) || (messages || [])[0], [messages, selectedId]);

  const handleStatus = async (messageId, status) => {
    try {
      await updateStatus({ messageId, status });
      showToast?.('تم تحديث حالة الرسالة', 'success');
    } catch (error) {
      showToast?.(error?.message || 'فشل تحديث الرسالة', 'error');
    }
  };

  if (stats === undefined || messages === undefined) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8', fontFamily: 'Tajawal, sans-serif' }}>جاري تحميل الرسائل...</div>;
  }

  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: TEXT, padding: 24 }} dir="rtl">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 20 }}>
        {[
          { key: 'new', value: stats.new, label: 'رسائل جديدة' },
          { key: 'read', value: stats.read, label: 'تمت قراءتها' },
          { key: 'replied', value: stats.replied, label: 'تم التواصل' },
          { key: 'all', value: stats.total, label: 'إجمالي الرسائل' },
        ].map((card) => (
          <div key={card.key} style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: SHADOW, padding: 18 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: statusMeta[card.key].color, fontFamily: 'Inter, sans-serif' }}>{card.value}</div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: SHADOW, padding: 14, display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {Object.entries(statusMeta).map(([key, meta]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setFilter(key); setSelectedId(null); }}
            style={{ height: 34, padding: '0 14px', borderRadius: 100, border: `1.5px solid ${filter === key ? meta.color : BORDER}`, background: filter === key ? meta.color : 'white', color: filter === key ? 'white' : MUTED, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 700 }}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,420px) minmax(0,1fr)', gap: 18 }}>
        <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: SHADOW, overflow: 'hidden' }}>
          {messages.length === 0 ? (
            <div style={{ padding: 36, textAlign: 'center', color: '#94a3b8' }}>لا توجد رسائل</div>
          ) : messages.map((message) => {
            const active = selected?._id === message._id;
            return (
              <button
                key={message._id}
                type="button"
                onClick={() => setSelectedId(message._id)}
                style={{ width: '100%', textAlign: 'right', padding: 16, border: 'none', borderBottom: `1px solid ${BORDER}`, background: active ? '#E6F4F4' : 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: TEXT }}>{message.name}</div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: statusMeta[message.status].color }}>{statusMeta[message.status].label}</span>
                </div>
                <div style={{ fontSize: 12, color: MUTED, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{message.subject || message.message}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{new Date(message.createdAt).toLocaleString('fr-MA')}</div>
              </button>
            );
          })}
        </div>

        <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: SHADOW, padding: 22, minHeight: 360 }}>
          {!selected ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>اختر رسالة لعرض التفاصيل</div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 18 }}>
                <div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0 }}>{selected.name}</h2>
                  <div style={{ color: MUTED, fontSize: 13, marginTop: 6 }}>{selected.subject || 'رسالة تواصل'}</div>
                </div>
                <span style={{ alignSelf: 'flex-start', fontSize: 12, fontWeight: 900, color: statusMeta[selected.status].color, background: `${statusMeta[selected.status].color}14`, borderRadius: 99, padding: '5px 12px' }}>{statusMeta[selected.status].label}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 18 }}>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 13 }}><strong>الهاتف:</strong> {selected.phone || '—'}</div>
                <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, fontSize: 13 }}><strong>البريد:</strong> {selected.email || '—'}</div>
              </div>

              <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, color: TEXT, lineHeight: 1.9, whiteSpace: 'pre-wrap', marginBottom: 20 }}>{selected.message}</div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => handleStatus(selected._id, 'read')} style={{ height: 38, padding: '0 16px', borderRadius: 10, border: `1.5px solid ${BORDER}`, background: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 800 }}>تمت القراءة</button>
                <button type="button" onClick={() => handleStatus(selected._id, 'replied')} style={{ height: 38, padding: '0 16px', borderRadius: 10, border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 800 }}>تم التواصل</button>
                <button type="button" onClick={() => handleStatus(selected._id, 'new')} style={{ height: 38, padding: '0 16px', borderRadius: 10, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', fontWeight: 800 }}>إرجاع كجديد</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
