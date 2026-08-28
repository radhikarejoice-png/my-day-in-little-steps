import React from 'react';

export default function Header({
  nurseryInfo,
  onOpenAddChild,
  onQuickSearchFocus,
  onSwitchToParentView,
}) {
  return (
    <header className="dashboard-header glass-panel">
      {/* Top Banner Row: Nursery Name */}
      <div className="header-top-row">
        <div className="header-branding">
          <div className="nursery-badge-pill">
            <span className="nursery-logo-emoji">🏫</span>
            <div className="nursery-info-text">
              <h1 className="nursery-title">{nurseryInfo.name}</h1>
              <p className="nursery-campus-tag">
                📍 {nurseryInfo.campus} • <span className="motto">{nurseryInfo.tagline}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Educator View Bar & Action Group */}
      <div className="header-bottom-row">
        <div className="educator-view-card">
          <div className="educator-avatar-badge">{nurseryInfo.educator.avatar}</div>
          <div className="educator-details">
            <div className="educator-label-row">
              <span className="educator-badge">Educator View</span>
              <span className="educator-room-tag">🦋 {nurseryInfo.educator.group}</span>
              {onSwitchToParentView && (
                <button
                  type="button"
                  className="btn-switch-role-inline"
                  onClick={onSwitchToParentView}
                  title="Switch to Parent View role demonstration"
                >
                  <span>🏡 Parent View →</span>
                </button>
              )}
            </div>
            <p className="educator-name">
              <strong>{nurseryInfo.educator.name}</strong> • {nurseryInfo.educator.role}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="header-action-group">
          <button
            type="button"
            className="btn-header-secondary"
            onClick={onQuickSearchFocus}
            title="Focus Search bar to find child"
            aria-label="Find Child"
          >
            <span className="btn-icon">🔍</span>
            <span>Find Child</span>
          </button>

          <button
            type="button"
            className="btn-header-primary btn-add-child-cta"
            onClick={onOpenAddChild}
            title="Add a new child"
            aria-label="Add Child"
          >
            <span className="btn-icon">✨</span>
            <span className="btn-text">Add Child</span>
            <span className="btn-shortcut">+</span>
          </button>
        </div>
      </div>
    </header>
  );
}
