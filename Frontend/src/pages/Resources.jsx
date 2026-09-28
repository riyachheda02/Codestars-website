import React, { useState, useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ArrowRight, Search, ExternalLink, Code2, Cpu, Globe,
  BookOpen, Database, BrainCircuit, Layers, Terminal,
  SlidersHorizontal, Smartphone, GraduationCap, ChevronRight,
} from 'lucide-react';
import codestarsLogo from '../assets/djs_codestarsLogo.jpeg';
import Footer from '../components/Footer';
import './Resources.css';

gsap.registerPlugin(ScrollTrigger);

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'Competitive Programming', label: 'Competitive Programming', icon: Terminal },
  { id: 'Web Development', label: 'Web Development', icon: Globe },
  { id: 'Machine Learning', label: 'Machine Learning', icon: BrainCircuit },
  { id: 'Computer Science', label: 'Computer Science', icon: GraduationCap },
  { id: 'Database', label: 'Database', icon: Database },
  { id: 'Mobile Development', label: 'Mobile Development', icon: Smartphone },
];

const RESOURCES = [
  {
    id: '1',
    title: 'LeetCode',
    description: 'Master coding interviews with thousands of programming challenges and solutions.',
    url: 'https://leetcode.com',
    category: 'Competitive Programming',
    tags: ['algorithms', 'data-structures', 'interview-prep'],
  },
  {
    id: '2',
    title: 'freeCodeCamp',
    description: 'Learn to code for free with interactive lessons and projects.',
    url: 'https://freecodecamp.org',
    category: 'Web Development',
    tags: ['html', 'css', 'javascript', 'react'],
  },
  {
    id: '3',
    title: 'Fast.ai',
    description: 'Practical deep learning for coders with cutting-edge techniques.',
    url: 'https://fast.ai',
    category: 'Machine Learning',
    tags: ['deep-learning', 'pytorch', 'ai'],
  },
  {
    id: '4',
    title: 'Codeforces',
    description: 'Competitive programming contests and practice problems.',
    url: 'https://codeforces.com',
    category: 'Competitive Programming',
    tags: ['contests', 'algorithms', 'competitive'],
  },
  {
    id: '5',
    title: 'MDN Web Docs',
    description: 'Comprehensive web development documentation and tutorials.',
    url: 'https://developer.mozilla.org',
    category: 'Web Development',
    tags: ['html', 'css', 'javascript', 'web-apis'],
  },
  {
    id: '6',
    title: 'Kaggle Learn',
    description: 'Free micro-courses in data science and machine learning.',
    url: 'https://kaggle.com/learn',
    category: 'Machine Learning',
    tags: ['data-science', 'python', 'ml', 'competitions'],
  },
  {
    id: '7',
    title: 'The Odin Project',
    description: 'Full-stack web development curriculum with projects.',
    url: 'https://theodinproject.com',
    category: 'Web Development',
    tags: ['full-stack', 'javascript', 'ruby', 'projects'],
  },
  {
    id: '8',
    title: 'CS50x',
    description: "Harvard's introduction to computer science and programming.",
    url: 'https://cs50.harvard.edu/x',
    category: 'Computer Science',
    tags: ['fundamentals', 'algorithms', 'programming'],
  },
  {
    id: '9',
    title: 'Coursera ML Course',
    description: "Andrew Ng's famous machine learning course.",
    url: 'https://coursera.org/learn/machine-learning',
    category: 'Machine Learning',
    tags: ['fundamentals', 'supervised-learning', 'neural-networks'],
  },
  {
    id: '10',
    title: 'HackerRank',
    description: 'Code challenges and skill assessments for developers.',
    url: 'https://hackerrank.com',
    category: 'Competitive Programming',
    tags: ['coding-challenges', 'skill-assessment', 'certification'],
  },
  {
    id: '11',
    title: 'React Documentation',
    description: 'Official React.js documentation and learning resources.',
    url: 'https://react.dev',
    category: 'Web Development',
    tags: ['react', 'javascript', 'frontend', 'components'],
  },
  {
    id: '12',
    title: 'TensorFlow Educational',
    description: 'Learn machine learning with TensorFlow tutorials and guides.',
    url: 'https://tensorflow.org/learn',
    category: 'Machine Learning',
    tags: ['tensorflow', 'deep-learning', 'neural-networks'],
  },
  {
    id: '13',
    title: 'CSS-Tricks',
    description: 'Tips, tricks, and techniques on using CSS for web development.',
    url: 'https://css-tricks.com',
    category: 'Web Development',
    tags: ['css', 'frontend', 'design', 'responsive'],
  },
  {
    id: '14',
    title: 'SQLBolt',
    description: 'Interactive SQL tutorial for beginners and advanced users.',
    url: 'https://sqlbolt.com',
    category: 'Database',
    tags: ['sql', 'database', 'queries', 'interactive'],
  },
  {
    id: '15',
    title: 'Flutter Documentation',
    description: 'Learn mobile app development with Flutter framework.',
    url: 'https://flutter.dev/docs',
    category: 'Mobile Development',
    tags: ['flutter', 'dart', 'mobile', 'cross-platform'],
  },
];

