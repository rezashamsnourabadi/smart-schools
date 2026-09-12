import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { School, SchoolType } from '../types';
import { toPersianDigits } from '../utils/persianUtils';
import {
  Building2,
  Users,
  GraduationCap,
  ShieldCheck,
  PlusCircle,
  Megaphone,
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Tag,
  Eye,
  Send,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface Props {
  onOpenQuestionBank: () => void;
}

export const PlatformAdminDashboard: React.FC<Props> = ({ onOpenQuestionBank }) => {
  const {
    schools,
    setCurrentSchoolId,
    setCurrentRole,
    banners,
    toggleBannerStatus,
    addBannerAd,
    announcements,
    addAnnouncement,
    addSchool,
    questionBank
  } = useApp();

  const [activeTab, setActiveTab] = useState<'schools' | 'banners' | 'announcements' | 'analytics'>('schools');

  // New School Modal state
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [schName, setSchName] = useState('');
  const [schCode, setSchCode] = useState('');
  const [schType, setSchType] = useState<SchoolType>('دبیرستان دوره دوم');
  const [schPrincipal, setSchPrincipal] = useState('');
  const [schPhone, setSchPhone] = useState('');
  const [schAddress, setSchAddress] = useState('');
  const [schStudents, setSchStudents] = useState('250');
  const [schTeachers, setSchTeachers] = useState('18');

  // New Banner Modal state
  const [showAddBanner, setShowAddBanner] = useState(false);
  const [adTitle, setAdTitle] = useState('');
  const [adDesc, setAdDesc] = useState('');
  const [adSponsor, setAdSponsor] = useState('');
  const [adBadge, setAdBadge] = useState('رویداد آموزشی');
  const [adLink, setAdLink] = useState('اطلاعات بیشتر و ثبت‌نام');
  const [adAudience, setAdAudience] = useState<'all' | 'students' | 'parents' | 'teachers'>('all');

  // New District Announcement state
  const [ancTitle, setAncTitle] = useState('');
  const [ancContent, setAncContent] = useState('');
  const [ancTarget, setAncTarget] = useState<'all' | 'teachers' | 'parents' | 'students'>('all');

  // Calculate totals
  const totalStudents = schools.reduce((acc, s) => acc + s.studentCount, 0);
  const totalTeachers = schools.reduce((acc, s) => acc + s.teacherCount, 0);
  const totalSubmittedSchools = schools.filter((s) => s.todayAttendanceSubmitted).length;
  const avgAttendance = Math.round(
    schools.reduce((acc, s) => acc + s.attendanceRateToday, 0) / schools.length
  );

  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schName.trim() || !schCode.trim()) return;

    addSchool({
      name: schName,
      code: schCode,
      type: schType,
      principalName: schPrincipal || 'مدیر جدید',
      address: schAddress || 'شهرستان، منطقه آموزش و پرورش',
      phone: schPhone || '۰۲۱-۵۵۵۵۵۵۵',
      studentCount: parseInt(schStudents) || 200,
      teacherCount: parseInt(schTeachers) || 15,
      classesCount: Math.ceil((parseInt(schStudents) || 200) / 25),
      accentColor: 'indigo'
    });

    setShowAddSchool(false);
    setSchName('');
    setSchCode('');
    setSchPrincipal('');
  };

  const handleCreateBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !adSponsor.trim()) return;

    addBannerAd({
      title: adTitle,
      description: adDesc,
      sponsorName: adSponsor,
      targetAudience: adAudience === 'all' ? ['all', 'students', 'parents', 'teachers'] : [adAudience],
      linkText: adLink,
      category: 'آموزشی',
      badge: adBadge,
      isActive: true
    });

    setShowAddBanner(false);
    setAdTitle('');
    setAdDesc('');
    setAdSponsor('');
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ancTitle.trim() || !ancContent.trim()) return;

    addAnnouncement({
      schoolId: 'all',
      title: ancTitle,
      content: ancContent,
      senderRole: 'مدیر کل پلتفرم شهرستان',
      senderName: 'مهندس رضا رضایی',
      target: ancTarget,
      priority: 'important'
    });

    setAncTitle('');
    setAncContent('');
  };

  const handleInspectSchool = (schoolId: string) => {
    setCurrentSchoolId(schoolId);
    setCurrentRole('principal');
  };

  return (
    <div className="space-y-6" id="platform-admin-view">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-rose-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>پنل عالی مدیریت کل پلتفرم مدارس شهرستان</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              قطب نظارت و هاب متمرکز مدارس منطقه
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              کنترل یکپارچه مدارس، تایید بنرهای حامیان و اطلاعیه‌های فرهنگی منطقه، و نظارت بر بانک سوالات سراسری
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="admin-open-qbank"
              onClick={onOpenQuestionBank}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-teal-300" />
              <span>بانک سوالات شهرستان ({toPersianDigits(questionBank.length)})</span>
            </button>

            <button
              id="admin-add-school-btn"
              onClick={() => setShowAddSchool(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>افزودن مدرسه جدید به هاب</span>
            </button>
          </div>
        </div>

        <div className="absolute left-0 bottom-0 translate-y-1/3 -translate-x-1/4 w-80 h-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none"></div>
      </div>

      {/* District KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">مدارس تحت پوشش</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{toPersianDigits(schools.length)} مدرسه</div>
            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">۱۰۰٪ فعال در سامانه</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">کل دانش‌آموزان شهرستان</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{toPersianDigits(totalStudents.toLocaleString('fa-IR'))} نفر</div>
            <div className="text-[10px] text-slate-400 mt-0.5">پروفایل‌های ثبت‌شده</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">کادر و معلمان شهرستان</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{toPersianDigits(totalTeachers)} دبیر</div>
            <div className="text-[10px] text-blue-600 font-semibold mt-0.5">دسترسی مستقیم کلاسی</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-500 font-medium">حضور و غیاب امروز</div>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{toPersianDigits(avgAttendance)}٪</div>
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
              {toPersianDigits(totalSubmittedSchools)} از {toPersianDigits(schools.length)} مدرسه ثبت کردند
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          id="admin-tab-schools"
          onClick={() => setActiveTab('schools')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'schools'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>پروفایل و مدیریت مدارس ({toPersianDigits(schools.length)})</span>
        </button>

        <button
          id="admin-tab-banners"
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'banners'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>تبلیغات و حامیان منطقه ({toPersianDigits(banners.length)})</span>
        </button>

        <button
          id="admin-tab-announcements"
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'announcements'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>بخشنامه‌ها و اعلانات سراسری</span>
        </button>
      </div>

      {/* Tab 1: Schools Management */}
      {activeTab === 'schools' && (
        <div className="space-y-4" id="admin-schools-section">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                مدارس متصل به هاب آموزشی شهرستان
              </h2>
              <p className="text-xs text-slate-500">
                هر مدرسه پروفایل و داشبورد مستقل خود را دارد ولی تحت پوشش هاب مرکزی شهرستان مدیریت می‌شود.
              </p>
            </div>
            <button
              onClick={() => setShowAddSchool(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>مدرسه جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schools.map((school) => (
              <div
                key={school.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      کد واحد: {toPersianDigits(school.code)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        school.todayAttendanceSubmitted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {school.todayAttendanceSubmitted
                        ? 'حضور امروز ثبت شد'
                        : 'در انتظار حضور و غیاب'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mb-1">{school.name}</h3>
                  <div className="text-xs text-teal-700 font-semibold mb-3">{school.type}</div>

                  <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-400">مدیر مدرسه:</span>
                      <span className="font-semibold text-slate-800">{school.principalName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">دانش‌آموزان:</span>
                      <span className="font-bold text-slate-800">{toPersianDigits(school.studentCount)} نفر</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">تعداد کلاس‌ها:</span>
                      <span className="font-semibold text-slate-800">{toPersianDigits(school.classesCount)} کلاس</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">درصد حضور امروز:</span>
                      <span className="font-bold text-emerald-700">{toPersianDigits(school.attendanceRateToday)}٪</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400 truncate">{toPersianDigits(school.phone)}</span>
                  <button
                    id={`inspect-school-btn-${school.id}`}
                    onClick={() => handleInspectSchool(school.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ورود به پنل مدرسه</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Sponsor & Ads Manager */}
      {activeTab === 'banners' && (
        <div className="space-y-4" id="admin-banners-section">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 text-sm">
                مدیریت تبلیغات و حامیان فرهنگی/آموزشی منطقه
              </h2>
              <p className="text-xs text-slate-500">
                این بنرها در محل اختصاصی و غیرمزاحم در پنل اولیا و دانش‌آموزان با هدف معرفی خدمات مفید شهرستان نمایش داده می‌شوند.
              </p>
            </div>
            <button
              onClick={() => setShowAddBanner(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>تعریف بنر / اسپانسر جدید</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((ban) => (
              <div
                key={ban.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                    {ban.badge}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {toPersianDigits(ban.clicksCount)} کلیک / بازدید
                    </span>
                    <button
                      onClick={() => toggleBannerStatus(ban.id)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                        ban.isActive
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {ban.isActive ? 'فعال در هاب' : 'غیرفعال'}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{ban.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ban.description}</p>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>حامی: {ban.sponsorName}</span>
                  <span className="text-teal-700 font-semibold">{ban.linkText}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Announcements */}
      {activeTab === 'announcements' && (
        <div className="space-y-5" id="admin-announcements-section">
          {/* Create Announcement */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Megaphone className="w-5 h-5 text-rose-600" />
              <h3 className="font-bold text-sm text-slate-900">
                ارسال بخشنامه / اطلاعیه به تمام مدارس شهرستان
              </h3>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">عنوان بخشنامه</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: دستورالعمل ثبت‌نام در جشنواره علمی نوجوان خوارزمی"
                    value={ancTitle}
                    onChange={(e) => setAncTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">مخاطبان هدف</label>
                  <select
                    value={ancTarget}
                    onChange={(e) => setAncTarget(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="all">کلیه کاربران (معلمان، اولیا، دانش‌آموزان)</option>
                    <option value="teachers">فقط معلمان و کادر مدرسه</option>
                    <option value="parents">فقط اولیای دانش‌آموزان</option>
                    <option value="students">فقط دانش‌آموزان</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">متن کامل اطلاعیه</label>
                <textarea
                  required
                  rows={3}
                  placeholder="متن بخشنامه یا پیام هاب شهرستان..."
                  value={ancContent}
                  onChange={(e) => setAncContent(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>انتشار سراسری در داشبورد مدارس</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Published Announcements */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-800">بخشنامه‌های فعال شهرستان:</h4>
            {announcements.map((anc) => (
              <div key={anc.id} className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{anc.title}</span>
                  <span className="text-[10px] text-slate-400">{anc.date}</span>
                </div>
                <p className="text-slate-600 leading-relaxed">{anc.content}</p>
                <div className="text-[10px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>فرستنده: {anc.senderName} ({anc.senderRole})</span>
                  <span className="text-teal-700 font-semibold">مخاطب: {anc.target === 'all' ? 'همه' : anc.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add School */}
      {showAddSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  افزودن مدرسه جدید به هاب شهرستان
                </h3>
              </div>
              <button
                onClick={() => setShowAddSchool(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                انصراف
              </button>
            </div>

            <form onSubmit={handleCreateSchool} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نام مدرسه</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: دبیرستان علامه حلی"
                    value={schName}
                    onChange={(e) => setSchName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">کد واحد آموزشی</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ۴۰۳۵۱۲"
                    value={schCode}
                    onChange={(e) => setSchCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">مقطع / نوع مدرسه</label>
                  <select
                    value={schType}
                    onChange={(e) => setSchType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="دبیرستان دوره دوم">دبیرستان دوره دوم</option>
                    <option value="دبیرستان دوره اول">دبیرستان دوره اول</option>
                    <option value="هنرستان فنی و حرفه‌ای">هنرستان فنی و حرفه‌ای</option>
                    <option value="دبستان هوشمند">دبستان هوشمند</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نام مدیر مدرسه</label>
                  <input
                    type="text"
                    placeholder="مثال: استاد فلاحی"
                    value={schPrincipal}
                    onChange={(e) => setSchPrincipal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تعداد دانش‌آموزان</label>
                  <input
                    type="number"
                    value={schStudents}
                    onChange={(e) => setSchStudents(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">تعداد معلمان</label>
                  <input
                    type="number"
                    value={schTeachers}
                    onChange={(e) => setSchTeachers(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">تلفن و آدرس مدرسه</label>
                <input
                  type="text"
                  placeholder="خیابان اصلی، پلاک..."
                  value={schAddress}
                  onChange={(e) => setSchAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddSchool(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs"
                >
                  ایجاد پروفایل مدرسه در هاب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Banner / Sponsor */}
      {showAddBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-right animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  تعریف بنر تبلیغاتی یا حامی آموزشی منطقه
                </h3>
              </div>
              <button
                onClick={() => setShowAddBanner(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                انصراف
              </button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">عنوان بنر یا رویداد</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تخفیف لوازم‌التحریر و کتب درسی فروشگاه فرهنگ"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">توضیحات مختصر</label>
                <textarea
                  rows={2}
                  required
                  placeholder="متن کوتاه و محترمانه که در کارت بنر قرار می‌گیرد..."
                  value={adDesc}
                  onChange={(e) => setAdDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نام حامی یا سازمان</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: کانون نخبگان شهرستان"
                    value={adSponsor}
                    onChange={(e) => setAdSponsor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">نشان یا برچسب</label>
                  <input
                    type="text"
                    value={adBadge}
                    onChange={(e) => setAdBadge(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">مخاطب نمایش</label>
                  <select
                    value={adAudience}
                    onChange={(e) => setAdAudience(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="all">همه کاربران پلتفرم</option>
                    <option value="parents">فقط پنل اولیا</option>
                    <option value="students">فقط پنل دانش‌آموزان</option>
                    <option value="teachers">فقط پنل معلمان</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">متن دکمه اقدام</label>
                  <input
                    type="text"
                    value={adLink}
                    onChange={(e) => setAdLink(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddBanner(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all shadow-xs"
                >
                  فعال‌سازی بنر در هاب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
