import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  X,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  Receipt,
  FileCheck2,
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student, PaymentMethod } from '../types';
import { toPersianDigits, formatPersianCurrency } from '../utils/persianUtils';
import { createInitialStudentFinancialSummary } from '../data/mockFinanceData';

interface ParentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  preselectedInstallmentId?: string;
}

export const ParentPaymentModal: React.FC<ParentPaymentModalProps> = ({
  isOpen,
  onClose,
  student,
  preselectedInstallmentId
}) => {
  const { currentSchool, currentUser, recordStudentPayment } = useApp();

  const summary = student.financialSummary || createInitialStudentFinancialSummary(
    student.id,
    student.name,
    student.grade,
    'normal_partial'
  );

  const [activeStep, setActiveStep] = useState<'details' | 'gateway' | 'receipt'>('details');
  const [selectedFee, setSelectedFee] = useState<string>('قسط شهریه مصوب آموزشگاه');
  const [payAmount, setPayAmount] = useState<number>(() => {
    if (preselectedInstallmentId) {
      const inst = summary.installments.find((i) => i.id === preselectedInstallmentId);
      if (inst) return Math.max(0, inst.amount - inst.paidAmount);
    }
    return Math.min(summary.remainingDebt, 5000000) || 5000000;
  });
  const [payMethod, setPayMethod] = useState<PaymentMethod>('online_gateway');
  const [receiptNumber, setReceiptNumber] = useState<string>(() => Math.floor(10000000 + Math.random() * 90000000).toString());
  const [parentNote, setParentNote] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;

    if (payMethod === 'online_gateway') {
      setActiveStep('gateway');
    } else {
      // Offline receipt submission (card-to-card or bank deposit)
      finalizePayment();
    }
  };

  const finalizePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const generatedTracking = receiptNumber || Math.floor(10000000 + Math.random() * 90000000).toString();
      recordStudentPayment({
        studentId: student.id,
        studentName: student.name,
        schoolId: student.schoolId,
        amount: payAmount,
        trackingCode: generatedTracking,
        method: payMethod,
        feeTitle: selectedFee,
        note: parentNote || `پرداخت توسط ولی دانش‌آموز (${currentUser.name})`,
        recordedBy: `ولی دانش‌آموز (${currentUser.name})`,
        status: 'confirmed'
      });
      setIsProcessing(false);
      setActiveStep('receipt');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto" dir="rtl">
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-teal-800 text-white p-5 sm:p-6 shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            title="بستن"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                درگاه پرداخت شهریه و خدمات مدرسه
              </h2>
              <p className="text-teal-100 text-xs mt-0.5">
                دانش‌آموز: <strong>{student.name}</strong> • آموزشگاه: {currentSchool?.name || 'مدرسه هوشمند'}
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeStep === 'details' && (
            <form onSubmit={handleStartPayment} className="space-y-4">
              {/* Financial Snapshot */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-medium block">مانده بدهی قابل پرداخت:</span>
                  <div className="text-lg sm:text-xl font-black text-emerald-950 mt-0.5">
                    {formatPersianCurrency(summary.remainingDebt)}
                  </div>
                </div>
                <div className="text-left text-xs text-emerald-800">
                  <span>کل صورتحساب: {formatPersianCurrency(summary.totalBilled)}</span>
                  <br />
                  <span>کل پرداختی قبلی: {formatPersianCurrency(summary.totalPaid)}</span>
                </div>
              </div>

              {/* Installment selection if available */}
              {summary.installments.some((i) => i.status !== 'paid') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    انتخاب قسط مورد نظر جهت پرداخت
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {summary.installments.map((inst) => {
                      const remain = Math.max(0, inst.amount - inst.paidAmount);
                      const isSelected = payAmount === remain && selectedFee.includes(inst.title);
                      return (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => {
                            setSelectedFee(`قسط: ${inst.title}`);
                            setPayAmount(remain > 0 ? remain : inst.amount);
                          }}
                          className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                              : inst.status === 'paid'
                              ? 'border-slate-200 bg-slate-50 opacity-60'
                              : 'border-slate-200 hover:border-emerald-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold">{inst.title}</span>
                            {inst.status === 'paid' ? (
                              <span className="text-[10px] text-emerald-700 font-bold">تسویه‌شده</span>
                            ) : inst.status === 'overdue' ? (
                              <span className="text-[10px] text-rose-700 font-bold">معوقه</span>
                            ) : (
                              <span className="text-[10px] text-amber-700 font-bold">سررسید: {inst.dueDate}</span>
                            )}
                          </div>
                          <div className="mt-2 text-xs font-mono font-bold text-slate-700">
                            {formatPersianCurrency(remain > 0 ? remain : inst.amount)}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مبلغ واریزی (ریال)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="500000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    required
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between mt-1.5 gap-2">
                  <p className="text-xs text-emerald-700 font-semibold">
                    معادل: {formatPersianCurrency(payAmount)}
                  </p>
                  {summary.remainingDebt > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayAmount(summary.remainingDebt)}
                      className="text-xs text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer"
                    >
                      تسویه کل مانده بدهی ({formatPersianCurrency(summary.remainingDebt)})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  روش پرداخت
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <label
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      payMethod === 'online_gateway'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="online_gateway"
                      checked={payMethod === 'online_gateway'}
                      onChange={() => setPayMethod('online_gateway')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold">درگاه شتابی آنلاین</div>
                      <div className="text-[10px] text-slate-500">کارت کلیه بانک‌ها شاپرک</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      payMethod === 'card_to_card'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="card_to_card"
                      checked={payMethod === 'card_to_card'}
                      onChange={() => setPayMethod('card_to_card')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold">کارت به کارت</div>
                      <div className="text-[10px] text-slate-500">واریز و ثبت فیش پیگیری</div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                      payMethod === 'cash_deposit'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash_deposit"
                      checked={payMethod === 'cash_deposit'}
                      onChange={() => setPayMethod('cash_deposit')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold">فیش واریز شعبه</div>
                      <div className="text-[10px] text-slate-500">حساب بانکی آموزشگاه</div>
                    </div>
                  </label>
                </div>
              </div>

              {payMethod !== 'online_gateway' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-slate-800">
                    شماره حساب و کارت آموزشگاه:
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-800 flex justify-between items-center">
                    <span>شماره کارت آموزشگاه:</span>
                    <strong className="text-emerald-800 tracking-wider">۶۰۳۷-۹۹۷۵-۱۲۳۴-۵۶۷۸</strong>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      شماره پیگیری فیش بانکی / شماره ارجاع
                    </label>
                    <input
                      type="text"
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="مثال: ۸۹۷۲۳۴۱"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توضیحات یا یادداشت ولی (اختیاری)
                </label>
                <input
                  type="text"
                  value={parentNote}
                  onChange={(e) => setParentNote(e.target.value)}
                  placeholder="مثال: پرداخت قسط اول شهریه سال تحصیلی جدید"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  id="btn-parent-submit-payment"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {payMethod === 'online_gateway' ? 'اتصال به درگاه امن شاپرک' : 'ثبت قطعی پرداخت فیش'}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Online Gateway Simulation */}
          {activeStep === 'gateway' && (
            <div className="space-y-4 py-2">
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold">سامانه درگاه پرداخت الکترونیکی (شاپرک)</div>
                    <div className="text-[10px] text-slate-400">اتصال امن SSL ۲۵۶ بیتی</div>
                  </div>
                </div>
                <div className="text-left font-mono text-sm text-emerald-400 font-bold">
                  {formatPersianCurrency(payAmount)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">پذیرنده:</span>
                  <span className="font-bold text-slate-800">{currentSchool?.name || 'آموزشگاه هوشمند'}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">دانش‌آموز ذینفع:</span>
                  <span className="font-bold text-slate-800">{student.name} ({student.grade})</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">کارت پرداخت:</span>
                  <span className="font-mono font-bold text-slate-800">۵۰۲۲-۲۹**-****-۳۸۲۱</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">شماره سفارش / ترمینال:</span>
                  <span className="font-mono text-slate-600">{toPersianDigits(receiptNumber)}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-600 shrink-0" />
                <span>رمز یکبار مصرف پویا (OTP) به شماره همراه ولی ارسال و آماده تایید است.</span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveStep('details')}
                  disabled={isProcessing}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  بازگشت
                </button>
                <button
                  type="button"
                  id="btn-confirm-gateway-payment"
                  onClick={finalizePayment}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>در حال تراکنش بانکی...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تایید و پرداخت {formatPersianCurrency(payAmount)}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Receipt Step */}
          {activeStep === 'receipt' && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">پرداخت با موفقیت انجام شد</h3>
                <p className="text-xs text-slate-500 mt-1">
                  سند مالی ثبت و رسید الکترونیکی در پیام‌رسان بله و پیامک برای شما ارسال شد.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-right space-y-2 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">مبلغ واریز:</span>
                  <span className="font-bold font-mono text-emerald-700 text-sm">{formatPersianCurrency(payAmount)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">کد پیگیری تراکنش:</span>
                  <span className="font-mono font-bold text-slate-800">{toPersianDigits(receiptNumber)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-200">
                  <span className="text-slate-500">دانش‌آموز:</span>
                  <span className="font-bold text-slate-800">{student.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">وضعیت سند:</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <FileCheck2 className="w-3.5 h-3.5" />
                    تایید شده و ثبت در پرونده مالی
                  </span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  id="btn-close-payment-receipt"
                  onClick={onClose}
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  بستن و مشاهده کارنامه مالی دانش‌آموز
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
