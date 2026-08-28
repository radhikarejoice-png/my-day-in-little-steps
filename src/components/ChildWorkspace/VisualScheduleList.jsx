import React from 'react';

export default function VisualScheduleList({ schedule, onUpdateActivityStatus }) {
  const getStatusButtonClass = (currentStatus, targetStatus) => {
    if (currentStatus !== targetStatus) return 'status-btn-idle';
    switch (targetStatus) {
      case 'completed':
        return 'status-btn-completed-active';
      case 'in-progress':
        return 'status-btn-progress-active';
      case 'not-started':
        return 'status-btn-notstarted-active';
      default:
        return 'status-btn-idle';
    }
  };

  return (
    <section className="visual-schedule-section glass-panel" aria-label="Daily Visual Schedule">
      <div className="section-header-inline">
        <div className="section-title-group">
          <span className="section-icon">🗓️</span>
          <h2 className="section-heading">Daily Visual Schedule</h2>
        </div>
        <span className="section-hint">Click status pills to track progress</span>
      </div>

      <div className="visual-schedule-timeline">
        {schedule.map((item, index) => {
          return (
            <div
              key={item.id}
              className={`schedule-timeline-item ${item.status === 'completed' ? 'item-completed' : ''} ${item.status === 'in-progress' ? 'item-in-progress' : ''}`}
            >
              {/* Step indicator line & number */}
              <div className="timeline-node">
                <span className="node-number">{index + 1}</span>
              </div>

              {/* Time pill */}
              <div className="schedule-time-box">
                <span className="time-text">{item.time}</span>
              </div>

              {/* Visual Icon */}
              <div className="schedule-visual-icon-box">
                <span className="schedule-icon-emoji">{item.icon}</span>
              </div>

              {/* Activity Info */}
              <div className="schedule-activity-details">
                <div className="schedule-activity-name-row">
                  <h3 className="schedule-activity-name">{item.name}</h3>
                  <span className="schedule-type-badge badge-nursery">
                    {item.type || 'Nursery'}
                  </span>
                </div>
              </div>

              {/* Educator Status Switcher */}
              <div className="schedule-status-selector">
                <button
                  type="button"
                  className={`status-choice-btn ${getStatusButtonClass(item.status, 'not-started')}`}
                  onClick={() => onUpdateActivityStatus(item.id, 'not-started', item.name)}
                  title="Mark as Not Started"
                >
                  <span>⚪ Not Started</span>
                </button>

                <button
                  type="button"
                  className={`status-choice-btn ${getStatusButtonClass(item.status, 'in-progress')}`}
                  onClick={() => onUpdateActivityStatus(item.id, 'in-progress', item.name)}
                  title="Mark as In Progress"
                >
                  <span>🟡 In Progress</span>
                </button>

                <button
                  type="button"
                  className={`status-choice-btn ${getStatusButtonClass(item.status, 'completed')}`}
                  onClick={() => onUpdateActivityStatus(item.id, 'completed', item.name)}
                  title="Mark as Completed"
                >
                  <span>🟢 Completed</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
