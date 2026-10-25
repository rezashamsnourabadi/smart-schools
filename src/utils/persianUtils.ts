/**
 * Persian typography and number utilities
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function getSchoolDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US-u-ca-persian', { timeZone: 'Asia/Tehran', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || '';
  return `${part('year')}/${part('month')}/${part('day')}`;
}

export interface SchoolClock { date: string; time: string; dayOfWeek: string; dateLabel: string; minuteOfDay: number }

export function getSchoolClock(now = new Date()): SchoolClock {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Tehran', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const [hour, minute] = time.split(':').map(Number);
  return {
    date: getSchoolDate(now), time, minuteOfDay: hour * 60 + minute,
    dayOfWeek: new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'long' }).format(now),
    dateLabel: new Intl.DateTimeFormat('fa-IR', { timeZone: 'Asia/Tehran', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(now)
  };
}

export function normalizeSchoolDate(value: string): string | undefined {
  const match = toEnglishDigits(value).trim().match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match || +match[2] < 1 || +match[2] > 12 || +match[3] < 1 || +match[3] > 31) return undefined;
  return `${match[1]}/${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}`;
}

export function toPersianDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str
    .replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w])
    .replace(/[٠-٩]/g, (w) => PERSIAN_DIGITS[ARABIC_DIGITS.indexOf(w)]);
}

export function formatPersianScore(score: number | string | undefined | null): string {
  if (score === undefined || score === null) return '—';
  const normalized = toEnglishDigits(score).trim().replace('٫', '.');
  const num = normalized ? Number(normalized) : Number.NaN;
  if (isNaN(num)) return toPersianDigits(score);
  const formatted = Number(num.toFixed(2)).toString();
  return toPersianDigits(formatted);
}

export function toEnglishDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  let str = String(val);
  for (let i = 0; i < 10; i++) {
    str = str.replace(new RegExp(PERSIAN_DIGITS[i], 'g'), i.toString());
    str = str.replace(new RegExp(ARABIC_DIGITS[i], 'g'), i.toString());
  }
  return str;
}

export function formatPersianCurrency(amount: number | string | undefined | null, includeUnit = true): string {
  if (amount === undefined || amount === null) return includeUnit ? '۰ تومان' : '۰';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return includeUnit ? '۰ تومان' : '۰';
  const parts = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return includeUnit ? `${toPersianDigits(parts)} تومان` : toPersianDigits(parts);
}

