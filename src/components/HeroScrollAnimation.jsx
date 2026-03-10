import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TOTAL_FRAMES = 289;
const SCROLL_PX_PER_FRAME = 5; // total scroll distance = 289 * 5 = 1445px

export default function HeroScrollAnimation({ onDonate }) {
  const canvasRef   = useRef(null);
  const sectionRef  = useRef(null);
  const layerARef   = useRef(null);
  const layerBRef   = useRef(null);
  const framesRef   = useRef([]);
  const currentIdxRef  = useRef(0);
  const rafPendingRef  = useRef(false);
  const ctxRef         = useRef(null);

  const [loadedCount, setLoadedCount] = useState(0);
  const [ready, setReady]             = useState(false);

  /* ── 1. Preload all frames ─────────────────────────────── */
  useEffect(() => {
    let count = 0;
    const imgs = new Array(TOTAL_FRAMES);

    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new Image();
      const onDone = () => {
        count++;
        setLoadedCount(count);
        if (count === TOTAL_FRAMES) setReady(true);
      };
      img.onload  = onDone;
      img.onerror = onDone;
      img.src = `/frames/frame_${String(i + 1).padStart(4, '0')}.webp`;
      imgs[i] = img;
    }
    framesRef.current = imgs;
  }, []);

  /* ── 2. Init canvas + GSAP once all frames are loaded ──── */
  useEffect(() => {
    if (!ready) return;

    const canvas  = canvasRef.current;
    const ctx     = canvas.getContext('2d');
    ctxRef.current = ctx;

    const drawFrame = (idx) => {
      const img = framesRef.current[idx];
      if (!img?.complete) return;
      if (rafPendingRef.current) return;
      rafPendingRef.current = true;
      requestAnimationFrame(() => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        rafPendingRef.current = false;
      });
    };

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(currentIdxRef.current);
    };
    resize();
    window.addEventListener('resize', resize);

    const trigger = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top top',
      end:   'bottom bottom',
      scrub: 0.8,
      onUpdate(self) {
        const p = self.progress;

        /* Frame */
        const idx = Math.min(Math.round(p * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1);
        if (idx !== currentIdxRef.current) {
          currentIdxRef.current = idx;
          drawFrame(idx);
        }

        /* Layer A: visible 0%→30%, fades out 30%→40% */
        if (layerARef.current) {
          layerARef.current.style.opacity =
            p <= 0.3 ? 1 : p >= 0.4 ? 0 : 1 - (p - 0.3) / 0.1;
        }

        /* Layer B: invisible 0%→60%, fades in 60%→75% */
        if (layerBRef.current) {
          layerBRef.current.style.opacity =
            p <= 0.6 ? 0 : p >= 0.75 ? 1 : (p - 0.6) / 0.15;
        }
      },
    });

    return () => {
      trigger.kill();
      window.removeEventListener('resize', resize);
    };
  }, [ready]);

  const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <>
      {/* ── Preloader ─────────────────────────────────────── */}
      {!ready && (
        <div
          style={{
            position: 'fixed', inset: 0, background: '#000',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: "'Noto Naskh Arabic', 'Tajawal', serif",
              fontSize: '64px', fontWeight: 900, color: '#FAFAF7',
              letterSpacing: '0.04em',
            }}
          >
            ابتسم
          </span>
          {/* Progress bar at very bottom */}
          <div
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: '3px', background: 'rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                height: '100%', width: `${pct}%`,
                background: '#1B5E3B', transition: 'width 0.1s linear',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Scroll section ────────────────────────────────── */}
      <section
        ref={sectionRef}
        style={{ height: `calc(100vh + ${TOTAL_FRAMES * SCROLL_PX_PER_FRAME}px)`, position: 'relative' }}
      >
        {/* Sticky viewport — stays pinned while user scrolls through spacer */}
        <div
          style={{
            position: 'sticky', top: 0,
            height: '100vh', width: '100%', overflow: 'hidden',
          }}
        >
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              display: 'block', background: '#000',
              willChange: 'transform',
            }}
          />

          {/* ── Layer A: Hero text (fades out 30→40%) ─────── */}
          <div
            ref={layerARef}
            style={{
              position: 'absolute', inset: 0,
              pointerEvents: 'none', opacity: 1,
            }}
          >
            {/* Hero headline + CTA */}
            <div
              style={{
                position: 'absolute', bottom: '140px', right: '48px',
                maxWidth: '520px', textAlign: 'right',
                pointerEvents: 'auto',
              }}
            >
              <h1
                style={{
                  fontFamily: "'Noto Naskh Arabic', 'Tajawal', serif",
                  fontSize: 'clamp(34px, 4.5vw, 62px)',
                  fontWeight: 900, color: '#FAFAF7',
                  lineHeight: 1.3, marginBottom: '14px',
                  textShadow: '0 2px 24px rgba(0,0,0,0.55)',
                }}
              >
                ابتسامة يتيم...<br />
                <span style={{ color: '#4ade80' }}>أجرٌ لا ينقطع</span>
              </h1>
              <p
                style={{
                  fontFamily: "'Noto Naskh Arabic', 'Tajawal', serif",
                  fontSize: '18px', color: 'rgba(250,250,247,0.72)',
                  lineHeight: 1.8, marginBottom: '24px',
                }}
              >
                كل تبرع تقدمه يُضيء وجهاً وينير مستقبلاً
              </p>
              <button
                onClick={onDonate}
                style={{
                  background: '#1B5E3B', color: '#FAFAF7',
                  border: 'none', borderRadius: '10px',
                  fontSize: '18px', fontWeight: 700,
                  padding: '13px 38px', cursor: 'pointer',
                  fontFamily: "'Noto Naskh Arabic', 'Tajawal', serif",
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.target.style.background = '#2a7a50'}
                onMouseLeave={e => e.target.style.background = '#1B5E3B'}
              >
                تبرع الآن
              </button>
            </div>

            {/* Stats bar */}
            <div
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '22px 48px',
                background: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid rgba(250,250,247,0.12)',
              }}
            >
              {[
                { num: '+1,240', lbl: 'يتيم مستفيد' },
                { num: '86%',    lbl: 'من التبرعات تصل مباشرة' },
                { num: '7 سنوات', lbl: 'من العطاء المتواصل' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                  {i > 0 && (
                    <div
                      style={{
                        width: '1px', height: '44px',
                        background: 'rgba(250,250,247,0.2)',
                        margin: '0 32px', flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, textAlign: 'center', fontFamily: "'Noto Naskh Arabic','Tajawal',serif" }}>
                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#FAFAF7' }}>{s.num}</div>
                    <div style={{ fontSize: '13px', color: 'rgba(250,250,247,0.6)' }}>{s.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Layer B: End CTA (fades in 60→75%) ─────────── */}
          <div
            ref={layerBRef}
            style={{
              position: 'absolute', inset: 0, opacity: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <div style={{ textAlign: 'center', padding: '0 24px', pointerEvents: 'auto' }}>
              <h2
                style={{
                  fontFamily: "'Noto Naskh Arabic', 'Tajawal', serif",
                  fontSize: 'clamp(36px, 5.5vw, 68px)',
                  fontWeight: 900, color: '#FAFAF7',
                  lineHeight: 1.25, marginBottom: '14px',
                  textShadow: '0 2px 32px rgba(0,0,0,0.6)',
                }}
              >
                أنت سببُ هذه الابتسامة
              </h2>
              <p
                style={{
                  fontFamily: "'Noto Naskh Arabic', 'Tajawal', serif",
                  fontSize: '22px', color: '#4ade80',
                  fontWeight: 700, marginBottom: '36px',
                }}
              >
                تبرعك يغير حياة طفل حقيقي
              </p>
              <button
                onClick={onDonate}
                style={{
                  background: '#FAFAF7', color: '#1B5E3B',
                  border: 'none', borderRadius: '12px',
                  fontSize: '22px', fontWeight: 900,
                  width: '300px', height: '62px',
                  cursor: 'pointer',
                  fontFamily: "'Noto Naskh Arabic', 'Tajawal', serif",
                  boxShadow: '0 0 32px rgba(201,168,76,0.35)',
                  transition: 'box-shadow 0.2s, transform 0.15s',
                }}
                onMouseEnter={e => { e.target.style.boxShadow = '0 0 48px rgba(201,168,76,0.55)'; e.target.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.target.style.boxShadow = '0 0 32px rgba(201,168,76,0.35)'; e.target.style.transform = 'none'; }}
              >
                تبرع الآن
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
