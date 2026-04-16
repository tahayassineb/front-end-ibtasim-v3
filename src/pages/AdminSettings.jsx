import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { QRCodeSVG } from 'qrcode.react';

// ─── Design tokens ────────────────────────────────────────────────────────────
const BORDER    = '#E5E9EB';
const PRIMARY   = '#0d7477';
const P600      = '#0A5F62';
const P100      = '#CCF0F0';
const P400      = '#33C0C0';
const TEXT2     = '#64748b';
const TEXTM     = '#94a3b8';
const SHADOW    = '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)';
const SHADOW_P  = '0 4px 14px rgba(13,116,119,.25)';
const TEAL_WASH = '#F0F7F7';

// ─── Shared sub-components ────────────────────────────────────────────────────
const SettingsCard = ({ icon, title, children }) => (
  <div style={{ background: 'white', borderRadius: 16, border: `1px solid ${BORDER}`, boxShadow: SHADOW, overflow: 'hidden', marginBottom: 16 }}>
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BORDER}`, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 18 }}>{icon}</span><span>{title}</span>
    </div>
    <div style={{ padding: 20 }}>{children}</div>
  </div>
);

const fieldInput = {
  width: '100%', height: 48, border: `1.5px solid ${BORDER}`, borderRadius: 12,
  padding: '0 14px', fontSize: 14, fontFamily: 'Tajawal, sans-serif',
  color: '#0e1a1b', outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
};

const FieldLabel = ({ children }) => (
  <label style={{ fontSize: 12, fontWeight: 700, color: TEXT2, marginBottom: 7, display: 'block' }}>{children}</label>
);

const SaveBtn = ({ onClick, loading, children, fullWidth }) => (
  <button onClick={onClick} disabled={loading}
    style={{ height: 44, padding: '0 28px', background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_P, opacity: loading ? 0.7 : 1, width: fullWidth ? '100%' : 'auto' }}>
    {loading ? 'جاري الحفظ...' : children}
  </button>
);

const ToggleRow = ({ title, desc, value, onChange, isLast }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: isLast ? 'none' : `1px solid ${BORDER}` }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{title}</div>
      {desc && <div style={{ fontSize: 12, color: TEXT2, marginTop: 2 }}>{desc}</div>}
    </div>
    <div onClick={() => onChange(!value)}
      style={{ width: 44, height: 24, background: value ? PRIMARY : BORDER, borderRadius: 100, position: 'relative', cursor: 'pointer', flexShrink: 0, transition: 'background .2s' }}>
      <div style={{ width: 20, height: 20, background: 'white', borderRadius: '50%', position: 'absolute', top: 2, left: value ? 22 : 2, boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
    </div>
  </div>
);

const TABS = [
  { id: 'bank',          icon: '🏦', label: 'البنك' },
  { id: 'whatsapp',      icon: '💬', label: 'واتساب' },
  { id: 'team',          icon: '👥', label: 'الفريق' },
  { id: 'profile',       icon: '👤', label: 'حسابي' },
  { id: 'notifications', icon: '🔔', label: 'الإشعارات' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const AdminSettings = () => {
  const { showToast, user } = useApp();
  const [activeTab, setActiveTab] = useState('bank');

  // ── Convex queries ────────────────────────────────────────────────────────
  const bankInfoData        = useQuery(api.config.getConfig, { key: 'bank_info' });
  const whatsappSettingsData = useQuery(api.config.getConfig, { key: 'whatsapp_settings' });
  const teamMembersData     = useQuery(api.config.getConfig, { key: 'team_members' });
  const orgProfileData      = useQuery(api.config.getConfig, { key: 'org_profile' });
  const notificationsData   = useQuery(api.config.getConfig, { key: 'notifications' });
  const setConfig           = useMutation(api.config.setConfig);

  // ── WhatsApp session actions ───────────────────────────────────────────────
  const createAndConnectSession      = useAction(api.whatsapp.createAndConnectSession);
  const disconnectSessionAction      = useAction(api.whatsapp.disconnectSession);
  const refreshQrCodeAction          = useAction(api.whatsapp.refreshQrCode);
  const syncSessionStatusAction      = useAction(api.whatsapp.syncSessionStatus);
  const deleteSessionAction          = useAction(api.whatsapp.deleteSession);
  const resyncApiKeyAction           = useAction(api.whatsapp.resyncApiKey);
  const listWaSenderSessionsAction   = useAction(api.whatsapp.listWaSenderSessions);
  const selectSessionForSendingAction = useAction(api.whatsapp.selectSessionForSending);

  // ── Admin invitation ───────────────────────────────────────────────────────
  const createAdminInvitation = useMutation(api.admin.createAdminInvitation);

  // ── Loading states ────────────────────────────────────────────────────────
  const [isSavingBank,          setIsSavingBank]          = useState(false);
  const [isSavingProfile,       setIsSavingProfile]       = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingTeam,          setIsSavingTeam]          = useState(false);
  const [ribCopied,             setRibCopied]             = useState(false);
  const [waSessionsList,        setWaSessionsList]        = useState(null);
  const [waSessionsLoading,     setWaSessionsLoading]     = useState(false);

  const isLoading =
    bankInfoData === undefined ||
    whatsappSettingsData === undefined ||
    teamMembersData === undefined ||
    orgProfileData === undefined ||
    notificationsData === undefined;

  // ── WhatsApp session state ────────────────────────────────────────────────
  const [whatsappSession, setWhatsappSession] = useState({
    isConnected: false, phoneNumber: '', sessionId: null,
    qrCode: null, lastConnected: null, messagesSent: 0,
    messagesReceived: 0, isLoading: false,
  });
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);

  useEffect(() => {
    if (whatsappSettingsData) {
      try {
        const parsed = JSON.parse(whatsappSettingsData);
        setWhatsappSession(prev => ({ ...prev, ...parsed, isLoading: false }));
      } catch (e) { console.error('Failed to parse WhatsApp settings:', e); }
    }
  }, [whatsappSettingsData]);

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
      } catch (_) { /* silent */ }
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
      } catch (_) { /* silent */ }
    }, 5000);
    return () => clearInterval(statusPollRef.current);
  }, [whatsappSession.instanceId, whatsappSession.isConnected, whatsappSession.qrCode]);

  // ── Form state ────────────────────────────────────────────────────────────
  const defaultFormData = {
    accountHolder: 'جمعية ابتسم', rib: '', bankName: 'Attijariwafa Bank',
    organizationName: 'جمعية ابتسم', email: 'contact@ibtasam.org',
    phone: '+212 5XX-XXXXXX', address: 'الدار البيضاء، المغرب',
    description: 'جمعية خيرية تعمل على رعاية الأيتام',
    newDonation: true, donationVerified: true, weeklyReports: false, monthlyReports: true,
  };
  const [formData, setFormData] = useState(defaultFormData);

  const handleInputChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (bankInfoData) {
      try {
        const p = JSON.parse(bankInfoData);
        setFormData(prev => ({ ...prev, accountHolder: p.accountHolder || prev.accountHolder, rib: p.rib || prev.rib, bankName: p.bankName || prev.bankName }));
      } catch (e) { console.error('Failed to parse bank info:', e); }
    }
  }, [bankInfoData]);

  useEffect(() => {
    if (orgProfileData) {
      try {
        const p = JSON.parse(orgProfileData);
        setFormData(prev => ({ ...prev, organizationName: p.organizationName || prev.organizationName, email: p.email || prev.email, phone: p.phone || prev.phone, address: p.address || prev.address, description: p.description || prev.description }));
      } catch (e) { console.error('Failed to parse org profile:', e); }
    }
  }, [orgProfileData]);

  useEffect(() => {
    if (notificationsData) {
      try {
        const p = JSON.parse(notificationsData);
        setFormData(prev => ({ ...prev, newDonation: p.newDonation ?? prev.newDonation, donationVerified: p.donationVerified ?? prev.donationVerified, weeklyReports: p.weeklyReports ?? prev.weeklyReports, monthlyReports: p.monthlyReports ?? prev.monthlyReports }));
      } catch (e) { console.error('Failed to parse notifications:', e); }
    }
  }, [notificationsData]);

  // ── Team state ────────────────────────────────────────────────────────────
  const defaultTeamMembers = [
    { id: 1, name: 'مدير النظام',   email: 'admin@ibtasam.org',   role: 'superAdmin', phone: '+212 6XX-XXXXXX' },
    { id: 2, name: 'مدير المشاريع', email: 'manager@ibtasam.org', role: 'manager',    phone: '+212 6XX-XXXXXX' },
    { id: 3, name: 'مساعد إداري',   email: 'viewer@ibtasam.org',  role: 'viewer',     phone: '+212 6XX-XXXXXX' },
  ];
  const [teamMembers, setTeamMembers] = useState(defaultTeamMembers);

  useEffect(() => {
    if (teamMembersData) {
      try {
        const p = JSON.parse(teamMembersData);
        if (Array.isArray(p) && p.length > 0) setTeamMembers(p);
      } catch (e) { console.error('Failed to parse team members:', e); }
    }
  }, [teamMembersData]);

  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // ── Save handlers ─────────────────────────────────────────────────────────
  const handleSaveBank = async () => {
    setIsSavingBank(true);
    try {
      await setConfig({ key: 'bank_info', value: JSON.stringify({ accountHolder: formData.accountHolder, rib: formData.rib, bankName: formData.bankName }) });
      showToast('تم حفظ معلومات البنك بنجاح', 'success');
    } catch (error) {
      console.error('Failed to save bank info:', error);
      showToast('فشل حفظ معلومات البنك', 'error');
    } finally { setIsSavingBank(false); }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await setConfig({ key: 'org_profile', value: JSON.stringify({ organizationName: formData.organizationName, email: formData.email, phone: formData.phone, address: formData.address, description: formData.description }) });
      showToast('تم حفظ ملف الجمعية بنجاح', 'success');
    } catch (error) {
      console.error('Failed to save org profile:', error);
      showToast('فشل حفظ ملف الجمعية', 'error');
    } finally { setIsSavingProfile(false); }
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await setConfig({ key: 'notifications', value: JSON.stringify({ newDonation: formData.newDonation, donationVerified: formData.donationVerified, weeklyReports: formData.weeklyReports, monthlyReports: formData.monthlyReports }) });
      showToast('تم حفظ إعدادات الإشعارات بنجاح', 'success');
    } catch (error) {
      console.error('Failed to save notifications:', error);
      showToast('فشل حفظ إعدادات الإشعارات', 'error');
    } finally { setIsSavingNotifications(false); }
  };

  // ── WhatsApp handlers ─────────────────────────────────────────────────────
  const handleConnect = async () => {
    let phoneNumber = (whatsappSession.phoneNumber || '').replace(/[\s\-\(\)\.]/g, '');
    if (/^0[67]\d{8}$/.test(phoneNumber)) phoneNumber = '+212' + phoneNumber.slice(1);
    else if (/^\d+$/.test(phoneNumber))   phoneNumber = '+' + phoneNumber;
    if (!phoneNumber || phoneNumber.length < 12) {
      showToast('يرجى إدخال رقم هاتف صحيح بالتنسيق الدولي (مثال: 212632730020 أو 0632730020)', 'error');
      return;
    }
    setWhatsappSession(prev => ({ ...prev, isLoading: true, qrCode: null }));
    try {
      const result = await createAndConnectSession({ phoneNumber });
      if (result.success) {
        setWhatsappSession(prev => ({ ...prev, isLoading: false, qrCode: result.qrCode || null }));
        showToast(result.qrCode ? 'تم إنشاء الجلسة بنجاح' : 'تم إنشاء الجلسة. لم يُعد رمز QR — يرجى المحاولة مرة أخرى.', result.qrCode ? 'success' : 'warning');
      } else {
        setWhatsappSession(prev => ({ ...prev, isLoading: false }));
        showToast(result.error?.includes('not configured') ? 'مفتاح Wasender غير مضبوط. يرجى إضافة WASENDER_MASTER_TOKEN في لوحة Convex Dashboard.' : result.error || 'فشل إنشاء الجلسة', 'error', 6000);
      }
    } catch (error) {
      setWhatsappSession(prev => ({ ...prev, isLoading: false }));
      showToast(error.message || 'فشل إنشاء الجلسة', 'error');
    }
  };

  const handleReconnect = async () => {
    setWhatsappSession(prev => ({ ...prev, isLoading: true, qrCode: null }));
    try {
      const result = await refreshQrCodeAction({});
      if (result.success) {
        setWhatsappSession(prev => ({ ...prev, isLoading: false, qrCode: result.qrCode || null }));
        showToast(result.qrCode ? 'تم تجديد رمز QR بنجاح' : 'لم يُعد رمز QR — يرجى المحاولة مرة أخرى.', result.qrCode ? 'success' : 'warning');
      } else {
        setWhatsappSession(prev => ({ ...prev, isLoading: false }));
        showToast(result.error || 'فشل إعادة الاتصال', 'error');
      }
    } catch (error) {
      setWhatsappSession(prev => ({ ...prev, isLoading: false }));
      showToast(error.message || 'فشل إعادة الاتصال', 'error');
    }
  };

  const handleRefreshQr = async () => {
    setIsRefreshingQr(true);
    try {
      const result = await refreshQrCodeAction({});
      if (result.qrCode) {
        setWhatsappSession(prev => ({ ...prev, qrCode: result.qrCode }));
        showToast('تم تجديد رمز QR', 'success');
      } else {
        showToast('لم يُعد رمز QR — يرجى المحاولة مرة أخرى.', 'warning');
      }
    } catch (error) {
      showToast(error.message || 'فشل تجديد رمز QR', 'error');
    } finally { setIsRefreshingQr(false); }
  };

  const handleDisconnect = async () => {
    setWhatsappSession(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await disconnectSessionAction({});
      if (result.success) {
        setWhatsappSession(prev => ({ ...prev, isConnected: false, qrCode: null, isLoading: false }));
        showToast('تم قطع الاتصال بنجاح', 'success');
      } else {
        setWhatsappSession(prev => ({ ...prev, isLoading: false }));
        showToast(result.error || 'فشل قطع الاتصال', 'error');
      }
    } catch (error) {
      setWhatsappSession(prev => ({ ...prev, isLoading: false }));
      showToast(error.message || 'فشل قطع الاتصال', 'error');
    }
  };

  const handleSyncStatus = async () => {
    setWhatsappSession(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await syncSessionStatusAction({});
      if (result.success) {
        setWhatsappSession(prev => ({ ...prev, isConnected: result.isConnected, qrCode: result.isConnected ? null : prev.qrCode, isLoading: false }));
        showToast(result.isConnected ? 'الجلسة متصلة ✓' : 'الجلسة غير متصلة', result.isConnected ? 'success' : 'warning');
      } else {
        setWhatsappSession(prev => ({ ...prev, isLoading: false }));
        showToast(result.error || 'فشل مزامنة الحالة', 'error');
      }
    } catch (error) {
      setWhatsappSession(prev => ({ ...prev, isLoading: false }));
      showToast(error.message || 'فشل مزامنة الحالة', 'error');
    }
  };

  const handleResyncApiKey = async () => {
    setWhatsappSession(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await resyncApiKeyAction({});
      if (result.success) showToast('تم تحديث مفتاح الجلسة بنجاح ✓', 'success');
      else showToast(result.error || 'فشل تحديث مفتاح الجلسة', 'error');
    } catch (error) {
      showToast(error.message || 'فشل تحديث مفتاح الجلسة', 'error');
    } finally { setWhatsappSession(prev => ({ ...prev, isLoading: false })); }
  };

  const handleListWaSenderSessions = async () => {
    setWaSessionsLoading(true);
    try {
      const result = await listWaSenderSessionsAction({});
      if (result.success) setWaSessionsList(result.sessions || []);
      else showToast(result.error || 'فشل جلب الجلسات', 'error');
    } catch (error) {
      showToast(error.message || 'فشل جلب الجلسات', 'error');
    } finally { setWaSessionsLoading(false); }
  };

  const handleSelectSession = async (sessionId) => {
    setWaSessionsLoading(true);
    try {
      const result = await selectSessionForSendingAction({ sessionId });
      if (result.success) {
        showToast('✓ تم تحديد الجلسة بنجاح — كل الرسائل ستُرسل من هذه الجلسة', 'success');
        setWaSessionsList(null);
        const sync = await syncSessionStatusAction({});
        if (sync.success) setWhatsappSession(prev => ({ ...prev, isConnected: sync.isConnected }));
      } else {
        showToast(result.error || 'فشل تحديد الجلسة', 'error');
      }
    } catch (error) {
      showToast(error.message || 'فشل تحديد الجلسة', 'error');
    } finally { setWaSessionsLoading(false); }
  };

  const handleDeleteSession = async () => {
    if (!window.confirm('هل أنت متأكد من حذف جلسة الواتساب؟ سيتم حذفها نهائياً من WaSender.')) return;
    setWhatsappSession(prev => ({ ...prev, isLoading: true }));
    try {
      const result = await deleteSessionAction({});
      if (result.success) {
        setWhatsappSession({ isConnected: false, phoneNumber: '', sessionId: null, instanceId: null, apiKey: null, qrCode: null, isLoading: false, messagesSent: 0, messagesReceived: 0, lastConnected: null });
        showToast('تم حذف الجلسة بنجاح', 'success');
      } else {
        setWhatsappSession(prev => ({ ...prev, isLoading: false }));
        showToast(result.error || 'فشل حذف الجلسة', 'error');
      }
    } catch (error) {
      setWhatsappSession(prev => ({ ...prev, isLoading: false }));
      showToast(error.message || 'فشل حذف الجلسة', 'error');
    }
  };

  const handlePhoneChange = async () => {
    try {
      await setConfig({ key: 'whatsapp_settings', value: JSON.stringify({ ...whatsappSession, phoneNumber: whatsappSession.phoneNumber }) });
      showToast('تم تحديث رقم الهاتف بنجاح', 'success');
    } catch (error) {
      console.error('Failed to save phone number:', error);
      showToast('فشل تحديث رقم الهاتف', 'error');
    }
  };

  // ── Team handlers ─────────────────────────────────────────────────────────
  const handleDeleteMember = async (id) => {
    setIsSavingTeam(true);
    try {
      const updated = teamMembers.filter(m => m.id !== id);
      await setConfig({ key: 'team_members', value: JSON.stringify(updated) });
      setTeamMembers(updated);
      showToast('تم حذف العضو بنجاح', 'success');
    } catch (error) {
      console.error('Failed to delete member:', error);
      showToast('فشل حذف العضو', 'error');
    } finally { setIsSavingTeam(false); }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
  };

  const ROLE_CFG = {
    superAdmin: { label: '🔑 مدير عام', bg: '#FEF3C7', color: '#b45309' },
    admin:      { label: 'admin',       bg: '#E6F4F4', color: P600 },
    manager:    { label: 'مدير',        bg: '#E6F4F4', color: P600 },
    viewer:     { label: 'مراجع',       bg: '#F1F5F9', color: '#475569' },
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 14, border: `1px solid ${BORDER}`, padding: 6, marginBottom: 20, boxShadow: SHADOW }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, height: 36, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab.id ? PRIMARY : 'none', color: activeTab === tab.id ? 'white' : TEXT2, fontFamily: 'Tajawal, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: activeTab === tab.id ? SHADOW_P : 'none', transition: 'all .15s' }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Loading ── */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: TEXTM, fontSize: 15 }}>⏳ جاري التحميل...</div>
      )}

      {!isLoading && (
        <>
          {/* ══ BANK TAB ══ */}
          {activeTab === 'bank' && (
            <SettingsCard icon="🏦" title="إعدادات التحويل البنكي">
              {/* RIB display box */}
              <div style={{ background: TEAL_WASH, borderRadius: 12, padding: 16, border: `1px solid ${P100}`, textAlign: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: TEXTM, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
                  رقم الحساب الحالي (RIB)
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: P600, fontFamily: 'Inter, sans-serif', letterSpacing: '.06em' }}>
                  {formData.rib || '—'}
                </div>
              </div>

              {/* Form grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <FieldLabel>اسم البنك</FieldLabel>
                  <input style={fieldInput} type="text" value={formData.bankName}
                    onChange={e => handleInputChange('bankName', e.target.value)}
                    onFocus={e => e.target.style.borderColor = PRIMARY}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                <div>
                  <FieldLabel>اسم الحساب (المستفيد)</FieldLabel>
                  <input style={fieldInput} type="text" value={formData.accountHolder}
                    onChange={e => handleInputChange('accountHolder', e.target.value)}
                    onFocus={e => e.target.style.borderColor = PRIMARY}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <FieldLabel>رقم RIB (24 خانة)</FieldLabel>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{ ...fieldInput, flex: 1, direction: 'ltr', fontFamily: 'Inter, sans-serif', letterSpacing: '.04em' }}
                      type="text" value={formData.rib} placeholder="000 000 0000000000000000 00"
                      onChange={e => handleInputChange('rib', e.target.value)}
                      onFocus={e => e.target.style.borderColor = PRIMARY}
                      onBlur={e => e.target.style.borderColor = BORDER} />
                    <button type="button" title="نسخ RIB"
                      onClick={() => { if (formData.rib) { navigator.clipboard.writeText(formData.rib); setRibCopied(true); setTimeout(() => setRibCopied(false), 2000); } }}
                      style={{ width: 48, height: 48, border: `1.5px solid ${BORDER}`, borderRadius: 12, background: 'white', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
                      {ribCopied ? '✓' : '📋'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <SaveBtn onClick={handleSaveBank} loading={isSavingBank}>💾 حفظ إعدادات البنك</SaveBtn>
              </div>
            </SettingsCard>
          )}

          {/* ══ WHATSAPP TAB ══ */}
          {activeTab === 'whatsapp' && (
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
          )}

          {/* ══ TEAM TAB ══ */}
          {activeTab === 'team' && (
            <>
              {/* Invitation card */}
              <SettingsCard icon="✉️" title="إرسال دعوة تسجيل">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <FieldLabel>البريد الإلكتروني</FieldLabel>
                    <input style={{ ...fieldInput, direction: 'ltr', fontFamily: 'Inter, sans-serif' }} type="email"
                      value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                      placeholder="name@example.com"
                      onFocus={e => e.target.style.borderColor = PRIMARY}
                      onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <div>
                    <FieldLabel>رقم الهاتف (واتساب)</FieldLabel>
                    <input style={{ ...fieldInput, direction: 'ltr', fontFamily: 'Inter, sans-serif' }} type="tel"
                      value={invitePhone} onChange={e => setInvitePhone(e.target.value)}
                      placeholder="+212 6XXXXXXXX"
                      onFocus={e => e.target.style.borderColor = PRIMARY}
                      onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                  <button disabled={isSendingInvite}
                    onClick={async () => {
                      if (!inviteEmail || !invitePhone) { showToast('يرجى إدخال البريد الإلكتروني ورقم الواتساب', 'error'); return; }
                      if (!user?.id) { showToast('يرجى تسجيل الدخول أولاً', 'error'); return; }
                      setIsSendingInvite(true);
                      try {
                        const result = await createAdminInvitation({ email: inviteEmail.trim(), phone: invitePhone.trim(), invitedBy: user.id, siteUrl: window.location.origin });
                        setInviteLink(`${window.location.origin}/admin/register/${result.token}`);
                        setInviteEmail(''); setInvitePhone('');
                        showToast('تم إرسال الدعوة بنجاح عبر الواتساب', 'success');
                      } catch (err) { showToast(err.message || 'فشل إرسال الدعوة', 'error'); }
                      finally { setIsSendingInvite(false); }
                    }}
                    style={{ height: 44, background: PRIMARY, color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: isSendingInvite ? 'not-allowed' : 'pointer', fontFamily: 'Tajawal, sans-serif', boxShadow: SHADOW_P, opacity: isSendingInvite ? 0.7 : 1 }}>
                    {isSendingInvite ? '...' : '📤 إرسال الدعوة عبر الواتساب'}
                  </button>
                  {inviteLink && (
                    <div style={{ background: '#F0FDF4', borderRadius: 10, padding: '10px 14px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input readOnly value={inviteLink}
                        style={{ flex: 1, fontSize: 12, border: 'none', outline: 'none', background: 'transparent', color: '#16a34a', fontFamily: 'Inter, sans-serif', direction: 'ltr' }} />
                      <button onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('تم النسخ', 'success'); }}
                        style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}>📋</button>
                    </div>
                  )}
                </div>
              </SettingsCard>

              {/* Team members list */}
              <SettingsCard icon="👥" title="أعضاء الفريق">
                {teamMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: TEXTM, fontSize: 14 }}>لا يوجد أعضاء بعد</div>
                ) : (
                  teamMembers.map((member, i) => {
                    const rc = ROLE_CFG[member.role] || ROLE_CFG.viewer;
                    return (
                      <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: i < teamMembers.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg,${P600},${P400})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'white', fontWeight: 700, flexShrink: 0 }}>
                          {initials(member.name)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{member.name}</div>
                          <div style={{ fontSize: 12, color: TEXTM }}>{member.phone || member.email}</div>
                        </div>
                        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: rc.bg, color: rc.color }}>{rc.label}</span>
                        <button onClick={() => handleDeleteMember(member.id)} disabled={isSavingTeam}
                          style={{ width: 28, height: 28, border: `1px solid ${BORDER}`, borderRadius: 8, fontSize: 13, cursor: isSavingTeam ? 'not-allowed' : 'pointer', background: 'white', color: TEXT2 }}>
                          🗑
                        </button>
                      </div>
                    );
                  })
                )}
              </SettingsCard>
            </>
          )}

          {/* ══ PROFILE TAB ══ */}
          {activeTab === 'profile' && (
            <SettingsCard icon="👤" title="ملف الجمعية">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'اسم المنظمة',         field: 'organizationName', type: 'text' },
                  { label: 'البريد الإلكتروني',    field: 'email',            type: 'email' },
                  { label: 'الهاتف',              field: 'phone',            type: 'tel' },
                  { label: 'العنوان',             field: 'address',          type: 'text' },
                ].map(({ label, field, type }) => (
                  <div key={field}>
                    <FieldLabel>{label}</FieldLabel>
                    <input style={fieldInput} type={type} value={formData[field] || ''}
                      onChange={e => handleInputChange(field, e.target.value)}
                      onFocus={e => e.target.style.borderColor = PRIMARY}
                      onBlur={e => e.target.style.borderColor = BORDER} />
                  </div>
                ))}
                <div>
                  <FieldLabel>الوصف</FieldLabel>
                  <textarea value={formData.description || ''} onChange={e => handleInputChange('description', e.target.value)} rows={3}
                    style={{ ...fieldInput, height: 'auto', padding: '12px 14px', resize: 'none', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = PRIMARY}
                    onBlur={e => e.target.style.borderColor = BORDER} />
                </div>
                <SaveBtn onClick={handleSaveProfile} loading={isSavingProfile}>💾 حفظ ملف الجمعية</SaveBtn>
              </div>
            </SettingsCard>
          )}

          {/* ══ NOTIFICATIONS TAB ══ */}
          {activeTab === 'notifications' && (
            <SettingsCard icon="🔔" title="إعدادات الإشعارات">
              <ToggleRow title="إشعار عند تبرع جديد" desc="واتساب للمدير عند كل تبرع جديد" value={!!formData.newDonation} onChange={v => handleInputChange('newDonation', v)} />
              <ToggleRow title="تأكيد للمتبرع تلقائياً" desc="رسالة واتساب تلقائية عند قبول التبرع" value={!!formData.donationVerified} onChange={v => handleInputChange('donationVerified', v)} />
              <ToggleRow title="تقارير أسبوعية" desc="ملخص أسبوعي للتبرعات والنشاط" value={!!formData.weeklyReports} onChange={v => handleInputChange('weeklyReports', v)} />
              <ToggleRow title="تذكير تجديد الكفالة" desc="تذكير للكافل 3 أيام قبل موعد التجديد" value={!!formData.monthlyReports} onChange={v => handleInputChange('monthlyReports', v)} isLast />
              <div style={{ marginTop: 16 }}>
                <SaveBtn onClick={handleSaveNotifications} loading={isSavingNotifications}>💾 حفظ إعدادات الإشعارات</SaveBtn>
              </div>
            </SettingsCard>
          )}
        </>
      )}
    </div>
  );
};

export default AdminSettings;
