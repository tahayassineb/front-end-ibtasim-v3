import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Card, Button, Badge, ProgressBar } from '../components';

// ============================================
// HOME PAGE - New Design with Logo and "ابتسم" Brand
// ============================================

const Home = () => {
  const { language } = useApp();
  const [activeProjects, setActiveProjects] = useState([]);
  const [impactStats, setImpactStats] = useState({
    families: 0,
    donors: 0,
    amount: 0,
    projects: 0
  });

  // Logo URL
  const logoUrl = 'https://nlfixnhoufntbbcccnwr.supabase.co/storage/v1/object/public/campaigns/Gemini_Generated_Image_7ce0up7ce0up7ce0-Photoroom%20(1).png';

  // Load projects and stats from localStorage
  useEffect(() => {
    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
      const projects = JSON.parse(storedProjects);
      // Get active/ongoing projects
      const active = projects.filter(p => p.status === 'active' || p.status === 'ongoing').slice(0, 3);
      setActiveProjects(active);
    }

    // Calculate stats from localStorage
    const donations = JSON.parse(localStorage.getItem('donations') || '[]');
    const donors = JSON.parse(localStorage.getItem('donors') || '[]');
    const allProjects = JSON.parse(localStorage.getItem('projects') || '[]');
    
    const totalAmount = donations.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
    
    setImpactStats({
      families: allProjects.reduce((sum, p) => sum + (p.familiesCount || 0), 0) || 156,
      donors: donors.length || 1200,
      amount: totalAmount || 2500000,
      projects: allProjects.filter(p => p.status === 'completed').length || 89
    });
  }, []);

  // Three Pillars Data
  const pillars = [
    {
      id: 1,
      icon: 'psychology',
      title: 'النفسية',
      titleFr: 'Psychologique',
      description: 'دعم نفسي شامل للأيتام لبناء شخصية قوية ومتوازنة',
      color: 'bg-rose-500'
    },
    {
      id: 2,
      icon: 'school',
      title: 'التعليمية',
      titleFr: 'Éducative',
      description: 'توفير التعليم الجيد والدعم الدراسي لضمان مستقبل مشرق',
      color: 'bg-blue-500'
    },
    {
      id: 3,
      icon: 'groups',
      title: 'الاجتماعية',
      titleFr: 'Sociale',
      description: 'دمج الأيتام في المجتمع وتعزيز روح التعاون والانتماء',
      color: 'bg-emerald-500'
    }
  ];

  // Journey Timeline Data
  const journeySteps = [
    {
      step: 1,
      icon: 'family_restroom',
      title: 'استضافة الأسرة',
      description: 'نستقبل الأيتام في بيئة عائلية دافئة تحتضنهم بالحب والرعاية'
    },
    {
      step: 2,
      icon: 'local_florist',
      title: 'النمو الشامل',
      description: 'نرعى نموهم عبر برامج متكاملة تشمل التعليم والصحة والنشاطات'
    },
    {
      step: 3,
      icon: 'school',
      title: 'التعليم العالي',
      description: 'ندعم مسيرتهم الجامعية والمهنية لضمان استقلالهم المستقبلي'
    },
    {
      step: 4,
      icon: 'work',
      title: 'النجاح المهني',
      description: 'نشارك في دمجهم في سوق العمل كأفراد منتجين وفعالين'
    }
  ];

  const getStatusVariant = (status) => {
    switch (status) {
      case 'active':
      case 'ongoing':
        return 'primary';
      case 'urgent':
        return 'warning';
      case 'completed':
        return 'success';
      default:
        return 'neutral';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      active: language === 'ar' ? 'نشط' : language === 'fr' ? 'Actif' : 'Active',
      ongoing: language === 'ar' ? 'مستمر' : language === 'fr' ? 'En cours' : 'Ongoing',
      urgent: language === 'ar' ? 'عاجل' : language === 'fr' ? 'Urgent' : 'Urgent',
      completed: language === 'ar' ? 'مكتمل' : language === 'fr' ? 'Terminé' : 'Completed'
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-MA' : language === 'fr' ? 'fr-MA' : 'en-US').format(amount);
  };

  return (
    <div className="bg-bg-light dark:bg-bg-dark min-h-screen" dir="rtl">
      {/* Navigation Bar with Logo */}
      <nav className="sticky top-0 z-50 bg-white/95 dark:bg-bg-dark-card/95 backdrop-blur-md shadow-sm">
        <div className="max-w-desktop mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <img 
                src={logoUrl} 
                alt="جمعية ابتسم" 
                className="w-12 h-12 md:w-14 md:h-14 object-contain"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl md:text-2xl font-bold text-primary font-arabic">
                  جمعية ابتسم
                </h1>
                <p className="text-xs text-text-muted hidden md:block">
                  للأعمال الاجتماعية والخيرية
                </p>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-text-primary dark:text-white font-medium hover:text-primary transition-colors">
                الرئيسية
              </Link>
              <Link to="/projects" className="text-text-secondary dark:text-text-white/70 font-medium hover:text-primary transition-colors">
                المشاريع
              </Link>
              <Link to="/about" className="text-text-secondary dark:text-text-white/70 font-medium hover:text-primary transition-colors">
                من نحن
              </Link>
              <Link to="/contact" className="text-text-secondary dark:text-text-white/70 font-medium hover:text-primary transition-colors">
                اتصل بنا
              </Link>
            </div>

            {/* CTA Button */}
            <Link to="/projects">
              <Button variant="primary" size="md" className="shadow-lg shadow-primary/20">
                <span className="material-symbols-outlined text-sm ml-1">favorite</span>
                ادعم أسرة
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 pt-6 pb-12">
        <div
          className="relative min-h-[520px] rounded-2xl overflow-hidden flex flex-col justify-end p-8 bg-cover bg-center shadow-2xl"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(13, 116, 119, 0.2), rgba(13, 116, 119, 0.95)), url("https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&q=80")`,
          }}
        >
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-white/90 text-sm font-medium">منظمة خيرية مرخصة في المغرب</span>
              </div>
              <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight font-arabic">
                معاً لنرسم البسمة
                <br />
                <span className="text-secondary">على وجوه الأيتام</span>
              </h1>
              <p className="text-white/90 text-lg md:text-xl font-medium leading-relaxed max-w-lg">
                نؤمن بأن كل طفل يستحق حياة كريمة. نرعى الأيتام ونمكّنهم من بناء مستقبل مشرق من خلال رعاية شاملة.
              </p>
            </div>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/projects">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary hover:bg-slate-50 shadow-xl"
                >
                  <span className="material-symbols-outlined ml-2">volunteer_activism</span>
                  ادعم أسرة الآن
                </Button>
              </Link>
              <Link to="/about">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  تعرف علينا
                </Button>
              </Link>
            </div>

            {/* Stats in Hero */}
            <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-white/20">
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-black text-white">{impactStats.families}+</p>
                <p className="text-white/70 text-sm">أسرة مدعومة</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-black text-white">{impactStats.donors.toLocaleString()}+</p>
                <p className="text-white/70 text-sm">متبرع</p>
              </div>
              <div className="text-center">
                <p className="text-3xl md:text-4xl font-black text-white">{formatCurrency(impactStats.amount)}</p>
                <p className="text-white/70 text-sm">درهم تم جمعه</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section with Founder Quote */}
      <section className="py-16 px-4 bg-gradient-to-b from-bg-light to-bg-sage-light dark:from-bg-dark dark:to-bg-dark-card">
        <div className="max-w-desktop mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-primary font-bold text-sm uppercase tracking-widest">من نحن</span>
              <h2 className="text-3xl md:text-4xl font-black text-text-primary dark:text-white font-arabic leading-tight">
                نحن جمعية ابتسم
                <br />
                <span className="text-primary">نؤمن بقوة العطاء</span>
              </h2>
              <p className="text-text-secondary dark:text-text-white/70 text-lg leading-relaxed">
                منذ تأسيسنا، نعمل على تغيير حياة الأيتام في المغرب من خلال رعاية شاملة تجمع بين الدعم النفسي والتعليمي والاجتماعي. نؤمن بأن كل طفل يحمل في داخله إمكانيات هائلة تنتظر من يكتشفها ويدعمها.
              </p>
              <div className="flex gap-4">
                <div className="text-center p-4 bg-white dark:bg-bg-dark-card rounded-xl shadow-sm">
                  <p className="text-2xl font-black text-primary">+15</p>
                  <p className="text-sm text-text-muted">سنة من الخبرة</p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-bg-dark-card rounded-xl shadow-sm">
                  <p className="text-2xl font-black text-primary">+500</p>
                  <p className="text-sm text-text-muted">يتيم في الرعاية</p>
                </div>
                <div className="text-center p-4 bg-white dark:bg-bg-dark-card rounded-xl shadow-sm">
                  <p className="text-2xl font-black text-primary">+50</p>
                  <p className="text-sm text-text-muted">متطوع نشط</p>
                </div>
              </div>
            </div>
            
            {/* Founder Quote Card */}
            <Card className="bg-white/80 dark:bg-bg-dark-card/80 backdrop-blur-sm border-l-4 border-l-primary">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-3xl">format_quote</span>
                </div>
                <div className="space-y-4">
                  <p className="text-text-primary dark:text-white text-lg font-medium leading-relaxed italic">
                    "عندما ابتسمنا لطفل يتيم، رأينا في عينيه بريق الأمل يعود من جديد. هذه البسمة هي ما يدفعنا كل يوم للاستمرار في مهمتنا النبيلة."
                  </p>
                  <div>
                    <p className="font-bold text-text-primary dark:text-white">مؤسس الجمعية</p>
                    <p className="text-sm text-text-muted">جمعية ابتسم للأعمال الاجتماعية</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Three Pillars Section */}
      <section className="py-16 px-4 bg-white dark:bg-bg-dark-card">
        <div className="max-w-desktop mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-sm uppercase tracking-widest">نهجنا</span>
            <h2 className="text-3xl md:text-4xl font-black text-text-primary dark:text-white mt-2 font-arabic">
              ركائز رعايتنا الشاملة
            </h2>
            <p className="text-text-secondary dark:text-text-white/70 mt-4 max-w-2xl mx-auto">
              نعتمد في رعايتنا للأيتام على ثلاث ركائز أساسية تضمن نمواً متوازناً وشاملاً
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((pillar) => (
              <Card key={pillar.id} className="group hover:shadow-xl transition-all duration-300">
                <div className={`w-16 h-16 ${pillar.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <span className="material-symbols-outlined text-white text-3xl">{pillar.icon}</span>
                </div>
                <h3 className="text-2xl font-bold text-text-primary dark:text-white mb-2 font-arabic">
                  {pillar.title}
                </h3>
                <p className="text-sm text-text-muted mb-3">{pillar.titleFr}</p>
                <p className="text-text-secondary dark:text-text-white/70 leading-relaxed">
                  {pillar.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Active Projects Section */}
      <section className="py-16 px-4 bg-bg-sage-light dark:bg-bg-dark">
        <div className="max-w-desktop mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-primary font-bold text-sm uppercase tracking-widest">فرص التبرع</span>
              <h2 className="text-2xl md:text-3xl font-black text-text-primary dark:text-white mt-2 font-arabic">
                المشاريع النشطة
              </h2>
            </div>
            <Link to="/projects" className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
              عرض الكل
              <span className="material-symbols-outlined text-sm">arrow_back</span>
            </Link>
          </div>

          {activeProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeProjects.map((project) => (
                <Card key={project.id} variant="default" padding="none" className="overflow-hidden h-full flex flex-col">
                  <div
                    className="h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url("${project.image || project.coverImage || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80'}")` }}
                  />
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-bold text-text-primary dark:text-white font-arabic">
                        {project.title || project.name || 'مشروع خيري'}
                      </h3>
                      <Badge variant={getStatusVariant(project.status)}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="text-text-secondary dark:text-text-white/70 text-sm leading-relaxed mb-4 line-clamp-2">
                      {project.description || project.summary || 'مشروع لدعم الأسر المحتاجة'}
                    </p>
                    <div className="space-y-2 mb-4 mt-auto">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-text-muted">
                          تم جمع: {formatCurrency(project.raised || project.currentAmount || 0)} درهم
                        </span>
                        <span className="text-primary">{Math.round(((project.raised || project.currentAmount || 0) / (project.goal || project.targetAmount || 1)) * 100)}%</span>
                      </div>
                      <ProgressBar 
                        value={Math.round(((project.raised || project.currentAmount || 0) / (project.goal || project.targetAmount || 1)) * 100)} 
                        size="sm" 
                      />
                    </div>
                    <Link to={`/projects/${project.id}`}>
                      <Button fullWidth size="sm">
                        تبرع الآن
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-4xl">volunteer_activism</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary dark:text-white mb-2">لا توجد مشاريع نشطة حالياً</h3>
              <p className="text-text-muted mb-4">سيتم إضافة مشاريع جديدة قريباً</p>
              <Link to="/projects">
                <Button variant="outline">استعراض جميع المشاريع</Button>
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Journey Timeline Section */}
      <section className="py-16 px-4 bg-white dark:bg-bg-dark-card">
        <div className="max-w-desktop mx-auto">
          <div className="text-center mb-12">
            <span className="text-primary font-bold text-sm uppercase tracking-widest">رحلتنا</span>
            <h2 className="text-3xl md:text-4xl font-black text-text-primary dark:text-white mt-2 font-arabic">
              رحلة اليتيم مع ابتسم
            </h2>
            <p className="text-text-secondary dark:text-text-white/70 mt-4 max-w-2xl mx-auto">
              نرافق اليتيم في رحلته من الاستضافة حتى الاستقلال المهني
            </p>
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-primary/20 -translate-y-1/2"></div>
            
            <div className="grid md:grid-cols-4 gap-6">
              {journeySteps.map((step) => (
                <div key={step.step} className="relative">
                  <Card className="text-center h-full border-t-4 border-t-primary">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto -mt-10 mb-4 border-4 border-white dark:border-bg-dark-card shadow-lg">
                      <span className="text-white font-bold">{step.step}</span>
                    </div>
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="material-symbols-outlined text-primary text-2xl">{step.icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-text-primary dark:text-white mb-2 font-arabic">
                      {step.title}
                    </h3>
                    <p className="text-sm text-text-secondary dark:text-text-white/70 leading-relaxed">
                      {step.description}
                    </p>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary">
        <div className="max-w-desktop mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 md:p-12 text-center">
            <div className="max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-black text-white font-arabic">
                كن جزءاً من التغيير
              </h2>
              <p className="text-white/90 text-lg">
                معاً يمكننا رسم البسمة على وجوه المزيد من الأيتام. كل تبرع يصنع فرقاً حقيقياً في حياة أسرة محتاجة.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-8 py-6 border-t border-b border-white/20">
                <div className="text-center">
                  <p className="text-4xl font-black text-white">{impactStats.families}</p>
                  <p className="text-white/70 text-sm">أسرة مدعومة</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-white">{impactStats.donors.toLocaleString()}</p>
                  <p className="text-white/70 text-sm">متبرع سخي</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-white">{impactStats.projects}</p>
                  <p className="text-white/70 text-sm">مشروع مكتمل</p>
                </div>
              </div>

              <Link to="/projects">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-primary hover:bg-slate-50 shadow-xl"
                >
                  <span className="material-symbols-outlined ml-2">favorite</span>
                  ادعم أسرة الآن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-bg-dark-card dark:bg-black border-t border-border-light dark:border-white/10">
        <div className="max-w-desktop mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={logoUrl} 
                  alt="جمعية ابتسم" 
                  className="w-12 h-12 object-contain"
                />
                <div>
                  <h3 className="font-bold text-text-primary dark:text-white text-lg font-arabic">
                    جمعية ابتسم
                  </h3>
                </div>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                جمعية خيرية مرخصة تعمل على رعاية الأيتام وتقديم الدعم الشامل لهم في المغرب.
              </p>
              <div className="flex items-center gap-3">
                <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">facebook</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">photo_camera</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">chat</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-text-primary dark:text-white mb-4">روابط سريعة</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-sm text-text-secondary hover:text-primary transition-colors">الرئيسية</Link></li>
                <li><Link to="/projects" className="text-sm text-text-secondary hover:text-primary transition-colors">المشاريع</Link></li>
                <li><Link to="/about" className="text-sm text-text-secondary hover:text-primary transition-colors">من نحن</Link></li>
                <li><Link to="/contact" className="text-sm text-text-secondary hover:text-primary transition-colors">اتصل بنا</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-text-primary dark:text-white mb-4">تواصل معنا</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="material-symbols-outlined text-primary">location_on</span>
                  <span>الدار البيضاء، المغرب</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <span className="material-symbols-outlined text-primary">phone</span>
                  <span>+212 5XX-XXXXXX</span>
                </li>
                <li className="flex items-center gap-3 text-sm text-text-secondary">
                  <span className="material-symbols-outlined text-primary">email</span>
                  <span>contact@ibtasam.org</span>
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-semibold text-text-primary dark:text-white mb-4">النشرة البريدية</h4>
              <p className="text-sm text-text-secondary mb-4">
                اشترك للحصول على آخر أخبارنا ومشاريعنا
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 h-11 px-4 rounded-xl bg-bg-light dark:bg-bg-dark border-0 text-sm focus:ring-2 focus:ring-primary/20"
                />
                <button className="h-11 px-4 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors">
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-border-light dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-text-muted">
              © {new Date().getFullYear()} جمعية ابتسم. جميع الحقوق محفوظة.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/privacy" className="text-sm text-text-muted hover:text-primary transition-colors">
                سياسة الخصوصية
              </Link>
              <Link to="/terms" className="text-sm text-text-muted hover:text-primary transition-colors">
                شروط الاستخدام
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
