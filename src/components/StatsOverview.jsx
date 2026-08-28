import React from 'react';

export default function StatsOverview({ onStatClick }) {
  const cards = [
    {
      id: 'children',
      title: 'Children',
      value: '24 Children',
      subtitle: 'Across 3 groups',
      icon: '👶',
      pastelBg: 'card-pastel-mint',
      accentColor: '#34A853',
      filterType: 'all',
      onClickText: 'Viewing all 24 children across 3 groups',
    },
    {
      id: 'ready',
      title: 'Schedules Ready',
      value: '18 Schedules Ready',
      subtitle: 'Prepared for today',
      icon: '🗓️',
      pastelBg: 'card-pastel-sky',
      accentColor: '#0288D1',
      filterType: 'ready',
      onClickText: '18 visual schedules prepared for today',
    },
    {
      id: 'to-prepare',
      title: 'Schedules to Prepare',
      value: '6 Schedules to Prepare',
      subtitle: 'Needs educator action',
      icon: '⏳',
      pastelBg: 'card-pastel-peach',
      accentColor: '#FF7043',
      filterType: 'to-prepare',
      onClickText: '6 visual schedules need educator action',
    },
    {
      id: 'home-updates',
      title: 'Home Updates',
      value: '4 Home Updates',
      subtitle: 'Awaiting parent response',
      icon: '🏡',
      pastelBg: 'card-pastel-lavender',
      accentColor: '#9C27B0',
      filterType: 'home-update',
      onClickText: '4 home activity updates awaiting parent response',
    },
  ];

  return (
    <section className="stats-overview-section" aria-label="Today at a Glance">
      <div className="section-header-inline">
        <div className="section-title-group">
          <span className="section-icon">📊</span>
          <h2 className="section-heading">Today at a Glance</h2>
        </div>
      </div>

      <div className="stats-grid stats-grid-4col">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`stat-card glass-panel ${card.pastelBg}`}
            onClick={() => onStatClick(card)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onStatClick(card);
              }
            }}
          >
            <div className="stat-card-header">
              <div className="stat-icon-bubble">{card.icon}</div>
            </div>

            <div className="stat-card-body">
              <div className="stat-card-value">{card.value}</div>
              <p className="stat-card-subtitle">{card.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
