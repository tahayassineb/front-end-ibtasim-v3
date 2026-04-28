import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useApp } from '../../../context/AppContext';
import { convexFileUrl } from '../../../lib/convex';
import { formatMAD } from '../../../lib/money';

const heroImage = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1800&q=84';
const summaryImage = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1400&q=82';
const projectImageA = 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&w=1400&q=82';
const projectImageB = 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1400&q=82';
const kafalaHeroImage = 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1400&q=82';
const kafalaPreviewA = 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=900&q=82';
const kafalaPreviewB = 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=82';
const kafalaPreviewC = 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=900&q=82';
const aboutImage = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1400&q=82';
const contactImage = 'https://images.unsplash.com/photo-1518281361980-b26bfd556770?auto=format&fit=crop&w=1600&q=82';

const copy = {
  ar: {
    hero: {
      eyebrow: 'جمعية ابتسم لتمكين أسرة اليتيم',
      titlePrimary: 'نرافق اليتيم وأسرته',
      titleAccent: 'نحو حياة أكثر كرامة',
      lead: 'نعمل مع الأطفال اليتامى وأسرهم من خلال الكفالة، التعليم، الدعم النفسي، وتمكين الأسرة، حتى يتحول العطاء إلى أثر يومي واضح.',
      primaryCta: 'ساهم في مشروع',
      secondaryCta: 'اكفل طفلاً',
      trustItems: ['عمل ميداني موثق', 'برامج مستمرة', 'مرافقة تحفظ كرامة الطفل'],
    },
    stats: {
      title: 'أثر يتراكم منذ سنوات',
      items: [
        { value: 'منذ 2018', label: 'بداية الأرشيف المنشور لأنشطتنا', icon: 'calendar_month' },
        { value: '362', label: 'مادة موثقة من منشورات وريلز', icon: 'description' },
        { value: '+19,900', label: 'تفاعل مرصود مع محتوى الجمعية', icon: 'groups' },
        { value: '104', label: 'مادة منشورة خلال سنة 2025', icon: 'monitoring' },
      ],
    },
    summary: {
      kicker: 'ماذا نفعل',
      title: 'نعمل مع الطفل، ومع الأسرة التي تحمله كل يوم',
      lead: 'في ابتسم، لا نرى اليتيم كحالة منفصلة عن محيطها. نرافق الطفل في دراسته ونموه، ونساند الأم والأسرة، ونفتح مساحات للفرح، التعلم، والكرامة.',
      items: [
        { icon: 'volunteer_activism', title: 'كفالة ورعاية شهرية للأطفال اليتامى', text: 'دعم مستمر يربط الكفالة بالاحتياج اليومي والاستقرار الأسري.' },
        { icon: 'school', title: 'دعم دراسي وأنشطة تربوية ورياضية وثقافية', text: 'مسارات تعلم وتجارب توسع أفق الطفل وتبني ثقته.' },
        { icon: 'favorite', title: 'إنصات ومواكبة نفسية واجتماعية', text: 'نرافق الأمهات والأطفال لأن الحاجة ليست مادية فقط.' },
        { icon: 'shopping_basket', title: 'مبادرات غذائية وموسمية تحفظ الكرامة', text: 'من القفة إلى كسوة العيد، نركز على أثر يومي محسوس.' },
      ],
      quote: 'من كسوة العيد إلى الدعم الدراسي، ومن حصص الإنصات إلى مشاريع تمكين الأسرة، نشتغل على تفاصيل الحياة اليومية التي تصنع الفرق.',
    },
    projects: {
      kicker: 'المشاريع الحالية',
      title: 'مشاريع يمكنك أن تساهم فيها اليوم',
      lead: 'نختار مشاريع واضحة الهدف، مرتبطة باحتياج حقيقي، حتى يعرف المتبرع أين يذهب دعمه وما الأثر الذي يصنعه.',
      allCta: 'عرض كل المشاريع',
      action: 'ساهم الآن',
    },
    kafala: {
      kicker: 'الكفالة',
      title: 'الكفالة عندنا مرافقة، وليست رقماً شهرياً فقط',
      lead: 'نبدأ بفهم وضع الطفل وأسرته، ثم نربط الكفالة باحتياجاته اليومية والدراسية والنفسية. هدفنا أن يشعر الطفل بالاستقرار، وأن تجد الأسرة سنداً مستمراً.',
      steps: [
        { number: '1', icon: 'diversity_3', title: 'نفهم الحالة', text: 'نتعرف على وضع الطفل والأسرة واحتياجاتهم الأساسية.' },
        { number: '2', icon: 'alt_route', title: 'نحدد مسار الدعم', text: 'نربط الكفالة بالتعليم، الرعاية، المتابعة، والاحتياجات الشهرية.' },
        { number: '3', icon: 'favorite', title: 'نشارك الأثر', text: 'نواكب الطفل والأسرة حتى لا تبقى الكفالة مجرد تحويل مالي.' },
      ],
      quote: 'نؤمن أن كل طفل يستحق من يرافقه ليصل إلى إمكاناته.',
      allCta: 'عرض حالات الكفالة',
      previewCta: 'عرض الحالة',
      centerTitle: 'كفالتك تصنع فرقاً',
      centerText: 'في حياتهم وتمنحهم فرصة لحلم ومستقبل أكثر إشراقاً.',
      band: 'معاً، نحول الكفالة إلى مرافقة تصنع الأثر في حياة طفل وأسرة.',
    },
  },
  fr: {
    hero: {
      eyebrow: 'Association Ibtassim',
      titlePrimary: "Nous accompagnons l'enfant",
      titleAccent: 'et sa famille avec dignite',
      lead: "Nous soutenons l'orphelin et sa famille par la kafala, l'education, l'ecoute et l'autonomisation familiale.",
      primaryCta: 'Soutenir un projet',
      secondaryCta: 'Parrainer un enfant',
      trustItems: ['Travail de terrain', 'Programmes continus', 'Dignite preservee'],
    },
    stats: {
      title: 'Un impact qui grandit',
      items: [
        { value: 'Depuis 2018', label: "Debut de l'archive publiee", icon: 'calendar_month' },
        { value: '362', label: 'elements documentes', icon: 'description' },
        { value: '+19,900', label: 'interactions observees', icon: 'groups' },
        { value: '104', label: 'publications en 2025', icon: 'monitoring' },
      ],
    },
    summary: {
      kicker: 'Ce que nous faisons',
      title: "Nous soutenons l'enfant et la famille qui l'entoure",
      lead: "Chez Ibtassim, l'orphelin n'est jamais isole. Nous accompagnons l'enfant, la mere et la famille dans la duree.",
      items: [
        { icon: 'volunteer_activism', title: 'Kafala et soutien mensuel', text: 'Un soutien stable relie aux besoins quotidiens.' },
        { icon: 'school', title: 'Education et activites', text: 'Soutien scolaire, clubs, sorties et apprentissage.' },
        { icon: 'favorite', title: 'Ecoute et accompagnement psychosocial', text: "Parce que le besoin n'est pas seulement materiel." },
        { icon: 'shopping_basket', title: 'Aide saisonniere avec dignite', text: 'Ramadan, Aid et soutien alimentaire concret.' },
      ],
      quote: "Du vetement de l'Aid au soutien scolaire, nous travaillons sur les details quotidiens qui changent une vie.",
    },
    projects: {
      kicker: 'Projets en cours',
      title: "Des projets que vous pouvez soutenir aujourd'hui",
      lead: 'Nous proposons des projets lisibles, lies a des besoins reels et a un impact concret.',
      allCta: 'Voir tous les projets',
      action: 'Contribuer',
    },
    kafala: {
      kicker: 'Kafala',
      title: "La kafala est un accompagnement, pas seulement un montant mensuel",
      lead: "Nous comprenons d'abord la situation de l'enfant et de sa famille, puis nous relions le soutien a ses besoins reels.",
      steps: [
        { number: '1', icon: 'diversity_3', title: 'Comprendre la situation', text: "Connaitre l'enfant, la famille et les besoins essentiels." },
        { number: '2', icon: 'alt_route', title: 'Definir le soutien', text: "Relier la kafala a l'education, au soin et au suivi." },
        { number: '3', icon: 'favorite', title: 'Partager l’impact', text: "Suivre l'enfant et la famille dans la duree." },
      ],
      quote: 'Chaque enfant merite un accompagnement vers son potentiel.',
      allCta: 'Voir les cas de kafala',
      previewCta: 'Voir le cas',
      centerTitle: 'Votre kafala fait la difference',
      centerText: 'et donne a un enfant et sa famille une stabilite durable.',
      band: 'Ensemble, nous transformons la kafala en accompagnement durable.',
    },
  },
  en: {
    hero: {
      eyebrow: 'Association Ibtassim',
      titlePrimary: 'We support the orphan child',
      titleAccent: 'and the family around them',
      lead: 'We work through sponsorship, education, psychosocial care, and family empowerment so giving becomes visible daily impact.',
      primaryCta: 'Support a project',
      secondaryCta: 'Sponsor a child',
      trustItems: ['Field work', 'Ongoing programs', 'Dignity first'],
    },
    stats: {
      title: 'Impact built over time',
      items: [
        { value: 'Since 2018', label: 'public archive of our work', icon: 'calendar_month' },
        { value: '362', label: 'documented posts and reels', icon: 'description' },
        { value: '+19,900', label: 'observed engagements', icon: 'groups' },
        { value: '104', label: 'published items in 2025', icon: 'monitoring' },
      ],
    },
    summary: {
      kicker: 'What we do',
      title: 'We work with the child and the family carrying them every day',
      lead: 'At Ibtassim, the orphan child is never treated as an isolated case. We support the child, the mother, and the whole family over time.',
      items: [
        { icon: 'volunteer_activism', title: 'Monthly sponsorship and care', text: 'Stable support tied to daily needs and family stability.' },
        { icon: 'school', title: 'Education and growth', text: 'Academic support, clubs, camps, and learning experiences.' },
        { icon: 'favorite', title: 'Listening and psychosocial support', text: 'Because need is not only material.' },
        { icon: 'shopping_basket', title: 'Seasonal aid with dignity', text: 'Ramadan, Eid clothing, and food support with care.' },
      ],
      quote: 'From Eid clothing to school support and family empowerment, we work on the daily details that make the difference.',
    },
    projects: {
      kicker: 'Current projects',
      title: 'Projects you can support today',
      lead: 'We highlight projects with a clear goal, a real need, and visible impact.',
      allCta: 'View all projects',
      action: 'Contribute',
    },
    kafala: {
      kicker: 'Kafala',
      title: 'Sponsorship here is accompaniment, not just a monthly amount',
      lead: 'We begin by understanding the child and family, then connect sponsorship to daily, educational, and emotional needs.',
      steps: [
        { number: '1', icon: 'diversity_3', title: 'Understand the case', text: 'Learn the child’s situation and essential family needs.' },
        { number: '2', icon: 'alt_route', title: 'Shape the support path', text: 'Tie sponsorship to education, care, and monthly needs.' },
        { number: '3', icon: 'favorite', title: 'Share the impact', text: 'Follow the child and family over time.' },
      ],
      quote: 'Every child deserves someone who walks with them toward their potential.',
      allCta: 'View sponsorship cases',
      previewCta: 'View case',
      centerTitle: 'Your sponsorship creates a real difference',
      centerText: 'and gives a child and family steadier ground for the future.',
      band: 'Together, we turn sponsorship into long-term accompaniment.',
    },
  },
};

