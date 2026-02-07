import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button } from '../components';

// ============================================
// ABOUT PAGE - Mission, Vision & Team
// ============================================

const About = () => {
  const { t, language } = useApp();

  // Mission/Vision data
  const missionVision = {
    mission: {
      title: {
        en: 'Our Mission',
        fr: 'Notre Mission',
        ar: 'مهمتنا',
      },
      description: {
        en: 'To empower underprivileged communities across Morocco through sustainable development, education, and healthcare initiatives that create lasting positive change.',
        fr: 'Autonomiser les communautés défavorisées à travers le Maroc grâce au développement durable, à l\'éducation et aux initiatives de santé qui créent un changement positif durable.',
        ar: 'تمكين المجتمعات المحرومة في جميع أنحاء المغرب من خلال التنمية المستدامة ومبادرات التعليم والرعاية الصحية التي تخلق تغييراً إيجابياً دائماً.',
      },
      icon: 'target',
    },
    vision: {
      title: {
        en: 'Our Vision',
        fr: 'Notre Vision',
        ar: 'رؤيتنا',
      },
      description: {
        en: 'A Morocco where every child has access to quality education, clean water, and healthcare, regardless of their geographic or economic circumstances.',
        fr: 'Un Maroc où chaque enfant a accès à une éducation de qualité, à de l\'eau propre et à des soins de santé, indépendamment de ses circonstances géographiques ou économiques.',
        ar: 'مغرب حيث يتمتع كل طفل بالوصول إلى التعليم الجيد والمياه النظيفة والرعاية الصحية، بغض النظر عن ظروفه الجغرافية أو الاقتصادية.',
      },
      icon: 'visibility',
    },
  };

  // Values data
  const values = [
    {
      icon: 'favorite',
      title: {
        en: 'Compassion',
        fr: 'Compassion',
        ar: 'الرحمة',
      },
      description: {
        en: 'We lead with empathy and understanding for those in need.',
        fr: 'Nous dirigeons avec empathie et compréhension pour ceux qui sont dans le besoin.',
        ar: 'نقود بالتعاطف والفهم لمن هم في حاجة.',
      },
    },
    {
      icon: 'verified',
      title: {
        en: 'Integrity',
        fr: 'Intégrité',
        ar: 'النزاهة',
      },
      description: {
        en: '100% transparency in all our operations and financial reporting.',
        fr: '100% de transparence dans toutes nos opérations et rapports financiers.',
        ar: '100% شفافية في جميع عملياتنا وتقاريرنا المالية.',
      },
    },
    {
      icon: 'groups',
      title: {
        en: 'Community',
        fr: 'Communauté',
        ar: 'المجتمع',
      },
      description: {
        en: 'Working hand-in-hand with local communities for sustainable impact.',
        fr: 'Travailler main dans la main avec les communautés locales pour un impact durable.',
        ar: 'العمل جنباً إلى جنب مع المجتمعات المحلية لتحقيق تأثير مستدام.',
      },
    },
    {
      icon: 'eco',
      title: {
        en: 'Sustainability',
        fr: 'Durabilité',
        ar: 'الاستدامة',
      },
      description: {
        en: 'Building solutions that last for generations to come.',
        fr: 'Construire des solutions qui durent pour les générations à venir.',
        ar: 'بناء حلول تدوم للأجيال القادمة.',
      },
    },
  ];

  // Team data
  const team = [
    {
      name: 'Youssef Alami',
      role: {
        en: 'Founder & CEO',
        fr: 'Fondateur & PDG',
        ar: 'المؤسس والرئيس التنفيذي',
      },
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    },
    {
      name: 'Fatima Zahra',
      role: {
        en: 'Operations Director',
        fr: 'Directrice des Opérations',
        ar: 'مديرة العمليات',
      },
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    },
    {
      name: 'Omar Benkirane',
      role: {
        en: 'Programs Manager',
        fr: 'Responsable des Programmes',
        ar: 'مدير البرامج',
      },
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    },
  ];

  // Timeline/Achievements
  const achievements = [
    {
      year: '2018',
      title: {
        en: 'Founded',
        fr: 'Fondation',
        ar: 'التأسيس',
      },
      description: {
        en: 'Started with a small water project in rural Atlas.',
        fr: 'Commencé avec un petit projet d\'eau dans l\'Atlas rural.',
        ar: 'بدأنا بمشروع مياه صغير في الأطلس الريفي.',
      },
    },
    {
      year: '2020',
      title: {
        en: '100th School',
        fr: '100ème École',
        ar: 'المدرسة 100',
      },
      description: {
        en: 'Completed our 100th classroom renovation project.',
        fr: 'Projet de rénovation de notre 100ème salle de classe terminé.',
        ar: 'أكملنا مشروع تجديد الفصل الدراسي الـ100.',
      },
    },
    {
      year: '2023',
      title: {
        en: '18,000 Lives',
        fr: '18,000 Vies',
        ar: '18,000 حياة',
      },
      description: {
        en: 'Reached milestone of touching 18,000 lives across Morocco.',
        fr: 'Jalon de 18 000 vies touchées à travers le Maroc.',
        ar: 'وصلنا إلى 18,000 حياة تم لمسها في جميع أنحاء المغرب.',
      },
    },
  ];

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en;
  };

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 pt-4">
        <div
          className="relative min-h-[400px] rounded-xl overflow-hidden flex flex-col justify-end p-8 bg-cover bg-center shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(13, 116, 119, 0.1), rgba(13, 116, 119, 0.9)), url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80")`,
          }}
        >
          <div className="space-y-4 max-w-lg">
            <span className="text-white/80 text-sm font-medium uppercase tracking-widest">
              {language === 'ar' ? 'من نحن' : language === 'fr' ? 'Qui Sommes-Nous' : 'Who We Are'}
            </span>
            <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight">
              {language === 'ar' ? 'جمعية الأمل' : language === 'fr' ? 'Association Espoir' : 'Association Espoir'}
            </h1>
            <p className="text-white/90 text-lg font-medium leading-relaxed max-w-[400px]">
              {language === 'ar'
                ? 'نخلق فرقاً حقيقياً في حياة الناس منذ عام 2018.'
                : language === 'fr'
                ? 'Nous faisons une différence réelle dans la vie des gens depuis 2018.'
                : 'Making a real difference in people\'s lives since 2018.'}
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-6 py-12 max-w-desktop mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {Object.entries(missionVision).map(([key, item]) => (
            <Card key={key} variant="default" padding="lg" className="flex flex-col">
              <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                <span className="material-symbols-outlined text-3xl">{item.icon}</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-3">
                {getLocalizedText(item.title)}
              </h3>
              <p className="text-text-secondary dark:text-text-white/70 leading-relaxed">
                {getLocalizedText(item.description)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="bg-bg-sage-light dark:bg-bg-dark-card/30 py-12 px-6">
        <div className="max-w-desktop mx-auto">
          <h2 className="text-center text-text-primary dark:text-white text-2xl md:text-3xl font-black mb-8">
            {language === 'ar' ? 'قيمنا الأساسية' : language === 'fr' ? 'Nos Valeurs Fondamentales' : 'Our Core Values'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {values.map((value, index) => (
              <Card key={index} variant="default" padding="lg" className="text-center">
                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                  <span className="material-symbols-outlined text-2xl">{value.icon}</span>
                </div>
                <h4 className="font-bold text-text-primary dark:text-white mb-2">
                  {getLocalizedText(value.title)}
                </h4>
                <p className="text-xs text-text-muted dark:text-text-white/60 leading-relaxed">
                  {getLocalizedText(value.description)}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline/Achievements */}
      <section className="px-6 py-12 max-w-desktop mx-auto">
        <h2 className="text-center text-text-primary dark:text-white text-2xl md:text-3xl font-black mb-8">
          {language === 'ar' ? 'مسيرتنا' : language === 'fr' ? 'Notre Parcours' : 'Our Journey'}
        </h2>
        <div className="space-y-6">
          {achievements.map((item, index) => (
            <Card key={index} variant="default" padding="md" className="flex items-center gap-4">
              <div className="size-16 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
                {item.year}
              </div>
              <div>
                <h4 className="font-bold text-text-primary dark:text-white">
                  {getLocalizedText(item.title)}
                </h4>
                <p className="text-sm text-text-secondary dark:text-text-white/70">
                  {getLocalizedText(item.description)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-bg-sage-light dark:bg-bg-dark-card/30 py-12 px-6">
        <div className="max-w-desktop mx-auto">
          <h2 className="text-center text-text-primary dark:text-white text-2xl md:text-3xl font-black mb-8">
            {language === 'ar' ? 'فريقنا' : language === 'fr' ? 'Notre Équipe' : 'Our Team'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, index) => (
              <Card key={index} variant="default" padding="none" className="overflow-hidden text-center">
                <div
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url("${member.image}")` }}
                />
                <div className="p-6">
                  <h4 className="font-bold text-text-primary dark:text-white text-lg">{member.name}</h4>
                  <p className="text-sm text-primary font-medium mt-1">
                    {getLocalizedText(member.role)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-white py-12 px-8 text-center">
        <div className="max-w-desktop mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">
            {language === 'ar'
              ? 'هل تريد أن تكون جزءاً من التغيير؟'
              : language === 'fr'
              ? 'Voulez-vous faire partie du changement?'
              : 'Want to be part of the change?'}
          </h3>
          <p className="text-white/80 text-base mb-8 max-w-md mx-auto">
            {language === 'ar'
              ? 'انضم إلينا في مهمتنا لبناء مستقبل أفضل للمغرب.'
              : language === 'fr'
              ? 'Rejoignez-nous dans notre mission de construire un avenir meilleur pour le Maroc.'
              : 'Join us in our mission to build a brighter future for Morocco.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/projects">
              <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-slate-50">
                {language === 'ar' ? 'استكشف المشاريع' : language === 'fr' ? 'Explorer les Projets' : 'Explore Projects'}
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" size="lg" className="border-2 border-white text-white hover:bg-white/10">
                {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contactez-Nous' : 'Contact Us'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
