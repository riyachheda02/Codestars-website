import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Trophy,
  Users,
  Building2,
  Zap,
  Calendar,
  Clock,
  GraduationCap,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Star,
  Flame,
  Code2,
  Coffee,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';

import codestarsLogo from '../assets/djs_codestarsLogo.jpeg';
import bloodBytesImg from '../assets/events photo/bloody_bites.webp';
import codeUncodeImg from '../assets/events photo/code_uncode_poolprize.jpg';
import bountyImg from '../assets/events photo/bounty.webp';
import mockContestImg from '../assets/events photo/MOCK_CONTEST .webp';
import feContestImg from '../assets/events photo/FE_CONTEST.webp';
import icpcImg from '../assets/events photo/icpc_logo.png';
import cfgImg from '../assets/events photo/cfg.webp';

import Footer from '../components/Footer';
import './Events.css';

gsap.registerPlugin(ScrollTrigger);

const BadgeIcon = ({ type }) => {
  const map = {
    flagship: React.createElement(Star, { size: 11, strokeWidth: 2.5 }),
    new: React.createElement(Zap, { size: 11, strokeWidth: 2.5 }),
    premium: React.createElement(Flame, { size: 11, strokeWidth: 2.5 }),
    interaction: React.createElement(Coffee, { size: 11, strokeWidth: 2.5 }),
  };
  return map[type] || null;
};

function useCounter(end, duration, start) {
  const ref = useRef(null);
  useEffect(() => {
    if (!start || !ref.current) return;
    const el = ref.current;
    const raw = end.replace(/[^0-9]/g, '');
    const prefix = end.match(/^[^0-9]*/)?.[0] || '';
    const suffix = end.match(/[^0-9]*$/)?.[0] || '';
    const target = parseInt(raw, 10);
    if (isNaN(target)) {
      el.textContent = end;
      return;
    }
    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: duration / 1000,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = prefix + Math.round(obj.val).toLocaleString('en-IN') + suffix;
      },
    });
  }, [start]);
  return ref;
}

function StatItem({ stat, visible }) {
  const numRef = useCounter(stat.raw, 2000, visible);
  return React.createElement(
    'div',
    { className: 'ev2-stat-item' },
    React.createElement('p', { className: 'ev2-stat-label' }, stat.label),
    React.createElement('p', { className: 'ev2-stat-number', ref: numRef }, stat.raw)
  );
}

