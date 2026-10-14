import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { User } from 'lucide-react';

import { TEAM_YEARS, teamDataByYear } from '../constant/teamData';
import Footer from '../components/Footer';
import './Team.css';

/* ─── LinkedIn SVG Icon ─── */
const LinkedinIcon = ({ size = 12, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

/* ─── Member Card (Alternating Black / Yellow Poster Style) ─── */
function PosterMemberCard({ member, isOrangeTheme }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`poster-member-card ${isOrangeTheme ? 'card-yellow' : 'card-dark'}`}>
      {/* Large Circular Studio Cutout */}
      <div className="poster-avatar-frame">
        <div className="poster-avatar-backdrop">
          {member.photo ? (
            <img src={member.photo} alt={member.name} className="poster-avatar-img" />
          ) : (
            <div className="poster-avatar-placeholder" title={member.name}>
              <span className="poster-initials">{getInitials(member.name)}</span>
              <User size={22} className="poster-user-silhouette" />
            </div>
          )}
        </div>
      </div>

      {/* Member Details */}
      <div className="poster-meta">
        <div className="poster-name-row">
          <h3 className="poster-name">{member.name}</h3>
          <a
            href={member.linkedin || 'https://www.linkedin.com/company/djs-codestars/'}
            target="_blank"
            rel="noreferrer"
            className="poster-linkedin-link"
            title={`${member.name} on LinkedIn`}
            aria-label={`${member.name} LinkedIn`}
          >
            <LinkedinIcon size={12} />
          </a>
        </div>

        {/* Small Underline Bar under Name (from reference photo) */}
        <div className="poster-underline" />

        {/* Role Text */}
        <p className="poster-role">{member.role}</p>
      </div>
    </div>
  );
}

/* ─── Main Team Component ─── */
export default function Team({ onNavigate }) {
  const [selectedYear, setSelectedYear] = useState('2026-27');
  const sectionsRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // GSAP animation when switching batch years
  useEffect(() => {
    if (sectionsRef.current) {
      gsap.fromTo(
        sectionsRef.current.querySelectorAll('.team-tier-block'),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power3.out',
        }
      );
    }
  }, [selectedYear]);

  const currentYearData = teamDataByYear[selectedYear] || teamDataByYear['2026-27'];

  return (
    <div className="team-page-root">
      {/* ── Background Ambience (Exact same as Events page) ── */}
      <div className="team-bg-fixed">
        <div className="team-grid-layer" />
        <div className="team-scanline" />
      </div>

      {/* ── Hero Section (Center Aligned, Matching Events Page Typography & Yellow Theme) ── */}
      <section className="team-poster-hero">
        <div className="team-poster-hero-inner">
          {/* Main Title (Matching Events Page Font) */}
          <h1 className="team-poster-title">
            <span className="title-meet">Meet Our</span>{' '}
            <span className="title-team">Team</span>
          </h1>

          {/* Accent Underline Bar */}
          <div className="team-title-bar" />

          {/* Batch Selector Pills */}
          <div className="team-year-toggle-wrap">
            <div className="team-year-toggle">
              {TEAM_YEARS.map((year) => (
                <button
                  key={year}
                  type="button"
                  className={`team-year-tab ${selectedYear === year ? 'active' : ''}`}
                  onClick={() => setSelectedYear(year)}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Hierarchy Content with Alternating Cards Grid ── */}
      <main className="team-poster-main" ref={sectionsRef}>
        <div className="team-poster-container">
          {currentYearData.hierarchy.map((group, groupIdx) => {
            const isSingle = group.members.length === 1;
            const isDouble = group.members.length === 2;
            const isFour = group.members.length === 4;

            return (
              <section key={groupIdx} className="team-tier-block">
                {/* Category Header */}
                <div className="team-tier-badge-row">
                  <span className="team-tier-eyebrow">{group.category}</span>
                  <div className="team-tier-rule" />
                </div>

                {/* Alternating Posters Grid */}
                <div
                  className={`team-poster-grid ${
                    isSingle ? 'grid-single' : isDouble ? 'grid-double' : isFour ? 'grid-four' : 'grid-multi'
                  }`}
                >
                  {group.members.map((member, mIdx) => {
                    // Alternating theme pattern (0 = dark, 1 = orange, 2 = dark...)
                    const highlightedMember = ['Devanshi Babariya', 'Mustansir Kanchwala'].includes(member.name);
                    const isOrange = highlightedMember || (groupIdx + mIdx) % 2 === 1;

                    return (
                      <PosterMemberCard
                        key={mIdx}
                        member={member}
                        isOrangeTheme={isOrange}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
