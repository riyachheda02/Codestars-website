import React, { useState, useRef, useEffect } from 'react';
import ScatteredGallery from '../components/ScatteredGallery';
import Footer from '../components/Footer';
import './Home.css';

export default function Home({ onNavigate }) {
  const [expandedAnnouncements, setExpandedAnnouncements] = useState({});
  const taglineRef = useRef(null);

  // Toggle announcement expansion
  const toggleAnnouncement = (id) => {
    setExpandedAnnouncements((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let frame;
    const updateTagline = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!taglineRef.current) return;
        const fadeDistance = Math.max(1, window.innerHeight * 0.35);
        const opacity = Math.max(0, 1 - window.scrollY / fadeDistance);
        taglineRef.current.style.opacity = opacity;
        taglineRef.current.style.transform = `translateY(${(1 - opacity) * -10}px)`;
      });
    };

    updateTagline();
    window.addEventListener('scroll', updateTagline, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateTagline);
    };
  }, []);

  const announcementsData = [
    {
      id: 'ann-1',
      date: { month: 'MAR', day: '24' },
      type: 'UPDATE',
      title: 'Schedule Update: Introduction to CodeStars Rescheduled!',
      shortDesc: 'Important Update! The Introduction to CodeStars session has been rescheduled to 2nd October 2025 at 11:00 PM. Mark your calendars and don\'t miss this exciting opportunity to learn about CodeStars and the amazing roles we\'re recruiting for!',
      fullDesc: 'We apologize for any inconvenience caused by this schedule change. The new timing will allow more students to attend and learn about the exciting opportunities at CodeStars. New date: 2nd October 2025. New time: 11:00 PM. All other events remain as scheduled. We look forward to seeing you there!',
      linkUrl: '#experience',

    },
    {
      id: 'ann-2',
      date: { month: 'OCT', day: '01' },
      type: 'EVENT',
      title: 'Codestars is Recruiting!',
      shortDesc: 'Want to be a part of the most exciting Competitive Programming club on campus? This is your chance! Apply now for Co-Committee positions across Technical, Tech-Editorial, Creatives, Marketing, and Events roles.',
      fullDesc: `We're not just about code. We're building a community where logic meets creativity. From CP practice sessions to coding contests and collaborative events, Codestars does it all.

As a Co-committee member, you'll:
    - Plan events and contests
    - Connect with coding enthusiasts
    - Gain leadership experience

    We are organizing an intro session on 2nd October 2025 at 11:00 PM and a mock contest on 3rd October 2025, the perfect start to your Codestars journey.

    Available roles:
    - Technical
    - Tech-Editorial
    - Creatives
    - Marketing
    - Events

    Application deadline: 4th October 2025, 11:59 PM
    Eligibility: Open to Second Year students for Co-Comm positions. Intro session and mock contest are open to all students.
    Venue: DJ Sanghvi College of Engineering

    Event timeline:
    - Oct 2 @ 11:00 PM — Introduction to CodeStars
    - Oct 3 @ 4:00 PM - 6:00 PM — Mock Contest
    - Oct 4 @ 11:59 PM — Application Deadline
    - Oct 6 @ 9:00 AM - 3:00 PM — Co-Comm Interviews Day 1
    - Oct 7 @ 9:00 AM - 3:00 PM — Co-Comm Interviews Day 2`,
      linkText: 'Contest Page / Application Form',
      linkUrl: 'https://forms.gle/zSQRxwb3vysxrAqS8',
    },
    {
      id: 'ann-3',
      date: { month: 'OCT', day: '03' },
      type: 'EVENT',
      title: 'Mock Contest - Exclusively for 2nd Years!',
      shortDesc: "Greetings, 2nd Years! Welcome to Codestars! We're excited to announce a Mock Contest exclusively for you. Test and sharpen your Competitive Programming skills. New to CP? Don't worry—we've got you covered! You can learn while you compete.",
      fullDesc: `Exciting problems to test and sharpen your Competitive Programming skills.
    New to CP? Don't worry, we've got you covered. You can learn while you compete.
    Come join us, challenge yourself, and kickstart your CP journey with Codestars.

    Eligibility: Exclusively for Second Year students
    Venue: IT Department, DJ Sanghvi College of Engineering

    Event timeline:
    - Oct 3 @ 4:00 PM — Contest begins (2 hours to solve programming problems)
    - Oct 3 @ 6:00 PM — Contest ends (results announced)`,
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
        className="hero-section"
      >
        {/* The visible title is the scroll-driven element in the navbar. */}
        <h1 className="sr-only">DJS CodeStars</h1>

        {/* Preserves the original hero composition while the visible title is fixed. */}
        <div className="hero-title-spacer" aria-hidden="true" />

        {/* Hero Bottom Bar (Centered Tagline) */}
        <div className="hero-bottom-bar-clean">
          <p className="hero-tagline" ref={taglineRef}>
            The official competitive programming committee of DJSCE, organizing ICPC-style contests and workshops to foster coding culture and excellence.
          </p>
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <main>
        {/* ================= LATEST ANNOUNCEMENTS SECTION (Right after Hero) ================= */}
        <section id="announcements" className="content-section announcements-section">
          <div className="section-container">
            <div className="section-header">
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
                          className={`announcement-type-badge ${isUpdate ? 'badge-update-yellow' : 'badge-event-blue'
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
