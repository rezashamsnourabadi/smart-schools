import type { ComponentProps } from 'react';
import { TeachingDialog } from './TeachingDialog';

/** Shared management forms use the same accessible sheet as the teaching tools. */
export function ManagementDialog(props: Omit<ComponentProps<typeof TeachingDialog>, 'className'>) {
  const compact = !props.id.endsWith('-modal');
  return <TeachingDialog {...props} className={`management-dialog ${compact ? 'management-dialog-compact' : ''}`} overlayClassName="management-dialog-overlay" />;
}
