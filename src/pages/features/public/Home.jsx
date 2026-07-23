import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useApp } from "../../../context/AppContext";
import { copy, useRevealMotion } from "./homeContent";
import { getStatTarget } from "./homeHelpers";
import {
  AboutSection,
  ContactSection,
  HeroSection,
  KafalaSection,
  ProjectsSection,
  StatsSection,
  SummarySection,
} from "./homeSections";

export default function Home() {
  const navigate = useNavigate();
  const { language, currentLanguage } = useApp();

  const lang = currentLanguage?.code || language || "ar";
  const dir = lang === "ar" ? "rtl" : "ltr";
  const t = copy[lang] || copy.ar;

  const statsRef = useRef(null);
  const [statValues, setStatValues] = useState(() => t.stats.items.map(() => 0));

  useRevealMotion(lang);

  const projects = useQuery(api.projects.getProjects, { featured: true, limit: 6 });
  const kafala = useQuery(api.kafala.getPublicKafalaList, { featured: true, limit: 4 });

  const visibleProjects = useMemo(() => {
    return (projects || []).slice(0, 2);
  }, [projects]);

  const visibleKafala = useMemo(() => {
    return (kafala || []).slice(0, 3);
  }, [kafala]);

  useEffect(() => {
    const targets = t.stats.items.map((_, index) => getStatTarget(index));
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      setStatValues(targets);
      return undefined;
    }

    setStatValues(targets.map(() => 0));
    if (!statsRef.current) return undefined;

    let rafId = 0;
    let hasAnimated = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated) return;
        hasAnimated = true;

        const startedAt = performance.now();
        const duration = 1400;

        const tick = (now) => {
          const progress = Math.min((now - startedAt) / duration, 1);
          const eased = 1 - (1 - progress) ** 3;

          setStatValues(
            targets.map((target) => {
              const nextValue = Math.round(target * eased);
              return progress < 1 ? Math.max(nextValue, 1) : target;
            })
          );

          if (progress < 1) {
            rafId = window.requestAnimationFrame(tick);
          }
        };

        rafId = window.requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(statsRef.current);

    return () => {
      observer.disconnect();
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [lang, t.stats.items]);

  return (
    <div className="home-v2" dir={dir}>
      <HeroSection t={t} />
      <StatsSection t={t} lang={lang} statValues={statValues} statsRef={statsRef} />
      <SummarySection t={t} />
      <ProjectsSection
        t={t}
        lang={lang}
        visibleProjects={visibleProjects}
        onNavigate={navigate}
      />
      <KafalaSection
        t={t}
        lang={lang}
        visibleKafala={visibleKafala}
        onNavigate={navigate}
      />
      <AboutSection t={t} />
      <ContactSection t={t} />
    </div>
  );
}
