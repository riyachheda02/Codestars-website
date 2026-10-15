import React, { useEffect } from 'react';
import ScatteredGallery from '../components/ScatteredGallery';
import Footer from '../components/Footer';

export default function Gallery({ onNavigate }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="gallery-page-root" style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: '90px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            letterSpacing: '0.18em',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            display: 'inline-block',
            marginBottom: '8px'
          }}>
            MOMENTS & MEMORIES
          </span>
          <h1 style={{
            fontSize: 'clamp(36px, 5.2vw, 64px)',
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.02em'
          }}>
            Interactive Photo Gallery
          </h1>
          <div className="page-title-underline" aria-hidden="true" />
          <p style={{
            color: 'var(--muted)',
            fontSize: '15px',
            maxWidth: '560px',
            margin: '12px auto 0'
          }}>
            Explore our journey, contests, hackathons, and celebrations. Drag the canvas to pan around and click any photo for high resolution view.
          </p>
        </div>

        <div style={{
          background: 'rgba(20, 20, 20, 0.6)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)'
        }}>
          <ScatteredGallery />
        </div>
      </div>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}
