import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

// ============================================
// TEAM MEMBER MODAL COMPONENT
// ============================================
const TeamMemberModal = ({ isOpen, onClose, onSave, editingMember = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Viewer',
    phone: '',
    ...editingMember
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingMember?.id || Date.now(),
    });
    onClose();
  };

  const roles = ['Super Admin', 'Admin', 'Manager', 'Editor', 'Viewer'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <h3 className="text-lg font-bold text-text-primary dark:text-white">
            {editingMember ? 'Edit Team Member' : 'Add Team Member'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {editingMember ? 'Update team member details' : 'Add a new team member to your organization'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@espoir.org"
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Role *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Phone (Optional)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+212 5XX-XXXXXX"
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-text-primary dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
            >
              {editingMember ? 'Save Changes' : 'Add Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================
// ADMIN SETTINGS PAGE - System Configuration
// ============================================

const AdminSettings = () => {
  const { currentLanguage, isDarkMode, toggleDarkMode, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('bank');
  
  // Team members state
  const [teamMembers, setTeamMembers] = useState([
    { id: 1, name: 'Admin User', email: 'admin1@espoir.org', role: 'Super Admin', phone: '' },
    { id: 2, name: 'Manager User', email: 'manager@espoir.org', role: 'Manager', phone: '' },
    { id: 3, name: 'Viewer User', email: 'viewer@espoir.org', role: 'Viewer', phone: '' },
  ]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  const handleAddMember = (member) => {
    if (editingMember) {
      setTeamMembers(prev => prev.map(m => m.id === member.id ? member : m));
      showToast('Team member updated successfully', 'success');
    } else {
      setTeamMembers(prev => [...prev, member]);
      showToast('Team member added successfully', 'success');
    }
    setEditingMember(null);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleDeleteMember = (id) => {
    setTeamMembers(prev => prev.filter(m => m.id !== id));
    showToast('Team member removed', 'info');
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
  };

  // Translations
  const translations = {
    ar: {
      title: 'إعدادات النظام',
      bankManagement: 'إدارة البنك',
      bankDescription: 'تكوين تفاصيل RIB الآمنة لمعالجة التبرعات.',
      accountHolder: 'اسم صاحب الحساب',
      rib: 'RIB',
      ribHint: 'رقم الحساب البنكي المغربي القياسي المكون من 24 رقماً',
      bankName: 'اسم البنك',
      securityNote: 'تتطلب التغييرات المصادقة متعددة العوامل. سيتم إرسال تنبيهات الإشعارات إلى دائرة المشرفين.',
      saveChanges: 'حفظ التغييرات',
      settingsNav: 'التنقل في الإعدادات',
      associationProfile: 'ملف الجمعية',
      adminAccess: 'وصول المشرف',
      notificationRules: 'قواعد الإشعارات',
      paymentMethods: 'طرق الدفع',
      generalSettings: 'إعدادات عامة',
      darkMode: 'الوضع الداكن',
      language: 'اللغة',
      notifications: 'الإشعارات',
      emailNotifications: 'إشعارات البريد الإلكتروني',
      smsNotifications: 'إشعارات الرسائل القصيرة',
    },
    fr: {
      title: 'Paramètres Système',
      bankManagement: 'Gestion Bancaire',
      bankDescription: 'Configurer les détails RIB sécurisés pour le traitement des dons.',
      accountHolder: 'Nom du Titulaire',
      rib: 'RIB',
      ribHint: 'Relevé d\'Identité Bancaire marocain standard de 24 chiffres',
      bankName: 'Nom de la Banque',
      securityNote: 'Les modifications nécessitent une authentification multi-facteurs. Les alertes seront envoyées au cercle des administrateurs.',
      saveChanges: 'Enregistrer les Modifications',
      settingsNav: 'Navigation des Paramètres',
      associationProfile: 'Profil de l\'Association',
      adminAccess: 'Accès Admin',
      notificationRules: 'Règles de Notification',
      paymentMethods: 'Méthodes de Paiement',
      generalSettings: 'Paramètres Généraux',
      darkMode: 'Mode Sombre',
      language: 'Langue',
      notifications: 'Notifications',
      emailNotifications: 'Notifications Email',
      smsNotifications: 'Notifications SMS',
    },
    en: {
      title: 'System Settings',
      bankManagement: 'Bank Management',
      bankDescription: 'Configure the secure RIB details for donation processing.',
      accountHolder: 'Account Holder Name',
      rib: 'RIB',
      ribHint: 'Standard 24-digit Moroccan Relevé d\'Identité Bancaire',
      bankName: 'Bank Name',
      securityNote: 'Changes require MFA. Notification alerts will be sent to the admin circle.',
      saveChanges: 'Save Changes',
      settingsNav: 'Settings Navigation',
      associationProfile: 'Association Profile',
      adminAccess: 'Admin Access',
      notificationRules: 'Notification Rules',
      paymentMethods: 'Payment Methods',
      generalSettings: 'General Settings',
      darkMode: 'Dark Mode',
      language: 'Language',
      notifications: 'Notifications',
      emailNotifications: 'Email Notifications',
      smsNotifications: 'SMS Notifications',
    },
  };

  const t = translations[currentLanguage?.code] || translations.en;

  // Form state
  const [formData, setFormData] = useState({
    accountHolder: 'Association Espoir',
    rib: '181 330 2111122223333444 55',
    bankName: 'Attijariwafa Bank',
    emailNotifications: true,
    smsNotifications: false,
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // Save logic here
    alert('Settings saved successfully!');
  };

  const settingsTabs = [
    { id: 'bank', icon: 'account_balance', label: t.bankManagement },
    { id: 'profile', icon: 'corporate_fare', label: t.associationProfile },
    { id: 'access', icon: 'admin_panel_settings', label: t.adminAccess },
    { id: 'notifications', icon: 'notifications_active', label: t.notificationRules },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
                  <span className="flex-1 font-semibold text-[15px] text-left">{tab.label}</span>
                  <span className={`material-symbols-outlined text-[20px] ${activeTab === tab.id ? 'text-primary' : 'text-slate-300'}`}>
                    chevron_right
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
                    isDarkMode ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
              
              {/* Language Selector */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">{t.language}</span>
                <select 
                  className="text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-text-primary dark:text-white"
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
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
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">
                    {t.accountHolder}
                  </span>
                  <input
                    type="text"
                    value={formData.accountHolder}
                    onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-text-primary dark:text-white shadow-sm"
                    placeholder="Association Espoir"
                  />
                </label>

                {/* RIB */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">
                    {t.rib}
                  </span>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.rib}
                      onChange={(e) => handleInputChange('rib', e.target.value)}
                      className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 font-mono text-text-primary dark:text-white shadow-sm pr-12"
                      placeholder="000 000 0000000000000000 00"
                    />
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary/40 text-xl">lock</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 ml-1">{t.ribHint}</p>
                </label>

                {/* Bank Name */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider ml-1">
                    {t.bankName}
                  </span>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 text-text-primary dark:text-white shadow-sm"
                    placeholder="Bank Name"
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

          {activeTab === 'profile' && (
            <Card padding="lg">
              <h3 className="text-text-primary dark:text-white text-xl font-bold mb-6">{t.associationProfile}</h3>
              <div className="space-y-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Organization Name</span>
                  <input
                    type="text"
                    defaultValue="Association Espoir"
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Email</span>
                  <input
                    type="email"
                    defaultValue="contact@espoir.org"
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Phone</span>
                  <input
                    type="tel"
                    defaultValue="+212 5XX-XXXXXX"
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-base text-text-primary dark:text-white"
                  />
                </label>
                <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
                  {t.saveChanges}
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'access' && (
            <Card padding="lg">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-text-primary dark:text-white text-xl font-bold">{t.adminAccess}</h3>
                <span className="text-sm text-slate-500">{teamMembers.length} members</span>
              </div>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary">person</span>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary dark:text-white">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.email}</p>
                        {member.phone && (
                          <p className="text-xs text-slate-400">{member.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={member.role === 'Super Admin' ? 'success' : member.role === 'Admin' ? 'primary' : 'neutral'}
                        size="sm"
                      >
                        {member.role}
                      </Badge>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-error hover:bg-error/10 transition-colors"
                          title="Remove"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  icon="add"
                  onClick={handleOpenAddModal}
                >
                  Add Team Member
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card padding="lg">
              <h3 className="text-text-primary dark:text-white text-xl font-bold mb-6">{t.notificationRules}</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500">email</span>
                    <span className="text-text-primary dark:text-white">{t.emailNotifications}</span>
                  </div>
                  <button
                    onClick={() => handleInputChange('emailNotifications', !formData.emailNotifications)}
                    className={`w-11 h-6 rounded-full relative transition-colors ${
                      formData.emailNotifications ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                      formData.emailNotifications ? 'right-0.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500">sms</span>
                    <span className="text-text-primary dark:text-white">{t.smsNotifications}</span>
                  </div>
                  <button
                    onClick={() => handleInputChange('smsNotifications', !formData.smsNotifications)}
                    className={`w-11 h-6 rounded-full relative transition-colors ${
                      formData.smsNotifications ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${
                      formData.smsNotifications ? 'right-0.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>
                <Button variant="primary" size="lg" fullWidth onClick={handleSave}>
                  {t.saveChanges}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
      
      {/* Team Member Modal */}
      <TeamMemberModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleAddMember}
        editingMember={editingMember}
      />
    </div>
  );
};

export default AdminSettings;
