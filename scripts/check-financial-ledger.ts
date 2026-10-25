import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { AppProvider, useApp } from '../src/context/AppContext';
import { INITIAL_STUDENTS } from '../src/data/mockData';
import { createInitialStudentFinancialSummary } from '../src/data/mockFinanceData';
import { PaymentTransaction, SchoolFeeItem, StudentFinancialSummary } from '../src/types';
import { assignFee, calculateFinancialSummary, changePaymentStatus, createEmptyFinancialSummary, FinancialError, grantDiscount, matchesFeeTarget, readFinancialSummary, recordPayment } from '../src/utils/financialLedger';

const date = '1404/10/15';
const operation = (id: string) => ({ id, date, recordedBy: 'آزمون محدود' });
const fee = (id: string, amount: number, dueDate: string): SchoolFeeItem => ({ id, title: id, schoolId: 'school-1', academicYearId: 'ay-1404-1405', category: 'tuition', amount, isMandatory: true, targetScope: 'all', createdAt: date, dueDate });
const firstFee = fee('fee-1', 1000, '1404/10/01');
const secondFee = fee('fee-2', 500, '1404/11/01');
const base = assignFee(assignFee(createEmptyFinancialSummary(), firstFee, operation('assign-a')), secondFee, operation('assign-b'));
function payment(id: string, amount: number, status: PaymentTransaction['status'] = 'confirmed', feeItemId?: string): PaymentTransaction {
  return { id, amount, status, feeItemId, studentId: 'std-1', studentName: 'نمونه', schoolId: 'school-1', method: 'pos', trackingCode: id, date, recordedBy: 'آزمون محدود' };
}
function invariant(summary: StudentFinancialSummary) {
  assert.equal(summary.totalBilled - summary.totalDiscount - summary.totalPaid, summary.remainingDebt);
  assert.equal(summary.assignedFees.reduce((sum, item) => sum + item.paidAmount, 0), summary.totalPaid);
  assert.equal(summary.installments.reduce((sum, item) => sum + item.paidAmount, 0), summary.totalPaid);
  assert.equal(summary.installments.reduce((sum, item) => sum + item.amount, 0), summary.totalBilled - summary.totalDiscount);
  assert.ok(summary.remainingDebt >= 0);
}
function freeze(value: object) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child);
  return Object.freeze(value);
}
freeze(base);
const before = JSON.stringify(base);
const pending = recordPayment(base, payment('pending', 300, 'pending_verification'), operation('record-pending'));
assert.equal(pending.totalPaid, 0);
assert.equal(pending.remainingDebt, 1500);
const confirmed = changePaymentStatus(pending, 'pending', 'confirmed', operation('approve'));
assert.equal(confirmed.totalPaid, 300);
assert.equal(confirmed.assignedFees[0].paidAmount, 300, 'General payments cover earliest due fees');
invariant(confirmed);
assert.equal(changePaymentStatus(confirmed, 'pending', 'confirmed', operation('approve-again')), confirmed);
const rejected = changePaymentStatus(confirmed, 'pending', 'rejected', operation('reject'));
assert.equal(rejected.totalPaid, 0);
assert.equal(rejected.transactions.length, 1, 'Rejected documents must remain in the ledger');
assert.equal(rejected.installments[0].trackingCode, undefined);
invariant(rejected);
const again = changePaymentStatus(rejected, 'pending', 'confirmed', operation('restore'));
const general = recordPayment(again, payment('general', 200), operation('general'));
const targeted = recordPayment(general, payment('targeted', 200, 'confirmed', secondFee.id), operation('targeted'));
assert.deepEqual(targeted.assignedFees.map((item) => item.paidAmount), [500, 200]);
invariant(targeted);
const discounted = grantDiscount(targeted, firstFee.id, 200, 'بورسیه ثبت‌شده', operation('discount'));
assert.equal(discounted.totalDiscount, 200);
assert.equal(discounted.discounts?.[0].recordedBy, 'آزمون محدود');
assert.equal(discounted.discounts?.[0].reason, 'بورسیه ثبت‌شده');
assert.equal(discounted.installments[1].originalAmount, 500);
assert.ok(discounted.audit?.[0].previousTotals);
invariant(discounted);
assert.throws(() => grantDiscount(discounted, firstFee.id, 301, 'بیش از مانده', operation('bad-discount')), FinancialError);
assert.throws(() => grantDiscount(discounted, firstFee.id, 1, '', operation('missing-reason')), FinancialError);
for (const invalid of [-1, 0, Infinity, NaN, 0.5, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => recordPayment(base, payment('bad', invalid), operation('bad')), FinancialError);
}
assert.throws(() => recordPayment(base, payment('too-much', 1501), operation('too-much')), FinancialError);
assert.throws(() => recordPayment(targeted, payment('target-overpay', 301, 'confirmed', secondFee.id), operation('target-overpay')), FinancialError);
assert.throws(() => recordPayment(targeted, { ...payment('duplicate', 1), trackingCode: 'general' }, operation('duplicate')), FinancialError);
assert.throws(() => recordPayment(recordPayment(base, { ...payment('english', 1), trackingCode: '123' }, operation('english')), { ...payment('persian', 1), trackingCode: '۱۲۳' }, operation('persian')), FinancialError);
const pendingA = recordPayment(base, payment('a', 1200, 'pending_verification'), operation('a'));
const pendingB = recordPayment(pendingA, payment('b', 1200, 'pending_verification'), operation('b'));
const approvedA = changePaymentStatus(pendingB, 'a', 'confirmed', operation('a-confirmed'));
assert.throws(() => changePaymentStatus(approvedA, 'b', 'confirmed', operation('b-confirmed')), FinancialError);
assert.equal(approvedA.transactions.find((txn) => txn.id === 'b')?.status, 'pending_verification');
assert.equal(assignFee(base, firstFee, operation('duplicate-charge')), base);
assert.equal(matchesFeeTarget(INITIAL_STUDENTS[0], { ...firstFee, schoolId: 'other-school' }), false);
assert.equal(matchesFeeTarget(INITIAL_STUDENTS[0], { ...firstFee, targetScope: 'grade_11' }), false);
assert.equal(matchesFeeTarget({ ...INITIAL_STUDENTS[0], grade: 'پایه یازدهم' }, { ...firstFee, targetScope: 'grade_10' }), false);
assert.equal(matchesFeeTarget({ ...INITIAL_STUDENTS[0], grade: 'پایه دوازدهم' }, { ...firstFee, targetScope: 'grade_10' }), false);
assert.equal(matchesFeeTarget({ ...INITIAL_STUDENTS[0], grade: 'پایه ۱۰' }, { ...firstFee, targetScope: 'grade_10' }), true);
assert.equal(matchesFeeTarget(INITIAL_STUDENTS[0], { ...firstFee, targetScope: 'selective' }), false);
assert.equal(matchesFeeTarget(INITIAL_STUDENTS[0], { ...firstFee, targetScope: 'selective' }, 'selective', INITIAL_STUDENTS[0].classGroupId), true);
assert.equal(JSON.stringify(base), before, 'Operations must not mutate source records');
for (const variant of ['normal_partial', 'fully_paid', 'overdue_debtor', 'scholarship'] as const) invariant(calculateFinancialSummary(createInitialStudentFinancialSummary('std-1', 'نمونه', '', variant), date));
const broken = { ...base, installments: [] };
assert.ok(readFinancialSummary(broken, date).error);
assert.equal(readFinancialSummary(broken, date).summary, broken, 'Inconsistent historical data must be preserved');
const overpaid = { ...base, totalPaid: 1600, transactions: [payment('legacy-overpayment', 1600)] };
assert.equal(changePaymentStatus(overpaid, 'legacy-overpayment', 'rejected', operation('repair-rejection')).totalPaid, 0);

