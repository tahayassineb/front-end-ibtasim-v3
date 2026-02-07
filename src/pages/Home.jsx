import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button, Badge, ProgressBar } from '../components';

// ============================================
// HOME PAGE - Premium Moroccan Style
// ============================================

const Home = () => {
  const { t, language } = useApp();

  // Featured projects data
  const featuredProjects = [
    {
      id: 1,
      title: {
        en: 'Clean Water Initiative',
        fr: 'Initiative Eau Propre',
        ar: 'مبادرة المياه النظيفة',
      },
      description: {
        en: 'Providing sustainable water sources to remote Atlas mountain communities.',
        fr: 'Fourniture de sources d\'eau durables aux communautés reculées des montagnes de l\'Atlas.',
        ar: 'توفير مصادر مياه مستدامة لمجتمعات جبال الأطلس النائية.',
      },
      status: 'active',
      raised: 42500,
      goal: 50000,
      progress: 85,
      image: 'https://images.unsplash.com/photo-1538300342682-cf57afb97285?w=800&q=80',
    },
    {
      id: 2,
      title: {
        en: 'Rural Education Hubs',
        fr: 'Centres d\'Éducation Rurale',
        ar: 'مراكز التعليم الريفي',
      },
      description: {
        en: 'Building classrooms and providing modern tools for children in overlooked regions.',
        fr: 'Construction de salles de classe et fourniture d\'outils modernes aux enfants des régions négligées.',
        ar: 'بناء الفصول الدراسية وتوفير الأدوات الحديثة للأطفال في المناطق المهمشة.',
      },
      status: 'urgent',
      raised: 15200,
      goal: 34000,
      progress: 45,
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
    },
  ];

  // Impact stats data
  const impactStats = [
    {
      icon: 'school',
      value: '24',
      label: {
        en: 'Schools Built',
        fr: 'Écoles Construites',
        ar: 'مدرسة مبنية',
      },
    },
    {
      icon: 'water_drop',
      value: '120+',
      label: {
        en: 'Wells Dug',
        fr: 'Puits Creusés',
        ar: 'بئر محفور',
      },
    },
    {
      icon: 'medical_services',
      value: '5k+',
      label: {
        en: 'Medical Kits',
        fr: 'Trousseaux Médicaux',
        ar: 'عدة طبية',
      },
    },
    {
      icon: 'restaurant',
      value: '50k',
      label: {
        en: 'Meals Served',
        fr: 'Repas Servis',
        ar: 'وجبة مغذية',
      },
    },
  ];

  const getLocalizedText = (obj) => {
    if (typeof obj === 'string') return obj;
    return obj[language] || obj.en;
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
        return 'primary';
      case 'urgent':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen">
      {/* Hero Section with Gradient Overlay */}
      <section className="relative px-4 pt-4">
        <div
          className="relative min-h-[520px] rounded-xl overflow-hidden flex flex-col justify-end p-8 bg-cover bg-center shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(13, 116, 119, 0.1), rgba(13, 116, 119, 0.9)), url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80")`,
          }}
        >
          <div className="space-y-6 max-w-lg">
            <div className="space-y-2">
              <h1 className="text-white text-4xl md:text-5xl font-black leading-tight tracking-tight">
                {language === 'ar' ? (
                  <>
                    <span dir="rtl">تمكين حياة المغاربة</span>
                    <br />
                    Empowering Lives
                  </>
                ) : language === 'fr' ? (
                  <>
                    Transformer des Vies
                    <br />
                    <span dir="rtl" className="font-arabic text-3xl">تمكين حياة المغاربة</span>
                  </>
                ) : (
                  <>
                    Empowering Lives
                    <br />
                    <span dir="rtl" className="font-arabic text-3xl">تمكين حياة المغاربة</span>
                  </>
                )}
              </h1>
              <p className="text-white/90 text-lg font-medium leading-relaxed max-w-[280px]">
                {language === 'ar'
                  ? 'نبني مستقبلاً مشرقاً لكل طفل في المغرب.'
                  : language === 'fr'
                  ? 'Construire un avenir meilleur pour chaque enfant au Maroc.'
                  : 'Building a brighter future for every child in Morocco.'}
              </p>
            </div>
            <div className="pt-2">
              <Link to="/projects">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary hover:bg-slate-50 shadow-xl"
                >
                  {language === 'ar'
                    ? 'ادعم مهمتنا'
                    : language === 'fr'
                    ? 'Soutenez Notre Mission'
                    : 'Support Our Mission'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats Card (Glassmorphism) */}
      <section className="relative -mt-8 px-8 z-10">
        <div className="bg-white/70 dark:bg-bg-dark-card/70 backdrop-blur-xl rounded-xl border border-white/20 dark:border-white/10 p-6 shadow-xl flex flex-col items-center justify-center text-center gap-1 max-w-sm mx-auto">
          <p className="text-text-muted dark:text-text-white/60 text-sm font-medium uppercase tracking-widest">
            {language === 'ar' ? 'التأثير العالمي' : language === 'fr' ? 'Impact Mondial' : 'Global Impact'}
          </p>
          <p className="text-primary dark:text-primary tracking-tight text-4xl font-black">18,000+</p>
          <p className="text-text-primary dark:text-white text-base font-semibold">
            {language === 'ar'
              ? 'حياة تغيرت في 2023'
              : language === 'fr'
              ? 'Vies Touchées en 2023'
              : 'Lives Touched in 2023'}
          </p>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="px-6 pt-12 pb-4 flex items-end justify-between max-w-desktop mx-auto">
        <div>
          <span className="text-primary font-bold text-xs uppercase tracking-widest block mb-1">
            {language === 'ar' ? 'برامجنا' : language === 'fr' ? 'Nos Programmes' : 'Our Programs'}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-text-primary dark:text-white">
            {language === 'ar' ? 'المشاريع المميزة' : language === 'fr' ? 'Projets en Vedette' : 'Featured Projects'}
          </h2>
        </div>
        <Link to="/projects" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
          {language === 'ar' ? 'عرض الكل' : language === 'fr' ? 'Voir Tout' : 'View All'}
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </Link>
      </section>

      <section className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12 max-w-desktop mx-auto">
        {featuredProjects.map((project) => (
          <Card key={project.id} variant="default" padding="none" className="overflow-hidden h-full flex flex-col">
            <div
              className="h-56 bg-cover bg-center"
              style={{ backgroundImage: `url("${project.image}")` }}
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-text-primary dark:text-white">
                  {getLocalizedText(project.title)}
                </h3>
                <Badge variant={getStatusVariant(project.status)}>
                  {project.status === 'active'
                    ? language === 'ar' ? 'نشط' : language === 'fr' ? 'Actif' : 'Active'
                    : project.status === 'urgent'
                    ? language === 'ar' ? 'عاجل' : language === 'fr' ? 'Urgent' : 'Urgent'
                    : project.status}
                </Badge>
              </div>
              <p className="text-text-secondary dark:text-text-white/70 text-sm leading-relaxed mb-6">
                {getLocalizedText(project.description)}
              </p>
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-text-muted">
                    {language === 'ar' ? 'تم جمع:' : language === 'fr' ? 'Collecté:' : 'Collected:'} ${project.raised.toLocaleString()}
                  </span>
                  <span className="text-primary">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} size="sm" />
              </div>
              <Link to={`/projects/${project.id}`} className="mt-auto">
                <Button fullWidth>
                  {language === 'ar' ? 'تبرع الآن' : language === 'fr' ? 'Faire un Don' : 'Donate Now'}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </section>

      {/* Stats Grid Section */}
      <section className="bg-bg-sage-light dark:bg-bg-dark-card/50 py-12 px-6">
        <div className="max-w-desktop mx-auto">
          <h2 className="text-center text-text-primary dark:text-white text-2xl md:text-3xl font-black mb-8">
            {language === 'ar'
              ? 'تأثير محلي مباشر'
              : language === 'fr'
              ? 'Impact Local Direct'
              : 'Direct Local Impact'}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {impactStats.map((stat, index) => (
              <Card key={index} variant="default" padding="lg" className="flex flex-col items-center text-center">
                <span className="material-symbols-outlined text-primary text-3xl mb-2">{stat.icon}</span>
                <p className="text-2xl md:text-3xl font-black text-text-primary dark:text-white">{stat.value}</p>
                <p className="text-xs text-text-muted font-medium mt-1">{getLocalizedText(stat.label)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Transparency Footer Section */}
      <section className="bg-primary text-white py-12 px-8 text-center">
        <div className="max-w-desktop mx-auto">
          <div className="mb-6">
            <span className="material-symbols-outlined text-5xl mb-4">verified</span>
            <h3 className="text-2xl md:text-3xl font-bold mb-2">
              {language === 'ar' ? 'الثقة والشفافية' : language === 'fr' ? 'Confiance et Transparence' : 'Trust & Transparency'}
            </h3>
            <p className="text-white/70 text-sm leading-relaxed max-w-xs mx-auto">
              {language === 'ar'
                ? 'نحن منظمة غير حكومية مسجلة ملتزمة بكفاءة التبرعات 100٪. كل درهم يهم.'
                : language === 'fr'
                ? 'Nous sommes une ONG enregistrée engagée envers 100% d\'efficacité des dons. Chaque dirham compte.'
                : 'We are a registered NGO committed to 100% donation efficiency. Every Dirham counts.'}
            </p>
          </div>
          <div className="flex justify-center gap-6 mb-8">
            <Link to="/about" className="text-white/80 hover:text-white underline text-sm">
              {language === 'ar' ? 'تقارير الشفافية' : language === 'fr' ? 'Rapports de Transparence' : 'Transparency Reports'}
            </Link>
            <Link to="/contact" className="text-white/80 hover:text-white underline text-sm">
              {language === 'ar' ? 'فريقنا' : language === 'fr' ? 'Notre Équipe' : 'Our Team'}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
