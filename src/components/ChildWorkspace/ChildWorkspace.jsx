import React, { useState, useEffect } from 'react';
import NowAndNext from './NowAndNext';
import ScheduleSummaryCards from './ScheduleSummaryCards';
import VisualScheduleList from './VisualScheduleList';
import HomeActivitiesList from './HomeActivitiesList';
import EditScheduleModal from './EditScheduleModal';

import {
  INITIAL_ADAM_SCHEDULE,
  INITIAL_ADAM_HOME_ACTIVITIES,
} from '../../data/initialData';

import {
  getScheduleForChild,
  saveScheduleForChild,
} from '../../services/scheduleService';

import {
  loadHomeUpdatesForActivities,
} from '../../services/homeUpdatesService';

export default function ChildWorkspace({
  child,
  onBackToDashboard,
  onEditChild,
  onTriggerToast,
  onTriggerProgressBar,
}) {
  const [schedule, setSchedule] = useState(INITIAL_ADAM_SCHEDULE);
  const [homeActivities] = useState(INITIAL_ADAM_HOME_ACTIVITIES);
  const [homeUpdatesMap, setHomeUpdatesMap] = useState({});

  // Load schedule and home updates from Supabase on mount or child change
  useEffect(() => {
    let isMounted = true;
    async function loadScheduleAndHomeUpdates() {
      if (!child?.id) return;
      const res = await getScheduleForChild(child.id);
      if (isMounted && res.success && res.data?.activities && res.data.activities.length > 0) {
        setSchedule(res.data.activities);

        // Fetch home updates for Home activities in schedule
        const homeActIds = res.data.activities
          .filter((a) => (a.type || a.location || '').toLowerCase() === 'home')
          .map((a) => a.id);

        const allHomeIds = [...new Set([...homeActIds, ...INITIAL_ADAM_HOME_ACTIVITIES.map((h) => h.id)])];
        const updatesRes = await loadHomeUpdatesForActivities(allHomeIds);
        if (isMounted && updatesRes.success && updatesRes.data) {
          setHomeUpdatesMap(updatesRes.data);
        }
      } else if (isMounted) {
        // Fallback: load updates for initial home activities
        const updatesRes = await loadHomeUpdatesForActivities(INITIAL_ADAM_HOME_ACTIVITIES.map((h) => h.id));
        if (isMounted && updatesRes.success && updatesRes.data) {
          setHomeUpdatesMap(updatesRes.data);
        }
      }
    }
    loadScheduleAndHomeUpdates();
    return () => {
      isMounted = false;
    };
  }, [child?.id]);

  // Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleModalMode, setScheduleModalMode] = useState('choose_start'); // 'choose_start' | 'copy_previous' | 'builder'

  // Find current NOW & NEXT activities
  const nowActivity =
    schedule.find((a) => a.status === 'in-progress') ||
    schedule.find((a) => a.status === 'not-started') ||
    schedule[0];

  const nowIndex = schedule.findIndex((a) => a.id === nowActivity?.id);
  const nextActivity =
    schedule.slice(nowIndex + 1).find((a) => a.status !== 'completed') ||
    schedule[nowIndex + 1] ||
    schedule[0];

  // Update Nursery Activity Status
  const handleUpdateActivityStatus = (activityId, newStatus, activityName) => {
    onTriggerProgressBar();
    setSchedule((prev) =>
      prev.map((item) => {
        if (item.id === activityId) {
          return { ...item, status: newStatus };
        }
        return item;
      })
    );

    const statusLabels = {
      completed: 'Completed 🟢',
      'in-progress': 'In Progress 🟡',
      'not-started': 'Not Started ⚪',
    };

    onTriggerToast({
      title: `${activityName} Updated`,
      message: `Status set to ${statusLabels[newStatus] || newStatus}`,
      icon: newStatus === 'completed' ? '✅' : '🗓️',
      type: 'success',
    });
  };

  // Save Schedule Handler (from Create / Edit Schedule modal)
  const handleSaveSchedule = async (updatedSchedule) => {
    onTriggerProgressBar();

    const childId = child?.id || 'ch-6';
    const todayStr = new Date().toISOString().split('T')[0];

    const result = await saveScheduleForChild(childId, todayStr, updatedSchedule);

    if (result.success) {
      // Immediately refresh workspace schedule from Supabase response
      const savedActivities = result.data?.activities?.length > 0
        ? result.data.activities
        : updatedSchedule;

      setSchedule(savedActivities);

      onTriggerToast({
        title: 'Schedule Saved',
        message: 'Schedule saved successfully.',
        icon: '💾',
        type: 'success',
      });

      return { success: true, data: result.data };
    } else {
      console.error('Failed to save schedule to Supabase:', result.error);

      onTriggerToast({
        title: 'Failed to Save Schedule',
        message: result.error?.message || 'Could not save schedule to Supabase.',
        icon: '⚠️',
        type: 'error',
      });

      return { success: false, error: result.error };
    }
  };

  const getScheduleStatusPill = (status) => {
    switch (status) {
      case 'in-progress':
        return { label: 'Schedule in Progress', class: 'badge-schedule-progress', icon: '📝' };
      case 'to-prepare':
      case 'not-created':
        return { label: 'Schedule not created', class: 'badge-schedule-prepare', icon: '⏳' };
      case 'home-update':
        return { label: 'Home update pending', class: 'badge-schedule-home', icon: '🏡' };
      case 'ready':
      default:
        return { label: 'Schedule Ready', class: 'badge-schedule-ready', icon: '🗓️' };
    }
  };

  const schedulePill = getScheduleStatusPill(child?.scheduleStatus || 'in-progress');

  return (
    <div className="child-workspace-container">
      {/* 1. BREADCRUMB */}
      <nav className="workspace-breadcrumb" aria-label="Breadcrumb navigation">
        <button
          type="button"
          className="breadcrumb-link"
          onClick={onBackToDashboard}
        >
          Home
        </button>
        <span className="breadcrumb-separator">&gt;</span>
        <button
          type="button"
          className="breadcrumb-link"
          onClick={onBackToDashboard}
        >
          Children
        </button>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">{child?.name || 'Adam'}</span>
      </nav>

      {/* 2. CHILD HEADER */}
      <header className="workspace-child-header glass-panel">
        <div className="workspace-header-main">
          <div
            className="workspace-avatar-large"
            style={{ backgroundColor: child?.avatarBg || '#E8F5E9' }}
          >
            <span className="workspace-avatar-emoji">{child?.avatarEmoji || '👦🏼'}</span>
          </div>

          <div className="workspace-child-meta">
            <div className="workspace-name-row">
              <h1 className="workspace-child-name">{child?.name || 'Adam'}</h1>
              <span className="workspace-age-pill">{child?.age || 'Age 4'}</span>
              <span className={`schedule-status-badge ${schedulePill.class}`}>
                <span>{schedulePill.icon}</span>
                <span>{schedulePill.label}</span>
              </span>
            </div>
            <p className="workspace-group-tag">
              📍 {child?.groupName || 'Sunflowers Group'}
            </p>
          </div>
        </div>

        <div className="workspace-header-actions">
          <button
            type="button"
            className="btn-header-secondary"
            onClick={onBackToDashboard}
            title="Return to Nursery Dashboard"
          >
            <span>← Back to Dashboard</span>
          </button>

          <button
            type="button"
            className="btn-header-secondary"
            onClick={() => onEditChild(child)}
            title="Edit child profile"
          >
            <span>✏️ Edit Child</span>
          </button>
        </div>
      </header>

      {/* 8. SCHEDULE ACTIONS BAR */}
      <div className="workspace-actions-bar glass-panel">
        <div className="workspace-actions-title-group">
          <span className="section-icon">⚡</span>
          <span className="actions-bar-label">Schedule Actions:</span>
        </div>

        <div className="workspace-actions-buttons">
          <button
            type="button"
            className="workspace-action-btn btn-action-edit"
            onClick={() => {
              setScheduleModalMode('builder');
              setIsScheduleModalOpen(true);
            }}
          >
            <span className="action-btn-icon">✏️</span>
            <span>Edit Schedule</span>
          </button>

          <button
            type="button"
            className="workspace-action-btn btn-action-create"
            onClick={() => {
              setScheduleModalMode('choose_start');
              setIsScheduleModalOpen(true);
            }}
          >
            <span className="action-btn-icon">✨</span>
            <span>Create Schedule</span>
          </button>

          <button
            type="button"
            className="workspace-action-btn btn-action-copy"
            onClick={() => {
              setScheduleModalMode('copy_previous');
              setIsScheduleModalOpen(true);
            }}
          >
            <span className="action-btn-icon">📋</span>
            <span>Copy Previous Schedule</span>
          </button>
        </div>
      </div>

      {/* 3. TODAY'S SCHEDULE SUMMARY */}
      <ScheduleSummaryCards
        schedule={schedule}
        homeActivities={homeActivities}
      />

      {/* 4. NOW & NEXT LARGE VISUAL DISPLAY */}
      <NowAndNext
        currentActivity={nowActivity}
        nextActivity={nextActivity}
      />

      {/* 5 & 6. DAILY VISUAL SCHEDULE (NURSERY ACTIVITY TRACKING) */}
      <VisualScheduleList
        schedule={schedule}
        onUpdateActivityStatus={handleUpdateActivityStatus}
      />

      {/* 7. HOME ACTIVITIES SECTION */}
      <HomeActivitiesList
        homeActivities={homeActivities}
        homeUpdatesMap={homeUpdatesMap}
      />

      {/* Unified Create / Edit / Copy Schedule Builder Modal */}
      {isScheduleModalOpen && (
        <EditScheduleModal
          key={`schedule-modal-${scheduleModalMode}-${isScheduleModalOpen}`}
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          childName={child?.name || 'Adam'}
          currentSchedule={schedule}
          initialStep={scheduleModalMode}
          onSaveSchedule={handleSaveSchedule}
        />
      )}
    </div>
  );
}

