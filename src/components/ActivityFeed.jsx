import React from 'react';

export default function ActivityFeed({ activities }) {
  return (
    <section className="activity-feed-section glass-panel" aria-label="Recent Nursery Activity">
      <div className="activity-header-row">
        <div className="section-title-group">
          <span className="section-icon">🕒</span>
          <div className="activity-title-meta">
            <h2 className="section-heading">Recent Nursery Activity</h2>
            <p className="section-subtitle">Visual schedule changes and home activity completions</p>
          </div>
        </div>
      </div>

      <div className="activity-list-wrapper">
        {activities && activities.length > 0 ? (
          <div className="activity-timeline">
            {activities.map((act) => (
              <div key={act.id} className="activity-item">
                <div
                  className="activity-icon-bubble"
                  style={{ backgroundColor: act.bg || '#E8F5E9' }}
                >
                  <span>{act.icon || '🗓️'}</span>
                </div>

                <div className="activity-body">
                  <div className="activity-top-line">
                    <strong className="activity-child-name">{act.childName}</strong>
                    <span className="activity-action-separator">–</span>
                    <span className="activity-action-text">{act.actionText}</span>
                    <span className="activity-action-separator">–</span>
                    <span className="activity-timestamp">{act.timeAgo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="activity-empty-state">
            <span className="empty-icon">🍃</span>
            <p>No recent activity recorded.</p>
          </div>
        )}
      </div>
    </section>
  );
}
