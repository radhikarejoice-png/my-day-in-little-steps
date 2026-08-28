import React from 'react';

export default function QuickActions({
  onFilterSchedulesToPrepare,
  onFilterHomeUpdates,
  onOpenActivityLibrary,
  onOpenAddChild,
}) {
  const actions = [
    {
      id: 'prepare',
      label: 'Schedules to Prepare',
      sublabel: 'View schedules needing action',
      icon: '⏳',
      colorClass: 'action-btn-peach',
      onClick: onFilterSchedulesToPrepare,
    },
    {
      id: 'home',
      label: 'Home Updates',
      sublabel: 'Awaiting parent activity response',
      icon: '🏡',
      colorClass: 'action-btn-lavender',
      onClick: onFilterHomeUpdates,
    },
    {
      id: 'library',
      label: 'Activity Library',
      sublabel: 'Browse nursery visual activity cards',
      icon: '📚',
      colorClass: 'action-btn-sky',
      onClick: onOpenActivityLibrary,
    },
    {
      id: 'add',
      label: 'Add Child',
      sublabel: 'Enroll child to class visual schedule',
      icon: '✨',
      colorClass: 'action-btn-mint',
      onClick: onOpenAddChild,
    },
  ];

  return (
    <section className="quick-actions-section" aria-label="Quick Actions">
      <div className="section-header-inline">
        <div className="section-title-group">
          <span className="section-icon">⚡</span>
          <h2 className="section-heading">Quick Actions</h2>
        </div>
      </div>

      <div className="quick-actions-grid quick-actions-grid-4col">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            className={`quick-action-btn ${action.colorClass}`}
            onClick={action.onClick}
          >
            <div className="action-icon-circle">{action.icon}</div>
            <div className="action-text-block">
              <span className="action-main-title">{action.label}</span>
              <span className="action-subtitle">{action.sublabel}</span>
            </div>
            <span className="action-arrow-indicator">→</span>
          </button>
        ))}
      </div>
    </section>
  );
}
