import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return isMobile;
};

// ============================================
// CONTACT PAGE - Two Column Layout with Form
// ============================================

const COPY = {
  ar: {
    hero_badge: 'CONTACT US · تواصل معنا',
    hero_title: 'تواصل معنا',
    hero_sub: 'نحن هنا للإجابة على جميع استفساراتك — فريقنا يرد في غضون 24 ساعة',
    form_badge: 'SEND MESSAGE',
    form_title: 'أرسل لنا رسالة',
    form_sub: 'سواء كان لديك سؤال حول التبرع، أو مشروع، أو الكفالة — نحن نسمعك',
    name: 'الاسم الكامل *',
    phone: 'رقم الهاتف *',
    email: 'البريد الإلكتروني',
    subject: 'موضوع الرسالة *',
    message: 'رسالتك *',
    name_ph: 'محمد العلوي',
    subject_ph: 'استفسار حول التبرع',
    message_ph: 'اكتب رسالتك هنا...',
    send: 'إرسال الرسالة 📨',
    sending: 'جاري الإرسال...',
    privacy: '🔒 بياناتك محمية ولن تُشارك مع أي طرف ثالث',
    sent_title: 'تم إرسال رسالتك بنجاح!',
    sent_body: 'شكراً على تواصلك معنا — سيقوم فريقنا بالرد عليك في غضون 24 ساعة على أبعد تقدير',
    send_another: 'إرسال رسالة أخرى',
    info_badge: 'CONTACT INFO',
    info_title: 'معلومات التواصل',
    hours_title: '⏰ أوقات العمل',
    mon_fri: 'الاثنين — الجمعة',
    sat: 'السبت',
    sun: 'الأحد',
    closed: 'مغلق',
    map_label: 'حي الرياض، الرباط، المغرب',
    map_click: 'انقر لعرض الخريطة',
  },
  fr: {
    hero_badge: 'CONTACTEZ-NOUS',
    hero_title: 'Contactez-nous',
    hero_sub: 'Notre équipe est disponible pour répondre à toutes vos questions sous 24 heures.',
    form_badge: 'ENVOYER UN MESSAGE',
    form_title: 'Envoyez-nous un message',
    form_sub: 'Vous avez une question sur un don, un projet ou la kafala ? Nous vous écoutons.',
    name: 'Nom complet *',
    phone: 'Téléphone *',
    email: 'Adresse e-mail',
    subject: 'Sujet *',
    message: 'Votre message *',
    name_ph: 'Mohammed Al-Alawi',
    subject_ph: 'Question sur les dons',
    message_ph: 'Écrivez votre message ici...',
    send: 'Envoyer le message 📨',
    sending: 'Envoi en cours...',
    privacy: '🔒 Vos données sont protégées et ne seront pas partagées.',
    sent_title: 'Message envoyé avec succès !',
    sent_body: 'Merci de nous avoir contactés — notre équipe vous répondra dans les 24 heures.',
    send_another: 'Envoyer un autre message',
    info_badge: 'COORDONNÉES',
    info_title: 'Informations de contact',
    hours_title: '⏰ Heures d\'ouverture',
    mon_fri: 'Lundi — Vendredi',
    sat: 'Samedi',
    sun: 'Dimanche',
    closed: 'Fermé',
    map_label: 'Quartier Riad, Rabat, Maroc',
    map_click: 'Cliquez pour voir la carte',
  },
  en: {
    hero_badge: 'CONTACT US',
    hero_title: 'Contact Us',
    hero_sub: 'We\'re here to answer all your questions — our team replies within 24 hours.',
    form_badge: 'SEND A MESSAGE',
    form_title: 'Send us a message',
    form_sub: 'Whether you have a question about donations, a project, or kafala — we\'re listening.',
    name: 'Full Name *',
    phone: 'Phone Number *',
    email: 'Email Address',
    subject: 'Subject *',
    message: 'Your Message *',
    name_ph: 'Mohammed Al-Alawi',
    subject_ph: 'Question about donations',
    message_ph: 'Write your message here...',
    send: 'Send Message 📨',
    sending: 'Sending...',
    privacy: '🔒 Your data is protected and will not be shared.',
    sent_title: 'Message sent successfully!',
    sent_body: 'Thank you for contacting us — our team will reply within 24 hours.',
    send_another: 'Send Another Message',
    info_badge: 'CONTACT INFO',
    info_title: 'Contact Information',
    hours_title: '⏰ Working Hours',
    mon_fri: 'Monday — Friday',
    sat: 'Saturday',
    sun: 'Sunday',
    closed: 'Closed',
    map_label: 'Riad District, Rabat, Morocco',
    map_click: 'Click to view map',
  },
};

