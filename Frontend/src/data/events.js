import codeUncodeImg from '../assets/events-optimized/code_uncode.webp';
import bountyImg from '../assets/events-optimized/bounty.webp';
import bloodBytesImg from '../assets/events-optimized/bloodbytes.webp';
import mockContestImg from '../assets/events-optimized/mock_contest.webp';
import feContestImg from '../assets/events-optimized/fe_contest.webp';
import icpcImg from '../assets/events-optimized/icpc_camp.webp';
import cfgImg from '../assets/events-optimized/coffee_googlers.webp';

/**
 * Events Data Model: Single source of truth for DJS CodeStars events.
 *
 * Each event schema:
 * - slug: unique, URL-safe string
 * - title: string
 * - category: 'flagship' | 'contest' | 'workshop' | 'mentorship' | 'talk'
 * - flagship: boolean
 * - startDate: ISO string with +05:30 offset
 * - endDate: ISO string with +05:30 offset
 * - datePrecision: 'day' | 'month' | 'year' (optional, defaults to 'day')
 * - time: string (optional)
 * - venue: string (optional)
 * - mode: 'offline' | 'online' | 'hybrid'
 * - poster: optimized image asset path
 * - posterDimensions: { width: number, height: number }
 * - shortDescription: string
 * - description: string (full description)
 * - stats: optional object { participants, institutes, prizePool, teams }
 * - registration: optional object { url, opens, closes }
 * - externalUrl: optional URL
 * - gallery: optional array of image paths
 * - missingFields: array of strings noting fields needing confirmation from the committee
 */