copy.ar.about = {
  kicker: 'من نحن',
  title: 'من نحن؟',
  lead: 'جمعية ابتسم تعمل على تمكين أسرة اليتيم من خلال برامج مستمرة تجمع بين الكفالة، التعليم، الدعم النفسي، المبادرات الاجتماعية، والشراكات المجتمعية.',
  lines: [
    { icon: 'calendar_month', title: 'أرشيف أنشطة موثق منذ 2018', text: 'توثيق مستمر لرحلة الأثر والبرامج والمبادرات.' },
    { icon: 'group', title: 'برامج موجهة للطفل، الأم، والأسرة', text: 'نراعي احتياجات كل فرد ضمن الأسرة.' },
    { icon: 'handshake', title: 'تعاون مع مبادرات ونواد ومؤسسات', text: 'شراكات محلية ودولية تعزز الاستدامة والأثر.' },
  ],
  quote: 'نؤمن أن اليتيم لا يحتاج إلى مساعدة عابرة، بل إلى محيط يراه ويسمعه ويرافقه.',
  cta: 'تعرف أكثر على ابتسم',
  badgeTop: 'منذ',
  badgeMain: '2018',
  badgeBottom: 'نرافق الأيتام وأسرهم',
};

copy.fr.about = {
  kicker: 'Qui sommes-nous',
  title: 'Qui sommes-nous ?',
  lead: "L'association Ibtassim accompagne la famille de l'orphelin par la kafala, l'education, le soutien psychosocial et les partenariats communautaires.",
  lines: [
    { icon: 'calendar_month', title: 'Archive documentee depuis 2018', text: "Une trace continue des programmes et de l'impact." },
    { icon: 'group', title: 'Des programmes pour l’enfant, la mere et la famille', text: 'Nous accompagnons tout le cercle familial.' },
    { icon: 'handshake', title: 'Des collaborations locales et internationales', text: 'Pour renforcer la confiance, la duree et la portee.' },
  ],
  quote: "L'orphelin n'a pas besoin d'une aide passagere, mais d'un environnement qui l'accompagne.",
  cta: 'En savoir plus',
  badgeTop: 'Depuis',
  badgeMain: '2018',
  badgeBottom: 'aux cotes des familles',
};

