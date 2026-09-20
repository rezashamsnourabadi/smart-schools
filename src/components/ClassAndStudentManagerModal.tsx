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
    schools,
    currentSchoolId,
    addClassGroup,
    addStudent,
    removeStudent,
    transferStudentClass,
    markStudentGraduated,
    markStudentTransferred,
    markStudentActive
  } = useApp();

  // Primary Tab: 'active' | 'graduated' | 'transferred' | 'classes'
  const [activeTab, setActiveTab] = useState<'active' | 'graduated' | 'transferred' | 'classes'>('active');

  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [universityFilter, setUniversityFilter] = useState<string>('all');

  // Submodals
  const [showAddStudentModal, setShowAddStudentModal] = useState<boolean>(false);
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
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

  // New Class Form States
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('پایه دهم');
  const [newClassField, setNewClassField] = useState('ریاضی و فیزیک');
  const [newClassRoom, setNewClassRoom] = useState('۱۰۳');

  // Live lookup if student exists anywhere across schools
  const normInputCode = toEnglishDigits(stdNationalCode).trim();
  const existingMatchedStudent = normInputCode.length >= 6
    ? students.find((s) => toEnglishDigits(s.nationalCode).trim() === normInputCode)
    : null;
  const existingMatchedSchool = existingMatchedStudent
    ? schools.find((s) => s.id === existingMatchedStudent.schoolId)
    : null;

  // Filtering students by School and Tab
  const activeStudents = students.filter((s) => {
    const isThisSchool = s.schoolId === currentSchoolId;
    const isActive = (s.status ?? 'active') === 'active';
    if (!isThisSchool || !isActive) return false;
    const matchesClass = selectedClassId === 'all' || s.classGroupId === selectedClassId;
    const matchesSearch =
      s.name.includes(searchQuery) ||
      s.nationalCode.includes(searchQuery) ||
      s.fatherName?.includes(searchQuery);
    return matchesClass && matchesSearch;
  });

  const graduatedStudents = students.filter((s) => {
    const isThisSchool = s.schoolId === currentSchoolId;
    const isGrad = s.status === 'graduated';
    if (!isThisSchool || !isGrad) return false;
    const matchesSearch =
      s.name.includes(searchQuery) ||
      s.nationalCode.includes(searchQuery) ||
      s.graduationDetails?.university?.includes(searchQuery) ||
      s.graduationDetails?.major?.includes(searchQuery);
    const matchesUni = universityFilter === 'all' || s.graduationDetails?.university?.includes(universityFilter);
    return matchesSearch && matchesUni;
  });

  const transferredStudents = students.filter((s) => {
    const isThisSchool = s.schoolId === currentSchoolId;
    const isTransferred = s.status === 'transferred';
    if (!isThisSchool || !isTransferred) return false;
    const matchesSearch =
      s.name.includes(searchQuery) ||
      s.nationalCode.includes(searchQuery) ||
      s.transferDetails?.destinationSchoolName?.includes(searchQuery);
    return matchesSearch;
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

  const handleConfirmGraduation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!graduatingStudent) return;
    markStudentGraduated(graduatingStudent.id, {
      year: gradYear,
      university: gradUni.trim() || undefined,
      major: gradMajor.trim() || undefined,
      rank: gradRank.trim() || undefined,
      notes: gradNotes.trim() || undefined
    });
    setGraduatingStudent(null);
    setGradUni('');
    setGradMajor('');
    setGradRank('');
    setGradNotes('');
  };

  const handleConfirmSchoolTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringSchoolStudent || !destSchool.trim()) return;
    markStudentTransferred(transferringSchoolStudent.id, {
      destinationSchoolName: destSchool.trim(),
      date: transferDate,
      reason: transferReason.trim()
    });
    setTransferringSchoolStudent(null);
    setDestSchool('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto w-full max-w-full">
      <div 
        className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 m-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">مدیریت جامع دانش‌آموزان و کلاس‌ها</h3>
              <p className="text-xs text-slate-400">جستجوی هوشمند، ثبت نام با کد ملی، تفکیک فارغ‌التحصیلان و انتقالی‌ها</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-2 border-b border-slate-200 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'active'
                ? 'bg-white text-teal-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>فعال</span>
            <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[10px] font-mono font-bold">
              {toPersianDigits(activeStudents.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('graduated')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'graduated'
                ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <span>فارغ‌التحصیلان و دانشگاهی‌ها</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-mono font-bold">
              {toPersianDigits(graduatedStudents.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('transferred')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'transferred'
                ? 'bg-white text-amber-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <LogOut className="w-4 h-4 text-amber-600" />
            <span>انتقالی به سایر مدارس</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-mono font-bold">
              {toPersianDigits(transferredStudents.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'classes'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-slate-600" />
            <span>کلاس‌ها و ظرفیت‌ها</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold">
              {toPersianDigits(classes.length)}
            </span>
          </button>
        </div>

        {/* Action Controls Bar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder={
                  activeTab === 'graduated'
                    ? 'جستجو بر اساس نام، کد ملی، دانشگاه، رشته قبولی...'
                    : activeTab === 'transferred'
                    ? 'جستجو بر اساس نام دانش‌آموز، کد ملی یا مدرسه مقصد...'
                    : 'جستجو با نام دانش‌آموز، کد ملی، نام پدر...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-9 pl-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {canManageClasses && activeTab !== 'classes' && (
              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                افزودن و ثبت نام دانش‌آموز
              </button>
            )}

            {canManageClasses && (
              <button
                onClick={() => setShowAddClassModal(true)}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                کلاس جدید
              </button>
            )}
          </div>
        </div>

        {/* Sub-Filters for Active Students */}
        {activeTab === 'active' && (
          <div className="px-4 py-2 bg-slate-100/70 border-b border-slate-200 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              onClick={() => setSelectedClassId('all')}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedClassId === 'all'
                  ? 'bg-teal-800 text-white font-bold'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              همه کلاس‌ها ({toPersianDigits(students.filter(s => s.schoolId === currentSchoolId && (s.status ?? 'active') === 'active').length)})
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
        )}

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50 space-y-3">
          
          {/* TAB 1: ACTIVE STUDENTS */}
          {activeTab === 'active' && (
            <div>
              {activeStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {activeStudents.map((std) => {
                    const stdClass = classes.find((c) => c.id === std.classGroupId);
                    return (
                      <div
                        key={std.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 font-black flex items-center justify-center border border-teal-100 text-base">
                                {std.name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{std.name}</h4>
                                <div className="text-xs text-slate-500">
                                  کد ملی: <span className="font-mono font-bold text-slate-700">{toPersianDigits(std.nationalCode)}</span>
                                </div>
                              </div>
                            </div>

                            <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                              {stdClass?.name || std.grade}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 py-2 border-t border-b border-slate-100 mb-3 bg-slate-50/60 p-2 rounded-xl">
                            <div>نام پدر: <strong>{std.fatherName}</strong></div>
                            <div>تلفن ولی: <strong className="font-mono">{toPersianDigits(std.parentPhone)}</strong></div>
                            <div>معدل کارنامه: <strong className="text-teal-700 font-bold">{toPersianDigits(std.reportCards?.[0]?.gpa || '۱۹.۴')}</strong></div>
                            <div>غیبت‌ها: <strong className="text-rose-700 font-bold">{toPersianDigits(std.attendanceStats?.absentDays ?? 0)} زنگ</strong></div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => onOpenDossier(std)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-teal-600" />
                            پرونده کامل
                          </button>

                          {canManageClasses && (
                            <div className="flex items-center gap-1.5">
                              {/* Change Class */}
                              <button
                                onClick={() => setTransferringStudent(std)}
                                className="px-2.5 py-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="تغییر کلاس دانش‌آموز"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-600" />
                                <span>تغییر کلاس</span>
                              </button>

                              {/* Mark Graduated */}
                              <button
                                onClick={() => setGraduatingStudent(std)}
                                className="px-2.5 py-1.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="ثبت در لیست فارغ‌التحصیلان"
                              >
                                <GraduationCap className="w-3.5 h-3.5" />
                                <span>فارغ‌التحصیل</span>
                              </button>

                              {/* Transfer School */}
                              <button
                                onClick={() => setTransferringSchoolStudent(std)}
                                className="px-2.5 py-1.5 text-amber-700 hover:bg-amber-50 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                                title="انتقال به مدرسه دیگر"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>انتقالی</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => {
                                  if (window.confirm(`آیا از حذف پرونده ${std.name} از مدرسه اطمینان دارید؟`)) {
                                    removeStudent(std.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
                <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  دانش‌آموز فعالی با این فیلترها یافت نشد.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GRADUATED STUDENTS (ALUMNI & UNIVERSITY ADMISSIONS) */}
          {activeTab === 'graduated' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 text-xs text-indigo-900 leading-relaxed">
                <GraduationCap className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold mb-1">شبکه ارتباطی فارغ‌التحصیلان و نخبگان مدرسه</strong>
                  لیست دانش‌آموزانی که دوره تحصیلی خود را در این واحد گذرانده‌اند به همراه قبولی‌های کنکور سراسری و دانشگاه‌ها.
                  جهت برگزاری همایش‌های هدایت تحصیلی و ارتباط با دانشجویان رشته‌های پزشکی، مهندسی و علوم انسانی می‌توانید از این بانک اطلاعاتی استفاده نمایید.
                </div>
              </div>

              {graduatedStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {graduatedStudents.map((std) => (
                    <div
                      key={std.id}
                      className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center border border-indigo-200 text-base">
                              🎓
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{std.name}</h4>
                              <div className="text-xs text-slate-500">
                                کد ملی: <span className="font-mono">{toPersianDigits(std.nationalCode)}</span> • سال فراغت: {toPersianDigits(std.graduationDetails?.year || '۱۴۰۳-۱۴۰۴')}
                              </div>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            قبولی دانشگاه
                          </span>
                        </div>

                        {/* University Admission Badge */}
                        <div className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-950 my-2.5 space-y-1">
                          <div className="flex items-center justify-between font-bold">
                            <span>دانشگاه: {std.graduationDetails?.university || 'دانشگاه سراسری'}</span>
                            {std.graduationDetails?.rank && (
                              <span className="text-indigo-700 font-mono">رتبه کنکور: {toPersianDigits(std.graduationDetails.rank)}</span>
                            )}
                          </div>
                          <div className="text-indigo-800">رشته تحصیلی: <strong>{std.graduationDetails?.major || std.fieldOfStudy}</strong></div>
                          {std.graduationDetails?.notes && (
                            <p className="text-[11px] text-slate-500 pt-1 border-t border-indigo-100">
                              یادداشت: {std.graduationDetails.notes}
                            </p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                          <div>شماره تماس دانشجو: <strong className="font-mono text-slate-800">{toPersianDigits(std.studentPhone || std.parentPhone)}</strong></div>
                          <div>شماره ولی: <strong className="font-mono text-slate-800">{toPersianDigits(std.parentPhone)}</strong></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => onOpenDossier(std)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          سوابق تحصیلی و کارنامه‌ها
                        </button>

                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${std.studentPhone || std.parentPhone}`}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3 text-slate-500" />
                            تماس
                          </a>

                          <button
                            onClick={() => {
                              const targetClass = classes[0]?.id || 'cls-1';
                              markStudentActive(std.id, targetClass);
                            }}
                            className="px-2.5 py-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 rounded-xl text-xs font-semibold"
                            title="بازگشت به وضعیت دانش‌آموز در حال تحصیل"
                          >
                            فعال‌سازی مجدد
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  هیچ دانش‌آموخته‌ای در این بخش ثبت نشده است. برای ثبت، از تب «دانش‌آموزان در حال تحصیل» گزینه «فارغ‌التحصیل» را انتخاب فرمایید.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: TRANSFERRED STUDENTS (LEFT THE SCHOOL) */}
          {activeTab === 'transferred' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
                <LogOut className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold mb-1">پرونده دانش‌آموزان انتقالی به سایر مدارس</strong>
                  دانش‌آموزانی که پرونده آن‌ها به مدرسه دیگری در سطح شهرستان یا استان منتقل گردیده است.
                  اطلاعات سوابق و پرونده سلامت این افراد در سامانه بایگانی شده و در صورت ثبت نام مجدد با کد ملی در هر مدرسه‌ای از شهرستان، فوراً بازخوانی می‌گردد.
                </div>
              </div>

              {transferredStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {transferredStudents.map((std) => (
                    <div
                      key={std.id}
                      className="bg-white rounded-2xl border border-amber-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 font-black flex items-center justify-center border border-amber-200 text-base">
                              🏫
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{std.name}</h4>
                              <div className="text-xs text-slate-500">
                                کد ملی: <span className="font-mono">{toPersianDigits(std.nationalCode)}</span>
                              </div>
                            </div>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold border border-amber-300">
                            انتقالی
                          </span>
                        </div>

                        <div className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-950 my-2.5 space-y-1">
                          <div>مدرسه مقصد: <strong>{std.transferDetails?.destinationSchoolName || 'مدرسه خارج از منطقه'}</strong></div>
                          <div className="flex items-center justify-between text-[11px] text-amber-800">
                            <span>تاریخ انتقال پرونده: {toPersianDigits(std.transferDetails?.date || '۱۴۰۵/۰۶/۱۰')}</span>
                            <span>علت: {std.transferDetails?.reason || 'جابجایی منزل'}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 mb-2">
                          تلفن ولی دانش‌آموز: <span className="font-mono font-bold text-slate-800">{toPersianDigits(std.parentPhone)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <button
                          onClick={() => onOpenDossier(std)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          مشاهده پرونده بایگانی‌شده
                        </button>

                        <button
                          onClick={() => {
                            const targetClass = classes[0]?.id || 'cls-1';
                            markStudentActive(std.id, targetClass);
                          }}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors border border-teal-200"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-teal-600" />
                          بازگشت به مدرسه جاری
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500 text-xs">
                  هیچ دانش‌آموز انتقالی در این بخش ثبت نشده است.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CLASSES MANAGEMENT */}
          {activeTab === 'classes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {classes.map((cls) => {
                  const classStudents = students.filter(
                    (s) => s.classGroupId === cls.id && (s.status ?? 'active') === 'active'
                  );
                  return (
                    <div
                      key={cls.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">{cls.name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200">
                            اتاق {toPersianDigits(cls.room)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mb-2">
                          پایه: {cls.grade} • رشته: {cls.fieldOfStudy}
                        </div>

                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-medium">دانش‌آموزان حاضر:</span>
                          <span className="text-base font-black text-teal-700 font-mono">
                            {toPersianDigits(classStudents.length)} نفر
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedClassId(cls.id);
                          setActiveTab('active');
                        }}
                        className="w-full py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 rounded-xl text-xs font-bold transition-colors text-center"
                      >
                        مشاهده لیست دانش‌آموزان این کلاس
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-3">
            <span>کل پرونده‌ها: <strong>{toPersianDigits(students.filter(s => s.schoolId === currentSchoolId).length)} نفر</strong></span>
            <span>• فعال: <strong>{toPersianDigits(activeStudents.length)}</strong></span>
            <span>• فارغ‌التحصیل: <strong>{toPersianDigits(graduatedStudents.length)}</strong></span>
            <span>• انتقالی: <strong>{toPersianDigits(transferredStudents.length)}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-xs transition-colors"
          >
            بستن
          </button>
        </div>
      </div>

      {/* SUBMODAL: ADD STUDENT (WITH SMART NATIONAL CODE MATCHING) */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                <h4 className="font-bold text-slate-900 text-base">ثبت نام دانش‌آموز در مدرسه</h4>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Smart Matching Alert */}
            {existingMatchedStudent && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-xs text-emerald-900 leading-relaxed shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2 font-bold text-emerald-950 mb-1">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>اتصال هوشمند: دانش‌آموز در بانک اطلاعاتی شهرستان شناسایی شد!</span>
                </div>
                <p>
                  دانش‌آموز <strong>{existingMatchedStudent.name}</strong> قبلاً در <strong>{existingMatchedSchool?.name || 'مدرسه قبلی'}</strong> ثبت بوده است. با ثبت این فرم، <strong>کل سوابق تحصیلی، نمرات و کارنامه‌ها</strong> بدون ایجاد رکورد تکراری به این واحد آموزشی متصل می‌شود.
                </p>
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">کد ملی (۱۰ رقمی) *:</label>
                  <input
                    type="text"
                    required
                    value={stdNationalCode}
                    onChange={(e) => {
                      setStdNationalCode(e.target.value);
                      const norm = toEnglishDigits(e.target.value).trim();
                      const match = students.find((s) => toEnglishDigits(s.nationalCode).trim() === norm);
                      if (match && !stdName) {
                        setStdName(match.name);
                        setStdFatherName(match.fatherName || '');
                        setStdParentPhone(match.parentPhone || '');
                        setStdAddress(match.address || '');
                      }
                    }}
                    placeholder="مثال: ۴۰۲۸۹۱۰۵۶"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">نام و نام خانوادگی *:</label>
                  <input
                    type="text"
                    required
                    value={stdName}
                    onChange={(e) => setStdName(e.target.value)}
                    placeholder="مثال: پارسا نوروزی"
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">نام پدر:</label>
                  <input
                    type="text"
                    value={stdFatherName}
                    onChange={(e) => setStdFatherName(e.target.value)}
                    placeholder="مثال: احمد"
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">شماره همراه ولی (پیامک و بله):</label>
                  <input
                    type="text"
                    value={stdParentPhone}
                    onChange={(e) => setStdParentPhone(e.target.value)}
                    placeholder="مثال: ۰۹۱۸۱۱۱۰۰۰۰"
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">کلاس اختصاص‌یافته:</label>
                  <select
                    value={stdClassId}
                    onChange={(e) => setStdClassId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl bg-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.grade} - {c.fieldOfStudy})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">نشانی منزل و سکونت:</label>
                  <input
                    type="text"
                    value={stdAddress}
                    onChange={(e) => setStdAddress(e.target.value)}
                    placeholder="شهرستان، خیابان مطهری..."
                    className="w-full p-2.5 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold shadow-xs transition-colors"
                >
                  {existingMatchedStudent ? 'اتصال پرونده به این مدرسه' : 'ثبت نام دانش‌آموز'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: GRADUATION REGISTRATION */}
      {graduatingStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              <h4 className="font-bold text-slate-900 text-sm">ثبت فارغ‌التحصیلی و قبولی دانشگاه</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              ثبت اطلاعات فراغت از تحصیل برای <strong>{graduatingStudent.name}</strong> (کد ملی: <span className="font-mono">{toPersianDigits(graduatingStudent.nationalCode)}</span>):
            </p>

            <form onSubmit={handleConfirmGraduation} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">سال فارغ‌التحصیلی:</label>
                <input
                  type="text"
                  required
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  placeholder="مثال: ۱۴۰۴-۱۴۰۵"
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">دانشگاه قبولی (در صورت وجود):</label>
                <input
                  type="text"
                  value={gradUni}
                  onChange={(e) => setGradUni(e.target.value)}
                  placeholder="مثال: دانشگاه تهران، دانشگاه صنعتی شریف..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">رشته قبولی:</label>
                  <input
                    type="text"
                    value={gradMajor}
                    onChange={(e) => setGradMajor(e.target.value)}
                    placeholder="مثال: مهندسی برق، دندانپزشکی..."
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">رتبه کنکور (اختیاری):</label>
                  <input
                    type="text"
                    value={gradRank}
                    onChange={(e) => setGradRank(e.target.value)}
                    placeholder="مثال: ۱۲۵"
                    className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">یادداشت و توضیحات:</label>
                <textarea
                  rows={2}
                  value={gradNotes}
                  onChange={(e) => setGradNotes(e.target.value)}
                  placeholder="توضیحات تکمیلی..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGraduatingStudent(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
                >
                  تایید و ثبت فارغ‌التحصیلی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: TRANSFER TO ANOTHER SCHOOL */}
      {transferringSchoolStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-2xl max-w-md w-full border border-slate-200">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
              <LogOut className="w-5 h-5 text-amber-600" />
              <h4 className="font-bold text-slate-900 text-sm">ثبت انتقال دانش‌آموز به مدرسه دیگر</h4>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              ثبت خروج <strong>{transferringSchoolStudent.name}</strong> از مدرسه:
            </p>

            <form onSubmit={handleConfirmSchoolTransfer} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">نام مدرسه مقصد *:</label>
                <input
                  type="text"
                  required
                  value={destSchool}
                  onChange={(e) => setDestSchool(e.target.value)}
                  placeholder="مثال: دبیرستان رازی، هنرستان امام علی..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">تاریخ انتقال پرونده:</label>
                <input
                  type="text"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">علت انتقال:</label>
                <input
                  type="text"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="مثال: تغییر محل سکونت، درخواست خانواده..."
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTransferringSchoolStudent(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-xs"
                >
                  ثبت خروج و انتقال پرونده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: CHANGE CLASS GROUP */}
      {transferringStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-5 rounded-3xl shadow-xl max-w-md w-full border border-slate-200">
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
                  <span className="text-slate-400 text-[11px] font-mono">{toPersianDigits(cls.studentCount)} نفر</span>
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

      {/* SUBMODAL: CREATE CLASS */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white p-5 rounded-3xl shadow-xl max-w-md w-full border border-slate-200">
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