export const eventsData = [
  {
    slug: 'code-bounty-2026',
    title: 'Code Bounty Challenge',
    category: 'flagship',
    flagship: true,
    // NOTE: The dates, times, and venue below are placeholders that must be replaced with confirmed dates before launch. (Original site listed Code Bounty for March 2026 without confirmed times/venue).
    startDate: '2026-11-20T10:00:00+05:30',
    endDate: '2026-11-20T18:00:00+05:30',
    datePrecision: 'day',
    time: '10:00 AM - 6:00 PM',
    venue: 'DJSCE Labs, Mumbai',
    mode: 'offline',
    poster: bountyImg,
    posterDimensions: { width: 384, height: 384 },
    posterFit: 'cover',
    shortDescription:
      'A thrilling two-round coding contest testing rapid problem decomposition and algorithmic agility.',
    description:
      'A thrilling two-round coding contest testing rapid problem decomposition and algorithmic agility. Participants tackle curated problem sets designed to challenge logic, time complexity optimization, and mathematical ingenuity.',
    stats: {
      prizePool: 'TBA',
    },
    calendarEnabled: true,
    registration: {
      url: 'https://forms.gle/zSQRxwb3vysxrAqS8',
      opens: '2026-10-15T00:00:00+05:30',
      closes: '2026-11-18T23:59:59+05:30',
      opensAt: '2026-10-15T00:00:00+05:30',
      closesAt: '2026-11-18T23:59:59+05:30',
    },
    externalUrl: null,
    gallery: [],
    missingFields: ['Exact prize pool amount', 'Participant capacity', 'Team size rules'],
  },
  {
    slug: 'icpc-camp-2026',
    title: 'ICPC Advanced Camp',
    category: 'workshop',
    flagship: false,
    // NOTE: The dates, times, and venue below are placeholders that must be replaced with confirmed dates before launch. (Original site gave ICPC Camp no date, times, or venue).
    startDate: '2026-12-10T09:00:00+05:30',
    endDate: '2026-12-15T17:00:00+05:30',
    datePrecision: 'day',
    time: '9:00 AM - 5:00 PM',
    venue: 'DJSCE Campus, Mumbai',
    mode: 'offline',
    poster: icpcImg,
    posterDimensions: { width: 237, height: 177 },
    posterFit: 'contain',
    shortDescription:
      'Intensive multi-day bootcamp mentoring students on advanced trees, flows, and DP optimizations.',
    description:
      'Intensive multi-day bootcamp mentoring students on advanced trees, flows, and DP optimizations. Led by senior division competitive coders and ICPC regionalists, with daily problem sets and live contest analysis.',
    stats: null,
    registration: null,
    externalUrl: null,
    gallery: [],
    missingFields: ['Exact daily schedule', 'Eligibility criteria', 'Registration link'],
  },
  {
    slug: 'bloodbytes-2025',
    title: 'BloodBytes Halloween Showdown',
    category: 'contest',
    flagship: false,
    startDate: '2025-10-31T10:00:00+05:30',
    endDate: '2025-10-31T17:00:00+05:30',
    datePrecision: 'day',
    time: '10:00 AM - 5:00 PM',
    venue: 'IT Dept, DJSCE, Mumbai',
    mode: 'offline',
    poster: bloodBytesImg,
    posterDimensions: { width: 1600, height: 741 },
    posterFit: 'contain',
    shortDescription:
      'Electrifying night of spooky algorithmic problem-solving with lightning rounds and exciting prizes.',
    description:
      'Enter the arena where logic bleeds into creativity. BloodBytes is a Halloween-themed coding contest, a spine-chilling test of your programming instincts and problem-solving skills. Battle against time, bugs, and brain-twisters in this thrilling showdown that separates the mortals from the true code warriors.',
    stats: {
      prizePool: '₹12,000+',
      participants: 'FE, SE & TE Students',
    },
    registration: null,
    externalUrl: null,
    gallery: [],
    missingFields: ['Final participant count', 'Detailed leaderboard breakdown'],
  },
  {
    slug: 'mock-contest-2025',
    title: 'MOCK CONTEST',
    category: 'contest',
    flagship: false,
    startDate: '2025-10-03T14:00:00+05:30',
    endDate: '2025-10-03T18:00:00+05:30',
    datePrecision: 'day',
    time: '2:00 PM - 6:00 PM',
    venue: 'IT Dept, DJSCE, Mumbai',
    mode: 'offline',
    poster: mockContestImg,
    posterDimensions: { width: 384, height: 446 },
    posterFit: 'contain',
    shortDescription:
      'Sharpen competitive instincts under realistic contest conditions with live analysis.',
    description:
      'Sharpen competitive instincts under realistic contest conditions with live analysis. Exclusively tailored for 2nd year coders preparing for ICPC preliminaries and national algorithmic showdowns.',
    stats: null,
    registration: null,
    externalUrl: 'https://codeforces.com/group/g6lZJwfgjF',
    gallery: [],
    missingFields: ['Exact participant count', 'Winner list'],
  },
  {
    slug: 'coffee-with-googlers-2025',
    title: 'Coffee-with-Googlers',
    category: 'talk',
    flagship: false,
    startDate: '2025-08-20T17:00:00+05:30',
    endDate: '2025-08-20T19:00:00+05:30',
    datePrecision: 'day',
    time: '5:00 PM - 7:00 PM',
    venue: 'Online Seminar',
    mode: 'online',
    poster: cfgImg,
    posterDimensions: { width: 384, height: 288 },
    posterFit: 'cover',
    shortDescription:
      'Direct interaction with Google software engineers discussing interview mastery and ICPC benefits.',
    description:
      'Direct interaction with DJSCE alumni and Google software engineers discussing technical interview preparation, ICPC benefits, system design, and career roadmaps.',
    stats: null,
    registration: null,
    externalUrl: null,
    gallery: [],
    missingFields: ['Speaker names', 'Recording link'],
  },
  {
    slug: 'code-uncode-2025',
    title: 'Code UnCode 2025 Championship',
    category: 'flagship',
    flagship: true,
    startDate: '2025-02-15T09:00:00+05:30',
    endDate: '2025-02-15T20:00:00+05:30',
    datePrecision: 'day',
    time: '9:00 AM - 8:00 PM',
    venue: 'Mumbai',
    mode: 'hybrid',
    poster: codeUncodeImg,
    posterDimensions: { width: 1600, height: 901 },
    posterFit: 'cover',
    shortDescription:
      "Mumbai's premier ICPC-style solo coding championship uniting 2000+ participants from 500+ institutes.",
    description:
      "Mumbai's premier ICPC-style solo competitive programming championship. Experience the ultimate coding challenge with 2000+ participants from 500+ institutes across the country competing for glory and massive prize rewards.",
    stats: {
      prizePool: '₹2,00,000',
      participants: '2000+',
      institutes: '500+',
    },
    registration: null,
    externalUrl: 'https://codeuncode.djscodestars.in/',
    gallery: [],
    missingFields: ['Exact dates for future editions', 'Final problem archive'],
  },
  {
    slug: 'fe-contest-2024',
    title: 'FE Contest',
    category: 'contest',
    flagship: false,
    startDate: '2024-09-01T00:00:00+05:30',
    endDate: '2024-09-30T23:59:59+05:30',
    datePrecision: 'month',
    time: null,
    venue: 'DJSCE Campus, Mumbai',
    mode: 'offline',
    poster: feContestImg,
    posterDimensions: { width: 384, height: 213 },
    posterFit: 'cover',
    shortDescription:
      'A dedicated beginner-friendly programming arena curated to ignite logic building and CP passion.',
    description:
      'A dedicated beginner-friendly programming arena curated to ignite logic building, data structure foundations, and coding passion right from year one.',
    stats: null,
    registration: null,
    externalUrl: null,
    gallery: [],
    missingFields: ['Specific day and schedule', 'Participant count', 'Winners list'],
  },
];

