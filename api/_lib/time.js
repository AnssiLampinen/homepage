// Convert between Europe/Helsinki wall-clock time and real instants
const { timeZone } = require('./hours');

function offsetMinutes(instant) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(instant).map(p => [p.type, +p.value])
  );
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - instant.getTime()) / 60000);
}

// 'YYYY-MM-DD', 'HH:MM' in Helsinki to a Date
function zoned(date, time) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let instant = new Date(guess - offsetMinutes(new Date(guess)) * 60000);
  // Second pass settles dates next to a daylight saving change
  instant = new Date(guess - offsetMinutes(instant) * 60000);
  return instant;
}

// A Date to Helsinki { date, time }
function local(instant) {
  const shifted = new Date(instant.getTime() + offsetMinutes(instant) * 60000).toISOString();
  return { date: shifted.slice(0, 10), time: shifted.slice(11, 16) };
}

module.exports = { zoned, local };
