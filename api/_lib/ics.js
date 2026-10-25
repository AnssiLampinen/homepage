// Minimal iCalendar helpers for the university feed filter.
// All times are handled as Europe/Helsinki wall-clock time.

const TZ = 'Europe/Helsinki';
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

// Undo RFC 5545 line folding
function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

// Split a calendar into header, VEVENT blocks and footer, keeping raw text
function splitCalendar(text) {
  const lines = unfold(text).split(/\r?\n/);
  const header = [];
  const events = [];
  const footer = [];
  let current = null;
  let seenEvent = false;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = [line];
      seenEvent = true;
    } else if (current) {
      current.push(line);
      if (line === 'END:VEVENT') {
        events.push(current);
        current = null;
      }
    } else if (line.trim() === '') {
      continue;
    } else if (!seenEvent) {
      header.push(line);
    } else {
      footer.push(line);
    }
  }
  return { header, events, footer };
}

function joinCalendar({ header, events, footer }) {
  return [...header, ...events.flat(), ...footer].join('\r\n') + '\r\n';
}

// Read "NAME;PARAM=x:value" lines into { NAME: { value, params } }
function readProps(block) {
  const props = {};
  for (const line of block) {
    const colon = line.indexOf(':');
    if (colon < 0) continue;
    const [name, ...params] = line.slice(0, colon).split(';');
    if (name in props) continue;
    const paramMap = {};
    for (const p of params) {
      const [k, v] = p.split('=');
      paramMap[k] = v;
    }
    props[name] = { value: line.slice(colon + 1), params: paramMap };
  }
  return props;
}

function unescapeText(value) {
  return value.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1');
}

// Convert a DTSTART/DTEND property into Helsinki wall time
// Returns { date: 'YYYY-MM-DD', time: 'HH:MM', allDay }
function toLocal(prop) {
  if (!prop) return null;
  const m = prop.value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})(Z)?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, , z] = m;
  if (h === undefined) return { date: `${y}-${mo}-${d}`, time: '00:00', allDay: true };
  if (!z) return { date: `${y}-${mo}-${d}`, time: `${h}:${mi}`, allDay: false };
  const utc = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(utc).map(p => [p.type, p.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, allDay: false };
}

function weekday(date) {
  return DAYS[new Date(date + 'T00:00:00Z').getUTCDay()];
}

function addDays(date, n) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// A weekly series is identified by title, weekday and start time, so it also
// works for feeds that list every occurrence as its own event.
// Events with a repeat rule (and their moved occurrences) share their UID instead.
function seriesKey(summary, date, time) {
  return `${summary}|${weekday(date)}|${time}`;
}

function parseEvent(block) {
  const p = readProps(block);
  const start = toLocal(p.DTSTART);
  if (!start) return null;
  const end = toLocal(p.DTEND) || start;
  const summary = p.SUMMARY ? unescapeText(p.SUMMARY.value) : '(no title)';
  const rrule = p.RRULE
    ? Object.fromEntries(p.RRULE.value.split(';').map(kv => kv.split('=')))
    : null;
  const uid = p.UID ? p.UID.value : '';
  const recurrenceId = toLocal(p['RECURRENCE-ID']);
  const exdates = block
    .filter(line => line.startsWith('EXDATE'))
    .flatMap(line => line.slice(line.indexOf(':') + 1).split(','))
    .map(value => toLocal({ value }))
    .filter(Boolean)
    .map(local => local.date);
  return {
    uid,
    summary,
    location: p.LOCATION ? unescapeText(p.LOCATION.value) : '',
    start,
    end,
    rrule,
    recurrenceId: recurrenceId ? recurrenceId.date : null,
    exdates,
    key: (rrule || recurrenceId) && uid ? `series|${uid}` : seriesKey(summary, start.date, start.time),
  };
}

// Occurrences of an event between from and to (inclusive dates).
// skip holds dates of a repeating event that were moved or cancelled.
function occurrences(ev, from, to, skip = new Set()) {
  const lengthDays = Math.round(
    (new Date(ev.end.date) - new Date(ev.start.date)) / 86400000
  );
  const make = date => ({
    summary: ev.summary,
    location: ev.location,
    date,
    start: ev.start.time,
    end: ev.end.time,
    allDay: ev.start.allDay,
    endDate: addDays(date, lengthDays),
    key: ev.key,
  });

  if (!ev.rrule) {
    return ev.start.date >= from && ev.start.date <= to ? [make(ev.start.date)] : [];
  }
  if (ev.rrule.FREQ !== 'WEEKLY' && ev.rrule.FREQ !== 'DAILY') {
    return ev.start.date >= from && ev.start.date <= to ? [make(ev.start.date)] : [];
  }

  const interval = +(ev.rrule.INTERVAL || 1);
  const count = ev.rrule.COUNT ? +ev.rrule.COUNT : Infinity;
  const until = ev.rrule.UNTIL ? toLocal({ value: ev.rrule.UNTIL }).date : '9999-12-31';
  const byDay = ev.rrule.BYDAY
    ? ev.rrule.BYDAY.split(',').map(d => d.slice(-2))
    : [weekday(ev.start.date)];

  const out = [];
  let n = 0;
  if (ev.rrule.FREQ === 'DAILY') {
    for (let date = ev.start.date; date <= until && date <= to && n < count; date = addDays(date, interval)) {
      n++;
      if (date >= from && !skip.has(date)) out.push(make(date));
    }
    return out;
  }
  // Walk week by week from the Monday of the first occurrence
  const firstMonday = addDays(ev.start.date, -((new Date(ev.start.date + 'T00:00:00Z').getUTCDay() + 6) % 7));
  for (let week = firstMonday; week <= to && week <= until && n < count; week = addDays(week, 7 * interval)) {
    for (let i = 0; i < 7 && n < count; i++) {
      const date = addDays(week, i);
      if (date < ev.start.date || date > until || !byDay.includes(weekday(date))) continue;
      n++;
      if (date >= from && date <= to && !skip.has(date)) out.push(make(date));
    }
  }
  return out;
}

// All occurrences in a feed between two dates, leaving out moved or
// cancelled dates of repeating events
function expandFeed(text, from, to) {
  const parsed = splitCalendar(text).events.map(parseEvent).filter(Boolean);
  const skipByUid = new Map();
  for (const ev of parsed) {
    const dates = ev.recurrenceId ? [ev.recurrenceId] : ev.rrule ? ev.exdates : [];
    if (!dates.length) continue;
    if (!skipByUid.has(ev.uid)) skipByUid.set(ev.uid, new Set());
    dates.forEach(d => skipByUid.get(ev.uid).add(d));
  }
  return parsed.flatMap(ev => occurrences(ev, from, to, ev.rrule ? skipByUid.get(ev.uid) : undefined));
}

async function fetchFeed() {
  const url = process.env.UNI_ICS_URL;
  if (!url) throw new Error('UNI_ICS_URL is not set');
  const res = await fetch(url.replace(/^webcal:/, 'https:'));
  if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
  return res.text();
}

module.exports = {
  splitCalendar, joinCalendar, parseEvent, occurrences, expandFeed, addDays, fetchFeed,
};