const Contact = () => {
  const { language } = useApp();
  const isMobile = useIsMobile();
  const c = COPY[language] || COPY.ar;
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const submitContact = useMutation(api.contact.submitContactMessage);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.message.trim()) return;
    setIsSubmitting(true);
    try {
      await submitContact({
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        subject: formData.subject || undefined,
        message: formData.message,
      });
      setIsSubmitted(true);
      setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error('Contact form failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    height: 52,
    padding: '0 16px',
    border: '1.5px solid #E5E9EB',
    borderRadius: 12,
    fontFamily: 'Tajawal, sans-serif',
    fontSize: 14,
    color: '#0e1a1b',
    background: 'white',
    outline: 'none',
  };

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#0e1a1b', marginBottom: 7 };

  const infoItems = [
    { icon: '📞', label: { ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' }[language] || 'الهاتف', value: '+212 5 37 XX XX XX', sub: { ar: 'متاح من 9ص إلى 5م', fr: 'Disponible 9h–17h', en: 'Available 9am–5pm' }[language] || 'متاح من 9ص إلى 5م' },
    { icon: '💬', label: 'WhatsApp', value: '+212 6 XX XX XX XX', sub: { ar: 'رد سريع — متاح 24/7', fr: 'Réponse rapide — 24/7', en: 'Quick reply — 24/7' }[language] || 'رد سريع — متاح 24/7', highlight: true },
    { icon: '✉️', label: { ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' }[language] || 'البريد الإلكتروني', value: 'contact@ibtasim.ma', sub: { ar: 'رد خلال 24 ساعة', fr: 'Réponse sous 24h', en: 'Reply within 24h' }[language] || 'رد خلال 24 ساعة' },
    { icon: '📍', label: { ar: 'العنوان', fr: 'Adresse', en: 'Address' }[language] || 'العنوان', value: { ar: 'حي الرياض، الرباط', fr: 'Riad, Rabat', en: 'Riad, Rabat' }[language] || 'حي الرياض، الرباط', sub: { ar: 'المملكة المغربية 10000', fr: 'Maroc 10000', en: 'Morocco 10000' }[language] || 'المملكة المغربية 10000' },
  ];

  return (
    <div style={{ background: '#f6f8f8', minHeight: '100vh', fontFamily: 'Tajawal, sans-serif', color: '#0e1a1b', overflowX: 'hidden' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#052E2F,#0A5F62)', padding: isMobile ? '40px 20px' : '60px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: isMobile ? '0' : '0 28px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#33C0C0', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{c.hero_badge}</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: 'white', marginBottom: 12 }}>{c.hero_title}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,.7)', lineHeight: 1.7 }}>{c.hero_sub}</p>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: 1200, margin: isMobile ? '28px auto' : '60px auto', padding: isMobile ? '0 16px' : '0 28px', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? 20 : 48, alignItems: 'start' }}>

        {/* Form Card */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', padding: 36 }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <div style={{ width: 80, height: 80, background: '#D1FAE5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 20px' }}>✅</div>
              <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{c.sent_title}</div>
              <div style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, marginBottom: 24 }}>{c.sent_body}</div>
              <button
                onClick={() => setIsSubmitted(false)}
                style={{ height: 44, padding: '0 22px', borderRadius: 100, fontSize: 14, fontWeight: 600, background: '#E6F4F4', color: '#0A5F62', border: 'none', cursor: 'pointer', fontFamily: 'Tajawal, sans-serif' }}
              >
                {c.send_another}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>{c.form_badge}</div>
              <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{c.form_title}</h2>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 28, lineHeight: 1.6 }}>{c.form_sub}</p>

              {/* Name + Phone grid */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>{c.name}</label>
                  <input
                    style={inputStyle}
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={c.name_ph}
                    required
                  />
                </div>
                <div>
                  <label style={labelStyle}>{c.phone}</label>
                  <input
                    style={inputStyle}
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+212 6 XX XX XX XX"
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{c.email}</label>
                <input
                  style={inputStyle}
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@gmail.com"
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>{c.subject}</label>
                <input
                  style={inputStyle}
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder={c.subject_ph}
                  required
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>{c.message}</label>
                <textarea
                  style={{ width: '100%', padding: '14px 16px', border: '1.5px solid #E5E9EB', borderRadius: 12, fontFamily: 'Tajawal, sans-serif', fontSize: 14, color: '#0e1a1b', background: 'white', outline: 'none', resize: 'vertical', minHeight: 140, lineHeight: 1.7 }}
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={c.message_ph}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ width: '100%', height: 54, background: '#0d7477', color: 'white', border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 700, cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 14px rgba(13,116,119,.25)', fontFamily: 'Tajawal, sans-serif', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? c.sending : c.send}
              </button>
              <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>{c.privacy}</div>
            </form>
          )}
        </div>

        {/* Right side */}
        <div>
          {/* Contact Info Card */}
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E9EB', boxShadow: '0 2px 4px rgba(0,0,0,.03),0 4px 6px rgba(0,0,0,.05)', padding: 28, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: '#0d7477', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>{c.info_badge}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>{c.info_title}</div>
            {infoItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: i < infoItems.length - 1 ? 18 : 0, paddingBottom: i < infoItems.length - 1 ? 18 : 0, borderBottom: i < infoItems.length - 1 ? '1px solid #E5E9EB' : 'none' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F7F7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 3 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: item.highlight ? '#0d7477' : '#0e1a1b' }}>{item.value}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{item.sub}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Working Hours */}
          <div style={{ background: '#F0F7F7', borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>{c.hours_title}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 6 }}>
              <span>{c.mon_fri}</span><span style={{ color: '#0A5F62', fontWeight: 600 }}>9:00 — 17:00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 6 }}>
              <span>{c.sat}</span><span>9:00 — 13:00</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
              <span>{c.sun}</span><span style={{ color: '#94a3b8' }}>{c.closed}</span>
            </div>
          </div>

          {/* Map Placeholder */}
          <div
            onClick={() => window.open('https://maps.google.com/?q=الرباط،المغرب', '_blank')}
            style={{ background: 'linear-gradient(135deg,#E6F4F4,#F0F7F7)', borderRadius: 16, height: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid #E5E9EB', cursor: 'pointer' }}>
            <div style={{ fontSize: 36 }}>📍</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{c.map_label}</div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>{c.map_click}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
