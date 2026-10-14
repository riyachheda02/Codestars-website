import assert from 'assert';
import {
  getNextEvent,
  getRegistrationState,
  getCountdown,
  buildIcs,
  buildGoogleCalendarUrl,
} from './src/utils/eventState.js';

console.log('=== RUNNING UNIT TESTS FOR src/utils/eventState.js ===');

const mockEvents = [
  {
    slug: 'event-1',
    title: 'Event 1 Past',
    startDate: '2026-09-01T10:00:00+05:30',
    endDate: '2026-09-01T18:00:00+05:30',
    venue: 'Hall A',
  },
  {
    slug: 'event-2',
    title: 'Event 2 Live',
    startDate: '2026-10-11T09:00:00+05:30',
    endDate: '2026-10-11T19:00:00+05:30',
    venue: 'Hall B',
    registration: {
      url: 'https://reg.com',
      opensAt: '2026-10-01T00:00:00+05:30',
      closesAt: '2026-10-10T23:59:59+05:30',
    },
  },
  {
    slug: 'event-3',
    title: 'Event 3 Upcoming',
    startDate: '2026-11-20T10:00:00+05:30',
    endDate: '2026-11-20T18:00:00+05:30',
    venue: 'Hall C',
    registration: {
      url: 'https://forms.gle/test',
      opensAt: '2026-10-15T00:00:00+05:30',
      closesAt: '2026-11-18T23:59:59+05:30',
    },
  },
  {
    slug: 'event-4',
    title: 'Event 4 Later Upcoming',
    startDate: '2026-12-10T10:00:00+05:30',
    endDate: '2026-12-15T18:00:00+05:30',
    venue: 'Hall D',
  },
];

// 1. Test getNextEvent
const nowLive = new Date('2026-10-11T12:00:00+05:30');
const liveEv = getNextEvent(mockEvents, nowLive);
assert.strictEqual(liveEv?.slug, 'event-2', 'Should pick the live event when one is live');

const nowBetween = new Date('2026-10-20T12:00:00+05:30');
const upcomingEv = getNextEvent(mockEvents, nowBetween);
assert.strictEqual(upcomingEv?.slug, 'event-3', 'Should pick nearest upcoming event when none is live');

const nowFarFuture = new Date('2027-01-01T00:00:00+05:30');
const nullEv = getNextEvent(mockEvents, nowFarFuture);
assert.strictEqual(nullEv, null, 'Should return null when all events have passed');

// 2. Test getRegistrationState
const testEvent = {
  slug: 'test-event',
  startDate: '2026-11-20T10:00:00+05:30',
  endDate: '2026-11-20T18:00:00+05:30',
  registration: {
    url: 'https://forms.gle/abc',
    opensAt: '2026-10-15T00:00:00+05:30',
    closesAt: '2026-11-18T23:59:59+05:30',
  },
};

assert.strictEqual(
  getRegistrationState(testEvent, new Date('2026-10-11T10:00:00+05:30')),
  'not-open',
  'State should be not-open before opensAt'
);

assert.strictEqual(
  getRegistrationState(testEvent, new Date('2026-10-20T10:00:00+05:30')),
  'open',
  'State should be open between opensAt and closesAt'
);

assert.strictEqual(
  getRegistrationState(testEvent, new Date('2026-11-19T00:00:00+05:30')),
  'closed',
  'State should be closed after closesAt'
);

assert.strictEqual(
  getRegistrationState({ ...testEvent, registration: null }),
  'none',
  'State should be none if no registration object'
);

// 3. Test getCountdown
const target = new Date('2026-11-20T10:00:00+05:30');
const clockTest = new Date('2026-10-11T10:00:00+05:30');
const cd = getCountdown(target, clockTest);
assert.strictEqual(cd.days, 40, 'Should be 40 days');
assert.strictEqual(cd.hours, 0, 'Should be 0 hours');
assert.strictEqual(cd.minutes, 0, 'Should be 0 minutes');
assert.strictEqual(cd.seconds, 0, 'Should be 0 seconds');
assert.strictEqual(cd.done, false, 'done should be false');

const cdPast = getCountdown(target, new Date('2026-11-21T00:00:00+05:30'));
assert.strictEqual(cdPast.done, true, 'done should be true when past target');

// 4. Test buildIcs
const ics = buildIcs(testEvent);
assert.ok(ics.includes('BEGIN:VCALENDAR'), 'ICS includes BEGIN:VCALENDAR');
assert.ok(ics.includes('END:VCALENDAR'), 'ICS includes END:VCALENDAR');
assert.ok(ics.includes('DTSTART:20261120T043000Z'), 'ICS converts 10:00 IST to 04:30 UTC');
assert.ok(ics.includes('\r\n'), 'ICS uses CRLF line endings');

// 5. Test buildGoogleCalendarUrl
const gUrl = buildGoogleCalendarUrl(testEvent);
assert.ok(gUrl.startsWith('https://calendar.google.com/calendar/render?'), 'Google calendar url start');
assert.ok(gUrl.includes('dates=20261120T043000Z%2F20261120T123000Z'), 'Google calendar url dates');

console.log('ALL UNIT TESTS PASSED SUCCESSFULLY!');
