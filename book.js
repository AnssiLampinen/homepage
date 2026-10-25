// Visitor booking: show free time for a week and book a chosen start and end
const FIRST_HOUR = 7;
const LAST_HOUR = 21;
const HOUR_PX = 48;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const els = {
  week: document.getElementById('week'),
  range: document.getElementById('range'),
  status: document.getElementById('status'),
  form: document.getElementById('booking-form'),
  title: document.getElementById('booking-title'),
  start: document.getElementById('start'),
  end: document.getElementById('end'),
};

let weekStart = mondayOf(new Date());
let data = null;
let chosen = null; // { slot, start, end }

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

function clock(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function prettyDate(date) {
  const i = (new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7;
  return `${DAY_NAMES[i]} ${+date.slice(8)}.${+date.slice(5, 7)}.`;
}

async function load() {
  els.status.textContent = 'Loading…';
  try {
    const res = await fetch(`/api/availability?week=${weekStart}`);
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || res.status);
    data = body;
    els.status.textContent = data.free.length ? '' : 'No free times this week. Try the next one.';
    render();
  } catch (err) {
    data = null;
    els.week.replaceChildren();
    els.status.textContent = 'Could not load free times. Please try again later.';
  }
}

function render() {
  els.range.textContent = `${prettyDate(weekStart)} – ${prettyDate(addDays(weekStart, 6))}`;
  els.week.replaceChildren();
  els.week.style.setProperty('--hour-px', `${HOUR_PX}px`);

  const hoursCol = document.createElement('div');
  hoursCol.className = 'cal-hours';
  hoursCol.append(document.createElement('div'));
  for (let h = FIRST_HOUR; h < LAST_HOUR; h++) {
    const label = document.createElement('div');
    label.textContent = clock(h * 60);
    hoursCol.append(label);
  }
  els.week.append(hoursCol);

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const col = document.createElement('div');
    col.className = 'cal-day';
    const head = document.createElement('div');
    head.className = 'cal-day-head';
    head.textContent = prettyDate(date);
    const body = document.createElement('div');
    body.className = 'cal-day-body';
    body.style.height = `${(LAST_HOUR - FIRST_HOUR) * HOUR_PX}px`;

    for (const slot of data.free.filter(f => f.date === date)) {
      const top = (minutes(slot.start) - FIRST_HOUR * 60) / 60 * HOUR_PX;
      const height = (minutes(slot.end) - minutes(slot.start)) / 60 * HOUR_PX;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-free';
      btn.style.top = `${top}px`;
      btn.style.height = `${height}px`;
      btn.textContent = `${slot.start}–${slot.end}`;
      btn.setAttribute('aria-label', `Free ${prettyDate(date)} ${slot.start} to ${slot.end}`);
      btn.addEventListener('click', e => {
        // Start where the visitor clicked, rounded down to a whole step
        const offset = e.offsetY > 0 ? e.offsetY / HOUR_PX * 60 : 0;
        const step = data.stepMinutes;
        const latestStart = minutes(slot.end) - data.minMinutes;
        const start = Math.min(minutes(slot.start) + Math.floor(offset / step) * step, latestStart);
        choose(slot, start);
      });
      body.append(btn);
    }

    if (chosen && chosen.slot.date === date) {
      const sel = document.createElement('div');
      sel.className = 'cal-chosen';
      sel.style.top = `${(chosen.start - FIRST_HOUR * 60) / 60 * HOUR_PX}px`;
      sel.style.height = `${(chosen.end - chosen.start) / 60 * HOUR_PX}px`;
      sel.textContent = `${clock(chosen.start)}–${clock(chosen.end)}`;
      body.append(sel);
    }
    col.append(head, body);
    els.week.append(col);
  }
}

function fillOptions(select, from, to, selected) {
  select.replaceChildren();
  for (let m = from; m <= to; m += data.stepMinutes) {
    const opt = document.createElement('option');
    opt.value = clock(m);
    opt.textContent = clock(m);
    opt.selected = m === selected;
    select.append(opt);
  }
}

function choose(slot, start) {
  const slotStart = minutes(slot.start);
  const slotEnd = minutes(slot.end);
  const end = Math.min(start + 30, slotEnd, start + data.maxMinutes);
  chosen = { slot, start, end: Math.max(end, start + data.minMinutes) };
  fillOptions(els.start, slotStart, slotEnd - data.minMinutes, chosen.start);
  updateEnd();
  els.title.textContent = `Your meeting on ${prettyDate(slot.date)}`;
  els.form.hidden = false;
  render();
  els.form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateEnd() {
  const slotEnd = minutes(chosen.slot.end);
  const first = chosen.start + data.minMinutes;
  const last = Math.min(slotEnd, chosen.start + data.maxMinutes);
  chosen.end = Math.min(Math.max(chosen.end, first), last);
  fillOptions(els.end, first, last, chosen.end);
}

els.start.addEventListener('change', () => {
  const length = chosen.end - chosen.start;
  chosen.start = minutes(els.start.value);
  chosen.end = chosen.start + length;
  updateEnd();
  render();
});

els.end.addEventListener('change', () => {
  chosen.end = minutes(els.end.value);
  render();
});

document.getElementById('cancel').addEventListener('click', () => {
  chosen = null;
  els.form.hidden = true;
  render();
});

els.form.addEventListener('submit', async e => {
  e.preventDefault();
  const button = els.form.querySelector('button[type="submit"]');
  button.disabled = true;
  els.status.textContent = 'Booking…';
  try {
    const res = await fetch('/api/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        message: document.getElementById('message').value,
        website: document.getElementById('website').value,
        date: chosen.slot.date,
        start: clock(chosen.start),
        end: clock(chosen.end),
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || 'Booking failed.');
    const booked = `Booked ${prettyDate(chosen.slot.date)} ${clock(chosen.start)}–${clock(chosen.end)}. A calendar invite is on its way to your email.`;
    chosen = null;
    els.form.hidden = true;
    els.form.reset();
    await load();
    els.status.textContent = booked;
    els.status.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (err) {
    els.status.textContent = err.message;
    if (/no longer free/.test(err.message)) {
      chosen = null;
      els.form.hidden = true;
      load();
    }
  } finally {
    button.disabled = false;
  }
});

document.getElementById('prev').addEventListener('click', () => { weekStart = addDays(weekStart, -7); chosen = null; els.form.hidden = true; load(); });
document.getElementById('next').addEventListener('click', () => { weekStart = addDays(weekStart, 7); chosen = null; els.form.hidden = true; load(); });
document.getElementById('today').addEventListener('click', () => { weekStart = mondayOf(new Date()); chosen = null; els.form.hidden = true; load(); });

load();
