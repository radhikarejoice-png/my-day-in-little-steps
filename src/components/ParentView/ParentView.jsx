import React, { useState, useEffect } from 'react';
import { getScheduleForChild } from '../../services/scheduleService';
import { createOrUpdateHomeUpdate, loadHomeUpdatesForActivities } from '../../services/homeUpdatesService';
import { INITIAL_ADAM_HOME_ACTIVITIES } from '../../data/initialData';

export default function ParentView({
  child = { id: 'ch-6', name: 'Adam', groupName: 'Sunflowers Group', avatarEmoji: '👦🏼', avatarBg: '#E8F5E9' },
  onBackToDashboard,
  onTriggerToast,
  onTriggerProgressBar,
}) {
  const [homeActivities, setHomeActivities] = useState([]);
  const [homeUpdatesMap, setHomeUpdatesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [updatingActivityId, setUpdatingActivityId] = useState(null);
  const [noteInputs, setNoteInputs] = useState({});

  const todayStr = new Date().toISOString().split('T')[0];

  // Fetch schedule and filter for Home activities
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      const childId = child?.id || 'ch-6';

      // 1. Fetch child schedule
      const res = await getScheduleForChild(childId, todayStr);
      let activities = [];

      if (res.success && res.data?.activities) {
        // Filter only Home activities
        activities = res.data.activities.filter(
          (a) => (a.type || a.location || '').toLowerCase() === 'home'
        );
      }

      // If no home activities in schedule, use default home activities
      if (activities.length === 0) {
        activities = INITIAL_ADAM_HOME_ACTIVITIES;
      }

      // 2. Fetch latest home_updates for these activities
      const actIds = activities.map((a) => a.id);
      const updatesRes = await loadHomeUpdatesForActivities(actIds);

      if (isMounted) {
        setHomeActivities(activities);
        if (updatesRes.success && updatesRes.data) {
          setHomeUpdatesMap(updatesRes.data);
          const initialNotes = {};
          Object.keys(updatesRes.data).forEach((id) => {
            initialNotes[id] = updatesRes.data[id].note || '';
          });
          setNoteInputs(initialNotes);
        }
        setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [child?.id, todayStr]);

  // Handle Parent Status Update
  const handleUpdateStatus = async (activityId, newStatus) => {
    if (updatingActivityId) return;

    if (onTriggerProgressBar) onTriggerProgressBar();
    setUpdatingActivityId(activityId);

    const note = noteInputs[activityId] || '';
    const result = await createOrUpdateHomeUpdate(activityId, newStatus, note);

    setUpdatingActivityId(null);

    if (result.success) {
      // Update local state
      setHomeActivities((prev) =>
        prev.map((item) => (item.id === activityId ? { ...item, status: newStatus } : item))
      );

      setHomeUpdatesMap((prev) => ({
        ...prev,
        [activityId]: result.data,
      }));

      onTriggerToast({
        title: 'Home Activity Updated',
        message: 'Home activity updated successfully.',
        icon: newStatus === 'completed' ? '✅' : '🏡',
        type: 'success',
      });
    } else {
      console.error('Failed to update home activity:', result.error);
      onTriggerToast({
        title: 'Update Failed',
        message: result.error?.message || 'Could not update home activity.',
        icon: '⚠️',
        type: 'error',
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { label: 'Completed', icon: '🟢', className: 'status-pill-completed' };
      case 'in-progress':
        return { label: 'In Progress', icon: '🟡', className: 'status-pill-progress' };
      case 'not-started':
      default:
        return { label: 'Not Started', icon: '⚪', className: 'status-pill-notstarted' };
    }
  };

  return (
    <div className="parent-view-container">
      {/* 1. Header Banner */}
      <header className="parent-view-header glass-panel">
        <div className="parent-brand-row">
          <div className="parent-brand-logo">
            <span className="brand-logo-emoji">🏡</span>
            <div>
              <h1 className="parent-main-title">My Day in Little Steps</h1>
              <span className="parent-role-badge">Parent View • Home Routine Hub</span>
            </div>
          </div>

          <button
            type="button"
            className="btn-header-secondary btn-switch-educator"
            onClick={onBackToDashboard}
            title="Return to Educator Dashboard"
          >
            <span>← Educator Dashboard</span>
          </button>
        </div>

        <div className="parent-child-banner">
          <div
            className="parent-child-avatar"
            style={{ backgroundColor: child?.avatarBg || '#E8F5E9' }}
          >
            <span>{child?.avatarEmoji || '👦🏼'}</span>
          </div>

          <div className="parent-child-info">
            <h2 className="parent-child-name">{child?.name || 'Adam'}</h2>
            <p className="parent-child-group">
              📍 {child?.groupName || 'Sunflowers Group'} • Today's Home Routine
            </p>
          </div>
        </div>
      </header>

      {/* 2. Notice / Role Constraint Banner */}
      <div className="parent-role-notice glass-panel">
        <span className="notice-icon">ℹ️</span>
        <p className="notice-text">
          As a parent, you can view and update the progress of home routines assigned for today. Nursery activities are managed directly by educators.
        </p>
      </div>

      {/* 3. Today's Home Activities Section */}
      <section className="parent-activities-section" aria-label="Today's Home Activities">
        <div className="parent-section-title-row">
          <div className="section-title-group">
            <span className="section-icon">🌟</span>
            <h3 className="section-heading">Today's Home Activities</h3>
          </div>
          <span className="parent-count-badge">
            {homeActivities.length} {homeActivities.length === 1 ? 'Activity' : 'Activities'}
          </span>
        </div>

        {loading ? (
          <div className="parent-loading-card glass-panel">
            <span className="loading-spinner">⏳</span>
            <p>Loading home activities from Supabase...</p>
          </div>
        ) : homeActivities.length === 0 ? (
          <div className="parent-empty-card glass-panel">
            <span className="empty-emoji">🏡</span>
            <h4>No Home Activities Scheduled Today</h4>
            <p>The educator has not assigned any home activities for today's routine yet.</p>
          </div>
        ) : (
          <div className="parent-activities-grid">
            {homeActivities.map((activity) => {
              const currentStatus = activity.status || 'not-started';
              const badge = getStatusBadge(currentStatus);
              const isUpdating = updatingActivityId === activity.id;
              const updateInfo = homeUpdatesMap[activity.id];

              return (
                <article key={activity.id} className={`parent-activity-card glass-panel ${currentStatus === 'completed' ? 'card-status-done' : ''}`}>
                  <div className="parent-card-header">
                    <div className="parent-card-icon-bubble">{activity.icon || '🏡'}</div>
                    <div className="parent-card-title-meta">
                      <h4 className="parent-card-title">{activity.name}</h4>
                      <span className="parent-card-time">⏰ {activity.time || 'Evening'}</span>
                    </div>
                    <span className={`parent-current-status-pill ${badge.className}`}>
                      <span>{badge.icon}</span>
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Status Toggle Buttons */}
                  <div className="parent-status-actions-group">
                    <span className="status-group-label">Update Status:</span>
                    <div className="parent-status-buttons-row">
                      <button
                        type="button"
                        className={`btn-parent-status ${currentStatus === 'not-started' ? 'active-not-started' : ''}`}
                        onClick={() => handleUpdateStatus(activity.id, 'not-started')}
                        disabled={isUpdating}
                      >
                        ⚪ Not Started
                      </button>

                      <button
                        type="button"
                        className={`btn-parent-status ${currentStatus === 'in-progress' ? 'active-in-progress' : ''}`}
                        onClick={() => handleUpdateStatus(activity.id, 'in-progress')}
                        disabled={isUpdating}
                      >
                        🟡 In Progress
                      </button>

                      <button
                        type="button"
                        className={`btn-parent-status ${currentStatus === 'completed' ? 'active-completed' : ''}`}
                        onClick={() => handleUpdateStatus(activity.id, 'completed')}
                        disabled={isUpdating}
                      >
                        🟢 Completed
                      </button>
                    </div>
                  </div>

                  {/* Optional Note Field */}
                  <div className="parent-note-group">
                    <label htmlFor={`note-${activity.id}`} className="parent-note-label">
                      Parent Note (Optional):
                    </label>
                    <div className="parent-note-input-row">
                      <input
                        id={`note-${activity.id}`}
                        type="text"
                        className="parent-note-input"
                        placeholder="e.g., Brushed teeth independently!"
                        value={noteInputs[activity.id] || ''}
                        onChange={(e) =>
                          setNoteInputs({ ...noteInputs, [activity.id]: e.target.value })
                        }
                        onBlur={() => {
                          if (noteInputs[activity.id] !== (updateInfo?.note || '')) {
                            handleUpdateStatus(activity.id, currentStatus);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Timestamp feedback */}
                  {updateInfo?.updated_at && (
                    <div className="parent-last-updated-row">
                      <span>Updated: {new Date(updateInfo.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {updateInfo.note && <span className="parent-note-preview"> • "{updateInfo.note}"</span>}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
