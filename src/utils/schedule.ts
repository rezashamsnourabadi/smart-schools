import { ScheduleSlot } from '../types';

export function scheduleConflict(
  current: ScheduleSlot[],
  candidate: Omit<ScheduleSlot, 'id'> | ScheduleSlot,
  excludedId?: string
): string | undefined {
  const collision = current.find((slot) => slot.id !== excludedId
    && slot.schoolId === candidate.schoolId
    && slot.dayOfWeek === candidate.dayOfWeek
    && slot.period === candidate.period
    && (slot.classGroupId === candidate.classGroupId || slot.teacherId === candidate.teacherId));
  if (!collision) return undefined;
  if (collision.classGroupId === candidate.classGroupId) return 'این کلاس در روز و زنگ انتخاب‌شده از قبل برنامه دارد.';
  if (collision.teacherId === candidate.teacherId) return 'این دبیر در روز و زنگ انتخاب‌شده کلاس دیگری دارد.';
  return undefined;
}
