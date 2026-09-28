import React, { useState, useRef, useCallback, useEffect } from 'react';
import { photosByYear } from '../constant/photos';
import codestarsLogo from '../assets/djs_codestarsLogo.jpeg';
import ScatteredGallery from '../components/ScatteredGallery';
import Footer from '../components/Footer';
import './Home.css';

export default function Home({ onNavigate, selectedYear: propYear, onYearChange }) {
  const [internalYear, setInternalYear] = useState('2026');
  const selectedYear = propYear || internalYear;
  const setSelectedYear = onYearChange || setInternalYear;
  const [activeCards, setActiveCards] = useState([]);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0, visible: false });
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});

  const heroRef = useRef(null);
  const photoIndexRef = useRef(0);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const zIndexCounter = useRef(10);
  const inactivityTimerRef = useRef(null);

  // Switch year for hover photos
  const handleYearChange = (year) => {
    setSelectedYear(year);
    photoIndexRef.current = 0;
    setActiveCards([]);
  };

  // Toggle announcement expansion
  const toggleAnnouncement = (id) => {
    setExpandedAnnouncements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Reset inactivity countdown (photos disappear after 7s of stopped hover)
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      setActiveCards((prev) => prev.map((c) => ({ ...c, fading: true })));
      setTimeout(() => {
        setActiveCards([]);
      }, 800);
    }, 7000);
  }, []);

  // Spawn photo card (max 3 visible, smaller size, no border radius, no labels)
  const spawnPhoto = useCallback((x, y) => {
    const currentPool = photosByYear[selectedYear] || [];
    if (!currentPool.length) return;

    const currentPhoto = currentPool[photoIndexRef.current % currentPool.length];
    photoIndexRef.current += 1;
    zIndexCounter.current += 1;

    // Organic rotation
    const rotation = (Math.random() * 14 - 7).toFixed(1);
    const id = `${Date.now()}-${Math.random()}`;

    const newCard = {
      id,
      url: currentPhoto.url,
      x,
      y,
      rotation,
      zIndex: zIndexCounter.current,
      fading: false,
    };

    setActiveCards((prev) => {
      const updated = [...prev, newCard];
      if (updated.length > 3) {
        return updated.slice(updated.length - 3);
      }
      return updated;
    });

    // Fade after 2s
    setTimeout(() => {
      setActiveCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, fading: true } : c))
      );
    }, 2000);

    // Remove after 2.8s
    setTimeout(() => {
      setActiveCards((prev) => prev.filter((c) => c.id !== id));
    }, 2800);

    resetInactivityTimer();
  }, [selectedYear, resetInactivityTimer]);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCursorPos({ x, y, visible: true });

    const dist = Math.hypot(x - lastPosRef.current.x, y - lastPosRef.current.y);
    if (dist > 65 || (lastPosRef.current.x === 0 && lastPosRef.current.y === 0)) {
      spawnPhoto(x, y);
      lastPosRef.current = { x, y };
    } else {
      resetInactivityTimer();
    }
  };

  const handleMouseEnter = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y, visible: true });
    lastPosRef.current = { x, y };
    spawnPhoto(x, y);
  };

  const handleMouseLeave = () => {
    setCursorPos((prev) => ({ ...prev, visible: false }));
    lastPosRef.current = { x: 0, y: 0 };
    resetInactivityTimer();
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, []);

  const announcementsData = [
    {
      id: 'ann-1',
      date: { month: 'MAR', day: '24' },
      type: 'UPDATE',
      title: 'Schedule Update: Introduction to CodeStars Rescheduled!',
      shortDesc: 'Important Update! The Introduction to CodeStars session has been rescheduled to 2nd October 2025 at 11:00 PM. Mark your calendars and don\'t miss this exciting opportunity to learn about CodeStars and the amazing roles we\'re recruiting for!',
      fullDesc: 'We apologize for any inconvenience caused by this schedule change. The new timing will allow more students to attend and learn about the exciting opportunities at CodeStars. 📅 New Date: 2nd October 2025 🕚 New Time: 11:00 PM All other events remain as scheduled. We look forward to seeing you there! ',
      linkUrl: '#experience',
      
    },
    {
      id: 'ann-2',
      date: { month: 'OCT', day: '01' },
      type: 'EVENT',
      title: '🚀 Codestars is Recruiting! 🌟',
      shortDesc: 'Want to be a part of the most exciting Competitive Programming club on campus? This is your chance! Apply now for Co-Committee positions across Technical, Tech-Editorial, Creatives, Marketing, and Events roles.',
      fullDesc: `We're not just about code—we're about building a community where logic meets creativity. From CP practice sessions to coding contests and fun collab events, Codestars does it all!

As a Co-committee member, you'll:
💻 Plan events & contests
🤝 Connect with coding enthusiasts
🌟 Gain leadership experience

We are organizing an Intro Session on 2nd October 2025 at 11:00 PM and Mock Contest on 3rd October 2025— the perfect start to your Codestars journey!

📋 Available Roles:
• Technical
• Tech-Editorial
• Creatives
• Marketing
• Events

⏳ Application Deadline: 4th October 2025, 11:59 PM
🎓 Eligibility: Open to Second Year students for Co-Comm positions. Intro Session and Mock Contest are open to all students.
📍 Venue: DJ Sanghvi College of Engineering

🗓️ Event Timeline:
• Oct 2 @ 11:00 PM — Introduction to CodeStars
• Oct 3 @ 4:00 PM - 6:00 PM — Mock Contest
• Oct 4 @ 11:59 PM — Application Deadline
• Oct 6 @ 9:00 AM - 3:00 PM — Co-Comm Interviews Day 1
• Oct 7 @ 9:00 AM - 3:00 PM — Co-Comm Interviews Day 2`,
      linkText: 'Contest Page / Application Form',
      linkUrl: 'https://forms.gle/zSQRxwb3vysxrAqS8',
    },
    {
      id: 'ann-3',
      date: { month: 'OCT', day: '03' },
      type: 'EVENT',
      title: '🚀 Mock Contest - Exclusively for 2nd Years!',
      shortDesc: "Greetings, 2nd Years! Welcome to Codestars! We're excited to announce a Mock Contest exclusively for you. Test and sharpen your Competitive Programming skills. New to CP? Don't worry—we've got you covered! You can learn while you compete.",
      fullDesc: `🔹 Exciting problems to test and sharpen your Competitive Programming skills.
🔹 New to CP? Don't worry—we've got you covered! You can learn while you compete.
⚡ Come join us, challenge yourself, and kickstart your CP journey with Codestars!

🎓 Eligibility: Exclusively for Second Year students
📍 Venue: IT Department, DJ Sanghvi College of Engineering

🗓️ Event Timeline:
• Oct 3 @ 4:00 PM — Contest Begins (2 hours to solve programming problems)
• Oct 3 @ 6:00 PM — Contest Ends (Results announced)`,
      linkText: 'Codeforces Contest Page',
      linkUrl: 'https://codeforces.com/group/g6lZJwfgjF',
    },
  ];

  const stats = [
    { number: '15+', label: 'Contests & Hackathons' },
    { number: '500+', label: 'Community Coders' },
    { number: 'ICPC', label: 'Regional Finalists' },
    { number: '100%', label: 'Student Driven' },
  ];

  const experiences = [
    {
      year: '2026',
      title: 'Mock Contest Series & ICPC Prep',
      description: 'Intense simulated algorithmic rounds designed to mirror ICPC regional difficulty, featuring live leaderboards and post-contest editorials.',
      tag: 'Competitive Programming',
    },
    {
      year: '2025',
      title: 'DJSCE Regionals & Finals',
      description: 'Annual flagship coding battle bringing together the sharpest minds across colleges for grueling problem-solving rounds and cash prizes.',
      tag: 'Flagship Event',
    },
    {
      year: '2025',
      title: 'Felicitation & Awards Gala',
      description: 'Celebrating winners, runners-up, mentors, and the top coders who represented DJSCE on national coding leaderboards.',
      tag: 'Awards Ceremony',
    },
  ];

  return (
    <div className="landing-page-root">
      {/* ================= HERO SECTION ================= */}
      <section
        id="hero"
        ref={heroRef}
        className="hero-section"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Floating Photo Cards Trail (Active ONLY in Hero, Max 3, Smaller, No Radius, No Labels) */}
        <div className="photo-trail-container" aria-hidden="true">
          {activeCards.map((card) => (
            <div
              key={card.id}
              className={`floating-photo-card no-radius ${card.fading ? 'is-fading' : ''}`}
              style={{
                left: `${card.x}px`,
                top: `${card.y}px`,
                transform: `translate(-50%, -50%) rotate(${card.rotation}deg)`,
                zIndex: card.zIndex,
              }}
            >
              <div className="card-media-wrapper no-radius">
                <img src={card.url} alt="" loading="eager" />
              </div>
            </div>
          ))}
        </div>

        {/* Custom Minimalist Cursor Follower */}
        {cursorPos.visible && (
          <div
            className="hero-cursor-dot"
            style={{
              left: `${cursorPos.x}px`,
              top: `${cursorPos.y}px`,
            }}
          />
        )}

        {/* Center Hero Typography (Center Aligned: DJS CodeStars) */}
        <div className="hero-center-content hero-center-aligned">
          <h1 className="hero-giant-heading text-center">
            <span className="hero-word hero-word-djs uppercase-djs">DJS</span>
            <span className="hero-word hero-word-codestars">CodeStars</span>
          </h1>
        </div>

        {/* Hero Bottom Bar (Centered Tagline) */}
        <div className="hero-bottom-bar-clean">
          <p className="hero-tagline">
            COMMUNITY OF BUILDERS & COMPETITIVE PROGRAMMERS, TELLING STORIES THROUGH CODE.
          </p>
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <main>
        {/* ================= LATEST ANNOUNCEMENTS SECTION (Right after Hero) ================= */}
        <section id="announcements" className="content-section announcements-section">
          <div className="section-container">
            <div className="section-header">
              <span className="section-eyebrow">Stay updated with the latest news, events, and achievements from DJS CodeStars</span>
              <h2 className="section-title">Latest Announcements</h2>
            </div>

            <div className="announcements-list">
              {announcementsData.map((ann) => {
                const isExpanded = !!expandedAnnouncements[ann.id];
                const isUpdate = ann.type === 'UPDATE';

                return (
                  <div key={ann.id} className="announcement-card">
                    {/* Left Square Date Box */}
                    <div className="announcement-date-box">
                      <span className="date-month">{ann.date.month}</span>
                      <span className="date-day">{ann.date.day}</span>
                    </div>

                    {/* Main Content Area */}
                    <div className="announcement-body">
                      <div className="announcement-header-row">
                        <h3 className="announcement-heading">{ann.title}</h3>
                        {/* Corner Status Badge (UPDATE = Yellow, EVENT = Blue) */}
                        <span
                          className={`announcement-type-badge ${
                            isUpdate ? 'badge-update-yellow' : 'badge-event-blue'
                          }`}
                        >
                          {ann.type}
                        </span>
                      </div>

                      <p className="announcement-preview">{ann.shortDesc}</p>

                      {/* Expandable Content when Read More is Clicked */}
                      {isExpanded && (
                        <div className="announcement-expanded-content">
                          <p className="announcement-full-desc">{ann.fullDesc}</p>
                          {ann.linkText && (
                            <a
                              href={ann.linkUrl}
                              className="announcement-action-btn"
                              target={ann.linkUrl.startsWith('http') ? '_blank' : undefined}
                              rel={ann.linkUrl.startsWith('http') ? 'noopener noreferrer' : undefined}
                              onClick={(e) => {
                                if (ann.linkUrl.startsWith('#')) {
                                  e.preventDefault();
                                  scrollTo(ann.linkUrl.substring(1));
                                }
                              }}
                            >
                              {ann.linkText} →
                            </a>
                          )}
                        </div>
                      )}

                      {/* Read More / Read Less Toggle Button */}
                      <button
                        type="button"
                        className="read-more-btn"
                        onClick={() => toggleAnnouncement(ann.id)}
                      >
                        <span>{isExpanded ? 'Read less' : 'Read more'}</span>
                        <svg
                          className={`read-more-icon ${isExpanded ? 'rotate-180' : ''}`}
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* GALLERY SECTION (INTERACTIVE SCATTERED CANVAS) */}
        <section id="gallery" className="content-section gallery-section">
          <div className="section-container">
            <ScatteredGallery />
          </div>
        </section>
      </main>

      {/* ================= FOOTER (Kept where it is) ================= */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
