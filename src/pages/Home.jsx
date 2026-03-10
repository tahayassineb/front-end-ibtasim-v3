import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useApp } from '../context/AppContext';
import { convexFileUrl } from '../lib/convex';
import { Button, Badge } from '../components';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import HeroScrollAnimation from '../components/HeroScrollAnimation';

// ============================================
// HOME PAGE - Premium Moroccan Design v3
// Alternating Layout with MainLayout Header
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
        threshold: options.threshold || 0.15,
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
      {prefix}{count.toLocaleString('en-US')}{suffix}
    </span>
  );
};

// Alternating Section Component
const AlternatingSection = ({
  children,
  image,
  imageAlt,
  reverse = false,
  className = '',
  delay = 0
}) => {
  const [ref, isVisible] = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-12 ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
        transition: `all 0.7s cubic-bezier(0.4, 0, 0.2, 1) ${delay}s`,
      }}
    >
      {/* Image Side */}
      <div className="w-full md:w-1/2">
        <div
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? (reverse ? 'translateX(0)' : 'translateX(0)') : (reverse ? 'translateX(40px)' : 'translateX(-40px)'),
            transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay + 0.1}s`,
          }}
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={image}
              alt={imageAlt}
              className="w-full h-[300px] md:h-[400px] lg:h-[450px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/20 to-transparent" />
          </div>
          {/* Decorative elements */}
          <div className={`absolute ${reverse ? '-bottom-6 -right-6' : '-bottom-6 -left-6'} w-32 h-32 bg-[#D4AF37]/20 rounded-full blur-3xl -z-10`} />
          <div className={`absolute ${reverse ? '-top-6 -left-6' : '-top-6 -right-6'} w-24 h-24 bg-[#0d7477]/20 rounded-full blur-2xl -z-10`} />
        </div>
      </div>

      {/* Content Side */}
      <div
        className="w-full md:w-1/2"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? (reverse ? 'translateX(0)' : 'translateX(0)') : (reverse ? 'translateX(-40px)' : 'translateX(40px)'),
          transition: `all 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${delay + 0.2}s`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Home = () => {
  const { language } = useApp();
  const navigate = useNavigate();
  const [activeStoryIndex, setActiveStoryIndex] = useState(1);

  // Fetch all active projects from Convex (shows any published project, not just featured)
  const activeProjectsData = useQuery(api.projects.getProjects, { status: 'active', limit: 12 });

  // Transform Convex data to match component format
  const activeProjects = useMemo(() => {
    if (!activeProjectsData) return [];

    return activeProjectsData.map(project => ({
      id: project._id,
      title: project.title,
      shortDescription: project.description,
      description: project.description,
      category: project.category,
      raised: project.raisedAmount,
      goal: project.goalAmount,
      progress: Math.round((project.raisedAmount / (project.goalAmount || 1)) * 100),
      mainImage: project.mainImage,
      image: convexFileUrl(project.mainImage) || project.mainImage,
      location: project.location,
      status: 'active',
    }));
  }, [activeProjectsData]);

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
    navigate('/about');
  }, [navigate]);

  // Success Stories Data with Latin numbers
  const successStories = [
    {
      id: 1,
      name: 'أحمد',
      age: '18 سنة',
      title: 'من يتيم إلى طبيب',
      quote: 'جمعية الأمل منحتني عائلة ثانية. اليوم أدرس الطب لأساعد الأطفال مثلي.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      gradient: 'from-[#0d7477] to-[#0a5c5e]'
    },
    {
      id: 2,
      name: 'فاطمة',
      age: '22 سنة',
      title: 'رائدة أعمال',
      quote: 'الدعم النفسي والتعليمي غيّر حياتي. أملك الآن مشروعي الخاص.',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
      gradient: 'from-[#D4AF37] to-[#B8941F]',
      featured: true
    },
    {
      id: 3,
      name: 'يوسف',
      age: '25 سنة',
      title: 'مهندس ناجح',
      quote: 'بدأت من الصفر والآن أبني المستقبل. كل الفضل لمن آمن بي.',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      gradient: 'from-[#1a1a2e] to-[#2d2d44]'
    }
  ];

  // History Timeline Data
  const historyMilestones = [
    {
      year: '2009',
      title: 'التأسيس',
      description: 'بداية رحلة جمعية الأمل بتأسيسها في الرياض على يد مجموعة من المتطوعين المؤمنين بحق كل يتيم في حياة كريمة.',
      icon: '🌱'
    },
    {
      year: '2012',
      title: 'أول 100 أسرة',
      description: 'تم توفير 100 أسرة محتضنة للأيتام، وإطلاق أول برنامج شامل للكفالة.',
      icon: '🏠'
    },
    {
      year: '2015',
      title: 'التوسع التعليمي',
      description: 'إطلاق برنامج المنح الدراسية الشاملة وتوسيع نطاق العمل إلى عدة مناطق.',
      icon: '🎓'
    },
    {
      year: '2018',
      title: '5,000 يتيم',
      description: 'تحقيق هدف كفالة 5,000 يتيم وتطوير مركز التأهيل المهني.',
      icon: '⭐'
    },
    {
      year: '2024',
      title: 'جائزة التميز',
      description: 'فوز الجمعية بجائزة التميز في العمل الخيري والتطوعي على المستوى الوطني.',
      icon: '🏆'
    }
  ];

  // Display projects from localStorage or default
  const displayProjects = activeProjects.length > 0 ? activeProjects : [];

  const getProjectTitle = (project) => {
    if (typeof project.title === 'string') return project.title;
    if (typeof project.title === 'object') {
      return project.title[language] || project.title.ar || project.title.en || project.name || 'مشروع';
    }
    return project.name || 'مشروع';
  };

  const getProjectDescription = (project) => {
    if (typeof project.shortDescription === 'string') return project.shortDescription;
    if (project.shortDescription && typeof project.shortDescription === 'object') {
      // Never fall back to project.description here — it's the same i18n object
      // and returning an object as a React child causes a crash
      return project.shortDescription[language] || project.shortDescription.ar || project.shortDescription.fr || project.shortDescription.en || '';
    }
    if (typeof project.description === 'string') return project.description;
    if (project.description && typeof project.description === 'object') {
      return project.description[language] || project.description.ar || project.description.fr || project.description.en || '';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-[#faf9f7] dark:bg-[#1a1a2e] font-['Inter',sans-serif] text-[#1a1a2e] dark:text-slate-100 antialiased overflow-x-hidden" dir="rtl">

      {/* ============================================
          SECTION 1: HERO — Cinematic scroll animation
          ============================================ */}
      <HeroScrollAnimation onDonate={handleDonateClick} />

      {/* ============================================
          SECTION 2: IMPACT STATS (Floating card)
          ============================================ */}
      <section className="relative -mt-20 z-10 px-6">
        <AnimatedSection>
          <div className="container mx-auto max-w-5xl">
            <div className="bg-white/80 dark:bg-[#252538]/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-slate-700/50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Stat 1 */}
                <div className="text-center group">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-[#0d7477]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 md:w-8 md:h-8 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white mb-1">
                    <AnimatedCounter end={2500} suffix="+" />
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base">أسرة محتضنة</p>
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />

                {/* Stat 2 */}
                <div className="text-center group">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 md:w-8 md:h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white mb-1">
                    <AnimatedCounter end={15000} suffix="+" />
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base">يتيم مكفول</p>
                </div>

                {/* Divider */}
                <div className="hidden md:block w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent" />

                {/* Stat 3 */}
                <div className="text-center group">
                  <div className="w-14 h-14 md:w-16 md:h-16 bg-[#0d7477]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <svg className="w-7 h-7 md:w-8 md:h-8 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl md:text-3xl lg:text-4xl font-black text-[#1a1a2e] dark:text-white mb-1">
                    <AnimatedCounter end={50000} suffix="+" />
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 font-medium text-sm md:text-base">متبرع شهري</p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ============================================
          SECTION 3: ABOUT ASSOCIATION (Text RIGHT, Image LEFT)
          ============================================ */}
      <section className="py-20 md:py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <AlternatingSection
            image="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&q=80"
            imageAlt="فريق جمعية الأمل"
            reverse={false}
          >
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">من نحن</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1a1a2e] dark:text-white mb-6 leading-tight">
              نؤمن بأن كل يتيم<br />
              <span className="text-[#D4AF37]">يستحق بيتاً</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed mb-6">
              جمعية الأمل هي منظمة خيرية غير ربحية تأسست عام 2009 بهدف إنقاذ الأيتام ودمجهم في أسر محتضنة توفر لهم الحب والرعاية والاستقرار النفسي.
            </p>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed mb-8">
              نعمل بشكل شامل على تلبية احتياجات الأيتام من خلال الدعم النفسي والتعليمي والصحي، مما يضمن نموهم وتطورهم ليصبحوا أفراداً منتجين في المجتمع.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={handleAboutClick}
                className="bg-[#0d7477] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0a5c5e] transition-all"
              >
                تعرف علينا أكثر
              </Button>
              <Button
                onClick={handleContactClick}
                variant="outline"
                className="bg-transparent text-[#0d7477] border-2 border-[#0d7477] px-6 py-3 rounded-xl font-bold hover:bg-[#0d7477] hover:text-white transition-all"
              >
                تواصل معنا
              </Button>
            </div>
          </AlternatingSection>
        </div>
      </section>

      {/* ============================================
          SECTION 4: OUR MISSION (Text LEFT, Image RIGHT)
          ============================================ */}
      <section className="py-20 md:py-24 px-6 bg-white dark:bg-[#252538]">
        <div className="container mx-auto max-w-6xl">
          <AlternatingSection
            image="https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&q=80"
            imageAlt="رسالتنا"
            reverse={true}
          >
            <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-widest block mb-4">رسالتنا</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1a1a2e] dark:text-white mb-6 leading-tight">
              نحن نحلم بمستقبل<br />
              <span className="text-[#0d7477]">بلا أيتام</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed mb-6">
              رسالتنا هي توفير بيئة أسرية دافئة لكل يتيم، نمنحهم من خلالها الحب والرعاية والدعم الشامل الذي يضمن نموهم السليم.
            </p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0d7477]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0d7477]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a2e] dark:text-white mb-1">احتضان أسري شامل</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">دمج الأيتام في أسر كريمة توفر الحب والاستقرار</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0d7477]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0d7477]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a2e] dark:text-white mb-1">تمكين وتأهيل</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">توفير التعليم والتدريب لبناء مستقبل مهني مشرق</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#0d7477]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#0d7477]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-[#1a1a2e] dark:text-white mb-1">متابعة مستمرة</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">رعاية صحية ونفسية على مدار السنة</p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleDonateClick}
              className="bg-[#D4AF37] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#B8941F] transition-all"
            >
              كن جزءاً من رسالتنا
            </Button>
          </AlternatingSection>
        </div>
      </section>

      {/* ============================================
          SECTION 5: OUR VALUES (Text RIGHT, Image LEFT)
          ============================================ */}
      <section className="py-20 md:py-24 px-6">
        <div className="container mx-auto max-w-6xl">
          <AlternatingSection
            image="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"
            imageAlt="قيمنا"
            reverse={false}
            delay={0.1}
          >
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">قيمنا</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1a1a2e] dark:text-white mb-6 leading-tight">
              نعمل بـ <span className="text-[#D4AF37]">الحب</span> ونؤدي بـ <span className="text-[#0d7477]">الأمانة</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#252538] rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-[#0d7477]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#0d7477]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
                <h4 className="font-bold text-[#1a1a2e] dark:text-white mb-2">الإنسانية</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">نضع مصلحة اليتيم في المقام الأول في كل ما نقوم به</p>
              </div>
              <div className="bg-white dark:bg-[#252538] rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h4 className="font-bold text-[#1a1a2e] dark:text-white mb-2">الشفافية</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">نعمل بكل وضوح وننشر تقارير دورية عن نشاطاتنا</p>
              </div>
              <div className="bg-white dark:bg-[#252538] rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-[#0d7477]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="font-bold text-[#1a1a2e] dark:text-white mb-2">العمل الجماعي</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">نؤمن بقوة التعاون بين الأسر والمتبرعين والمتطوعين</p>
              </div>
              <div className="bg-white dark:bg-[#252538] rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-xl flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-bold text-[#1a1a2e] dark:text-white mb-2">التميز</h4>
                <p className="text-slate-600 dark:text-slate-400 text-sm">نسعى دائماً لتحسين خدماتنا وابتكار حلول جديدة</p>
              </div>
            </div>
          </AlternatingSection>
        </div>
      </section>

      {/* ============================================
          SECTION 6: ACTIVE PROJECTS (Grid Layout)
          ============================================ */}
      <section className="py-20 md:py-24 px-6 bg-white dark:bg-[#252538]">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-12 md:mb-16">
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">ساهم معنا</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1a1a2e] dark:text-white mb-4">
              مشاريعنا النشطة
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              اختر المشروع الذي ترغب في دعمه وكن جزءاً من صناعة الفرق
            </p>
          </AnimatedSection>

          {displayProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {displayProjects.map((project, index) => (
                <AnimatedSection key={project.id} delay={index * 0.1}>
                  <div className="group bg-[#faf9f7] dark:bg-[#1a1a2e] rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-slate-100 dark:border-slate-700 h-full flex flex-col">
                    {/* Project Image */}
                    <div className="relative h-48 md:h-56 overflow-hidden">
                      <img
                        src={project.image || project.coverImage || project.thumbnail || 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80'}
                        alt={getProjectTitle(project)}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a2e]/60 to-transparent" />
                      {project.status === 'urgent' && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                          عاجل
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-3">
                        {getProjectTitle(project)}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2 flex-1">
                        {getProjectDescription(project)}
                      </p>

                      {/* Progress */}
                      {project.raised !== undefined && project.goal !== undefined && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-600 dark:text-slate-400">تم جمع</span>
                            <span className="font-bold text-[#0d7477]">{Math.round((project.raised / project.goal) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-l from-[#0d7477] to-[#0a5c5e] rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min((project.raised / project.goal) * 100, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs mt-1 text-slate-500">
                            <span>{Math.round(project.raised / 100).toLocaleString('en-US')} DH</span>
                            <span>{Math.round(project.goal / 100).toLocaleString('en-US')} DH</span>
                          </div>
                        </div>
                      )}

                      {/* CTA Button */}
                      <button
                        onClick={() => handleProjectClick(project.id)}
                        className="w-full py-3 rounded-xl font-bold transition-all active:scale-95 bg-[#0d7477] text-white hover:bg-[#0a5c5e] shadow-lg shadow-[#0d7477]/20"
                      >
                        تبرع الآن
                      </button>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          ) : (
            <AnimatedSection className="text-center py-12">
              <div className="w-20 h-20 bg-[#0d7477]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-[#1a1a2e] dark:text-white mb-2">لا توجد مشاريع نشطة حالياً</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">سيتم إضافة مشاريع قريباً. تابعنا للاطلاع على آخر التحديثات</p>
              <Button
                onClick={handleViewAllProjects}
                className="bg-[#0d7477] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0a5c5e] transition-all"
              >
                تصفح المشاريع
              </Button>
            </AnimatedSection>
          )}

          {/* View All Button */}
          {displayProjects.length > 0 && (
            <AnimatedSection className="text-center mt-12" delay={0.3}>
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
          )}
        </div>
      </section>

      {/* ============================================
          SECTION 7: OUR HISTORY (Timeline)
          ============================================ */}
      <section className="py-20 md:py-24 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-12 md:mb-16">
            <span className="text-[#0d7477] font-bold text-sm uppercase tracking-widest block mb-4">تاريخنا</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#1a1a2e] dark:text-white mb-4">
              رحلة من الإيمان إلى <span className="text-[#D4AF37]">الإنجاز</span>
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
              15 عاماً من العطاء والإنجاز في خدمة الأيتام
            </p>
          </AnimatedSection>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical Line (Desktop) */}
            <div className="hidden md:block absolute top-0 bottom-0 right-1/2 w-1 bg-gradient-to-b from-[#0d7477] via-[#D4AF37] to-[#0d7477] transform translate-x-1/2 rounded-full" />

            {/* Mobile Line */}
            <div className="md:hidden absolute top-0 bottom-0 right-6 w-1 bg-gradient-to-b from-[#0d7477] via-[#D4AF37] to-[#0d7477] rounded-full" />

            <div className="space-y-8 md:space-y-0">
              {historyMilestones.map((milestone, index) => (
                <AnimatedSection
                  key={milestone.year}
                  delay={index * 0.1}
                  className={`relative md:flex md:items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                >
                  {/* Content */}
                  <div className={`md:w-1/2 ${index % 2 === 0 ? 'md:pl-12 md:text-right' : 'md:pr-12 md:text-left'}`}>
                    <div className="bg-white dark:bg-[#252538] rounded-2xl p-6 shadow-lg border border-slate-100 dark:border-slate-700 mr-12 md:mr-0">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{milestone.icon}</span>
                        <span className="text-[#0d7477] font-black text-xl">{milestone.year}</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1a1a2e] dark:text-white mb-2">{milestone.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>

                  {/* Center Dot */}
                  <div className="hidden md:flex absolute right-1/2 transform translate-x-1/2 w-6 h-6 bg-[#0d7477] rounded-full border-4 border-[#faf9f7] dark:border-[#1a1a2e] z-10 items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>

                  {/* Mobile Dot */}
                  <div className="md:hidden absolute right-4 w-5 h-5 bg-[#0d7477] rounded-full border-3 border-[#faf9f7] dark:border-[#1a1a2e] z-10 top-6" />

                  {/* Spacer for alternating layout */}
                  <div className="hidden md:block md:w-1/2" />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 8: SUCCESS STORIES
          ============================================ */}
      <section className="py-20 md:py-24 px-6 bg-[#1a1a2e]">
        <div className="container mx-auto max-w-6xl">
          <AnimatedSection className="text-center mb-12 md:mb-16">
            <span className="text-[#D4AF37] font-bold text-sm uppercase tracking-widest block mb-4">قصص ملهمة</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white">
              قصص نجاح <span className="text-[#0d7477]">ملهمة</span>
            </h2>
          </AnimatedSection>

          {/* Stories Carousel */}
          <AnimatedSection>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
              {successStories.map((story, index) => (
                <div
                  key={story.id}
                  onClick={() => setActiveStoryIndex(index)}
                  className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
                    index === activeStoryIndex
                      ? 'w-full md:w-80 lg:w-96 h-80 md:h-96 md:scale-105 z-10'
                      : 'w-full md:w-56 lg:w-64 h-64 md:h-72 opacity-70 hover:opacity-100'
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
                  <div className="absolute inset-0 p-4 md:p-6 flex flex-col justify-end text-white">
                    {index === activeStoryIndex && (
                      <>
                        <p className="text-xs md:text-sm opacity-80 mb-1 md:mb-2">{story.age}</p>
                        <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">{story.name}</h3>
                        <p className="text-[#D4AF37] font-bold text-sm md:text-base mb-2 md:mb-3">{story.title}</p>
                        <p className="text-xs md:text-sm opacity-90 leading-relaxed line-clamp-3">"{story.quote}"</p>
                      </>
                    )}
                    {index !== activeStoryIndex && (
                      <>
                        <h3 className="text-lg md:text-xl font-bold">{story.name}</h3>
                        <p className="text-xs md:text-sm opacity-80">{story.title}</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          {/* Dots Navigation */}
          <div className="flex justify-center gap-3 mt-6 md:mt-8">
            {successStories.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStoryIndex(index)}
                className={`h-3 rounded-full transition-all ${
                  index === activeStoryIndex ? 'bg-[#D4AF37] w-8' : 'bg-white/30 hover:bg-white/50 w-3'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          SECTION 9: FINAL CTA
          ============================================ */}
      <section className="py-20 md:py-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d7477] via-[#0a5c5e] to-[#0d7477]" />
        <div className="absolute inset-0 opacity-30" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />

        <div className="container mx-auto max-w-4xl relative text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight">
              الآن، في هذه اللحظة،<br />
              <span className="text-[#D4AF37]">طفل ينتظرك</span>
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-8 md:mb-10 max-w-2xl mx-auto">
              قرارك اليوم يصنع فرقاً كبيراً في حياة يتيم. كن السبب في ابتسامته ولمستقبله.
            </p>
            <Button
              onClick={handleDonateClick}
              className="bg-white text-[#0d7477] px-8 md:px-12 py-4 md:py-5 rounded-xl font-black text-lg md:text-xl hover:bg-[#faf9f7] shadow-2xl shadow-black/20 transition-all active:scale-95 inline-flex items-center gap-3 group"
            >
              ابدأ رحلتك الآن
              <svg className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* ============================================
          SECTION 10: TRUST BADGES
          ============================================ */}
      <section className="py-12 md:py-16 px-6 bg-white dark:bg-[#252538] border-t border-slate-100 dark:border-slate-700">
        <div className="container mx-auto max-w-6xl">
          {/* Trust Badges */}
          <AnimatedSection>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
              <div className="flex items-center gap-2 bg-[#faf9f7] dark:bg-[#1a1a2e] px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs md:text-sm font-bold text-[#1a1a2e] dark:text-white">جائزة التميز 2024</span>
              </div>

              <div className="flex items-center gap-2 bg-[#faf9f7] dark:bg-[#1a1a2e] px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs md:text-sm font-bold text-[#1a1a2e] dark:text-white">مسجل رسمياً</span>
              </div>

              <div className="flex items-center gap-2 bg-[#faf9f7] dark:bg-[#1a1a2e] px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-[#0d7477]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-xs md:text-sm font-bold text-[#1a1a2e] dark:text-white">شفافية 100%</span>
              </div>

              <div className="flex items-center gap-2 bg-[#faf9f7] dark:bg-[#1a1a2e] px-4 py-2 rounded-full">
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs md:text-sm font-bold text-[#1a1a2e] dark:text-white">15 عاماً من الخبرة</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default Home;
