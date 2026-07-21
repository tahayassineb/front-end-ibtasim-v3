import { useEffect, useRef } from "react";

export function getStatTarget(index) {
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
}

export function formatStatValue(index, value, lang) {
  const locale = lang === "ar" ? "ar-MA" : lang === "fr" ? "fr-FR" : "en-US";
  const formatted = new Intl.NumberFormat(locale).format(value);

  if (index === 0) {
    if (lang === "ar") return `??? ${formatted}`;
    if (lang === "fr") return `Depuis ${formatted}`;
    return `Since ${formatted}`;
  }

  if (index === 2) return `+${formatted}`;
  return formatted;
}

export function useRevealMotion(lang) {
  const tracked = useRef(new WeakSet());

  useEffect(() => {
    const nodes = document.querySelectorAll("[data-reveal]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          if (tracked.current.has(entry.target)) return;
          tracked.current.add(entry.target);
          entry.target.animate(
            [
              { opacity: 0, transform: "translateY(28px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            {
              duration: 700,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "forwards",
              delay: Number(entry.target.getAttribute("data-delay") || 0),
            }
          );
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.2 }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [lang]);
}
