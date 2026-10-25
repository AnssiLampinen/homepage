// Everything that makes you busy: Google calendars plus the university feed
// minus the series toggled off in the dashboard. Reading the feed directly
// means toggles apply at once instead of waiting for Google to refresh.
const { busyTimes } = require('./google');
const { expandFeed, addDays, fetchFeed } = require('./ics');
const { getDisabled } = require('./store');
const { zoned } = require('./time');

async function uniBusy(fromDate, toDate) {
  if (!process.env.UNI_ICS_URL) return [];
  const [text, disabled] = await Promise.all([fetchFeed(), getDisabled()]);
  return expandFeed(text, fromDate, toDate)
    .filter(occ => !disabled.has(occ.key))
    .map(occ => occ.allDay
      ? { start: zoned(occ.date, '00:00'), end: zoned(occ.endDate > occ.date ? occ.endDate : addDays(occ.date, 1), '00:00') }
      : { start: zoned(occ.date, occ.start), end: zoned(occ.endDate, occ.end) });
}

async function allBusy(fromDate, toDate) {
  const [google, uni] = await Promise.all([
    busyTimes(zoned(fromDate, '00:00'), zoned(addDays(toDate, 1), '00:00')),
    uniBusy(fromDate, toDate),
  ]);
  return [...google, ...uni];
}

module.exports = { allBusy, uniBusy };
