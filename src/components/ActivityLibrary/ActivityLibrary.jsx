import React, { useState, useMemo } from 'react';
import { DEFAULT_ACTIVITY_LIBRARY, PREDEFINED_ACTIVITY_EMOJIS } from '../../data/activityLibraryData';

const STORAGE_KEY = 'mylittlesteps_custom_activities';

export default function ActivityLibrary({
  onBackToDashboard,
  onTriggerToast,
  onTriggerProgressBar,
}) {
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const customItems = JSON.parse(saved);
        return [...DEFAULT_ACTIVITY_LIBRARY, ...customItems];
      }
    } catch (e) {
      console.warn('Failed to parse saved custom activities:', e);
    }
    return DEFAULT_ACTIVITY_LIBRARY;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all'); // 'all' | 'Nursery' | 'Home'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('🎨');
  const [customLocation, setCustomLocation] = useState('Nursery');
  const [formError, setFormError] = useState('');

  // Persist custom activities to localStorage whenever activities state changes
  const saveCustomActivities = (updatedActivities) => {
    const customOnly = updatedActivities.filter((a) => a.isCustom);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Failed to save custom activities to localStorage:', e);
    }
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchesSearch = act.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesLocation = locationFilter === 'all' || act.location === locationFilter;
      return matchesSearch && matchesLocation;
    });
  }, [activities, searchQuery, locationFilter]);

  // Counts
  const nurseryCount = useMemo(() => activities.filter((a) => a.location === 'Nursery').length, [activities]);
  const homeCount = useMemo(() => activities.filter((a) => a.location === 'Home').length, [activities]);

  // Handle Add Custom Activity
  const handleOpenAddModal = () => {
    setCustomName('');
    setCustomIcon('🎨');
    setCustomLocation(locationFilter === 'Home' ? 'Home' : 'Nursery');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveCustomActivity = (e) => {
    e.preventDefault();
    if (!customName.trim()) {
      setFormError('Please enter an activity name');
      return;
    }

    if (onTriggerProgressBar) onTriggerProgressBar();

    const newActivity = {
      id: `custom-act-${Date.now()}`,
      name: customName.trim(),
      icon: customIcon,
      location: customLocation,
      isCustom: true,
    };

    const updated = [...activities, newActivity];
    setActivities(updated);
    saveCustomActivities(updated);
    setIsModalOpen(false);

    if (onTriggerToast) {
      onTriggerToast({
        title: 'Custom Activity Added',
        message: `"${newActivity.name}" added to ${newActivity.location} library.`,
        icon: newActivity.icon,
        type: 'success',
      });
    }
  };

  // Handle Delete Custom Activity
  const handleDeleteCustomActivity = (id, name) => {
    if (onTriggerProgressBar) onTriggerProgressBar();

    const updated = activities.filter((a) => a.id !== id);
    setActivities(updated);
    saveCustomActivities(updated);

    if (onTriggerToast) {
      onTriggerToast({
        title: 'Activity Removed',
        message: `"${name}" removed from library.`,
        icon: '🗑️',
        type: 'info',
      });
    }
  };

  return (
    <div className="activity-library-view">
      {/* 1. Breadcrumb & Navigation */}
      <nav className="workspace-breadcrumb" aria-label="Breadcrumb navigation">
        <button
          type="button"
          className="breadcrumb-link"
          onClick={onBackToDashboard}
        >
          Home
        </button>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Activity Library</span>
      </nav>

      {/* 2. Header Banner */}
      <header className="library-header glass-panel">
        <div className="library-header-main">
          <div className="library-brand-row">
            <div className="library-icon-circle">
              <span className="library-main-icon">📚</span>
            </div>
            <div>
              <div className="library-badge-row">
                <span className="library-pill-badge">Curriculum & Routines</span>
                <span className="library-count-pill">{activities.length} Activities Total</span>
              </div>
              <h1 className="library-title">Activity Library</h1>
              <p className="library-subtitle">
                Browse, search, and manage visual schedule routines for Nursery and Home settings.
              </p>
            </div>
          </div>

          <div className="library-header-actions">
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
              className="btn-header-primary btn-add-custom-act"
              onClick={handleOpenAddModal}
            >
              <span className="btn-icon">✨</span>
              <span>Add Custom Activity</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Search & Filter Bar */}
      <section className="library-controls-bar glass-panel" aria-label="Search and filter activities">
        <div className="library-search-wrapper">
          <span className="search-input-icon">🔍</span>
          <input
            type="text"
            className="library-search-input"
            placeholder="Search activities by name (e.g. Snack, Story, Brush Teeth)..."
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

        <div className="library-filter-tabs">
          <button
            type="button"
            className={`filter-tab-btn ${locationFilter === 'all' ? 'active' : ''}`}
            onClick={() => setLocationFilter('all')}
          >
            <span>All</span>
            <span className="filter-count-badge">{activities.length}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${locationFilter === 'Nursery' ? 'active' : ''}`}
            onClick={() => setLocationFilter('Nursery')}
          >
            <span>🎒 Nursery</span>
            <span className="filter-count-badge">{nurseryCount}</span>
          </button>
          <button
            type="button"
            className={`filter-tab-btn ${locationFilter === 'Home' ? 'active' : ''}`}
            onClick={() => setLocationFilter('Home')}
          >
            <span>🏡 Home</span>
            <span className="filter-count-badge">{homeCount}</span>
          </button>
        </div>
      </section>

      {/* 4. Activities Grid */}
      <section className="library-grid-section" aria-label="Activities list">
        {filteredActivities.length > 0 ? (
          <div className="activity-cards-grid">
            {filteredActivities.map((act) => {
              const isNursery = act.location === 'Nursery';
              return (
                <article
                  key={act.id}
                  className={`activity-item-card glass-panel ${isNursery ? 'card-nursery' : 'card-home'}`}
                >
                  <div className="activity-card-top">
                    <div
                      className={`activity-icon-badge ${isNursery ? 'icon-badge-nursery' : 'icon-badge-home'}`}
                    >
                      <span className="act-emoji">{act.icon}</span>
                    </div>

                    <div className="activity-badges-group">
                      <span
                        className={`location-badge ${isNursery ? 'location-nursery' : 'location-home'}`}
                      >
                        {isNursery ? '🎒 Nursery' : '🏡 Home'}
                      </span>
                      {act.isCustom && (
                        <span className="custom-indicator-badge">Custom</span>
                      )}
                    </div>
                  </div>

                  <div className="activity-card-body">
                    <h3 className="activity-item-name">{act.name}</h3>
                  </div>

                  {act.isCustom && (
                    <div className="activity-card-footer">
                      <button
                        type="button"
                        className="btn-delete-custom-act"
                        onClick={() => handleDeleteCustomActivity(act.id, act.name)}
                        title="Delete custom activity"
                      >
                        <span>🗑️ Remove</span>
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel activity-empty-state">
            <span className="empty-icon">🔍</span>
            <h3>No activities found</h3>
            <p>
              No activities matched your search "{searchQuery}" in {locationFilter === 'all' ? 'any category' : locationFilter}.
            </p>
            <div className="empty-state-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => {
                  setSearchQuery('');
                  setLocationFilter('all');
                }}
              >
                Reset Filters
              </button>
              <button
                type="button"
                className="btn-header-primary"
                onClick={handleOpenAddModal}
              >
                ✨ Add Custom Activity
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5. Add Custom Activity Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div
            className="modal-content glass-panel add-custom-act-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-custom-act-title"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="modal-icon-badge">✨</span>
                <div>
                  <h2 id="add-custom-act-title" className="modal-title">Add Custom Activity</h2>
                  <p className="modal-subtitle">Create a visual routine card for Nursery or Home</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomActivity} className="custom-act-form">
              {/* Activity Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="custom-act-name">
                  Activity Name <span className="required-star">*</span>
                </label>
                <input
                  id="custom-act-name"
                  type="text"
                  className={`form-input ${formError ? 'input-error' : ''}`}
                  placeholder="e.g. Sandpit Fun, Water Bottle Refill, Tidy Desk"
                  value={customName}
                  onChange={(e) => {
                    setCustomName(e.target.value);
                    if (formError) setFormError('');
                  }}
                  autoFocus
                />
                {formError && <span className="form-error-msg">{formError}</span>}
              </div>

              {/* Location: Nursery or Home */}
              <div className="form-group">
                <label className="form-label">Location / Category <span className="required-star">*</span></label>
                <div className="location-toggle-group">
                  <button
                    type="button"
                    className={`location-toggle-btn ${customLocation === 'Nursery' ? 'selected nursery' : ''}`}
                    onClick={() => setCustomLocation('Nursery')}
                  >
                    <span className="toggle-icon">🎒</span>
                    <div className="toggle-text">
                      <strong>Nursery</strong>
                      <small>Classroom & outdoor routine</small>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`location-toggle-btn ${customLocation === 'Home' ? 'selected home' : ''}`}
                    onClick={() => setCustomLocation('Home')}
                  >
                    <span className="toggle-icon">🏡</span>
                    <div className="toggle-text">
                      <strong>Home</strong>
                      <small>Evening & weekend routine</small>
                    </div>
                  </button>
                </div>
              </div>

              {/* Choose Icon from Predefined Emoji List */}
              <div className="form-group">
                <label className="form-label">
                  Choose Icon <span className="selected-preview">Selected: {customIcon}</span>
                </label>
                <div className="emoji-picker-grid">
                  {PREDEFINED_ACTIVITY_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-pick-btn ${customIcon === emoji ? 'emoji-selected' : ''}`}
                      onClick={() => setCustomIcon(emoji)}
                      title={`Select ${emoji}`}
                    >
                      <span>{emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-header-primary btn-save-modal"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