/* =========================================================================
   HELPERS
   ========================================================================= */

/**
 * Returns the effective end-of-period Date object for an event based on precision.
 */
function getEffectiveEndDate(event) {
  const precision = event.datePrecision || 'day';
  const end = new Date(event.endDate || event.startDate);

  if (precision === 'year') {
    return new Date(end.getFullYear(), 11, 31, 23, 59, 59, 999);
  }
  if (precision === 'month') {
    return new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59, 999);
  }
  return end;
}

/**
 * Returns the effective start Date object for an event.
 */
function getEffectiveStartDate(event) {
  return new Date(event.startDate);
}

/**
 * Compute event status dynamically at reference time `now` (default: current time).
 * Never hardcodes status.
 * Returns 'upcoming' | 'live' | 'completed'
 */
export function getStatus(event, now = new Date()) {
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const startTime = getEffectiveStartDate(event).getTime();
  const endTime = getEffectiveEndDate(event).getTime();

  if (currentTime < startTime) {
    return 'upcoming';
  }
  if (currentTime >= startTime && currentTime <= endTime) {
    return 'live';
  }
  return 'completed';
}

/**
 * Sort events descending by start date (newest first).
 */
export function sortEventsDescending(events = eventsData) {
  return [...events].sort((a, b) => {
    const timeA = new Date(a.startDate).getTime();
    const timeB = new Date(b.startDate).getTime();
    return timeB - timeA;
  });
}

/**
 * Group events by year, sorted descending by year.
 * Returns array of objects: { year: '2026', events: [...] }
 */
export function groupByYear(events = eventsData) {
  const sorted = sortEventsDescending(events);
  const map = new Map();

  for (const ev of sorted) {
    const year = new Date(ev.startDate).getFullYear().toString();
    if (!map.has(year)) {
      map.set(year, []);
    }
    map.get(year).push(ev);
  }

  const result = [];
  const sortedYears = Array.from(map.keys()).sort((a, b) => Number(b) - Number(a));
  for (const yr of sortedYears) {
    result.push({
      year: yr,
      events: map.get(yr),
    });
  }
  return result;
}

/**
 * Find single event by slug.
 */
export function getEventBySlug(slug, events = eventsData) {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();
  return events.find((e) => e.slug.toLowerCase() === clean) || null;
}

/**
 * Format event date nicely.
 */
export function formatEventDate(event) {
  const start = new Date(event.startDate);
  const precision = event.datePrecision || 'day';

  if (precision === 'year') {
    return `${start.getFullYear()}`;
  }
  if (precision === 'month') {
    return start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
