import React, { useState, useEffect } from 'react';

const PRESET_COLORS = [
  '#6366f1', // Indigo (default)
  '#10b981', // Emerald
  '#0ea5e9', // Sky Blue
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#ef4444', // Red
];

const PRESET_ICONS = ['⭐', '🧘', '🏃', '📚', '💧', '💻', '🥗', '💊', '✍️', '🎯', '🚴', '💪'];

const HabitForm = ({
  isOpen,
  initialData = null,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [icon, setIcon] = useState('⭐');
  const [isArchived, setIsArchived] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setColor(initialData.color || '#6366f1');
      setIcon(initialData.icon || '⭐');
      setIsArchived(Boolean(initialData.isArchived));
    } else {
      setName('');
      setDescription('');
      setColor('#6366f1');
      setIcon('⭐');
      setIsArchived(false);
    }
    setErrors({});
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) {
      newErrors.name = 'Habit name is required';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Habit name must be at least 2 characters';
    } else if (name.trim().length > 60) {
      newErrors.name = 'Habit name cannot exceed 60 characters';
    }

    if (description.trim().length > 200) {
      newErrors.description = 'Description cannot exceed 200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      color,
      icon,
      ...(initialData ? { isArchived } : {}),
    });
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="habit-form-title">
      <div className="modal-content">
        <div className="modal-header">
          <h3 id="habit-form-title" className="modal-title">
            {initialData ? 'Edit Habit' : 'Create New Habit'}
          </h3>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Name */}
            <div className="form-group">
              <label htmlFor="habit-name" className="form-label">
                Habit Name <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <input
                id="habit-name"
                type="text"
                className={`form-input ${errors.name ? 'has-error' : ''}`}
                placeholder="e.g. 20 Minutes Meditation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                autoFocus
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="habit-desc" className="form-label">
                Description (Optional)
              </label>
              <textarea
                id="habit-desc"
                className={`form-textarea ${errors.description ? 'has-error' : ''}`}
                rows={2}
                placeholder="Why is this habit important to you?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
              />
              <span className="form-hint">{description.length}/200 characters</span>
              {errors.description && <span className="form-error">{errors.description}</span>}
            </div>

            {/* Icon Selection */}
            <div className="form-group">
              <label className="form-label">Icon / Emoji</label>
              <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                {PRESET_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    style={{
                      width: '36px',
                      height: '36px',
                      fontSize: '1.25rem',
                      borderRadius: 'var(--radius-sm)',
                      border: icon === emoji ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                      backgroundColor: icon === emoji ? 'var(--primary-subtle)' : 'var(--bg-surface)',
                    }}
                    onClick={() => setIcon(emoji)}
                    aria-label={`Select icon ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Accent Selection */}
            <div className="form-group">
              <label className="form-label">Color Theme</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: c,
                      border: color === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                    onClick={() => setColor(c)}
                    aria-label={`Select color ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    background: 'none',
                  }}
                  title="Choose custom color"
                />
              </div>
            </div>

            {/* Archive checkbox if editing */}
            {initialData && (
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  id="habit-archive"
                  type="checkbox"
                  checked={isArchived}
                  onChange={(e) => setIsArchived(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="habit-archive" className="form-label" style={{ marginBottom: 0 }}>
                  Archive this habit (hidden from daily dashboard)
                </label>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : initialData ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitForm;