copy.en.about = {
  kicker: 'About us',
  title: 'Who are we?',
  lead: 'Association Ibtassim supports orphan families through sponsorship, education, psychosocial support, social initiatives, and community partnerships.',
  lines: [
    { icon: 'calendar_month', title: 'A documented archive since 2018', text: 'A steady record of programs, initiatives, and impact.' },
    { icon: 'group', title: 'Programs for child, mother, and family', text: 'We support the full family circle.' },
    { icon: 'handshake', title: 'Collaboration with clubs and institutions', text: 'Local and international partnerships strengthen trust and continuity.' },
  ],
  quote: 'An orphan child does not need passing help. They need an environment that sees, hears, and accompanies them.',
  cta: 'Learn more about Ibtassim',
  badgeTop: 'Since',
  badgeMain: '2018',
  badgeBottom: 'beside families',
};

copy.ar.contact = {
  titlePrimary: 'هل تريد المساعدة',
  titleAccent: 'بطريقة مختلفة؟',
  lead: 'إذا كنت ترغب في التبرع، الكفالة، التطوع، أو بناء شراكة، تواصل معنا وسنساعدك على اختيار الطريق الأنسب لصناعة الأثر.',
  primaryCta: 'ساهم الآن',
  secondaryCta: 'تواصل معنا',
  footer: 'كل مساهمة يمكن أن تصبح بداية طمأنينة لطفل وأسرة.',
};

