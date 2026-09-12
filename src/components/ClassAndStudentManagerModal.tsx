import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  ArrowRightLeft,
  Eye,
  Search,
  School as SchoolIcon,
  CheckCircle2,
  UserPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, ClassGroup } from '../types';
import { toPersianDigits } from '../utils/persianUtils';

interface ClassAndStudentManagerModalProps {
  onClose: () => void;
  onOpenDossier: (student: Student) => void;
  canManageClasses?: boolean;
}

export const ClassAndStudentManagerModal: React.FC<ClassAndStudentManagerModalProps> = ({
  onClose,
  onOpenDossier,
  canManageClasses = true
}) => {
  const {
    classes,
    students,
    currentSchoolId,
    addClassGroup,
    addStudent,
    removeStudent,
    transferStudentClass
  } = useApp();

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);

  // New Student Form States
  const [stdName, setStdName] = useState('');
  const [stdNationalCode, setStdNationalCode] = useState('');
  const [stdFatherName, setStdFatherName] = useState('');
  const [stdParentPhone, setStdParentPhone] = useState('');
  const [stdAddress, setStdAddress] = useState('');
  const [stdClassId, setStdClassId] = useState(classes[0]?.id || 'cls-1');

  // New Class Form States
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('پایه دهم');
  const [newClassField, setNewClassField] = useState('ریاضی و فیزیک');
  const [newClassRoom, setNewClassRoom] = useState('۱۰۳');

  const filteredStudents = students.filter((s) => {
    const matchesClass = selectedClassId === 'all' || s.classGroupId === selectedClassId;
    const matchesSearch =
      s.name.includes(searchQuery) ||
      s.nationalCode.includes(searchQuery) ||
      s.fatherName.includes(searchQuery);
    return matchesClass && matchesSearch;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdName.trim() || !stdNationalCode.trim()) return;

    const targetClass = classes.find((c) => c.id === stdClassId);

    addStudent({
      schoolId: currentSchoolId,
      classGroupId: stdClassId,
      name: stdName,
      nationalCode: stdNationalCode,
      birthDate: '۱۳۸۹/۰۲/۱۰',
      fatherName: stdFatherName || 'احمد',
      motherName: 'زهرا',
      studentPhone: '۰۹۱۸۰۰۰۰۰۰۰',
      parentName: `${stdFatherName || 'ولی'} (سرپرست)`,
      parentPhone: stdParentPhone || '۰۹۱۸۱۱۱۰۰۰۰',
      emergencyPhone: '۰۲۱-۵۵۴۰۰۰۰',
      address: stdAddress || 'شهرستان، خیابان اصلی',
      parentBaleAccount: `@parent_${stdNationalCode.slice(-4)}`,
      grade: targetClass?.grade || 'پایه دهم',
      fieldOfStudy: targetClass?.fieldOfStudy || 'ریاضی و فیزیک',
      studentNumber: `۴۰۲${Math.floor(1000 + Math.random() * 9000)}`
    });

    setStdName('');
    setStdNationalCode('');
    setStdFatherName('');
    setStdParentPhone('');
    setStdAddress('');
    setShowAddStudentModal(false);
  };

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    addClassGroup({
      schoolId: currentSchoolId,
      name: newClassName,
      grade: newClassGrade,
      fieldOfStudy: newClassField,
      room: newClassRoom
    });

    setNewClassName('');
    setShowAddClassModal(false);
  };

  const handleTransfer = (newClassId: string) => {
    if (transferringStudent) {
      transferStudentClass(transferringStudent.id, newClassId);
      setTransferringStudent(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">کلاس‌بندی و مدیریت پرونده دانش‌آموزان</h3>
              <p className="text-xs text-slate-400">افزودن دانش‌آموز، تغییر کلاس، مشاهده پرونده و سوابق تحصیلی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="جستجو با نام دانش‌آموز، کد ملی یا نام پدر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageClasses && (
              <>
                <button
                  onClick={() => setShowAddClassModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ایجاد کلاس جدید
                </button>
                <button
                  onClick={() => setShowAddStudentModal(true)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  افزودن دانش‌آموز
                </button>
              </>
            )}
          </div>
        </div>

        {/* Class Filter Pills */}
        <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
          <button
            onClick={() => setSelectedClassId('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedClassId === 'all'
                ? 'bg-teal-800 text-white font-bold'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            همه کلاس‌ها ({toPersianDigits(students.length)} نفر)
          </button>
          {classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedClassId === cls.id
                  ? 'bg-teal-800 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {cls.name} ({toPersianDigits(cls.studentCount)} نفر)
            </button>
          ))}
        </div>

        {/* Main Students List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-3">
          {filteredStudents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredStudents.map((std) => {
                const stdClass = classes.find((c) => c.id === std.classGroupId);
                return (
                  <div
                    key={std.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-black flex items-center justify-center border border-teal-100 text-base">
                            {std.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{std.name}</h4>
                            <div className="text-xs text-slate-500">
                              کد ملی: <span className="font-mono">{toPersianDigits(std.nationalCode)}</span>
                            </div>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                          {stdClass?.name || std.grade}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-600 py-2 border-t border-b border-slate-100 mb-3">
                        <div>نام پدر: <strong>{std.fatherName}</strong></div>
                        <div>تلفن ولی: <strong className="font-mono">{toPersianDigits(std.parentPhone)}</strong></div>
                        <div>معدل ترم ۱: <strong className="text-teal-700">{toPersianDigits(std.reportCards?.[0]?.gpa || '۱۹.۴')}</strong></div>
                        <div>غیبت: <strong className="text-amber-700">{toPersianDigits(std.attendanceStats?.absentDays ?? 0)} روز</strong></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1">
                      <button
                        onClick={() => onOpenDossier(std)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5 text-teal-600" />
                        مشاهده پرونده کامل
                      </button>

                      {canManageClasses && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setTransferringStudent(std)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs transition-colors"
                            title="تغییر کلاس (کلاس‌بندی)"
                          >
                            <ArrowRightLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`آیا از حذف پرونده ${std.name} از مدرسه اطمینان دارید؟`)) {
                                removeStudent(std.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
                            title="حذف دانش‌آموز"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
              دانش‌آموزی با این مشخصات یافت نشد.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <span>تعداد کل پرونده‌ها: <strong>{toPersianDigits(students.length)} دانش‌آموز</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium"
          >
            بستن
          </button>
        </div>
      </div>

      {/* Transfer Student Class Submodal */}
      {transferringStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-5 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm mb-2">تغییر کلاس دانش‌آموز</h4>
            <p className="text-xs text-slate-500 mb-4">
              انتقال <strong>{transferringStudent.name}</strong> به کلاس جدید:
            </p>
            <div className="space-y-2 mb-4">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => handleTransfer(cls.id)}
                  disabled={cls.id === transferringStudent.classGroupId}
                  className={`w-full text-right p-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-colors ${
                    cls.id === transferringStudent.classGroupId
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      : 'bg-white hover:bg-teal-50 text-slate-800 border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <span>{cls.name} ({cls.grade})</span>
                  <span className="text-slate-400 text-[11px]">{toPersianDigits(cls.studentCount)} نفر</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setTransferringStudent(null)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Submodal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-5 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h4 className="font-bold text-slate-800 text-base mb-3">افزودن پرونده دانش‌آموز جدید</h4>
            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    value={stdName}
                    onChange={(e) => setStdName(e.target.value)}
                    placeholder="مثال: علی رضایی"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">کد ملی (۱۰ رقمی):</label>
                  <input
                    type="text"
                    required
                    value={stdNationalCode}
                    onChange={(e) => setStdNationalCode(e.target.value)}
                    placeholder="مثال: ۴۰۲۸۹۱۰۰۱"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">نام پدر:</label>
                  <input
                    type="text"
                    value={stdFatherName}
                    onChange={(e) => setStdFatherName(e.target.value)}
                    placeholder="مثال: محمد"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">شماره همراه ولی (پیامک/بله):</label>
                  <input
                    type="text"
                    value={stdParentPhone}
                    onChange={(e) => setStdParentPhone(e.target.value)}
                    placeholder="مثال: ۰۹۱۸۱۱۱۰۰۰۰"
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">کلاس اختصاص‌یافته:</label>
                  <select
                    value={stdClassId}
                    onChange={(e) => setStdClassId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.grade} - {c.fieldOfStudy})</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">نشانی منزل:</label>
                  <input
                    type="text"
                    value={stdAddress}
                    onChange={(e) => setStdAddress(e.target.value)}
                    placeholder="شهرستان، خیابان مطهری..."
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  ثبت پرونده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Class Submodal */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-5 rounded-2xl shadow-xl max-w-md w-full border border-slate-200">
            <h4 className="font-bold text-slate-800 text-base mb-3">ایجاد کلاس جدید در مدرسه</h4>
            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">نام کلاس:</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="مثال: دهم تجربی - ب"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">پایه تحصیلی:</label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="پایه دهم">پایه دهم</option>
                    <option value="پایه یازدهم">پایه یازدهم</option>
                    <option value="پایه دوازدهم">پایه دوازدهم</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">رشته تحصیلی:</label>
                  <select
                    value={newClassField}
                    onChange={(e) => setNewClassField(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="ریاضی و فیزیک">ریاضی و فیزیک</option>
                    <option value="علوم تجربی">علوم تجربی</option>
                    <option value="ادبیات و علوم انسانی">ادبیات و انسانی</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">شماره اتاق/کلاس:</label>
                <input
                  type="text"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  placeholder="مثال: ۱۰۴"
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold"
                >
                  ایجاد کلاس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
