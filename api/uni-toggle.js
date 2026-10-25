// Turn a weekly series on or off
const { setDisabled } = require('./_lib/store');
const { isAdmin } = require('./_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }
  if (!isAdmin(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const { key, off } = req.body || {};
  if (typeof key !== 'string' || !key || typeof off !== 'boolean') {
    res.status(400).json({ error: 'Expected { key: string, off: boolean }' });
    return;
  }
  try {
    await setDisabled(key, off);
    res.status(200).json({ key, off });
  } catch (err) {
    console.error(err);
    res.status(502).json({ error: err.message });
  }
};
