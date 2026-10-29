import { ManagementDialog } from './ManagementDialog';
import { ResourcePager } from './ResourcePager';
import React, { useState } from 'react';
import { Users, Eye, Search, UserPlus, GraduationCap, LogOut, Sparkles, RotateCcw } from 'lucide-react';
import { useApp, useResource } from '../context/AppContext';
import { Student, ClassGroup } from '../types';
import { toPersianDigits, toEnglishDigits, getSchoolDate, getCurrentAcademicYearTitle } from '../utils/persianUtils';

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
  useResource('students');
  useResource('classes');
  const {
    classes,
    students,
    schools,
    currentSchoolId,
    findStudentForEnrollment,
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
  const [gradYear, setGradYear] = useState(() => getCurrentAcademicYearTitle());
  const [gradUni, setGradUni] = useState('');
  const [gradMajor, setGradMajor] = useState('');
  const [gradRank, setGradRank] = useState('');
  const [gradNotes, setGradNotes] = useState('');

  // School Transfer Form State
  const [destSchool, setDestSchool] = useState('');
  const [transferDate, setTransferDate] = useState(() => getSchoolDate());
  const [transferReason, setTransferReason] = useState('تغییر محل سکونت خانواده');

  // New Student Form States
  const [stdName, setStdName] = useState('');
  const [stdNationalCode, setStdNationalCode] = useState('');
  const [stdFatherName, setStdFatherName] = useState('');
  const [stdParentPhone, setStdParentPhone] = useState('');
  const [stdAddress, setStdAddress] = useState('');
  const [stdDetails, setStdDetails] = useState({ birthDate: '', parentName: '', studentNumber: '', parentBaleAccount: '' });
  const [enrollmentError, setEnrollmentError] = useState('');
  const [stdClassId, setStdClassId] = useState(classes[0]?.id || '');

  // Live lookup if student exists anywhere across schools
  const normInputCode = toEnglishDigits(stdNationalCode).trim();
  const existingMatchedStudent = normInputCode.length >= 6
    ? findStudentForEnrollment(normInputCode)
    : null;
  const existingMatchedSchool = existingMatchedStudent
    ? schools.find((s) => s.id === existingMatchedStudent.schoolId)
    : null;

  // Filter students by active school & current status tab
  const schoolStudents = students.filter((s) => {
    if (s.schoolId !== currentSchoolId) return false;
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

  const handleCreateOrLinkStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdName.trim() || !stdNationalCode.trim()) return;

    const targetClass = classes.find((cls) => cls.id === stdClassId && cls.schoolId === currentSchoolId);
    if (!targetClass) {
      setEnrollmentError('یک کلاس از مدرسه جاری انتخاب کنید.');
      return;
    }
    const details = {
      birthDate: stdDetails.birthDate.trim() || existingMatchedStudent?.birthDate || '',
      parentName: stdDetails.parentName.trim() || existingMatchedStudent?.parentName || '',
      studentNumber: toEnglishDigits(stdDetails.studentNumber.trim()) || existingMatchedStudent?.studentNumber || '',
      parentBaleAccount: stdDetails.parentBaleAccount.trim() || existingMatchedStudent?.parentBaleAccount || ''
    };
    if (!details.birthDate || !details.parentName || !details.studentNumber || !(stdParentPhone.trim() || existingMatchedStudent?.parentPhone)) {
      setEnrollmentError('تاریخ تولد، نام ولی، شماره دانش‌آموزی و شماره تماس ولی را وارد کنید.');
      return;
    }
      const saved0 = await addStudent({
        ...details,
        schoolId: currentSchoolId,
        classGroupId: stdClassId,
        name: stdName.trim(),
        nationalCode: toEnglishDigits(stdNationalCode.trim()),
        fatherName: stdFatherName.trim() || existingMatchedStudent?.fatherName || '',
        parentPhone: toEnglishDigits(stdParentPhone.trim()) || existingMatchedStudent?.parentPhone || '',
        address: stdAddress.trim() || existingMatchedStudent?.address || '',
        grade: targetClass.grade,
        fieldOfStudy: targetClass.major || '',
        status: 'active'
      }); if (!saved0.ok) return;

    setStdName('');
    setStdNationalCode('');
    setStdFatherName('');
    setStdParentPhone('');
    setStdAddress('');
    setStdDetails({ birthDate: '', parentName: '', studentNumber: '', parentBaleAccount: '' });
    setEnrollmentError('');
    setShowAddStudentModal(false);
  };

  const handleConfirmGraduation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!graduatingStudent) return;
    const saved1 = await markStudentGraduated(graduatingStudent.id, {
      year: gradYear.trim() || getCurrentAcademicYearTitle(),
      university: gradUni.trim() || 'نامشخص / آزاد',
      major: gradMajor.trim() || 'عمومی',
      rank: gradRank.trim() || undefined,
      notes: gradNotes.trim() || undefined
    }); if (!saved1.ok) return;
    setGraduatingStudent(null);
    setGradUni('');
    setGradMajor('');
    setGradRank('');
    setGradNotes('');
  };

  const handleConfirmTransferSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringSchoolStudent) return;
    const saved2 = await markStudentTransferred(transferringSchoolStudent.id, {
      destinationSchoolName: destSchool.trim() || 'آموزشگاه جدید / در حال استعلام',
      date: transferDate.trim() || '۱۴۰۵/۰۶/۲۳',
      reason: transferReason.trim() || 'انتقال تحصیلی'
    }); if (!saved2.ok) return;
    setTransferringSchoolStudent(null);
    setDestSchool('');
    setTransferReason('تغییر محل سکونت خانواده');
  };

  return (<> <ManagementDialog id="student-manager-modal" title="دانش‌آموزان" description="ثبت‌نام، پرونده‌ها و سوابق انتقال و فارغ‌التحصیلی" icon={Users} onClose={onClose}>


        {/* Tab Selector */}
        <div className="p-3 bg-[#f6f8f1] border-b border-[#e1e7d9] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="school-management-tabs school-management-tabs-students flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl max-w-full overflow-x-auto no-scrollbar">
            <button
              aria-pressed={activeTab === 'active'} onClick={() => setActiveTab('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'active'
                  ? 'bg-white text-[#364d36] shadow-xs'
                  : 'text-slate-600 hover:text-[#364d36]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-teal-600" />
              <span>فعال</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                {toPersianDigits(students.filter(s => s.schoolId === currentSchoolId && (s.status === 'active' || !s.status)).length)}
              </span>
            </button>

            <button
              aria-pressed={activeTab === 'graduated'} onClick={() => setActiveTab('graduated')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'graduated'
                  ? 'bg-white text-[#364d36] shadow-xs'
                  : 'text-slate-600 hover:text-[#364d36]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>فارغ‌التحصیلان</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700">
                {toPersianDigits(students.filter(s => s.status === 'graduated').length)}
              </span>
            </button>

            <button
              aria-pressed={activeTab === 'transferred'} onClick={() => setActiveTab('transferred')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'transferred'
                  ? 'bg-white text-[#364d36] shadow-xs'
                  : 'text-slate-600 hover:text-[#364d36]'
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
              className="px-3.5 py-2 bg-[#527348] hover:bg-[#426039] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>ثبت‌نام دانش‌آموز جدید</span>
            </button>
          )}
        </div>

        <ResourcePager appearance="sage" searchPlaceholder="جستجو در همه پرونده‌ها…" kind="students"/>
<details className="rounded-2xl border border-[#e1e7d9] bg-white p-3"><summary>پالایش نتیجه‌های این صفحه <span className="text-[10px] font-normal">جستجوی تکمیلی و کلاس</span></summary>        {/* Filter & Search Bar */}
        <div className="p-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="جستجو بر اساس نام، کد ملی، دانشگاه، رشته یا مدرسه مقصد..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs p-2.5 pe-8 bg-[#f6f8f1] border border-[#e1e7d9] rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
          </div>

          {activeTab === 'active' && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#87927e]">کلاس:</span>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs p-2 bg-[#f6f8f1] border border-[#e1e7d9] rounded-xl outline-none"
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

</details>
        {/* Students List / Table */}
        <div className="p-3 sm:p-6 management-content bg-[#f6f8f1]">
          {/* Mobile View: Clean responsive cards with zero horizontal overflow */}
          <div className="block md:hidden space-y-2.5">
            {filteredStudents.map((std) => {
              const stdClass = classes.find((c) => c.id === std.classGroupId);

              return (
                <div
                  key={std.id}
                  className="p-3.5 bg-white rounded-2xl border border-[#e1e7d9] shadow-xs space-y-2.5 text-right"
                >
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onOpenDossier(std)}
                      className="flex items-center gap-2 hover:text-[#658152] transition-colors text-right group"
                      title="مشاهده پرونده کامل"
                    >
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-[#658152] font-bold flex items-center justify-center text-xs group-hover:bg-teal-100">
                        {std.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-xs sm:text-sm text-[#364d36] group-hover:underline">
                          {std.name}
                        </div>
                        <div className="text-[10px] text-[#87927e] font-mono">
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
                        <span className="font-mono">{toPersianDigits(std.transferDetails?.date || '—')}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <button
                      onClick={() => onOpenDossier(std)}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#58734b] rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>مشاهده پرونده</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {activeTab === 'active' && (
                        <>
                          <button
                            onClick={() => setGraduatingStudent(std)}
                            className="p-1.5 text-[#87927e] hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            title="ثبت فارغ‌التحصیلی و قبولی کنکور"
                          >
                            <GraduationCap className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setTransferringSchoolStudent(std)}
                            className="p-1.5 text-[#87927e] hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                            title="انتقال به مدرسه دیگر"
                          >
                            <LogOut className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {(activeTab === 'graduated' || activeTab === 'transferred') && (
                        <button
                          onClick={async () => await markStudentActive(std.id, std.classGroupId)}
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
          <div className="hidden md:block bg-white rounded-2xl border border-[#e1e7d9] overflow-hidden shadow-xs">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#f6f8f1] text-slate-600 font-bold border-b border-[#e1e7d9]">
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
                    <tr key={std.id} className="hover:bg-[#f6f8f1]/80 transition-colors">
                      <td className="p-3 font-bold text-slate-800">
                        <button
                          type="button"
                          onClick={() => onOpenDossier(std)}
                          className="flex items-center gap-2 text-right hover:text-[#658152] transition-colors group"
                          title="کلیک جهت مشاهده پرونده کامل"
                        >
                          <div className="w-7 h-7 rounded-lg bg-teal-50 text-[#658152] font-bold flex items-center justify-center text-xs group-hover:bg-teal-100">
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
                          <td className="p-3 text-[#87927e] text-[11px]">
                            {toPersianDigits(std.transferDetails?.date || '۱۴۰۵/۰۶/۲۳')}
                          </td>
                        </>
                      )}

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onOpenDossier(std)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-[#58734b] rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
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
                              onClick={async () => await markStudentActive(std.id, std.classGroupId)}
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
        {showAddStudentModal && (<> <ManagementDialog id="student-manager-1" title={<>ثبت‌نام دانش‌آموز جدید</>} description="اطلاعات را بررسی کنید و سپس تغییرات را ثبت کنید." icon={Users} onClose={() => setShowAddStudentModal(false)}>

              <form id="form-handleCreateOrLinkStudent" onSubmit={handleCreateOrLinkStudent} className="management-form space-y-5 text-xs">{enrollmentError && <p role="alert" className="text-rose-700">{enrollmentError}</p>}
<fieldset className="space-y-4"><legend>مشخصات دانش‌آموز</legend><div>
                  <label className="block text-slate-700 font-bold mb-1">کد ملی دانش‌آموز:</label>
                  <input
                    type="text"
                    required
                    placeholder="۱۰ رقم کد ملی"
                    value={stdNationalCode}
                    onChange={(e) => setStdNationalCode(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl font-mono text-left outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
{existingMatchedStudent && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>انطباق هوشمند منطقه‌ای یافت شد!</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      پرونده این دانش‌آموز با نام <strong>{existingMatchedStudent.name}</strong> قبلاً در <strong>{existingMatchedSchool?.name || 'مدرسه دیگر شهرستان'}</strong> ثبت شده است. ثبت‌نام در این مدرسه، دسترسی به سوابق محرمانه مدرسه قبلی ایجاد نمی‌کند.
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
                    className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div></fieldset>
<fieldset className="space-y-4"><legend>اطلاعات تکمیلی و ارتباط با ولی</legend>{([
                  ['birthDate', 'تاریخ تولد شمسی'],
                  ['parentName', 'نام و نام خانوادگی ولی'],
                  ['studentNumber', 'شماره دانش‌آموزی'],
                  ['parentBaleAccount', 'شناسه بله ولی (اختیاری)']
                ] as const).map(([field, label]) => (
                  <label key={field} className="block space-y-1">
                    <span className="font-bold text-slate-700">{label}</span>
                    <input
                      id={`student-enrollment-${field}`}
                      value={stdDetails[field]}
                      required={field !== 'parentBaleAccount' && !existingMatchedStudent}
                      onChange={(event) => setStdDetails((prev) => ({ ...prev, [field]: event.target.value }))}
                      className="w-full min-h-11 p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl"
                    />
                  </label>
                ))}
<div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">نام پدر:</label>
                    <input
                      type="text"
                      value={stdFatherName}
                      onChange={(e) => setStdFatherName(e.target.value)}
                      className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">تلفن همراه ولی:</label>
                    <input
                      type="tel"
                      value={stdParentPhone}
                      onChange={(e) => setStdParentPhone(e.target.value)}
                      className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl font-mono text-left outline-none"
                    />
                  </div>
                </div></fieldset>
<fieldset className="space-y-4"><legend>ثبت‌نام در کلاس</legend><div>
                  <label className="block text-slate-700 font-bold mb-1">کلاس انتصابی:</label>
                  <select
                    value={stdClassId}
                    onChange={(e) => setStdClassId(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl outline-none"
                  >
                    {classes
                      .filter((c) => c.schoolId === currentSchoolId)
                      .map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.grade})
                        </option>
                      ))}
                  </select>
                </div></fieldset>
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
                    className="px-5 py-2 bg-[#527348] hover:bg-[#426039] text-white font-bold rounded-xl shadow-xs"
                  >
                    تایید ثبت‌نام
                  </button>
                </div></form>
            </ManagementDialog>
            
          </>
        )}

        {/* Graduation Modal */}
        {graduatingStudent && (<> <ManagementDialog id="student-manager-2" title={<>ثبت فارغ‌التحصیلی: {graduatingStudent.name}</>} description="اطلاعات را بررسی کنید و سپس تغییرات را ثبت کنید." icon={Users} onClose={() => setGraduatingStudent(null)}>

              <form onSubmit={handleConfirmGraduation} className="management-form space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">دانشگاه پذیرفته‌شده (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="مثال: دانشگاه صنعتی شریف / دانشگاه تهران یا نامشخص"
                    value={gradUni}
                    onChange={(e) => setGradUni(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl outline-none"
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
                      className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">رتبه منطقه (اختیاری):</label>
                    <input
                      type="text"
                      placeholder="مثال: ۴۲"
                      value={gradRank}
                      onChange={(e) => setGradRank(e.target.value)}
                      className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl font-mono text-left outline-none"
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
            </ManagementDialog>
            
          </>
        )}

        {/* Transfer Modal */}
        {transferringSchoolStudent && (<> <ManagementDialog id="student-manager-3" title={<>ثبت انتقال دانش‌آموز: {transferringSchoolStudent.name}</>} description="اطلاعات را بررسی کنید و سپس تغییرات را ثبت کنید." icon={Users} onClose={() => setTransferringSchoolStudent(null)}>

              <form onSubmit={handleConfirmTransferSchool} className="management-form space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">آموزشگاه مقصد (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="نام دبیرستان یا هنرستان مقصد (اختیاری)"
                    value={destSchool}
                    onChange={(e) => setDestSchool(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">علت جابجایی (اختیاری):</label>
                  <input
                    type="text"
                    placeholder="مثال: تغییر محل سکونت یا جابجایی تحصیلی"
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    className="w-full p-2.5 bg-[#f6f8f1] border border-slate-300 rounded-xl outline-none"
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
            </ManagementDialog>
            
          </>
        )}

        
      </ManagementDialog>
      
    </>
  );
};
