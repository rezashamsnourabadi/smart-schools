import { ManagementDialog } from './ManagementDialog';
import { ResourcePager } from './ResourcePager';
import React, { useState } from 'react';
import { Calendar, Plus, Trash2, User } from 'lucide-react';
import { useApp, useResource } from '../context/AppContext';
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
  useResource('schedule');
  useResource('teachers');
  useResource('classes');
  const { schedule, classes, teachers, currentSchoolId, addScheduleSlot, deleteScheduleSlot } = useApp();
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || '');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [viewDay, setViewDay] = useState<(typeof DAYS_OF_WEEK)[number]>('شنبه');

  // Form states
  const [dayOfWeek, setDayOfWeek] = useState<'شنبه' | 'یکشنبه' | 'دوشنبه' | 'سه‌شنبه' | 'چهارشنبه'>('شنبه');
  const [period, setPeriod] = useState<number>(1);
  const [subject, setSubject] = useState<string>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const currentClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classSchedule = schedule.filter((s) => s.classGroupId === currentClass?.id);
  const availableTeachers = teachers.filter((teacher) => teacher.schoolId === currentSchoolId && !!currentClass && teacher.assignedClassIds.includes(currentClass.id));
  const selectedTeacher = availableTeachers.find((teacher) => teacher.id === selectedTeacherId);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !selectedTeacher) { setFormError('درس و دبیر مجاز برای این کلاس را انتخاب کنید.'); return; }

    const periodTime = PERIOD_TIMES.find((p) => p.period === period) || PERIOD_TIMES[0];

    const result = await addScheduleSlot({
      schoolId: currentSchoolId,
      classGroupId: currentClass!.id,
      className: currentClass?.name || 'کلاس درس',
      teacherId: selectedTeacher.id,
      teacherName: selectedTeacher.name,
      subject,
      dayOfWeek,
      period,
      startTime: periodTime.startTime,
      endTime: periodTime.endTime,
      isCurrentPeriod: false
    });
    if (!result?.ok) { setFormError(result?.error || 'برنامه ثبت نشد؛ دسترسی یا سال تحصیلی را بررسی کنید.'); return; }

    setSubject('');
    setSelectedTeacherId('');
    setFormError(null);
    setShowAddForm(false);
  };

  return (<> <ManagementDialog id="schedule-planner-modal" title="برنامه هفتگی" description="ابتدا کلاس را انتخاب کنید؛ سپس برنامه و زنگ‌های آن را مدیریت کنید." icon={Calendar} onClose={onClose}>
        <ResourcePager appearance="sage" kind="schedule"/>


        {/* Subheader: Class Selector & Add Button */}
        <div className="p-4 bg-[#f6f8f1] border-b border-[#e1e7d9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <label className="teaching-label min-w-0 flex-1">کلاس
            <select id="schedule-class-select" value={currentClass?.id || ''} onChange={event => { setSelectedClassId(event.target.value); setSelectedTeacherId(''); setFormError(null); }}>
              {!classes.length && <option value="">ابتدا یک کلاس تعریف کنید</option>}
              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </label>

          {canEdit && (
            <button
              id="schedule-add-slot" disabled={!currentClass} onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-[#527348] text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              افزودن زنگ جدید
            </button>
          )}
        </div>

        {/* Add Slot Form */}
        {showAddForm && canEdit && (
          <ManagementDialog id="scheduleplanner-editor" title="افزودن زنگ درسی" description="پس از تکمیل اطلاعات، دکمه ثبت را بزنید." icon={Calendar} onClose={() => setShowAddForm(false)}><form onSubmit={handleAddSlot} className="bg-teal-50/70 p-4 border-b border-teal-200 space-y-3">
            <div className="font-bold text-xs sm:text-sm text-teal-900">اختصاص زنگ درسی به کلاس {currentClass?.name}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-700 mb-1 font-medium">روز هفته:</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value as typeof dayOfWeek)}
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
                <label className="block text-xs text-slate-700 mb-1 font-medium">دبیر انتساب‌یافته:</label>
                <select
                  aria-label="انتخاب دبیر کلاس"
                  value={selectedTeacherId}
                  onChange={(e) => { setSelectedTeacherId(e.target.value); setFormError(null); }}
                  className="w-full min-h-11 text-xs p-2 bg-white border border-slate-300 rounded-lg"
                  required
                >
                  <option value="">انتخاب دبیر</option>
                  {availableTeachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
                </select>
              </div>
            </div>

            {!availableTeachers.length && <p role="status" className="text-xs text-amber-800">برای این کلاس دبیری انتساب داده نشده است. ابتدا انتساب کلاس دبیر را در مدیریت کادر انجام دهید.</p>}
            {formError && <p role="alert" className="text-xs text-rose-800">{formError}</p>}

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
                  disabled={!availableTeachers.length}
                  className="min-h-11 px-4 py-1.5 text-xs bg-teal-600 hover:bg-[#527348] disabled:bg-slate-400 text-white rounded-lg font-medium shadow-2xs"
              >
                ذخیره در برنامه
              </button>
            </div>
          </form></ManagementDialog>
        )}

        {/* Schedule Matrix */}
        <div className="management-content space-y-4">
          <div className="management-tabs management-tabs-three management-mobile-days" aria-label="روز برنامه هفتگی">
            {DAYS_OF_WEEK.map(day => <button key={day} type="button" aria-pressed={viewDay === day} onClick={() => { setViewDay(day); setDayOfWeek(day); }}>{day}</button>)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {DAYS_OF_WEEK.map((day) => {
              const daySlots = classSchedule
                .filter((s) => s.dayOfWeek === day)
                .sort((a, b) => a.period - b.period);

              return (
                <div key={day} className={`${viewDay === day ? 'flex' : 'hidden md:flex'} bg-[#f6f8f1] rounded-xl border border-[#e1e7d9] p-3 flex-col`}>
                  <div className="font-bold text-slate-800 text-sm pb-2 border-b border-[#e1e7d9] text-center flex items-center justify-center gap-1">
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
                              : 'bg-slate-100/50 border-dashed border-[#e1e7d9] text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] text-[#87927e] mb-1">
                            <span className="font-medium">زنگ {toPersianDigits(pNum)}</span>
                            <span className="font-mono text-[10px]">{timeInfo?.startTime} - {timeInfo?.endTime}</span>
                          </div>

                          {slot ? (
                            <div>
                              <div className="font-bold text-slate-800 text-xs mb-0.5">{slot.subject}</div>
                              <div className="text-[#658152] text-[11px] flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                {slot.teacherName}
                              </div>

                              {canEdit && (
                                <button
                                  onClick={async () => await deleteScheduleSlot(slot.id)}
                                  className="mt-2 flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-rose-50 p-1 text-slate-300 hover:text-rose-600 opacity-100 transition-opacity"
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

        
      </ManagementDialog>
      
    </>
  );
};
