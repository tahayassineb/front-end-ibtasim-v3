import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button, Input } from '../components';

// ============================================
// CONTACT PAGE - Two Column Layout with Form
// ============================================

const Contact = () => {
  const { t, language } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  const translations = {
    title: {
      en: 'Get in Touch',
      fr: 'Contactez-Nous',
      ar: 'تواصل معنا',
    },
    subtitle: {
      en: 'Have questions about our missions in Morocco? Our team is here to help you make a difference.',
      fr: 'Vous avez des questions sur nos missions au Maroc? Notre équipe est là pour vous aider à faire la différence.',
      ar: 'هل لديك أسئلة حول مهماتنا في المغرب؟ فريقنا هنا لمساعدتك في إحداث فرق.',
    },
    nameLabel: {
      en: 'Full Name',
      fr: 'Nom Complet',
      ar: 'الاسم الكامل',
    },
    namePlaceholder: {
      en: 'Enter your name',
      fr: 'Entrez votre nom',
      ar: 'أدخل اسمك',
    },
    emailLabel: {
      en: 'Email Address',
      fr: 'Adresse Email',
      ar: 'عنوان البريد الإلكتروني',
    },
    emailPlaceholder: {
      en: 'example@domain.com',
      fr: 'exemple@domaine.com',
      ar: 'exemple@domain.com',
    },
    messageLabel: {
      en: 'Message',
      fr: 'Message',
      ar: 'الرسالة',
    },
    messagePlaceholder: {
      en: 'How can we help?',
      fr: 'Comment pouvons-nous aider?',
      ar: 'كيف يمكننا المساعدة؟',
    },
    submitButton: {
      en: 'Send Message',
      fr: 'Envoyer le Message',
      ar: 'إرسال الرسالة',
    },
    successMessage: {
      en: 'Thank you! Your message has been sent successfully.',
      fr: 'Merci! Votre message a été envoyé avec succès.',
      ar: 'شكراً! تم إرسال رسالتك بنجاح.',
    },
    emailContact: {
      en: 'hello@moroccocharity.org',
      fr: 'hello@moroccocharity.org',
      ar: 'hello@moroccocharity.org',
    },
    phoneContact: {
      en: '+212 5XX-XXXXXX',
      fr: '+212 5XX-XXXXXX',
      ar: '+212 5XX-XXXXXX',
    },
    hqOffice: {
      en: 'HQ Office',
      fr: 'Bureau Principal',
      ar: 'المكتب الرئيسي',
    },
    location: {
      en: 'Casablanca, Morocco',
      fr: 'Casablanca, Maroc',
      ar: 'الدار البيضاء، المغرب',
    },
  };

  const getLocalizedText = (obj) => obj[language] || obj.en;

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen">
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        {/* Left Side: Form Section */}
        <div className="w-full lg:w-1/2 p-6 lg:p-12 flex flex-col justify-start">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-primary tracking-tight text-[32px] font-bold leading-tight pb-2 pt-4">
              {getLocalizedText(translations.title)}
            </h1>
            <p className="text-text-secondary dark:text-text-white/70 text-base font-normal leading-relaxed pb-8 pt-1">
              {getLocalizedText(translations.subtitle)}
            </p>

            {isSubmitted ? (
              <Card className="p-8 text-center" variant="default">
                <div className="size-16 rounded-full bg-success/10 flex items-center justify-center text-success mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl">check_circle</span>
                </div>
                <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">
                  {language === 'ar' ? 'تم الإرسال!' : language === 'fr' ? 'Envoyé!' : 'Sent!'}
                </h3>
                <p className="text-text-secondary">{getLocalizedText(translations.successMessage)}</p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => setIsSubmitted(false)}
                >
                  {language === 'ar' ? 'إرسال رسالة أخرى' : language === 'fr' ? 'Envoyer un autre message' : 'Send another message'}
                </Button>
              </Card>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-primary dark:text-gray-200 text-sm font-semibold leading-normal">
                    {getLocalizedText(translations.nameLabel)}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full rounded-xl text-text-primary dark:text-white border-none bg-bg-sage-light dark:bg-white/5 focus:ring-2 focus:ring-primary/50 h-14 placeholder:text-text-muted px-4 text-base transition-all"
                    placeholder={getLocalizedText(translations.namePlaceholder)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-primary dark:text-gray-200 text-sm font-semibold leading-normal">
                    {getLocalizedText(translations.emailLabel)}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="form-input flex w-full rounded-xl text-text-primary dark:text-white border-none bg-bg-sage-light dark:bg-white/5 focus:ring-2 focus:ring-primary/50 h-14 placeholder:text-text-muted px-4 text-base transition-all"
                    placeholder={getLocalizedText(translations.emailPlaceholder)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-primary dark:text-gray-200 text-sm font-semibold leading-normal">
                    {getLocalizedText(translations.messageLabel)}
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="form-input flex w-full rounded-xl text-text-primary dark:text-white border-none bg-bg-sage-light dark:bg-white/5 focus:ring-2 focus:ring-primary/50 placeholder:text-text-muted p-4 text-base transition-all resize-none"
                    placeholder={getLocalizedText(translations.messagePlaceholder)}
                  />
                </div>
                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  loading={isSubmitting}
                  className="flex items-center justify-center gap-2 group"
                >
                  {getLocalizedText(translations.submitButton)}
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    send
                  </span>
                </Button>
              </form>
            )}

            {/* Contact Info */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">mail</span>
                <span className="text-sm font-medium">{getLocalizedText(translations.emailContact)}</span>
              </div>
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">call</span>
                <span className="text-sm font-medium">{getLocalizedText(translations.phoneContact)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Map/Visual Section */}
        <div className="hidden lg:flex w-1/2 relative bg-bg-sage-light dark:bg-bg-dark-card/30 border-l border-border-light dark:border-white/5 overflow-hidden">
          {/* Abstract Gradient Background */}
          <div className="absolute inset-0 opacity-20 dark:opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,#0d7478_0%,transparent_70%)]"></div>
          <div className="w-full h-full p-12 flex items-center justify-center">
            <div className="relative w-full h-[600px] rounded-3xl overflow-hidden shadow-2xl bg-white dark:bg-white/5 border border-white dark:border-white/10">
              {/* Stylized Map Placeholder */}
              <div className="absolute inset-0 bg-bg-sage-light dark:bg-bg-dark overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=1200&q=80"
                  alt="Map of Morocco"
                  className="w-full h-full object-cover opacity-60 grayscale brightness-110 dark:opacity-30 dark:grayscale-0"
                />
                {/* Custom Teal Pin */}
                <div className="absolute top-[60%] left-[45%] flex flex-col items-center">
                  <div className="bg-primary p-2 rounded-full shadow-lg shadow-primary/40 animate-pulse">
                    <span className="material-symbols-outlined text-white text-3xl">location_on</span>
                  </div>
                  <div className="mt-2 bg-white/90 dark:bg-bg-dark-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/20 shadow-xl">
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">
                      {getLocalizedText(translations.hqOffice)}
                    </p>
                    <p className="text-sm text-text-primary dark:text-white">
                      {getLocalizedText(translations.location)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Map View */}
        <div className="lg:hidden w-full h-64 relative bg-bg-sage-light overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80"
            alt="Map"
            className="w-full h-full object-cover grayscale opacity-50"
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="bg-primary p-2 rounded-full shadow-lg">
              <span className="material-symbols-outlined text-white text-4xl">location_on</span>
            </div>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-bg-dark-card/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/20 shadow-xl">
            <p className="text-xs font-bold text-primary uppercase tracking-widest text-center">
              {getLocalizedText(translations.hqOffice)}
            </p>
            <p className="text-sm text-text-primary dark:text-white text-center">
              {getLocalizedText(translations.location)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
