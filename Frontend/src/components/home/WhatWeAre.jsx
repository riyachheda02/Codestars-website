import React from 'react';
import { Trophy, GraduationCap, Users } from 'lucide-react';
import { whatWeAreData } from '../../data/home';

const iconMap = {
  Trophy: Trophy,
  GraduationCap: GraduationCap,
  Users: Users,
};

const pillarIndices = ['01', '02', '03'];

export default function WhatWeAre() {
  return (
    <section id="what-we-are" className="home-section what-we-are-section" aria-label="What we are">
      <div className="section-container">
        <div className="section-head-display">
          <h2 className="section-display-title">WHAT WE ARE</h2>
          <div className="section-title-underline" aria-hidden="true" />
          <p className="section-subtitle-serif">
            {whatWeAreData.heading}
          </p>
        </div>

        <div className="pillars-grid">
          {whatWeAreData.pillars.map((pillar, idx) => {
            const IconComponent = iconMap[pillar.icon] || Trophy;
            return (
              <div
                key={pillar.id}
                className="pillar-glass-card"
                style={{ animationDelay: `${idx * 120}ms` }}
              >
                <div className="pillar-glass-glow" aria-hidden="true" />
                <div className="pillar-card-content">
                  <div className="pillar-card-top-row">
                    <div className="pillar-icon-wrap">
                      <IconComponent size={28} className="pillar-icon" />
                    </div>
                    <span className="pillar-mono-idx">{pillarIndices[idx] || `0${idx + 1}`}</span>
                  </div>
                  <h3 className="pillar-card-title">{pillar.title}</h3>
                  <div className="pillar-title-underline" aria-hidden="true" />
                  <p className="pillar-card-desc">{pillar.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

