import { FinancialAuditEntry, PaymentTransaction, SchoolFeeItem, Student, StudentFinancialSummary } from '../types';
import { getSchoolDate, toEnglishDigits } from './persianUtils';
import { normalizePaymentMethod } from './paymentUtils';

export class FinancialError extends Error {}
interface Operation { id: string; date: string; recordedBy: string }

export function createEmptyFinancialSummary(): StudentFinancialSummary {
  return { totalBilled: 0, totalDiscount: 0, totalPaid: 0, remainingDebt: 0, status: 'settled', assignedFees: [], installments: [], transactions: [] };
}

function money(value: number, positive = false): number {
  if (!Number.isSafeInteger(value) || value < (positive ? 1 : 0)) throw new FinancialError('مبلغ باید عدد صحیح معتبر بر حسب تومان باشد.');
  return value;
}
function sum(values: number[]): number { return money(values.reduce((total, value) => total + money(value), 0)); }
function dateKey(value: string): string {
  if (!value) return '';
  const match = toEnglishDigits(value).match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (!match || +match[2] < 1 || +match[2] > 12 || +match[3] < 1 || +match[3] > 31) throw new FinancialError('تاریخ مالی باید به صورت سال/ماه/روز شمسی باشد.');
  return `${match[1]}/${match[2].padStart(2, '0')}/${match[3].padStart(2, '0')}`;
}
function byDue(a: { dueDate?: string; id: string }, b: { dueDate?: string; id: string }): number {
  return (dateKey(a.dueDate || '') || '9999/99/99').localeCompare(dateKey(b.dueDate || '') || '9999/99/99') || a.id.localeCompare(b.id);
}
function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new FinancialError(`شناسه تکراری در ${label} وجود دارد؛ ابتدا سوابق را بررسی کنید.`);
}
const reference = (value: string) => toEnglishDigits(value).trim().replace(/\s/g, '');

/** Assignments and confirmed documents are authoritative; cached totals never add credit. */
export function calculateFinancialSummary(source: StudentFinancialSummary, today = getSchoolDate()): StudentFinancialSummary {
  const todayKey = dateKey(today);
  unique(source.assignedFees.map((fee) => fee.feeItemId), 'تعرفه‌ها');
  unique(source.installments.map((item) => item.id), 'اقساط');
  unique(source.transactions.map((txn) => txn.id), 'تراکنش‌ها');
  if ((!source.assignedFees.length && source.totalBilled > 0) || (!source.transactions.length && source.totalPaid > 0)) {
    throw new FinancialError('ریز تعرفه یا اسناد پرداخت این حساب کامل نیست؛ سوابق قبلی باید بررسی شوند.');
  }
  const fees = source.assignedFees.map((fee) => {
    const finalAmount = money(fee.originalAmount) - money(fee.discountAmount);
    if (finalAmount < 0) throw new FinancialError('تخفیف ثبت‌شده از مبلغ تعرفه بیشتر است.');
    dateKey(fee.dueDate || '');
    return { ...fee, finalAmount, paidAmount: 0 };
  });
  const totalBilled = sum(fees.map((fee) => fee.originalAmount));
  const totalDiscount = sum(fees.map((fee) => fee.discountAmount));
  const netBilled = totalBilled - totalDiscount;
  for (const txn of source.transactions) {
    money(txn.amount, true);
    dateKey(txn.date);
    if (!normalizePaymentMethod(txn.method) || !['confirmed', 'pending_verification', 'rejected'].includes(txn.status)) throw new FinancialError('روش یا وضعیت یکی از اسناد مالی نامعتبر است.');
    if (txn.feeItemId && !fees.some((fee) => fee.feeItemId === txn.feeItemId)) throw new FinancialError('تعرفه مرتبط با یکی از تراکنش‌ها در پرونده وجود ندارد.');
  }
  const confirmed = source.transactions.filter((txn) => txn.status === 'confirmed').slice().sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)) || a.id.localeCompare(b.id));
  const totalPaid = sum(confirmed.map((txn) => txn.amount));
  if (totalPaid > netBilled) throw new FinancialError('پرداخت تأییدشده از مبلغ قابل وصول بیشتر است؛ ایجاد اعتبار بستانکار در این نسخه پشتیبانی نمی‌شود.');
  const orderedFees = [...fees].sort(byDue);
  // Explicitly targeted documents reserve their fee first; general payments then cover earliest due fees.
  for (const txn of [...confirmed.filter((item) => item.feeItemId), ...confirmed.filter((item) => !item.feeItemId)]) {
    let credit = txn.amount;
    for (const fee of orderedFees) {
      if (txn.feeItemId && fee.feeItemId !== txn.feeItemId) continue;
      const paid = Math.min(credit, fee.finalAmount - fee.paidAmount);
      fee.paidAmount += paid;
      credit -= paid;
      if (!credit) break;
    }
    if (credit) throw new FinancialError('مبلغ سند از مانده تعرفه انتخاب‌شده بیشتر است.');
  }
  const installments = source.installments.map((item) => {
    money(item.amount); dateKey(item.dueDate);
    return { ...item, paidAmount: 0, paidDate: undefined as string | undefined, trackingCode: undefined as string | undefined };
  });
  if (sum(installments.map((item) => item.amount)) !== netBilled) throw new FinancialError('جمع برنامه اقساط با مبلغ خالص تعرفه‌ها برابر نیست؛ برنامه اقساط باید بررسی شود.');
  const orderedInstallments = [...installments].sort(byDue);
  for (const txn of confirmed) {
    let credit = txn.amount;
    for (const item of orderedInstallments) {
      const paid = Math.min(credit, item.amount - item.paidAmount);
      item.paidAmount += paid;
      credit -= paid;
      if (paid && item.paidAmount === item.amount) { item.paidDate = txn.date; item.trackingCode = txn.trackingCode; }
      if (!credit) break;
    }
  }
  const overdue = (item: { dueDate?: string; paidAmount: number; amount: number }) => item.paidAmount < item.amount && !!item.dueDate && dateKey(item.dueDate) < todayKey;
  const remainingDebt = netBilled - totalPaid;
  return {
    ...source, totalBilled, totalDiscount, totalPaid, remainingDebt,
    assignedFees: fees.map((fee) => ({ ...fee, status: fee.paidAmount === fee.finalAmount ? 'paid' : fee.paidAmount ? 'partial' : 'unpaid' })),
    installments: installments.map((item) => ({ ...item, status: item.paidAmount === item.amount ? 'paid' : overdue(item) ? 'overdue' : item.paidAmount ? 'partially_paid' : 'pending' })),
    status: !remainingDebt ? 'settled' : installments.some(overdue) ? 'overdue' : 'has_debt'
  };
}

