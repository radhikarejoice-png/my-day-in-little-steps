import React, { useState } from 'react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Children Dashboard', icon: '👶', badge: '24' },
  { id: 'schedules', label: 'Visual Schedules', icon: '🗓️', badge: '18 Ready' },
  { id: 'home-activities', label: 'Home Activities', icon: '🏡', badge: '4 Updates' },
  { id: 'library', label: 'Activity Library', icon: '📚', badge: null },
  { id: 'settings', label: 'Settings', icon: '⚙️', badge: null },
];

export default function Sidebar({ currentNav, onNavSelect }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`sticky-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Icon & Title */}
      <div className="sidebar-brand-wrapper">
        <div className="brand-logo-circle" title="My Day in Little Steps">
          <span className="brand-icon">👣</span>
        </div>
        {!collapsed && (
          <div className="brand-text">
            <span className="brand-title">Little Steps</span>
            <span className="brand-subtitle">Visual Schedules</span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">
          {!collapsed ? 'NAVIGATION' : '•••'}
        </div>
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = (currentNav || 'dashboard') === item.id;
            return (
              <li key={item.id} className="nav-item">
                <button
                  type="button"
                  className={`nav-button ${isActive ? 'active' : ''}`}
                  onClick={() => onNavSelect(item.id, item.label)}
                  data-tooltip={item.label}
                  aria-label={item.label}
                >
                  <span className="nav-icon-container">
                    <span className="nav-icon">{item.icon}</span>
                  </span>
                  {!collapsed && <span className="nav-label">{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className={`nav-badge ${isActive ? 'badge-active' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                  {/* Tooltip on hover */}
                  <span className="sidebar-tooltip">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse / Expand Toggle */}
      <div className="sidebar-footer-toggle">
        <button
          type="button"
          className="collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          data-tooltip={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <span className="collapse-icon">{collapsed ? '👉' : '👈'}</span>
          {!collapsed && <span className="collapse-text">Compact View</span>}
          <span className="sidebar-tooltip">{collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
        </button>
      </div>
    </aside>
  );
}
