import React from 'react';

export default function ProgressBar({ isActive, progress = 0 }) {
  if (!isActive) return null;

  return (
    <div className="top-action-progress" role="progressbar" aria-valuenow={progress} aria-valuemin="0" aria-valuemax="100">
      <div
        className="top-action-progress-bar"
        style={{ width: `${Math.min(100, Math.max(10, progress))}%` }}
      />
    </div>
  );
}
