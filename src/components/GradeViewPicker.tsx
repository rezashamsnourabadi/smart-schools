import type { GradeView } from '../../shared/academic';

export function GradeViewPicker({ id, value, onChange }: { id: string; value: GradeView; onChange: (value: GradeView) => void }) {
  return <label className="teaching-label">نمای دفتر نمره
    <select id={id} value={value} onChange={event => onChange(event.target.value as GradeView)} className="teacher-text-input">
      <option value="all">همه ارزشیابی‌های سال</option>
      <option value="term1">امتحان نوبت اول</option>
      <option value="term2">امتحان نوبت دوم</option>
      <option value="classwork">ارزشیابی کلاسی (مستمر و کوییز)</option>
    </select>
  </label>;
}
