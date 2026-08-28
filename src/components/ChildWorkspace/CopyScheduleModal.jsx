import React from 'react';
import EditScheduleModal from './EditScheduleModal';

/**
 * Shared wrapper for CopyScheduleModal that delegates to the unified EditScheduleModal
 * to guarantee a single consistent copy implementation.
 */
export default function CopyScheduleModal({
  isOpen,
  onClose,
  childName = 'Adam',
  currentSchedule = [],
  onCopySchedule,
}) {
  if (!isOpen) return null;

  return (
    <EditScheduleModal
      isOpen={isOpen}
      onClose={onClose}
      childName={childName}
      currentSchedule={currentSchedule}
      initialStep="copy_previous"
      onSaveSchedule={onCopySchedule}
    />
  );
}


