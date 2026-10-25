// Free time for one week, without any details of what makes the rest busy
const hours = require('./_lib/hours');
const { allBusy } = require('./_lib/busy');
const { freeIntervals } = require('./_lib/availability');
const { local } = require('./_lib/time');
const { addDays } = require('./_lib/ics');

module.exports = async (req, res) => {
  const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.week || '') ? req.query.week : null;
  if (!from) {
    res.status(400).json({ error: 'week must be YYYY-MM-DD' });
    return;
  }
  const to = addDays(from, 6);
  try {
    const busy = await allBusy(from, to);
    const free = freeIntervals(from, to, busy).map(({ start, end }) => {
      const s = local(start);
      return { date: s.date, start: s.time, end: local(end).time };
    });
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({
      from,
      to,
      stepMinutes: hours.stepMinutes,
      minMinutes: hours.minMinutes,
      maxMinutes: hours.maxMinutes,
      free,
    });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: 'Could not load availability' });
  }
};
