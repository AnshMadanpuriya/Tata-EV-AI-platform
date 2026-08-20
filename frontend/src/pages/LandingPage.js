import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { EVExplorer, EVComparator } from '../components/Landing/EvFeatures';
// ============================================================
// CONSTANTS
// ============================================================
const AGENT_ID = 'agent_6701knpzdtj4fjy85jkrc0kbqye9';
const ELEVENLABS_SCRIPT = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
const API_URL = 'http://localhost:5000/api';

// ============================================================
// REUSABLE ANIMATION VARIANTS
// ============================================================
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// ============================================================
// REUSABLE ANIMATED SECTION WRAPPER
// ============================================================
function AnimatedSection({ children, variants = fadeUp, className, style, once = true }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// Stagger wrapper — animates children with stagger
function StaggerSection({ children, style, className }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      variants={staggerContainer}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// ELEVENLABS LOADER
// ============================================================
function loadElevenLabsScript(cb) {
  if (document.querySelector('script[data-el-loaded]')) {
    if (cb) cb(); return;
  }
  const s = document.createElement('script');
  s.src = ELEVENLABS_SCRIPT;
  s.async = true;
  s.type = 'text/javascript';
  s.setAttribute('data-el-loaded', 'true');
  s.onload = () => { if (cb) cb(); };
  document.head.appendChild(s);
}

function ElevenLabsEmbed({ agentId }) {
  const ref = useRef(null);
  const widgetRef = useRef(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { loadElevenLabsScript(() => setReady(true)); }, []);
  useEffect(() => {
    if (!ready || !ref.current || widgetRef.current) return;
    const el = document.createElement('elevenlabs-convai');
    el.setAttribute('agent-id', agentId);
    el.style.width = '100%';
    ref.current.appendChild(el);
    widgetRef.current = el;
    return () => {
      if (widgetRef.current && ref.current?.contains(widgetRef.current)) {
        ref.current.removeChild(widgetRef.current);
      }
      widgetRef.current = null;
    };
  }, [ready, agentId]);
  return (
    <div ref={ref} style={{ width: '100%', minHeight: 80 }}>
      {!ready && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 28, height: 28, border: '2px solid #FF6B00', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// NAVBAR
// ============================================================
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 100,
        background: scrolled ? 'rgba(8,12,20,0.97)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #1A2540' : 'none',
        transition: 'background 0.3s, border 0.3s',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, background: '#0066FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>⚡</div>
          <span style={{ fontWeight: 800, fontSize: 18, color: 'white' }}>Tata<span style={{ color: '#00D4FF' }}>EV</span></span>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {['features', 'voice-agent', 'calculator', 'pricing', 'contact'].map(id => (
            <button key={id} onClick={() => scrollTo(id)} style={{
              background: 'none', border: 'none', color: '#9CA3AF', fontSize: 13,
              fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize'
            }}>{id.replace('-', ' ')}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/login" style={{
            background: '#0066FF', color: 'white', border: 'none',
            borderRadius: 8, padding: '8px 18px', fontSize: 13,
            fontWeight: 700, cursor: 'pointer', textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center'
          }}>Get Started</Link>
        </div>
      </div>
    </motion.nav>
  );
}

// ============================================================
// HERO — Fade + Slide Up
// ============================================================
function Hero() {
  const slides = [
    {
      image: '/images/ev-city-drive.webp',
      eyebrow: 'Built for the EV revolution',
      title: 'Intelligence that moves with you.',
      description: 'Compare electric vehicles, understand real-world range and turn every customer question into a confident next step.',
      metric: '24/7', metricLabel: 'AI EV guidance', accent: '#27D8FF',
    },
    {
      image: '/images/ev-mountain-drive.webp',
      eyebrow: 'Range without the guesswork',
      title: 'Go farther. Choose smarter.',
      description: 'Personalised range, charging and ownership insights help every driver find an EV that fits their life.',
      metric: '< 2 sec', metricLabel: 'Instant answers', accent: '#74F0C2',
    },
    {
      image: '/images/ev-tunnel-drive.webp',
      eyebrow: 'One connected experience',
      title: 'From interest to test drive.',
      description: 'EVA, WhatsApp and n8n work together to qualify leads, schedule test drives and keep your team updated.',
      metric: '3x', metricLabel: 'Faster follow-up', accent: '#A78BFA',
    },
  ];
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(
      () => setActiveSlide((current) => (current + 1) % slides.length),
      6500,
    );
    return () => window.clearInterval(timer);
  }, [slides.length]);

  const scrollTo = (id) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const slide = slides[activeSlide];
  return (
    <section className="premium-hero" aria-label="Electric vehicle showcase">
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.image}
          className="premium-hero__image"
          style={{ backgroundImage: `url(${slide.image})` }}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.2 }, scale: { duration: 7, ease: 'linear' } }}
        />
      </AnimatePresence>
      <div className="premium-hero__shade" />
      <div className="premium-hero__road-glow" style={{ '--slide-accent': slide.accent }} />

      <div className="premium-hero__content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            className="premium-hero__copy"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="premium-hero__eyebrow"><span />{slide.eyebrow}</div>
            <h1>{slide.title}</h1>
            <p>{slide.description}</p>
            <div className="premium-hero__actions">
              <button type="button" onClick={() => scrollTo('explore-evs')} className="premium-hero__primary">Explore EVs <span>↗</span></button>
              <button type="button" onClick={() => scrollTo('voice-agent')} className="premium-hero__secondary">Talk to EVA <span className="premium-hero__pulse" /></button>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="premium-hero__footer">
          <div className="premium-hero__metric"><strong>{slide.metric}</strong><span>{slide.metricLabel}</span></div>
          <div className="premium-hero__nav" aria-label="Hero slides">
            {slides.map((item, index) => (
              <button key={item.image} type="button" onClick={() => setActiveSlide(index)} className={index === activeSlide ? 'is-active' : ''} aria-label={`Show slide ${index + 1}`}>
                <span>{String(index + 1).padStart(2, '0')}</span><i />
              </button>
            ))}
          </div>
          <div className="premium-hero__scroll">Scroll to discover <span>↓</span></div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FEATURES — Staggered cards from bottom
