import React, { useState } from 'react';

export default function SettingsView({
  nurseryInfo,
  onSaveSettings,
  onBackToDashboard,
  onTriggerToast,
  onTriggerProgressBar,
  demoRole = 'educator',
  onRoleChange,
}) {
  const [formData, setFormData] = useState({
    name: nurseryInfo?.name || 'Little Steps Early Learning & Daycare',
    educatorName: nurseryInfo?.educator?.name || 'Miss Sarah Jenkins',
    defaultGroup: nurseryInfo?.educator?.group || 'Butterfly Group',
    demoRole: demoRole || 'educator',
  });

  const [hasSaved, setHasSaved] = useState(false);

  const groupList = nurseryInfo?.groups?.filter((g) => g.id !== 'all') || [
    { id: 'butterfly', name: 'Butterfly Group', icon: '🦋' },
    { id: 'sunshine', name: 'Sunshine Group', icon: '☀️' },
    { id: 'acorns', name: 'Little Acorns', icon: '🌳' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onTriggerProgressBar) onTriggerProgressBar();

    const updatedNurseryInfo = {
      ...nurseryInfo,
      name: formData.name.trim() || 'Little Steps Early Learning & Daycare',
      educator: {
        ...nurseryInfo?.educator,
        name: formData.educatorName.trim() || 'Miss Sarah Jenkins',
        group: formData.defaultGroup,
      },
    };

    if (onSaveSettings) {
      onSaveSettings(updatedNurseryInfo, formData.demoRole);
    }

    if (onRoleChange && formData.demoRole !== demoRole) {
      onRoleChange(formData.demoRole);
    }

    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 3000);

    if (onTriggerToast) {
      onTriggerToast({
        title: 'Settings Saved',
        message: 'Settings updated successfully.',
        icon: '⚙️',
        type: 'success',
      });
    }
  };

  return (
    <div className="settings-view-container">
      {/* 1. Breadcrumbs */}
      <nav className="workspace-breadcrumb" aria-label="Breadcrumb navigation">
        <button
          type="button"
          className="breadcrumb-link"
          onClick={onBackToDashboard}
        >
          Home
        </button>
        <span className="breadcrumb-separator">&gt;</span>
        <span className="breadcrumb-current">Settings</span>
      </nav>

      {/* 2. Header Banner */}
      <header className="settings-header glass-panel">
        <div className="settings-header-main">
          <div className="settings-brand-row">
            <div className="settings-icon-circle">
              <span className="settings-main-icon">⚙️</span>
            </div>
            <div>
              <div className="settings-badge-row">
                <span className="settings-pill-badge">Preferences</span>
                <span className="settings-local-pill">Local Storage Only</span>
              </div>
              <h1 className="settings-title">Settings</h1>
              <p className="settings-subtitle">
                Configure your nursery details, educator profile, and demo role preferences.
              </p>
            </div>
          </div>

          <div className="settings-header-actions">
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
      </header>

      {/* 3. Settings Form Card */}
      <div className="settings-content-wrapper">
        <form onSubmit={handleSubmit} className="settings-form-card glass-panel">
          <div className="settings-section-header">
            <span className="section-dot"></span>
            <h2>General Configuration</h2>
          </div>

          <div className="settings-fields-grid">
            {/* 1. Nursery Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="nursery-name-input">
                🏫 Nursery Name
              </label>
              <input
                id="nursery-name-input"
                type="text"
                className="form-input settings-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Little Steps Early Learning & Daycare"
                required
              />
              <span className="form-hint">The displayed name of your nursery or early learning center.</span>
            </div>

            {/* 2. Educator Display Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="educator-name-input">
                👩‍🏫 Educator Display Name
              </label>
              <input
                id="educator-name-input"
                type="text"
                className="form-input settings-input"
                value={formData.educatorName}
                onChange={(e) => setFormData({ ...formData, educatorName: e.target.value })}
                placeholder="e.g. Miss Sarah Jenkins"
                required
              />
              <span className="form-hint">Name displayed in the top educator bar and activity logs.</span>
            </div>

            {/* 3. Default Group */}
            <div className="form-group">
              <label className="form-label" htmlFor="default-group-select">
                👥 Default Group
              </label>
              <select
                id="default-group-select"
                className="form-input form-select settings-input"
                value={formData.defaultGroup}
                onChange={(e) => setFormData({ ...formData, defaultGroup: e.target.value })}
              >
                {groupList.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.icon ? `${g.icon} ` : ''}{g.name}
                  </option>
                ))}
              </select>
              <span className="form-hint">Default assigned classroom or age group.</span>
            </div>

            {/* 4. Demo Role View */}
            <div className="form-group">
              <label className="form-label">
                🎭 Demo Role View
              </label>
              <div className="role-view-options">
                <label className={`role-option-card ${formData.demoRole === 'educator' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="demoRole"
                    value="educator"
                    checked={formData.demoRole === 'educator'}
                    onChange={() => setFormData({ ...formData, demoRole: 'educator' })}
                  />
                  <div className="role-option-content">
                    <span className="role-option-icon">👩‍🏫</span>
                    <div>
                      <strong>Educator View</strong>
                      <p>Manage schedules, children list, and classroom routines</p>
                    </div>
                  </div>
                </label>

                <label className={`role-option-card ${formData.demoRole === 'parent' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="demoRole"
                    value="parent"
                    checked={formData.demoRole === 'parent'}
                    onChange={() => setFormData({ ...formData, demoRole: 'parent' })}
                  />
                  <div className="role-option-content">
                    <span className="role-option-icon">🏡</span>
                    <div>
                      <strong>Parent View</strong>
                      <p>Simulate parent portal with home routines and check-ins</p>
                    </div>
                  </div>
                </label>
              </div>
              <span className="form-hint">Choose which role perspective to preview in demo mode.</span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="settings-actions-footer">
            {hasSaved && (
              <span className="save-feedback-badge">
                ✅ Saved locally
              </span>
            )}
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onBackToDashboard}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-header-primary btn-save-settings"
            >
              <span className="btn-icon">💾</span>
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