copy.fr.contact = {
  titlePrimary: 'Voulez-vous aider',
  titleAccent: 'autrement ?',
  lead: 'Don, kafala, benevolat ou partenariat: contactez-nous et nous vous orienterons vers la voie la plus utile.',
  primaryCta: 'Contribuer',
  secondaryCta: 'Nous contacter',
  footer: 'Chaque contribution peut devenir un debut de serenite.',
};

copy.en.contact = {
  titlePrimary: 'Would you like to help',
  titleAccent: 'in another way?',
  lead: 'Donate, sponsor, volunteer, or build a partnership. Contact us and we will guide you to the most useful path.',
  primaryCta: 'Contribute now',
  secondaryCta: 'Contact us',
  footer: 'Every contribution can become the start of stability for a child and a family.',
};

const fallbackProjects = [
  {
    _id: 'fallback-eid',
    slug: 'eid-clothing',
    image: projectImageA,
    raisedAmount: 650,
    goalAmount: 1000,
    tag: { ar: 'مشروع موسمي', fr: 'Projet saisonnier', en: 'Seasonal project' },
    title: { ar: 'كسوة العيد', fr: "Tenue de l'Aid", en: 'Eid clothing' },
    description: {
      ar: 'فرحة العيد لا تكتمل حين يشعر طفل أنه مختلف عن باقي الأطفال. مساهمتك تساعده على اختيار لباسه بنفسه وبكرامة.',
      fr: "Aider un enfant a choisir sa tenue de l'Aid avec dignite.",
      en: 'Help a child choose Eid clothing with dignity and belonging.',
    },
  },
  {
    _id: 'fallback-ramadan',
    slug: 'ramadan-basket',
    image: projectImageB,
    raisedAmount: 720,
    goalAmount: 1000,
    tag: { ar: 'مشروع غذائي', fr: 'Projet alimentaire', en: 'Food support' },
    title: { ar: 'قفة رمضان', fr: 'Panier Ramadan', en: 'Ramadan basket' },
    description: {
      ar: 'دعم غذائي يخفف عبء الشهر الكريم عن أسر الأيتام، ويمنح الأسرة مساحة من الطمأنينة.',
      fr: 'Un soutien alimentaire pour les familles pendant Ramadan.',
      en: 'Food support that reduces the Ramadan burden on orphan families.',
    },
  },
];

