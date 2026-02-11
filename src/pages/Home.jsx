import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Button, Badge } from '../components';

// ============================================
// HOME PAGE - Premium Moroccan Design v2
// 11 Sections with smooth scroll animations
// ============================================

// Scroll Reveal Hook using Intersection Observer
const useScrollReveal = (options = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return [ref, isVisible];
};

// Animated Counter Hook
const useAnimatedCounter = (end, duration = 2000, startCounting = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!startCounting) return;

    let startTime = null;
    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, startCounting]);

  return count;
};

// Animated Section Component
const AnimatedSection = ({ children, className = '', delay = 0, direction = 'up' }) => {
  const [ref, isVisible] = useScrollReveal();

  const getTransform = () => {
    switch (direction) {
      case 'up': return 'translateY(40px)';
      case 'down': return 'translateY(-40px)';
      case 'left': return 'translateX(40px)';
      case 'right': return 'translateX(-40px)';
      default: return 'translateY(40px)';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translate(0)' : getTransform(),
        transition: `all 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ end, suffix = '', prefix = '', className = '' }) => {
  const [ref, isVisible] = useScrollReveal();
  const count = useAnimatedCounter(end, 2000, isVisible);

  return (
    <span ref={ref} className={className}>
      {prefix}{count.toLocaleString('ar-SA')}{suffix}
    </span>
  );
};

const Home = () => {
  const { language } = useApp();
  const navigate = useNavigate();
  const [activeProjects, setActiveProjects] = useState([]);
  const [monthlyAmount, setMonthlyAmount] = useState(100);
  const [activeStoryIndex, setActiveStoryIndex] = useState(1);

  // Load projects from localStorage (correct key: 'admin_projects')
  useEffect(() => {
    const storedProjects = localStorage.getItem('admin_projects');
    if (storedProjects) {
      try {
        const projects = JSON.parse(storedProjects);
        const active = projects
          .filter(p => p.status === 'active' || p.status === 'ongoing' || p.status === 'urgent')
          .slice(0, 3);
        setActiveProjects(active);
      } catch (e) {
        console.error('Failed to parse projects from localStorage', e);
      }
    }
  }, []);

  // Navigation handlers
  const handleDonateClick = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  const handleProjectClick = useCallback((projectId) => {
    navigate(`/projects/${projectId}`);
  }, [navigate]);

  const handleViewAllProjects = useCallback(() => {
    navigate('/projects');
  }, [navigate]);

  const handleAboutClick = useCallback(() => {
    navigate('/about');
  }, [navigate]);

  const handleContactClick = useCallback(() => {
    navigate('/contact');
  }, [navigate]);

  const handleWatchStory = useCallback(() => {
    navigate('/impact');
  }, [navigate]);

  // Success Stories Data
  const successStories = [
    {
      id: 1,
      name: 'أحمد',
      age: '١٨ سنة',
      title: 'من يتيم إلى طبيب',
      quote: 'جمعية الأمل منحتني عائلة ثانية. اليوم أدرس الطب لأساعد الأطفال مثلي.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      gradient: 'from-[#0d7477] to-[#0a5c5e]'
    },
    {
      id: 2,
      name: 'فاطمة',
      age: '٢٢ سنة',
      title: 'رائدة أعمال',
      quote: 'الدعم النفسي والتعليمي غيّر حياتي. أملك الآن مشروعي الخاص.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      gradient: 'from-[#D4AF37] to-[#B8941F]',
      featured: true
    },
    {
      id: 3,
      name: 'يوسف',
      age: '٢٥ سنة',
      title: 'مهندس ناجح',
      quote: 'بدأت من الصفر والآن أبني المستقبل. كل الفضل لمن آمن بي.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      gradient: 'from-[#1a1a2e] to-[#2d2d44]'
    }
  ];

  // Impact calculation based on monthly amount
  const calculateImpact = (amount) => {
    return {
      education: Math.floor(amount / 50),
      medical: Math.floor(amount / 100),
      meals: Math.floor(amount / 10),
      clothing: Math.floor(amount / 75)
    };
  };

  const impact = calculateImpact(monthlyAmount);

  // Default projects data - 3 projects with pricing
  const defaultProjects = [
    {
      id: 'orphan-sponsorship',
      title: { en: 'Orphan Sponsorship', ar: 'كفالة يتيم', fr: 'Parrainage d\'Orphelins' },
      shortDescription: { 
        en: 'Full monthly support for one orphan including education, healthcare, and nutrition.',
        ar: 'دعم شهري شامل ليتيم واحد يشمل التعليم والرعاية الصحية والتغذية.',
        fr: 'Soutien mensuel complet pour un orphelin incluant l\'éducation, les soins de santé et la nutrition.'
      },
      status: 'active',
      price: 300,
      period: 'month',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80',
      features: ['تعليم شامل', 'رعاية صحية', 'دعم نفسي', 'تقارير شهرية']
    },
    {
      id: 'build-future',
      title: { en: 'Build Future', ar: 'بناء مستقبل', fr: 'Construire l\'Avenir' },
      shortDescription: { 
        en: 'Higher education and vocational training support for young adults.',
        ar: 'دعم التعليم العالي والتدريب المهني للشباب.',
        fr: 'Soutien à l\'enseignement supérieur et à la formation professionnelle pour les jeunes adultes.'
      },
      status: 'active',
      price: 500,
      period: 'month',
      image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80',
      features: ['منح دراسية', 'تدريب مهني', 'توجيه وظيفي', 'إعانة شهرية'],
      popular: true
    },
    {
      id: 'education-training',
      title: { en: 'Education & Training', ar: 'تعليم وتدريب', fr: 'Éducation et Formation' },
      shortDescription: { 
        en: 'School supplies, tutoring, and skill development programs.',
        ar: 'القرطاسية والتدريس الخصوصي وبرامج تطوير المهارات.',
        fr: 'Fournitures scolaires, tutorat et programmes de développement des compétences.'
      },
      status: 'active',
      price: 150,
      period: 'month',
      image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&q=80',
      features: ['قرطاسية', 'دروس خصوصية', 'أنشطة صيفية', 'رحلات تعليمية']
    }
  ];

  const displayProjects = activeProjects.length > 0 ? activeProjects : defaultProjects;

  const getProjectTitle = (project) => {
    if (typeof project.title === 'string') return project.title;
    if (typeof project.title === 'object') {
      return project.title[language] || project.title.ar || project.title.en || project.name || 'مشروع';
    }
    return project.name || 'مشروع';
  };

  const getProjectDescription = (project) => {
    if (typeof project.shortDescription === 'string') return project.shortDescription;
    if (typeof project.shortDescription === 'object') {
      return project.shortDescription[language] || project.shortDescription.ar || project.shortDescription.en || project.description || '';
    }
    return project.description || project.summary || '';
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1a1a2e] font-['Inter',sans-serif] text-[#1a1a2e] dark:text-slate-100 antialiased overflow-x-hidden" dir="rtl">
      
      {/* ============================================
          SECTION 1: NAVIGATION
          ============================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#faf9f7]/90 dark:bg-[#1a1a2e]/90 backdrop-blur-xl border-b border-[#0d7477]/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#0d7477] to-[#0a5c5e] rounded-xl flex items-center justify-center shadow-lg shadow-[#0d7477]/20">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-[#1a1a2e] dark:text-white">جمعية الأمل</span>
            </Link>
            
            {/* Menu Items */}
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/" className="text-[#1a1a2e] dark:text-slate-300 hover:text-[#0d7477] font-medium transition-colors">الرئيسية</Link>
              <Link to="/about" className="text-slate-600 dark:text-slate-400 hover:text-[#0d7477] font-medium transition-colors">من نحن</Link>
              <Link to="/projects" className="text-slate-600 dark:text-slate-400 hover:text-[#0d7477] font-medium transition-colors">برامجنا</Link>
              <Link to="/projects" className="text-slate-600 dark:text-slate-400 hover:text-[#0d7477] font-medium transition-colors">المشاريع</Link>
              <button onClick={handleContactClick} className="text-slate-600 dark:text-slate-400 hover:text-[#0d7477] font-medium transition-colors">تواصل معنا</button>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleDonateClick}
              className="bg-[#0d7477] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-[#0a5c5e] transition-all shadow-lg shadow-[#0d7477]/20 hover:shadow-xl hover:shadow-[#0d7477]/30"
            >
              تبرع الآن
            </Button>
          </div>
        </div>
      </nav>

      {/* ============================================
          SECTION 2: HERO
          ============================================ */}
      <section className="relative min-h-screen pt-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#faf9f7] via-[#f5f3ef] to-[#faf9f7] dark:from-[#1a1a2e] dark:via-[#252538] dark:to-[#1a1a2e]" />
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#0d7477]/5 to-transparent dark:from-[#0d7477]/10" />
        
        <div className="container mx-auto px-6 py-12 lg:py-20 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Left: Content (RTL: appears first) */}
            <AnimatedSection className="lg:w-1/2 text-right">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white dark:bg-[#252538] backdrop-blur-sm px-4 py-2 rounded-full shadow-sm mb-6 border border-[#D4AF37]/30">
                <span className="text-[#D4AF37]">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </span>
                <span className="text-[#0d7477] font-bold text-sm">منذ ٢٠٠٩</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black text-[#1a1a2e] dark:text-white leading-tight mb-6">
                اليتيم لا يُنقذ في المؤسسات،<br />
                <span className="text-[#0d7477]">اليتيم يُنقذ في بيت</span>
              </h1>

              {/* Subheadline */}
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
                نؤمن بأن كل يتيم يستحق أن يعيش في بيئة أسرية دافئة تمنحه الحب والاستقرار. نعمل لنكون جسراً بين الأسر الكريمة والأيتام.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-end">
                <Button
                  onClick={handleDonateClick}
                  className="bg-[#0d7477] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#0a5c5e] shadow-xl shadow-[#0d7477]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  ابدأ رحلتك
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
                <Button
                  onClick={handleWatchStory}
                  variant="outline"
                  className="bg-white dark:bg-[#252538] text-[#1a1a2e] dark:text-white border-2 border-slate-200 dark:border-slate-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-[#2d2d44] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  شاهد قصتنا
                </Button>
              </div>
            </AnimatedSection>

            {/* Right: Image */}
            <AnimatedSection className="lg:w-1/2" delay={0.2}>
              <div className="relative">
                {/* Main Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80"
                    alt="Family warmth"
                    className="w-full h-[400px] lg:h-[500px] object-cover"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/30 to-transparent" />
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-6 -left-6 w-40 h-40 bg-[#D4AF37]/20 rounded-full blur-3xl" />
                <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#0d7477]/20 rounded-full blur-2xl" />
                
                {/* Floating card */}
                <div className="absolute -bottom-4 left-4 bg-white dark:bg-[#252538] rounded-2xl p-4 shadow-xl border border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#0d7477]/10 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-[#0d7477]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[#0d7477]">+15,000</p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">يتيم تم إنقاذه</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ============================================
          SECTION 3: TRUST BAR / STATS
          Glassmorphism floating card
          ============================================ */}
      <section className="relative -mt-20 z-10 px-6">
        <AnimatedSection>
          <div className="container mx-auto max-w-5xl">
            <div className="bg-white/80 dark:bg-[#252538]/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Stat 1 */}
                <div className="text-center group">
                  <div className="w-16 h-16 bg-[#0d7477]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <p className="text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white mb-1">
                    <AnimatedCounter end={2500} suffix="+" />
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">أسرة محتضنة</p>
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />

                {/* Stat 2 */}
                <div className="text-center group">
                  <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white mb-1">
                    <AnimatedCounter end={15000} suffix="+" />
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">يتيم مكفول</p>
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />

                {/* Stat 3 */}
                <div className="text-center group">
                  <div className="w-16 h-16 bg-[#0d7477]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-8 h-8 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white mb-1">
                    <AnimatedCounter end={50000} suffix="+" />
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">متبرع شهري</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ============================================
          SECTION 4: APPROACH SECTION
          ============================================ */}
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">نهجنا</span>
            <h2 className="text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white">
              نهج الكفالة الشامل للنمو
            </h2>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1: الدعم النفسي */}
            <AnimatedSection delay={0.1}>
              <div className="bg-white dark:bg-[#252538] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group border border-slate-100 dark:border-slate-700 h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-[#0d7477]/20 to-[#0d7477]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a2e] dark:text-white mb-4">الدعم النفسي</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  جلسات دعم نفسي منتظمة ومتابعة اجتماعية لضمان النمو العاطفي السليم والقدرة على التعامل مع التحديات الحياتية.
                </p>
                <button className="text-[#0d7477] font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                  اكتشف
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </AnimatedSection>

            {/* Card 2: الدعم التعليمي */}
            <AnimatedSection delay={0.2}>
              <div className="bg-white dark:bg-[#252538] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group border border-slate-100 dark:border-slate-700 h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a2e] dark:text-white mb-4">الدعم التعليمي</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  منح دراسية شاملة، دروس تقوية، وتوجيه أكاديمي لضمان مستقبل تعليمي مشرق يفتح آفاقاً واسعة للنجاح.
                </p>
                <button className="text-[#D4AF37] font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                  اكتشف
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </AnimatedSection>

            {/* Card 3: الدعم الصحي */}
            <AnimatedSection delay={0.3}>
              <div className="bg-white dark:bg-[#252538] rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 group border border-slate-100 dark:border-slate-700 h-full">
                <div className="w-20 h-20 bg-gradient-to-br from-[#0d7477]/20 to-[#0d7477]/5 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#1a1a2e] dark:text-white mb-4">الدعم الصحي</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                  تغطية صحية شاملة، فحوصات دورية، ورعاية طبية متكاملة تضمن صحة جسدية سليمة للأيتام.
                </p>
                <button className="text-[#0d7477] font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                  اكتشف
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 5: PROJECTS SECTION
          ============================================ */}
      <section className="py-24 px-6 bg-white dark:bg-[#252538]">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">ساهم معنا</span>
            <h2 className="text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white mb-4">
              مشاريع ومبادرات
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
              اختر طريقتك في صناعة الفرق
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {defaultProjects.map((project, index) => (
              <AnimatedSection key={project.id} delay={index * 0.15}>
                <div className={`relative bg-[#faf9f7] dark:bg-[#1a1a2e] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group border ${project.popular ? 'border-[#D4AF37] ring-2 ring-[#D4AF37]/20' : 'border-slate-100 dark:border-slate-700'}`}>
                  {/* Popular Badge */}
                  {project.popular && (
                    <div className="absolute top-4 left-4 bg-[#D4AF37] text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
                      الأكثر شيوعاً
                    </div>
                  )}

                  {/* Project Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={project.image}
                      alt={getProjectTitle(project)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/60 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-3">
                      {getProjectTitle(project)}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 line-clamp-2">
                      {getProjectDescription(project)}
                    </p>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-6">
                      <span className="text-3xl font-black text-[#0d7477]">{project.price}</span>
                      <span className="text-slate-500 text-sm">ر.س/شهر</span>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      {project.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <svg className="w-4 h-4 text-[#0d7477]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleProjectClick(project.id)}
                      className={`w-full py-3 rounded-xl font-bold transition-all active:scale-95 ${
                        project.popular 
                          ? 'bg-[#0d7477] text-white hover:bg-[#0a5c5e] shadow-lg shadow-[#0d7477]/20' 
                          : 'bg-white dark:bg-[#252538] text-[#0d7477] border-2 border-[#0d7477] hover:bg-[#0d7477] hover:text-white'
                      }`}
                    >
                      تبرع الآن
                    </button>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* View All Button */}
          <AnimatedSection className="text-center mt-12">
            <button
              onClick={handleViewAllProjects}
              className="text-[#0d7477] font-bold flex items-center gap-2 mx-auto hover:gap-4 transition-all"
            >
              عرض جميع المشاريع
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================
          SECTION 6: JOURNEY SECTION
          ============================================ */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">مسار الرعاية</span>
            <h2 className="text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white">
              رحلة نحو الاستقلال
            </h2>
          </AnimatedSection>

          {/* Timeline */}
          <div className="relative">
            {/* Connecting Line */}
            <div className="hidden lg:block absolute top-1/2 right-0 left-0 h-1 bg-gradient-to-l from-[#0d7477] via-[#D4AF37] to-[#1a1a2e] rounded-full transform -translate-y-1/2" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Stage 1 */}
              <AnimatedSection delay={0.1}>
                <div className="relative text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#0d7477] to-[#0a5c5e] rounded-full flex items-center justify-center shadow-xl shadow-[#0d7477]/30 mb-6 relative z-10">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-[#252538] rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-[#0d7477] mb-3">الاحتضان الأسري</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      دمج اليتيم في أسرة محتضنة توفر له الحب والرعاية والاستقرار النفسي
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Stage 2 */}
              <AnimatedSection delay={0.2}>
                <div className="relative text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#0d7477] to-[#0a5c5e] rounded-full flex items-center justify-center shadow-xl shadow-[#0d7477]/30 mb-6 relative z-10">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-[#252538] rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-[#0d7477] mb-3">النمو الشامل</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      رعاية صحية، دعم تعليمي، ورعاية نفسية متكاملة لضمان نمو سليم
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Stage 3 */}
              <AnimatedSection delay={0.3}>
                <div className="relative text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#D4AF37] to-[#B8941F] rounded-full flex items-center justify-center shadow-xl shadow-[#D4AF37]/30 mb-6 relative z-10">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-[#252538] rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-[#D4AF37] mb-3">التمكين والتأهيل</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      منح دراسية، تدريب مهني، وتوجيه أكاديمي لبناء مستقبل مهني
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              {/* Stage 4 */}
              <AnimatedSection delay={0.4}>
                <div className="relative text-center">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] rounded-full flex items-center justify-center shadow-xl shadow-[#1a1a2e]/30 mb-6 relative z-10">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div className="bg-white dark:bg-[#252538] rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700">
                    <h3 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-3">الاستقلال الكامل</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      شاب مستقل يمارس مهنته بكرامة ويصبح عضداً فاعلاً في المجتمع
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 7: SUCCESS STORIES
          Netflix-style cards
          ============================================ */}
      <section className="py-24 px-6 bg-[#1a1a2e]">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-widest block mb-4">قصص ملهمة</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white">
              قصص نجاح ملهمة
            </h2>
          </AnimatedSection>

          {/* Stories Carousel */}
          <AnimatedSection>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              {successStories.map((story, index) => (
                <div
                  key={story.id}
                  onClick={() => setActiveStoryIndex(index)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
                    index === activeStoryIndex 
                      ? 'w-full md:w-96 h-96 md:scale-110 z-10' 
                      : 'w-full md:w-64 h-72 opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Background Image */}
                  <img 
                    src={story.image}
                    alt={story.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${story.gradient} opacity-90`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                    {index === activeStoryIndex && (
                      <>
                        <p className="text-sm opacity-80 mb-2">{story.age}</p>
                        <h3 className="text-2xl font-bold mb-2">{story.name}</h3>
                        <p className="text-[#D4AF37] font-bold mb-3">{story.title}</p>
                        <p className="text-sm opacity-90 leading-relaxed">"{story.quote}"</p>
                      </>
                    )}
                    {index !== activeStoryIndex && (
                      <>
                        <h3 className="text-xl font-bold">{story.name}</h3>
                        <p className="text-sm opacity-80">{story.title}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-3 mt-8">
            {successStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStoryIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === activeStoryIndex ? 'bg-[#D4AF37] w-8' : 'bg-white/30 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 8: IMPACT CALCULATOR
          ============================================ */}
      <section className="py-24 px-6 bg-gradient-to-br from-[#faf9f7] to-[#f5f3ef] dark:from-[#1a1a2e] dark:to-[#252538]">
        <div className="container mx-auto max-w-4xl">
          <AnimatedSection className="text-center mb-16">
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">أثر تبرعك</span>
            <h2 className="text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white">
              احسب أثر تبرعك
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="bg-white dark:bg-[#252538] rounded-3xl p-8 lg:p-12 shadow-2xl border border-slate-100 dark:border-slate-700">
              {/* Slider */}
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">مبلغ التبرع الشهري</span>
                  <span className="text-4xl font-black text-[#0d7477]">{monthlyAmount} ر.س</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={monthlyAmount}
                  onChange={(e) => setMonthlyAmount(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer accent-[#0d7477]"
                />
                <div className="flex justify-between mt-2 text-sm text-slate-500">
                  <span>50 ر.س</span>
                  <span>1000 ر.س</span>
                </div>
              </div>

              {/* Impact Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Education */}
                <div className="text-center p-6 bg-[#faf9f7] dark:bg-[#1a1a2e] rounded-2xl">
                  <div className="text-3xl font-black text-[#0d7477] mb-2">{impact.education}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">شهر تعليم</div>
                </div>

                {/* Medical */}
                <div className="text-center p-6 bg-[#faf9f7] dark:bg-[#1a1a2e] rounded-2xl">
                  <div className="text-3xl font-black text-[#0d7477] mb-2">{impact.medical}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">فحص طبي</div>
                </div>

                {/* Meals */}
                <div className="text-center p-6 bg-[#faf9f7] dark:bg-[#1a1a2e] rounded-2xl">
                  <div className="text-3xl font-black text-[#0d7477] mb-2">{impact.meals}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">وجبة غذائية</div>
                </div>

                {/* Clothing */}
                <div className="text-center p-6 bg-[#faf9f7] dark:bg-[#1a1a2e] rounded-2xl">
                  <div className="text-3xl font-black text-[#0d7477] mb-2">{impact.clothing}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">طقم ملابس</div>
                </div>
              </div>

              {/* CTA */}
              <div className="text-center mt-10">
                <Button
                  onClick={handleDonateClick}
                  className="bg-[#0d7477] text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-[#0a5c5e] shadow-xl shadow-[#0d7477]/20 transition-all"
                >
                  ابدأ بالتبرع الآن
                </Button>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================
          SECTION 9: FINAL CTA
          ============================================ */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d7477] via-[#0a5c5e] to-[#0d7477]" />
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />

        <div className="container mx-auto max-w-4xl relative text-center">
          <AnimatedSection>
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-6 leading-tight">
              الآن، في هذه اللحظة،<br />
              <span className="text-[#D4AF37]">طفل ينتظرك</span>
            </h2>
            <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto">
              قرارك اليوم يصنع فرقاً كبيراً في حياة يتيم. كن السبب في ابتسامته ولمستقبله.
            </p>
            <Button
              onClick={handleDonateClick}
              className="bg-white text-[#0d7477] px-12 py-5 rounded-xl font-black text-xl hover:bg-[#faf9f7] shadow-2xl shadow-black/20 transition-all active:scale-95 inline-flex items-center gap-3 group"
            >
              ابدأ رحلتك الآن
              <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================
          SECTION 10: TRUST BADGES
          ============================================ */}
      <section className="py-16 px-6 bg-white dark:bg-[#252538] border-t border-slate-100 dark:border-slate-700">
        <div className="container mx-auto max-w-6xl">
          {/* Partner Logos */}
          <AnimatedSection className="mb-12">
            <p className="text-center text-slate-500 dark:text-slate-400 text-sm mb-8">شركاؤنا في العطاء</p>
            <div className="flex flex-wrap items-center justify-center gap-12 opacity-50">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-24 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              ))}
            </div>
          </AnimatedSection>

          {/* Trust Badges */}
          <AnimatedSection delay={0.2}>
            <div className="flex flex-wrap items-center justify-center gap-8">
              <div className="flex items-center gap-2 bg-[#faf9f7] dark:bg-[#1a1a2e] px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-bold text-[#1a1a2e] dark:text-white">جائزة التميز ٢٠٢٤</span>
              </div>

              <div className="flex items-center gap-2 bg-[#faf9f7] dark:bg-[#1a1a2e] px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-bold text-[#1a1a2e] dark:text-white">مسجل رسمياً</span>
              </div>

              <div className="flex items-center gap-2 bg-[#faf9f7] dark:bg-[#1a1a2e] px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-bold text-[#1a1a2e] dark:text-white">شفافية ١٠٠٪</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================
          SECTION 11: FOOTER
          ============================================ */}
      <footer className="bg-[#1a1a2e] text-white py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Logo & Tagline */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0d7477] to-[#0a5c5e] rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <span className="text-xl font-bold">جمعية الأمل</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                كل يتيم يستحق فرصة
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                ننقذ الأيتام ونوفر لهم حياة كريمة من خلال التبني الأسرى والرعاية الشاملة.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold mb-6 text-[#D4AF37]">روابط سريعة</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li><Link to="/" className="hover:text-white transition-colors">الرئيسية</Link></li>
                <li><Link to="/about" className="hover:text-white transition-colors">من نحن</Link></li>
                <li><Link to="/projects" className="hover:text-white transition-colors">برامجنا</Link></li>
                <li><Link to="/projects" className="hover:text-white transition-colors">المشاريع</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">تواصل معنا</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold mb-6 text-[#D4AF37]">تواصل معنا</h4>
              <ul className="space-y-3 text-sm text-white/60">
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  info@alamal.org
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  +966 50 XXX XXXX
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  الرياض، المملكة العربية السعودية
                </li>
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="font-bold mb-6 text-[#D4AF37]">النشرة البريدية</h4>
              <p className="text-white/60 text-sm mb-4">اشترك ليصلك آخر أخبارنا وقصص النجاح</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#0d7477]"
                />
                <button className="bg-[#0d7477] hover:bg-[#0a5c5e] px-4 py-2.5 rounded-xl transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-4 mt-6">
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#0d7477] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#0d7477] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#0d7477] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 text-center text-sm text-white/40">
            <p>© 2024 جمعية الأمل. جميع الحقوق محفوظة.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
