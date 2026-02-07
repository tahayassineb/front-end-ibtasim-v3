import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';

// ============================================
// ADMIN DONOR DETAIL PAGE - Donor Profile & CRM
// ============================================

const AdminDonorDetail = () => {
  const { id } = useParams();
  const { currentLanguage } = useApp();

  // Translations
  const translations = {
    ar: {
      back: 'العودة للمتبرعين',
      profile: 'ملف المتبرع',
      totalDonated: 'إجمالي التبرعات',
      donorSince: 'متبرع منذ',
      call: 'اتصال',
      email: 'بريد إلكتروني',
      whatsapp: 'واتساب',
      donationHistory: 'سجل التبرعات',
      viewAll: 'عرض الكل',
      communicationLog: 'سجل التواصل',
      whatsappOutbound: 'واتساب صادر',
      sendMessage: 'إرسال رسالة واتساب',
      success: 'نجاح',
      months: [
        'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
      ],
    },
    fr: {
      back: 'Retour aux Donateurs',
      profile: 'Profil du Donateur',
      totalDonated: 'Total Donné',
      donorSince: 'Donateur depuis',
      call: 'Appeler',
      email: 'Email',
      whatsapp: 'WhatsApp',
      donationHistory: 'Historique des Dons',
      viewAll: 'Voir Tout',
      communicationLog: 'Journal de Communication',
      whatsappOutbound: 'WhatsApp Sortant',
      sendMessage: 'Envoyer Message WhatsApp',
      success: 'SUCCÈS',
      months: [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ],
    },
    en: {
      back: 'Back to Donors',
      profile: 'Donor Profile',
      totalDonated: 'Total Donated',
      donorSince: 'Donor since',
      call: 'Call',
      email: 'Email',
      whatsapp: 'WhatsApp',
      donationHistory: 'Donation History',
      viewAll: 'View All',
      communicationLog: 'Communication Log',
      whatsappOutbound: 'WhatsApp Outbound',
      sendMessage: 'Send WhatsApp Message',
      success: 'SUCCESS',
      months: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
    },
  };

  const t = translations[currentLanguage.code] || translations.en;

  // Mock donor data
  const donor = {
    id: parseInt(id) || 1,
    name: 'Jean Dupont',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    email: 'jean.dupont@email.com',
    phone: '+33 6 12 34 56 78',
    totalDonated: 5420,
    donorSince: '2022-01-12',
    tier: 'gold',
  };

  // Mock donation history
  const donationHistory = [
    { id: 1, amount: 500, project: 'Annual Gala 2023', date: '2023-10-24', status: 'success' },
    { id: 2, amount: 1200, project: 'Winter Shelter Drive', date: '2023-01-05', status: 'success' },
    { id: 3, amount: 150, project: 'Monthly Subscription', date: '2022-12-01', status: 'success' },
  ];

  // Mock communication log
  const communications = [
    {
      id: 1,
      type: 'whatsapp',
      direction: 'outbound',
      message: 'Bonjour Jean, merci encore pour votre don généreux pour le Gala de l\'espoir. Nous aimerions vous inviter à notre prochaine réunion de...',
      date: 'Yesterday, 14:20',
      read: true,
    },
    {
      id: 2,
      type: 'whatsapp',
      direction: 'outbound',
      message: 'Merci pour votre soutien! Votre reçu fiscal est disponible sur votre espace personnel.',
      date: 'Oct 24, 2023',
      read: true,
    },
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = t.months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const getProjectIcon = (project) => {
    if (project.includes('Gala')) return 'payments';
    if (project.includes('Winter')) return 'volunteer_activism';
    if (project.includes('Subscription')) return 'footprint';
    return 'payments';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      {/* Back Button */}
      <Link
        to="/admin/donors"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back</span>
        <span>{t.back}</span>
      </Link>

      {/* Profile Header */}
      <div className="flex flex-col items-center gap-4 pt-2">
        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full h-32 w-32 border-4 border-white dark:border-slate-800 shadow-lg"
          style={{ backgroundImage: `url('${donor.avatar}')` }}
        />
        <div className="text-center">
          <h1 className="text-text-primary dark:text-white text-2xl font-bold leading-tight">{donor.name}</h1>
          <p className="text-primary font-bold text-xl leading-normal mt-1">
            €{donor.totalDonated.toLocaleString()}.00 {t.totalDonated}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {t.donorSince} {formatDate(donor.donorSince)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <button className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800/40 p-3 rounded-2xl shadow-sm cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors">
          <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3">
            <span className="material-symbols-outlined text-primary">call</span>
          </div>
          <p className="text-text-primary dark:text-slate-100 text-xs font-semibold">{t.call}</p>
        </button>
        <a 
          href={`mailto:${donor.email}`}
          className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800/40 p-3 rounded-2xl shadow-sm cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors"
        >
          <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3">
            <span className="material-symbols-outlined text-primary">mail</span>
          </div>
          <p className="text-text-primary dark:text-slate-100 text-xs font-semibold">{t.email}</p>
        </a>
        <a 
          href={`https://wa.me/${donor.phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 bg-white dark:bg-slate-800/40 p-3 rounded-2xl shadow-sm cursor-pointer border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors"
        >
          <div className="rounded-full bg-primary/10 dark:bg-primary/20 p-3">
            <span className="material-symbols-outlined text-primary">chat</span>
          </div>
          <p className="text-text-primary dark:text-slate-100 text-xs font-semibold">{t.whatsapp}</p>
        </a>
      </div>

      {/* Donation History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary dark:text-white text-xl font-bold">{t.donationHistory}</h2>
          <Link to="/admin/donations" className="text-primary text-sm font-semibold hover:underline">
            {t.viewAll}
          </Link>
        </div>

        <Card padding="none" className="overflow-hidden">
          {donationHistory.map((donation, index) => (
            <div
              key={donation.id}
              className={`flex items-center gap-4 px-4 min-h-[72px] py-3 justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                index !== 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-primary flex items-center justify-center rounded-lg bg-primary/10 dark:bg-primary/20 shrink-0 size-12">
                  <span className="material-symbols-outlined">{getProjectIcon(donation.project)}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <p className="text-text-primary dark:text-white text-base font-bold">€{donation.amount.toFixed(2)}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs">{donation.project}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-slate-400 text-[10px] mb-1">{formatDate(donation.date)}</p>
                <Badge variant="success" size="sm" className="text-[10px]">{t.success}</Badge>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Communication Log */}
      <div>
        <h2 className="text-text-primary dark:text-white text-xl font-bold mb-4">{t.communicationLog}</h2>

        <div className="space-y-4">
          {communications.map((comm) => (
            <Card key={comm.id} padding="md" className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">chat_bubble</span>
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{t.whatsappOutbound}</span>
                </div>
                <span className="text-[10px] text-slate-400">{comm.date}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{comm.message}"</p>
              {comm.read && (
                <div className="mt-2 flex items-center justify-end">
                  <span className="material-symbols-outlined text-primary text-sm">done_all</span>
                </div>
              )}
            </Card>
          ))}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon="send"
            className="shadow-lg mt-4"
          >
            {t.sendMessage}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDonorDetail;
