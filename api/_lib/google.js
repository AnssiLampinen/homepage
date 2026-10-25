// Google Calendar API access with a stored OAuth refresh token

const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const API = 'https://www.googleapis.com/calendar/v3';

async function accessToken() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google credentials are not set');
  }
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google token error: ${data.error || res.status}`);
  return data.access_token;
}

async function call(path, body) {
  const res = await fetch(API + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Google API error: ${(data.error && data.error.message) || res.status}`);
  return data;
}

function bookingCalendar() {
  return process.env.GOOGLE_CALENDAR_ID || 'primary';
}

// Calendars whose events make you busy, e.g. "primary,<filtered uni feed id>"
function busyCalendars() {
  return (process.env.BUSY_CALENDAR_IDS || bookingCalendar())
    .split(',').map(id => id.trim()).filter(Boolean);
}

// Busy intervals as [{ start: Date, end: Date }]
async function busyTimes(from, to) {
  const data = await call('/freeBusy', {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    items: busyCalendars().map(id => ({ id })),
  });
  return Object.values(data.calendars || {})
    .flatMap(cal => cal.busy || [])
    .map(b => ({ start: new Date(b.start), end: new Date(b.end) }));
}

async function createEvent(event) {
  const id = encodeURIComponent(bookingCalendar());
  return call(`/calendars/${id}/events?sendUpdates=all`, event);
}

module.exports = { busyTimes, createEvent };