const fallbackKafala = [
  {
    _id: 'fallback-kafala-a',
    image: kafalaPreviewA,
    title: {
      ar: 'طفل يحتاج إلى دعم دراسي ورعاية شهرية',
      fr: 'Un enfant a besoin de soutien scolaire et de soins',
      en: 'A child needs school support and monthly care',
    },
    description: {
      ar: 'تساعدك كفالتك على توفير تعليم جيد، متابعة يومية، واحتياجات أساسية تمنحه الاستقرار والثقة.',
      fr: "Votre kafala aide a assurer l'education, le suivi et les besoins essentiels.",
      en: 'Your sponsorship supports education, daily follow-up, and essential needs.',
    },
  },
  {
    _id: 'fallback-kafala-b',
    image: kafalaPreviewB,
    title: {
      ar: 'طفلة تحتاج إلى كفالة تساعد أسرتها على الاستقرار',
      fr: 'Une fille a besoin d’un soutien familial stable',
      en: 'A girl needs sponsorship that steadies her family',
    },
    description: {
      ar: 'تساعد كفالتك على تخفيف احتياجات الأسرة الأساسية ودعم التعليم والرعاية النفسية للطفلة.',
      fr: "La kafala soutient la famille, l'education et l'accompagnement.",
      en: 'Your sponsorship helps cover essential family needs while supporting education and care.',
    },
  },
  {
    _id: 'fallback-kafala-c',
    image: kafalaPreviewC,
    title: {
      ar: 'طفل يحتاج إلى كفالة تمنحه متابعة ورعاية أكثر استقراراً',
      fr: 'Un enfant a besoin d’un accompagnement plus stable',
      en: 'A child needs sponsorship with steadier follow-up and care',
    },
    description: {
      ar: 'تمنح الكفالة دعماً ثابتاً يساعد الطفل على الاستمرار في التعلم والعيش في محيط أكثر طمأنينة وثباتاً.',
      fr: 'La kafala offre un soutien stable qui renforce l’apprentissage et la sécurité.',
      en: 'Sponsorship provides stable support that strengthens learning and day-to-day security.',
    },
  },
];

const getText = (value, lang) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[lang] || value.ar || value.fr || value.en || '';
};

const getFirstText = (item, lang, keys) => {
  for (const key of keys) {
    const value = item?.[key];
    const text = getText(value, lang);
    if (text) return text;
  }
  return '';
};

const resolveImage = (item, fallback = '') => {
  if (!item) return fallback;
  const candidates = [item.mainImage, item.image, item.photo, item.coverImage, item.profileImage];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const url = convexFileUrl(candidate) || candidate;
    if (url) return url;
  }
  return fallback;
};

function useRevealMotion() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('.home-v2 .home-reveal'));
    if (!nodes.length) return undefined;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);
}

const getStatTarget = (index) => {
  switch (index) {
    case 0:
      return 2018;
    case 1:
      return 362;
    case 2:
      return 19900;
    case 3:
      return 104;
    default:
      return 0;
  }
};

const formatStatValue = (index, value, lang) => {
  const locale = lang === 'ar' ? 'ar-MA' : lang === 'fr' ? 'fr-FR' : 'en-US';
  const formatted = new Intl.NumberFormat(locale).format(value);

  if (index === 0) {
    if (lang === 'ar') return `منذ ${formatted}`;
    if (lang === 'fr') return `Depuis ${formatted}`;
    return `Since ${formatted}`;
  }

  if (index === 2) {
    return `+${formatted}`;
  }

  return formatted;
};

