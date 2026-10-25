// Book a visitor-chosen time inside a free interval
const hours = require('./_lib/hours');
const { createEvent } = require('./_lib/google');
const { allBusy } = require('./_lib/busy');
const { freeIntervals } = require('./_lib/availability');
const { zoned } = require('./_lib/time');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }
  const { name, email, date, start, end, message = '', website } = req.body || {};
  // Bots tend to fill the hidden "website" field
  if (website) {
    res.status(200).json({ ok: true });
    return;
  }
  if (typeof name !== 'string' || !name.trim() || name.length > 100) {
    res.status(400).json({ error: 'Please enter your name.' });
    return;
  }
  if (typeof email !== 'string' || !EMAIL.test(email) || email.length > 200) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (typeof message !== 'string' || message.length > 2000) {
    res.status(400).json({ error: 'The message is too long.' });
    return;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !TIME.test(start || '') || !TIME.test(end || '')) {
    res.status(400).json({ error: 'Please pick a date and time.' });
    return;
  }

  const startAt = zoned(date, start);
  const endAt = zoned(date, end);
  const minutes = (endAt - startAt) / 60000;
  if (minutes < hours.minMinutes || minutes > hours.maxMinutes) {
    res.status(400).json({ error: `Meetings can be ${hours.minMinutes}–${hours.maxMinutes} minutes long.` });
    return;
  }
  if (startAt.getTime() % (hours.stepMinutes * 60000) || endAt.getTime() % (hours.stepMinutes * 60000)) {
    res.status(400).json({ error: `Times must be in ${hours.stepMinutes} minute steps.` });
    return;
  }

  try {
    // Check again against the live calendar so two visitors can't take the same time
    const busy = await allBusy(date, date);
    const fits = freeIntervals(date, date, busy).some(f => f.start <= startAt && f.end >= endAt);
    if (!fits) {
      res.status(409).json({ error: 'That time is no longer free. Please pick another.' });
      return;
    }
    await createEvent({
      summary: `Meeting with ${name.trim()}`,
      description: `Booked through the homepage by ${name.trim()} <${email}>.${message.trim() ? '\n\n' + message.trim() : ''}`,
      start: { dateTime: startAt.toISOString(), timeZone: hours.timeZone },
      end: { dateTime: endAt.toISOString(), timeZone: hours.timeZone },
      attendees: [{ email, displayName: name.trim() }],
    });
    res.status(200).json({ ok: true, date, start, end });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Booking failed. Please try again later.' });
  }
};
