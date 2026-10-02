import React from 'react';
import HeroWordmark from '../components/HeroWordmark';

/**
 * TEMPORARY Font Evaluation Page (clearly marked for removal)
 * Renders the full particle wordmark ("DJS" above "CodeStars")
 * in 4 variants stacked vertically on plain black background.
 */
const FONT_VARIANTS = [
  {
    name: 'Orbitron 900 (Current Default)',
    fontFamily: '"Orbitron", "Eurostile", sans-serif',
    description: 'Ultra-bold geometric futuristic font with angular strokes, ideal for high-density particle rasterization.',
  },
  {
    name: 'Michroma 400',
    fontFamily: '"Michroma", sans-serif',
    description: 'Modern wide techno-display typeface inspired by classic European automotive & micro-display typography.',
  },
  {
    name: 'Russo One 400',
    fontFamily: '"Russo One", sans-serif',
    description: 'Thick, bold, impact-style display lettering with solid block weight.',
  },
  {
    name: 'Black Ops One 400',
    fontFamily: '"Black Ops One", cursive',
    description: 'Heavy military-stencil styling with distinct angular cuts and high contrast.',
  },
];

export default function FontTest() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#000000',
        color: '#FFFFFF',
        padding: '60px 40px 120px',
        fontFamily: '"Inter", sans-serif',
      }}
    >
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '50px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 10px',
              borderRadius: '4px',
              background: '#F5B93A',
              color: '#000',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '0.1em',
              marginBottom: '10px',
            }}
          >
            TEMPORARY ROUTE • /font-test
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0' }}>
            Hero Wordmark Font Comparison
          </h1>
          <p style={{ color: '#888', fontSize: '15px' }}>
            Evaluating particle wordmark clarity and stroke solidity across 4 heavy display fonts on a plain black background.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>
          {FONT_VARIANTS.map((variant, index) => (
            <div
              key={index}
              style={{
                border: '1px solid rgba(245, 185, 58, 0.25)',
                borderRadius: '16px',
                padding: '36px',
                background: '#050505',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#F5B93A' }}>
                  {index + 1}. {variant.name}
                </h2>
                <span
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: '12px',
                    color: '#AAA',
                    background: '#111',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {variant.fontFamily}
                </span>
              </div>
              <p style={{ color: '#777', fontSize: '13.5px', marginBottom: '28px' }}>
                {variant.description}
              </p>

              {/* Wordmark Canvas Render */}
              <div
                style={{
                  minHeight: '160px',
                  background: '#000000',
                  borderRadius: '12px',
                  padding: '20px 24px',
                  border: '1px solid #1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <HeroWordmark previewMode={true} customFont={variant.fontFamily} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
