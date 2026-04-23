import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../../../context/AppContext';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { TABS, BORDER, PRIMARY, TEXT2, TEXTM, SHADOW, SHADOW_P, TEAL_WASH } from './shared';
import BankTab from './BankTab';
import WhatsAppTab from './WhatsAppTab';
import TeamTab from './TeamTab';
import ProfileTab from './ProfileTab';
import NotificationsTab from './NotificationsTab';

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
    isConnected: false, phoneNumber: '', instanceId: null,
    qrCode: null, lastConnected: null, messagesSent: 0,
    messagesReceived: 0, isLoading: false,
  });
  const [isRefreshingQr, setIsRefreshingQr] = useState(false);

  // One-shot init — only parse on first delivery to avoid overwriting live QR
  const whatsappInitialized = useRef(false);
  useEffect(() => {
    if (whatsappSettingsData && !whatsappInitialized.current) {
      whatsappInitialized.current = true;
      try {
        const parsed = JSON.parse(whatsappSettingsData);
        setWhatsappSession(prev => ({ ...prev, ...parsed, isLoading: false }));
      } catch (e) { console.error('Failed to parse WhatsApp settings:', e); }
    }
  }, [whatsappSettingsData]);

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
      const { phoneNumber, instanceId, apiKey, isConnected, lastConnected, messagesSent, messagesReceived } = whatsappSession;
      await setConfig({
        key: 'whatsapp_settings',
        value: JSON.stringify({ phoneNumber, instanceId, apiKey, isConnected, lastConnected, messagesSent, messagesReceived }),
      });
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

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'var(--font-arabic)', color: '#0e1a1b', padding: 24 }} dir="rtl">

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 4, background: 'white', borderRadius: 14, border: `1px solid ${BORDER}`, padding: 6, marginBottom: 20, boxShadow: SHADOW }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ flex: 1, height: 36, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: activeTab === tab.id ? PRIMARY : 'none', color: activeTab === tab.id ? 'white' : TEXT2, fontFamily: 'var(--font-arabic)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: activeTab === tab.id ? SHADOW_P : 'none', transition: 'all .15s' }}>
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
          {activeTab === 'bank' && (
            <BankTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleSaveBank={handleSaveBank}
              isSavingBank={isSavingBank}
              ribCopied={ribCopied}
              setRibCopied={setRibCopied}
            />
          )}
          {activeTab === 'whatsapp' && (
            <WhatsAppTab
              whatsappSession={whatsappSession}
              setWhatsappSession={setWhatsappSession}
              isRefreshingQr={isRefreshingQr}
              waSessionsList={waSessionsList}
              waSessionsLoading={waSessionsLoading}
              handleConnect={handleConnect}
              handleReconnect={handleReconnect}
              handleRefreshQr={handleRefreshQr}
              handleDisconnect={handleDisconnect}
              handleSyncStatus={handleSyncStatus}
              handleResyncApiKey={handleResyncApiKey}
              handleListWaSenderSessions={handleListWaSenderSessions}
              handleSelectSession={handleSelectSession}
              handleDeleteSession={handleDeleteSession}
              handlePhoneChange={handlePhoneChange}
              refreshQrCodeAction={refreshQrCodeAction}
              syncSessionStatusAction={syncSessionStatusAction}
            />
          )}
          {activeTab === 'team' && (
            <TeamTab
              teamMembers={teamMembers}
              isSavingTeam={isSavingTeam}
              handleDeleteMember={handleDeleteMember}
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              invitePhone={invitePhone}
              setInvitePhone={setInvitePhone}
              isSendingInvite={isSendingInvite}
              setIsSendingInvite={setIsSendingInvite}
              inviteLink={inviteLink}
              setInviteLink={setInviteLink}
              createAdminInvitation={createAdminInvitation}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleSaveProfile={handleSaveProfile}
              isSavingProfile={isSavingProfile}
            />
          )}
          {activeTab === 'notifications' && (
            <NotificationsTab
              formData={formData}
              handleInputChange={handleInputChange}
              handleSaveNotifications={handleSaveNotifications}
              isSavingNotifications={isSavingNotifications}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdminSettings;
