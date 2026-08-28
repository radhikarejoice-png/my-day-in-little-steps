import React from 'react';

export default function NowAndNext({ currentActivity, nextActivity }) {
  return (
    <section className="now-next-section glass-panel" aria-label="Now and Next Visual Display">
      <div className="now-next-grid">
        {/* NOW CARD */}
        <div className="now-card">
          <div className="now-card-header">
            <span className="now-indicator-pulse"></span>
            <span className="now-badge-label">NOW</span>
          </div>
          <div className="now-visual-display">
            <span className="now-large-icon">{currentActivity?.icon || '🧩'}</span>
            <div className="now-info">
              <h3 className="now-activity-title">{currentActivity?.name || 'Learning Activity'}</h3>
              <span className="now-time-tag">⏰ {currentActivity?.time || '09:45'} • {currentActivity?.type || 'Nursery'}</span>
            </div>
          </div>
          <div className="now-status-pill">
            <span className="status-dot"></span> In Progress
          </div>
        </div>

        {/* NEXT CARD */}
        <div className="next-card">
          <div className="next-card-header">
            <span className="next-badge-label">NEXT</span>
          </div>
          <div className="now-visual-display">
            <span className="next-large-icon">{nextActivity?.icon || '🛝'}</span>
            <div className="now-info">
              <h3 className="next-activity-title">{nextActivity?.name || 'Outdoor Play'}</h3>
              <span className="now-time-tag">⏰ {nextActivity?.time || '10:30'} • {nextActivity?.type || 'Nursery'}</span>
            </div>
          </div>
          <div className="next-status-pill">
            Up Next
          </div>
        </div>
      </div>
    </section>
  );
}
