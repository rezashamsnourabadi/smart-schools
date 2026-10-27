import assert from 'node:assert/strict';
import { GradeItem } from '../src/types';
import { formatPersianScore } from '../src/utils/persianUtils';
import { parseGradeScore, validateGradeItem } from '../src/utils/gradeUtils';

assert.deepEqual(parseGradeScore('۱۹', 20), { ok: true, value: 19 });
assert.deepEqual(parseGradeScore('19', 20), { ok: true, value: 19 });
assert.deepEqual(parseGradeScore('۱۸٫۵', 20), { ok: true, value: 18.5 });
assert.deepEqual(parseGradeScore('18.5', 20), { ok: true, value: 18.5 });
assert.deepEqual(parseGradeScore('١٨.٢٥', 20), { ok: true, value: 18.25 });
assert.equal(parseGradeScore('', 20).ok, false);
assert.equal(parseGradeScore('نامعتبر', 20).ok, false);
assert.equal(parseGradeScore('20.01', 20).ok, false);
assert.equal(parseGradeScore('-1', 20).ok, false);
assert.equal(formatPersianScore('19'), '۱۹');
assert.equal(formatPersianScore('۱۸.۵'), '۱۸.۵');
assert.equal(formatPersianScore(18.25), '۱۸.۲۵');

const valid: Omit<GradeItem, 'id'> = {
  schoolId: 'school-1', classGroupId: 'class-1', subject: 'ریاضی', title: 'آزمون', category: 'quiz', categoryTitle: 'کوییز', date: '1405/08/03', maxScore: 20,
  scores: [{ studentId: 'std-1', score: 19 }, { studentId: 'std-2', score: 0 }]
};
assert.equal(validateGradeItem(valid), undefined);
assert.ok(validateGradeItem({ ...valid, scores: [{ studentId: 'std-1', score: 21 }] }));
assert.ok(validateGradeItem({ ...valid, scores: [valid.scores[0], valid.scores[0]] }));
assert.ok(validateGradeItem({ ...valid, scores: [{ studentId: 'std-1', score: Number.NaN }] }));

console.log('Grade parsing/display boundaries and duplicate roster validation: passed');
