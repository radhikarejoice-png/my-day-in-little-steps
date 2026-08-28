import React from 'react';

export default function ChildCard({ child, onOpenChild, onEditChild }) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'not-created':
      case 'to-prepare':
        return {
          label: 'Schedule not created',
          className: 'badge-schedule-prepare',
          icon: '⏳',
        };
      case 'in-progress':
        return {
          label: 'Schedule in progress',
          className: 'badge-schedule-progress',
          icon: '📝',
        };
      case 'home-update':
        return {
          label: 'Home update pending',
          className: 'badge-schedule-home',
          icon: '🏡',
        };
      case 'ready':
      default:
        return {
          label: 'Schedule ready',
          className: 'badge-schedule-ready',
          icon: '🗓️',
        };
    }
  };

  const statusBadge = getStatusBadge(child.scheduleStatus);

  return (
    <article className="child-card glass-panel">
      {/* Header with Avatar & Details */}
      <div className="child-card-header">
        <div
          className="avatar-wrapper"
          style={{ backgroundColor: child.avatarBg || '#FFE5EC' }}
        >
          <span className="child-avatar-emoji">{child.avatarEmoji || '👶'}</span>
        </div>

        <div className="child-identity">
          <div className="child-name-row">
            <h3 className="child-name">{child.name}</h3>
            <span className="child-age-pill">{child.age}</span>
          </div>
          <div className="child-room-meta">
            <span className="room-name-tag">📍 {child.groupName}</span>
          </div>
        </div>
      </div>

      {/* Schedule Status Row */}
      <div className="child-schedule-status-row">
        <span className="schedule-status-label">Schedule:</span>
        <span className={`schedule-status-badge ${statusBadge.className}`}>
          <span className="status-badge-icon">{statusBadge.icon}</span>
          <span>{statusBadge.label}</span>
        </span>
      </div>

      {/* Action Footer: Open Child & Edit */}
      <div className="child-card-footer">
        <button
          type="button"
          className="btn-card-primary"
          onClick={() => onOpenChild(child)}
          title={`Open workspace for ${child.name}`}
          aria-label={`Open Child ${child.name}`}
        >
          <span>Open Child</span>
          <span className="btn-arrow">→</span>
        </button>

        <button
          type="button"
          className="btn-card-secondary"
          onClick={() => onEditChild(child)}
          title={`Edit details for ${child.name}`}
          aria-label={`Edit ${child.name}`}
        >
          <span>✏️ Edit</span>
        </button>
      </div>
    </article>
  );
}
