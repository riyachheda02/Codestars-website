/**
 * Event State & Countdown Helpers
 */

/**
 * Returns the live event if one is live, otherwise the nearest upcoming one, otherwise null.
 * @param {Array} events
 * @param {Date|string|number} [now=new Date()]
 * @returns {Object|null}
 */
export function getNextEvent(events = [], now = new Date()) {
  if (!events || events.length === 0) return null;
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();

  // Helper to extract numeric start/end times
  const getTimes = (e) => {
    const start = new Date(e.startDate).getTime();
    const end = e.endDate ? new Date(e.endDate).getTime() : start;
    return { start, end };
  };

  // 1. Check for an active live event
  const liveEvents = events.filter((e) => {
    const { start, end } = getTimes(e);
    return currentTime >= start && currentTime <= end;
  });

  if (liveEvents.length > 0) {
    // If multiple live events, sort by nearest start or end
    liveEvents.sort((a, b) => getTimes(a).start - getTimes(b).start);
    return liveEvents[0];
  }

  // 2. Otherwise find the nearest upcoming event (start > currentTime)
  const upcomingEvents = events.filter((e) => {
    const { start } = getTimes(e);
    return start > currentTime;
  });

  if (upcomingEvents.length > 0) {
    // Sort ascending: nearest upcoming start time first
    upcomingEvents.sort((a, b) => getTimes(a).start - getTimes(b).start);
    return upcomingEvents[0];
  }

  return null;
}

/**
 * Returns registration state:
 * - "none": no registration object or no registration.url
 * - "not-open": opensAt in the future
 * - "open": between opensAt and closesAt (or open without explicit limits)
 * - "closed": closesAt passed, or event started and not live
 * @param {Object} event
 * @param {Date|string|number} [now=new Date()]
 * @returns {"none"|"not-open"|"open"|"closed"}
 */
export function getRegistrationState(event, now = new Date()) {
  if (!event || !event.registration || !event.registration.url) {
    return 'none';
  }

  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const reg = event.registration;
  const opensAt = reg.opensAt || reg.opens;
  const closesAt = reg.closesAt || reg.closes;

  const eventStart = new Date(event.startDate).getTime();
  const eventEnd = event.endDate ? new Date(event.endDate).getTime() : eventStart;
  const isLive = currentTime >= eventStart && currentTime <= eventEnd;

  // If opensAt is in the future
  if (opensAt) {
    const openTime = new Date(opensAt).getTime();
    if (currentTime < openTime) {
      return 'not-open';
    }
  }

  // If closesAt has passed
  if (closesAt) {
    const closeTime = new Date(closesAt).getTime();
    if (currentTime > closeTime) {
      return 'closed';
    }
  }

  // If closesAt not specified but event started and not live (i.e. finished)
  if (currentTime > eventEnd) {
    return 'closed';
  }

  // If event has started and is not live
  if (currentTime >= eventStart && !isLive) {
    return 'closed';
  }

  return 'open';
}

/**
 * Calculates countdown from now to target.
 * @param {Date|string|number} target
 * @param {Date|string|number} [now=new Date()]
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, done: boolean }}
 */
export function getCountdown(target, now = new Date()) {
  const targetTime = target instanceof Date ? target.getTime() : new Date(target).getTime();
  const currentTime = now instanceof Date ? now.getTime() : new Date(now).getTime();
  const diff = targetTime - currentTime;

  if (isNaN(diff) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    days,
    hours,
    minutes,
    seconds,
    done: false,
  };
}

/**
 * Format date in UTC ISO basic string for iCalendar (e.g. 20261120T043000Z)
 * @param {Date|string} dateInput
 * @returns {string}
 */
export function formatIcsDate(dateInput) {
  const d = new Date(dateInput);
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/**
 * Escape text for iCalendar properties
 * @param {string} str
 * @returns {string}
 */
function escapeIcsText(str = '') {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an iCalendar (.ics) string.
 * @param {Object} event
 * @returns {string}
 */
export function buildIcs(event) {
  if (!event) return '';
  const dtStart = formatIcsDate(event.startDate);
  const dtEnd = formatIcsDate(event.endDate || event.startDate);
  const summary = escapeIcsText(event.title || 'CodeStars Event');
  const location = escapeIcsText(event.venue || 'DJSCE Mumbai');
  const description = escapeIcsText(
    event.description || event.shortDescription || 'DJS CodeStars Event'
  );
  const uid = `${event.slug || 'event'}-${dtStart}@djscodestars.in`;
  const dtStamp = formatIcsDate(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DJS CodeStars//Events Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  // iCalendar standard specifies CRLF (\r\n) line endings
  return lines.join('\r\n') + '\r\n';
}

/**
 * Generates Google Calendar event link.
 * @param {Object} event
 * @returns {string}
 */
export function buildGoogleCalendarUrl(event) {
  if (!event) return '';
  const dtStart = formatIcsDate(event.startDate);
  const dtEnd = formatIcsDate(event.endDate || event.startDate);
  const dates = `${dtStart}/${dtEnd}`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates,
    details: event.description || event.shortDescription || '',
    location: event.venue || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
