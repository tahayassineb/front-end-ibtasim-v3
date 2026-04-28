import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

const introImage = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1600&q=84';
const missionImage = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1400&q=82';
const pillarsImage = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1400&q=82';
const contactImage = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1600&q=82';

const copy = {
  ar: {
    intro: {
      eyebrow: 'جمعية ابتسم لتمكين أسرة اليتيم',
      title: 'من نحن؟',
      lead: 'جمعية ابتسم تعمل على تمكين أسرة اليتيم من خلال برامج مستمرة تجمع بين الكفالة، التعليم، الدعم النفسي، المبادرات الاجتماعية، والشراكات المجتمعية.',
      lines: [
        {
          icon: 'calendar_month',
          title: 'أرشيف أنشطة موثق منذ 2018',
          text: 'نوثق رحلة العمل الميداني والبرامج والمبادرات بشكل مستمر.',
        },
        {
          icon: 'group',
          title: 'برامج موجهة للطفل، الأم، والأسرة',
          text: 'نصمم التدخلات بما يراعي احتياجات كل فرد داخل الأسرة.',
        },
        {
          icon: 'handshake',
          title: 'تعاون مع مبادرات ونواد ومؤسسات',
          text: 'شراكات محلية ودولية تعزز الاستدامة والثقة والأثر.',
        },
      ],
      quote: 'نؤمن أن اليتيم لا يحتاج إلى مساعدة عابرة، بل إلى محيط يراه ويسمعه ويرافقه.',
      cta: 'تعرف أكثر على ابتسم',
      badgeTop: 'منذ',
      badgeMain: '2018',
      badgeBottom: 'نرافق الأيتام وأسرهم',
    },
    mission: {
      kicker: 'رسالتنا ورؤيتنا',
      title: 'نبني بيئة تحيط بالطفل وتمنح الأسرة فرصة للاستقرار',
      lead: 'لا نتعامل مع اليتيم كملف منفصل، بل كجزء من أسرة تحتاج إلى رعاية، إنصات، وتعليم ومساحات أمل مستمرة.',
      blocks: [
        {
          label: 'مهمتنا',
          title: 'مرافقة الأسرة ببرامج عملية',
          text: 'نربط العطاء بمسارات واضحة في الكفالة، التعليم، المواكبة النفسية، والدعم الاجتماعي حتى يصبح الأثر ملموسا في الحياة اليومية.',
        },
        {
          label: 'رؤيتنا',
          title: 'كرامة مستقرة لا مساعدة عابرة',
          text: 'نطمح إلى مجتمع يرى في كفالة اليتيم مسؤولية مستمرة، ويمنح الطفل والأسرة محيطا أكثر أمنا وفرصا أكثر عدلا.',
        },
        {
          label: 'وعدنا',
          title: 'ثقة موثقة وأثر يمكن تتبعه',
          text: 'نوضح أين يذهب الدعم، ونحافظ على كرامة المستفيد، ونبني جسرا موثوقا بين المتبرع والعائلة.',
        },
      ],
    },
    pillars: {
      kicker: 'كيف نصنع الأثر',
      title: 'نشتغل على تفاصيل الحياة اليومية التي تغيّر المسار',
      lead: 'من الكفالة إلى التعليم، ومن الإنصات إلى التمكين، نبني منظومة مرافقة متكاملة حول الطفل وأسرته.',
      items: [
        {
          icon: 'volunteer_activism',
          title: 'الكفالة والرعاية',
          text: 'دعم منتظم يساعد الطفل والأسرة على مواجهة الاحتياجات الأساسية بثبات أكبر.',
        },
        {
          icon: 'school',
          title: 'التعليم وبناء الثقة',
          text: 'دعم دراسي وأنشطة تربوية وتجارب توسع أفق الطفل وتمنحه شعورا أكبر بالقدرة والانتماء.',
        },
        {
          icon: 'favorite',
          title: 'الإنصات والمواكبة',
          text: 'نرافق الأمهات والأطفال نفسيا واجتماعيا لأن الحاجة لا تكون مادية فقط.',
        },
        {
          icon: 'storefront',
          title: 'تمكين الأسرة',
          text: 'مبادرات عملية تساعد الأسرة على بداية أكثر استقلالية وقدرة على الاستمرار.',
        },
        {
          icon: 'celebration',
          title: 'الفرح والكرامة',
          text: 'كسوة، مبادرات موسمية، وتجارب تحفظ للطفل حقه في الاختيار والفرح.',
        },
      ],
      quote: 'كل برنامج نصممه يجب أن يلامس الطفل والأسرة معا، لا أن يقدّم مساعدة معزولة عن واقعهم اليومي.',
    },
    journey: {
      kicker: 'مسيرتنا',
      title: 'رحلة تتسع عاما بعد عام',
      lead: 'تطورت ابتسم من مبادرات ميدانية موثقة إلى منظومة مرافقة أوسع تجمع العمل الاجتماعي، الشراكات، والتتبع المستمر.',
      timeline: [
        {
          year: '2018',
          title: 'بداية الأرشيف الموثق',
          text: 'انطلاق التوثيق المنتظم للأنشطة والبرامج المرتبطة بدعم الطفل والأسرة.',
        },
        {
          year: '2020',
          title: 'توسيع مسارات الكفالة',
          text: 'ترسيخ فكرة المرافقة المستمرة وربطها بالاحتياج اليومي والتعليمي.',
        },
        {
          year: '2024',
          title: 'توسع في الظهور الميداني',
          text: 'برامج وأنشطة أكثر انتظاما، وحضور أكبر للمبادرات الاجتماعية والشبابية.',
        },
        {
          year: '2026',
          title: 'شراكات وأثر أكثر نضجا',
          text: 'تواصل مستمر، مبادرات موثقة، وشبكة تعاون تعزز الثقة والاستدامة.',
          current: true,
        },
      ],
      trustTitle: 'الثقة والاعتمادية',
      trustItems: [
        {
          icon: 'verified',
          title: 'توثيق بصري مستمر',
          text: 'أثر يظهر عبر الصور، المتابعة، والتقارير المنشورة.',
        },
        {
          icon: 'policy',
          title: 'شفافية في الاحتياج',
          text: 'نوضح الاحتياج ونربط الدعم بالمسار الذي سيخدم الطفل والأسرة.',
        },
        {
          icon: 'public',
          title: 'شراكات مجتمعية',
          text: 'تعاون مع مبادرات ونواد ومؤسسات محلية ودولية.',
        },
        {
          icon: 'workspace_premium',
          title: 'كرامة في المساعدة',
          text: 'نعطي الأولوية للطريقة التي تُقدّم بها المساعدة، لا للمساعدة فقط.',
        },
      ],
    },
    partners: {
      kicker: 'شركاؤنا في الأثر',
      title: 'الثقة تُبنى مع محيط يشاركنا نفس المسؤولية',
      lead: 'يظهر في مسار الجمعية تعاون مع مبادرات ونواد ومؤسسات محلية ودولية دعمت الأنشطة والبرامج الموجهة للأطفال والأسر.',
      chips: [
        'Coincide',
        'Lions Club UIR',
        'The Bridge UIR',
        'Club CAS INPT',
        'مؤسسة نفع الوطنية',
        'المجلس العلمي المحلي بسلا',
      ],
    },
    cta: {
      titlePrimary: 'كن جزءا من أثر',
      titleAccent: 'يحفظ الكرامة',
      lead: 'سواء أردت التبرع، الكفالة، التطوع، أو بناء شراكة، هناك دائما طريقة لتكون قريبا من طفل وأسرة يحتاجان إلى سند حقيقي.',
      primary: 'تبرع الآن',
      secondary: 'تواصل معنا',
      footer: 'نحوّل الدعم إلى مرافقة يومية تصنع الطمأنينة والفرصة.',
    },
  },
  fr: {
    intro: {
      eyebrow: 'Association Ibtassim',
      title: 'Qui sommes-nous ?',
      lead: "L'association Ibtassim accompagne la famille de l'orphelin par la kafala, l'education, le soutien psychosocial et les partenariats communautaires.",
      lines: [
        { icon: 'calendar_month', title: 'Archive documentee depuis 2018', text: "Une trace continue du travail de terrain et des programmes." },
        { icon: 'group', title: "Des programmes pour l'enfant, la mere et la famille", text: 'Nous concevons chaque action autour du cercle familial complet.' },
        { icon: 'handshake', title: 'Des collaborations locales et internationales', text: 'Des partenariats qui renforcent la confiance et la durabilite.' },
      ],
      quote: "L'orphelin n'a pas besoin d'une aide passagere, mais d'un environnement qui l'accompagne.",
      cta: 'En savoir plus',
      badgeTop: 'Depuis',
      badgeMain: '2018',
      badgeBottom: 'aux cotes des familles',
    },
    mission: {
      kicker: 'Mission, vision, promesse',
      title: 'Une presence qui relie soutien, stabilite et dignite',
      lead: "Nous accompagnons l'enfant et sa famille dans la duree, a travers des parcours utiles, lisibles et humains.",
      blocks: [
        { label: 'Mission', title: 'Accompagner la famille par des programmes concrets', text: "Kafala, education, ecoute et soutien social pour transformer le don en impact quotidien." },
        { label: 'Vision', title: 'Une dignite stable, pas une aide ponctuelle', text: "Une societe ou l'accompagnement de l'orphelin devient une responsabilite continue." },
        { label: 'Promesse', title: 'Une confiance documentee', text: "Montrer ou va le soutien et proteger la dignite des familles accompagnees." },
      ],
    },
    pillars: {
      kicker: 'Comment nous agissons',
      title: 'Nous travaillons sur les details qui changent un parcours',
      lead: "De la kafala a l'education, nous construisons un accompagnement coherent autour de l'enfant et de sa famille.",
      items: [
        { icon: 'volunteer_activism', title: 'Kafala et soutien', text: 'Un appui stable relie aux besoins essentiels de la famille.' },
        { icon: 'school', title: 'Education et confiance', text: 'Soutien scolaire, activites et experiences qui ouvrent des perspectives.' },
        { icon: 'favorite', title: 'Ecoute et accompagnement', text: "Parce que le besoin n'est pas uniquement materiel." },
        { icon: 'storefront', title: 'Autonomisation familiale', text: 'Des initiatives pour une famille plus stable et plus autonome.' },
        { icon: 'celebration', title: 'Joie et dignite', text: 'Des initiatives saisonnieres qui preservent la joie et le choix.' },
      ],
      quote: "Chaque programme doit toucher l'enfant et la famille ensemble, pas seulement traiter un besoin isole.",
    },
    journey: {
      kicker: 'Notre parcours',
      title: 'Une trajectoire qui grandit avec le terrain',
      lead: 'Ibtassim a evolue vers un accompagnement plus large, plus documente et plus structure.',
      timeline: [
        { year: '2018', title: 'Debut de l’archive', text: 'Mise en place d’un archivage visuel continu du travail de terrain.' },
        { year: '2020', title: 'Developpement de la kafala', text: "Renforcement de l'accompagnement regulier des enfants et des familles." },
        { year: '2024', title: 'Presence sociale accrue', text: 'Plus de programmes, plus de terrain, plus de presence communautaire.' },
        { year: '2026', title: 'Maturite et partenariats', text: 'Des initiatives documentees et une confiance plus large.', current: true },
      ],
      trustTitle: 'Confiance et credibilite',
      trustItems: [
        { icon: 'verified', title: 'Documentation continue', text: 'Un impact visible a travers la preuve et le suivi.' },
        { icon: 'policy', title: 'Besoin clarifie', text: 'Un soutien relie a une trajectoire concrete.' },
        { icon: 'public', title: 'Partenariats actifs', text: 'Des collaborations locales et internationales.' },
        { icon: 'workspace_premium', title: 'Dignite preservee', text: "La maniere d'aider compte autant que l'aide elle-meme." },
      ],
    },
    partners: {
      kicker: 'Partenaires',
      title: 'Une confiance construite avec un ecosystème engage',
      lead: "Le parcours de l'association montre des cooperations avec des clubs, initiatives et institutions qui soutiennent les programmes.",
      chips: ['Coincide', 'Lions Club UIR', 'The Bridge UIR', 'Club CAS INPT', 'Nafaa Foundation', 'Conseil local de Sale'],
    },
    cta: {
      titlePrimary: 'Faites partie',
      titleAccent: "d'un impact digne",
      lead: 'Don, kafala, benevolat ou partenariat: il existe toujours une maniere utile de soutenir un enfant et sa famille.',
      primary: 'Donner maintenant',
      secondary: 'Nous contacter',
      footer: 'Nous transformons le soutien en accompagnement quotidien.',
    },
  },
  en: {
    intro: {
      eyebrow: 'Association Ibtassim',
      title: 'Who are we?',
      lead: 'Association Ibtassim supports orphan families through sponsorship, education, psychosocial support, social initiatives, and community partnerships.',
      lines: [
        { icon: 'calendar_month', title: 'A documented archive since 2018', text: 'A continuous record of field work, programs, and initiatives.' },
        { icon: 'group', title: 'Programs for child, mother, and family', text: 'We shape every action around the full family circle.' },
        { icon: 'handshake', title: 'Local and international collaboration', text: 'Partnerships that strengthen trust, reach, and continuity.' },
      ],
      quote: 'An orphan child does not need passing help. They need an environment that sees, hears, and accompanies them.',
      cta: 'Learn more about Ibtassim',
      badgeTop: 'Since',
      badgeMain: '2018',
      badgeBottom: 'beside families',
    },
    mission: {
      kicker: 'Mission, vision, promise',
      title: 'Support that connects dignity, stability, and daily care',
      lead: 'We support the child and the family over time through clear, practical, and human-centered programs.',
      blocks: [
        { label: 'Mission', title: 'Accompany families through real programs', text: 'Sponsorship, education, listening, and social support that turn giving into visible daily impact.' },
        { label: 'Vision', title: 'Stable dignity, not temporary relief', text: 'A society where supporting an orphan child becomes an ongoing responsibility.' },
        { label: 'Promise', title: 'Documented trust', text: 'We show where support goes and protect the dignity of every family we accompany.' },
      ],
    },
    pillars: {
      kicker: 'How we work',
      title: 'We work on the daily details that change a life path',
      lead: 'From sponsorship to education and psychosocial care, we build a coherent support system around the child and family.',
      items: [
        { icon: 'volunteer_activism', title: 'Sponsorship and care', text: 'Stable support tied to essential family needs.' },
        { icon: 'school', title: 'Education and confidence', text: 'Academic support and experiences that open wider possibilities.' },
        { icon: 'favorite', title: 'Listening and support', text: 'Because need is never only material.' },
        { icon: 'storefront', title: 'Family empowerment', text: 'Practical initiatives that help families become steadier and more independent.' },
        { icon: 'celebration', title: 'Joy and dignity', text: 'Seasonal initiatives that preserve joy, choice, and belonging.' },
      ],
      quote: 'Every program should reach the child and the family together, not address need in isolation.',
    },
    journey: {
      kicker: 'Our journey',
      title: 'A path that grows with the field',
      lead: 'Ibtassim has grown into a broader, more documented, and more structured support ecosystem.',
      timeline: [
        { year: '2018', title: 'Documented beginnings', text: 'A steady visual archive of field work and early programs.' },
        { year: '2020', title: 'Expanded sponsorship paths', text: 'Stronger regular accompaniment for children and families.' },
        { year: '2024', title: 'More visible social work', text: 'A wider presence in programs, social initiatives, and community life.' },
        { year: '2026', title: 'Maturity and partnerships', text: 'Documented initiatives and a stronger network of trust.', current: true },
      ],
      trustTitle: 'Trust and credibility',
      trustItems: [
        { icon: 'verified', title: 'Continuous documentation', text: 'Visible impact through proof, follow-up, and records.' },
        { icon: 'policy', title: 'Clear need framing', text: 'Support tied to concrete paths of care and growth.' },
        { icon: 'public', title: 'Active partnerships', text: 'Local and international collaboration around impact.' },
        { icon: 'workspace_premium', title: 'Dignity-first practice', text: 'How support is delivered matters as much as the support itself.' },
      ],
    },
    partners: {
      kicker: 'Partners',
      title: 'Trust is built with an ecosystem that shares responsibility',
      lead: 'The association’s journey shows collaboration with clubs, initiatives, and institutions supporting children and families.',
      chips: ['Coincide', 'Lions Club UIR', 'The Bridge UIR', 'Club CAS INPT', 'Nafaa Foundation', 'Local Council of Sale'],
    },
    cta: {
      titlePrimary: 'Be part of',
      titleAccent: 'dignity-centered impact',
      lead: 'Donate, sponsor, volunteer, or build a partnership. There is always a meaningful way to stand beside a child and family.',
      primary: 'Donate now',
      secondary: 'Contact us',
      footer: 'We turn support into daily accompaniment that creates stability and opportunity.',
    },
  },
};

