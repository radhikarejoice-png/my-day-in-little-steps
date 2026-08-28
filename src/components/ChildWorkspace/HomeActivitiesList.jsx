import React from 'react';

export default function HomeActivitiesList({ homeActivities = [], homeUpdatesMap = {} }) {
  return (
    <section className="home-activities-section glass-panel" aria-label="Home Activities Progress">
      <div className="section-header-inline">
        <div className="section-title-group">
          <span className="section-icon">🏡</span>
          <h2 className="section-heading">Home Activities</h2>
        </div>
        <span className="section-hint">Read-only parent progress feed</span>
      </div>

      <div className="home-activities-grid">
        {homeActivities.map((act) => {
          const update = homeUpdatesMap[act.id];
          const status = update ? update.status : act.status || 'not-started';
          const isDone = status === 'completed';
          const isInProgress = status === 'in-progress';

          let statusLabel = '⏳ Awaiting parent update';
          let statusPillClass = 'parent-pill-waiting';

          if (isDone) {
            statusLabel = 'Parent status: Completed 🟢';
            statusPillClass = 'parent-pill-done';
          } else if (isInProgress) {
            statusLabel = 'Parent status: In Progress 🟡';
            statusPillClass = 'parent-pill-progress';
          } else if (update) {
            statusLabel = 'Parent status: Not Started ⚪';
            statusPillClass = 'parent-pill-notstarted';
          }

          let timestampText = act.parentUpdate || 'Awaiting parent update';
          if (update?.updated_at) {
            const timeStr = new Date(update.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timestampText = `Updated today at ${timeStr}`;
            if (update.note) {
              timestampText += ` • "${update.note}"`;
            }
          }

          return (
            <div
              key={act.id}
              className={`home-activity-card ${isDone ? 'home-card-completed' : 'home-card-pending'}`}
            >
              <div className="home-card-icon-bubble">{act.icon}</div>

              <div className="home-card-content">
                <div className="home-card-name-row">
                  <h3 className="home-activity-title">{act.name}</h3>
                  <span className="schedule-type-badge badge-home">Home</span>
                </div>

                <div className="parent-update-status-row">
                  <span className="parent-update-label">Status:</span>
                  <span className={`parent-update-pill ${statusPillClass}`}>
                    {statusLabel}
                  </span>
                </div>

                <p className="parent-update-timestamp">
                  {timestampText}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

