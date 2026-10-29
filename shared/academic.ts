/** These views use recorded categories; dates never infer a missing term. */
export const gradeViews = ['all', 'term1', 'term2', 'classwork'] as const;
export type GradeView = (typeof gradeViews)[number];
export function gradeCategories(view: GradeView): string[] | null {
  return view === 'all' ? null : view === 'classwork' ? ['continuous', 'quiz'] : [view];
}