// Exercise actual Context commands and its synchronous snapshot without mocking React or browser UI.
const fixtureStudent = { ...INITIAL_STUDENTS[0], financialSummary: base };
const foreign = { ...fixtureStudent, id: 'foreign', schoolId: 'school-2' };
const stored = new Map([['smart_school_hub_data_v2_students', JSON.stringify([fixtureStudent, foreign])]]);
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => stored.get(key) ?? null } });
const captured: ReturnType<typeof useApp>[] = [];
function Probe() { captured.push(useApp()); return null; }
renderToString(createElement(AppProvider, { children: createElement(Probe) }));
const context = captured[0];
assert.equal(context.recordStudentPayment(payment('context-reference', 400)).ok, true);
assert.equal(context.recordStudentPayment(payment('context-reference', 400)).ok, false, 'Rapid duplicate submission must use the latest local snapshot');
assert.equal(context.recordStudentPayment(payment('excess-after-first', 1101)).ok, false);
assert.equal(context.recordStudentPayment({ ...payment('foreign-payment', 100), studentId: foreign.id, schoolId: foreign.schoolId }).ok, false);
assert.equal(context.applyStudentDiscount(fixtureStudent.id, firstFee.id, 600, 'تخفیف مجاز').ok, true);
assert.equal(context.applyStudentDiscount(fixtureStudent.id, firstFee.id, 1, 'تخفیف اضافه').ok, false);
context.removeStudent(fixtureStudent.id);
assert.equal(context.recordStudentPayment(payment('after-delete-attempt', 1)).ok, true, 'Students with financial history must remain available after a deletion attempt');
assert.equal(stored.get('smart_school_hub_data_v2_students'), JSON.stringify([fixtureStudent, foreign]), 'Checks only use process-local fixture storage');
console.log('Financial ledger, status transitions, allocation, discounts, validation, immutable history and Context command boundaries: passed');
