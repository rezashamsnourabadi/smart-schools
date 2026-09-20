import React, { useState, useMemo } from 'react';
import {
  X,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Plus,
  Search,
  Filter,
  Receipt,
  Building2,
  ArrowDownLeft,
  Percent,
  Calendar,
  UserCheck,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  Check,
  Ban,
  Download,
  AlertTriangle,
  FileText,
  User,
  ShieldCheck,
  DollarSign
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  Student,
  SchoolFeeItem,
  FeeCategory,
  PaymentMethod,
  PaymentTransaction
} from '../types';
import { toPersianDigits, formatPersianCurrency } from '../utils/persianUtils';
import { createInitialStudentFinancialSummary } from '../data/mockFinanceData';

interface FinanceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'debtors' | 'fees' | 'transactions' | 'reports';
}

export const FinanceManagerModal: React.FC<FinanceManagerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'debtors'
}) => {
  const {
    currentSchool,
    students,
    classes,
    feeItems,
    addFeeItem,
    updateFeeItem,
    deleteFeeItem,
    assignFeeItemToStudents,
    recordStudentPayment,
    updatePaymentTransactionStatus,
    sendPaymentReminder,
    applyStudentDiscount,
    setSelectedStudentForDossier,
    activeAcademicYear,
    currentRole
  } = useApp();

  const [activeTab, setActiveTab] = useState<'debtors' | 'fees' | 'transactions' | 'reports'>(initialTab);

  // Filter & Search states for Debtors Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'debtor' | 'overdue' | 'settled' | 'discounted'>('all');
  const [sortBy, setSortBy] = useState<'debt_desc' | 'paid_desc' | 'name'>('debt_desc');

  // Modals inside FinanceManager
  const [isNewFeeModalOpen, setIsNewFeeModalOpen] = useState(false);
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isBatchReminderModalOpen, setIsBatchReminderModalOpen] = useState(false);
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null);

  // New Fee Form
  const [newFeeTitle, setNewFeeTitle] = useState('');
  const [newFeeCategory, setNewFeeCategory] = useState<FeeCategory>('tuition');
  const [newFeeAmount, setNewFeeAmount] = useState<number>(15000000);
  const [newFeeDueDate, setNewFeeDueDate] = useState('۱۴۰۴/۱۰/۳۰');
  const [newFeeScope, setNewFeeScope] = useState<'all' | 'grade_10' | 'grade_11' | 'grade_12'>('all');
  const [newFeeMandatory, setNewFeeMandatory] = useState(true);
  const [newFeeDescription, setNewFeeDescription] = useState('');

  // Payment Recording Form
  const [payStudentId, setPayStudentId] = useState<string>('');
  const [payAmount, setPayAmount] = useState<number>(5000000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('pos');
  const [payTrackingCode, setPayTrackingCode] = useState<string>(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [payFeeTitle, setPayFeeTitle] = useState<string>('شهریه مصوب آموزشگاه');
  const [payNote, setPayNote] = useState<string>('');

  // Target Student Financial Summaries
  const studentListWithSummary = useMemo(() => {
    return students
      .filter((s) => s.status !== 'graduated' && s.status !== 'transferred')
      .map((s) => ({
        student: s,
        summary: s.financialSummary || createInitialStudentFinancialSummary(s.id, s.name, s.grade, 'normal_partial')
      }));
  }, [students]);

  // Overall Financial Calculations
  const stats = useMemo(() => {
    let totalBilled = 0;
    let totalPaid = 0;
    let totalDiscount = 0;
    let totalRemainingDebt = 0;
    let debtorCount = 0;
    let overdueCount = 0;
    let settledCount = 0;

    studentListWithSummary.forEach(({ summary }) => {
      totalBilled += summary.totalBilled;
      totalPaid += summary.totalPaid;
      totalDiscount += summary.totalDiscount;
      totalRemainingDebt += summary.remainingDebt;

      if (summary.remainingDebt === 0) {
        settledCount++;
      } else if (summary.status === 'overdue') {
        overdueCount++;
        debtorCount++;
      } else {
        debtorCount++;
      }
    });

    const netReceivable = Math.max(1, totalBilled - totalDiscount);
    const collectionRate = Math.min(100, Math.round((totalPaid / netReceivable) * 100));

    return {
      totalBilled,
      totalPaid,
      totalDiscount,
      totalRemainingDebt,
      debtorCount,
      overdueCount,
      settledCount,
      collectionRate
    };
  }, [studentListWithSummary]);

  // Filtered Student List
  const filteredStudents = useMemo(() => {
    return studentListWithSummary.filter(({ student, summary }) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = student.name.toLowerCase().includes(q);
        const matchesCode = student.nationalCode.includes(q);
        const matchesNumber = student.studentNumber.includes(q);
        if (!matchesName && !matchesCode && !matchesNumber) return false;
      }

      // Class Filter
      if (selectedClassFilter !== 'all' && student.classGroupId !== selectedClassFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter === 'debtor' && summary.remainingDebt <= 0) return false;
      if (statusFilter === 'overdue' && summary.status !== 'overdue') return false;
      if (statusFilter === 'settled' && summary.remainingDebt > 0) return false;
      if (statusFilter === 'discounted' && summary.totalDiscount <= 0) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'debt_desc') return b.summary.remainingDebt - a.summary.remainingDebt;
      if (sortBy === 'paid_desc') return b.summary.totalPaid - a.summary.totalPaid;
      return a.student.name.localeCompare(b.student.name, 'fa');
    });
  }, [studentListWithSummary, searchQuery, selectedClassFilter, statusFilter, sortBy]);

  // All Transactions across all students
  const allTransactions = useMemo(() => {
    const list: { transaction: PaymentTransaction; student: Student }[] = [];
    studentListWithSummary.forEach(({ student, summary }) => {
      summary.transactions.forEach((txn) => {
        list.push({ transaction: txn, student });
      });
    });
    return list.sort((a, b) => b.transaction.id.localeCompare(a.transaction.id));
  }, [studentListWithSummary]);

  if (!isOpen) return null;

  // Actions
  const handleCreateFeeItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeeTitle.trim() || newFeeAmount <= 0) return;

    addFeeItem({
      title: newFeeTitle,
      category: newFeeCategory,
      amount: newFeeAmount,
      dueDate: newFeeDueDate,
      targetScope: newFeeScope,
      isMandatory: newFeeMandatory,
      description: newFeeDescription
    });

    setNewFeeTitle('');
    setNewFeeDescription('');
    setIsNewFeeModalOpen(false);
  };

  const handleOpenPaymentModal = (student?: Student) => {
    if (student) {
      setSelectedStudentForAction(student);
      setPayStudentId(student.id);
      const sSummary = student.financialSummary || createInitialStudentFinancialSummary(student.id, student.name, student.grade, 'normal_partial');
      setPayAmount(Math.min(sSummary.remainingDebt, 5000000) || 5000000);
    } else if (students.length > 0) {
      setPayStudentId(students[0].id);
      setPayAmount(5000000);
    }
    setPayTrackingCode(Math.floor(100000 + Math.random() * 900000).toString());
    setIsRecordPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const targetStudent = students.find((s) => s.id === payStudentId);
    if (!targetStudent || payAmount <= 0) return;

    recordStudentPayment({
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      schoolId: targetStudent.schoolId,
      amount: payAmount,
      trackingCode: payTrackingCode,
      method: payMethod,
      feeTitle: payFeeTitle,
      note: payNote,
      recordedBy: currentRole === 'principal' ? 'مدیر آموزشگاه' : 'معاون مالی/اجرایی',
      status: 'confirmed'
    });

    setIsRecordPaymentModalOpen(false);
    setPayNote('');
  };

  const handleBatchReminders = () => {
    const overdueDebtors = studentListWithSummary.filter(({ summary }) => summary.status === 'overdue');
    overdueDebtors.forEach(({ student }) => {
      sendPaymentReminder(student.id);
    });
    setIsBatchReminderModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto" dir="rtl">
      <div
        className="bg-slate-50 w-full max-w-5xl rounded-none sm:rounded-3xl shadow-2xl h-full sm:h-auto sm:max-h-[92vh] max-h-screen flex flex-col overflow-hidden border border-slate-200"
        id="finance-manager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-cyan-900 text-white p-4 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
            title="بستن پنجره"
            aria-label="بستن"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pe-10 sm:pe-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shadow-inner shrink-0">
                <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-xl font-bold text-white truncate">
                  سامانه امور مالی و شهریه آموزشگاه
                </h2>
                <p className="text-[11px] sm:text-sm text-teal-100 mt-0.5 truncate">
                  {currentSchool?.name || 'مدرسه هوشمند'} • سال تحصیلی {activeAcademicYear?.title || '۱۴۰۴-۱۴۰۵'}
                </p>
              </div>
            </div>

            {/* Quick Action in Header */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                id="btn-header-record-pay"
                onClick={() => handleOpenPaymentModal()}
                className="min-h-[40px] px-3.5 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                ثبت واریزی جدید
              </button>
            </div>
          </div>

          {/* Top KPI Cards Row: Swipeable on mobile, 5 cols on desktop */}
          <div className="flex overflow-x-auto gap-2 sm:grid sm:grid-cols-5 sm:gap-2.5 mt-4 sm:mt-5 pb-1 sm:pb-0 no-scrollbar snap-x">
            <div className="snap-start shrink-0 min-w-[135px] sm:min-w-0 flex-1 bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <span className="text-[10px] sm:text-[11px] text-teal-100 block">کل مصوب سالانه</span>
              <span className="text-xs sm:text-base font-bold text-white block mt-0.5 whitespace-nowrap">
                {formatPersianCurrency(stats.totalBilled)}
              </span>
            </div>

            <div className="snap-start shrink-0 min-w-[135px] sm:min-w-0 flex-1 bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <span className="text-[10px] sm:text-[11px] text-emerald-200 block">کل وجوه وصول‌شده</span>
              <span className="text-xs sm:text-base font-bold text-emerald-300 block mt-0.5 whitespace-nowrap">
                {formatPersianCurrency(stats.totalPaid)}
              </span>
            </div>

            <div className="snap-start shrink-0 min-w-[135px] sm:min-w-0 flex-1 bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <span className="text-[10px] sm:text-[11px] text-rose-200 block">مانده مطالبات معوق</span>
              <span className="text-xs sm:text-base font-bold text-rose-300 block mt-0.5 whitespace-nowrap">
                {formatPersianCurrency(stats.totalRemainingDebt)}
              </span>
            </div>

            <div className="snap-start shrink-0 min-w-[135px] sm:min-w-0 flex-1 bg-white/10 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/10">
              <span className="text-[10px] sm:text-[11px] text-purple-200 block">تخفیف و بورسیه‌ها</span>
              <span className="text-xs sm:text-base font-bold text-purple-200 block mt-0.5 whitespace-nowrap">
                {formatPersianCurrency(stats.totalDiscount)}
              </span>
            </div>

            <div className="snap-start shrink-0 min-w-[135px] sm:min-w-0 flex-1 bg-white/15 backdrop-blur-xs rounded-2xl p-2.5 sm:p-3 border border-white/15">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-teal-100">
                <span>درصد وصولی</span>
                <span className="font-bold text-white font-mono">{toPersianDigits(stats.collectionRate)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-2 overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.collectionRate}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-start sm:justify-between gap-1 sm:gap-2 overflow-x-auto no-scrollbar shrink-0">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              id="tab-btn-debtors"
              onClick={() => setActiveTab('debtors')}
              className={`min-h-[44px] py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'debtors'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>بدهکاران و وضعیت حساب</span>
              {stats.overdueCount > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold">
                  {toPersianDigits(stats.overdueCount)}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-btn-fees"
              onClick={() => setActiveTab('fees')}
              className={`min-h-[44px] py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'fees'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span>تعرفه‌ها و سرفصل‌ها</span>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                {toPersianDigits(feeItems.length)}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`min-h-[44px] py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'transactions'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Receipt className="w-4 h-4 shrink-0" />
              <span>دفتر اسناد و واریزی‌ها</span>
              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px]">
                {toPersianDigits(allTransactions.length)}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-reports"
              onClick={() => setActiveTab('reports')}
              className={`min-h-[44px] py-2.5 px-3 sm:px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === 'reports'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>گزارش و تراز تفکیکی</span>
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* TAB 1: DEBTORS & BALANCES */}
          {activeTab === 'debtors' && (
            <div className="space-y-4">
              {/* Filters Bar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full">
                  {/* Search */}
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجوی دانش‌آموز، کد ملی یا شماره پرونده..."
                      className="w-full pr-9 pl-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2">
                    {/* Class Filter */}
                    <select
                      value={selectedClassFilter}
                      onChange={(e) => setSelectedClassFilter(e.target.value)}
                      className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="all">همه کلاس‌ها</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>

                    {/* Financial Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="all">همه وضعیت‌ها</option>
                      <option value="overdue">معوقه فوری</option>
                      <option value="debtor">دارای بدهی</option>
                      <option value="settled">تسویه‌شده</option>
                      <option value="discounted">دارای تخفیف</option>
                    </select>
                  </div>
                </div>

                {/* Batch Action */}
                {stats.overdueCount > 0 && (
                  <button
                    type="button"
                    id="btn-batch-remind"
                    onClick={() => setIsBatchReminderModalOpen(true)}
                    className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    ارسال پیامک و بله به معوقات ({toPersianDigits(stats.overdueCount)})
                  </button>
                )}
              </div>

              {/* Mobile Card View (md:hidden) */}
              <div className="space-y-3 md:hidden">
                {filteredStudents.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    دانش‌آموزی با این مشخصات یافت نشد.
                  </div>
                ) : (
                  filteredStudents.map(({ student, summary }) => {
                    const cls = classes.find((c) => c.id === student.classGroupId);
                    const isSettled = summary.remainingDebt === 0;
                    const isOverdue = summary.status === 'overdue';

                    return (
                      <div
                        key={student.id}
                        className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-3"
                      >
                        {/* Header: Name, Class, Status Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-sm truncate">{student.name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {cls?.name || student.grade}
                              </span>
                              <span>•</span>
                              <span>کد: {toPersianDigits(student.nationalCode)}</span>
                              <span>•</span>
                              <span>ولی: {student.parentName}</span>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {isSettled ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                تسویه کامل
                              </span>
                            ) : isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold animate-pulse">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                معوق فوری
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-amber-600" />
                                مانده جاری
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 4-cell Financial Grid */}
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">کل صورتحساب</span>
                            <span className="font-mono font-bold text-slate-700 block mt-0.5 truncate">
                              {formatPersianCurrency(summary.totalBilled)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">تخفیف / بورسیه</span>
                            <span className="font-mono text-purple-700 font-bold block mt-0.5 truncate">
                              {summary.totalDiscount > 0 ? formatPersianCurrency(summary.totalDiscount) : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-emerald-600 block">مجموع دریافتی</span>
                            <span className="font-mono font-bold text-emerald-700 block mt-0.5 truncate">
                              {formatPersianCurrency(summary.totalPaid)}
                            </span>
                          </div>
                          <div>
                            <span className={`text-[10px] block ${isSettled ? 'text-emerald-600' : 'text-rose-600'}`}>
                              مانده بدهی
                            </span>
                            <span className={`font-mono font-black block mt-0.5 truncate ${isSettled ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isSettled ? '۰ ریال' : formatPersianCurrency(summary.remainingDebt)}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Action Buttons (min-h 40px) */}
                        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => handleOpenPaymentModal(student)}
                            className="min-h-[40px] px-2 py-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-emerald-200/80"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>ثبت واریز</span>
                          </button>

                          <button
                            type="button"
                            disabled={summary.remainingDebt <= 0}
                            onClick={() => sendPaymentReminder(student.id)}
                            className="min-h-[40px] px-2 py-2 bg-sky-50 hover:bg-sky-100 active:bg-sky-200 disabled:opacity-40 text-sky-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-sky-200/80"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>یادآوری</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedStudentForDossier(student)}
                            className="min-h-[40px] px-2 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>پرونده</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">دانش‌آموز</th>
                        <th className="py-3 px-4">کلاس</th>
                        <th className="py-3 px-4">صورتحساب</th>
                        <th className="py-3 px-4">تخفیف</th>
                        <th className="py-3 px-4">وصولی</th>
                        <th className="py-3 px-4">مانده بدهی</th>
                        <th className="py-3 px-4">وضعیت</th>
                        <th className="py-3 px-4 text-center">عملیات مالی</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            دانش‌آموزی با این فیلترها یافت نشد.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(({ student, summary }) => {
                          const cls = classes.find((c) => c.id === student.classGroupId);
                          const isSettled = summary.remainingDebt === 0;
                          const isOverdue = summary.status === 'overdue';

                          return (
                            <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-bold text-slate-800">{student.name}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                  <span>کد ملی: {toPersianDigits(student.nationalCode)}</span>
                                  <span>•</span>
                                  <span>اولیا: {student.parentName}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600">{cls?.name || student.grade}</td>
                              <td className="py-3 px-4 font-mono font-medium">
                                {formatPersianCurrency(summary.totalBilled)}
                              </td>
                              <td className="py-3 px-4 font-mono text-purple-700">
                                {summary.totalDiscount > 0 ? formatPersianCurrency(summary.totalDiscount) : '—'}
                              </td>
                              <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                                {formatPersianCurrency(summary.totalPaid)}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold">
                                {isSettled ? (
                                  <span className="text-emerald-700">۰</span>
                                ) : (
                                  <span className="text-rose-700">{formatPersianCurrency(summary.remainingDebt)}</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {isSettled ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    تسویه
                                  </span>
                                ) : isOverdue ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[11px] font-bold animate-pulse">
                                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                                    معوق فوری
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    مانده جاری
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPaymentModal(student)}
                                    title="ثبت واریزی"
                                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <CreditCard className="w-4 h-4" />
                                  </button>

                                  {summary.remainingDebt > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => sendPaymentReminder(student.id)}
                                      title="ارسال یادآوری بله و پیامک"
                                      className="p-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Send className="w-4 h-4" />
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => setSelectedStudentForDossier(student)}
                                    title="مشاهده پرونده کامل دانش‌آموز"
                                    className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FEE ITEMS & TARIFFS */}
          {activeTab === 'fees' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">سرفصل‌های مصوب شهریه و خدمات مدرسه</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    تعریف و ویرایش مبالغ پایه شهریه، حق‌الثبت، فوق‌برنامه، سرویس و خدمات رفاهی
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-add-fee-item"
                  onClick={() => setIsNewFeeModalOpen(true)}
                  className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  تعریف سرفصل جدید
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {feeItems.map((fee) => (
                  <div
                    key={fee.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:border-teal-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{fee.title}</span>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">
                            دسته: {fee.category === 'tuition' ? 'شهریه پایه' : fee.category === 'service' ? 'سرویس ایاب و ذهاب' : fee.category === 'extracurricular' ? 'فوق برنامه' : fee.category === 'nutrition' ? 'تغذیه' : fee.category === 'books' ? 'کتاب و اقلام' : 'سایر خدمات'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {fee.isMandatory ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold">
                              اجباری
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px]">
                              اختیاری
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-base font-bold text-slate-900 font-mono my-2">
                        {formatPersianCurrency(fee.amount)}
                      </div>

                      {fee.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3">{fee.description}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                      <span>مهلت پرداخت: {fee.dueDate ? toPersianDigits(fee.dueDate) : 'ثبت‌نام'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => assignFeeItemToStudents(fee.id, fee.targetScope)}
                          className="min-h-[36px] px-3 py-1.5 bg-teal-50 text-teal-800 hover:bg-teal-100 active:bg-teal-200 rounded-lg text-xs font-bold transition-colors cursor-pointer border border-teal-200/60"
                        >
                          تخصیص به دانش‌آموزان
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFeeItem(fee.id)}
                          className="min-h-[36px] p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف سرفصل"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSACTION LEDGER */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">دفتر کل اسناد مالی و فیش‌های بانکی</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    فهرست کلیه تراکنش‌های کارتخوان، کارت به کارت، درگاه آنلاین و چک‌های صیادی
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenPaymentModal()}
                  className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  ثبت تراکنش دستی
                </button>
              </div>

              {/* Mobile Card View (md:hidden) */}
              <div className="space-y-3 md:hidden">
                {allTransactions.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
                    هنوز تراکنشی ثبت نشده است.
                  </div>
                ) : (
                  allTransactions.map(({ transaction: txn, student }) => (
                    <div
                      key={txn.id}
                      className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{student.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <span>تاریخ: {toPersianDigits(txn.date)}</span>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-slate-400">{txn.id}</span>
                          </div>
                        </div>
                        <div className="text-left">
                          <span className="font-mono font-bold text-emerald-700 text-sm block">
                            {formatPersianCurrency(txn.amount)}
                          </span>
                          <span className="mt-1 inline-block">
                            {txn.status === 'confirmed' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                                <Check className="w-3 h-3 text-emerald-600" />
                                تایید شده
                              </span>
                            ) : txn.status === 'pending_verification' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-amber-600" />
                                در انتظار تایید
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
                                <Ban className="w-3 h-3 text-rose-600" />
                                رد شده
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">روش پرداخت</span>
                          <span className="font-medium text-slate-700 block mt-0.5">
                            {txn.method === 'pos'
                              ? 'دستگاه پوز'
                              : txn.method === 'card_to_card'
                              ? 'کارت به کارت'
                              : txn.method === 'cheque'
                              ? 'چک صیادی'
                              : txn.method === 'online_gateway'
                              ? 'درگاه پرداخت'
                              : 'فیش نقدی'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">کد پیگیری</span>
                          <span className="font-mono text-slate-700 block mt-0.5 truncate">
                            {toPersianDigits(txn.trackingCode)}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-[10px] text-slate-400 block">بابت سرفصل</span>
                          <span className="font-medium text-slate-700 block mt-0.5">
                            {txn.feeTitle || 'شهریه مصوب آموزشگاه'}
                          </span>
                        </div>
                      </div>

                      {txn.status === 'pending_verification' && (
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => updatePaymentTransactionStatus(student.id, txn.id, 'confirmed')}
                            className="min-h-[40px] px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            تایید سند واریز
                          </button>
                          <button
                            type="button"
                            onClick={() => updatePaymentTransactionStatus(student.id, txn.id, 'rejected')}
                            className="min-h-[40px] px-3 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                          >
                            <X className="w-4 h-4" />
                            عدم تایید
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Desktop Table View (hidden md:block) */}
              <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold">
                      <tr>
                        <th className="py-3 px-4">شناسه / تاریخ</th>
                        <th className="py-3 px-4">دانش‌آموز</th>
                        <th className="py-3 px-4">مبلغ واریزی</th>
                        <th className="py-3 px-4">روش پرداخت</th>
                        <th className="py-3 px-4">کد پیگیری</th>
                        <th className="py-3 px-4">بابت</th>
                        <th className="py-3 px-4">وضعیت تایید</th>
                        <th className="py-3 px-4 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {allTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            هنوز تراکنشی ثبت نشده است.
                          </td>
                        </tr>
                      ) : (
                        allTransactions.map(({ transaction: txn, student }) => (
                          <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500">
                              <div>{toPersianDigits(txn.date)}</div>
                              <div className="text-[10px] text-slate-400">{txn.id}</div>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">{student.name}</td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                              {formatPersianCurrency(txn.amount)}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px]">
                                {txn.method === 'pos'
                                  ? 'دستگاه پوز'
                                  : txn.method === 'card_to_card'
                                  ? 'کارت به کارت'
                                  : txn.method === 'cheque'
                                  ? 'چک صیادی'
                                  : txn.method === 'online_gateway'
                                  ? 'درگاه پرداخت'
                                  : 'فیش نقدی'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {toPersianDigits(txn.trackingCode)}
                            </td>
                            <td className="py-3 px-4 text-slate-600">{txn.feeTitle || 'شهریه مصوب'}</td>
                            <td className="py-3 px-4">
                              {txn.status === 'confirmed' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  تایید شده
                                </span>
                              ) : txn.status === 'pending_verification' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold">
                                  <Clock className="w-3 h-3 text-amber-600" />
                                  در انتظار تایید
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[11px] font-bold">
                                  <Ban className="w-3 h-3 text-rose-600" />
                                  رد شده
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {txn.status === 'pending_verification' && (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => updatePaymentTransactionStatus(student.id, txn.id, 'confirmed')}
                                    className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                    title="تایید واریزی"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updatePaymentTransactionStatus(student.id, txn.id, 'rejected')}
                                    className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                                    title="عدم تایید"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REPORTS & EXPORT */}
          {activeTab === 'reports' && (
            <div className="space-y-5">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">تراز مالی و تحلیل سرفصل‌های درآمدی آموزشگاه</h3>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-[38px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <Printer className="w-4 h-4" />
                    چاپ تراز مالی
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200">
                    <span className="text-xs text-slate-500">تعداد کل دانش‌آموزان ثبت‌نامی:</span>
                    <span className="text-base sm:text-lg font-bold text-slate-800 block mt-1">
                      {toPersianDigits(students.length)} نفر
                    </span>
                  </div>

                  <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl border border-emerald-200">
                    <span className="text-xs text-emerald-700">دانش‌آموزان با تسویه کامل:</span>
                    <span className="text-base sm:text-lg font-bold text-emerald-800 block mt-1">
                      {toPersianDigits(stats.settledCount)} نفر
                    </span>
                  </div>

                  <div className="bg-rose-50/70 p-3.5 sm:p-4 rounded-xl border border-rose-200">
                    <span className="text-xs text-rose-700">تعداد بدهکاران معوق:</span>
                    <span className="text-base sm:text-lg font-bold text-rose-800 block mt-1">
                      {toPersianDigits(stats.overdueCount)} نفر
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-slate-700">تفکیک وضعیت وصولی به صورتحساب:</h4>
                  <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                      style={{ width: `${stats.collectionRate}%` }}
                      title={`وصول شده: ${stats.collectionRate}%`}
                    >
                      {stats.collectionRate > 15 ? `${toPersianDigits(stats.collectionRate)}% وصول` : ''}
                    </div>
                    <div
                      className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                      style={{ width: `${100 - stats.collectionRate}%` }}
                      title="مانده معوق"
                    >
                      {100 - stats.collectionRate > 15 ? `${toPersianDigits(100 - stats.collectionRate)}% معوق` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Fee Item */}
      {isNewFeeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">تعریف سرفصل و تعرفه مالی جدید</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewFeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFeeItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان سرفصل مالی
                </label>
                <input
                  type="text"
                  value={newFeeTitle}
                  onChange={(e) => setNewFeeTitle(e.target.value)}
                  placeholder="مثال: هزینه بیمه حوادث و کتاب‌های کمک‌آموزشی"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    دسته‌بندی مالی
                  </label>
                  <select
                    value={newFeeCategory}
                    onChange={(e) => setNewFeeCategory(e.target.value as FeeCategory)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="tuition">شهریه مصوب / ثبت‌نام</option>
                    <option value="service">سرویس ایاب و ذهاب</option>
                    <option value="extracurricular">کلاس‌های فوق‌برنامه و کارگاه</option>
                    <option value="nutrition">تغذیه و میان‌وعده</option>
                    <option value="insurance">بیمه حوادث دانش‌آموزی</option>
                    <option value="books">کتاب و بسته‌های آموزشی</option>
                    <option value="other">سایر خدمات آموزشی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مبلغ تعرفه (ریال)
                  </label>
                  <input
                    type="number"
                    step="1000000"
                    value={newFeeAmount}
                    onChange={(e) => setNewFeeAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <p className="text-[11px] text-emerald-700 font-medium">
                معادل فارسی: {formatPersianCurrency(newFeeAmount)}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    دامنه تخصیص
                  </label>
                  <select
                    value={newFeeScope}
                    onChange={(e) => setNewFeeScope(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="all">کلیه دانش‌آموزان آموزشگاه</option>
                    <option value="grade_10">فقط پایه دهم</option>
                    <option value="grade_11">فقط پایه یازدهم</option>
                    <option value="grade_12">فقط پایه دوازدهم</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مهلت و تاریخ سررسید
                  </label>
                  <input
                    type="text"
                    value={newFeeDueDate}
                    onChange={(e) => setNewFeeDueDate(e.target.value)}
                    placeholder="۱۴۰۴/۱۰/۳۰"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-fee-mandatory"
                  checked={newFeeMandatory}
                  onChange={(e) => setNewFeeMandatory(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chk-fee-mandatory" className="text-xs text-slate-700 cursor-pointer">
                  تعهد مالی اجباری برای تمام دانش‌آموزان هدف
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توضیحات و مصوبات شورا (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={newFeeDescription}
                  onChange={(e) => setNewFeeDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="مصوبه شورای مالی آموزشگاه..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewFeeModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  افزودن و تخصیص سرفصل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment for Any Student */}
      {isRecordPaymentModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">ثبت واریزی و سند دریافت وجه</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  انتخاب دانش‌آموز
                </label>
                <select
                  value={payStudentId}
                  onChange={(e) => {
                    setPayStudentId(e.target.value);
                    const st = students.find((s) => s.id === e.target.value);
                    if (st) {
                      const sum = st.financialSummary || createInitialStudentFinancialSummary(st.id, st.name, st.grade, 'normal_partial');
                      setPayAmount(Math.min(sum.remainingDebt, 5000000) || 5000000);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} ({st.grade} • کد: {toPersianDigits(st.nationalCode)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ واریزی (ریال)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  معادل فارسی: {formatPersianCurrency(payAmount)}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    روش دریافت
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="pos">کارتخوان آموزشگاه</option>
                    <option value="card_to_card">کارت به کارت</option>
                    <option value="online_gateway">درگاه آنلاین</option>
                    <option value="cheque">چک صیادی</option>
                    <option value="cash_deposit">فیش واریز نقدی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    کد پیگیری / شناسه فیش
                  </label>
                  <input
                    type="text"
                    value={payTrackingCode}
                    onChange={(e) => setPayTrackingCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بابت سرفصل
                </label>
                <input
                  type="text"
                  value={payFeeTitle}
                  onChange={(e) => setPayFeeTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توضیحات واریزکننده (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="اطلاعات کارت یا نام واریزکننده..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRecordPaymentModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  ثبت پرداخت و ارسال اعلان بله
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Batch Reminders to all overdue */}
      {isBatchReminderModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <Send className="w-5 h-5" />
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">ارسال پیامک و بله گروهی</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchReminderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                آیا از ارسال خودکار پیام یادآوری تسویه حساب برای کلیه اولیای دانش‌آموزان دارای قسط معوقه (مجموعاً {toPersianDigits(stats.overdueCount)} نفر) اطمینان دارید؟
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                پیام‌ها همزمان از طریق پیام‌رسان بله و سامانه پیامک ملی آموزش و پرورش با سرشماره رسمی آموزشگاه ارسال خواهند شد.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBatchReminderModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={handleBatchReminders}
                  className="min-h-[40px] px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  ارسال به همه بدهکاران
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
