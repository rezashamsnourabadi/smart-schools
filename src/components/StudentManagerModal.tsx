import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  ArrowRightLeft,
  Eye,
  Search,
  CheckCircle2,
  UserPlus,
  GraduationCap,
  LogOut,
  Sparkles,
  Phone,
  Building,
  RotateCcw,
  BookOpen,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, ClassGroup } from '../types';
import { toPersianDigits, toEnglishDigits } from '../utils/persianUtils';

interface StudentManagerModalProps {
  onClose: () => void;
  onOpenDossier: (student: Student) => void;
  initialTab?: 'active' | 'graduated' | 'transferred';
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  onClose,
  onOpenDossier,
  initialTab = 'active'
}) => {
  const {
    classes,
    students,
    schools,
    currentSchoolId,
    addStudent,
    removeStudent,
    transferStudentClass,
    markStudentGraduated,
    markStudentTransferred,
    markStudentActive
  } = useApp();

  // Primary Tab: 'active' | 'graduated' | 'transferred'
  const [activeTab, setActiveTab] = useState<'active' | 'graduated' | 'transferred'>(initialTab);

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [universityFilter, setUniversityFilter] = useState<string>('all');

  // Submodals
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [transferringStudent, setTransferringStudent] = useState<Student | null>(null);
  const [graduatingStudent, setGraduatingStudent] = useState<Student | null>(null);
  const [transferringSchoolStudent, setTransferringSchoolStudent] = useState<Student | null>(null);

  // Graduate Form State
  const [gradYear, setGradYear] = useState('۱۴۰۴-۱۴۰۵');
  const [gradUni, setGradUni] = useState('');
  const [gradMajor, setGradMajor] = useState('');
  const [gradRank, setGradRank] = useState('');
  const [gradNotes, setGradNotes] = useState('');

  // School Transfer Form State
  const [destSchool, setDestSchool] = useState('');
  const [transferDate, setTransferDate] = useState('۱۴۰۵/۰۶/۲۳');
  const [transferReason, setTransferReason] = useState('تغییر محل سکونت خانواده');

  // New Student Form States
  const [stdName, setStdName] = useState('');
  const [stdNationalCode, setStdNationalCode] = useState('');
  const [stdFatherName, setStdFatherName] = useState('');
  const [stdParentPhone, setStdParentPhone] = useState('');
  const [stdAddress, setStdAddress] = useState('');
  const [stdClassId, setStdClassId] = useState(classes[0]?.id || 'cls-1');

  // Live lookup if student exists anywhere across schools
  const normInputCode = toEnglishDigits(stdNationalCode).trim();
  const existingMatchedStudent = normInputCode.length >= 6
    ? students.find((s) => toEnglishDigits(s.nationalCode).trim() === normInputCode)
    : null;
  const existingMatchedSchool = existingMatchedStudent
    ? schools.find((s) => s.id === existingMatchedStudent.schoolId)
    : null;

  // Filter students by active school & current status tab
  const schoolStudents = students.filter((s) => {
    if (activeTab === 'graduated') {
      return s.status === 'graduated';
    }
    if (activeTab === 'transferred') {
      return s.status === 'transferred';
    }
    // active: default to active or undefined status within current school
    return s.schoolId === currentSchoolId && (s.status === 'active' || !s.status);
  });

  // Secondary Filter by Class
  const classFiltered = selectedClassId === 'all'
    ? schoolStudents
    : schoolStudents.filter((s) => s.classGroupId === selectedClassId);

  // Search Filter
  const filteredStudents = classFiltered.filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchName = s.name.toLowerCase().includes(q);
    const matchNat = toEnglishDigits(s.nationalCode).includes(toEnglishDigits(q));
    const matchUni = s.graduationDetails?.university?.toLowerCase().includes(q) || false;
    const matchMajor = s.graduationDetails?.major?.toLowerCase().includes(q) || false;
    const matchDest = s.transferDetails?.destinationSchoolName?.toLowerCase().includes(q) || false;
    return matchName || matchNat || matchUni || matchMajor || matchDest;
  });

  const handleCreateOrLinkStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdName.trim() || !stdNationalCode.trim()) return;

    if (existingMatchedStudent && existingMatchedStudent.schoolId !== currentSchoolId) {
      markStudentActive(existingMatchedStudent.id, currentSchoolId, stdClassId);
    } else {
      addStudent({
        schoolId: currentSchoolId,
        classGroupId: stdClassId,
        name: stdName.trim(),
        nationalCode: stdNationalCode.trim(),
        fatherName: stdFatherName.trim() || 'محمد',
        parentPhone: stdParentPhone.trim() || '09120000000',
        address: stdAddress.trim() || 'خیابان معلم، پلاک ۱۲',
        status: 'active'
      });
    }

    setStdName('');
    setStdNationalCode('');
    setStdFatherName('');
    setStdParentPhone('');
    setStdAddress('');
    setShowAddStudentModal(false);
  };

  const handleConfirmGraduation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!graduatingStudent) return;
    markStudentGraduated(graduatingStudent.id, {
      year: gradYear.trim() || '۱۴۰۴-۱۴۰۵',
      university: gradUni.trim() || 'نامشخص / آزاد',
      major: gradMajor.trim() || 'عمومی',
      rank: gradRank.trim() || undefined,
      notes: gradNotes.trim() || undefined
    });
    setGraduatingStudent(null);
    setGradUni('');
    setGradMajor('');
    setGradRank('');
    setGradNotes('');
  };

  const handleConfirmTransferSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringSchoolStudent) return;
    markStudentTransferred(transferringSchoolStudent.id, {
      destinationSchoolName: destSchool.trim() || 'آموزشگاه جدید / در حال استعلام',
      date: transferDate.trim() || '۱۴۰۵/۰۶/۲۳',
      reason: transferReason.trim() || 'انتقال تحصیلی'
    });
    setTransferringSchoolStudent(null);
    setDestSchool('');
    setTransferReason('تغییر محل سکونت خانواده');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                مدیریت جامع دانش‌آموزان و پرونده‌های تحصیلی
              </h3>
              <p className="text-xs text-slate-400">
                دانش‌آموزان فعال، فارغ‌التحصیلان و سوابق انتقالی
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

        {/* Tab Selector */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl max-w-full overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'active'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>دانش‌آموزان فعال</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                {toPersianDigits(students.filter(s => s.schoolId === currentSchoolId && (s.status === 'active' || !s.status)).length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('graduated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'graduated'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>فارغ‌التحصیلان</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700">
                {toPersianDigits(students.filter(s => s.status === 'graduated').length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('transferred')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'transferred'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogOut className="w-3.5 h-3.5 text-amber-600" />
              <span>منتقل‌شده</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-50 text-amber-700">
                {toPersianDigits(students.filter(s => s.status === 'transferred').length)}
              </span>
            </button>
          </div>

          {activeTab === 'active' && (
            <button
              onClick={() => setShowAddStudentModal(true)}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>ثبت‌نام دانش‌آموز جدید</span>
            </button>
          )}
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="جستجو بر اساس نام، کد ملی، دانشگاه، رشته یا مدرسه مقصد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs p-2.5 pe-8 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
          </div>

          {activeTab === 'active' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">کلاس:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
              >
                <option value="all">همه کلاس‌ها</option>
                {classes
                  .filter((c) => c.schoolId === currentSchoolId)
                  .map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.grade})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Students List / Table */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          {/* Mobile View: Clean responsive cards with zero horizontal overflow */}
          <div className="block md:hidden space-y-2.5">
            {filteredStudents.map((std) => {
              const stdClass = classes.find((c) => c.id === std.classGroupId);

              return (
                <div
                  key={std.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5 text-right"
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenDossier(std)}
                      className="flex items-center gap-2 hover:text-teal-700 transition-colors text-right group"
                      title="مشاهده پرونده کامل"
                    >
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs group-hover:bg-teal-100">
                        {std.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:underline">
                          {std.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          کد ملی: {toPersianDigits(std.nationalCode)}
                        </div>
                      </div>
                    </button>

                    <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg">
                      {stdClass?.name || std.grade}
                    </span>
                  </div>

                  {activeTab === 'graduated' && (
                    <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 text-[11px] text-indigo-900 space-y-0.5">
                      <div className="font-bold">
                        {std.graduationDetails?.university || 'دانشگاه سراسری'}
                      </div>
                      <div className="text-indigo-700">
                        رشته: {std.graduationDetails?.major || 'عمومی'}
                        {std.graduationDetails?.rank && (
                          <span className="mr-2 font-mono">
                            • رتبه: {toPersianDigits(std.graduationDetails.rank)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'transferred' && (
                    <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-900 space-y-0.5">
                      <div className="font-bold">
                        مقصد: {std.transferDetails?.destinationSchoolName || 'آموزشگاه جدید'}
                      </div>
                      <div className="text-amber-700 flex items-center justify-between text-[10px]">
                        <span>علت: {std.transferDetails?.reason || 'جابجایی'}</span>
                        <span className="font-mono">{toPersianDigits(std.transferDetails?.date || '۱۴۰۵/۰۶/۲۳')}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      onClick={() => onOpenDossier(std)}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>مشاهده پرونده</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {activeTab === 'active' && (
                        <>
                          <button
                            onClick={() => setGraduatingStudent(std)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="ثبت فارغ‌التحصیلی و قبولی کنکور"
                          >
                            <GraduationCap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTransferringSchoolStudent(std)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            title="انتقال به مدرسه دیگر"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {(activeTab === 'graduated' || activeTab === 'transferred') && (
                        <button
                          onClick={() => markStudentActive(std.id, currentSchoolId, std.classGroupId)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>فعال‌سازی مجدد</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/Tablet Table View (No parent phone, clickable name) */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3">نام و نام خانوادگی</th>
                  <th className="p-3">کد ملی</th>
                  <th className="p-3">پایه / کلاس</th>
                  {activeTab === 'graduated' && (
                    <>
                      <th className="p-3">قبولی دانشگاه</th>
                      <th className="p-3">رشته و رتبه</th>
                    </>
                  )}
                  {activeTab === 'transferred' && (
                    <>
                      <th className="p-3">مدرسه مقصد</th>
                      <th className="p-3">تاریخ و علت</th>
                    </>
                  )}
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((std) => {
                  const stdClass = classes.find((c) => c.id === std.classGroupId);

                  return (
                    <tr key={std.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        <button
                          type="button"
                          onClick={() => onOpenDossier(std)}
                          className="flex items-center gap-2 text-right hover:text-teal-700 transition-colors group"
                          title="کلیک جهت مشاهده پرونده کامل"
                        >
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-700 font-bold flex items-center justify-center text-xs group-hover:bg-teal-100">
                            {std.name.charAt(0)}
                          </div>
                          <span className="group-hover:underline underline-offset-2">{std.name}</span>
                        </button>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {toPersianDigits(std.nationalCode)}
                      </td>
                      <td className="p-3 text-slate-700">
                        {stdClass?.name || std.grade}
                      </td>

                      {activeTab === 'graduated' && (
                        <>
                          <td className="p-3 text-indigo-700 font-semibold">
                            {std.graduationDetails?.university || 'دانشگاه سراسری'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {std.graduationDetails?.major || 'مهندسی'}
                            {std.graduationDetails?.rank && (
                              <span className="mr-1 text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-1 py-0.5 rounded">
                                رتبه: {toPersianDigits(std.graduationDetails.rank)}
                              </span>
                            )}
                          </td>
                        </>
                      )}

                      {activeTab === 'transferred' && (
                        <>
                          <td className="p-3 text-amber-700 font-semibold">
                            {std.transferDetails?.destinationSchoolName || 'دبیرستان مقصد'}
                          </td>
                          <td className="p-3 text-slate-500 text-[11px]">
                            {toPersianDigits(std.transferDetails?.date || '۱۴۰۵/۰۶/۲۳')}
                          </td>
                        </>
                      )}

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenDossier(std)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                            title="مشاهده پرونده کامل"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>پرونده</span>
                          </button>

                          {activeTab === 'active' && (
                            <>
                              <button
                                onClick={() => setGraduatingStudent(std)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="ثبت فارغ‌التحصیلی و قبولی کنکور"
                              >
                                <GraduationCap className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setTransferringSchoolStudent(std)}
                                className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="انتقال به مدرسه دیگر"
                              >
                                <LogOut className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {(activeTab === 'graduated' || activeTab === 'transferred') && (
                            <button
                              onClick={() => markStudentActive(std.id, currentSchoolId, std.classGroupId)}
                              className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1"
                              title="بازگردانی به دانش‌آموز فعال"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>فعال‌سازی</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-10 text-center text-slate-400 text-xs">
              دانش‌آموزی با این مشخصات یافت نشد.
            </div>
          )}
        </div>

        {/* Add Student Submodal with Smart Matching */}
        {showAddStudentModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <h4 className="font-bold text-sm text-slate-900">ثبت‌نام دانش‌آموز جدید</h4>
                </div>
                <button
                  onClick={() => setShowAddStudentModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrLinkStudent} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">کد ملی دانش‌آموز:</label>
                  <input
                    type="text"
                    required
                    placeholder="۱۰ رقم کد ملی"
                    value={stdNationalCode}
                    onChange={(e) => setStdNationalCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {existingMatchedStudent && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>انطباق هوشمند منطقه‌ای یافت شد!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      پرونده این دانش‌آموز با نام <strong>{existingMatchedStudent.name}</strong> قبلاً در <strong>{existingMatchedSchool?.name || 'مدرسه دیگر شهرستان'}</strong> ثبت شده است. با ثبت‌نام در این آموزشگاه، سوابق تحصیلی و کارنامه‌های قبلی به صورت خودکار منتقل می‌شوند.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">نام و نام خانوادگی:</label>
                  <input
                    type="text"
                    required
                    value={stdName}
                    onChange={(e) => setStdName(e.target.value)}
                    placeholder="مثال: علیرضا حسینی"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نام پدر:</label>
                    <input
                      type="text"
                      value={stdFatherName}
                      onChange={(e) => setStdFatherName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تلفن همراه ولی:</label>
                    <input
                      type="tel"
                      value={stdParentPhone}
                      onChange={(e) => setStdParentPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">کلاس انتصابی:</label>
                  <select
                    value={stdClassId}
                    onChange={(e) => setStdClassId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  >
                    {classes
                      .filter((c) => c.schoolId === currentSchoolId)
                      .map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.grade})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    تایید ثبت‌نام
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Graduation Modal */}
        {graduatingStudent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    ثبت فارغ‌التحصیلی: {graduatingStudent.name}
                  </h4>
                </div>
                <button
                  onClick={() => setGraduatingStudent(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmGraduation} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دانشگاه پذیرفته‌شده (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="مثال: دانشگاه صنعتی شریف / دانشگاه تهران یا نامشخص"
                    value={gradUni}
                    onChange={(e) => setGradUni(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رشته قبولی (اختیاری):</label>
                    <input
                      type="text"
                      placeholder="مثال: مهندسی یا تجربی"
                      value={gradMajor}
                      onChange={(e) => setGradMajor(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رتبه منطقه (اختیاری):</label>
                    <input
                      type="text"
                      placeholder="مثال: ۴۲"
                      value={gradRank}
                      onChange={(e) => setGradRank(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-left outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGraduatingStudent(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    ثبت در آلبوم فارغ‌التحصیلان
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Transfer Modal */}
        {transferringSchoolStudent && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/50 p-4">
            <div className="bg-white w-full max-w-md rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-sm text-slate-900">
                    ثبت انتقال دانش‌آموز: {transferringSchoolStudent.name}
                  </h4>
                </div>
                <button
                  onClick={() => setTransferringSchoolStudent(null)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmTransferSchool} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">آموزشگاه مقصد (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="نام دبیرستان یا هنرستان مقصد (اختیاری)"
                    value={destSchool}
                    onChange={(e) => setDestSchool(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">علت جابجایی (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="مثال: تغییر محل سکونت یا جابجایی تحصیلی"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setTransferringSchoolStudent(null)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl shadow-xs"
                  >
                    تایید انتقال رسمی
                  </button>
                </div>
              </form>
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