function useRevealMotion() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.about-v2 .home-reveal'));
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

export default function About() {
  const { language, currentLanguage } = useApp();
  const lang = currentLanguage?.code || language || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = copy[lang] || copy.ar;

  useRevealMotion();

  return (
    <div className="about-v2" dir={dir}>
      <section className="about-v2__intro">
        <div className="about-v2__shell">
          <div className="about-v2__intro-header">
            <h1 className="home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.intro.title}</h1>
            <p className="about-v2__eyebrow home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.intro.eyebrow}</p>
          </div>

          <div className="about-v2__intro-media home-reveal" style={{ '--reveal-delay': '170ms' }}>
            <img src={introImage} alt="" loading="eager" />
          </div>

          <div className="about-v2__intro-copy">
            <p className="about-v2__lead home-reveal" style={{ '--reveal-delay': '220ms' }}>{t.intro.lead}</p>

            <div className="about-v2__proof-lines">
              {t.intro.lines.map((line, index) => (
                <article key={line.title} className="home-reveal" style={{ '--reveal-delay': `${290 + index * 70}ms` }}>
                  <span className="material-symbols-outlined">{line.icon}</span>
                  <strong>{line.title}</strong>
                  <p>{line.text}</p>
                </article>
              ))}
            </div>

            <blockquote className="home-reveal" style={{ '--reveal-delay': '520ms' }}>
              <span className="material-symbols-outlined">format_quote</span>
              <p>{t.intro.quote}</p>
            </blockquote>

            <Link className="about-v2__button home-reveal" style={{ '--reveal-delay': '590ms' }} to="/contact">
              {t.intro.cta}
              <span className="material-symbols-outlined">{dir === 'rtl' ? 'arrow_back' : 'arrow_forward'}</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="about-v2__mission">
        <div className="about-v2__shell">
          <div className="about-v2__section-intro about-v2__section-intro--center">
            <p className="about-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.mission.kicker}</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.mission.title}</h2>
            <p className="about-v2__lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.mission.lead}</p>
          </div>

          <div className="about-v2__mission-band">
            <div className="about-v2__mission-image home-reveal" style={{ '--reveal-delay': '80ms' }}>
              <img src={missionImage} alt="" loading="lazy" />
            </div>
            <div className="about-v2__mission-stack">
              {t.mission.blocks.map((block, index) => (
                <article key={block.label} className="about-v2__mission-card home-reveal" style={{ '--reveal-delay': `${150 + index * 80}ms` }}>
                  <span>{block.label}</span>
                  <strong>{block.title}</strong>
                  <p>{block.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-v2__pillars">
        <div className="about-v2__shell about-v2__pillars-grid">
          <div className="about-v2__pillars-copy">
            <p className="about-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.pillars.kicker}</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.pillars.title}</h2>
            <p className="about-v2__lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.pillars.lead}</p>

            <div className="about-v2__pillar-list">
              {t.pillars.items.map((item, index) => (
                <article key={item.title} className="home-reveal" style={{ '--reveal-delay': `${250 + index * 70}ms` }}>
                  <div className="about-v2__pillar-icon">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>

            <blockquote className="about-v2__soft-quote home-reveal" style={{ '--reveal-delay': '610ms' }}>
              {t.pillars.quote}
            </blockquote>
          </div>

          <div className="about-v2__pillars-media home-reveal" style={{ '--reveal-delay': '120ms' }}>
            <img src={pillarsImage} alt="" loading="lazy" />
          </div>
        </div>
      </section>

      <section className="about-v2__journey">
        <div className="about-v2__shell about-v2__journey-grid">
          <div className="about-v2__timeline-wrap">
            <p className="about-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.journey.kicker}</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.journey.title}</h2>
            <p className="about-v2__lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.journey.lead}</p>

            <div className="about-v2__timeline">
              {t.journey.timeline.map((item, index) => (
                <article key={`${item.year}-${item.title}`} className={`about-v2__timeline-item ${item.current ? 'is-current' : ''} home-reveal`} style={{ '--reveal-delay': `${250 + index * 80}ms` }}>
                  <div className="about-v2__timeline-dot" />
                  <span>{item.year}</span>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="about-v2__trust-panel">
            <p className="about-v2__kicker home-reveal" style={{ '--reveal-delay': '80ms' }}>{t.journey.trustTitle}</p>
            <div className="about-v2__trust-list">
              {t.journey.trustItems.map((item, index) => (
                <article key={item.title} className="home-reveal" style={{ '--reveal-delay': `${150 + index * 70}ms` }}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-v2__partners">
        <div className="about-v2__shell about-v2__partners-panel">
          <div className="about-v2__section-intro">
            <p className="about-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.partners.kicker}</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.partners.title}</h2>
            <p className="about-v2__lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.partners.lead}</p>
          </div>

          <div className="about-v2__partner-chips">
            {t.partners.chips.map((chip, index) => (
              <span key={chip} className="home-reveal" style={{ '--reveal-delay': `${250 + index * 50}ms` }}>{chip}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="about-v2__cta">
        <div className="about-v2__shell about-v2__cta-panel">
          <div className="about-v2__cta-copy">
            <p className="about-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>ابتسم</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>
              <span>{t.cta.titlePrimary}</span>
              <em>{t.cta.titleAccent}</em>
            </h2>
            <p className="about-v2__lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.cta.lead}</p>
            <div className="about-v2__cta-actions home-reveal" style={{ '--reveal-delay': '250ms' }}>
              <Link className="about-v2__button about-v2__button--primary" to="/projects">
                {t.cta.primary}
              </Link>
              <Link className="about-v2__button about-v2__button--secondary" to="/contact">
                {t.cta.secondary}
              </Link>
            </div>
            <p className="about-v2__cta-foot home-reveal" style={{ '--reveal-delay': '320ms' }}>{t.cta.footer}</p>
          </div>

          <div className="about-v2__cta-image home-reveal" style={{ '--reveal-delay': '120ms' }}>
            <img src={contactImage} alt="" loading="lazy" />
          </div>
        </div>
      </section>
    </div>
  );
}
