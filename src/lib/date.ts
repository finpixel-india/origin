const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Local YYYY-MM-DD key (avoids UTC drift). */
export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysKey(key: string, days: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export function diffInDays(aKey: string, bKey: string): number {
  const a = parseKey(aKey).getTime();
  const b = parseKey(bKey).getTime();
  return Math.round((a - b) / 86400000);
}

export function isFutureKey(key: string): boolean {
  return diffInDays(key, todayKey()) > 0;
}

export function weekdayName(key: string): string {
  return WEEKDAYS[parseKey(key).getDay()];
}

export function weekdayShort(key: string): string {
  return WEEKDAYS[parseKey(key).getDay()].slice(0, 3);
}

export function formatLong(key: string): string {
  const d = parseKey(key);
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMedium(key: string): string {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(key: string): string {
  const d = parseKey(key);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function dayOfMonth(key: string): number {
  return parseKey(key).getDate();
}

export function monthName(key: string): string {
  return MONTHS[parseKey(key).getMonth()];
}

export function monthShort(key: string): string {
  return MONTHS_SHORT[parseKey(key).getMonth()];
}

export function relativeDay(key: string): string {
  const diff = diffInDays(key, todayKey());
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return `${Math.abs(diff)} days ago`;
  return `In ${diff} days`;
}

export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

export function timeFor(date = new Date()): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Calendar helpers */
export function calendarMatrix(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateKey(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
