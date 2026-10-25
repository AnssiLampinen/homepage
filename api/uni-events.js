// Dashboard data: the feed's events for one week, with their on/off state
const { expandFeed, addDays, fetchFeed } = require('./_lib/ics');
const { getDisabled } = require('./_lib/store');
const { isAdmin } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.week || '') ? req.query.week : null;
  if (!from) {
    res.status(400).json({ error: 'week must be YYYY-MM-DD' });
    return;
  }
  const to = addDays(from, 6);
  try {
    const [text, disabled] = await Promise.all([fetchFeed(), getDisabled()]);
    const events = expandFeed(text, from, to)
      .map(occ => ({ ...occ, off: disabled.has(occ.key) }));
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ from, to, events });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message });
  }
};
