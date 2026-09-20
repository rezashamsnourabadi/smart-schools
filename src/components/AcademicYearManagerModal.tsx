import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  CalendarRange,
  CalendarCheck,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  GraduationCap,
  History,
  Archive,
  Plus,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  ChevronLeft,
  FileCheck,
  RotateCcw,
  Check
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianUtils';
import { AcademicTermId, AcademicYear } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AcademicYearManagerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    academicYears,
    activeAcademicYearId,
    activeAcademicYear,
    activeTerm,
    setActiveAcademicYearId,
    setActiveTermId,
    addAcademicYear,
    rolloverAcademicYear,
    students,
    classes,
    currentSchool
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'rollover' | 'create'>('overview');

  // Rollover wizard state
  const currentTitle = activeAcademicYear?.title || '۱۴۰۴-۱۴۰۵';
  const getNextYearDefault = () => {
    const parts = currentTitle.split('-');
    if (parts.length === 2) {
      const p1 = parseInt(parts[0].replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]));
      const p2 = parseInt(parts[1].replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]));
      if (!isNaN(p1) && !isNaN(p2)) {
        return toPersianDigits(`${p1 + 1}-${p2 + 1}`);
      }
    }
    return '۱۴۰۵-۱۴۰۶';
  };

  const [newYearTitle, setNewYearTitle] = useState(getNextYearDefault());
  const [promoteStudents, setPromoteStudents] = useState(true);
  const [graduateTwelfthGraders, setGraduateTwelfthGraders] = useState(true);
  const [archiveCurrentGrades, setArchiveCurrentGrades] = useState(true);
  const [resetAttendanceLogs, setResetAttendanceLogs] = useState(true);
  const [isConfirmingRollover, setIsConfirmingRollover] = useState(false);

  // New Planned Year state
  const [createYearTitle, setCreateYearTitle] = useState('');
  const [createStartDate, setCreateStartDate] = useState('۱۴۰۵/۰۷/۰۱');
  const [createEndDate, setCreateEndDate] = useState('۱۴۰۶/۰۶/۳۱');
  const [createDesc, setCreateDesc] = useState('');

  if (!isOpen) return null;

  // School-specific active students stats
  const activeStudents = students.filter(
    (s) => s.schoolId === currentSchool?.id && (s.status === 'active' || !s.status)
  );
  const tenthGradersCount = activeStudents.filter((s) => s.grade.includes('دهم') || s.grade.includes('10')).length;
  const eleventhGradersCount = activeStudents.filter((s) => s.grade.includes('یازدهم') || s.grade.includes('11')).length;
  const twelfthGradersCount = activeStudents.filter((s) => s.grade.includes('دوازدهم') || s.grade.includes('12')).length;

  const handleExecuteRollover = () => {
    rolloverAcademicYear({
      newYearTitle: newYearTitle.trim() || getNextYearDefault(),
      promoteStudents,
      graduateTwelfthGraders,
      archiveCurrentGrades,
      resetAttendanceLogs
    });
    setIsConfirmingRollover(false);
    setActiveTab('overview');
  };

  const handleCreatePlannedYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createYearTitle.trim()) return;

    const startPart = createYearTitle.split('-')[0] || '۱۴۰۵';
    const endPart = createYearTitle.split('-')[1] || '۱۴۰۶';

    addAcademicYear({
      title: createYearTitle.trim(),
      startDate: createStartDate || `${startPart}/۰۷/۰۱`,
      endDate: createEndDate || `${endPart}/۰۶/۳۱`,
      status: 'planned',
      currentTermId: 'term1',
      terms: [
        { id: 'term1', title: 'نوبت اول (مهر تا دی)', startDate: `${startPart}/۰۷/۰۱`, endDate: `${startPart}/۱۰/۳۰`, isCurrent: true },
        { id: 'term2', title: 'نوبت دوم (بهمن تا خرداد)', startDate: `${startPart}/۱۱/۰۱`, endDate: `${endPart}/۰۳/۳۱`, isCurrent: false },
        { id: 'summer', title: 'دوره تابستان', startDate: `${endPart}/۰۴/۰۱`, endDate: `${endPart}/۰۶/۳۱`, isCurrent: false }
      ],
      description: createDesc.trim() || `سال تحصیلی پیشنهادی (${createYearTitle.trim()})`
    });

    setCreateYearTitle('');
    setCreateDesc('');
    setActiveTab('overview');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto w-full max-w-full">
      <div
        id="academic-year-manager-modal"
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 m-auto"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <CalendarRange className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  مدیریت سال و تقویم تحصیلی
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  سال فعال: {toPersianDigits(activeAcademicYear?.title || '')}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تعیین نوبت‌های درسی، سال‌بندی، ارتقای پایه‌ها و بایگانی سوابق نمرات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>وضعیت و سال‌های تحصیلی</span>
          </button>

          <button
            onClick={() => setActiveTab('rollover')}
            className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'rollover'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>پایان سال و آغاز سال جدید (سال‌بندی)</span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`pb-3 px-3 transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'border-teal-700 text-teal-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>تعریف سال تحصیلی آینده</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* TAB 1: OVERVIEW & TERMS */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-in fade-in">
              {/* Active Academic Year Hero Card */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-teal-800 to-slate-900 text-white shadow-md relative overflow-hidden">
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold text-teal-200">
                        سال تحصیلی جاری و رسمی آموزشگاه:
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-700/80 border border-teal-500/50 text-[11px] font-mono font-bold">
                      شروع: {toPersianDigits(activeAcademicYear?.startDate || '')} تا{' '}
                      {toPersianDigits(activeAcademicYear?.endDate || '')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                      سال تحصیلی {toPersianDigits(activeAcademicYear?.title || '')}
                    </h3>
                    <p className="text-xs text-teal-100/80 mt-1">
                      {activeAcademicYear?.description || 'تمامی فرایندهای جاری حضور و غیاب، نمرات و کلاس‌ها در این سال انجام می‌شود.'}
                    </p>
                  </div>

                  {/* Active Term Selector Bar */}
                  <div className="pt-2 border-t border-teal-700/50">
                    <div className="text-xs font-bold text-teal-200 mb-2">
                      انتخاب نوبت تحصیلی جاری (تغییر وضعیت نوبت):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'term1' as AcademicTermId, title: 'نوبت اول (مهر تا دی)', desc: 'ثبت نمرات مستمر و دی‌ماه' },
                        { id: 'term2' as AcademicTermId, title: 'نوبت دوم (بهمن تا خرداد)', desc: 'ثبت نمرات پایانی و خرداد' },
                        { id: 'summer' as AcademicTermId, title: 'دوره تابستان', desc: 'کلاس‌های جبرانی و آزمون شهریور' }
                      ].map((term) => {
                        const isSelected = activeAcademicYear?.currentTermId === term.id;
                        return (
                          <button
                            key={term.id}
                            onClick={() => setActiveTermId(term.id)}
                            className={`p-2.5 rounded-2xl text-right transition-all border ${
                              isSelected
                                ? 'bg-white text-teal-950 border-white shadow-xs font-bold'
                                : 'bg-teal-900/50 text-teal-100 border-teal-700/60 hover:bg-teal-900/80'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span>{term.title}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-700" />}
                            </div>
                            <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-teal-700' : 'text-teal-300'}`}>
                              {term.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* All Registered Academic Years List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-400" />
                    <span>آرشیو و فهرست کلیه سال‌های تحصیلی</span>
                  </h4>
                  <span className="text-xs text-slate-400">
                    {toPersianDigits(academicYears.length)} سال ثبت شده
                  </span>
                </div>

                <div className="space-y-2.5">
                  {academicYears.map((ay) => {
                    const isCurrent = ay.isCurrent;
                    const isViewing = ay.id === activeAcademicYearId;

                    return (
                      <div
                        key={ay.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isViewing
                            ? 'bg-teal-50/50 border-teal-300 shadow-2xs'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isCurrent
                                ? 'bg-emerald-100 text-emerald-800'
                                : ay.status === 'archived'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-cyan-100 text-cyan-800'
                            }`}
                          >
                            {isCurrent ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : ay.status === 'archived' ? (
                              <Archive className="w-4 h-4" />
                            ) : (
                              <Clock className="w-4 h-4" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm sm:text-base text-slate-900">
                                سال تحصیلی {toPersianDigits(ay.title)}
                              </span>
                              {isCurrent ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  سال جاری
                                </span>
                              ) : ay.status === 'archived' ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  بایگانی شده
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800">
                                  برنامه‌ریزی آینده
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {ay.description || `بازه زمانی: ${toPersianDigits(ay.startDate)} تا ${toPersianDigits(ay.endDate)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {isViewing ? (
                            <span className="text-xs font-bold text-teal-800 bg-teal-100/70 px-3 py-1.5 rounded-xl border border-teal-200 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              در حال نمایش
                            </span>
                          ) : (
                            <button
                              onClick={() => setActiveAcademicYearId(ay.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1"
                            >
                              <span>مرور اطلاعات این سال</span>
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: YEAR ROLLOVER / PROMOTION WIZARD */}
          {activeTab === 'rollover' && (
            <div className="space-y-5 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <div className="font-bold text-sm mb-0.5">فرآیند سال‌بندی و انتقال به سال تحصیلی جدید</div>
                  این فرآیند سال تحصیلی جاری ({toPersianDigits(currentTitle)}) را به عنوان آرشیو ذخیره کرده و سال تحصیلی جدید را رسماً آغاز می‌کند. گزینه‌های زیر به شما اجازه می‌دهند ارتقای پایه‌ها و بایگانی نمرات را با یک کلیک انجام دهید.
                </div>
              </div>

              {/* Step 1: Next Year Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  عنوان سال تحصیلی جدید:
                </label>
                <input
                  type="text"
                  value={newYearTitle}
                  onChange={(e) => setNewYearTitle(e.target.value)}
                  placeholder="مثال: ۱۴۰۵-۱۴۰۶"
                  className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 bg-white"
                />
                <p className="text-[11px] text-slate-400">
                  سیستم به طور خودکار بازه مهر تا شهریور این سال را به عنوان سال رسمی جدید تنظیم خواهد کرد.
                </p>
              </div>

              {/* Step 2: Automated Smart Operations Checkboxes */}
              <div className="space-y-2.5 pt-1">
                <div className="text-xs font-bold text-slate-800">
                  عملیات‌های سیستمی و خودکار سال‌بندی:
                </div>

                {/* Option 1: Promote Students */}
                <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white cursor-pointer flex items-start gap-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={promoteStudents}
                    onChange={(e) => setPromoteStudents(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600 mt-0.5"
                  />
                  <div className="text-xs space-y-0.5 flex-1">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>ارتقای خودکار پایه دانش‌آموزان در حال تحصیل</span>
                      <span className="text-[11px] font-mono text-teal-800 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                        {toPersianDigits(tenthGradersCount + eleventhGradersCount)} دانش‌آموز
                      </span>
                    </div>
                    <div className="text-slate-500">
                      دانش‌آموزان پایه دهم به یازدهم و دانش‌آموزان یازدهم به پایه دوازدهم ارتقا می‌یابند.
                    </div>
                  </div>
                </label>

                {/* Option 2: Graduate 12th Graders */}
                <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white cursor-pointer flex items-start gap-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={graduateTwelfthGraders}
                    onChange={(e) => setGraduateTwelfthGraders(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600 mt-0.5"
                  />
                  <div className="text-xs space-y-0.5 flex-1">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>انتقال دانش‌آموزان پایه دوازدهم به فهرست فارغ‌التحصیلان</span>
                      <span className="text-[11px] font-mono text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                        {toPersianDigits(twelfthGradersCount)} فارغ‌التحصیل
                      </span>
                    </div>
                    <div className="text-slate-500">
                      دانش‌آموزان دوازدهم با حفظ کامل کارنامه نهایی و سوابق در بخش فارغ‌التحصیلان مدرسه ثبت می‌شوند.
                    </div>
                  </div>
                </label>

                {/* Option 3: Archive Grades */}
                <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white cursor-pointer flex items-start gap-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={archiveCurrentGrades}
                    onChange={(e) => setArchiveCurrentGrades(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600 mt-0.5"
                  />
                  <div className="text-xs space-y-0.5 flex-1">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>انجماد و ذخیره معدل سال جاری در کارپوشه سوابق تحصیلی دانش‌آموزان</span>
                      <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        آرشیو دائمی
                      </span>
                    </div>
                    <div className="text-slate-500">
                      معدل، رتبه و کارنامه‌های سال جاری در بخش سوابق سال‌های پیشین پرونده هر دانش‌آموز ثبت می‌شود.
                    </div>
                  </div>
                </label>

                {/* Option 4: Reset Attendance */}
                <label className="p-3.5 rounded-2xl border border-slate-200 hover:border-teal-400 bg-slate-50/50 hover:bg-white cursor-pointer flex items-start gap-3 transition-colors">
                  <input
                    type="checkbox"
                    checked={resetAttendanceLogs}
                    onChange={(e) => setResetAttendanceLogs(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-700 focus:ring-teal-600 mt-0.5"
                  />
                  <div className="text-xs space-y-0.5 flex-1">
                    <div className="font-bold text-slate-900">
                      آغاز دوره حضور و غیاب جدید (ریست شمارنده‌های روزانه)
                    </div>
                    <div className="text-slate-500">
                      جلسات حضور و غیاب برای سال جدید با شمارنده‌های صفر آغاز شده و سابقه سال گذشته در پرونده‌ها محفوظ می‌ماند.
                    </div>
                  </div>
                </label>
              </div>

              {/* Final Confirmation and Action */}
              <div className="pt-3 border-t border-slate-200">
                {!isConfirmingRollover ? (
                  <button
                    onClick={() => setIsConfirmingRollover(true)}
                    className="w-full py-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>آغاز سال تحصیلی جدید ({toPersianDigits(newYearTitle)})</span>
                  </button>
                ) : (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
                    <div className="text-xs text-rose-900 font-bold leading-relaxed">
                      ⚠️ آیا از پایان رسمی سال تحصیلی {toPersianDigits(currentTitle)} و آغاز سال تحصیلی {toPersianDigits(newYearTitle)} اطمینان دارید؟
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleExecuteRollover}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors"
                      >
                        بله، اجرا و سال‌بندی انجام شود
                      </button>
                      <button
                        onClick={() => setIsConfirmingRollover(false)}
                        className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 transition-colors"
                      >
                        انصراف
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CREATE PLANNED YEAR */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreatePlannedYear} className="space-y-4 animate-in fade-in">
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                در صورتی که قصد دارید سال تحصیلی آینده را برای برنامه‌ریزی زودهنگام، پیش‌ثبت‌نام یا چیدمان تقویم تعریف کنید، می‌توانید مشخصات آن را در این بخش ثبت فرمایید.
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">عنوان سال تحصیلی *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ۱۴۰۶-۱۴۰۷"
                  value={createYearTitle}
                  onChange={(e) => setCreateYearTitle(e.target.value)}
                  className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تاریخ شروع رسمی (اول مهر)</label>
                  <input
                    type="text"
                    value={createStartDate}
                    onChange={(e) => setCreateStartDate(e.target.value)}
                    className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">تاریخ پایان رسمی (پایان شهریور)</label>
                  <input
                    type="text"
                    value={createEndDate}
                    onChange={(e) => setCreateEndDate(e.target.value)}
                    className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">توضیحات و یادداشت سال</label>
                <textarea
                  rows={3}
                  placeholder="توضیحات مربوط به ظرفیت‌های سال آینده، برنامه‌ریزی المپیاد یا هدایت تحصیلی..."
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-none text-slate-900 bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت سال تحصیلی در تقویم آموزشگاه</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