export function readFinancialSummary(source?: StudentFinancialSummary, today = getSchoolDate()): { summary: StudentFinancialSummary; error?: string } {
  const summary = source || createEmptyFinancialSummary();
  try { return { summary: calculateFinancialSummary(summary, today) }; }
  catch (error) {
    if (!(error instanceof FinancialError)) throw error;
    return { summary, error: error.message };
  }
}

function audit(source: StudentFinancialSummary, next: StudentFinancialSummary, operation: Operation, action: FinancialAuditEntry['action'], referenceId: string, change?: Pick<FinancialAuditEntry, 'previousStatus' | 'nextStatus'>): StudentFinancialSummary {
  const { totalBilled, totalDiscount, totalPaid, remainingDebt } = source;
  return { ...next, audit: [{ ...operation, action, referenceId, previousTotals: { totalBilled, totalDiscount, totalPaid, remainingDebt }, ...change }, ...(source.audit || [])] };
}

export function recordPayment(source: StudentFinancialSummary, payment: PaymentTransaction, operation: Operation): StudentFinancialSummary {
  const base = calculateFinancialSummary(source, operation.date);
  money(payment.amount, true);
  if (!reference(payment.trackingCode)) throw new FinancialError('شماره پیگیری پرداخت را وارد کنید.');
  if (base.transactions.some((txn) => txn.id === payment.id || (normalizePaymentMethod(txn.method) === payment.method && reference(txn.trackingCode) === reference(payment.trackingCode)))) throw new FinancialError('این شماره پیگیری با همین روش پرداخت قبلاً در پرونده ثبت شده است.');
  if (payment.amount > base.remainingDebt) throw new FinancialError('مبلغ پرداخت از مانده قابل پرداخت بیشتر است.');
  if (payment.feeItemId) {
    const fee = base.assignedFees.find((item) => item.feeItemId === payment.feeItemId);
    if (!fee || payment.amount > fee.finalAmount - fee.paidAmount) throw new FinancialError('مبلغ پرداخت از مانده تعرفه انتخاب‌شده بیشتر است.');
  }
  const next = calculateFinancialSummary({ ...base, transactions: [payment, ...base.transactions] }, operation.date);
  return audit(source, next, operation, 'payment_recorded', payment.id);
}