const getScreenshotUrl = (url) => {
  const params = new URLSearchParams({
    url,
    screenshot: 'true',
    meta: 'false',
    embed: 'screenshot.url',
    colorScheme: 'dark',
    'viewport.isMobile': 'false',
    'viewport.deviceScaleFactor': '1',
    'viewport.width': '1200',
    'viewport.height': '630',
  });
  return `https://api.microlink.io/?${params.toString()}`;
};

function ResourceCard({ resource, index }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef(null);

  const screenshotUrl = useMemo(() => getScreenshotUrl(resource.url), [resource.url]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: (index % 6) * 0.05,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 92%', toggleActions: 'play none none none' },
      }
    );
  }, [index]);

  const handleCardClick = () => {
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const domain = useMemo(() => {
    try {
      return new URL(resource.url).hostname.replace(/^www\./, '');
    } catch {
      return resource.url;
    }
  }, [resource.url]);

  return (
    <article
      ref={cardRef}
      className="res-card"
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleCardClick();
      }}
    >
      {/* Website Preview Image Banner */}
      <div className="res-card-image-wrap">
        {!imageError ? (
          <img
            src={screenshotUrl}
            alt={`${resource.title} preview`}
            loading="lazy"
            className={`res-card-img ${imageLoaded ? 'loaded' : ''} ${isHovered ? 'zoomed' : ''}`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="res-card-fallback-banner">
            <div className="res-fallback-icon-wrap">
              <Globe size={26} strokeWidth={1.8} />
            </div>
            <span className="res-fallback-title">{resource.title}</span>
            <span className="res-fallback-domain">{domain}</span>
          </div>
        )}

        {/* Loading spinner */}
        {!imageLoaded && !imageError && (
          <div className="res-img-loader">
            <div className="res-img-spinner" />
          </div>
        )}

        {/* Hover overlay gradient */}
        <div className={`res-img-overlay ${isHovered ? 'active' : ''}`} />

        {/* Hover external link button in corner */}
        <div className={`res-hover-badge ${isHovered ? 'visible' : ''}`} title="Open website">
          <ExternalLink size={13} strokeWidth={2.5} />
        </div>

        {/* Floating Category pill over preview on hover */}
        <div className={`res-hover-category ${isHovered ? 'visible' : ''}`}>
          {resource.category}
        </div>
      </div>

      {/* Card Content */}
      <div className="res-card-body">
        <div className="res-card-header">
          <h3 className="res-card-name">{resource.title}</h3>
        </div>

        <p className="res-card-desc">{resource.description}</p>

        {/* Tags with # prefix */}
        <div className="res-card-tags">
          {resource.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="res-tag">
              #{tag}
            </span>
          ))}
        </div>

        {/* Card Footer with category badge and Visit link */}
        <div className="res-card-footer">
          <span className="res-cat-badge">{resource.category}</span>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="res-visit-btn"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Visit</span>
            <ExternalLink size={12} strokeWidth={2.5} className="res-visit-icon" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function Resources({ onNavigate }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef(null);
  const heroTitleRef = useRef(null);
  const controlsRef = useRef(null);

  const handleNavClick = (e, target) => {
    e.preventDefault();
    if (onNavigate) onNavigate(target);
    else window.location.hash = target === 'events' ? '#events' : target === 'team' ? '#team' : target === 'resources' ? '#resources' : '#';
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const ctx = gsap.context(() => {
      gsap.to('.res-grid-layer', { backgroundPositionY: '30%', ease: 'none', scrollTrigger: { trigger: rootRef.current, start: 'top top', end: 'bottom bottom', scrub: 1 } });
      gsap.to('.res-orb-1', { scale: 1.15, opacity: 0.18, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });
      gsap.to('.res-orb-2', { scale: 1.2, opacity: 0.12, duration: 5, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.2 });
      if (heroTitleRef.current) {
        const chars = heroTitleRef.current.querySelectorAll('.res-char');
        gsap.fromTo(chars, { opacity: 0, y: 55, rotateX: -40 }, { opacity: 1, y: 0, rotateX: 0, duration: 0.65, stagger: 0.04, ease: 'power4.out', delay: 0.2 });
      }
      if (controlsRef.current) {
        gsap.fromTo(controlsRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, delay: 0.7, ease: 'power3.out' });
      }
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return RESOURCES.filter((r) => {
      const catOk = activeCategory === 'all' || r.category === activeCategory;
      const srchOk =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));
      return catOk && srchOk;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="res-root" ref={rootRef}>
      <div className="res-bg-fixed">
        <div className="res-grid-layer" />
        <div className="res-orb res-orb-1" />
        <div className="res-orb res-orb-2" />
        <div className="res-scanline" />
      </div>

      <section className="res-hero">
        <div className="res-hero-inner">
          <span className="res-eyebrow-pill"><BookOpen size={11} strokeWidth={2.5} /> CURATED FOR CODESTARS</span>
          <h1 className="res-hero-title" ref={heroTitleRef} aria-label="Learning Resources">
            Learning Resources
          </h1>
          <p className="res-hero-sub">
            Discover free, high-quality resources to accelerate your learning journey
          </p>
        </div>
        <div className="res-ticker-wrap" aria-hidden="true">
          <div className="res-ticker-track">
            <span>{'LEETCODE . FREECODECAMP . FAST.AI . CODEFORCES . MDN WEB DOCS . KAGGLE . ODIN PROJECT . CS50 . REACT . TENSORFLOW . CSS-TRICKS . SQLBOLT . FLUTTER . '.repeat(6)}</span>
          </div>
        </div>
      </section>

      <section className="res-controls-section" ref={controlsRef} style={{ opacity: 0 }}>
        <div className="res-controls-inner">
          <div className="res-search-wrap">
            <Search size={16} className="res-search-icon" strokeWidth={2} />
            <input
              type="text"
              className="res-search-input"
              placeholder="Search resources, technologies, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search resources"
            />
            {searchQuery && (
              <button className="res-search-clear" onClick={() => setSearchQuery('')} aria-label="Clear">
                ×
              </button>
            )}
          </div>
          <div className="res-category-wrap" role="tablist" aria-label="Resource categories">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  className={`res-cat-pill${activeCategory === cat.id ? ' active' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                >
                  <Icon size={12} strokeWidth={2.2} />
                  {cat.label}
                </button>
              );
            })}
          </div>
          <div className="res-count-bar">
            <SlidersHorizontal size={13} strokeWidth={2.2} />
            <span><strong>{filtered.length}</strong> resource{filtered.length !== 1 ? 's' : ''} found</span>
          </div>
        </div>
      </section>

      <main className="res-main">
        <div className="res-grid-container">
          {filtered.length === 0 ? (
            <div className="res-empty">
              <Search size={30} strokeWidth={1.5} />
              <p>No resources found. Try a different search or category.</p>
              <button className="res-reset-btn" onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}>Reset Filters</button>
            </div>
          ) : (
            <div className="res-cards-grid">
              {filtered.map((r, i) => <ResourceCard key={r.id} resource={r} index={i} />)}
            </div>
          )}
        </div>
      </main>

      <section className="res-cta-section">
        <div className="res-cta-inner">
          <span className="res-cta-eyebrow">SUGGEST A RESOURCE</span>
          <h2 className="res-cta-title">Missing something useful?</h2>
          <p className="res-cta-sub">Found a great resource not listed here? Let us know and we will add it for the community.</p>
          <a href="mailto:djscodestars@djsce.ac.in" className="res-cta-btn">Suggest a Resource <ChevronRight size={15} strokeWidth={2.5} /></a>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
}