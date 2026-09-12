import React, { useState } from 'react';
import {
  X,
  Shield,
  Check,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  GraduationCap,
  Users,
  BookOpen,
  ArrowLeftRight,
  Phone,
  Sparkles,
  School as SchoolIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { VicePrincipalPermissions, VicePrincipalProfile, TeacherProfile } from '../types';
import { toPersianDigits } from '../utils/persianUtils';

interface StaffManagerModalProps {
  onClose: () => void;
}

const COMMON_SUBJECTS = [
  'ریاضی',
  'حسابان',
  'هندسه',
  'فیزیک',
  'شیمی',
  'زیست‌شناسی',
  'دینی و قرآن',
  'عربی',
  'ادبیات فارسی',
  'زبان انگلیسی',
  'تاریخ',
  'جغرافیا',
  'علوم اجتماعی',
  'هنر',
  'تربیت بدنی',
  'کار و فناوری'
];

const VP_ROLE_SUGGESTIONS = [
  'معاون آموزشی',
  'معاون پرورشی و فرهنگی',
  'معاون اجرایی و فناوری',
  'معاون عمومی و امور انضباطی'
];

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({ onClose }) => {
  const {
    currentSchoolId,
    classes,
    vicePrincipals,
    teachers,
    activeVicePrincipalId,
    setActiveVicePrincipalId,
    updateVicePrincipalProfilePermissions,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addVicePrincipal,
    updateVicePrincipal,
    deleteVicePrincipal,
    convertTeacherToVicePrincipal,
    convertVicePrincipalToTeacher
  } = useApp();

  const [activeTab, setActiveTab] = useState<'vice_principals' | 'teachers'>('vice_principals');
  const [expandedVPId, setExpandedVPId] = useState<string | null>(activeVicePrincipalId || 'vp-1');

  // Modal States
  const [showAddVPModal, setShowAddVPModal] = useState(false);
  const [editingVP, setEditingVP] = useState<VicePrincipalProfile | null>(null);

  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);

  const [convertingTeacher, setConvertingTeacher] = useState<TeacherProfile | null>(null);
  const [convertingVP, setConvertingVP] = useState<VicePrincipalProfile | null>(null);

  // Form States for VP
  const [vpName, setVpName] = useState('');
  const [vpPhone, setVpPhone] = useState('');
  const [vpRoleTitle, setVpRoleTitle] = useState('معاون آموزشی');
  const [vpPermissions, setVpPermissions] = useState<VicePrincipalPermissions>({
    canManageAnnouncements: true,
    canManageSchedule: true,
    canManageStudentsAndClasses: true,
    canViewFullDossier: true,
    canLogDisciplinary: true
  });

  // Form States for Teacher
  const [tName, setTName] = useState('');
  const [tPhone, setTPhone] = useState('');
  const [tRoleTitle, setTRoleTitle] = useState('دبیر رسمی');
  const [tSubjects, setTSubjects] = useState<string[]>([]);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [tAssignedClassIds, setTAssignedClassIds] = useState<string[]>([]);

  // Conversion States
  const [targetVPRole, setTargetVPRole] = useState('معاون آموزشی');
  const [targetTSubjects, setTargetTSubjects] = useState<string[]>(['دینی']);
  const [targetTClasses, setTargetTClasses] = useState<string[]>([]);

  const schoolClasses = classes.filter((c) => c.schoolId === currentSchoolId);
  const schoolVPs = vicePrincipals.filter((vp) => vp.schoolId === currentSchoolId || !vp.schoolId);
  const schoolTeachers = teachers.filter((t) => t.schoolId === currentSchoolId || !t.schoolId);

  const permissionItems: { key: keyof VicePrincipalPermissions; title: string; desc: string }[] = [
    {
      key: 'canManageAnnouncements',
      title: 'انتشار و مدیریت اطلاعیه‌ها و اخبار',
      desc: 'ثبت اخبار آموزشگاه و ارسال اعلانات به اولیا و دانش‌آموزان'
    },
    {
      key: 'canManageSchedule',
      title: 'چیدمان و تغییر برنامه هفتگی دروس',
      desc: 'جابجایی ساعات، تخصیص دبیران و ویرایش برنامه کلاسی'
    },
    {
      key: 'canManageStudentsAndClasses',
      title: 'کلاس‌بندی، ثبت‌نام و مدیریت دانش‌آموزان',
      desc: 'افزودن دانش‌آموز، تغییر کلاس، فارغ‌التحصیلی و سوابق انتقالی'
    },
    {
      key: 'canViewFullDossier',
      title: 'مشاهده پرونده جامع و سوابق تحصیلی',
      desc: 'دسترسی کامل به نمرات، شناسنامه سلامت و سوابق سال‌های گذشته'
    },
    {
      key: 'canLogDisciplinary',
      title: 'ثبت موارد انضباطی و تشویقی‌ها',
      desc: 'درج تشویقی، تذکر و اطلاع‌رسانی خودکار به اولیا از طریق بله و پیامک'
    }
  ];

  const handleToggleVPPermission = (vpId: string, key: keyof VicePrincipalPermissions) => {
    const targetVP = vicePrincipals.find((vp) => vp.id === vpId);
    if (!targetVP) return;
    const currentVal = targetVP.permissions[key];
    updateVicePrincipalProfilePermissions(vpId, {
      [key]: !currentVal
    });
  };

  // VP Add/Edit Handlers
  const openAddVP = () => {
    setEditingVP(null);
    setVpName('');
    setVpPhone('۰۹۱۲-');
    setVpRoleTitle('معاون آموزشی');
    setVpPermissions({
      canManageAnnouncements: true,
      canManageSchedule: true,
      canManageStudentsAndClasses: true,
      canViewFullDossier: true,
      canLogDisciplinary: true
    });
    setShowAddVPModal(true);
  };

  const openEditVP = (vp: VicePrincipalProfile) => {
    setEditingVP(vp);
    setVpName(vp.name);
    setVpPhone(vp.phone);
    setVpRoleTitle(vp.roleTitle);
    setVpPermissions(vp.permissions);
    setShowAddVPModal(true);
  };

  const handleSaveVP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpName.trim()) return;

    if (editingVP) {
      updateVicePrincipal(editingVP.id, {
        name: vpName.trim(),
        phone: vpPhone.trim() || '۰۹۱۲-۰۰۰-۰۰۰۰',
        roleTitle: vpRoleTitle.trim(),
        permissions: vpPermissions
      });
    } else {
      addVicePrincipal({
        name: vpName.trim(),
        phone: vpPhone.trim() || '۰۹۱۲-۰۰۰-۰۰۰۰',
        roleTitle: vpRoleTitle.trim(),
        schoolId: currentSchoolId,
        avatarBg: 'bg-teal-600',
        permissions: vpPermissions
      });
    }
    setShowAddVPModal(false);
  };

  // Teacher Add/Edit Handlers
  const openAddTeacher = () => {
    setEditingTeacher(null);
    setTName('');
    setTPhone('۰۹۱۲-');
    setTRoleTitle('دبیر رسمی');
    setTSubjects(['ریاضی']);
    setTAssignedClassIds(schoolClasses.slice(0, 1).map((c) => c.id));
    setShowAddTeacherModal(true);
  };

  const openEditTeacher = (teacher: TeacherProfile) => {
    setEditingTeacher(teacher);
    setTName(teacher.name);
    setTPhone(teacher.phone);
    setTRoleTitle(teacher.roleTitle || 'دبیر رسمی');
    setTSubjects(teacher.teachingSubjects || []);
    setTAssignedClassIds(teacher.assignedClassIds || []);
    setShowAddTeacherModal(true);
  };

  const handleToggleSubject = (subj: string) => {
    if (tSubjects.includes(subj)) {
      if (tSubjects.length > 1) {
        setTSubjects(tSubjects.filter((s) => s !== subj));
      }
    } else {
      setTSubjects([...tSubjects, subj]);
    }
  };

  const handleAddCustomSubject = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (customSubjectInput.trim() && !tSubjects.includes(customSubjectInput.trim())) {
      setTSubjects([...tSubjects, customSubjectInput.trim()]);
      setCustomSubjectInput('');
    }
  };

  const handleToggleClass = (classId: string) => {
    if (tAssignedClassIds.includes(classId)) {
      setTAssignedClassIds(tAssignedClassIds.filter((id) => id !== classId));
    } else {
      setTAssignedClassIds([...tAssignedClassIds, classId]);
    }
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;

    if (editingTeacher) {
      updateTeacher(editingTeacher.id, {
        name: tName.trim(),
        phone: tPhone.trim() || '۰۹۱۲-۰۰۰-۰۰۰۰',
        roleTitle: tRoleTitle.trim(),
        teachingSubjects: tSubjects.length > 0 ? tSubjects : ['عمومی'],
        assignedClassIds: tAssignedClassIds
      });
    } else {
      addTeacher({
        name: tName.trim(),
        phone: tPhone.trim() || '۰۹۱۲-۰۰۰-۰۰۰۰',
        roleTitle: tRoleTitle.trim(),
        schoolId: currentSchoolId,
        avatarBg: 'bg-indigo-600',
        teachingSubjects: tSubjects.length > 0 ? tSubjects : ['عمومی'],
        assignedClassIds: tAssignedClassIds
      });
    }
    setShowAddTeacherModal(false);
  };

  // Convert Role Handlers
  const handleConfirmConvertToVP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingTeacher) return;
    convertTeacherToVicePrincipal(convertingTeacher.id, targetVPRole);
    setConvertingTeacher(null);
  };

  const handleConfirmConvertToTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingVP) return;
    convertVicePrincipalToTeacher(convertingVP.id, targetTSubjects, targetTClasses);
    setConvertingVP(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div
        className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                مدیریت جامع کادر مدرسه و دبیران
              </h3>
              <p className="text-xs text-slate-400">
                مدیریت و تفویض اختیارات معاونین، تخصیص چندگانه دروس و کلاس‌های معلمان
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
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('vice_principals')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'vice_principals'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-teal-600" />
              <span>معاونین آموزشگاه</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-800">
                {toPersianDigits(schoolVPs.length)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'teachers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>دبیران و اساتید</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-800">
                {toPersianDigits(schoolTeachers.length)}
              </span>
            </button>
          </div>

          <div>
            {activeTab === 'vice_principals' ? (
              <button
                onClick={openAddVP}
                className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن معاون جدید</span>
              </button>
            ) : (
              <button
                onClick={openAddTeacher}
                className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن دبیر جدید</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50">
          {/* TAB 1: VICE PRINCIPALS */}
          {activeTab === 'vice_principals' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200/80 text-xs text-teal-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    تعیین اختیارات هر معاون به صورت اختصاصی انجام می‌شود. با زدن دکمه <strong>«تنظیم اختیارات»</strong>، سطوح دسترسی او را فعال یا غیرفعال فرمایید.
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {schoolVPs.map((vp) => {
                  const isExpanded = expandedVPId === vp.id;
                  const grantedCount = Object.values(vp.permissions).filter(Boolean).length;

                  return (
                    <div
                      key={vp.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-teal-300 transition-all text-right"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${vp.avatarBg || 'bg-teal-600'} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                          >
                            {vp.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">{vp.name}</h4>
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                                {vp.roleTitle}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{toPersianDigits(vp.phone)}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-sans text-[11px] text-teal-700">
                                {toPersianDigits(grantedCount)} دسترسی از {toPersianDigits(5)} دسترسی فعال
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
                          <button
                            onClick={() => {
                              setExpandedVPId(isExpanded ? null : vp.id);
                              setActiveVicePrincipalId(vp.id);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                              isExpanded
                                ? 'bg-teal-700 text-white'
                                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
                            }`}
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>{isExpanded ? 'بستن دسترسی‌ها' : 'تنظیم اختیارات'}</span>
                          </button>

                          <button
                            onClick={() => openEditVP(vp)}
                            title="ویرایش عنوان و شماره"
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setConvertingVP(vp);
                              setTargetTSubjects(['دینی']);
                              setTargetTClasses(schoolClasses.slice(0, 1).map((c) => c.id));
                            }}
                            title="تغییر نقش به دبیر"
                            className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors flex items-center gap-1 text-[11px] font-bold px-2"
                          >
                            <ArrowLeftRight className="w-3 h-3 text-amber-600" />
                            <span className="hidden sm:inline">انتقال به تدریس</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`آیا از حذف ${vp.name} از کادر معاونین اطمینان دارید؟`)) {
                                deleteVicePrincipal(vp.id);
                              }
                            }}
                            title="حذف معاون"
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Granular Permissions Expandable Section */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 space-y-2 animate-in fade-in">
                          <p className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-teal-600" />
                            <span>دسترسی‌های اختصاصی این معاون:</span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {permissionItems.map((perm) => {
                              const isGranted = vp.permissions[perm.key];
                              return (
                                <div
                                  key={perm.key}
                                  onClick={() => handleToggleVPPermission(vp.id, perm.key)}
                                  className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer select-none flex items-start justify-between gap-2.5 ${
                                    isGranted
                                      ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                                      : 'bg-slate-50 border-slate-200 text-slate-500 opacity-80'
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-bold flex items-center gap-1.5">
                                      {isGranted ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      ) : (
                                        <X className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      )}
                                      <span>{perm.title}</span>
                                    </div>
                                    <p className="text-[10px] opacity-75 mt-0.5 leading-relaxed">
                                      {perm.desc}
                                    </p>
                                  </div>
                                  <div
                                    className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                                      isGranted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-transparent'
                                    }`}
                                  >
                                    <Check className="w-3 h-3" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: TEACHERS */}
          {activeTab === 'teachers' && (
            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 text-xs text-indigo-900 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    هر دبیر می‌تواند همزمان <strong>چندین درس</strong> (مثلاً هم دینی و هم عربی) و <strong>چندین کلاس</strong> (مثلاً دهم ریاضی الف و یازدهم تجربی ب) داشته باشد.
                  </span>
                </span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {schoolTeachers.map((teacher) => {
                  const assignedClasses = schoolClasses.filter((c) =>
                    teacher.assignedClassIds?.includes(c.id)
                  );

                  return (
                    <div
                      key={teacher.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs hover:border-indigo-300 transition-all text-right"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl ${teacher.avatarBg || 'bg-indigo-600'} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                          >
                            {teacher.name.slice(0, 2)}
                          </div>
                          <div className="space-y-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-sm text-slate-900">{teacher.name}</h4>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200">
                                  {teacher.roleTitle || 'دبیر رسمی'}
                                </span>
                              </div>
                              <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{toPersianDigits(teacher.phone)}</span>
                              </div>
                            </div>

                            {/* Teaching Subjects (Multiple) */}
                            <div>
                              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                                دروس تحت تدریس:
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {teacher.teachingSubjects && teacher.teachingSubjects.length > 0 ? (
                                  teacher.teachingSubjects.map((subj, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1"
                                    >
                                      <BookOpen className="w-3 h-3 text-teal-600" />
                                      {subj}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">هنوز درسی تخصیص نیافته</span>
                                )}
                              </div>
                            </div>

                            {/* Assigned Classes (Multiple) */}
                            <div>
                              <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                                کلاس‌های کلاسی دبیر:
                              </span>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {assignedClasses.length > 0 ? (
                                  assignedClasses.map((cls) => (
                                    <span
                                      key={cls.id}
                                      className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1"
                                    >
                                      <SchoolIcon className="w-3 h-3 text-slate-500" />
                                      {cls.name} ({cls.grade})
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-slate-400 italic">کلاسی اختصاص نیافته</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-start flex-wrap">
                          <button
                            onClick={() => openEditTeacher(teacher)}
                            className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>ویرایش دروس و کلاس‌ها</span>
                          </button>

                          <button
                            onClick={() => {
                              setConvertingTeacher(teacher);
                              setTargetVPRole('معاون آموزشی');
                            }}
                            title="ارتقا به معاونت"
                            className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors flex items-center gap-1 text-[11px] font-bold px-2"
                          >
                            <ArrowLeftRight className="w-3 h-3 text-amber-600" />
                            <span className="hidden sm:inline">ارتقا به معاونت</span>
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`آیا از حذف ${teacher.name} از کادر دبیران اطمینان دارید؟`)) {
                                deleteTeacher(teacher.id);
                              }
                            }}
                            title="حذف دبیر"
                            className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>کادر فعال آموزشگاه: {toPersianDigits(schoolVPs.length)} معاون • {toPersianDigits(schoolTeachers.length)} دبیر</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            بستن پنجره
          </button>
        </div>
      </div>

      {/* SUB-MODAL: Add / Edit Vice Principal */}
      {showAddVPModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900">
                {editingVP ? 'ویرایش مشخصات معاون' : 'افزودن معاون جدید به آموزشگاه'}
              </h4>
              <button
                onClick={() => setShowAddVPModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveVP} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">نام و نام خانوادگی</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: آقای حمید مرادی"
                  value={vpName}
                  onChange={(e) => setVpName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">شماره تماس (جهت ورود و پیامک)</label>
                <input
                  type="text"
                  required
                  placeholder="۰۹۱۲-۳۴۵-۶۷۸۹"
                  value={vpPhone}
                  onChange={(e) => setVpPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">عنوان سازمانی معاونت</label>
                <input
                  type="text"
                  required
                  value={vpRoleTitle}
                  onChange={(e) => setVpRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none mb-1.5"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {VP_ROLE_SUGGESTIONS.map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setVpRoleTitle(role)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddVPModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingVP ? 'ذخیره تغییرات' : 'افزودن معاون'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Add / Edit Teacher (Multiple Subjects & Multiple Classes) */}
      {showAddTeacherModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4 text-right max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900">
                {editingTeacher ? 'ویرایش مشخصات و دروس دبیر' : 'افزودن دبیر جدید به آموزشگاه'}
              </h4>
              <button
                onClick={() => setShowAddTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نام و نام خانوادگی دبیر</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: استاد علیرضا احمدی"
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">شماره تماس</label>
                  <input
                    type="text"
                    required
                    placeholder="۰۹۱۲-۰۰۰-۰۰۰۰"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">نوع همکاری</label>
                <select
                  value={tRoleTitle}
                  onChange={(e) => setTRoleTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="دبیر رسمی">دبیر رسمی آموزش و پرورش</option>
                  <option value="دبیر تخصصی">دبیر تخصصی کنکور و المپیاد</option>
                  <option value="دبیر حق‌التدریس">دبیر حق‌التدریس / مدعو</option>
                  <option value="سرگروه آموزشی">سرگروه آموزشی منطقه</option>
                </select>
              </div>

              {/* Multiple Subjects Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    انتخاب دروس تدریسی دبیر (چند درس):
                  </label>
                  <span className="text-[11px] text-teal-700 font-bold">
                    {toPersianDigits(tSubjects.length)} درس انتخاب شده
                  </span>
                </div>

                {/* Common subjects chips */}
                <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {COMMON_SUBJECTS.map((subj) => {
                    const isSelected = tSubjects.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => handleToggleSubject(subj)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-teal-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{subj}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Subject Input */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="درج درس دیگر (مثال: مبانی رایانه، زمین‌شناسی)..."
                    value={customSubjectInput}
                    onChange={(e) => setCustomSubjectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomSubject(e);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs hover:bg-slate-700"
                  >
                    افزودن
                  </button>
                </div>
              </div>

              {/* Multiple Classes Selection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800">
                    کلاس‌های منتسب به دبیر (چند کلاس):
                  </label>
                  <span className="text-[11px] text-indigo-700 font-bold">
                    {toPersianDigits(tAssignedClassIds.length)} کلاس انتخاب شده
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {schoolClasses.map((cls) => {
                    const isSelected = tAssignedClassIds.includes(cls.id);
                    return (
                      <div
                        key={cls.id}
                        onClick={() => handleToggleClass(cls.id)}
                        className={`p-2 rounded-xl border text-right transition-all cursor-pointer select-none flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <SchoolIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                          <span>{cls.name}</span>
                          <span className="text-[10px] font-normal text-slate-500">({cls.grade})</span>
                        </div>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-transparent'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTeacherModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-700 text-white font-bold hover:bg-indigo-800 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingTeacher ? 'ذخیره مشخصات' : 'افزودن دبیر'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Promote Teacher to Vice Principal */}
      {convertingTeacher && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2 text-amber-600">
              <ArrowLeftRight className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">ارتقای نقش به معاونت مدرسه</h4>
            </div>
            <p className="text-xs text-slate-600">
              شما در حال انتصاب <strong>{convertingTeacher.name}</strong> از کادر دبیران به کادر معاونت آموزشگاه هستید.
            </p>

            <form onSubmit={handleConfirmConvertToVP} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">عنوان سازمانی معاونت</label>
                <select
                  value={targetVPRole}
                  onChange={(e) => setTargetVPRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {VP_ROLE_SUGGESTIONS.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertingTeacher(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-700 text-white font-bold hover:bg-teal-800"
                >
                  تایید انتصاب به عنوان معاون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Convert Vice Principal to Teacher */}
      {convertingVP && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2 text-indigo-600">
              <ArrowLeftRight className="w-5 h-5" />
              <h4 className="font-bold text-sm text-slate-900">انتقال معاون به کادر تدریس</h4>
            </div>
            <p className="text-xs text-slate-600">
              شما در حال تغییر نقش <strong>{convertingVP.name}</strong> ({convertingVP.roleTitle}) به دبیر آموزشگاه هستید.
            </p>

            <form onSubmit={handleConfirmConvertToTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">درس یا دروس تدریسی</label>
                <div className="flex items-center gap-1.5 flex-wrap p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {['دینی', 'عربی', 'ادبیات', 'ریاضی', 'فیزیک'].map((s) => {
                    const isSelected = targetTSubjects.includes(s);
                    return (
                      <button
                        type="button"
                        key={s}
                        onClick={() => {
                          if (isSelected) {
                            if (targetTSubjects.length > 1) {
                              setTargetTSubjects(targetTSubjects.filter((x) => x !== s));
                            }
                          } else {
                            setTargetTSubjects([...targetTSubjects, s]);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isSelected ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700 border border-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">کلاس‌های تدریسی</label>
                <div className="space-y-1 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {schoolClasses.map((cls) => {
                    const isSelected = targetTClasses.includes(cls.id);
                    return (
                      <div
                        key={cls.id}
                        onClick={() => {
                          if (isSelected) setTargetTClasses(targetTClasses.filter((id) => id !== cls.id));
                          else setTargetTClasses([...targetTClasses, cls.id]);
                        }}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer flex items-center justify-between ${
                          isSelected ? 'bg-indigo-50 border-indigo-300 font-bold text-indigo-900' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{cls.name}</span>
                        {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertingVP(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-700 text-white font-bold hover:bg-indigo-800"
                >
                  تایید انتقال به کادر تدریس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
