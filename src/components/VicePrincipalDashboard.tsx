import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileCheck2,
  Clock,
  UserX,
  PhoneCall,
  Send,
  CheckCircle2,
  AlertTriangle,
  Award,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  Calendar,
  Users,
  Megaphone,
  Eye,
  Plus
} from 'lucide-react';
import { SponsorBannerCard } from './SponsorBannerCard';
import { toPersianDigits } from '../utils/persianUtils';
import { Student } from '../types';

interface Props {
  onOpenScheduleModal?: () => void;
  onOpenClassStudentModal?: () => void;
  onOpenPostModal?: () => void;
  onOpenStudentDossier?: (student: Student) => void;
}

export const VicePrincipalDashboard: React.FC<Props> = ({
  onOpenScheduleModal,
  onOpenClassStudentModal,
  onOpenPostModal,
  onOpenStudentDossier
}) => {
  const {
    currentSchool,
    students,
    attendanceSessions,
    notifications,
    vicePrincipalPermissions,
    addDisciplinaryRecord,
    setSelectedStudentForDossier,
    currentUser
  } = useApp();

  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || 'std-1');
  const [disciplinaryType, setDisciplinaryType] = useState<'تشویقی' | 'تذکر' | 'تاخیر'>('تشویقی');
  const [disciplinaryTitle, setDisciplinaryTitle] = useState('');
  const [disciplinaryNote, setDisciplinaryNote] = useState('');

  const handleStudentClick = (student: Student) => {
    if (vicePrincipalPermissions.canManageGradesAndDossiers) {
      if (onOpenStudentDossier) {
        onOpenStudentDossier(student);
      } else {
        setSelectedStudentForDossier(student);
      }
    }
  };

  const handleAddDisciplinaryNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disciplinaryTitle.trim() || !selectedStudentId) return;

    addDisciplinaryRecord(selectedStudentId, {
      type: disciplinaryType,
      title: disciplinaryTitle,
      note: disciplinaryNote,
      date: '۱۴۰۵/۰۶/۲۲',
      recordedBy: currentUser.name
    });

    setDisciplinaryTitle('');
    setDisciplinaryNote('');
  };

  return (
    <div className="space-y-6" id="vice-principal-view">
      {/* Top Banner */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">
              میز کار معاونت آموزشی و انضباطی
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-bold">
              {currentSchool?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            پیگیری غیبت‌های زنگ‌ها، ارتباط فوری با اولیا، ثبت موارد انضباطی و برنامه‌ریزی
          </p>
        </div>

        {/* Action Buttons enabled by Principal's Permission Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {vicePrincipalPermissions.canManageClassesAndStudents && onOpenClassStudentModal && (
            <button
              onClick={onOpenClassStudentModal}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Users className="w-4 h-4 text-teal-600" />
              <span>کلاس‌بندی و دانش‌آموزان</span>
            </button>
          )}

          {vicePrincipalPermissions.canManageSchedule && onOpenScheduleModal && (
            <button
              onClick={onOpenScheduleModal}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>برنامه هفتگی</span>
            </button>
          )}

          {vicePrincipalPermissions.canManageAnnouncements && onOpenPostModal && (
            <button
              onClick={onOpenPostModal}
              className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Megaphone className="w-4 h-4 text-teal-600" />
              <span>ثبت رویداد و اطلاعیه</span>
            </button>
          )}

          <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>امروز: شنبه ۲۲ شهریور ۱۴۰۵</span>
          </span>
        </div>
      </div>

      {/* Two columns: 1. Absent Radar & Notification history, 2. Disciplinary logger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (7 cols): Absentees & Message Dispatch */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  رادار غیبت‌ها و تاخیرهای ثبت‌شده امروز مدرسه
                </h3>
              </div>
              <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md">
                {toPersianDigits(notifications.length)} مورد مخابره شده
              </span>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">غیبتی در زنگ‌های امروز ثبت نشده است.</p>
              ) : (
                notifications.map((ntf) => (
                  <div key={ntf.id} className="py-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{ntf.studentName}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          ntf.platform === 'بله' ? 'bg-teal-50 text-teal-800 border border-teal-200' : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          ارسال با {ntf.platform}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">{toPersianDigits(ntf.timestamp)}</span>
                    </div>

                    <p className="text-slate-600 text-xs bg-slate-50 p-2 rounded-lg border border-slate-100 leading-relaxed">
                      {ntf.message}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>گیرنده: <strong>{ntf.recipientName}</strong> ({toPersianDigits(ntf.recipientPhone)})</span>
                      <a
                        href={`tel:${ntf.recipientPhone}`}
                        className="text-teal-700 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <PhoneCall className="w-3 h-3" />
                        تماس مستقیم
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col (5 cols): Disciplinary Logger & Student Dossier Access */}
        <div className="lg:col-span-5 space-y-4">
          {vicePrincipalPermissions.canManageDiscipline && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  ثبت تشویقی، تذکر و تاخیر در پرونده
                </h3>
              </div>

              <form onSubmit={handleAddDisciplinaryNote} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">انتخاب دانش‌آموز:</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">نوع مورد:</label>
                    <select
                      value={disciplinaryType}
                      onChange={(e) => setDisciplinaryType(e.target.value as any)}
                      className="w-full p-2 border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="تشویقی">تشویقی و تقدیرنامه</option>
                      <option value="تذکر">تذکر انضباطی</option>
                      <option value="تاخیر">ثبت تاخیر</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-700 font-medium mb-1">عنوان مورد:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رتبه مسابقات علمی"
                      value={disciplinaryTitle}
                      onChange={(e) => setDisciplinaryTitle(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">توضیحات و مصوبه:</label>
                  <textarea
                    rows={2}
                    placeholder="شرح کامل رویداد..."
                    value={disciplinaryNote}
                    onChange={(e) => setDisciplinaryNote(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    ثبت در پرونده دائمی دانش‌آموز
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick Student Dossier Search */}
          {vicePrincipalPermissions.canManageGradesAndDossiers && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                دسترسی سریع به پرونده تحصیلی دانش‌آموزان
              </h4>
              <p className="text-xs text-slate-500">جهت باز کردن شناسنامه، کارنامه نوبت اول/دوم و سوابق کلیک نمایید:</p>
              
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {students.map((std) => (
                  <button
                    key={std.id}
                    onClick={() => handleStudentClick(std)}
                    className="w-full text-right p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{std.name}</span>
                      <span className="text-[11px] text-slate-400">کد ملی: {toPersianDigits(std.nationalCode)}</span>
                    </div>
                    <span className="text-xs text-teal-700 font-semibold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      پرونده کامل
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <SponsorBannerCard audienceFilter="all" />
    </div>
  );
};
