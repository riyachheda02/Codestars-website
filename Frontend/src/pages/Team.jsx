import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X } from 'lucide-react';

import { TEAM_YEARS, teamDataByYear } from '../constant/teamData';
import Footer from '../components/Footer';
import './Team.css';

gsap.registerPlugin(ScrollTrigger);

const photoSets = {
  '2026-27': import.meta.glob('../assets/core 26-27/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default',
  }),
  '2025-26': import.meta.glob('../assets/core25-26_2/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default',
  }),
  '2024-25': import.meta.glob('../assets/core24-25/*.{jpg,jpeg,png,webp}', {
    eager: true,
    import: 'default',
  }),
};

const legacyPhotoGroups = {
  '2025-26': [
    { category: 'Chairperson', prefix: 'cp', role: 'Chairperson' },
    { category: 'Vice Chairperson', prefix: 'vcp', role: 'Vice Chairperson' },
    { category: 'Tech Heads', prefix: 'tech', role: 'Tech Head' },
    { category: 'Tech-Editorial Heads', prefix: 'edi', role: 'Tech-Editorial Head' },
    { category: 'Creatives Heads', prefix: 'creatives', role: 'Creatives Head' },
    { category: 'Marketing Heads', prefix: 'marketing', role: 'Marketing Head' },
    { category: 'Events Heads', prefix: 'events', role: 'Events Head' },
    { category: 'Publicity Heads', prefix: 'publicity', role: 'Publicity Head' },
    { category: 'Mentors', prefix: 'mentor', role: 'Mentor' },
  ],
  '2024-25': [
    { category: 'Mentors', prefix: 'mentor', role: 'Mentor' },
    { category: 'Chairperson', prefix: 'chairperson', role: 'Chairperson' },
    { category: 'Vice Chairperson', prefix: 'vcp', role: 'Vice Chairperson' },
    { category: 'Tech Heads', prefix: 'tech', role: 'Tech Head' },
    { category: 'Editorial Heads', prefix: 'editorial', role: 'Editorial Head' },
    { category: 'Creatives Heads', prefix: 'creative', role: 'Creatives Head' },
    { category: 'Marketing Heads', prefix: 'marketing', role: 'Marketing Head' },
    { category: 'Events Heads', prefix: 'events', role: 'Events Head' },
    { category: 'Publicity Heads', prefix: 'publicity', role: 'Publicity Head' },
  ],
};

const linkedinUrl = 'https://www.linkedin.com/company/djs-codestars/';

function orderedPhotoEntries(photoSet, prefix) {
  return Object.entries(photoSet)
    .filter(([path]) => path.split('/').at(-1).toLowerCase().startsWith(prefix))
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, undefined, { numeric: true }));
}

