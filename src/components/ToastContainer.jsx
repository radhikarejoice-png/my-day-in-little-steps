import React from 'react';

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type}`}>
          <div className="toast-icon-wrapper">{toast.icon}</div>
          <div className="toast-content">
            <h4 className="toast-title">{toast.title}</h4>
            {toast.message && <p className="toast-message">{toast.message}</p>}
          </div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => onDismiss(toast.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
          <div
            className="toast-progress-bar"
            style={{ animationDuration: `${toast.duration || 4000}ms` }}
          />
        </div>
      ))}
    </aside>
  );
}
