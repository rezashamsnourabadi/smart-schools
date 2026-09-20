import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  BookOpen,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ScheduleSlot } from '../types';
import { toPersianDigits } from '../utils/persianUtils';

interface SchedulePlannerModalProps {
  onClose: () => void;
  canEdit?: boolean;
}

const DAYS_OF_WEEK: ('شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه')[] = [
  'شنبه',
  'یکشنبه',
  'دوشنبه',
  'سه‌شنبه',
  'چهارشنبه'
];

const PERIOD_TIMES = [
  { period: 1, startTime: '۰۸:۰۰', endTime: '۰۹:۳۰' },
  { period: 2, startTime: '۰۹:۴۵', endTime: '۱۱:۱۵' },
  { period: 3, startTime: '۱۱:۳۰', endTime: '۱۲:۴۵' },
  { period: 4, startTime: '۱۳:۰۰', endTime: '۱۴:۱۵' }
];

export const SchedulePlannerModal: React.FC<SchedulePlannerModalProps> = ({
  onClose,
  canEdit = true
}) => {
  const { schedule, classes, currentSchoolId, addScheduleSlot, deleteScheduleSlot } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || 'cls-1');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState<'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه'>('شنبه');
  const [period, setPeriod] = useState<number>(1);
  const [subject, setSubject] = useState<string>('');
  const [teacherName, setTeacherName] = useState<string>('');

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classSchedule = schedule.filter((s) => s.classGroupId === selectedClassId);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !teacherName.trim()) return;

    const periodTime = PERIOD_TIMES.find((p) => p.period === period) || PERIOD_TIMES[0];

    addScheduleSlot({
      schoolId: currentSchoolId,
      classGroupId: selectedClassId,
      className: currentClass?.name || 'کلاس درس',
      teacherId: `t-${Date.now()}`,
      teacherName,
      subject,
      dayOfWeek,
      period,
      startTime: periodTime.startTime,
      endTime: periodTime.endTime,
      isCurrentPeriod: false
    });

    setSubject('');
    setTeacherName('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-1.5 sm:p-4 overflow-y-auto w-full max-w-full">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl m-auto max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-lg">مدیریت و چیدمان برنامه هفتگی</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">تنظیم ساعات تدریس، نام دبیران و دروس به تفکیک پایه‌ها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            title="بستن"
            aria-label="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subheader: Class Selector & Add Button */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">انتخاب کلاس:</span>
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedClassId === cls.id
                    ? 'bg-teal-700 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cls.name} ({toPersianDigits(cls.studentCount)} نفر)
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              افزودن زنگ جدید
            </button>
          )}
        </div>

        {/* Add Slot Form */}
        {showAddForm && canEdit && (
          <form onSubmit={handleAddSlot} className="bg-teal-50/70 p-4 border-b border-teal-200 space-y-3">
            <div className="font-bold text-xs sm:text-sm text-teal-900">اختصاص زنگ درسی به کلاس {currentClass?.name}</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-700 mb-1 font-medium">روز هفته:</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value as any)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1 font-medium">زنگ آموزشی:</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(Number(e.target.value))}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                >
                  <option value={1}>زنگ اول (۰۸:۰۰ تا ۰۹:۳۰)</option>
                  <option value={2}>زنگ دوم (۰۹:۴۵ تا ۱۱:۱۵)</option>
                  <option value={3}>زنگ سوم (۱۱:۳۰ تا ۱۲:۴۵)</option>
                  <option value={4}>زنگ چهارم (۱۳:۰۰ تا ۱۴:۱۵)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1 font-medium">عنوان درس:</label>
                <input
                  type="text"
                  placeholder="مثال: حسابان ۱"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-700 mb-1 font-medium">نام دبیر:</label>
                <input
                  type="text"
                  placeholder="مثال: استاد کاظمی"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow-2xs"
              >
                ذخیره در برنامه
              </button>
            </div>
          </form>
        )}

        {/* Schedule Matrix */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = classSchedule
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => a.period - b.period);

              return (
                <div key={day} className="bg-slate-50 rounded-xl border border-slate-200 p-3 flex flex-col">
                  <div className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-200 text-center flex items-center justify-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    {day}
                  </div>

                  <div className="space-y-2 mt-2.5 flex-1">
                    {[1, 2, 3, 4].map((pNum) => {
                      const slot = daySlots.find((s) => s.period === pNum);
                      const timeInfo = PERIOD_TIMES.find((pt) => pt.period === pNum);

                      return (
                        <div
                          key={pNum}
                          className={`p-2.5 rounded-lg border text-xs relative group transition-all ${
                            slot
                              ? 'bg-white border-teal-200 shadow-2xs'
                              : 'bg-slate-100/50 border-dashed border-slate-200 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                            <span className="font-medium">زنگ {toPersianDigits(pNum)}</span>
                            <span className="font-mono text-[10px]">{timeInfo?.startTime} - {timeInfo?.endTime}</span>
                          </div>

                          {slot ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs mb-0.5">{slot.subject}</div>
                              <div className="text-teal-700 text-[11px] flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {slot.teacherName}
                              </div>

                              {canEdit && (
                                <button
                                  onClick={() => deleteScheduleSlot(slot.id)}
                                  className="absolute top-1 left-1 p-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="حذف این زنگ"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="py-2 text-center text-slate-400 text-[11px]">
                              بدون برنامه
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>کلاس جاری: <strong>{currentClass?.name}</strong> • اتاق: {currentClass?.room}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
