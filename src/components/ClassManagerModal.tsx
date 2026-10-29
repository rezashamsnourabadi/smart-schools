import { ManagementDialog } from './ManagementDialog';
import { ResourcePager } from './ResourcePager';
import React, { useState } from 'react';
import { Building2, Users, Plus, Trash2, CheckCircle2, DoorOpen } from 'lucide-react';
import { useApp, useResource } from '../context/AppContext';
import { ClassGroup } from '../types';
import { toPersianDigits } from '../utils/persianUtils';

interface ClassManagerModalProps {
  onClose: () => void;
}

export const ClassManagerModal: React.FC<ClassManagerModalProps> = ({ onClose }) => {
  useResource('classes');
  useResource('students');
  const { currentSchoolId, currentSchool, classes, students, addClassGroup, deleteClassGroup } = useApp();

  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('دهم');
  const [major, setMajor] = useState('علوم تجربی');
  const [room, setRoom] = useState('');
  const [selectedClassForRoster, setSelectedClassForRoster] = useState<ClassGroup | null>(null);

  const schoolClasses = classes.filter((c) => c.schoolId === currentSchoolId);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const saved0 = await addClassGroup({
      schoolId: currentSchoolId,
      name: name.trim(),
      grade,
      major,
      room: room.trim()
    }); if (!saved0.ok) return;

    setName('');
    setRoom('');
    setShowAddForm(false);
  };

  return (<> <ManagementDialog id="class-manager-modal" title="کلاس‌ها" description={`${currentSchool?.name || 'مدرسه'} • کلاس‌ها و فهرست دانش‌آموزان`} icon={Building2} onClose={onClose}>
        <ResourcePager appearance="sage" kind="classes"/>


        {/* Toolbar */}
        <div className="p-4 bg-[#f6f8f1] border-b border-[#e1e7d9] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">کلاس‌های این صفحه:</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-[#58734b] font-mono font-bold">
              {toPersianDigits(schoolClasses.length)} کلاس
            </span>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3.5 py-2 bg-[#527348] hover:bg-[#426039] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>تعریف کلاس جدید</span>
          </button>
        </div>

        {/* Add Class Form */}
        {showAddForm && (
          <ManagementDialog id="classmanager-editor" title="کلاس جدید" description="پس از تکمیل اطلاعات، دکمه ثبت را بزنید." icon={Building2} onClose={() => setShowAddForm(false)}><form id="form-handleCreateClass" onSubmit={handleCreateClass} className="management-form space-y-5 text-xs"><fieldset className="space-y-4"><legend>مشخصات کلاس</legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
            </div></fieldset>
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
                className="px-5 py-2 text-xs bg-[#527348] hover:bg-[#426039] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>ثبت کلاس</span>
              </button>
            </div></form></ManagementDialog>
        )}

        {/* Classes Grid */}
        <div className="management-content bg-[#f6f8f1] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schoolClasses.map((cls) => {
              const classStudents = students.filter(
                (s) => s.classGroupId === cls.id && s.schoolId === currentSchoolId && (!s.status || s.status === 'active')
              );

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl border border-[#e1e7d9] p-4 shadow-xs hover:border-teal-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-[#658152] border border-teal-200">
                        {cls.grade} • {cls.major || 'عمومی'}
                      </span>
                      <h4 className="font-bold text-[#364d36] text-base mt-1">{cls.name}</h4>
                    </div>

                    <button
                      onClick={async () => await deleteClassGroup(cls.id)}
                      className="text-slate-300 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                      title="حذف کلاس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-[#f6f8f1] p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[#87927e]">
                        <DoorOpen className="w-3.5 h-3.5" />
                        اتاق / کلاس:
                      </span>
                      <span className="font-semibold text-slate-800">{cls.room}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[#87927e]">
                        <Users className="w-3.5 h-3.5" />
                        تعداد دانش‌آموزان:
                      </span>
                      <span className="font-mono font-bold text-[#58734b] text-sm">
                        {toPersianDigits(cls.studentCount || classStudents.length)} نفر
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedClassForRoster(cls)}
                    className="w-full py-2 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-[#58734b] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>مشاهده لیست دانش‌آموزان کلاس ({toPersianDigits(classStudents.length)})</span>
                  </button>
                </div>
              );
            })}
          </div>

          {schoolClasses.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-[#e1e7d9] text-[#87927e] text-xs">
              هنوز کلاسی در این آموزشگاه تعریف نشده است.
            </div>
          )}
        </div>

        {/* Selected Class Roster Sub-Drawer / Modal */}
        {selectedClassForRoster && (<> <ManagementDialog id="class-manager-1" title={<>دانش‌آموزان {selectedClassForRoster.name}</>} description="اطلاعات را بررسی کنید و سپس تغییرات را ثبت کنید." icon={Building2} onClose={() => setSelectedClassForRoster(null)}>

              <div className=" space-y-1.5 divide-y divide-slate-50 text-xs">
                {students
                  .filter(
                    (s) =>
                      s.classGroupId === selectedClassForRoster.id &&
                      s.schoolId === currentSchoolId && (!s.status || s.status === 'active')
                  )
                  .map((s, idx) => (
                    <div key={s.id} className="pt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono text-[11px]">
                          {toPersianDigits(idx + 1)}.
                        </span>
                        <span className="font-bold text-slate-800">{s.name}</span>
                      </div>
                      <span className="font-mono text-[#87927e] text-[11px]">
                        کد ملی: {toPersianDigits(s.nationalCode)}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedClassForRoster(null)}
                  className="px-4 py-1.5 bg-[#527348] text-white rounded-xl text-xs font-bold"
                >
                  بستن
                </button>
              </div>
            </ManagementDialog>
            
          </>
        )}

        
      </ManagementDialog>
      
    </>
  );
};