export function changePaymentStatus(source: StudentFinancialSummary, id: string, status: 'confirmed' | 'rejected', operation: Operation): StudentFinancialSummary {
  const transaction = source.transactions.find((txn) => txn.id === id);
  if (!transaction) throw new FinancialError('سند پرداخت یافت نشد.');
  if (transaction.status === status) return source;
  const next = calculateFinancialSummary({ ...source, transactions: source.transactions.map((txn) => txn.id === id ? { ...txn, status } : txn) }, operation.date);
  return audit(source, next, operation, 'payment_status_changed', id, { previousStatus: transaction.status, nextStatus: status });
}

export function grantDiscount(source: StudentFinancialSummary, feeItemId: string, amount: number, reason: string, operation: Operation): StudentFinancialSummary {
  const base = calculateFinancialSummary(source, operation.date);
  money(amount, true);
  if (!reason.trim()) throw new FinancialError('علت تخفیف را وارد کنید.');
  const fee = base.assignedFees.find((item) => item.feeItemId === feeItemId);
  if (!fee || amount > fee.finalAmount - fee.paidAmount || amount > base.remainingDebt) throw new FinancialError('تخفیف از مانده پرداخت‌نشده تعرفه بیشتر است.');
  let remaining = amount;
  const installments = base.installments.map((item) => ({ ...item }));
  for (const item of [...installments].sort(byDue).reverse()) {
    const reduction = Math.min(remaining, item.amount - item.paidAmount);
    if (reduction) { item.originalAmount ??= item.amount; item.amount -= reduction; remaining -= reduction; }
    if (!remaining) break;
  }
  if (remaining) throw new FinancialError('برنامه اقساط ظرفیت اعمال این تخفیف را ندارد.');
  const next = calculateFinancialSummary({
    ...base, installments,
    assignedFees: base.assignedFees.map((item) => item.feeItemId === feeItemId ? { ...item, discountAmount: item.discountAmount + amount } : item),
    discounts: [{ ...operation, feeItemId, amount, reason: reason.trim() }, ...(base.discounts || [])]
  }, operation.date);
  return audit(source, next, operation, 'discount_applied', feeItemId);
}

export function assignFee(source: StudentFinancialSummary, fee: SchoolFeeItem, operation: Operation): StudentFinancialSummary {
  if (source.assignedFees.some((item) => item.feeItemId === fee.id)) return source;
  if (!['tuition', 'registration_insurance', 'extracurricular', 'transportation', 'catering', 'uniform_supplies', 'camp_event', 'custom'].includes(fee.category) || !['all', 'grade_10', 'grade_11', 'grade_12', 'selective'].includes(fee.targetScope)) throw new FinancialError('دسته‌بندی یا دامنه تعرفه معتبر نیست.');
  money(fee.amount, true);
  const base = calculateFinancialSummary(source, operation.date);
  const next = calculateFinancialSummary({
    ...base,
    assignedFees: [...base.assignedFees, { id: `${operation.id}-fee`, feeItemId: fee.id, feeTitle: fee.title, category: fee.category, originalAmount: fee.amount, discountAmount: 0, finalAmount: fee.amount, paidAmount: 0, status: 'unpaid', dueDate: fee.dueDate }],
    installments: [...base.installments, { id: `${operation.id}-due`, title: `سررسید ${fee.title}`, amount: fee.amount, paidAmount: 0, dueDate: fee.dueDate || '', status: 'pending' }]
  }, operation.date);
  return audit(source, next, operation, 'fee_assigned', fee.id);
}

export function matchesFeeTarget(student: Student, fee: SchoolFeeItem, scope = fee.targetScope, classId?: string): boolean {
  if (student.schoolId !== fee.schoolId || (student.status && student.status !== 'active') || (classId && student.classGroupId !== classId)) return false;
  if (scope === 'all') return true;
  if (scope === 'selective') return !!classId;
  const grade = toEnglishDigits(student.grade).replace(/^پایه\s*/, '').trim();
  return scope === 'grade_10' ? grade === 'دهم' || grade === '10' : scope === 'grade_11' ? grade === 'یازدهم' || grade === '11' : scope === 'grade_12' ? grade === 'دوازدهم' || grade === '12' : false;
}
