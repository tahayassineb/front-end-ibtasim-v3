import React, { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  SettingsCard, FieldLabel, fieldInput,
  PRIMARY, BORDER, P100, P400, P600, TEXT2, TEXTM, TEAL_WASH, SHADOW_P,
} from './shared';

const WhatsAppTab = ({
  whatsappSession,
  setWhatsappSession,
  isRefreshingQr,
  waSessionsList,
  waSessionsLoading,
  handleConnect,
  handleReconnect,
  handleRefreshQr,
  handleDisconnect,
  handleSyncStatus,
  handleResyncApiKey,
  handleListWaSenderSessions,
  handleSelectSession,
  handleDeleteSession,
  handlePhoneChange,
  refreshQrCodeAction,
  syncSessionStatusAction,
}) => {
  // Auto-refresh QR every 20 s while QR shown + not yet connected
  const autoRefreshTimerRef = useRef(null);
  useEffect(() => {
    if (!whatsappSession.qrCode || whatsappSession.isConnected) {
      clearInterval(autoRefreshTimerRef.current);
      return;
    }
    autoRefreshTimerRef.current = setInterval(async () => {
      try {
        const result = await refreshQrCodeAction({});
        if (result.qrCode) setWhatsappSession(prev => ({ ...prev, qrCode: result.qrCode }));
      } catch { /* silent */ }
    }, 20000);
    return () => clearInterval(autoRefreshTimerRef.current);
  }, [whatsappSession.qrCode, whatsappSession.isConnected]);

  // Poll status every 5 s while QR visible (detect scan success)
  const statusPollRef = useRef(null);
  useEffect(() => {
    if (!whatsappSession.instanceId || whatsappSession.isConnected || !whatsappSession.qrCode) {
      clearInterval(statusPollRef.current);
      return;
    }
    statusPollRef.current = setInterval(async () => {
      try {
        const result = await syncSessionStatusAction({});
        if (result?.isConnected) {
          setWhatsappSession(prev => ({ ...prev, isConnected: true, qrCode: null }));
          clearInterval(statusPollRef.current);
        }
      } catch { /* silent */ }
    }, 5000);
    return () => clearInterval(statusPollRef.current);
  }, [whatsappSession.instanceId, whatsappSession.isConnected, whatsappSession.qrCode]);

  return (
    <SettingsCard icon="💬" title="إعدادات واتساب (WaSender)">

      {/* Status indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: TEAL_WASH, borderRadius: 12, marginBottom: 16, border: `1px solid ${P100}` }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: whatsappSession.isConnected ? '#22c55e' : '#ef4444', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {whatsappSession.isConnected ? `✓ متصل${whatsappSession.phoneNumber ? ` — ${whatsappSession.phoneNumber}` : ''}` : 'غير متصل'}
          </div>
          {whatsappSession.lastConnected && (
            <div style={{ fontSize: 12, color: TEXT2 }}>
              آخر تحديث: {new Date(whatsappSession.lastConnected).toLocaleString('ar-MA')}
            </div>
          )}
        </div>
      </div>

      {/* QR Code */}
      {!whatsappSession.isConnected && whatsappSession.qrCode && (
        <div style={{ textAlign: 'center', padding: '16px 0', marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: TEXT2, marginBottom: 12 }}>امسح رمز QR باستخدام تطبيق الواتساب</div>
          <div style={{ display: 'inline-block', padding: 8, borderRadius: 16, border: `2px solid ${P400}` }}>
            {whatsappSession.qrCode.startsWith('data:') || whatsappSession.qrCode.startsWith('http') ? (
              <img src={whatsappSession.qrCode} alt="QR Code" style={{ width: 240, height: 240, borderRadius: 12 }} />
            ) : (
              <QRCodeSVG value={whatsappSession.qrCode} size={240} bgColor="#ffffff" fgColor="#000000" level="M" style={{ borderRadius: 12 }} />
            )}
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={handleRefreshQr} disabled={isRefreshingQr}
              style={{ fontSize: 12, color: TEXT2, background: 'none', border: 'none', cursor: isRefreshingQr ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'Tajawal, sans-serif' }}>
              🔄 {isRefreshingQr ? 'جارٍ التجديد...' : 'تجديد رمز QR'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: TEXTM, marginTop: 4 }}>يتجدد تلقائياً كل 20 ثانية • سيتصل تلقائياً بعد المسح</div>
        </div>
      )}

      {/* Phone input — only when no session */}
      {!whatsappSession.instanceId && !whatsappSession.isConnected && (
        <div style={{ marginBottom: 12 }}>
          <FieldLabel>رقم الهاتف</FieldLabel>
          <input style={{ ...fieldInput, direction: 'ltr', fontFamily: 'Inter, sans-serif' }} type="tel"
            value={whatsappSession.phoneNumber || ''}
            onChange={e => setWhatsappSession(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="+212 6XX-XXXXXX"
            onFocus={e => e.target.style.borderColor = PRIMARY}
            onBlur={e => e.target.style.borderColor = BORDER} />
        </div>
      )}

      {/* Primary action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {/* Connect — no session */}
        {!whatsappSession.instanceId && !whatsappSession.isConnected && (
          <button onClick={handleConnect} disabled={whatsappSession.isLoading}
            style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: whatsappSession.isLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: PRIMARY, color: 'white', boxShadow: SHADOW_P, opacity: whatsappSession.isLoading ? 0.7 : 1 }}>
            {whatsappSession.isLoading ? '...' : '📱 اتصال'}
          </button>
        )}
        {/* Reconnect — session exists, not connected */}
        {whatsappSession.instanceId && !whatsappSession.isConnected && (
          <button onClick={handleReconnect} disabled={whatsappSession.isLoading}
            style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: whatsappSession.isLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: PRIMARY, color: 'white', boxShadow: SHADOW_P, opacity: whatsappSession.isLoading ? 0.7 : 1 }}>
            {whatsappSession.isLoading ? '...' : '🔄 إعادة الاتصال'}
          </button>
        )}
        {/* Sync status — any session */}
        {(whatsappSession.instanceId || whatsappSession.isConnected) && (
          <button onClick={handleSyncStatus} disabled={whatsappSession.isLoading}
            style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: whatsappSession.isLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', background: TEAL_WASH, color: P600, border: `1px solid ${P100}`, opacity: whatsappSession.isLoading ? 0.7 : 1 }}>
            🔄 مزامنة الحالة
          </button>
        )}
        {/* Disconnect — connected */}
        {whatsappSession.isConnected && (
          <button onClick={handleDisconnect} disabled={whatsappSession.isLoading}
            style={{ flex: 1, height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: whatsappSession.isLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', border: 'none', background: '#FEE2E2', color: '#dc2626', opacity: whatsappSession.isLoading ? 0.7 : 1 }}>
            ⊘ قطع الاتصال
          </button>
        )}
      </div>

      {/* WaSender sessions list */}
      <div style={{ background: '#FFF7ED', borderRadius: 12, padding: 14, border: '1px solid #fed7aa', marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: '#92400e', fontWeight: 600, marginBottom: 10 }}>📡 تحديد جلسة الإرسال — اختر الجلسة الصحيحة من حساب WaSender</div>
        <button onClick={handleListWaSenderSessions} disabled={waSessionsLoading}
          style={{ height: 34, padding: '0 14px', border: '1.5px solid #fed7aa', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: waSessionsLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'white', color: '#92400e', marginBottom: waSessionsList !== null ? 10 : 0, opacity: waSessionsLoading ? 0.7 : 1 }}>
          {waSessionsList === null ? 'عرض جلسات WaSender' : 'تحديث القائمة'}
        </button>
        {waSessionsList !== null && (
          waSessionsList.length === 0 ? (
            <div style={{ fontSize: 13, color: TEXTM, textAlign: 'center', padding: '8px 0' }}>لا توجد جلسات</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {waSessionsList.map(session => {
                const isConn = session.status === 'connected' || session.status === 'open';
                return (
                  <div key={session.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white', borderRadius: 8, padding: '10px 12px', border: '1px solid #fed7aa' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{session.name}</div>
                      {session.phoneNumber && <div style={{ fontSize: 11, color: TEXT2, fontFamily: 'Inter, sans-serif' }}>{session.phoneNumber}</div>}
                      <div style={{ fontSize: 11, fontWeight: 600, color: isConn ? '#16a34a' : '#ef4444' }}>{isConn ? '● متصل' : '○ غير متصل'}</div>
                    </div>
                    <button onClick={() => handleSelectSession(session.id)} disabled={waSessionsLoading || !session.apiKey}
                      style={{ height: 28, padding: '0 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: (waSessionsLoading || !session.apiKey) ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', background: session.apiKey ? '#f97316' : '#e2e8f0', color: session.apiKey ? 'white' : TEXTM, border: 'none' }}>
                      {session.apiKey ? 'استخدام هذه' : 'لا يوجد مفتاح'}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Resync API key */}
      {(whatsappSession.instanceId || whatsappSession.isConnected) && (
        <button onClick={handleResyncApiKey} disabled={whatsappSession.isLoading}
          style={{ width: '100%', height: 36, borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: whatsappSession.isLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', border: `1.5px solid ${BORDER}`, background: 'white', color: TEXT2, marginBottom: 8, opacity: whatsappSession.isLoading ? 0.7 : 1 }}>
          🔑 إعادة مزامنة مفتاح API
        </button>
      )}

      {/* Delete session */}
      {(whatsappSession.instanceId || whatsappSession.isConnected) && (
        <button onClick={handleDeleteSession} disabled={whatsappSession.isLoading}
          style={{ width: '100%', height: 38, borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: whatsappSession.isLoading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', border: '1.5px solid #fca5a5', background: 'white', color: '#dc2626', marginBottom: 16, opacity: whatsappSession.isLoading ? 0.7 : 1 }}>
          🗑 حذف الجلسة نهائياً
        </button>
      )}

      {/* Change phone */}
      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>تغيير رقم الهاتف</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input style={{ ...fieldInput, flex: 1, direction: 'ltr', fontFamily: 'Inter, sans-serif' }} type="tel"
            value={whatsappSession.phoneNumber || ''}
            onChange={e => setWhatsappSession(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="+212 6XX-XXXXXX"
            onFocus={e => e.target.style.borderColor = PRIMARY}
            onBlur={e => e.target.style.borderColor = BORDER} />
          <button onClick={handlePhoneChange}
            style={{ height: 48, padding: '0 16px', border: `1.5px solid ${BORDER}`, borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Tajawal, sans-serif', background: 'white', color: TEXT2, flexShrink: 0 }}>
            تحديث
          </button>
        </div>
      </div>

      {/* Session stats */}
      {whatsappSession.isConnected && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            { label: 'الرسائل المرسلة',  value: whatsappSession.messagesSent || 0 },
            { label: 'الرسائل المستلمة', value: whatsappSession.messagesReceived || 0 },
            { label: 'آخر اتصال', value: whatsappSession.lastConnected ? new Date(whatsappSession.lastConnected).toLocaleDateString('ar-MA') : '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ textAlign: 'center', padding: 12, background: TEAL_WASH, borderRadius: 12 }}>
              <div style={{ fontSize: 20, fontWeight: 900, color: PRIMARY, fontFamily: 'Inter, sans-serif' }}>{value}</div>
              <div style={{ fontSize: 11, color: TEXTM, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}
    </SettingsCard>
  );
};

export default WhatsAppTab;
