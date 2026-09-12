/**
 * Persian typography and number utilities
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toPersianDigits(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  return str
    .replace(/[0-9]/g, (w) => PERSIAN_DIGITS[+w])
    .replace(/[٠-٩]/g, (w) => PERSIAN_DIGITS[ARABIC_DIGITS.indexOf(w)]);
}

export function formatPersianScore(score: number | string | undefined | null): string {
  if (score === undefined || score === null) return '—';
  const num = typeof score === 'number' ? score : parseFloat(score);
  if (isNaN(num)) return toPersianDigits(score);
  // If integer or formatted to 1 decimal place
  const formatted = num % 1 === 0 ? num.toString() : num.toFixed(1);
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
