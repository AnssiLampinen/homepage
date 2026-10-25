// Booking rules. Times are Europe/Helsinki wall-clock time.
module.exports = {
  timeZone: 'Europe/Helsinki',
  // Weekday (0 = Sunday) to bookable windows
  weekly: {
    1: [['09:00', '17:00']],
    2: [['09:00', '17:00']],
    3: [['09:00', '17:00']],
    4: [['09:00', '17:00']],
    5: [['09:00', '17:00']],
  },
  stepMinutes: 15,
  minMinutes: 15,
  maxMinutes: 120,
  noticeHours: 12,
  horizonDays: 28,
};
