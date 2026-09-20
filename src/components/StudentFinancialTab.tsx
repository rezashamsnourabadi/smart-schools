import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Plus,
  Receipt,
  Percent,
  Calendar,
  Building2,
  ArrowDownLeft,
  FileCheck2,
  AlertTriangle,
  FileText,
  Lock,
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, PaymentMethod } from '../types';
import { toPersianDigits, formatPersianCurrency } from '../utils/persianUtils';
import { createInitialStudentFinancialSummary } from '../data/mockFinanceData';
import { ParentPaymentModal } from './ParentPaymentModal';

interface StudentFinancialTabProps {
  student: Student;
}

export const StudentFinancialTab: React.FC<StudentFinancialTabProps> = ({ student }) => {
  const {
    currentRole,
    activeVicePrincipalPermissions,
    recordStudentPayment,
    sendPaymentReminder,
    applyStudentDiscount
  } = useApp();

  const canManage =
    currentRole === 'principal' ||
    currentRole === 'platform_admin' ||
    (currentRole === 'vice_principal' && activeVicePrincipalPermissions.canManageFinances);

  const isParent = currentRole === 'parent';

  const summary = student.financialSummary || createInitialStudentFinancialSummary(
    student.id,
    student.name,
    student.grade,
    'normal_partial'
  );

  // Modals state
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showParentPayModal, setShowParentPayModal] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string | undefined>();

  // New payment form
  const [payAmount, setPayAmount] = useState<number>(Math.min(summary.remainingDebt, 5000000) || 5000000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('pos');
  const [payTrackingCode, setPayTrackingCode] = useState<string>(() => Math.floor(100000 + Math.random() * 900000).toString());
  const [payFeeTitle, setPayFeeTitle] = useState<string>('شهریه مصوب آموزشگاه');
  const [payNote, setPayNote] = useState<string>('');

  // Discount form
  const [discountAmount, setDiscountAmount] = useState<number>(1000000);
  const [discountReason, setDiscountReason] = useState<string>('تخفیف فرزند فرهنگی / ممتاز');
  const [selectedFeeItemId, setSelectedFeeItemId] = useState<string>(summary.assignedFees[0]?.feeItemId || '');

  // Reminder form
  const [reminderMessage, setReminderMessage] = useState<string>(
    `ولی محترم دانش‌آموز ${student.name}؛ با سلام و احترام، طبق سوابق مالی آموزشگاه، مانده بدهی معوق شهریه مبلغ ${formatPersianCurrency(summary.remainingDebt)} می‌باشد. خواهشمند است جهت تسویه حساب اقدام فرمایید.`
  );

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    recordStudentPayment({
      studentId: student.id,
      studentName: student.name,
      schoolId: student.schoolId,
      amount: payAmount,
      trackingCode: payTrackingCode,
      method: payMethod,
      feeTitle: payFeeTitle,
      note: payNote,
      recordedBy: currentRole === 'principal' ? 'مدیر آموزشگاه' : currentRole === 'vice_principal' ? 'معاون اجرایی' : 'کاربر سیستم',
      status: 'confirmed'
    });

    setShowPayModal(false);
    setPayTrackingCode(Math.floor(100000 + Math.random() * 900000).toString());
  };

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountAmount <= 0) return;
    const targetFeeId = selectedFeeItemId || summary.assignedFees[0]?.feeItemId;
    if (!targetFeeId) return;

    applyStudentDiscount(student.id, targetFeeId, discountAmount, discountReason);
    setShowDiscountModal(false);
  };

  const handleSendReminder = () => {
    sendPaymentReminder(student.id, reminderMessage);
    setShowReminderModal(false);
  };

  // Status badge helper
  const renderStatusBadge = () => {
    if (summary.status === 'settled' || summary.remainingDebt <= 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          تسویه کامل حساب
        </span>
      );
    }
    if (summary.status === 'overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-bold animate-pulse">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          دارای قسط معوقه (اخطار دیرکرد)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">
        <Clock className="w-4 h-4 text-amber-600" />
        دارای مانده بدهی جاری
      </span>
    );
  };

  return (
    <div className="space-y-6" dir="rtl" id="student-financial-tab">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">کل صورتحساب</span>
            <FileText className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-base sm:text-lg font-bold text-slate-800">
            {formatPersianCurrency(summary.totalBilled)}
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-xs font-medium">مجموع پرداختی</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-emerald-800">
            {formatPersianCurrency(summary.totalPaid)}
          </div>
        </div>

        <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-medium">تخفیف و بورسیه</span>
            <Percent className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-purple-800">
            {formatPersianCurrency(summary.totalDiscount)}
          </div>
        </div>

        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-medium">مانده بدهی</span>
            <AlertCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-base sm:text-lg font-bold text-rose-800">
            {formatPersianCurrency(summary.remainingDebt)}
          </div>
        </div>
      </div>

      {/* Account Status and Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">وضعیت حساب:</span>
          {renderStatusBadge()}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Parent specific Pay Button */}
          {isParent && summary.remainingDebt > 0 && (
            <button
              type="button"
              id="btn-parent-open-pay-modal"
              onClick={() => {
                setSelectedInstallmentId(undefined);
                setShowParentPayModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              پرداخت آنلاین شهریه / ثبت فیش
            </button>
          )}

          {canManage && (
            <>
              <button
                type="button"
                id="btn-open-record-payment"
                onClick={() => setShowPayModal(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                ثبت واریزی جدید
              </button>

              {summary.remainingDebt > 0 && (
                <button
                  type="button"
                  id="btn-open-payment-reminder"
                  onClick={() => setShowReminderModal(true)}
                  className="px-3 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  ارسال یادآوری بله / SMS
                </button>
              )}

              <button
                type="button"
                id="btn-open-discount-modal"
                onClick={() => setShowDiscountModal(true)}
                className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
              >
                <Percent className="w-4 h-4" />
                اعمال تخفیف / بورسیه
              </button>
            </>
          )}
        </div>
      </div>

      {/* Installments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-bold text-slate-800">دفترچه اقساط شهریه و تعهدات</h4>
          </div>
          <span className="text-xs text-slate-500">
            {toPersianDigits(summary.installments.length)} قسط مصوب
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">عنوان قسط</th>
                <th className="py-2.5 px-4">مبلغ تعهد</th>
                <th className="py-2.5 px-4">سررسید</th>
                <th className="py-2.5 px-4">وصولی</th>
                <th className="py-2.5 px-4">وضعیت</th>
                <th className="py-2.5 px-4">پیگیری</th>
                <th className="py-2.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary.installments.map((inst) => {
                const isPaid = inst.status === 'paid';
                const isOverdue = inst.status === 'overdue';
                const isPartial = inst.status === 'partially_paid';

                return (
                  <tr key={inst.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-800">{inst.title}</td>
                    <td className="py-3 px-4 font-mono font-bold">{formatPersianCurrency(inst.amount)}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{inst.dueDate}</td>
                    <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                      {formatPersianCurrency(inst.paidAmount)}
                    </td>
                    <td className="py-3 px-4">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          پرداخت شده
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[11px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          سررسید گذشته
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold">
                          <Clock className="w-3 h-3 text-amber-600" />
                          پرداخت ناقص
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-medium">
                          در انتظار سررسید
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {inst.trackingCode ? toPersianDigits(inst.trackingCode) : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {!isPaid ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (isParent) {
                              setSelectedInstallmentId(inst.id);
                              setShowParentPayModal(true);
                            } else {
                              setPayFeeTitle(`قسط: ${inst.title}`);
                              setPayAmount(Math.max(0, inst.amount - inst.paidAmount));
                              setShowPayModal(true);
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>پرداخت قسط</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          تسویه
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assigned Fees Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-bold text-slate-800">تفکیک سرفصل‌های مصوب شهریه و خدمات</h4>
          </div>
          <span className="text-xs text-slate-500">
            {toPersianDigits(summary.assignedFees.length)} سرفصل تخصیص‌یافته
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">عنوان سرفصل</th>
                <th className="py-2.5 px-4">مبلغ اولیه</th>
                <th className="py-2.5 px-4">تخفیف</th>
                <th className="py-2.5 px-4">مبلغ نهایی</th>
                <th className="py-2.5 px-4">پرداختی</th>
                <th className="py-2.5 px-4">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {summary.assignedFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{fee.feeTitle}</span>
                    {fee.dueDate && (
                      <span className="text-[11px] text-slate-400">مهلت: {fee.dueDate}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono">{formatPersianCurrency(fee.originalAmount)}</td>
                  <td className="py-3 px-4 font-mono text-purple-700">
                    {fee.discountAmount > 0 ? formatPersianCurrency(fee.discountAmount) : '—'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-800">
                    {formatPersianCurrency(fee.finalAmount)}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">
                    {formatPersianCurrency(fee.paidAmount)}
                  </td>
                  <td className="py-3 px-4">
                    {fee.status === 'paid' ? (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[11px] font-bold">
                        تسویه کامل
                      </span>
                    ) : fee.status === 'partial' ? (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[11px] font-bold">
                        پرداخت بخشی
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md text-[11px] font-bold">
                        پرداخت‌نشده
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <h4 className="text-sm font-bold text-slate-800">سوابق اسناد مالی و واریزی‌های بانکی</h4>
          </div>
          <span className="text-xs text-slate-500">
            {toPersianDigits(summary.transactions.length)} تراکنش ثبت‌شده
          </span>
        </div>

        {summary.transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            هنوز تراکنش یا سند پرداختی برای این دانش‌آموز ثبت نشده است.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {summary.transactions.map((txn) => (
              <div key={txn.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                    <ArrowDownLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">
                        {formatPersianCurrency(txn.amount)}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px]">
                        {txn.method === 'pos'
                          ? 'کارتخوان آموزشگاه'
                          : txn.method === 'card_to_card'
                          ? 'کارت به کارت'
                          : txn.method === 'cheque'
                          ? 'چک صیادی'
                          : txn.method === 'online_gateway'
                          ? 'درگاه آنلاین'
                          : 'فیش نقدی / واریز به حساب'}
                      </span>
                      {txn.status === 'confirmed' && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium flex items-center gap-1">
                          <FileCheck2 className="w-3 h-3" />
                          تایید شده
                        </span>
                      )}
                    </div>
                    <div className="text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                      <span>بابت: {txn.feeTitle || 'شهریه مصوب'}</span>
                      <span>تاریخ: {toPersianDigits(txn.date)}</span>
                      <span>پیگیری: {toPersianDigits(txn.trackingCode)}</span>
                      <span>ثبت‌کننده: {txn.recordedBy}</span>
                    </div>
                    {txn.note && (
                      <p className="text-slate-400 mt-1 text-[11px]">توضیحات: {txn.note}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Record Payment */}
      {showPayModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-base">ثبت واریزی و سند پرداخت جدید</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ پرداختی (ریال)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-slate-400">پیش‌فرض‌ها:</span>
                  {summary.remainingDebt > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(summary.remainingDebt)}
                      className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] rounded-md font-mono"
                    >
                      تسویه کل ({formatPersianCurrency(summary.remainingDebt)})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPayAmount(5000000)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-md font-mono"
                  >
                    ۵۰,۰۰۰,۰۰۰
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayAmount(10000000)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] rounded-md font-mono"
                  >
                    ۱۰۰,۰۰۰,۰۰۰
                  </button>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                  معادل فارسی: {formatPersianCurrency(payAmount)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    روش پرداخت
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="pos">دستگاه پوز آموزشگاه</option>
                    <option value="card_to_card">کارت به کارت</option>
                    <option value="online_gateway">درگاه پرداخت الکترونیکی</option>
                    <option value="cheque">چک صیادی</option>
                    <option value="cash_deposit">فیش واریز نقدی به حساب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شماره پیگیری / فیش
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
                  placeholder="مثلاً: قسط اول شهریه مصوب"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توضیحات یا نام واریزکننده (اختیاری)
                </label>
                <textarea
                  rows={2}
                  value={payNote}
                  onChange={(e) => setPayNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  placeholder="مثال: واریز توسط مادر دانش‌آموز از کارت بانک ملی"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  با ثبت این پرداخت، پیامک و اعلان پیام‌رسان بله به شماره اولیا ({toPersianDigits(student.parentPhone)}) به همراه شناسه پرداخت ارسال خواهد شد.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  id="btn-confirm-record-payment"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  ثبت قطعی و صدور رسید
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Apply Discount */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800 text-base">اعمال تخفیف / بورسیه تحصیلی</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiscountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplyDiscount} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سرفصل مورد نظر جهت اعمال تخفیف
                </label>
                <select
                  value={selectedFeeItemId}
                  onChange={(e) => setSelectedFeeItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  {summary.assignedFees.map((fee) => (
                    <option key={fee.feeItemId} value={fee.feeItemId}>
                      {fee.feeTitle} (مبلغ قابل پرداخت: {formatPersianCurrency(fee.finalAmount)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ تخفیف (ریال)
                </label>
                <input
                  type="number"
                  step="500000"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-left focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  required
                />
                <p className="text-[11px] text-purple-700 mt-1 font-medium">
                  معادل: {formatPersianCurrency(discountAmount)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  علت یا بند تخفیف
                </label>
                <select
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                >
                  <option value="تخفیف فرزند فرهنگی / شاغل در آموزش و پرورش">تخفیف فرزند فرهنگی / شاغل در آموزش و پرورش</option>
                  <option value="بورسیه تحصیلی رتبه ممتاز علمی و المپیاد">بورسیه تحصیلی رتبه ممتاز علمی و المپیاد</option>
                  <option value="تخفیف ثبت‌نام همزمان خواهر یا برادر در آموزشگاه">تخفیف ثبت‌نام همزمان خواهر یا برادر در آموزشگاه</option>
                  <option value="تخفیف حامیان خیرین و امور عام‌المنفعه">تخفیف حامیان خیرین و امور عام‌المنفعه</option>
                  <option value="سایر ملاحظات مدیریت آموزشگاه">سایر ملاحظات مدیریت آموزشگاه</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowDiscountModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  id="btn-confirm-apply-discount"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  ثبت تخفیف در پرونده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment Reminder */}
      {showReminderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-800 text-base">ارسال پیام یادآوری تسویه شهریه</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">گیرنده:</span>
                  <span className="font-bold text-slate-800">{student.parentName} ({student.name})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شماره همراه اولیا:</span>
                  <span className="font-mono text-slate-700">{toPersianDigits(student.parentPhone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شناسه پیام‌رسان بله:</span>
                  <span className="font-mono text-teal-700">{student.parentBaleAccount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">مانده بدهی معوق:</span>
                  <span className="font-bold text-rose-700">{formatPersianCurrency(summary.remainingDebt)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  متن پیام ارسالی به پیام‌رسان بله و پیامک
                </label>
                <textarea
                  rows={4}
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-medium hover:bg-slate-100 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  id="btn-confirm-send-reminder"
                  onClick={handleSendReminder}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  تایید و ارسال فوری
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Parent Dedicated Online Payment Modal */}
      <ParentPaymentModal
        isOpen={showParentPayModal}
        onClose={() => {
          setShowParentPayModal(false);
          setSelectedInstallmentId(undefined);
        }}
        student={student}
        preselectedInstallmentId={selectedInstallmentId}
      />
    </div>
  );
};
