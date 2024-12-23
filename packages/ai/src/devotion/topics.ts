import { addDays, getDate, getDay, getMonth, getYear, isSameDay, subDays } from 'date-fns';

// Meeus/Jones/Butcher algorithm to calculate Easter
function calculateEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based month
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

function calculateAdvent(year: number): Date {
  const christmas = new Date(year, 11, 25);
  const christmasDay = getDay(christmas);

  // Find the 4th Sunday before Christmas
  const daysToSubtract = christmasDay + 7 * 4;
  return subDays(christmas, daysToSubtract);
}

// Calculate related dates based on Easter
function getMovableHolidayDates(year: number) {
  const easter = calculateEaster(year);
  const advent = calculateAdvent(year);

  return {
    easter,
    ashWednesday: subDays(easter, 46),
    palmSunday: subDays(easter, 7),
    goodFriday: subDays(easter, 2),
    pentecost: addDays(easter, 50),
    maundyThursday: subDays(easter, 3),
    ascensionThursday: addDays(easter, 39),
    trinitySunday: addDays(easter, 56),
    advent,
  };
}

export const topics = [
  'new life',
  'love',
  'faith',
  'hope',
  'joy',
  'peace',
  'patience',
  'kindness',
  'goodness',
  'gentleness',
  'self-control',
  'forgiveness',
  'prayer',
  'history',
  'prophecy',
  'salvation',
  'sin',
  'heaven',
  'hell',
  'baptism',
  'communion',
  'money',
  'work',
  'marriage',
  'children',
  'family',
  'friendship',
  'generosity',
  'justice',
  'wisdom',
  'humility',
];

// Fixed-date holidays
const fixedHolidays = [
  { month: 11, day: 24, topic: 'christmas eve' },
  { month: 11, day: 25, topic: 'christmas' },
  { month: 0, day: 6, topic: 'epiphany' },
  { month: 2, day: 25, topic: 'annunciation' },
  { month: 7, day: 15, topic: 'assumption' },
  { month: 10, day: 1, topic: 'all saints' },
];

export function getTodaysTopic() {
  const today = new Date();
  const currentYear = getYear(today);
  const month = getMonth(today);
  const dayOfMonth = getDate(today);

  // Check fixed holidays first
  const fixedHoliday = fixedHolidays.find((h) => h.month === month && h.day === dayOfMonth);
  if (fixedHoliday) return fixedHoliday.topic;

  // Check movable holidays
  const movableHolidays = getMovableHolidayDates(currentYear);

  // Create a map of date checks for cleaner code
  const holidayChecks = [
    { date: movableHolidays.easter, topic: 'easter' },
    { date: movableHolidays.goodFriday, topic: 'good friday' },
    { date: movableHolidays.palmSunday, topic: 'palm sunday' },
    { date: movableHolidays.pentecost, topic: 'pentecost' },
    { date: movableHolidays.ashWednesday, topic: 'ash wednesday' },
    { date: movableHolidays.maundyThursday, topic: 'maundy thursday' },
    { date: movableHolidays.ascensionThursday, topic: 'ascension' },
    { date: movableHolidays.trinitySunday, topic: 'trinity sunday' },
    { date: movableHolidays.advent, topic: 'advent' },
  ];

  // Check each movable holiday
  for (const { date, topic } of holidayChecks) {
    if (isSameDay(today, date)) return topic;
  }

  // Fallback to generic topic
  return topics[dayOfMonth % topics.length];
}
