// Filtered university feed for Google Calendar to subscribe to.
// Events whose weekly series is toggled off in the dashboard are left out.
const { splitCalendar, joinCalendar, parseEvent, fetchFeed } = require('./_lib/ics');
const { getDisabled } = require('./_lib/store');
const { safeEqual } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (!process.env.FEED_TOKEN || !safeEqual(req.query.token, process.env.FEED_TOKEN)) {
    res.status(404).send('Not found');
    return;
  }
  try {
    const [text, disabled] = await Promise.all([fetchFeed(), getDisabled()]);
    const cal = splitCalendar(text);
    cal.events = cal.events.filter(block => {
      const ev = parseEvent(block);
      return !(ev && disabled.has(ev.key));
    });

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(joinCalendar(cal));
  } catch (err) {
    console.error(err);
    res.status(502).send('Could not load feed');
  }
};
