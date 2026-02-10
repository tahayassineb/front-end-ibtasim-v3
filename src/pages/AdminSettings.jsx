import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

// ============================================
// ADMIN SETTINGS PAGE - System Configuration (Arabic)
// ============================================

const AdminSettings = () => {
  const { currentLanguage, isDarkMode, toggleDarkMode, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('bank');

  // WhatsApp Session State
  const [whatsappSession, setWhatsappSession] = useState({
    isConnected: false,
    phoneNumber: '+212 6XX-XXXXXX',
    sessionId: null,
    qrCode: null,
    lastConnected: null,
    messagesSent: 0,
    messagesReceived: 0,
    isLoading: false,
  });

  // Load WhatsApp session from localStorage
  useEffect(() => {
    const savedSession = localStorage.getItem('whatsapp-session');
    if (savedSession) {
      setWhatsappSession(prev => ({ ...prev, ...JSON.parse(savedSession) }));
    }
  }, []);

  // Arabic Translations Only
  const t = {
    // Header
    title: 'إعدادات النظام',
    
    // Settings Navigation
    settingsNav: 'التنقل في الإعدادات',
    bankManagement: 'إدارة البنك',
    associationProfile: 'ملف الجمعية',
    adminAccess: 'وصول المشرف',
    notificationRules: 'قواعد الإشعارات',
    paymentMethods: 'طرق الدفع',
    whatsappManagement: 'إدارة الواتساب',
    teamMembers: 'فريق العمل',
    
    // General Settings
    generalSettings: 'إعدادات عامة',
    darkMode: 'الوضع الداكن',
    language: 'اللغة',
    notifications: 'الإشعارات',
    emailNotifications: 'إشعارات البريد الإلكتروني',
    smsNotifications: 'إشعارات الرسائل القصيرة',
    
    // Bank Management
    bankDescription: 'تكوين تفاصيل RIB الآمنة لمعالجة التبرعات.',
    accountHolder: 'اسم صاحب الحساب',
    rib: 'RIB',
    ribHint: 'رقم الحساب البنكي المغربي القياسي المكون من 24 رقماً',
    bankName: 'اسم البنك',
    securityNote: 'تتطلب التغييرات المصادقة متعددة العوامل. سيتم إرسال تنبيهات الإشعارات إلى دائرة المشرفين.',
    saveChanges: 'حفظ التغييرات',
    
    // WhatsApp Management
    whatsappDescription: 'إدارة جلسة الواتساب لإرسال الإشعارات والتواصل مع المتبرعين.',
    sessionStatus: 'حالة الجلسة',
    connected: 'متصل',
    disconnected: 'غير متصل',
    qrCode: 'رمز الاستجابة السريعة',
    scanQrCode: 'امسح رمز QR باستخدام تطبيق الواتساب',
    createSession: 'إنشاء جلسة',
    disconnect: 'قطع الاتصال',
    changePhoneNumber: 'تغيير رقم الهاتف',
    newPhoneNumber: 'رقم الهاتف الجديد',
    phoneNumberPlaceholder: '+212 6XX-XXXXXX',
    updatePhone: 'تحديث الرقم',
    sessionStats: 'إحصائيات الجلسة',
    messagesSent: 'الرسائل المرسلة',
    messagesReceived: 'الرسائل المستلمة',
    lastConnected: 'آخر اتصال',
    sessionActive: 'الجلسة نشطة',
    sessionInactive: 'الجلسة غير نشطة',
    createSessionSuccess: 'تم إنشاء الجلسة بنجاح',
    disconnectSuccess: 'تم قطع الاتصال بنجاح',
    phoneUpdated: 'تم تحديث رقم الهاتف بنجاح',
    
    // Team Members
    addMember: 'إضافة عضو',
    memberName: 'اسم العضو',
    memberEmail: 'البريد الإلكتروني',
    memberRole: 'الدور الوظيفي',
    memberPhone: 'رقم الهاتف',
    saveMember: 'حفظ العضو',
    cancel: 'إلغاء',
    superAdmin: 'مدير عام',
    manager: 'مدير',
    viewer: 'مشاهد',
    actions: 'الإجراءات',
    delete: 'حذف',
    edit: 'تعديل',
    
    // Profile
    organizationName: 'اسم المنظمة',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    address: 'العنوان',
    description: 'الوصف',
    
    // Notifications
    donationAlerts: 'تنبيهات التبرعات',
    newDonation: 'تبرع جديد',
    donationVerified: 'تم التحقق من التبرع',
    weeklyReports: 'التقارير الأسبوعية',
    monthlyReports: 'التقارير الشهرية',
  };

  // Form state
  const [formData, setFormData] = useState({
    accountHolder: 'جمعية ابتسم',
    rib: '181 330 2111122223333444 55',
    bankName: 'Attijariwafa Bank',
    emailNotifications: true,
    smsNotifications: false,
    organizationName: 'جمعية ابتسم',
    email: 'contact@ibtasam.org',
    phone: '+212 5XX-XXXXXX',
    address: 'الدار البيضاء، المغرب',
    description: 'جمعية خيرية تعمل على رعاية الأيتام',
    newDonation: true,
    donationVerified: true,
    weeklyReports: false,
    monthlyReports: true,
  });

  // Team members state
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'مدير النظام', email: 'admin@ibtasam.org', role: 'superAdmin', phone: '+212 6XX-XXXXXX' },
    { id: 2, name: 'مدير المشاريع', email: 'manager@ibtasam.org', role: 'manager', phone: '+212 6XX-XXXXXX' },
    { id: 3, name: 'مساعد إداري', email: 'viewer@ibtasam.org', role: 'viewer', phone: '+212 6XX-XXXXXX' },
  ]);

  const [showAddMember, setShowAddMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'viewer',
    phone: '',
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    localStorage.setItem('admin-settings', JSON.stringify(formData));
    showToast('تم حفظ الإعدادات بنجاح', 'success');
  };

  // WhatsApp Session Management
  const handleCreateSession = () => {
    setWhatsappSession(prev => ({ ...prev, isLoading: true }));
    
    // Simulate QR code generation
    setTimeout(() => {
      const mockQrCode = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=whatsapp-session-123';
      setWhatsappSession(prev => ({
        ...prev,
        isLoading: false,
        qrCode: mockQrCode,
      }));
    }, 1500);
  };

  const handleConnectSession = () => {
    setWhatsappSession(prev => ({ ...prev, isLoading: true }));
    
    // Simulate connection
    setTimeout(() => {
      const updatedSession = {
        isConnected: true,
        qrCode: null,
        lastConnected: new Date().toISOString(),
        messagesSent: 150,
        messagesReceived: 89,
        isLoading: false,
      };
      setWhatsappSession(prev => ({ ...prev, ...updatedSession }));
      localStorage.setItem('whatsapp-session', JSON.stringify(updatedSession));
      showToast(t.createSessionSuccess, 'success');
    }, 2000);
  };

  const handleDisconnect = () => {
    setWhatsappSession(prev => ({ ...prev, isLoading: true }));
    
    setTimeout(() => {
      const updatedSession = {
        isConnected: false,
        qrCode: null,
        lastConnected: whatsappSession.lastConnected,
        messagesSent: 0,
        messagesReceived: 0,
        isLoading: false,
      };
      setWhatsappSession(prev => ({ ...prev, ...updatedSession }));
      localStorage.setItem('whatsapp-session', JSON.stringify(updatedSession));
      showToast(t.disconnectSuccess, 'success');
    }, 1000);
  };

  const handlePhoneChange = () => {
    showToast(t.phoneUpdated, 'success');
  };

  const handleAddMember = () => {
    if (newMember.name && newMember.email) {
      setTeamMembers(prev => [...prev, { ...newMember, id: Date.now() }]);
      setNewMember({ name: '', email: '', role: 'viewer', phone: '' });
      setShowAddMember(false);
      showToast('تم إضافة العضو بنجاح', 'success');
    }
  };

  const handleDeleteMember = (id) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showToast('تم حذف العضو بنجاح', 'success');
  };

  const getRoleBadge = (role) => {
    const roles = {
      superAdmin: { variant: 'success', label: t.superAdmin },
      manager: { variant: 'primary', label: t.manager },
      viewer: { variant: 'neutral', label: t.viewer },
    };
    const config = roles[role] || roles.viewer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const settingsTabs = [
    { id: 'bank', icon: 'account_balance', label: t.bankManagement },
    { id: 'whatsapp', icon: 'chat', label: t.whatsappManagement },
    { id: 'team', icon: 'groups', label: t.teamMembers },
    { id: 'profile', icon: 'corporate_fare', label: t.associationProfile },
    { id: 'notifications', icon: 'notifications_active', label: t.notificationRules },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-text-primary dark:text-white">{t.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="lg:col-span-1">
          <Card padding="none" className="overflow-hidden">
            <nav className="flex flex-col">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-4 px-6 py-5 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  } ${tab.id !== 'bank' ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}
                >
                  <div className={`p-2 rounded-lg ${activeTab === tab.id ? 'bg-primary/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <span className={`material-symbols-outlined text-[22px] ${activeTab === tab.id ? 'text-primary' : 'text-slate-500'}`}>
                      {tab.icon}
                    </span>
                  </div>
                  <span className="flex-1 font-semibold text-[15px] text-right">{tab.label}</span>
                  <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-primary' : 'text-slate-300'}`}>
                    chevron_left
                  </span>
                </button>
              ))}
            </nav>
          </Card>

          {/* Quick Settings */}
          <Card padding="lg" className="mt-4">
            <h3 className="font-semibold text-text-primary dark:text-white mb-4">{t.generalSettings}</h3>
            <div className="space-y-4">
              {/* Dark Mode Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t.darkMode}</span>
                <button
                  onClick={toggleDarkMode}
                  className={`w-11 h-6 rounded-full relative transition-colors ${
                    isDarkMode ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                    isDarkMode ? 'left-0.5' : 'right-0.5'
                  }`} />
                </button>
              </div>
              
              {/* Language Selector - Display only (Arabic default) */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t.language}</span>
                <span className="text-sm font-medium text-primary">العربية</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-2">
          {activeTab === 'bank' && (
            <Card padding="lg">
              <div className="flex flex-col gap-1 mb-6">
                <h3 className="text-text-primary dark:text-white text-2xl font-bold font-serif">{t.bankManagement}</h3>
                <p className="text-slate-500 text-sm font-medium">{t.bankDescription}</p>
              </div>

              <div className="space-y-5">
                {/* Account Holder */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.accountHolder}
                  </span>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-text-primary dark:text-white shadow-sm"
                    placeholder="جمعية ابتسم"
                  />
                </label>

                {/* RIB */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.rib}
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.rib}
                      onChange={(e) => handleInputChange('rib', e.target.value)}
                      className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-mono text-text-primary dark:text-white shadow-sm pl-12"
                      placeholder="000 000 0000000000000000 00"
                    />
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary/40 text-xl">lock</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 mr-1">{t.ribHint}</p>
                </label>

                {/* Bank Name */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.bankName}
                  </span>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-text-primary dark:text-white shadow-sm"
                    placeholder="اسم البنك"
                  />
                </label>

                {/* Security Note */}
                <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                  <div className="bg-primary/10 dark:bg-primary/20 p-2 rounded-xl shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                  </div>
                  <p className="text-[13px] text-slate-600 dark:text-slate-300 leading-tight font-medium">
                    {t.securityNote}
                  </p>
                </div>

                {/* Save Button */}
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleSave}
                  className="shadow-lg shadow-primary/20 mt-2"
                >
                  {t.saveChanges}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'whatsapp' && (
            <Card padding="lg">
              <div className="flex flex-col gap-1 mb-6">
                <h3 className="text-text-primary dark:text-white text-2xl font-bold font-serif">{t.whatsappManagement}</h3>
                <p className="text-slate-500 text-sm font-medium">{t.whatsappDescription}</p>
              </div>

              <div className="space-y-6">
                {/* Session Status */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${whatsappSession.isConnected ? 'bg-green-100 dark:bg-green-900/30' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <span className={`material-symbols-outlined ${whatsappSession.isConnected ? 'text-green-600' : 'text-slate-500'}`}>
                        {whatsappSession.isConnected ? 'check_circle' : 'chat_bubble'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-text-primary dark:text-white">{t.sessionStatus}</p>
                      <p className={`text-sm ${whatsappSession.isConnected ? 'text-green-600' : 'text-slate-500'}`}>
                        {whatsappSession.isConnected ? t.connected : t.disconnected}
                      </p>
                    </div>
                  </div>
                  <Badge variant={whatsappSession.isConnected ? 'success' : 'neutral'}>
                    {whatsappSession.isConnected ? t.sessionActive : t.sessionInactive}
                  </Badge>
                </div>

                {/* QR Code Display */}
                {!whatsappSession.isConnected && whatsappSession.qrCode && (
                  <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t.scanQrCode}</p>
                    <img src={whatsappSession.qrCode} alt="QR Code" className="mx-auto w-48 h-48" />
                    <Button
                      variant="primary"
                      size="md"
                      className="mt-4"
                      onClick={handleConnectSession}
                      loading={whatsappSession.isLoading}
                    >
                      {t.createSession}
                    </Button>
                  </div>
                )}

                {/* Create Session Button */}
                {!whatsappSession.isConnected && !whatsappSession.qrCode && (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleCreateSession}
                    loading={whatsappSession.isLoading}
                    className="shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined ml-2">qr_code</span>
                    {t.createSession}
                  </Button>
                )}

                {/* Disconnect Button */}
                {whatsappSession.isConnected && (
                  <Button
                    variant="outline"
                    size="lg"
                    fullWidth
                    onClick={handleDisconnect}
                    loading={whatsappSession.isLoading}
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <span className="material-symbols-outlined ml-2">logout</span>
                    {t.disconnect}
                  </Button>
                )}

                {/* Change Phone Number */}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h4 className="font-semibold text-text-primary dark:text-white mb-4">{t.changePhoneNumber}</h4>
                  <div className="flex gap-3">
                    <input
                      type="tel"
                      value={whatsappSession.phoneNumber}
                      onChange={(e) => setWhatsappSession(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary dark:text-white"
                      placeholder={t.phoneNumberPlaceholder}
                    />
                    <Button variant="outline" onClick={handlePhoneChange}>
                      {t.updatePhone}
                    </Button>
                  </div>
                </div>

                {/* Session Stats */}
                {whatsappSession.isConnected && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <h4 className="font-semibold text-text-primary dark:text-white mb-4">{t.sessionStats}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-2xl font-bold text-primary">{whatsappSession.messagesSent}</p>
                        <p className="text-xs text-slate-500">{t.messagesSent}</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-2xl font-bold text-primary">{whatsappSession.messagesReceived}</p>
                        <p className="text-xs text-slate-500">{t.messagesReceived}</p>
                      </div>
                      <div className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                        <p className="text-lg font-bold text-primary">
                          {whatsappSession.lastConnected ? new Date(whatsappSession.lastConnected).toLocaleDateString('ar-MA') : '-'}
                        </p>
                        <p className="text-xs text-slate-500">{t.lastConnected}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {activeTab === 'team' && (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-text-primary dark:text-white text-2xl font-bold font-serif">{t.teamMembers}</h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddMember(true)}
                >
                  <span className="material-symbols-outlined text-sm ml-1">add</span>
                  {t.addMember}
                </Button>
              </div>

              {/* Add Member Form */}
              {showAddMember && (
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <h4 className="font-semibold text-text-primary dark:text-white mb-4">{t.addMember}</h4>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder={t.memberName}
                      value={newMember.name}
                      onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary dark:text-white"
                    />
                    <input
                      type="email"
                      placeholder={t.memberEmail}
                      value={newMember.email}
                      onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary dark:text-white"
                    />
                    <input
                      type="tel"
                      placeholder={t.memberPhone}
                      value={newMember.phone}
                      onChange={(e) => setNewMember(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary dark:text-white"
                    />
                    <select
                      value={newMember.role}
                      onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-primary dark:text-white"
                    >
                      <option value="superAdmin">{t.superAdmin}</option>
                      <option value="manager">{t.manager}</option>
                      <option value="viewer">{t.viewer}</option>
                    </select>
                    <div className="flex gap-3">
                      <Button variant="primary" onClick={handleAddMember}>
                        {t.saveMember}
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddMember(false)}>
                        {t.cancel}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Team Members List */}
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">person</span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary dark:text-white">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getRoleBadge(member.role)}
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'profile' && (
            <Card padding="lg">
              <h3 className="text-text-primary dark:text-white text-2xl font-bold mb-6">{t.associationProfile}</h3>
              <div className="space-y-5">
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.organizationName}
                  </span>
                  <input
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange('organizationName', e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.email}
                  </span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.phone}
                  </span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.address}
                  </span>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mr-1">
                    {t.description}
                  </span>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
                  />
                </label>
                <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
                  {t.saveChanges}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card padding="lg">
              <h3 className="text-text-primary dark:text-white text-2xl font-bold mb-6">{t.notificationRules}</h3>
              <div className="space-y-4">
                <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
                  <h4 className="font-semibold text-text-primary dark:text-white mb-3">{t.donationAlerts}</h4>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">notifications</span>
                      <span className="text-text-primary dark:text-white">{t.newDonation}</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('newDonation', !formData.newDonation)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        formData.newDonation ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                        formData.newDonation ? 'left-0.5' : 'right-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">verified</span>
                      <span className="text-text-primary dark:text-white">{t.donationVerified}</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('donationVerified', !formData.donationVerified)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        formData.donationVerified ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                        formData.donationVerified ? 'left-0.5' : 'right-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-text-primary dark:text-white mb-3">{t.emailNotifications}</h4>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl mb-3">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">email</span>
                      <span className="text-text-primary dark:text-white">{t.weeklyReports}</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('weeklyReports', !formData.weeklyReports)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        formData.weeklyReports ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                        formData.weeklyReports ? 'left-0.5' : 'right-0.5'
                      }`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-slate-500">calendar_month</span>
                      <span className="text-text-primary dark:text-white">{t.monthlyReports}</span>
                    </div>
                    <button
                      onClick={() => handleInputChange('monthlyReports', !formData.monthlyReports)}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        formData.monthlyReports ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                        formData.monthlyReports ? 'left-0.5' : 'right-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
                  {t.saveChanges}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