// ============================================================
function Features() {
  const items = [
    { icon: '🎙️', title: 'AI Voice Calling', desc: 'Autonomous inbound & outbound calls with natural conversation flow', color: '#0066FF' },
    { icon: '💬', title: 'Omni-Channel Chat', desc: 'Website, WhatsApp & SMS — unified AI agent handles all channels', color: '#00D4FF' },
    { icon: '📅', title: 'Smart Booking', desc: 'Automated test ride and service appointment scheduling', color: '#00FF88' },
    { icon: '⚡', title: 'Lead Qualification', desc: 'AI scores and prioritizes high-intent leads instantly', color: '#FFB347' },
    { icon: '🔋', title: 'Charging Support', desc: '24/7 charging query resolution and station locator', color: '#A78BFA' },
    { icon: '📊', title: 'Live Analytics', desc: 'Real-time conversions, response metrics and ROI reports', color: '#F472B6' },
    { icon: '🔗', title: 'CRM Integration', desc: 'Auto-push leads to HubSpot, Salesforce via n8n', color: '#FB923C' },
    { icon: '🕐', title: 'Always On', desc: 'Zero fatigue, zero delays, zero missed leads ever', color: '#34D399' },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="features" style={{ padding: '96px 24px', background: '#080C14' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        {/* Header */}
        <AnimatedSection style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Features</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'white', marginBottom: 14 }}>Everything your EV business needs</h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', maxWidth: 520, margin: '0 auto' }}>One AI platform to handle every customer touchpoint.</p>
        </AnimatedSection>

        {/* Staggered grid */}
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}
        >
          {items.map(({ icon, title, desc, color }) => (
            <motion.div
              key={title}
              variants={staggerItem}
              whileHover={{ y: -6, borderColor: color + '60', boxShadow: `0 20px 40px ${color}18`, transition: { duration: 0.2 } }}
              style={{ background: '#0D1422', border: '1px solid #1A2540', borderRadius: 14, padding: 22, cursor: 'default' }}
            >
              <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 7 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// HOW IT WORKS — Cards slide up with stagger
// ============================================================
function HowItWorks() {
  const steps = [
    { num: '01', icon: '💬', title: 'Customer Reaches Out', desc: 'Via chat, voice, or WhatsApp. AI activates instantly — no wait time.' },
    { num: '02', icon: '🧠', title: 'AI Processes via n8n', desc: 'Intent detected, context understood, response in under 2 seconds.' },
    { num: '03', icon: '✅', title: 'Lead Captured & Converted', desc: 'Bookings confirmed, leads saved, hot prospects escalated to humans.' },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" style={{ padding: '96px 24px', background: '#050810' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>

        <AnimatedSection style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>How It Works</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'white', marginBottom: 14 }}>
            From inquiry to conversion in{' '}
            <span style={{ background: 'linear-gradient(135deg,#0066FF,#00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>3 steps</span>
          </h2>
        </AnimatedSection>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}
        >
          {steps.map(({ num, icon, title, desc }) => (
            <motion.div
              key={num}
              variants={staggerItem}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              style={{ background: '#0D1422', border: '1px solid #1A2540', borderRadius: 16, padding: 28, textAlign: 'center' }}
            >
              <div style={{ fontSize: 40, marginBottom: 16 }}>{icon}</div>
              <div style={{ fontSize: 10, color: '#6B7280', fontFamily: 'monospace', marginBottom: 8 }}>{num}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'white', marginBottom: 10 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7 }}>{desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// VOICE AGENT SECTION — Left slides in, right slides in
// ============================================================
function VoiceAgentSection() {
  const capabilities = [
    'Book test rides by just speaking',
    'Get real-time EV range & pricing',
    'Resolve charging issues instantly',
    'Schedule service appointments',
    'Qualify and capture your details',
    'Escalate to human agent if needed',
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="voice-agent" style={{ padding: '96px 24px', background: '#080C14', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 700, height: 400, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(255,107,0,0.06) 0%, transparent 70%)'
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }} ref={ref}>

        {/* Header */}
        <AnimatedSection style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 16 }}>
            <span style={{ width: 7, height: 7, background: '#FF6B00', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#FF8C40', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ElevenLabs Voice AI · Live</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'white', marginBottom: 14 }}>
            Talk to our AI Agent —{' '}
            <span style={{ background: 'linear-gradient(135deg,#FF6B00,#FFB347)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Right Now</span>
          </h2>
          <p style={{ fontSize: 16, color: '#9CA3AF', maxWidth: 520, margin: '0 auto' }}>
            Powered by ElevenLabs ConvAI. Have a real voice conversation — no typing needed.
          </p>
        </AnimatedSection>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>

          {/* Widget — slides from left */}
          <motion.div
            variants={fadeLeft}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
            style={{ background: '#0D1422', border: '1px solid rgba(255,107,0,0.22)', borderRadius: 20, overflow: 'hidden', boxShadow: '0 0 50px rgba(255,107,0,0.1)' }}
          >
            <div style={{ padding: '16px 20px', background: 'rgba(255,107,0,0.04)', borderBottom: '1px solid rgba(255,107,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎙️</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>TataEV Voice Agent</div>
                  <div style={{ fontSize: 10, color: '#FF8C40' }}>Powered by ElevenLabs ConvAI</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, background: '#00FF88', borderRadius: '50%', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                <span style={{ fontSize: 10, color: '#00FF88' }}>Live</span>
              </div>
            </div>
            <div style={{ padding: 20, background: '#080C14', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 48 }}>
                {[30,55,80,60,90,45,70,85,40,65,50,75,35,90,60].map((h, i) => (
                  <div key={i} style={{ width: 3, borderRadius: 2, background: `rgba(255,107,0,${0.35 + (h/100)*0.65})`, height: h * 0.48, animation: `barwave ${0.9+(i%3)*0.2}s ease-in-out infinite`, animationDelay: `${i*0.08}s`, transformOrigin: 'center' }} />
                ))}
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Click mic → speak naturally</p>
            </div>
            <div style={{ padding: '16px 20px', background: '#0D1422' }}>
              <ElevenLabsEmbed agentId={AGENT_ID} />
              <p style={{ fontSize: 10, color: '#374151', textAlign: 'center', marginTop: 8, fontFamily: 'monospace' }}>Allow microphone when browser asks</p>
            </div>
          </motion.div>

          {/* Capabilities — slides from right */}
          <motion.div
            variants={fadeRight}
            initial="hidden"
            animate={inView ? 'visible' : 'hidden'}
          >
            <h3 style={{ fontSize: 'clamp(22px,3vw,32px)', fontWeight: 800, color: 'white', marginBottom: 24 }}>
              Just speak naturally —<br /><span style={{ color: '#9CA3AF' }}>the AI handles the rest</span>
            </h3>
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate={inView ? 'visible' : 'hidden'}
              style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}
            >
              {capabilities.map((cap, i) => (
                <motion.div key={i} variants={staggerItem} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ color: '#FF6B00', flexShrink: 0, fontSize: 16 }}>✓</span>
                  <span style={{ fontSize: 14, color: '#D1D5DB' }}>{cap}</span>
                </motion.div>
              ))}
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[['<1s','Voice response'],['40+','Languages'],['99.9%','Uptime']].map(([v,l]) => (
                <div key={l} style={{ background: '#0D1422', border: '1px solid #1A2540', borderRadius: 12, padding: 14, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#FF8C40' }}>{v}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// COST CALCULATOR — Scale + Fade
// ============================================================
function CostCalculator() {
  const [form, setForm] = useState({ workers: 10, salary: 25000, extra: 50000, hours: 8, aiCost: 14999, multiplier: 3 });
  const [result, setResult] = useState(null);
  const [showHinglish, setShowHinglish] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: Number(e.target.value) }));
  const fmt = n => n.toLocaleString('en-IN');

  const calc = () => {
    const humanCost = (form.workers * form.salary) + form.extra;
    const humanHours = form.workers * form.hours * 26;
    const aiAgents = Math.ceil(form.workers / form.multiplier);
    const aiCost = aiAgents * form.aiCost;
    const aiHours = form.workers * 24 * 30;
    const saved = humanCost - aiCost;
    const pct = ((saved / humanCost) * 100).toFixed(1);
    const outPct = (((aiHours - humanHours) / humanHours) * 100).toFixed(0);
    setResult({ humanCost, humanHours, aiAgents, aiCost, aiHours, saved, pct, outPct });
  };

  const inp = (label, k, pre, suf) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 11, color: '#9CA3AF', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {pre && <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#FF8C40', fontSize: 13, fontWeight: 700 }}>{pre}</span>}
        <input type="number" value={form[k]} onChange={set(k)} min={0} style={{
          width: '100%', background: '#080C14', border: '1px solid #1A2540', borderRadius: 8,
          padding: pre ? '10px 10px 10px 26px' : '10px', color: 'white', fontSize: 13,
          outline: 'none', boxSizing: 'border-box',
        }} />
        {suf && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#6B7280', fontSize: 10 }}>{suf}</span>}
      </div>
    </div>
  );

  return (
    <section id="calculator" style={{ padding: '96px 24px', background: '#050810' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <AnimatedSection style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(0,102,255,0.1)', border: '1px solid rgba(0,102,255,0.25)', borderRadius: 20, padding: '5px 14px', marginBottom: 14 }}>
            <span>🧮</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA', letterSpacing: '0.1em', textTransform: 'uppercase' }}>ROI Calculator</span>
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'white', marginBottom: 12 }}>
            Human Workers vs{' '}
            <span style={{ background: 'linear-gradient(135deg,#0066FF,#00D4FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Agents</span>
            {' '}— Cost Calculator
          </h2>
          <p style={{ fontSize: 15, color: '#9CA3AF' }}>Enter your numbers and see exactly how much AI saves you.</p>
        </AnimatedSection>

        {/* Two panels — slide from sides */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <AnimatedSection variants={fadeLeft} style={{ background: '#0D1422', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>👥</span>
              <div><div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>Human Team</div><div style={{ fontSize: 10, color: '#6B7280' }}>Current monthly costs</div></div>
            </div>
            {inp('Number of Workers', 'workers')}
            {inp('Monthly Salary / Worker', 'salary', '₹')}
            {inp('Additional Costs (office, training etc)', 'extra', '₹')}
            {inp('Working Hours / Day', 'hours', null, 'hrs')}
          </AnimatedSection>

          <AnimatedSection variants={fadeRight} style={{ background: '#0D1422', border: '1px solid rgba(0,102,255,0.2)', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <div><div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>AI Agent Setup</div><div style={{ fontSize: 10, color: '#6B7280' }}>TataEV AI platform costs</div></div>
            </div>
            {inp('AI Agent Monthly Cost / agent', 'aiCost', '₹')}
            {inp('Efficiency (1 AI = ? workers)', 'multiplier', null, 'workers')}
            <div style={{ background: '#080C14', border: '1px solid rgba(0,102,255,0.15)', borderRadius: 10, padding: 14, marginTop: 8 }}>
              <div style={{ fontSize: 10, color: '#6B7280', marginBottom: 10 }}>LIVE PREVIEW</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  ['AI Agents Needed', Math.ceil(form.workers / form.multiplier)],
                  ['Total AI Cost', `₹${fmt(Math.ceil(form.workers/form.multiplier)*form.aiCost)}`],
                  ['Availability', '24/7/365'],
                  ['Response Time', '< 2 sec'],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: '#0D1422', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: '#6B7280', marginBottom: 2 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>

        <AnimatedSection style={{ textAlign: 'center', marginBottom: 36 }}>
          <motion.button
            onClick={calc}
            whileHover={{ scale: 1.04, boxShadow: '0 0 44px rgba(0,102,255,0.6)' }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: 'linear-gradient(135deg,#0066FF,#0044CC)', color: 'white', border: 'none',
              borderRadius: 12, padding: '14px 48px', fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 0 30px rgba(0,102,255,0.4)',
            }}
          >
            🧮 Calculate Savings Now
          </motion.button>
        </AnimatedSection>

        <AnimatePresence>
          {result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
            >
              {/* Banner */}
              <div style={{
                background: result.saved > 0 ? 'rgba(0,255,136,0.06)' : 'rgba(239,68,68,0.06)',
                border: `1px solid ${result.saved > 0 ? 'rgba(0,255,136,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: 16, padding: '22px 24px', marginBottom: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>
                    {result.saved > 0 ? `🎉 AI saves ₹${fmt(result.saved)}/month!` : '⚠️ Review your numbers'}
                  </div>
                  <div style={{ fontSize: 13, color: '#9CA3AF' }}>
                    {result.saved > 0 ? `₹${fmt(result.saved * 12)} saved annually — ${result.pct}% cost reduction` : 'Try increasing efficiency multiplier or reducing AI cost'}
                  </div>
                </div>
                <div style={{ background: result.saved > 0 ? 'rgba(0,255,136,0.15)' : 'rgba(239,68,68,0.15)', borderRadius: 12, padding: '12px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: result.saved > 0 ? '#00FF88' : '#F87171' }}>
                    {result.saved > 0 ? `-${result.pct}%` : `+${Math.abs(result.pct)}%`}
                  </div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>Cost Change</div>
                </div>
              </div>

              {/* KPIs */}
              <StaggerSection style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
                {[
                  { label: 'Human Monthly Cost', val: `₹${fmt(result.humanCost)}`, sub: `${form.workers} workers`, color: '#F87171' },
                  { label: 'AI Monthly Cost', val: `₹${fmt(result.aiCost)}`, sub: `${result.aiAgents} agents`, color: '#60A5FA' },
                  { label: 'Monthly Savings', val: `₹${fmt(Math.abs(result.saved))}`, sub: result.saved > 0 ? 'with AI' : 'humans cheaper', color: '#00FF88' },
                  { label: 'Output Increase', val: `+${result.outPct}%`, sub: 'AI works 24/7', color: '#FFB347' },
                ].map(({ label, val, sub, color }) => (
                  <motion.div key={label} variants={staggerItem} style={{ background: '#0D1422', border: `1px solid ${color}25`, borderRadius: 14, padding: 18, textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color, marginBottom: 5 }}>{val}</div>
                    <div style={{ fontSize: 12, color: '#9CA3AF' }}>{label}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{sub}</div>
                  </motion.div>
                ))}
              </StaggerSection>

              {/* Visual bars */}
              <div style={{ background: '#0D1422', border: '1px solid #1A2540', borderRadius: 14, padding: 22, marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'white', marginBottom: 18 }}>📊 Visual Comparison</div>
                {[
                  { label: 'Human Team Cost', val: result.humanCost, color: '#F87171' },
                  { label: 'AI Agent Cost', val: result.aiCost, color: '#60A5FA' },
                  ...(result.saved > 0 ? [{ label: 'Monthly Savings', val: result.saved, color: '#00FF88' }] : []),
                ].map(({ label, val, color }) => {
                  const pct = Math.min((val / result.humanCost) * 100, 100);
                  return (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                        <span style={{ color: '#9CA3AF' }}>{label}</span>
                        <span style={{ color: 'white', fontWeight: 700 }}>₹{fmt(val)}</span>
                      </div>
                      <div style={{ height: 8, background: '#1A2540', borderRadius: 4, overflow: 'hidden' }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                          style={{ height: '100%', background: color, borderRadius: 4 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Hinglish */}
              <div style={{ background: 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.15)', borderRadius: 14, overflow: 'hidden' }}>
                <button onClick={() => setShowHinglish(!showHinglish)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#FF8C40' }}>🇮🇳 Hinglish mein samjho — AI kyun better hai? {showHinglish ? '▲' : '▼'}</span>
                </button>
                <AnimatePresence>
                  {showHinglish && (
                    <motion.div
                      key="hinglish"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{ padding: '0 18px 18px' }}>
                        <div style={{ background: '#080C14', borderRadius: 10, padding: 18, fontSize: 13, color: '#D1D5DB', lineHeight: 2 }}>
                          <p><strong style={{ color: '#FF8C40' }}>Bhai, ekdum simple baat:</strong></p>
                          <p>Ek human worker din mein sirf <strong style={{ color: '#F87171' }}>{form.hours} ghante</strong> kaam karta hai — baaki time chai, lunch, meetings aur Sunday off! 😅</p>
                          <p><strong style={{ color: '#60A5FA' }}>AI Agent?</strong> Woh <strong style={{ color: '#00FF88' }}>24 ghante, 7 din, 365 din</strong> kaam karta hai. Bimaar nahi padta, salary hike nahi maangta! 🤖</p>
                          <p>Tumhare <strong>{form.workers} workers</strong> ka kharcha: <strong style={{ color: '#F87171' }}>₹{fmt(result.humanCost)}/month</strong></p>
                          <p>Sirf <strong style={{ color: '#60A5FA' }}>{result.aiAgents} AI agents</strong> se same kaam: <strong style={{ color: '#60A5FA' }}>₹{fmt(result.aiCost)}/month</strong></p>
                          {result.saved > 0 && <p><strong style={{ color: '#00FF88' }}>Bachenge: ₹{fmt(result.saved)}/month = ₹{fmt(result.saved * 12)}/saal! 🎉</strong></p>}
                          <ul style={{ paddingLeft: 16 }}>
                            <li>✅ Raat 2 baje bhi customer ka call attend hoga</li>
                            <li>✅ Ek saath 100+ customers se baat</li>
                            <li>✅ Test ride booking automatic</li>
                            <li>✅ Koi bhi lead miss nahi hogi</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ============================================================
// TESTIMONIALS — Cards slide up with stagger
// ============================================================
function Testimonials() {
  const data = [
    { name: 'Priya Sharma', title: 'Sales Head, EV Nation', init: 'PS', text: 'Test ride bookings up 240% in 3 months. The AI handles objections better than junior reps!', metric: '+240% rides' },
    { name: 'Rajan Mehta', title: 'CEO, GreenDrive Motors', init: 'RM', text: 'We were losing leads after 9 PM. Now AI captures them overnight. 47 qualified leads on day one!', metric: '47 overnight' },
    { name: 'Anita Patel', title: 'CX Head, Volt Auto', init: 'AP', text: 'Support tickets dropped 65%. AI resolves most issues instantly. Team loves it.', metric: '-65% tickets' },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section style={{ padding: '96px 24px', background: '#050810' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimatedSection style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Testimonials</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'white' }}>Trusted by EV industry leaders</h2>
        </AnimatedSection>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}
        >
          {data.map(({ name, title, init, text, metric }) => (
            <motion.div
              key={name}
              variants={staggerItem}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              style={{ background: '#0D1422', border: '1px solid #1A2540', borderRadius: 16, padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#0066FF,#00D4FF)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'white', fontSize: 13 }}>{init}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'white', fontSize: 13 }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>{title}</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 20, padding: '3px 10px', fontSize: 10, color: '#00FF88', alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>{metric}</div>
              </div>
              <div style={{ fontSize: 12, color: '#9CA3AF' }}>⭐⭐⭐⭐⭐</div>
              <p style={{ fontSize: 13, color: '#D1D5DB', lineHeight: 1.7, marginTop: 8 }}>"{text}"</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// PRICING — Scale + Fade with stagger
// ============================================================
function Pricing() {
  const plans = [
    { name: 'Starter', price: '₹4,999', period: '/mo', desc: 'Single-location EV dealers', features: ['500 AI conversations', 'Chat agent', 'Lead capture', 'Basic analytics', 'Email support'], cta: 'Get Started', featured: false },
    { name: 'Growth', price: '₹14,999', period: '/mo', desc: 'Growing EV dealerships & OEMs', features: ['5,000 conversations', 'Voice + Chat', 'n8n workflows', 'CRM integrations', 'Priority support', 'Custom AI training'], cta: 'Get Started', featured: true, badge: '⚡ Most Popular' },
    { name: 'Enterprise', price: 'Custom', period: '', desc: 'Large EV companies & fleets', features: ['Unlimited conversations', 'Custom voice persona', 'White-label solution', 'Dedicated AI model', 'Account manager'], cta: 'Contact Sales', featured: false },
  ];

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="pricing" style={{ padding: '96px 24px', background: '#080C14' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <AnimatedSection style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: 'white', marginBottom: 12 }}>Simple, transparent pricing</h2>
          <p style={{ fontSize: 15, color: '#9CA3AF' }}>No hidden fees. Cancel anytime.</p>
        </AnimatedSection>

        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}
        >
          {plans.map(({ name, price, period, desc, features, cta, featured, badge }) => (
            <motion.div
              key={name}
              variants={featured ? scaleIn : staggerItem}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              style={{
                background: '#0D1422', border: `1px solid ${featured ? '#0066FF' : '#1A2540'}`,
                borderRadius: 16, padding: 28, position: 'relative',
                transform: featured ? 'scale(1.03)' : 'scale(1)',
                boxShadow: featured ? '0 0 30px rgba(0,102,255,0.2)' : 'none',
              }}
            >
              {badge && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#0066FF', color: 'white', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 10, whiteSpace: 'nowrap' }}>{badge}</div>}
              <div style={{ fontWeight: 800, color: 'white', fontSize: 18, marginBottom: 5 }}>{name}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 14 }}>{desc}</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'white' }}>{price}</span>
                <span style={{ fontSize: 13, color: '#6B7280' }}>{period}</span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {features.map(f => <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#D1D5DB' }}><span style={{ color: '#00FF88', fontWeight: 700 }}>✓</span>{f}</li>)}
              </ul>
              <Link to="/login" style={{
                display: 'block', textAlign: 'center', padding: '11px', borderRadius: 9,
                fontWeight: 700, fontSize: 13, textDecoration: 'none',
                background: featured ? '#0066FF' : 'transparent',
                color: featured ? 'white' : '#00D4FF',
                border: featured ? 'none' : '1px solid #1A2540',
              }}>{cta}</Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// CONTACT — Fade Up
// ============================================================
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [savedData, setSavedData] = useState(null);
  const [error, setError] = useState('');

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    await fetch(
      'https://script.google.com/macros/s/AKfycbwp4eHb1lF8HS6m7pVzEP7dm37eneyufbjTbSm-JZcbFVFUErM3wzBOy7hVLBA0mWBlhg/exec',
      {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(form),
      }
    );

    setSavedData({ ...form });
    setSent(true);
    setForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      message: '',
    });
  } catch (err) {
    console.error(err);
    setError('Google Sheet me data save nahi hua.');
  } finally {
    setLoading(false);
  }
};

  const iStyle = {
    width: '100%', background: '#080C14', border: '1px solid #1A2540',
    borderRadius: 8, padding: '11px 13px', color: 'white', fontSize: 13,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <section id="contact" style={{ padding: '96px 24px', background: '#050810' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <AnimatedSection style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#00D4FF', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Contact</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, color: 'white', marginBottom: 10 }}>Ready to get started?</h2>
          <p style={{ fontSize: 15, color: '#9CA3AF' }}>Talk to our team for a personalized EV demo.</p>
        </AnimatedSection>

        <AnimatePresence mode="wait">
          {sent && savedData ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: 16, padding: 32, textAlign: 'center' }}
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, delay: 0.1 }} style={{ fontSize: 52, marginBottom: 12 }}>✅</motion.div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>Message Sent Successfully!</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 20 }}>Thank you for contacting TataEV. Our team will reach out to you soon.</div>
              <button onClick={() => { setSent(false); setSavedData(null); }} style={{
                background: '#0066FF', color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Send Another Message</button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleSubmit}
              style={{ background: '#0D1422', border: '1px solid #1A2540', borderRadius: 16, padding: 28 }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>Full Name *</label>
                  <input required placeholder="Arjun Rathi" value={form.name} onChange={set('name')} style={iStyle}
                    onFocus={e => e.target.style.borderColor='#0066FF'} onBlur={e => e.target.style.borderColor='#1A2540'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>Phone Number</label>
                  <input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} style={iStyle}
                    onFocus={e => e.target.style.borderColor='#0066FF'} onBlur={e => e.target.style.borderColor='#1A2540'} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>Email Address *</label>
                  <input required type="email" placeholder="arjun@gmail.com" value={form.email} onChange={set('email')} style={iStyle}
                    onFocus={e => e.target.style.borderColor='#0066FF'} onBlur={e => e.target.style.borderColor='#1A2540'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>Company Name</label>
                  <input placeholder="EV Dealership Pvt Ltd" value={form.company} onChange={set('company')} style={iStyle}
                    onFocus={e => e.target.style.borderColor='#0066FF'} onBlur={e => e.target.style.borderColor='#1A2540'} />
                </div>
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, color: '#9CA3AF', marginBottom: 5 }}>Message *</label>
                <textarea required rows={4} placeholder="Tell us about your EV business and what you need..."
                  value={form.message} onChange={set('message')}
                  style={{ ...iStyle, resize: 'none' }}
                  onFocus={e => e.target.style.borderColor='#0066FF'}
                  onBlur={e => e.target.style.borderColor='#1A2540'} />
              </div>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 12, color: '#F87171' }}>
                  ⚠️ {error}
                </motion.div>
              )}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 32px rgba(0,102,255,0.5)' } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                style={{
                  width: '100%', background: loading ? '#1A2540' : '#0066FF',
                  color: 'white', border: 'none', borderRadius: 10, padding: '13px',
                  fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 0 24px rgba(0,102,255,0.3)',
                }}
              >
                {loading
                  ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Saving...</>
                  : '📨 Send Message'
                }
              </motion.button>
              <p style={{ textAlign: 'center', fontSize: 11, color: '#374151', marginTop: 10 }}>
                 🔒 Securely stored in Google Sheets
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER — Fade Up
// ============================================================
function Footer() {
  return (
    <AnimatedSection>
      <footer style={{ background: '#050810', borderTop: '1px solid #1A2540', padding: '40px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>⚡</span>
            <span style={{ fontWeight: 800, color: 'white' }}>Tata<span style={{ color: '#00D4FF' }}>EV</span></span>
            <span style={{ color: '#374151', marginLeft: 8, fontSize: 12 }}>AI-Powered EV Agent Platform</span>
          </div>
          <div style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace' }}>
            © 2025 TataEV · React + Node.js + MongoDB + n8n + ElevenLabs
          </div>
        </div>
      </footer>
    </AnimatedSection>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default function LandingPage() {
  return (
    <div style={{ background: '#080C14', minHeight: '100vh' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes barwave { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080C14; color: #E8EDF5; }
        input:focus, textarea:focus { outline: none; border-color: #0066FF !important; }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        @media (max-width: 768px) {
          .voice-layout, .calc-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <VoiceAgentSection />
      <CostCalculator />
      <Testimonials />
      <Pricing />
      <EVExplorer />
      <EVComparator />
      <Contact />
      <Footer />
    </div>
  );
}
