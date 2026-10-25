// Free time = weekly windows minus busy times, notice period and horizon
const hours = require('./hours');
const { zoned } = require('./time');
const { addDays } = require('./ics');

function weekday(date) {
  return new Date(date + 'T00:00:00Z').getUTCDay();
}

// Free intervals between two Helsinki dates (inclusive) as [{ start: Date, end: Date }]
function freeIntervals(fromDate, toDate, busy, now = new Date()) {
  const earliest = new Date(now.getTime() + hours.noticeHours * 3600000);
  const latest = new Date(now.getTime() + hours.horizonDays * 86400000);
  const step = hours.stepMinutes * 60000;
  const free = [];
  for (let date = fromDate; date <= toDate; date = addDays(date, 1)) {
    for (const [open, close] of hours.weekly[weekday(date)] || []) {
      let pieces = [{ start: zoned(date, open), end: zoned(date, close) }];
      for (const b of busy) {
        pieces = pieces.flatMap(p => {
          if (b.end <= p.start || b.start >= p.end) return [p];
          const out = [];
          if (b.start > p.start) out.push({ start: p.start, end: b.start });
          if (b.end < p.end) out.push({ start: b.end, end: p.end });
          return out;
        });
      }
      for (const p of pieces) {
        // Round inwards to whole steps and clip to the booking window
        const start = new Date(Math.ceil(Math.max(p.start, earliest) / step) * step);
        const end = new Date(Math.floor(Math.min(p.end, latest) / step) * step);
        if (end - start >= hours.minMinutes * 60000) free.push({ start, end });
      }
    }
  }
  return free;
}

module.exports = { freeIntervals };
