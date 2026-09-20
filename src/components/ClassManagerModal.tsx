import React, { useState } from 'react';
import {
  X,
  Building2,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  BookOpen,
  DoorOpen,
  Sparkles,
  School,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ClassGroup } from '../types';
import { toPersianDigits } from '../utils/persianUtils';

interface ClassManagerModalProps {
  onClose: () => void;
}

export const ClassManagerModal: React.FC<ClassManagerModalProps> = ({ onClose }) => {
  const { currentSchoolId, currentSchool, classes, students, addClass, deleteClass } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('دهم');
  const [major, setMajor] = useState('علوم تجربی');
  const [room, setRoom] = useState('');
  const [capacity, setCapacity] = useState<number>(30);
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<ClassGroup | null>(null);

  const schoolClasses = classes.filter((c) => c.schoolId === currentSchoolId);

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addClass({
      schoolId: currentSchoolId,
      name: name.trim(),
      grade,
      major,
      room: room.trim() || 'اتاق ۱۰۱',
      studentCount: 0
    });

    setName('');
    setRoom('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-1.5 sm:p-4 overflow-y-auto">
      <div
        className="bg-white w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl my-auto max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                مدیریت کلاس‌ها و گروه‌های درسی
              </h3>
              <p className="text-xs text-slate-400">
                {currentSchool?.name} • تفکیک پایه‌ها، اتاق‌ها و ظرفیت کلاس‌ها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">تعداد کلاس‌های فعال:</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-mono font-bold">
              {toPersianDigits(schoolClasses.length)} کلاس
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف کلاس جدید</span>
          </button>
        </div>

        {/* Add Class Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateClass}
            className="p-4 sm:p-5 bg-teal-50/70 border-b border-teal-200 space-y-3 shrink-0 animate-in fade-in"
          >
            <div className="font-bold text-teal-950 text-xs sm:text-sm">مشخصات کلاس جدید</div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">نام کلاس:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: دهم تجربی ۲"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">پایه تحصیلی:</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="دهم">پایه دهم</option>
                  <option value="یازدهم">پایه یازدهم</option>
                  <option value="دوازدهم">پایه دوازدهم</option>
                  <option value="هفتم">پایه هفتم</option>
                  <option value="هشتم">پایه هشتم</option>
                  <option value="نهم">پایه نهم</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">رشته تحصیلی:</label>
                <select
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="علوم تجربی">علوم تجربی</option>
                  <option value="ریاضی و فیزیک">ریاضی و فیزیک</option>
                  <option value="ادبیات و علوم انسانی">ادبیات و علوم انسانی</option>
                  <option value="علوم و معارف اسلامی">علوم و معارف اسلامی</option>
                  <option value="فنی و حرفه‌ای / کاردانش">فنی و حرفه‌ای / کاردانش</option>
                  <option value="عمومی">عمومی (متوسطه اول / ابتدایی)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">شماره اتاق / فضا:</label>
                <input
                  type="text"
                  placeholder="مثال: اتاق ۱۰۳ (طبقه اول)"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت کلاس</span>
              </button>
            </div>
          </form>
        )}

        {/* Classes Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolClasses.map((cls) => {
              const classStudents = students.filter(
                (s) => s.classGroupId === cls.id || s.grade === cls.grade
              );

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-teal-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                        {cls.grade} • {cls.major || 'عمومی'}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base mt-1">{cls.name}</h4>
                    </div>

                    <button
                      onClick={() => deleteClass(cls.id)}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      title="حذف کلاس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <DoorOpen className="w-3.5 h-3.5" />
                        اتاق / کلاس:
                      </span>
                      <span className="font-semibold text-slate-800">{cls.room}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        تعداد دانش‌آموزان:
                      </span>
                      <span className="font-mono font-bold text-teal-800 text-sm">
                        {toPersianDigits(cls.studentCount || classStudents.length)} نفر
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedClassForRoster(cls)}
                    className="w-full py-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>مشاهده لیست دانش‌آموزان کلاس ({toPersianDigits(classStudents.length)})</span>
                  </button>
                </div>
              );
            })}
          </div>

          {schoolClasses.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
              هنوز کلاسی در این آموزشگاه تعریف نشده است.
            </div>
          )}
        </div>

        {/* Selected Class Roster Sub-Drawer / Modal */}
        {selectedClassForRoster && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-teal-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    دانش‌آموزان {selectedClassForRoster.name}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedClassForRoster(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-50 text-xs">
                {students
                  .filter(
                    (s) =>
                      s.classGroupId === selectedClassForRoster.id ||
                      s.grade === selectedClassForRoster.grade
                  )
                  .map((s, idx) => (
                    <div key={s.id} className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {toPersianDigits(idx + 1)}.
                        </span>
                        <span className="font-bold text-slate-800">{s.name}</span>
                      </div>
                      <span className="font-mono text-slate-500 text-[11px]">
                        کد ملی: {toPersianDigits(s.nationalCode)}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedClassForRoster(null)}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
