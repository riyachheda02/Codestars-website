import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import EventsHeader from '../components/events/EventsHeader';
import EventsFilterBar from '../components/events/EventsFilterBar';
import NextUpSpotlight from '../components/events/NextUpSpotlight';
import EventsTimeline from '../components/events/EventsTimeline';
import EventDetail from '../components/events/EventDetail';
import Footer from '../components/Footer';
import { eventsData, getStatus, sortEventsDescending } from '../data/events';
import { getNextEvent } from '../utils/eventState';
import './Events.css';

/**
 * Parse filter params from window.location.hash
 * e.g. #events?status=upcoming&year=2025
 * or #events/code-uncode-2025
 */
function parseEventsRoute() {
  const hash = window.location.hash || '';
  // Check query string in hash: #events...?...
  const qIndex = hash.indexOf('?');
  const filters = { status: 'all', year: 'all' };

  if (qIndex !== -1) {
    const searchParams = new URLSearchParams(hash.slice(qIndex + 1));
    const statusParam = searchParams.get('status');
    const yearParam = searchParams.get('year');

    if (statusParam && ['all', 'upcoming', 'past'].includes(statusParam.toLowerCase())) {
      filters.status = statusParam.toLowerCase();
    }
    if (yearParam) {
      filters.year = yearParam.trim();
    }
  }

  // Check if detail route: #events/slug
  const baseHash = qIndex !== -1 ? hash.slice(0, qIndex) : hash;
  const detailMatch = baseHash.match(/^#events\/([a-zA-Z0-9_-]+)/i);
  if (detailMatch) {
    return {
      view: 'detail',
      slug: detailMatch[1],
      filters,
    };
  }

  return { view: 'list', slug: null, filters };
}

/**
 * Serialize filter state into URL hash
 */
function serializeFiltersToHash(filters) {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }
  if (filters.year && filters.year !== 'all') {
    params.set('year', filters.year);
  }

  const queryStr = params.toString();
  return queryStr ? `#events?${queryStr}` : '#events';
}

export default function Events({ onNavigate }) {
  const [routeInfo, setRouteInfo] = useState(parseEventsRoute);
  const [statusFilter, setStatusFilter] = useState(() => routeInfo.filters.status);
  const [selectedYear, setSelectedYear] = useState(() => routeInfo.filters.year);

  // Preserve scroll position when entering detail page and restoring upon back
  const savedScrollPositionRef = useRef(0);

  // Listen to hash changes for deep links / back navigation
  useEffect(() => {
    const handleHashChange = () => {
      const parsed = parseEventsRoute();
      setRouteInfo(parsed);
      if (parsed.view === 'list') {
        setStatusFilter(parsed.filters.status);
        setSelectedYear(parsed.filters.year);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sync state changes to URL hash (when in list view)
  const updateUrlFilters = useCallback((nextStatus, nextYr) => {
    const newHash = serializeFiltersToHash({
      status: nextStatus,
      year: nextYr,
    });
    if (window.location.hash !== newHash) {
      window.history.replaceState(null, '', newHash);
    }
  }, []);

  const handleStatusChange = (val) => {
    setStatusFilter(val);
    updateUrlFilters(val, selectedYear);
  };

  const handleYearChange = (yr) => {
    setSelectedYear(yr);
    updateUrlFilters(statusFilter, yr);
  };

  const handleResetFilters = () => {
    setStatusFilter('all');
    setSelectedYear('all');
    updateUrlFilters('all', 'all');
  };

  // Navigate to event detail page
  const handleExploreEvent = (slug) => {
    savedScrollPositionRef.current = window.scrollY;
    const filterQuery = serializeFiltersToHash({
      status: statusFilter,
      year: selectedYear,
    }).replace(/^#events\??/, '');
    window.location.hash = filterQuery ? `#events/${slug}?${filterQuery}` : `#events/${slug}`;
    setRouteInfo({ view: 'detail', slug, filters: { status: statusFilter, year: selectedYear } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Back to events list with state & scroll restoration
  const handleBackToList = () => {
    const restoreHash = serializeFiltersToHash({
      status: statusFilter,
      year: selectedYear,
    });
    window.location.hash = restoreHash;
    setRouteInfo({
      view: 'list',
      slug: null,
      filters: { status: statusFilter, year: selectedYear },
    });

    requestAnimationFrame(() => {
      window.scrollTo({
        top: savedScrollPositionRef.current || 0,
        behavior: 'smooth',
      });
    });
  };

  const availableYears = useMemo(() => {
    const set = new Set();
    eventsData.forEach((e) => {
      const yr = new Date(e.startDate).getFullYear().toString();
      set.add(yr);
    });
    return Array.from(set).sort((a, b) => Number(b) - Number(a));
  }, []);

  const [currentTick, setCurrentTick] = useState(() => Date.now());

  // Determine next event based on currentTick
  const nextEvent = useMemo(() => {
    return getNextEvent(eventsData, currentTick);
  }, [currentTick]);

  // Spotlight visibility check:
  // Hide when a filter is active that excludes the next event (status=past, or a year not containing it)
  // and when getNextEvent is null
  const showSpotlight = useMemo(() => {
    if (!nextEvent) return false;
    if (statusFilter === 'past') return false;
    if (selectedYear !== 'all') {
      const evYear = new Date(nextEvent.startDate).getFullYear().toString();
      if (evYear !== selectedYear) return false;
    }
    return true;
  }, [nextEvent, statusFilter, selectedYear]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    const now = new Date(currentTick);
    return sortEventsDescending(eventsData).filter((ev) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const s = getStatus(ev, now);
        if (statusFilter === 'upcoming') {
          if (s !== 'upcoming' && s !== 'live') return false;
        } else if (statusFilter === 'past') {
          if (s !== 'completed') return false;
        }
      }

      // 2. Year Filter
      if (selectedYear !== 'all') {
        const evYear = new Date(ev.startDate).getFullYear().toString();
        if (evYear !== selectedYear) return false;
      }

      return true;
    });
  }, [statusFilter, selectedYear, currentTick]);

  // If in detail route
  if (routeInfo.view === 'detail') {
    return (
      <EventDetail
        slug={routeInfo.slug}
        onBack={handleBackToList}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="events-page-root">
      {/* 1. Page Header */}
      <EventsHeader />

      {/* 2. Non-sticky Minimal Filter Bar */}
      <EventsFilterBar
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        availableYears={availableYears}
        selectedYear={selectedYear}
        onYearChange={handleYearChange}
        resultCount={filteredEvents.length}
        onResetFilters={handleResetFilters}
      />

      {/* Spotlight: "Next up" section */}
      {showSpotlight && (
        <NextUpSpotlight
          event={nextEvent}
          onNowTick={setCurrentTick}
        />
      )}

      {/* 3. The Timeline */}
      {filteredEvents.length > 0 ? (
        <EventsTimeline
          events={filteredEvents}
          onExplore={handleExploreEvent}
        />
      ) : (
        <div className="events-empty-state" role="status">
          <div className="empty-state-card">
            <h3 className="empty-state-title">No events match your filters</h3>
            <p className="empty-state-desc">
              Try adjusting your status or year filters to find what you're looking for.
            </p>
            <button
              type="button"
              className="empty-state-reset-btn"
              onClick={handleResetFilters}
            >
              Reset filters
            </button>
          </div>
        </div>
      )}

      {/* 4. Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