export default function Events({ onNavigate }) {
  const rootRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroSubRef = useRef(null);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = React.useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const ctx = gsap.context(() => {
      if (heroTitleRef.current) {
        const text = heroTitleRef.current.textContent;
        heroTitleRef.current.innerHTML = text
          .split('')
          .map((c) => (c === ' ' ? '&nbsp;' : `<span class="ev2-char">${c}</span>`))
          .join('');

        gsap.fromTo(
          '.ev2-char',
          { y: 80, opacity: 0, rotationX: -70 },
          {
            y: 0,
            opacity: 1,
            rotationX: 0,
            duration: 0.8,
            ease: 'back.out(1.4)',
            stagger: 0.04,
            delay: 0.2,
            transformOrigin: 'bottom center',
          }
        );
      }

      gsap.fromTo(
        heroSubRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.7 }
      );

      gsap.utils.toArray('.ev2-reveal').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          }
        );
      });

      ScrollTrigger.create({
        trigger: statsRef.current,
        start: 'top 85%',
        once: true,
        onEnter: () => setStatsVisible(true),
      });

      gsap.to('.ev2-grid-layer', {
        backgroundPositionY: '30%',
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      gsap.to('.ev2-orb-1', { scale: 1.15, opacity: 0.16, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to('.ev2-orb-2', { scale: 1.2, opacity: 0.1, duration: 5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1 });

      gsap.to('.ev2-ticker-track', {
        xPercent: -50,
        ease: 'none',
        duration: 20,
        repeat: -1,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    if (onNavigate) onNavigate(target);
    else window.location.hash = target === 'events' ? '#events' : target === 'team' ? '#team' : '#';
  };

  const stats = [
    { raw: 'Rs.2,50,000+', label: 'Total Prize Pool' },
    { raw: '4000+', label: 'Total Participants' },
    { raw: '370+', label: 'Participating Institutes' },
    { raw: '3', label: 'Competition Events' },
  ];

  const previousEvents = [
    {
      id: 'code-uncode',
      badge: 'Flagship Event',
      badgeType: 'flagship',
      prize: 'Rs.2,00,000 Prize Pool',
      title: 'Code UnCode 2025 Championship',
      subtitle: 'Code UnCode',
      image: codeUncodeImg,
      description:
        "Mumbai's premier ICPC-style solo competitive programming championship. Experience the ultimate coding challenge with 2000+ participants from 500+ institutes.",
      dateLocation: 'February 2025 . Mumbai',
      btnText: 'Learn More',
      btnUrl: 'https://codeuncode.djscodestars.in/',
      isExternal: true,
    },
    {
      id: 'code-bounty',
      badge: 'Flagship Event',
      badgeType: 'flagship',
      title: 'Code Bounty Challenge',
      subtitle: 'Intra-College Competitive Programming Event',
      image: bountyImg,
      description:
        'A thrilling two round Coding Contest where your problem solving skills will be put to test',
      dateLocation: 'March 2026 . Mumbai',
      btnText: 'Notify Me',
      btnUrl: '#',
      isExternal: false,
    },
    {
      id: 'mock-contest',
      badge: 'New Event',
      badgeType: 'new',
      title: 'MOCK CONTEST',
      subtitle: 'Exclusively for 2nd Year Coders',
      image: mockContestImg,
      description:
        'Sharpen your competitive programming instincts in an ICPC simulated environment with live standings and post-contest problem discussions.',
      dateLocation: 'October 2025 . IT Dept, DJSCE',
      btnText: 'Contest Page',
      btnUrl: 'https://codeforces.com/group/g6lZJwfgjF',
      isExternal: true,
    },
    {
      id: 'fe-contest',
      badge: 'New Event',
      badgeType: 'new',
      title: 'FE Contest',
      subtitle: 'First Year Algorithmic Faceoff',
      image: feContestImg,
      description:
        'A dedicated beginner-friendly programming arena curated to ignite logic building, data structure foundations, and coding passion right from year one.',
      dateLocation: 'Annual . DJSCE Campus',
      btnText: 'Explore Details',
      btnUrl: '#',
      isExternal: false,
    },
    {
      id: 'icpc-camp',
      badge: 'Premium Event',
      badgeType: 'premium',
      title: 'ICPC Camp',
      subtitle: 'Advanced Problem Solving Bootcamps',
      image: icpcImg,
      description:
        'Intensive multi-day bootcamp mentoring students on segment trees, Fenwick trees, tree flattenings, dynamic programming optimizations, and high-tier contest strategies.',
      dateLocation: 'Summer / Winter Sessions',
      btnText: 'View Syllabus',
      btnUrl: '#',
      isExternal: false,
    },
    {
      id: 'coffee-googlers',
      badge: 'Interaction Event',
      badgeType: 'interaction',
      title: 'Coffee-with-Googlers',
      subtitle: 'Exclusive AMA & Mentorship Session',
      image: cfgImg,
      description:
        'Direct interaction with DJSCE alumni and Google software engineers discussing technical interview preparation, ICPC benefits, system design, and career roadmaps.',
      dateLocation: 'Special Mentorship Series',
      btnText: 'Read Highlights',
      btnUrl: '#',
      isExternal: false,
    },
  ];

  const badgeClass = {
    flagship: 'bc-flagship',
    new: 'bc-new',
    premium: 'bc-premium',
    interaction: 'bc-interaction',
  };

  const tickerText = 'CODE . COMPETE . CONQUER . BLOODBYTES . CODE UNCODE . ICPC CAMP . ';

  return (
    <div className="ev2-root" ref={rootRef}>
      {/* Background Ambience */}
      <div className="ev2-bg-fixed">
        <div className="ev2-grid-layer" />
        <div className="ev2-orb ev2-orb-1" />
        <div className="ev2-orb ev2-orb-2" />
        <div className="ev2-scanline" />
      </div>

      {/* Hero Section */}
      <section className="ev2-hero">
        <div className="ev2-hero-inner">
          <span className="ev2-eyebrow-pill">
            <Zap size={11} strokeWidth={2.5} /> CODESTARS
          </span>
          <h1 className="ev2-hero-title" ref={heroTitleRef}>
            presents...
          </h1>
          <p className="ev2-hero-sub" ref={heroSubRef}>
            Join Mumbai's most prestigious coding competitions. Three epic events designed to
            challenge, inspire, and celebrate the finest programming talent in the region.
          </p>
        </div>
        <div className="ev2-ticker-wrap" aria-hidden="true">
          <div className="ev2-ticker-track">
            <span>{tickerText.repeat(8)}</span>
          </div>
        </div>
      </section>

      {/* Statistics Section: Photo 2 style (all in 1 line, minimized height) */}
      <section className="ev2-stats-section" ref={statsRef}>
        <div className="ev2-stats-inner ev2-reveal">
          <div className="ev2-stats-row">
            {stats.map((s, i) => (
              <React.Fragment key={i}>
                <StatItem stat={s} visible={statsVisible} />
                {i < stats.length - 1 && <div className="ev2-stats-divider" />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Event: BloodBytes Showcase with Photo */}
      <section className="ev2-upcoming">
        <div className="ev2-container">
          <div className="ev2-section-head ev2-reveal">
            <span className="ev2-section-eyebrow">
              <Calendar size={12} strokeWidth={2.5} /> Mark Your Calendars
            </span>
            <h2 className="ev2-section-title">Upcoming Events</h2>
            <p className="ev2-section-sub">
              Join us for electrifying competitions, workshops, and tech experiences that challenge
              your code and creativity
            </p>
          </div>

          <div className="ev2-feature-card ev2-reveal">
            <div className="ev2-fc-glow" />

            <div className="ev2-fc-badge-row">
              <span className="ev2-fc-badge">
                <Flame size={12} strokeWidth={2.5} /> FEATURED HALLOWEEN SHOWDOWN
              </span>
              <span className="ev2-fc-prize">
                <Trophy size={12} strokeWidth={2.5} /> Prize: Rs.12,000+
              </span>
            </div>

            <div className="ev2-fc-grid">
              {/* Left Column: Event Photo & Badges */}
              <div className="ev2-fc-media-col">
                <div className="ev2-fc-img-wrapper">
                  <img src={bloodBytesImg} alt="BloodBytes Halloween Contest" className="ev2-fc-img" />
                  <div className="ev2-fc-img-overlay" />
                  <span className="ev2-fc-live-pill">
                    <span className="ev2-pulse-dot" /> LIVE EVENT
                  </span>
                </div>

                <div className="ev2-fc-tags">
                  {['Coding Contest', 'Halloween', 'Spooky', 'Competitive Programming'].map((t) => (
                    <span key={t} className="ev2-fc-tag">
                      <ChevronRight size={10} strokeWidth={3} /> {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Right Column: Info & Specs */}
              <div className="ev2-fc-content-col">
                <h3 className="ev2-fc-title">BloodBytes</h3>
                <h4 className="ev2-fc-subhead">A Halloween Coding Showdown</h4>
                <p className="ev2-fc-desc">
                  Enter the arena where logic bleeds into creativity. BloodBytes is a Halloween-themed
                  coding contest, a spine-chilling test of your programming instincts and problem-solving
                  skills. Battle against time, bugs, and brain-twisters in this thrilling showdown that
                  separates the mortals from the true code warriors.
                </p>

                <div className="ev2-specs-panel">
                  {[
                    { Icon: Calendar, label: 'Date', value: 'October 31, 2025' },
                    { Icon: Clock, label: 'Time', value: '10:00 AM - 5:00 PM' },
                    { Icon: Users, label: 'Participants', value: 'FE, SE & TE Students' },
                    { Icon: Trophy, label: 'Prize', value: 'Rs.12,000+', gold: true },
                  ].map((row) => (
                    <div key={row.label} className="ev2-spec-row">
                      <span className="ev2-spec-label">
                        <row.Icon size={14} strokeWidth={2} /> {row.label}
                      </span>
                      <span className={row.gold ? 'ev2-spec-val gold' : 'ev2-spec-val'}>{row.value}</span>
                    </div>
                  ))}

                  <button
                    className="ev2-register-btn"
                    onClick={() =>
                      alert('Registrations for BloodBytes opening soon! Stay tuned on Discord & WhatsApp.')
                    }
                  >
                    Register for BloodBytes
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Events Grid with Event Photos */}
      <section className="ev2-previous">
        <div className="ev2-container">
          <div className="ev2-section-head ev2-reveal">
            <span className="ev2-section-eyebrow">
              <Trophy size={12} strokeWidth={2.5} /> Hall of Glory
            </span>
            <h2 className="ev2-section-title">Previous Events</h2>
            <p className="ev2-section-sub">
              Three distinct competitions, each designed to test different aspects of programming excellence
            </p>
          </div>

          <div className="ev2-prev-grid">
            {previousEvents.map((evt, i) => (
              <div key={evt.id} className={`ev2-prev-card ev2-reveal ev2-delay-${i % 3}`}>
                <div className={`ev2-card-accent ${badgeClass[evt.badgeType]}`} />

                {/* Event Photo Cover */}
                <div className="ev2-card-thumb-wrap">
                  <img src={evt.image} alt={evt.title} className="ev2-card-thumb" />
                  <div className="ev2-card-thumb-gradient" />
                  <div className="ev2-thumb-badges">
                    <span className={`ev2-badge ${badgeClass[evt.badgeType]}`}>
                      <BadgeIcon type={evt.badgeType} />
                      {evt.badge}
                    </span>
                    {evt.prize && (
                      <span className="ev2-prize-pill">
                        <Trophy size={10} strokeWidth={2.5} /> {evt.prize}
                      </span>
                    )}
                  </div>
                </div>

                <div className="ev2-prev-body">
                  <span className="ev2-prev-sub">{evt.subtitle}</span>
                  <h3 className="ev2-prev-title">{evt.title}</h3>
                  <p className="ev2-prev-desc">{evt.description}</p>
                </div>

                <div className="ev2-prev-footer">
                  <span className="ev2-prev-meta">
                    <Calendar size={11} strokeWidth={2} /> {evt.dateLocation}
                  </span>
                  {evt.isExternal ? (
                    <a href={evt.btnUrl} target="_blank" rel="noreferrer" className="ev2-card-btn">
                      {evt.btnText} <ExternalLink size={11} strokeWidth={2.5} />
                    </a>
                  ) : (
                    <button
                      className="ev2-card-btn"
                      onClick={() => alert(`Updates for ${evt.title} will be shared with the community!`)}
                    >
                      {evt.btnText} <ArrowUpRight size={11} strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