function namedPhoto(member, photoSet) {
  const aliases = { 'devanshi babariya': 'devanshi bapariya' };
  const target = (aliases[member.name.toLowerCase()] || member.name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
  const match = Object.entries(photoSet).find(([path]) =>
    path
      .split('/')
      .at(-1)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .includes(target)
  );
  return match?.[1];
}

function buildYearGroups(year, sourceGroups) {
  const photoSet = photoSets[year];

  if (year === '2026-27') {
    return sourceGroups.map((group) => ({
      ...group,
      members: group.members.map((member) => ({ ...member, photo: namedPhoto(member, photoSet) })),
    }));
  }

  return legacyPhotoGroups[year].map((spec) => {
    const sourceGroup = sourceGroups.find((group) => group.category === spec.category);
    const photos = orderedPhotoEntries(photoSet, spec.prefix);
    const members = photos.map(([, photo], index) => {
      const sourceMember = sourceGroup?.members[index];
      return {
        name: sourceMember?.name || `${spec.role} ${String(index + 1).padStart(2, '0')}`,
        role: sourceMember?.role || spec.role,
        linkedin: sourceMember?.linkedin || linkedinUrl,
        photo,
      };
    });

    return {
      ...(sourceGroup || { category: spec.category, department: spec.prefix }),
      members,
    };
  }).filter((group) => group.members.length > 0);
}

function initials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function SocialLinks({ member }) {
  return (
    <div className="team-card-socials">
      <a
        href={member.linkedin && member.linkedin !== '#' ? member.linkedin : linkedinUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={`${member.name} LinkedIn`}
        title={`${member.name} on LinkedIn`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M19 0H5C2.24 0 0 2.24 0 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5V5c0-2.76-2.24-5-5-5ZM7 19H4V9h3v10ZM5.5 7.7a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5ZM20 19h-3v-5.6c0-3.37-4-3.12-4 0V19h-3V9h3v1.76c1.4-2.58 7-2.78 7 2.48V19Z" />
        </svg>
      </a>
    </div>
  );
}

function MemberPoster({ member, index, count, onOpen, onExpand }) {
  const centerOffset = index - (count - 1) / 2;

  return (
    <article
      className="team-member-poster"
      style={{
        '--card-index': index,
        '--stack-x': `${centerOffset * 10}px`,
        '--stack-rotation': `${centerOffset * 1.4}deg`,
      }}
      onMouseEnter={onExpand}
      onFocus={onExpand}
    >
      <SocialLinks member={member} />
      <button
        className="team-poster-open"
        type="button"
        aria-label={`View ${member.name}'s profile`}
        onClick={() => onOpen(member)}
      >
        {member.photo ? (
          <img className="team-poster-photo" src={member.photo} alt={member.name} loading="lazy" />
        ) : (
          <span className="team-poster-fallback" aria-hidden="true">{initials(member.name)}</span>
        )}
        <span className="team-poster-shade" />
        <span className="team-poster-heading">
          <strong>{member.name}</strong>
          <span>{member.role}</span>
        </span>
      </button>
    </article>
  );
}

/* ─── Main Team Component ─── */
export default function Team({ onNavigate }) {
  const [selectedYear, setSelectedYear] = useState('2026-27');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [selectedMember, setSelectedMember] = useState(null);
  const rootRef = useRef(null);
  const sectionsRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const ctx = gsap.context(() => {
      gsap.to('.team-grid-layer', {
        backgroundPositionY: '30%',
        ease: 'none',
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
      });

      gsap.to('.team-orb-1', {
        scale: 1.15,
        opacity: 0.16,
        duration: 4,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      });
      gsap.to('.team-orb-2', {
        scale: 1.2,
        opacity: 0.1,
        duration: 5,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        delay: 1,
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!sectionsRef.current) return undefined;

    const blocks = gsap.utils.toArray('.team-tier-block', sectionsRef.current);
    const animations = blocks.map((block) => gsap.fromTo(
      block,
      { opacity: 0, y: 26 },
      {
        opacity: 1,
        y: 0,
        duration: 0.65,
        ease: 'power3.out',
        scrollTrigger: { trigger: block, start: 'top 86%', once: true },
      }
    ));

    return () => animations.forEach((animation) => animation.scrollTrigger?.kill());
  }, [selectedYear]);

  const currentYearData = teamDataByYear[selectedYear] || teamDataByYear['2026-27'];
  const currentGroups = buildYearGroups(selectedYear, currentYearData.hierarchy);
  const selectedYearIndex = TEAM_YEARS.indexOf(selectedYear);

  const selectYear = (year) => {
    setSelectedYear(year);
    setExpandedGroups({});
    setSelectedMember(null);
  };

  const expandGroup = (groupIndex) => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    setExpandedGroups((current) => {
      if (current[groupIndex]) return current;
      return { ...current, [groupIndex]: true };
    });
  };

  const collapseGroup = (groupIndex) => {
    setExpandedGroups((current) => {
      if (!current[groupIndex]) return current;
      return { ...current, [groupIndex]: false };
    });
  };

  useEffect(() => {
    if (!selectedMember) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setSelectedMember(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedMember]);

  return (
    <div className="team-page-root" ref={rootRef}>
      <div className="team-bg-fixed">
        <div className="team-grid-layer" />
        <div className="team-orb team-orb-1" />
        <div className="team-orb team-orb-2" />
        <div className="team-scanline" />
      </div>

      <section className="team-poster-hero">
        <div className="team-poster-hero-inner">
          <h1 className="team-poster-title">
            <span className="title-meet">Meet Our</span>{' '}
            <span className="title-team">Team</span>
          </h1>
          <div className="team-title-bar" />
          <p className="team-poster-subtitle">
            {currentYearData.tagline} — {currentYearData.subtitle}
          </p>
          <div className={`team-year-orbit active-${selectedYearIndex}`} aria-label="Select team year">
            <div className="team-year-arc" />
            {TEAM_YEARS.map((year, index) => {
              const offset = (index - selectedYearIndex + TEAM_YEARS.length) % TEAM_YEARS.length;
              const slot = offset === 0 ? 'center' : offset === 1 ? 'right' : 'left';
              return (
                <button
                  key={year}
                  type="button"
                  className={`team-year-point ${selectedYear === year ? 'active' : ''}`}
                  data-slot={slot}
                  aria-pressed={selectedYear === year}
                  onClick={() => selectYear(year)}
                >
                  {year.slice(2, 4)}–{year.slice(5, 7)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <main className="team-poster-main" ref={sectionsRef}>
        <div className="team-poster-container">
          {currentGroups.map((group, groupIdx) => {
            const isExpanded = expandedGroups[groupIdx];
            return (
              <section
                key={`${selectedYear}-${group.category}`}
                className={`team-tier-block ${isExpanded ? 'is-expanded' : ''}`}
              >
                <div className="team-tier-badge-row">
                  <h2 className="team-tier-eyebrow">{group.category}</h2>
                  <div className="team-tier-rule" />
                </div>
                <div
                  className="team-card-stack"
                  aria-label={`${group.category} lineup`}
                  onMouseLeave={() => collapseGroup(groupIdx)}
                >
                  {group.members.map((member, memberIndex) => (
                    <MemberPoster
                      key={`${member.name}-${memberIndex}`}
                      member={member}
                      index={memberIndex}
                      count={group.members.length}
                      onOpen={setSelectedMember}
                      onExpand={() => expandGroup(groupIdx)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {selectedMember && (
        <div className="team-detail-backdrop" onClick={() => setSelectedMember(null)}>
          <section
            className="team-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-detail-name"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="team-detail-close"
              type="button"
              aria-label="Close profile"
              onClick={() => setSelectedMember(null)}
            >
              <X size={20} />
            </button>
            {selectedMember.photo ? (
              <img src={selectedMember.photo} alt={selectedMember.name} />
            ) : (
              <div className="team-detail-fallback">{initials(selectedMember.name)}</div>
            )}
            <div className="team-detail-copy">
              <span>{selectedMember.role}</span>
              <h2 id="team-detail-name">{selectedMember.name}</h2>
              <SocialLinks member={selectedMember} />
            </div>
          </section>
        </div>
      )}

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