export default function Home() {
  const { language, currentLanguage } = useApp();
  const lang = currentLanguage?.code || language || 'ar';
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const t = copy[lang] || copy.ar;
  const statsRef = useRef(null);
  const [statValues, setStatValues] = useState(() => t.stats.items.map(() => 0));

  useRevealMotion();

  const projects = useQuery(api.projects.getProjects, { featured: true, limit: 6 });
  const kafala = useQuery(api.kafala.getPublicKafalaList, { featured: true, limit: 4 });

  const visibleProjects = useMemo(() => {
    const liveProjects = (projects || []).slice(0, 2);
    return [...liveProjects, ...fallbackProjects].slice(0, 2);
  }, [projects]);

  const visibleKafala = useMemo(() => {
    const liveKafala = (kafala || []).slice(0, 3);
    return [...liveKafala, ...fallbackKafala].slice(0, 3);
  }, [kafala]);

  useEffect(() => {
    const targets = t.stats.items.map((_, index) => getStatTarget(index));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setStatValues(targets);
      return undefined;
    }

    setStatValues(targets.map(() => 0));

    if (!statsRef.current) return undefined;

    let rafId = 0;
    let hasAnimated = false;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || hasAnimated) return;
      hasAnimated = true;
      const startedAt = performance.now();
      const duration = 1400;

      const tick = (now) => {
        const progress = Math.min((now - startedAt) / duration, 1);
        const eased = 1 - ((1 - progress) ** 3);
        setStatValues(targets.map((target) => {
          const nextValue = Math.round(target * eased);
          return progress < 1 ? Math.max(nextValue, 1) : target;
        }));
        if (progress < 1) {
          rafId = window.requestAnimationFrame(tick);
        }
      };

      rafId = window.requestAnimationFrame(tick);
      observer.disconnect();
    }, { threshold: 0.35 });

    observer.observe(statsRef.current);

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [lang, t.stats.items]);

  return (
    <div className="home-v2" dir={dir}>
      <section className="home-v2__hero">
        <div className="home-v2__shell home-v2__hero-shell">
          <div className="home-v2__hero-copy">
            <p className="home-v2__eyebrow home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.hero.eyebrow}</p>
            <h1 className="home-v2__hero-title home-reveal" style={{ '--reveal-delay': '120ms' }}>
              <span>{t.hero.titlePrimary}</span>
              <em>{t.hero.titleAccent}</em>
            </h1>
            <p className="home-v2__hero-lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.hero.lead}</p>
            <div className="home-v2__hero-actions home-reveal" style={{ '--reveal-delay': '240ms' }}>
              <Link className="home-v2__button home-v2__button--primary" to="/projects">
                <span className="material-symbols-outlined no-flip">volunteer_activism</span>
                {t.hero.primaryCta}
              </Link>
              <Link className="home-v2__button home-v2__button--secondary" to="/kafala">
                <span className="material-symbols-outlined no-flip">person_heart</span>
                {t.hero.secondaryCta}
              </Link>
            </div>
            <ul className="home-v2__trust-list home-reveal" style={{ '--reveal-delay': '320ms' }}>
              {t.hero.trustItems.map((item, index) => (
                <li key={item}>
                  <span className="material-symbols-outlined no-flip">
                    {index === 0 ? 'verified_user' : index === 1 ? 'event_available' : 'favorite'}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="home-v2__hero-visual home-reveal" aria-hidden="true">
            <div className="home-v2__hero-image">
              <img src={heroImage} alt="" loading="eager" />
            </div>
          </div>
        </div>
      </section>

      <section className="home-v2__stats-wrap home-reveal" aria-labelledby="home-stats-title">
        <div className="home-v2__shell">
          <div className="home-v2__stats">
            <div className="home-v2__stats-header">
              <span />
              <h2 id="home-stats-title">{t.stats.title}</h2>
              <span />
            </div>
            <div className="home-v2__stats-grid" ref={statsRef}>
              {t.stats.items.map((item, index) => (
                <article className="home-v2__stat" key={item.label}>
                  <span className="material-symbols-outlined no-flip">{item.icon}</span>
                  <strong>{formatStatValue(index, statValues[index] ?? getStatTarget(index), lang)}</strong>
                  <small>{item.label}</small>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-v2__summary home-reveal">
        <div className="home-v2__shell home-v2__summary-grid">
          <div className="home-v2__summary-media">
            <img src={summaryImage} alt="" loading="lazy" />
          </div>
          <div className="home-v2__summary-copy">
            <p className="home-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.summary.kicker}</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.summary.title}</h2>
            <p className="home-v2__lead home-reveal" style={{ '--reveal-delay': '170ms' }}>{t.summary.lead}</p>
            <div className="home-v2__summary-list">
              {t.summary.items.map((item, index) => (
                <div className="home-v2__summary-item home-reveal" key={item.title} style={{ '--reveal-delay': `${220 + (index * 80)}ms` }}>
                  <div className="home-v2__summary-icon">
                    <span className="material-symbols-outlined no-flip">{item.icon}</span>
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <blockquote className="home-reveal" style={{ '--reveal-delay': '520ms' }}>{t.summary.quote}</blockquote>
          </div>
        </div>
      </section>

      <section className="home-v2__projects home-reveal">
        <div className="home-v2__shell">
          <header className="home-v2__section-intro home-v2__section-intro--center">
            <p className="home-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.projects.kicker}</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.projects.title}</h2>
            <p className="home-reveal" style={{ '--reveal-delay': '170ms' }}>{t.projects.lead}</p>
            <Link className="home-v2__ghost-link home-reveal" style={{ '--reveal-delay': '230ms' }} to="/projects">
              {t.projects.allCta}
            </Link>
          </header>

          <div className="home-v2__project-list">
            {visibleProjects.map((project, index) => {
              const image = resolveImage(project, index === 0 ? projectImageA : projectImageB);
              const title = getFirstText(project, lang, ['title', 'name']);
              const description = getFirstText(project, lang, ['description', 'summary', 'shortDescription']);
              const tag = getText(project.tag, lang) || getText(fallbackProjects[index].tag, lang);
              const raised = project.raisedAmount || project.raised || 0;
              const goal = project.goalAmount || project.goal || 1000;
              const percent = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
              const isFallback = String(project._id || '').startsWith('fallback-');
              const projectPath = isFallback ? '/projects' : `/projects/${project.slug || project._id}`;
              const actionPath = isFallback ? '/projects' : `/donate/${project._id}`;

              return (
                <article className={`home-v2__project-feature ${index % 2 === 1 ? 'is-reversed' : ''}`} key={project._id || title}>
                  <Link className="home-v2__project-image" to={projectPath}>
                    <img src={image} alt={title} loading="lazy" />
                  </Link>
                  <div className="home-v2__project-copy">
                    <span className="home-v2__project-tag">{tag}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div className="home-v2__project-progress">
                      <div className="home-v2__project-progress-meta">
                        <span>{percent}%</span>
                        <span>{formatMAD(raised, lang)} / {formatMAD(goal, lang)}</span>
                      </div>
                      <div className="home-v2__progress-track" aria-hidden="true">
                        <span style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <Link className="home-v2__button home-v2__button--primary" to={actionPath}>
                      <span className="material-symbols-outlined no-flip">arrow_forward</span>
                      {t.projects.action}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="home-v2__kafala home-reveal">
        <div className="home-v2__shell">
          <div className="home-v2__kafala-top">
            <div className="home-v2__kafala-visual">
              <img src={kafalaHeroImage} alt="" loading="lazy" />
              <aside className="home-v2__kafala-quote">{t.kafala.quote}</aside>
            </div>
            <div className="home-v2__kafala-copy">
              <p className="home-v2__kicker home-reveal" style={{ '--reveal-delay': '30ms' }}>{t.kafala.kicker}</p>
              <h2 className="home-reveal" style={{ '--reveal-delay': '100ms' }}>{t.kafala.title}</h2>
              <p className="home-v2__lead home-reveal" style={{ '--reveal-delay': '170ms' }}>{t.kafala.lead}</p>
              <div className="home-v2__kafala-steps">
                {t.kafala.steps.map((step, index) => (
                  <article className="home-v2__kafala-step home-reveal" key={step.number} style={{ '--reveal-delay': `${240 + (index * 90)}ms` }}>
                    <div className="home-v2__kafala-step-badge">
                      <span>{step.number}</span>
                      <i className="material-symbols-outlined no-flip">{step.icon}</i>
                    </div>
                    <strong>{step.title}</strong>
                    <p>{step.text}</p>
                  </article>
                ))}
              </div>
              <Link className="home-v2__button home-v2__button--primary home-reveal" style={{ '--reveal-delay': '540ms' }} to="/kafala">
                <span className="material-symbols-outlined no-flip">arrow_forward</span>
                {t.kafala.allCta}
              </Link>
            </div>
          </div>

          <div className="home-v2__kafala-cases">
            {visibleKafala.map((item, index) => {
              const title = getFirstText(item, lang, ['title', 'name', 'childName', 'fullName']) || getText(fallbackKafala[index].title, lang);
              const description = getFirstText(item, lang, ['description', 'summary', 'bio', 'shortDescription']) || getText(fallbackKafala[index].description, lang);
              const fallbackImage = index === 0 ? kafalaPreviewA : index === 1 ? kafalaPreviewB : kafalaPreviewC;
              const resolvedImage = resolveImage(item, fallbackImage);
              const isFallback = String(item._id || '').startsWith('fallback-');
              const detailPath = isFallback ? '/kafala' : `/kafala/${item.slug || item._id}`;

              return (
                <article className="home-v2__kafala-card home-reveal" key={item._id || title} style={{ '--reveal-delay': `${80 + (index * 120)}ms` }}>
                  <div className="home-v2__kafala-card-image">
                    <img src={resolvedImage} alt={title} loading="lazy" />
                  </div>
                  <div className="home-v2__kafala-card-copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <Link className="home-v2__button home-v2__button--secondary" to={detailPath}>
                      <span className="material-symbols-outlined no-flip">arrow_forward</span>
                      {t.kafala.previewCta}
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="home-v2__kafala-center home-reveal" style={{ '--reveal-delay': '260ms' }}>
            <span className="material-symbols-outlined no-flip">favorite</span>
            <strong>{t.kafala.centerTitle}</strong>
            <p>{t.kafala.centerText}</p>
          </div>

          <div className="home-v2__kafala-band home-reveal" style={{ '--reveal-delay': '220ms' }}>{t.kafala.band}</div>
        </div>
      </section>

      <section className="home-v2__about home-reveal">
        <div className="home-v2__shell home-v2__about-grid">
          <div className="home-v2__about-media">
            <img src={aboutImage} alt="" loading="lazy" />
            <div className="home-v2__about-badge">
              <span>{t.about.badgeTop}</span>
              <strong>{t.about.badgeMain}</strong>
              <small>{t.about.badgeBottom}</small>
            </div>
          </div>
          <div className="home-v2__about-copy">
            <p className="home-v2__kicker home-reveal" style={{ '--reveal-delay': '40ms' }}>{t.about.kicker}</p>
            <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>{t.about.title}</h2>
            <p className="home-v2__lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.about.lead}</p>
            <div className="home-v2__about-lines">
              {t.about.lines.map((line, index) => (
                <article className="home-reveal" key={line.title} style={{ '--reveal-delay': `${250 + (index * 90)}ms` }}>
                  <span className="material-symbols-outlined no-flip">{line.icon}</span>
                  <strong>{line.title}</strong>
                  <p>{line.text}</p>
                </article>
              ))}
            </div>
            <blockquote className="home-reveal" style={{ '--reveal-delay': '520ms' }}>{t.about.quote}</blockquote>
            <Link className="home-v2__button home-v2__button--primary home-reveal" style={{ '--reveal-delay': '580ms' }} to="/about">
              <span className="material-symbols-outlined no-flip">arrow_forward</span>
              {t.about.cta}
            </Link>
          </div>
        </div>
      </section>

      <section className="home-v2__contact home-reveal">
        <div className="home-v2__shell">
          <div className="home-v2__contact-panel">
            <div className="home-v2__contact-copy">
              <p className="home-v2__contact-mark home-reveal" style={{ '--reveal-delay': '40ms' }}>ابتسم</p>
              <h2 className="home-reveal" style={{ '--reveal-delay': '110ms' }}>
                <span>{t.contact.titlePrimary}</span>
                <em>{t.contact.titleAccent}</em>
              </h2>
              <p className="home-v2__lead home-reveal" style={{ '--reveal-delay': '180ms' }}>{t.contact.lead}</p>
              <div className="home-v2__hero-actions home-reveal" style={{ '--reveal-delay': '250ms' }}>
                <Link className="home-v2__button home-v2__button--accent" to="/projects">
                  <span className="material-symbols-outlined no-flip">favorite</span>
                  {t.contact.primaryCta}
                </Link>
                <Link className="home-v2__button home-v2__button--outline-light" to="/contact">
                  <span className="material-symbols-outlined no-flip">call</span>
                  {t.contact.secondaryCta}
                </Link>
              </div>
              <p className="home-v2__contact-footer home-reveal" style={{ '--reveal-delay': '320ms' }}>{t.contact.footer}</p>
            </div>

            <div className="home-v2__contact-image">
              <img src={contactImage} alt="" loading="lazy" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
