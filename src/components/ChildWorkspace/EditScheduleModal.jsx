import React, { useState } from 'react';
import {
  PREVIOUS_SCHEDULE_TEMPLATES,
  STANDARD_SCHEDULE_TEMPLATES,
} from '../../data/initialData';

const PRESET_ICONS = ['🎒', '👋', '🍎', '🧩', '🛝', '📖', '🏠', '🎨', '🎵', '🥪', '🧸', '🧷', '🥛', '🏖️', '🌳', '⚽', '💤'];

let nextScheduleCounter = 400;
function createScheduleId() {
  nextScheduleCounter += 1;
  return `sch-${Date.now()}-${nextScheduleCounter}`;
}

export default function EditScheduleModal({
  isOpen,
  onClose,
  childName = 'Adam',
  currentSchedule = [],
  initialStep = 'choose_start', // 'choose_start' | 'copy_previous' | 'builder'
  onSaveSchedule,
}) {
  const [step, setStep] = useState(initialStep);
  const [scheduleList, setScheduleList] = useState(() => currentSchedule);

  // Copy Previous Schedule state
  const [selectedPreviousDate, setSelectedPreviousDate] = useState('yesterday');

  // Standard Template state
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('standard_day');

  // Form state for new / edited activity in builder
  const [editingItemId, setEditingItemId] = useState(null);
  const [name, setName] = useState('');
  const [time, setTime] = useState('10:00');
  const [icon, setIcon] = useState('🎨');
  const [type, setType] = useState('Nursery');
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // OPTION 1: LOAD STANDARD TEMPLATE
  // ----------------------------------------------------
  const handleLoadStandardTemplate = () => {
    const template = STANDARD_SCHEDULE_TEMPLATES[selectedTemplateKey] || STANDARD_SCHEDULE_TEMPLATES.standard_day;
    const loadedActivities = template.activities.map((item, index) => ({
      id: createScheduleId() + '-' + index,
      name: item.name,
      icon: item.icon,
      time: item.time,
      type: item.type || 'Nursery',
      status: 'not-started',
    }));

    setScheduleList(loadedActivities);
    setEditingItemId(null);
    setShowAddForm(false);
    setStep('builder');
  };

  // ----------------------------------------------------
  // OPTION 2: COPY PREVIOUS SCHEDULE
  // ----------------------------------------------------
  const handleCopyPreviousSchedule = () => {
    const template = PREVIOUS_SCHEDULE_TEMPLATES[selectedPreviousDate] || PREVIOUS_SCHEDULE_TEMPLATES.yesterday;

    // Copy rules:
    // 1. Copy activity name
    // 2. Copy visual icon
    // 3. Copy time
    // 4. Copy Nursery/Home location
    // 5. Copy activity order
    // 6. Reset all statuses to: "not-started"
    const copiedActivities = template.activities.map((item, index) => ({
      id: createScheduleId() + '-' + index,
      name: item.name,
      icon: item.icon,
      time: item.time,
      type: item.type || 'Nursery',
      status: 'not-started', // All copied activities reset to 'not-started'
    }));

    setScheduleList(copiedActivities);
    setEditingItemId(null);
    setShowAddForm(false);
    setStep('builder');
  };

  // ----------------------------------------------------
  // OPTION 3: START BLANK
  // ----------------------------------------------------
  const handleStartBlank = () => {
    setScheduleList([]);
    setEditingItemId(null);
    setShowAddForm(true);
    setName('');
    setTime('08:00');
    setIcon('🎒');
    setType('Nursery');
    setStep('builder');
  };

  // ----------------------------------------------------
  // BUILDER ACTIONS: REORDER, DELETE, EDIT, ADD, SAVE
  // ----------------------------------------------------
  const handleMoveUp = (index) => {
    if (index === 0) return;
    setScheduleList((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleMoveDown = (index) => {
    if (index === scheduleList.length - 1) return;
    setScheduleList((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const handleDeleteItem = (id) => {
    setScheduleList((prev) => prev.filter((item) => item.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setName('');
    }
  };

  const handleStartEdit = (item) => {
    setEditingItemId(item.id);
    setName(item.name);
    setTime(item.time || '10:00');
    setIcon(item.icon || '🎨');
    setType(item.type || 'Nursery');
    setError('');
    setShowAddForm(false);
  };

  const handleSaveItemEdit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter activity title');
      return;
    }

    setScheduleList((prev) =>
      prev.map((item) => {
        if (item.id === editingItemId) {
          return {
            ...item,
            name: name.trim(),
            time,
            icon,
            type,
          };
        }
        return item;
      })
    );

    setEditingItemId(null);
    setName('');
    setError('');
  };

  const handleAddNewActivity = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter activity title');
      return;
    }

    const newItem = {
      id: createScheduleId(),
      name: name.trim(),
      time,
      icon,
      type,
      status: 'not-started',
    };

    setScheduleList((prev) => [...prev, newItem]);
    setName('');
    setTime('10:00');
    setIcon('🎨');
    setShowAddForm(false);
    setError('');
  };

  // Commit changes to child's live schedule
  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const result = await onSaveSchedule(scheduleList);
    setIsSaving(false);
    if (result?.success !== false) {
      onClose();
    }
  };

  const previousDateOptions = Object.values(PREVIOUS_SCHEDULE_TEMPLATES);
  const selectedPreviousTemplate = PREVIOUS_SCHEDULE_TEMPLATES[selectedPreviousDate] || PREVIOUS_SCHEDULE_TEMPLATES.yesterday;

  const standardTemplateOptions = Object.values(STANDARD_SCHEDULE_TEMPLATES);
  const selectedStandardTemplate = STANDARD_SCHEDULE_TEMPLATES[selectedTemplateKey] || STANDARD_SCHEDULE_TEMPLATES.standard_day;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-glass-card modal-schedule-editor"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-schedule-title"
      >
        {/* ============================================================
            STEP 1: "HOW WOULD YOU LIKE TO START?" (3 Options)
            ============================================================ */}
        {step === 'choose_start' && (
          <>
            <div className="modal-header">
              <div className="modal-header-icon-box">✨</div>
              <div className="modal-header-text">
                <h2 id="modal-schedule-title" className="modal-title">
                  Create Schedule for {childName}
                </h2>
                <p className="modal-subtitle">
                  How would you like to start?
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-schedule-editor-body">
              <div className="start-options-grid">
                {/* 1. Use Schedule Template */}
                <button
                  type="button"
                  className="start-option-card"
                  onClick={() => setStep('templates')}
                >
                  <div className="start-option-icon-bubble bubble-template">📋</div>
                  <div className="start-option-content">
                    <h3 className="start-option-title">1. Use Schedule Template</h3>
                    <p className="start-option-desc">
                      Choose from curated nursery routines (Standard Day, Sensory Discovery, Creative Arts).
                    </p>
                  </div>
                  <span className="start-option-arrow">→</span>
                </button>

                {/* 2. Copy Previous Schedule */}
                <button
                  type="button"
                  className="start-option-card"
                  onClick={() => setStep('copy_previous')}
                >
                  <div className="start-option-icon-bubble bubble-copy">🗓️</div>
                  <div className="start-option-content">
                    <h3 className="start-option-title">2. Copy Previous Schedule</h3>
                    <p className="start-option-desc">
                      Copy activities from a past day for {childName} (Yesterday, Tuesday, etc.) with statuses reset to Not Started.
                    </p>
                  </div>
                  <span className="start-option-arrow">→</span>
                </button>

                {/* 3. Start Blank */}
                <button
                  type="button"
                  className="start-option-card"
                  onClick={handleStartBlank}
                >
                  <div className="start-option-icon-bubble bubble-blank">📄</div>
                  <div className="start-option-content">
                    <h3 className="start-option-title">3. Start Blank</h3>
                    <p className="start-option-desc">
                      Start fresh with an empty schedule and add individual activities from scratch.
                    </p>
                  </div>
                  <span className="start-option-arrow">→</span>
                </button>
              </div>

              <div className="modal-actions-row editor-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============================================================
            STEP 2: COPY PREVIOUS SCHEDULE (With Date Selector & Live Preview)
            ============================================================ */}
        {step === 'copy_previous' && (
          <>
            <div className="modal-header">
              <div className="modal-header-icon-box">📋</div>
              <div className="modal-header-text">
                <h2 id="modal-schedule-title" className="modal-title">
                  Copy a previous schedule for {childName}
                </h2>
                <p className="modal-subtitle">
                  Select a past date to preview and load its activities into the schedule builder
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-schedule-editor-body">
              <button
                type="button"
                className="btn-back-step"
                onClick={() => setStep('choose_start')}
              >
                ← Back to Start Options
              </button>

              <div className="form-group">
                <label className="form-label">Select Previous Date</label>
                <div className="copy-date-options">
                  {previousDateOptions.map((opt) => {
                    const isSelected = selectedPreviousDate === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`copy-date-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedPreviousDate(opt.id)}
                      >
                        <span className="copy-radio-dot">{isSelected ? '●' : '○'}</span>
                        <div className="copy-date-info">
                          <strong>{opt.label}</strong>
                          <span className="copy-date-sub">{opt.count}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Short Preview of that day's activities */}
              <div className="previous-schedule-preview-box">
                <div className="preview-box-header">
                  <span className="preview-header-label">
                    Activity Preview for {selectedPreviousTemplate.label} ({selectedPreviousTemplate.activities.length} activities)
                  </span>
                  <span className="preview-reset-note">Statuses will reset to "Not Started"</span>
                </div>

                <div className="preview-activities-sequence">
                  {selectedPreviousTemplate.activities.map((act, idx) => (
                    <div key={idx} className="preview-activity-chip">
                      <span className="chip-time">{act.time}</span>
                      <span className="chip-icon">{act.icon}</span>
                      <span className="chip-name">{act.name}</span>
                      <span className="chip-type">{act.type || 'Nursery'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions-row editor-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={handleCopyPreviousSchedule}
                >
                  <span>📋 Copy Schedule to Builder</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============================================================
            STEP 3: USE SCHEDULE TEMPLATE
            ============================================================ */}
        {step === 'templates' && (
          <>
            <div className="modal-header">
              <div className="modal-header-icon-box">📋</div>
              <div className="modal-header-text">
                <h2 id="modal-schedule-title" className="modal-title">
                  Choose a Schedule Template
                </h2>
                <p className="modal-subtitle">
                  Select a nursery routine template to load into the schedule builder
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-schedule-editor-body">
              <button
                type="button"
                className="btn-back-step"
                onClick={() => setStep('choose_start')}
              >
                ← Back to Start Options
              </button>

              <div className="form-group">
                <label className="form-label">Select Pre-Built Template</label>
                <div className="copy-date-options">
                  {standardTemplateOptions.map((opt) => {
                    const isSelected = selectedTemplateKey === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`copy-date-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedTemplateKey(opt.id)}
                      >
                        <span className="copy-radio-dot">{isSelected ? '●' : '○'}</span>
                        <div className="copy-date-info">
                          <strong>{opt.icon} {opt.title}</strong>
                          <span className="copy-date-sub">{opt.description} ({opt.activities.length} activities)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Template activities preview */}
              <div className="previous-schedule-preview-box">
                <div className="preview-box-header">
                  <span className="preview-header-label">
                    Included Activities in {selectedStandardTemplate.title}
                  </span>
                </div>

                <div className="preview-activities-sequence">
                  {selectedStandardTemplate.activities.map((act, idx) => (
                    <div key={idx} className="preview-activity-chip">
                      <span className="chip-time">{act.time}</span>
                      <span className="chip-icon">{act.icon}</span>
                      <span className="chip-name">{act.name}</span>
                      <span className="chip-type">{act.type || 'Nursery'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions-row editor-footer-actions">
                <button type="button" className="btn-modal-cancel" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={handleLoadStandardTemplate}
                >
                  <span>✨ Load Template to Builder</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* ============================================================
            STEP 4: SCHEDULE BUILDER & REVIEW (Edit, Reorder, Add, Delete, Save)
            ============================================================ */}
        {step === 'builder' && (
          <>
            <div className="modal-header">
              <div className="modal-header-icon-box">🗓️</div>
              <div className="modal-header-text">
                <h2 id="modal-schedule-title" className="modal-title">
                  Edit Schedule for {childName}
                </h2>
                <p className="modal-subtitle">
                  Review, edit, reorder, add, or delete activities, then click Save Schedule
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-schedule-editor-body">
              {/* Activity items list */}
              <div className="editor-activities-list">
                <div className="editor-list-header">
                  <span className="editor-list-title">
                    Schedule Activities ({scheduleList.length})
                  </span>

                  <div className="editor-header-actions-group">
                    <button
                      type="button"
                      className="btn-change-start-source"
                      onClick={() => setStep('choose_start')}
                      title="Switch to template or copy previous"
                    >
                      <span>🔄 Change Start Option</span>
                    </button>

                    {!showAddForm && !editingItemId && (
                      <button
                        type="button"
                        className="btn-editor-add-toggle"
                        onClick={() => {
                          setShowAddForm(true);
                          setName('');
                          setTime('10:00');
                          setIcon('🎨');
                        }}
                      >
                        <span>+ Add Activity</span>
                      </button>
                    )}
                  </div>
                </div>

                {scheduleList.length === 0 ? (
                  <div className="editor-empty-state">
                    <span className="editor-empty-icon">📭</span>
                    <p>No activities in this schedule yet. Click "+ Add Activity" below to add one.</p>
                  </div>
                ) : (
                  <div className="editor-items-container">
                    {scheduleList.map((item, index) => {
                      const isBeingEdited = editingItemId === item.id;

                      if (isBeingEdited) {
                        return (
                          <form
                            key={item.id}
                            onSubmit={handleSaveItemEdit}
                            className="editor-inline-edit-form"
                          >
                            <div className="inline-form-header">
                              <strong>Editing Activity #{index + 1}</strong>
                            </div>

                            <div className="avatar-preview-row">
                              <div className="avatar-large-preview" style={{ backgroundColor: '#FFF3E0' }}>
                                {icon}
                              </div>
                              <div className="avatar-emoji-picker">
                                {PRESET_ICONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className={`emoji-choice-btn ${icon === emoji ? 'selected' : ''}`}
                                    onClick={() => setIcon(emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="form-grid-2col">
                              <div className="form-group">
                                <label className="form-label">Activity Name</label>
                                <input
                                  type="text"
                                  className={`form-input ${error ? 'input-error' : ''}`}
                                  value={name}
                                  onChange={(e) => {
                                    setName(e.target.value);
                                    if (error) setError('');
                                  }}
                                />
                                {error && <span className="error-text">{error}</span>}
                              </div>

                              <div className="form-group">
                                <label className="form-label">Time</label>
                                <input
                                  type="time"
                                  className="form-input"
                                  value={time}
                                  onChange={(e) => setTime(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="form-group">
                              <label className="form-label">Category</label>
                              <select
                                className="form-select"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                              >
                                <option value="Nursery">🏫 Nursery Activity</option>
                                <option value="Home">🏡 Home Activity</option>
                              </select>
                            </div>

                            <div className="inline-edit-actions">
                              <button
                                type="button"
                                className="btn-modal-cancel"
                                onClick={() => {
                                  setEditingItemId(null);
                                  setName('');
                                }}
                              >
                                Cancel
                              </button>
                              <button type="submit" className="btn-modal-submit">
                                Save Changes
                              </button>
                            </div>
                          </form>
                        );
                      }

                      return (
                        <div key={item.id} className="editor-item-card">
                          <div className="editor-item-drag-order">
                            <span className="editor-item-number">{index + 1}</span>
                            <div className="reorder-btn-group">
                              <button
                                type="button"
                                className="btn-reorder"
                                disabled={index === 0}
                                onClick={() => handleMoveUp(index)}
                                title="Move Up"
                                aria-label="Move activity up"
                              >
                                ⬆️
                              </button>
                              <button
                                type="button"
                                className="btn-reorder"
                                disabled={index === scheduleList.length - 1}
                                onClick={() => handleMoveDown(index)}
                                title="Move Down"
                                aria-label="Move activity down"
                              >
                                ⬇️
                              </button>
                            </div>
                          </div>

                          <div className="editor-item-info">
                            <span className="editor-item-icon">{item.icon}</span>
                            <div className="editor-item-meta">
                              <span className="editor-item-name">{item.name}</span>
                              <span className="editor-item-time">
                                ⏰ {item.time} • <span className="badge-nursery-subtle">{item.type || 'Nursery'}</span>
                              </span>
                            </div>
                          </div>

                          <div className="editor-item-actions">
                            <button
                              type="button"
                              className="btn-editor-action btn-edit-item"
                              onClick={() => handleStartEdit(item)}
                              title="Edit activity"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              type="button"
                              className="btn-editor-action btn-delete-item"
                              onClick={() => handleDeleteItem(item.id)}
                              title="Delete activity"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add Activity Section */}
              {showAddForm && (
                <form onSubmit={handleAddNewActivity} className="editor-add-activity-box">
                  <div className="inline-form-header">
                    <strong>Add New Activity to Schedule</strong>
                    <button
                      type="button"
                      className="btn-close-form"
                      onClick={() => setShowAddForm(false)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="avatar-preview-row">
                    <div className="avatar-large-preview" style={{ backgroundColor: '#FFF3E0' }}>
                      {icon}
                    </div>
                    <div className="avatar-emoji-picker">
                      {PRESET_ICONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`emoji-choice-btn ${icon === emoji ? 'selected' : ''}`}
                          onClick={() => setIcon(emoji)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="form-grid-2col">
                    <div className="form-group">
                      <label className="form-label">Activity Name</label>
                      <input
                        type="text"
                        className={`form-input ${error ? 'input-error' : ''}`}
                        placeholder="e.g. Painting Flowers"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error) setError('');
                        }}
                      />
                      {error && <span className="error-text">{error}</span>}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                    >
                      <option value="Nursery">🏫 Nursery Activity</option>
                      <option value="Home">🏡 Home Activity</option>
                    </select>
                  </div>

                  <div className="inline-edit-actions">
                    <button
                      type="button"
                      className="btn-modal-cancel"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-modal-submit">
                      + Add to List
                    </button>
                  </div>
                </form>
              )}

              {/* Modal Footer Actions */}
              <div className="modal-actions-row editor-footer-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={onClose}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                >
                  <span>{isSaving ? 'Saving...' : '💾 Save Schedule'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


