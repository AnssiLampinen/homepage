// Dashboard for toggling weekly university events on and off
const FIRST_HOUR = 7;
const LAST_HOUR = 21;
const HOUR_PX = 48;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const els = {
  login: document.getElementById('login'),
  password: document.getElementById('password'),
  dashboard: document.getElementById('dashboard'),
  week: document.getElementById('week'),
  range: document.getElementById('range'),
  status: document.getElementById('status'),
};

let password = '';
try { password = localStorage.getItem('calendar-admin-password') || ''; } catch (e) {}
let weekStart = mondayOf(new Date());
let events = [];

function mondayOf(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.toISOString().slice(0, 10);
}

function addDays(date, n) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function minutes(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { ...(options.headers || {}), Authorization: `Bearer ${password}` },
  });
  if (res.status === 401) {
    showLogin('Wrong password.');
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || res.status);
  return data;
}

function showLogin(message) {
  els.dashboard.hidden = true;
  els.login.hidden = false;
  els.status.textContent = message || '';
}

async function load() {
  els.status.textContent = 'Loading…';
  try {
    const data = await api(`/api/uni-events?week=${weekStart}`);
    events = data.events;
    els.login.hidden = true;
    els.dashboard.hidden = false;
    els.status.textContent = '';
    render();
  } catch (err) {
    if (err.message !== 'Unauthorized') els.status.textContent = `Could not load the feed: ${err.message}`;
  }
}

// Place overlapping events side by side within a day
function layoutDay(dayEvents) {
  const sorted = [...dayEvents].sort((a, b) => minutes(a.start) - minutes(b.start));
  const laneEnds = [];
  for (const ev of sorted) {
    let lane = laneEnds.findIndex(end => end <= minutes(ev.start));
    if (lane < 0) lane = laneEnds.length;
    laneEnds[lane] = minutes(ev.end);
    ev.lane = lane;
  }
  for (const ev of sorted) ev.lanes = laneEnds.length;
  return sorted;
}

function render() {
  const end = addDays(weekStart, 6);
  els.range.textContent = `${weekStart} – ${end}`;
  els.week.replaceChildren();
  els.week.style.setProperty('--hour-px', `${HOUR_PX}px`);

  const hours = document.createElement('div');
  hours.className = 'cal-hours';
  hours.append(document.createElement('div'));
  for (let h = FIRST_HOUR; h < LAST_HOUR; h++) {
    const label = document.createElement('div');
    label.textContent = `${String(h).padStart(2, '0')}:00`;
    hours.append(label);
  }
  els.week.append(hours);

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const col = document.createElement('div');
    col.className = 'cal-day';
    const head = document.createElement('div');
    head.className = 'cal-day-head';
    head.textContent = `${DAY_NAMES[i]} ${date.slice(8)}.${date.slice(5, 7)}.`;
    const body = document.createElement('div');
    body.className = 'cal-day-body';
    body.style.height = `${(LAST_HOUR - FIRST_HOUR) * HOUR_PX}px`;

    const dayEvents = events.filter(ev => ev.date === date && !ev.allDay);
    for (const ev of layoutDay(dayEvents)) {
      const top = Math.max(0, minutes(ev.start) - FIRST_HOUR * 60) / 60 * HOUR_PX;
      const bottom = Math.min((LAST_HOUR - FIRST_HOUR) * 60, Math.max(minutes(ev.end), minutes(ev.start) + 15) - FIRST_HOUR * 60) / 60 * HOUR_PX;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-event' + (ev.off ? ' off' : '');
      btn.style.top = `${top}px`;
      btn.style.height = `${Math.max(bottom - top, 18)}px`;
      btn.style.left = `${(ev.lane / ev.lanes) * 100}%`;
      btn.style.width = `${100 / ev.lanes}%`;
      btn.title = `${ev.summary}\n${ev.start}–${ev.end}${ev.location ? '\n' + ev.location : ''}\n${ev.off ? 'Off: click to turn on' : 'On: click to turn off'}`;
      btn.setAttribute('aria-pressed', String(!ev.off));
      const time = document.createElement('span');
      time.className = 'cal-event-time';
      time.textContent = `${ev.start}–${ev.end}`;
      const name = document.createElement('span');
      name.textContent = ev.summary;
      btn.append(time, name);
      btn.addEventListener('click', () => toggle(ev));
      body.append(btn);
    }
    col.append(head, body);
    els.week.append(col);
  }
}

async function toggle(ev) {
  const off = !ev.off;
  try {
    await api('/api/uni-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: ev.key, off }),
    });
    for (const other of events) if (other.key === ev.key) other.off = off;
    render();
  } catch (err) {
    if (err.message !== 'Unauthorized') els.status.textContent = `Could not save: ${err.message}`;
  }
}

els.login.addEventListener('submit', e => {
  e.preventDefault();
  password = els.password.value;
  try { localStorage.setItem('calendar-admin-password', password); } catch (err) {}
  els.password.value = '';
  load();
});

document.getElementById('logout').addEventListener('click', () => {
  password = '';
  try { localStorage.removeItem('calendar-admin-password'); } catch (err) {}
  showLogin();
});
document.getElementById('prev').addEventListener('click', () => { weekStart = addDays(weekStart, -7); load(); });
document.getElementById('next').addEventListener('click', () => { weekStart = addDays(weekStart, 7); load(); });
document.getElementById('today').addEventListener('click', () => { weekStart = mondayOf(new Date()); load(); });

if (password) load(); else showLogin();
