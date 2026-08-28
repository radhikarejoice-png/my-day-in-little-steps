import React, { useState, useMemo, useEffect } from 'react';
import EditScheduleModal from '../ChildWorkspace/EditScheduleModal';
import { INITIAL_ADAM_SCHEDULE, STANDARD_SCHEDULE_TEMPLATES } from '../../data/initialData';
import { getScheduleForChild, saveScheduleForChild } from '../../services/scheduleService';

export default function VisualSchedulesView({
  childrenList = [],
  onOpenChild,
  onBackToDashboard,
  onTriggerToast,
  onTriggerProgressBar,
  groups = [],
  onUpdateChildStatus,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [schedulesMap, setSchedulesMap] = useState({});

  // Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeChildForModal, setActiveChildForModal] = useState(null);
  const [modalMode, setModalMode] = useState('choose_start'); // 'choose_start' | 'copy_previous' | 'builder'
  const [modalInitialSchedule, setModalInitialSchedule] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayDisplay = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const cardDateDisplay = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Load schedules on mount for children
  useEffect(() => {
    let isMounted = true;
    async function loadSchedules() {
      const initialMap = {};

      // Seed Adam by default
      initialMap['ch-6'] = INITIAL_ADAM_SCHEDULE;

      // Load for each child if available
      for (const child of childrenList) {
        if (child.id === 'ch-6') continue;
        try {
          const res = await getScheduleForChild(child.id, todayStr);
          if (res.success && res.data?.activities && res.data.activities.length > 0) {
            initialMap[child.id] = res.data.activities;
          }
        } catch (e) {
          console.warn(`Could not load schedule for child ${child.id}:`, e);
        }
      }

      if (isMounted) {
        setSchedulesMap((prev) => ({ ...initialMap, ...prev }));
      }
    }

    loadSchedules();
    return () => {
      isMounted = false;
    };
  }, [childrenList, todayStr]);

  // Helper to determine status badge & activity count
  const getChildScheduleMeta = React.useCallback(
    (child) => {
      const customSchedule = schedulesMap[child.id];
      let count = 0;

      if (customSchedule && customSchedule.length > 0) {
        count = customSchedule.length;
      } else if (child.id === 'ch-6') {
        count = INITIAL_ADAM_SCHEDULE.length;
      } else if (child.scheduleStatus === 'ready' || child.scheduleStatus === 'in-progress') {
        count = 7; // standard schedule template count
      } else if (child.scheduleStatus === 'home-update') {
        count = 6;
      } else {
        count = 0;
      }

      let status = child.scheduleStatus || 'ready';
      if (count > 0 && (status === 'not-created' || status === 'to-prepare')) {
        status = 'ready';
      }

      let statusBadge = {
        label: 'Schedule Ready',
        className: 'badge-schedule-ready',
        icon: '🗓️',
      };

      switch (status) {
        case 'not-created':
        case 'to-prepare':
          statusBadge = {
            label: 'Schedule not created',
            className: 'badge-schedule-prepare',
            icon: '⏳',
          };
          break;
        case 'in-progress':
          statusBadge = {
            label: 'Schedule in progress',
            className: 'badge-schedule-progress',
            icon: '📝',
          };
          break;
        case 'home-update':
          statusBadge = {
            label: 'Home update pending',
            className: 'badge-schedule-home',
            icon: '🏡',
          };
          break;
        case 'ready':
        default:
          statusBadge = {
            label: 'Schedule Ready',
            className: 'badge-schedule-ready',
            icon: '🗓️',
          };
          break;
      }

      return {
        status,
        statusBadge,
        activityCount: count,
      };
    },
    [schedulesMap]
  );

  // Filtered children list
  const filteredChildren = useMemo(() => {
    return childrenList.filter((child) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesName = child.name.toLowerCase().includes(q);
      const matchesGroupQuery = (child.groupName || '').toLowerCase().includes(q);
      const matchesSearch = !q || matchesName || matchesGroupQuery;

      const matchesGroup =
        selectedGroup === 'all' ||
        child.group === selectedGroup ||
        (child.groupName || '').toLowerCase().includes(selectedGroup.toLowerCase());

      return matchesSearch && matchesGroup;
    });
  }, [childrenList, searchQuery, selectedGroup]);

  // Summary counts
  const { readyCount, inProgressCount, toPrepareCount } = useMemo(() => {
    let ready = 0;
    let inProgress = 0;
    let toPrepare = 0;

    childrenList.forEach((c) => {
      const meta = getChildScheduleMeta(c);
      if (meta.status === 'ready') {
        ready += 1;
      } else if (meta.status === 'in-progress' || meta.status === 'home-update') {
        inProgress += 1;
      } else {
        toPrepare += 1;
      }
    });

    return { readyCount: ready, inProgressCount: inProgress, toPrepareCount: toPrepare };
  }, [childrenList, getChildScheduleMeta]);

  // Action: Open Schedule (navigate to ChildWorkspace)
  const handleOpenSchedule = (child) => {
    if (onOpenChild) {
      onOpenChild(child);
    }
  };

  // Action: Create or Edit Schedule
  const handleOpenScheduleBuilder = (child) => {
    if (onTriggerProgressBar) onTriggerProgressBar();

    const existingActivities = schedulesMap[child.id] || (child.id === 'ch-6' ? INITIAL_ADAM_SCHEDULE : []);
    const hasActivities = existingActivities.length > 0;

    setActiveChildForModal(child);
    setModalInitialSchedule(hasActivities ? existingActivities : STANDARD_SCHEDULE_TEMPLATES.standard_day.activities);
    setModalMode(hasActivities ? 'builder' : 'choose_start');
    setIsScheduleModalOpen(true);
  };

  // Save Schedule callback from EditScheduleModal
  const handleSaveModalSchedule = async (updatedActivities) => {
    if (onTriggerProgressBar) onTriggerProgressBar();
    if (!activeChildForModal) return;

    const childId = activeChildForModal.id;
    const result = await saveScheduleForChild(childId, todayStr, updatedActivities);

    // Update local schedules map
    setSchedulesMap((prev) => ({
      ...prev,
      [childId]: updatedActivities,
    }));

    if (onUpdateChildStatus) {
      onUpdateChildStatus(childId, 'ready');
    }

    setIsScheduleModalOpen(false);

    if (onTriggerToast) {
      onTriggerToast({
        title: `Schedule Saved: ${activeChildForModal.name}`,
        message: `${updatedActivities.length} activities scheduled for today.`,
        icon: '🗓️',
        type: 'success',
      });
    }

    return result;
  };

  const groupOptions = groups && groups.length > 0
    ? groups
    : [
        { id: 'all', name: 'All Groups', icon: '🌈' },
        { id: 'butterfly', name: 'Butterfly Group', icon: '🦋' },
        { id: 'sunshine', name: 'Sunshine Group', icon: '☀️' },
        { id: 'acorns', name: 'Little Acorns', icon: '🌳' },
      ];

  return (
    <div className="visual-schedules-view">
      {/* 1. Breadcrumb */}
      <nav className="workspace-breadcrumb" aria-label="Breadcrumb navigation">
        <button
          type="button"
          className="breadcrumb-link"
          onClick={onBackToDashboard}
        >
          Home
        </button>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Visual Schedules</span>
      </nav>

      {/* 2. Header Banner */}
      <header className="schedules-page-header glass-panel">
        <div className="schedules-header-main">
          <div className="schedules-brand-row">
            <div className="schedules-icon-circle">
              <span className="schedules-main-icon">🗓️</span>
            </div>
            <div>
              <div className="schedules-badge-row">
                <span className="schedules-pill-badge">Daily Visual Timetables</span>
                <span className="schedules-date-pill">📅 {todayDisplay}</span>
              </div>
              <h1 className="schedules-page-title">Visual Schedules</h1>
              <p className="schedules-page-subtitle">
                View and manage children's daily visual schedules.
              </p>
            </div>
          </div>

          <div className="schedules-header-actions">
            <button
              type="button"
              className="btn-header-secondary"
              onClick={onBackToDashboard}
              title="Return to Nursery Dashboard"
            >
              <span>← Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="schedules-metrics-bar">
          <div className="schedule-metric-item">
            <span className="metric-icon">👶</span>
            <div className="metric-text">
              <strong className="metric-number">{childrenList.length}</strong>
              <span className="metric-label">Total Children</span>
            </div>
          </div>

          <div className="schedule-metric-item metric-ready">
            <span className="metric-icon">✅</span>
            <div className="metric-text">
              <strong className="metric-number">{readyCount}</strong>
              <span className="metric-label">Schedules Ready</span>
            </div>
          </div>

          <div className="schedule-metric-item metric-progress">
            <span className="metric-icon">📝</span>
            <div className="metric-text">
              <strong className="metric-number">{inProgressCount}</strong>
              <span className="metric-label">In Progress</span>
            </div>
          </div>

          <div className="schedule-metric-item metric-prepare">
            <span className="metric-icon">⏳</span>
            <div className="metric-text">
              <strong className="metric-number">{toPrepareCount}</strong>
              <span className="metric-label">To Prepare</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Search & Group Filter Bar */}
      <section className="schedules-controls-bar glass-panel" aria-label="Search and filter visual schedules">
        <div className="schedules-search-wrapper">
          <span className="search-input-icon">🔍</span>
          <input
            type="text"
            className="schedules-search-input"
            placeholder="Search by child name or classroom..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search-icon"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="schedules-group-filters">
          {groupOptions.map((g) => {
            const isActive = selectedGroup === g.id || (g.id !== 'all' && selectedGroup === g.name);
            return (
              <button
                key={g.id}
                type="button"
                className={`group-filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedGroup(g.id)}
              >
                {g.icon && <span className="group-pill-icon">{g.icon}</span>}
                <span>{g.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Children Schedules Grid / Cards */}
      <section className="schedules-list-section" aria-label="Children Visual Schedules List">
        <div className="schedules-section-header">
          <div className="section-title-group">
            <span className="section-icon">📋</span>
            <h2 className="section-heading">Class Schedules</h2>
          </div>
          <span className="schedules-count-hint">
            Showing {filteredChildren.length} of {childrenList.length} children
          </span>
        </div>

        {filteredChildren.length > 0 ? (
          <div className="schedules-cards-grid">
            {filteredChildren.map((child) => {
              const meta = getChildScheduleMeta(child);
              const hasExistingSchedule = meta.activityCount > 0 && meta.status !== 'not-created' && meta.status !== 'to-prepare';

              return (
                <article key={child.id} className="child-schedule-card glass-panel">
                  {/* Card Header: Avatar & Child Info */}
                  <div className="schedule-card-header">
                    <div
                      className="schedule-avatar-circle"
                      style={{ backgroundColor: child.avatarBg || '#FFE5EC' }}
                    >
                      <span className="schedule-avatar-emoji">{child.avatarEmoji || '👶'}</span>
                    </div>

                    <div className="schedule-child-meta">
                      <div className="schedule-name-row">
                        <h3 className="schedule-child-name">{child.name}</h3>
                        <span className="schedule-age-pill">{child.age}</span>
                      </div>
                      <span className="schedule-group-tag">📍 {child.groupName}</span>
                    </div>
                  </div>

                  {/* Card Details: Date, Activities Count, and Schedule Status */}
                  <div className="schedule-card-details">
                    <div className="schedule-meta-row">
                      <span className="meta-row-label">📅 Date:</span>
                      <span className="meta-row-value">{cardDateDisplay}</span>
                    </div>

                    <div className="schedule-meta-row">
                      <span className="meta-row-label">📋 Activities:</span>
                      <span className="meta-row-value activity-count-pill">
                        {meta.activityCount} {meta.activityCount === 1 ? 'activity' : 'activities'}
                      </span>
                    </div>

                    <div className="schedule-meta-row status-row">
                      <span className="meta-row-label">⚡ Status:</span>
                      <span className={`schedule-status-badge ${meta.statusBadge.className}`}>
                        <span className="status-badge-icon">{meta.statusBadge.icon}</span>
                        <span>{meta.statusBadge.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Actions: Open Schedule & Create / Edit Schedule */}
                  <div className="schedule-card-actions">
                    <button
                      type="button"
                      className="btn-schedule-open"
                      onClick={() => handleOpenSchedule(child)}
                      title={`Open visual workspace for ${child.name}`}
                    >
                      <span>Open Schedule</span>
                      <span className="btn-arrow">→</span>
                    </button>

                    <button
                      type="button"
                      className="btn-schedule-builder"
                      onClick={() => handleOpenScheduleBuilder(child)}
                      title={hasExistingSchedule ? `Edit schedule for ${child.name}` : `Create schedule for ${child.name}`}
                    >
                      <span>{hasExistingSchedule ? '✏️ Edit Schedule' : '✨ Create Schedule'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel activity-empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No matching schedules found</h3>
            <p>No children matched your search "{searchQuery}" in the selected group.</p>
            <button
              type="button"
              className="btn-modal-cancel"
              style={{ marginTop: '0.75rem' }}
              onClick={() => {
                setSearchQuery('');
                setSelectedGroup('all');
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* 5. Embedded Schedule Builder Modal */}
      {isScheduleModalOpen && activeChildForModal && (
        <EditScheduleModal
          key={`schedules-modal-${activeChildForModal.id}-${modalMode}`}
          isOpen={isScheduleModalOpen}
          onClose={() => {
            setIsScheduleModalOpen(false);
            setActiveChildForModal(null);
          }}
          childName={activeChildForModal.name}
          currentSchedule={modalInitialSchedule}
          initialStep={modalMode}
          onSaveSchedule={handleSaveModalSchedule}
        />
      )}
    </div>
  );
}
