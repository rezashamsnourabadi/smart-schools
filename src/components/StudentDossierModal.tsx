import React, { useState } from 'react';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Award,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Share2,
  Printer,
  Edit3,
  Save,
  Plus,
  ShieldAlert,
  Send,
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, DisciplinaryRecord } from '../types';
import { toPersianDigits, formatPersianScore } from '../utils/persianUtils';
import { StudentFinancialTab } from './StudentFinancialTab';

interface StudentDossierModalProps {
  student: Student;
  onClose: () => void;
  canEditContact?: boolean;
  canManageDiscipline?: boolean;
  initialTab?: 'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances';
}

export const StudentDossierModal: React.FC<StudentDossierModalProps> = ({
  student,
  onClose,
  canEditContact = false,
  canManageDiscipline = true,
  initialTab = 'profile'
}) => {
  const { classes, updateParentContact, addDisciplinaryRecord, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'reportCards' | 'attendance' | 'discipline' | 'pastYears' | 'finances'>(initialTab);
  
  // Edit contact state
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [editAddress, setEditAddress] = useState(student.address);
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(student.emergencyPhone || '');
  const [editParentPhone, setEditParentPhone] = useState(student.parentPhone);
  const [editBale, setEditBale] = useState(student.parentBaleAccount);

  // New discipline record state
  const [showAddDiscipline, setShowAddDiscipline] = useState(false);
  const [newDiscType, setNewDiscType] = useState<'تشویقی' | 'تذکر' | 'تاخیر'>('تشویقی');
  const [newDiscTitle, setNewDiscTitle] = useState('');
  const [newDiscNote, setNewDiscNote] = useState('');

  const studentClass = classes.find((c) => c.id === student.classGroupId);

  const handleSaveContact = () => {
    updateParentContact(student.id, {
      address: editAddress,
      emergencyPhone: editEmergencyPhone,
      parentPhone: editParentPhone,
      parentBaleAccount: editBale
    });
    setIsEditingContact(false);
  };

  const handleAddDiscipline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDiscTitle.trim()) return;
    addDisciplinaryRecord(student.id, {
      type: newDiscType,
      title: newDiscTitle,
      note: newDiscNote,
      date: '۱۴۰۵/۰۶/۲۲',
      recordedBy: currentUser.name
    });
    setNewDiscTitle('');
    setNewDiscNote('');
    setShowAddDiscipline(false);
  };

  const activeTerm1Card = student.reportCards?.find((r) => r.term === 'term1');
  const activeTerm2Card = student.reportCards?.find((r) => r.term === 'term2');

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-teal-700 via-teal-800 to-cyan-900 text-white p-5 sm:p-6 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            title="بستن پنجره"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-2xl font-black shrink-0 shadow-inner">
              {student.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{student.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-100 text-xs border border-teal-400/30 font-medium">
                  {studentClass?.name || student.grade}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-100 text-xs font-mono">
                  ش.د: {toPersianDigits(student.studentNumber)}
                </span>
              </div>
              <p className="text-teal-100/90 text-xs sm:text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>کد ملی: <strong className="font-mono text-white">{toPersianDigits(student.nationalCode)}</strong></span>
                <span>فرزند: <strong className="text-white">{student.fatherName}</strong></span>
                <span>رشته: <strong className="text-white">{student.fieldOfStudy}</strong></span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs (scrollable on mobile) */}
          <div className="flex items-center gap-1.5 mt-5 overflow-x-auto pb-1 no-scrollbar border-b border-teal-600/50">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'profile'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-teal-100 hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              شناسنامه و اطلاعات تماس
            </button>
            <button
              onClick={() => setActiveTab('reportCards')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'reportCards'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-teal-100 hover:bg-white/10'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              کارنامه‌های تحصیلی
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'attendance'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-teal-100 hover:bg-white/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              وضعیت حضور و غیاب
            </button>
            <button
              onClick={() => setActiveTab('discipline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'discipline'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-teal-100 hover:bg-white/10'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              تشویقی و انضباط ({toPersianDigits(student.disciplinaryRecords?.length || 0)})
            </button>
            <button
              onClick={() => setActiveTab('pastYears')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'pastYears'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-teal-100 hover:bg-white/10'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              سوابق سال‌های گذشته
            </button>
            <button
              onClick={() => setActiveTab('finances')}
              className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'finances'
                  ? 'bg-white text-teal-900 shadow-sm font-bold'
                  : 'text-teal-100 hover:bg-white/10'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              امور مالی و شهریه
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
          {/* TAB 1: Profile & Contacts */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Quick Academic Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-400 text-xs mb-1">معدل نوبت اول</div>
                  <div className="text-xl font-black text-teal-700">
                    {formatPersianScore(activeTerm1Card?.gpa || '—')}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-400 text-xs mb-1">رتبه در کلاس</div>
                  <div className="text-xl font-black text-blue-700">
                    {activeTerm1Card?.rankInClass ? `${toPersianDigits(activeTerm1Card.rankInClass)}` : '—'}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-400 text-xs mb-1">نمره انضباط</div>
                  <div className="text-xl font-black text-emerald-700">
                    {formatPersianScore(activeTerm1Card?.disciplineScore || 20)}
                  </div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-400 text-xs mb-1">تعداد غیبت مجاز</div>
                  <div className="text-xl font-black text-amber-700">
                    {toPersianDigits(student.attendanceStats?.absentDays || 0)} زنگ
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-teal-600" />
                  مشخصات فردی و هویتی
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">نام و نام خانوادگی:</span>
                    <span className="font-semibold text-slate-800">{student.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">کد ملی:</span>
                    <span className="font-mono font-semibold text-slate-800">{toPersianDigits(student.nationalCode)}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">تاریخ تولد:</span>
                    <span className="font-semibold text-slate-800">{toPersianDigits(student.birthDate || '۱۳۸۹/۰۴/۱۵')}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">نام پدر:</span>
                    <span className="font-semibold text-slate-800">{student.fatherName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">پایه و رشته تحصیلی:</span>
                    <span className="font-semibold text-slate-800">{student.grade} - {student.fieldOfStudy}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">کلاس جاری:</span>
                    <span className="font-semibold text-slate-800">{studentClass?.name || student.grade}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Address with Parent Edit Capability */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
                    <Phone className="w-4 h-4 text-teal-600" />
                    اطلاعات اولیا، تماس و سکونت
                  </h3>
                  {canEditContact && !isEditingContact && (
                    <button
                      onClick={() => setIsEditingContact(true)}
                      className="text-xs text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-lg flex items-center gap-1 font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      ویرایش توسط اولیا
                    </button>
                  )}
                </div>

                {isEditingContact ? (
                  <div className="space-y-3 bg-teal-50/50 p-3 rounded-xl border border-teal-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">شماره همراه ولی (جهت دریافت پیامک):</label>
                        <input
                          type="text"
                          value={editParentPhone}
                          onChange={(e) => setEditParentPhone(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">شماره تماس اضطراری:</label>
                        <input
                          type="text"
                          value={editEmergencyPhone}
                          onChange={(e) => setEditEmergencyPhone(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">شناسه پیام‌رسان بله:</label>
                        <input
                          type="text"
                          value={editBale}
                          onChange={(e) => setEditBale(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-left"
                          dir="ltr"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-700 mb-1">نشانی دقیق پستی منزل:</label>
                        <input
                          type="text"
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsEditingContact(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={handleSaveContact}
                        className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium flex items-center gap-1 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        ذخیره تغییرات
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">نام سرپرست/ولی:</span>
                      <span className="font-semibold text-slate-800">{student.parentName}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">شماره همراه ولی:</span>
                      <span className="font-mono font-semibold text-teal-800">{toPersianDigits(student.parentPhone)}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">تماس اضطراری منزل:</span>
                      <span className="font-mono text-slate-800">{toPersianDigits(student.emergencyPhone || '۰۲۱-۵۵۴۲۸۸۹')}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-slate-100">
                      <span className="text-slate-500">حساب پیام‌رسان بله:</span>
                      <span className="font-mono text-cyan-700 font-semibold">{student.parentBaleAccount}</span>
                    </div>
                    <div className="sm:col-span-2 flex flex-col py-1.5">
                      <span className="text-slate-500 mb-1">نشانی سکونت:</span>
                      <span className="font-medium text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                        {toPersianDigits(student.address)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Official Report Cards (کارنامه‌های تحصیلی) */}
          {activeTab === 'reportCards' && (
            <div className="space-y-6">
              {student.reportCards && student.reportCards.length > 0 ? (
                student.reportCards.map((rc, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-teal-300 font-semibold mb-0.5">سال تحصیلی {toPersianDigits(rc.year)}</div>
                        <h4 className="font-bold text-base sm:text-lg">{rc.termTitle}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-left bg-white/10 px-3 py-1.5 rounded-xl">
                          <span className="text-[11px] text-slate-300 block">معدل کل</span>
                          <span className="text-lg font-black text-teal-300">{formatPersianScore(rc.gpa)}</span>
                        </div>
                        <div className="text-left bg-white/10 px-3 py-1.5 rounded-xl">
                          <span className="text-[11px] text-slate-300 block">رتبه کلاسی</span>
                          <span className="text-lg font-black text-white">{toPersianDigits(rc.rankInClass)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-600 border-b border-slate-200 font-medium">
                          <tr>
                            <th className="p-3">ردیف</th>
                            <th className="p-3">عنوان درس</th>
                            <th className="p-3 text-center">واحد</th>
                            <th className="p-3 text-center">نمره مستمر</th>
                            <th className="p-3 text-center">نمره پایانی</th>
                            <th className="p-3 text-center font-bold">نمره نهایی</th>
                            <th className="p-3 text-center">وضعیت</th>
                            <th className="p-3 text-left">دبیر مربوطه</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rc.subjects.map((sub, sIdx) => (
                            <tr key={sIdx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-mono text-slate-400">{toPersianDigits(sIdx + 1)}</td>
                              <td className="p-3 font-semibold text-slate-800">{sub.name}</td>
                              <td className="p-3 text-center font-mono">{toPersianDigits(sub.unit)}</td>
                              <td className="p-3 text-center font-mono font-medium text-slate-700">{formatPersianScore(sub.continuousScore)}</td>
                              <td className="p-3 text-center font-mono font-medium text-slate-700">{formatPersianScore(sub.finalScore)}</td>
                              <td className="p-3 text-center font-mono font-black text-teal-800 bg-teal-50/50">{formatPersianScore(sub.totalScore)}</td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  sub.status === 'قبول' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {sub.status}
                                </span>
                              </td>
                              <td className="p-3 text-left text-slate-500 text-xs">{sub.teacherName}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-800">
                          <tr>
                            <td colSpan={2} className="p-3">نمره انضباط نوبت: {formatPersianScore(rc.disciplineScore)}</td>
                            <td colSpan={4} className="p-3 text-center">معدل کل کارنامه: <span className="text-teal-700 text-base">{formatPersianScore(rc.gpa)}</span></td>
                            <td colSpan={2} className="p-3 text-left text-emerald-700">نتیجه: قبولی خرداد</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-slate-500">
                  کارنامه ثبت‌شده‌ای برای این دانش‌آموز یافت نشد. نمرات مستمر در طول ترم ثبت می‌گردند.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Attendance History */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-emerald-700 font-medium mb-1">روزهای حاضر</div>
                  <div className="text-2xl font-black text-emerald-800">
                    {toPersianDigits(student.attendanceStats?.presentDays || 0)}
                  </div>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-rose-700 font-medium mb-1">غیبت غیرموجه</div>
                  <div className="text-2xl font-black text-rose-800">
                    {toPersianDigits(student.attendanceStats?.absentDays || 0)}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-amber-700 font-medium mb-1">تاخیر ورود</div>
                  <div className="text-2xl font-black text-amber-800">
                    {toPersianDigits(student.attendanceStats?.lateDays || 0)}
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                  <div className="text-xs text-blue-700 font-medium mb-1">غیبت موجه با گواهی</div>
                  <div className="text-2xl font-black text-blue-800">
                    {toPersianDigits(student.attendanceStats?.excusedDays || 0)}
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-sm mb-3">تاریخچه ثبت لحظه‌ای حضور و غیاب</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800">امروز - زنگ اول (ریاضی ۱)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">حاضر در کلاس</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-slate-800">۱۴۰۴/۱۱/۰۴ - زنگ اول (فیزیک ۱)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-medium">۱۰ دقیقه تاخیر (موجه با هماهنگی تلفنی)</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-slate-800">۱۴۰۴/۱۱/۰۳ - زنگ دوم (شیمی ۱)</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">حاضر در کلاس</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Disciplinary & Honors */}
          {activeTab === 'discipline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-sm sm:text-base">سوابق انضباطی، تشویقی‌ها و تقدیرنامه‌ها</h4>
                {canManageDiscipline && (
                  <button
                    onClick={() => setShowAddDiscipline(!showAddDiscipline)}
                    className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    ثبت مورد جدید
                  </button>
                )}
              </div>

              {showAddDiscipline && (
                <form onSubmit={handleAddDiscipline} className="bg-teal-50/70 p-4 rounded-xl border border-teal-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">نوع مورد:</label>
                      <select
                        value={newDiscType}
                        onChange={(e) => setNewDiscType(e.target.value as any)}
                        className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="تشویقی">تشویقی و تقدیرنامه</option>
                        <option value="تذکر">تذکر شفاهی/کتبی</option>
                        <option value="تاخیر">ثبت تاخیر انضباطی</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">عنوان موضوع:</label>
                      <input
                        type="text"
                        placeholder="مثال: رتبه مسابقات علمی، تاخیر مکرر"
                        value={newDiscTitle}
                        onChange={(e) => setNewDiscTitle(e.target.value)}
                        className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-slate-700 mb-1">توضیحات و مصوبه شورا:</label>
                      <textarea
                        rows={2}
                        value={newDiscNote}
                        onChange={(e) => setNewDiscNote(e.target.value)}
                        placeholder="شرح کامل رویداد و اقدامات صورت گرفته..."
                        className="w-full text-xs sm:text-sm p-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDiscipline(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
                    >
                      ثبت در پرونده
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {student.disciplinaryRecords && student.disciplinaryRecords.length > 0 ? (
                  student.disciplinaryRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                        rec.type === 'تشویقی'
                          ? 'bg-emerald-50/80 border-emerald-200'
                          : rec.type === 'تذکر'
                          ? 'bg-rose-50/80 border-rose-200'
                          : 'bg-amber-50/80 border-amber-200'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-white shrink-0 shadow-2xs">
                        {rec.type === 'تشویقی' ? (
                          <Award className="w-5 h-5 text-emerald-600" />
                        ) : rec.type === 'تذکر' ? (
                          <ShieldAlert className="w-5 h-5 text-rose-600" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-800 text-sm">{rec.title}</span>
                          <span className="text-xs text-slate-500 font-mono">{toPersianDigits(rec.date)}</span>
                        </div>
                        <p className="text-slate-600 text-xs leading-relaxed mb-1">{toPersianDigits(rec.note)}</p>
                        <span className="text-[11px] text-slate-400">ثبت‌کننده: {rec.recordedBy}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white p-6 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                    مورد انضباطی یا تشویقی برای این دانش‌آموز ثبت نشده است.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: Past Academic Years */}
          {activeTab === 'pastYears' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-sm mb-3">سوابق تحصیلی دوره‌ها و سال‌های قبل</h4>
              {student.pastYearHistory && student.pastYearHistory.length > 0 ? (
                student.pastYearHistory.map((py, pIdx) => (
                  <div key={pIdx} className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div>
                      <div className="text-xs font-semibold text-teal-700 mb-0.5">{toPersianDigits(py.year)} - {py.grade}</div>
                      <div className="font-bold text-slate-800 text-sm sm:text-base">{py.schoolName}</div>
                      <div className="text-xs text-slate-500 mt-1">وضعیت پایان دوره: <strong className="text-emerald-700">{py.status}</strong></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-400 block">معدل کل</span>
                        <span className="text-base font-black text-teal-800">{formatPersianScore(py.gpa)}</span>
                      </div>
                      <div className="text-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-[11px] text-slate-400 block">انضباط</span>
                        <span className="text-base font-black text-emerald-800">{formatPersianScore(py.disciplineScore)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-6 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
                  اطلاعات دوره‌های گذشته هنوز بایگانی نشده است.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Financial and Tuition */}
          {activeTab === 'finances' && (
            <StudentFinancialTab student={student} />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="text-xs text-slate-500 hidden sm:block">
            سامانه هوشمند مدارس شهرستان • پرونده الکترونیک دانش‌آموز
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-1.5 border border-slate-200 font-medium"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              چاپ کارنامه و پرونده
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-xs bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-xs transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
