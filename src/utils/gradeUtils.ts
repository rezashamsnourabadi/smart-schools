import { GradeItem } from '../types';
import { toEnglishDigits } from './persianUtils';

export type ParsedGrade = { ok: true; value: number } | { ok: false; error: string };

export function parseGradeScore(input: string, maxScore: number): ParsedGrade {
  const value = toEnglishDigits(input).trim().replace('٫', '.');
  if (!value) return { ok: false, error: 'نمره خالی است.' };
  if (!Number.isFinite(maxScore) || maxScore <= 0) return { ok: false, error: 'سقف نمره باید عددی بزرگ‌تر از صفر باشد.' };
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return { ok: false, error: 'نمره را به شکل عدد، مانند ۱۹ یا ۱۸٫۵ وارد کنید.' };
  const score = Number(value);
  if (score < 0 || score > maxScore) return { ok: false, error: `نمره باید بین صفر و ${maxScore} باشد.` };
  return { ok: true, value: score };
}

export function validateGradeItem(grade: Omit<GradeItem, 'id'>): string | undefined {
  if (!grade.schoolId || !grade.classGroupId || !grade.subject.trim() || !grade.title.trim() || !grade.date) return 'کلاس، درس، عنوان و تاریخ ارزشیابی الزامی است.';
  if (!Number.isFinite(grade.maxScore) || grade.maxScore <= 0 || grade.maxScore > 100) return 'سقف نمره باید بزرگ‌تر از صفر و حداکثر صد باشد.';
  if (!grade.scores.length) return 'برای این کلاس دانش‌آموزی جهت ثبت نمره وجود ندارد.';
  if (new Set(grade.scores.map((row) => row.studentId)).size !== grade.scores.length) return 'برای یک دانش‌آموز بیش از یک نمره ثبت شده است.';
  if (grade.scores.some((row) => !row.studentId || !Number.isFinite(row.score) || row.score < 0 || row.score > grade.maxScore)) return 'یکی از نمره‌ها نامعتبر یا خارج از محدوده است.';
  return undefined;
}
