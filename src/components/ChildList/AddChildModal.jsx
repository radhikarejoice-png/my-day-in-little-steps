import React, { useState } from 'react';

const AVATAR_OPTIONS = ['👦🏼', '👧🏽', '👦🏻', '👧🏻', '👶🏼', '👦🏽', '👧🏼', '👶🏻', '🧸', '🦄', '🦁', '⭐'];
const COLOR_OPTIONS = ['#FFE5EC', '#E8F5E9', '#FFF3E0', '#E1F5FE', '#F3E5F5', '#FFFDE7', '#E0F2F1'];

export default function AddChildModal({
  isOpen,
  onClose,
  onSaveChild,
  onDeleteChild,
  groups,
  editingChild = null,
}) {
  const [formData, setFormData] = useState({
    name: editingChild ? editingChild.name || '' : '',
    group: editingChild ? editingChild.group || 'butterfly' : 'butterfly',
    age: editingChild ? editingChild.age || '' : '',
    avatarEmoji: editingChild ? editingChild.avatarEmoji || '👦🏼' : '👦🏼',
    avatarBg: editingChild ? editingChild.avatarBg || '#E8F5E9' : '#E8F5E9',
    scheduleStatus: editingChild ? editingChild.scheduleStatus || 'ready' : 'ready',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const groupOptions = groups.filter((g) => g.id !== 'all');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting || isDeleting) return;

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter child name';
    if (!formData.age.trim()) newErrors.age = 'Please enter child age';
    if (!formData.group) newErrors.group = 'Please select a group';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedGroupObj = groupOptions.find((g) => g.id === formData.group) || groupOptions[0];

    const childToSave = {
      id: editingChild ? editingChild.id : undefined,
      name: formData.name.trim(),
      group: formData.group,
      groupName: selectedGroupObj ? selectedGroupObj.name : 'Butterfly Group',
      age: formData.age.trim(),
      avatarEmoji: formData.avatarEmoji,
      avatarBg: formData.avatarBg,
      scheduleStatus: formData.scheduleStatus,
    };

    setIsSubmitting(true);
    const result = await onSaveChild(childToSave, Boolean(editingChild));
    setIsSubmitting(false);

    if (result?.success !== false) {
      onClose();
    }
  };

  const handleConfirmDelete = async () => {
    if (!editingChild?.id || isDeleting) return;

    setIsDeleting(true);
    const result = await onDeleteChild(editingChild.id, editingChild.name);
    setIsDeleting(false);

    if (result?.success !== false) {
      setIsConfirmingDelete(false);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-glass-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-add-child-title"
      >
        <div className="modal-header">
          <div className="modal-header-icon-box">
            {editingChild ? '✏️' : '✨'}
          </div>
          <div className="modal-header-text">
            <h2 id="modal-add-child-title" className="modal-title">
              {editingChild ? `Edit ${editingChild.name}` : 'Add New Child'}
            </h2>
            <p className="modal-subtitle">
              {editingChild
                ? 'Update child profile and class group'
                : 'Enroll a child into the nursery visual schedule'}
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

        {/* Delete Confirmation Overlay / Dialog */}
        {isConfirmingDelete ? (
          <div className="delete-confirmation-container">
            <div className="delete-warning-icon">⚠️</div>
            <h3 className="delete-confirmation-heading">
              Are you sure you want to delete {editingChild?.name}?
            </h3>
            <p className="delete-confirmation-text">
              This action cannot be undone.
            </p>
            <div className="delete-confirmation-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                <span>{isDeleting ? 'Deleting...' : 'Delete Child'}</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {/* Avatar & Color Picker */}
            <div className="form-group-avatar-select">
              <label className="form-label">Select Avatar & Card Tint</label>
              <div className="avatar-preview-row">
                <div
                  className="avatar-large-preview"
                  style={{ backgroundColor: formData.avatarBg }}
                >
                  {formData.avatarEmoji}
                </div>
                <div className="avatar-emoji-picker">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`emoji-choice-btn ${formData.avatarEmoji === emoji ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, avatarEmoji: emoji })}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="color-swatch-row">
                <span className="swatch-label">Card Tint:</span>
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`color-swatch-btn ${formData.avatarBg === color ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, avatarBg: color })}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>

            <div className="form-grid-2col">
              {/* Child Name */}
              <div className="form-group">
                <label className="form-label">
                  Child Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'input-error' : ''}`}
                  placeholder="e.g. Adam"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) setErrors({ ...errors, name: null });
                  }}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              {/* Age */}
              <div className="form-group">
                <label className="form-label">
                  Age <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input ${errors.age ? 'input-error' : ''}`}
                  placeholder="e.g. 3 yrs"
                  value={formData.age}
                  onChange={(e) => {
                    setFormData({ ...formData, age: e.target.value });
                    if (errors.age) setErrors({ ...errors, age: null });
                  }}
                />
                {errors.age && <span className="error-text">{errors.age}</span>}
              </div>
            </div>

            <div className="form-grid-2col">
              {/* Class / Group */}
              <div className="form-group">
                <label className="form-label">Class / Group</label>
                <select
                  className="form-select"
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                >
                  {groupOptions.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.icon} {g.name} ({g.age})
                    </option>
                  ))}
                </select>
              </div>

              {/* Schedule Status */}
              <div className="form-group">
                <label className="form-label">Schedule Status</label>
                <select
                  className="form-select"
                  value={formData.scheduleStatus}
                  onChange={(e) => setFormData({ ...formData, scheduleStatus: e.target.value })}
                >
                  <option value="ready">🗓️ Schedule Ready</option>
                  <option value="to-prepare">⏳ Needs Preparation</option>
                  <option value="home-update">🏡 Home Update Pending</option>
                </select>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="modal-actions-row modal-actions-with-delete">
              {editingChild && onDeleteChild ? (
                <button
                  type="button"
                  className="btn-delete-child-subtle"
                  onClick={() => setIsConfirmingDelete(true)}
                  disabled={isSubmitting || isDeleting}
                  title={`Delete ${editingChild.name}`}
                >
                  <span>🗑️ Delete Child</span>
                </button>
              ) : (
                <div />
              )}

              <div className="modal-right-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={onClose}
                  disabled={isSubmitting || isDeleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={isSubmitting || isDeleting}
                >
                  <span>{isSubmitting ? 'Saving...' : editingChild ? '💾 Save Changes' : '✨ Add Child'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

