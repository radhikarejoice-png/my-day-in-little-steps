import React from 'react';

export default function Footer({ nurseryInfo }) {
  return (
    <footer className="dashboard-footer glass-panel">
      <div className="footer-top-row">
        <div className="footer-brand">
          <div className="footer-logo">
            <span className="logo-emoji">👣</span>
            <span className="logo-text">My Day in Little Steps</span>
          </div>
          <p className="footer-tagline">
            Visual schedules & gentle home activity progress tracking for early learners.
          </p>
        </div>

        <div className="footer-pills">
          <span className="footer-pill">🗓️ Visual Schedules</span>
          <span className="footer-pill">🏡 Home Activities</span>
          <span className="footer-pill version-pill">v1.0.0</span>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p className="copyright-text">
          © {new Date().getFullYear()} {nurseryInfo.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
