import React from "react";
import { Link } from "react-router-dom";
import { formatMAD } from "../../../lib/money";
import { formatStatValue, getStatTarget } from "./homeHelpers";
import {
  getFirstText,
  getText,
  homeImages,
  resolveImage,
} from "./homeContent";

function revealStyle(delay) {
  return { "--reveal-delay": delay };
}

export function HeroSection({ t }) {
  return (
    <section className="home-v2__hero">
      <div className="home-v2__shell home-v2__hero-shell">
        <div className="home-v2__hero-copy">
          <p className="home-v2__eyebrow home-reveal" style={revealStyle("40ms")}>
            {t.hero.eyebrow}
          </p>
          <h1 className="home-v2__hero-title home-reveal" style={revealStyle("120ms")}>
            <span>{t.hero.titlePrimary}</span>
            <em>{t.hero.titleAccent}</em>
          </h1>
          <p className="home-v2__hero-lead home-reveal" style={revealStyle("180ms")}>
            {t.hero.lead}
          </p>
          <div className="home-v2__hero-actions home-reveal" style={revealStyle("240ms")}>
            <Link className="home-v2__button home-v2__button--primary" to="/projects">
              <span className="material-symbols-outlined no-flip">volunteer_activism</span>
              {t.hero.primaryCta}
            </Link>
            <Link className="home-v2__button home-v2__button--secondary" to="/kafala">
              <span className="material-symbols-outlined no-flip">person_heart</span>
              {t.hero.secondaryCta}
            </Link>
          </div>
          <ul className="home-v2__trust-list home-reveal" style={revealStyle("320ms")}>
            {t.hero.trustItems.map((item, index) => (
              <li key={`trust-${index}`}>
                <span className="material-symbols-outlined no-flip">
                  {index === 0 ? "verified_user" : index === 1 ? "event_available" : "favorite"}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="home-v2__hero-visual home-reveal" aria-hidden="true">
          <div className="home-v2__hero-image">
            <img src={homeImages.heroImage} alt="" loading="eager" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatsSection({ t, lang, statValues, statsRef }) {
  return (
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
              <article className="home-v2__stat" key={`stat-${index}`}>
                <span className="material-symbols-outlined no-flip">{item.icon}</span>
                <strong>{formatStatValue(index, statValues[index] ?? getStatTarget(index), lang)}</strong>
                <small>{item.label}</small>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SummarySection({ t }) {
  return (
    <section className="home-v2__summary home-reveal">
      <div className="home-v2__shell home-v2__summary-grid">
        <div className="home-v2__summary-media">
          <img src={homeImages.summaryImage} alt="" loading="lazy" />
        </div>
        <div className="home-v2__summary-copy">
          <p className="home-v2__kicker home-reveal" style={revealStyle("40ms")}>
            {t.summary.kicker}
          </p>
          <h2 className="home-reveal" style={revealStyle("110ms")}>
            {t.summary.title}
          </h2>
          <p className="home-v2__lead home-reveal" style={revealStyle("170ms")}>
            {t.summary.lead}
          </p>
          <div className="home-v2__summary-list">
            {t.summary.items.map((item, index) => (
              <div
                className="home-v2__summary-item home-reveal"
                key={`summary-${index}`}
                style={revealStyle(`${220 + index * 80}ms`)}
              >
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
          <blockquote className="home-reveal" style={revealStyle("520ms")}>
            {t.summary.quote}
          </blockquote>
        </div>
      </div>
    </section>
  );
}

export function ProjectsSection({ t, lang, visibleProjects, onNavigate }) {
  return (
    <section className="home-v2__projects home-reveal">
      <div className="home-v2__shell">
        <header className="home-v2__section-intro home-v2__section-intro--center">
          <p className="home-v2__kicker home-reveal" style={revealStyle("40ms")}>
            {t.projects.kicker}
          </p>
          <h2 className="home-reveal" style={revealStyle("110ms")}>
            {t.projects.title}
          </h2>
          <p className="home-reveal" style={revealStyle("170ms")}>
            {t.projects.lead}
          </p>
          <Link className="home-v2__ghost-link home-reveal" style={revealStyle("230ms")} to="/projects">
            {t.projects.allCta}
          </Link>
        </header>
        {visibleProjects.length === 0 && (
          <div className="home-v2__empty-state home-reveal" style={revealStyle("260ms")}>
            {t.projects.empty || "No featured projects yet."}
          </div>
        )}
        <div className="home-v2__project-list">
          {visibleProjects.map((project, index) => {
            const image = resolveImage(
              project,
              index === 0 ? homeImages.projectImageA : homeImages.projectImageB
            );
            const title = getFirstText(project, lang, ["title", "name"]);
            const description = getFirstText(project, lang, ["shortDescription", "description"]);
            const tag = getText(project.tag, lang) || project.category || "";
            const raised = project.raisedAmount || project.raised || 0;
            const goal = project.goalAmount || project.goal || 1000;
            const percent = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
            const isFallback = String(project._id || "").startsWith("fallback-");
            const projectPath = isFallback ? "/projects" : `/projects/${project.slug || project._id}`;
            const actionPath = isFallback ? "/projects" : `/donate/${project._id}`;

            return (
              <article
                className={`home-v2__project-feature ${index % 2 === 1 ? "is-reversed" : ""}`}
                key={project._id || title}
                onClick={() => onNavigate(projectPath)}
                style={{ cursor: "pointer" }}
              >
                <div className="home-v2__project-image">
                  <img src={image} alt={title} loading="lazy" />
                </div>
                <div className="home-v2__project-copy">
                  <span className="home-v2__project-tag">{tag}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className="home-v2__project-progress">
                    <div className="home-v2__project-progress-meta">
                      <span>{percent}%</span>
                      <span>
                        {formatMAD(raised, lang)} / {formatMAD(goal, lang)}
                      </span>
                    </div>
                    <div className="home-v2__progress-track" aria-hidden="true">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <Link
                    className="home-v2__button home-v2__button--primary"
                    to={actionPath}
                    onClick={(event) => event.stopPropagation()}
                  >
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
  );
}

export function KafalaSection({ t, lang, visibleKafala, onNavigate }) {
  return (
    <section className="home-v2__kafala home-reveal">
      <div className="home-v2__shell">
        <div className="home-v2__kafala-top">
          <div className="home-v2__kafala-visual">
            <img src={homeImages.kafalaHeroImage} alt="" loading="lazy" />
            <aside className="home-v2__kafala-quote">{t.kafala.quote}</aside>
          </div>
          <div className="home-v2__kafala-copy">
            <p className="home-v2__kicker home-reveal" style={revealStyle("30ms")}>
              {t.kafala.kicker}
            </p>
            <h2 className="home-reveal" style={revealStyle("100ms")}>
              {t.kafala.title}
            </h2>
            <p className="home-v2__lead home-reveal" style={revealStyle("170ms")}>
              {t.kafala.lead}
            </p>
            <div className="home-v2__kafala-steps">
              {t.kafala.steps.map((step, index) => (
                <article
                  className="home-v2__kafala-step home-reveal"
                  key={step.number}
                  style={revealStyle(`${240 + index * 90}ms`)}
                >
                  <div className="home-v2__kafala-step-badge">
                    <span>{step.number}</span>
                    <i className="material-symbols-outlined no-flip">{step.icon}</i>
                  </div>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
            <Link
              className="home-v2__button home-v2__button--primary home-reveal"
              style={revealStyle("540ms")}
              to="/kafala"
            >
              <span className="material-symbols-outlined no-flip">arrow_forward</span>
              {t.kafala.allCta}
            </Link>
          </div>
        </div>
        <div className="home-v2__kafala-cases">
          {visibleKafala.length === 0 && (
            <div className="home-v2__empty-state home-reveal" style={revealStyle("80ms")}>
              {t.kafala.empty || "No featured kafala profiles yet."}
            </div>
          )}
          {visibleKafala.map((item, index) => {
            const title =
              getFirstText(item, lang, ["title", "name", "childName", "fullName"]);
            const description =
              getFirstText(item, lang, ["description", "summary", "bio", "shortDescription"]);
            const fallbackImage =
              index === 0
                ? homeImages.kafalaPreviewA
                : index === 1
                  ? homeImages.kafalaPreviewB
                  : homeImages.kafalaPreviewC;
            const resolvedImage = resolveImage(item, fallbackImage);
            const isFallback = String(item._id || "").startsWith("fallback-");
            const detailPath = isFallback ? "/kafala" : `/kafala/${item.slug || item._id}`;
            const sponsorPath = isFallback ? "/kafala" : `/kafala/${item._id}/sponsor`;

            return (
              <article
                className="home-v2__kafala-card home-reveal"
                key={item._id || title}
                style={{ ...revealStyle(`${80 + index * 120}ms`), cursor: "pointer" }}
                onClick={() => onNavigate(detailPath)}
              >
                <div className="home-v2__kafala-card-image">
                  <img src={resolvedImage} alt={title} loading="lazy" />
                </div>
                <div className="home-v2__kafala-card-copy">
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <Link
                    className="home-v2__button home-v2__button--secondary"
                    to={sponsorPath}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="material-symbols-outlined no-flip">arrow_forward</span>
                    {t.kafala.sponsorCta}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
        <div className="home-v2__kafala-center home-reveal" style={revealStyle("260ms")}>
          <span className="material-symbols-outlined no-flip">favorite</span>
          <strong>{t.kafala.centerTitle}</strong>
          <p>{t.kafala.centerText}</p>
        </div>
        <div className="home-v2__kafala-band home-reveal" style={revealStyle("220ms")}>
          {t.kafala.band}
        </div>
      </div>
    </section>
  );
}

export function AboutSection({ t }) {
  return (
    <section className="home-v2__about home-reveal">
      <div className="home-v2__shell home-v2__about-grid">
        <div className="home-v2__about-media">
          <img src={homeImages.aboutImage} alt="" loading="lazy" />
          <div className="home-v2__about-badge">
            <span>{t.about.badgeTop}</span>
            <strong>{t.about.badgeMain}</strong>
            <small>{t.about.badgeBottom}</small>
          </div>
        </div>
        <div className="home-v2__about-copy">
          <p className="home-v2__kicker home-reveal" style={revealStyle("40ms")}>
            {t.about.kicker}
          </p>
          <h2 className="home-reveal" style={revealStyle("110ms")}>
            {t.about.title}
          </h2>
          <p className="home-v2__lead home-reveal" style={revealStyle("180ms")}>
            {t.about.lead}
          </p>
          <div className="home-v2__about-lines">
            {t.about.lines.map((line, index) => (
              <article
                className="home-reveal"
                key={`about-${index}`}
                style={revealStyle(`${250 + index * 90}ms`)}
              >
                <span className="material-symbols-outlined no-flip">{line.icon}</span>
                <strong>{line.title}</strong>
                <p>{line.text}</p>
              </article>
            ))}
          </div>
          <blockquote className="home-reveal" style={revealStyle("520ms")}>
            {t.about.quote}
          </blockquote>
          <Link
            className="home-v2__button home-v2__button--primary home-reveal"
            style={revealStyle("580ms")}
            to="/about"
          >
            <span className="material-symbols-outlined no-flip">arrow_forward</span>
            {t.about.cta}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function ContactSection({ t }) {
  return (
    <section className="home-v2__contact home-reveal">
      <div className="home-v2__shell">
        <div className="home-v2__contact-panel">
          <div className="home-v2__contact-copy">
            <p className="home-v2__contact-mark home-reveal" style={revealStyle("40ms")}>
              ?????
            </p>
            <h2 className="home-reveal" style={revealStyle("110ms")}>
              <span>{t.contact.titlePrimary}</span>
              <em>{t.contact.titleAccent}</em>
            </h2>
            <p className="home-v2__lead home-reveal" style={revealStyle("180ms")}>
              {t.contact.lead}
            </p>
            <div className="home-v2__hero-actions home-reveal" style={revealStyle("250ms")}>
              <Link className="home-v2__button home-v2__button--accent" to="/projects">
                <span className="material-symbols-outlined no-flip">favorite</span>
                {t.contact.primaryCta}
              </Link>
              <Link className="home-v2__button home-v2__button--outline-light" to="/contact">
                <span className="material-symbols-outlined no-flip">call</span>
                {t.contact.secondaryCta}
              </Link>
            </div>
            <p className="home-v2__contact-footer home-reveal" style={revealStyle("320ms")}>
              {t.contact.footer}
            </p>
          </div>
          <div className="home-v2__contact-image">
            <img src={homeImages.contactImage} alt="" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
}
