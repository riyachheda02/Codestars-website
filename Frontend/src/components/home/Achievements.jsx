import React from 'react';
import { achievementsData } from '../../data/home';

export default function Achievements() {
  return (
    <section id="achievements" className="home-section achievements-section" aria-label="Achievements">
      <div className="section-container">
        <div className="section-head-display">
          <h2 className="section-display-title">AWARDS</h2>
          <div className="section-title-underline" aria-hidden="true" />
        </div>

        {/* Row of tall tinted-glass cards matching reference awards */}
        <div className="awards-cards-row">
          {achievementsData.items.map((item, idx) => {
            return (
              <div
                key={item.id}
                className="award-tall-card"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="award-card-glow" aria-hidden="true" />
                <div className="award-card-inner">
                  {/* Large display-serif year at top */}
                  <span className="award-year-serif">{item.year}</span>

                  {/* Bold title */}
                  <h3 className="award-card-title">{item.title}</h3>

                  {/* Thin divider */}
                  <div className="award-card-divider" aria-hidden="true" />

                  {/* Short description */}
                  <p className="award-card-desc">{item.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
