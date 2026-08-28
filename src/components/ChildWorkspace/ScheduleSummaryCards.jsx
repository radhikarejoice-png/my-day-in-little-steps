import React from 'react';

export default function ScheduleSummaryCards({ schedule = [], homeActivities = [] }) {
  const isCompleted = (item) => String(item?.status || '').toLowerCase() === 'completed';

  // Ensure Nursery activities in schedule and Home activities are separated cleanly
  const nurseryActivities = schedule.filter((a) => a.type !== 'Home');
  const homeList = homeActivities;

  const totalNursery = nurseryActivities.length;
  const completedNursery = nurseryActivities.filter(isCompleted).length;

  const totalHome = homeList.length;
  const completedHome = homeList.filter(isCompleted).length;

  const totalActivities = totalNursery + totalHome;
  const completedTotal = completedNursery + completedHome;

  const cards = [
    {
      id: 'total',
      title: 'Total Activities',
      value: totalActivities,
      subtitle: 'Today’s scheduled flow',
      icon: '🗓️',
      colorClass: 'card-pastel-lavender',
    },
    {
      id: 'nursery',
      title: 'Nursery Activities',
      value: totalNursery,
      subtitle: `${completedNursery} of ${totalNursery} completed`,
      icon: '🏫',
      colorClass: 'card-pastel-mint',
    },
    {
      id: 'home',
      title: 'Home Activities',
      value: totalHome,
      subtitle: `${completedHome} of ${totalHome} completed`,
      icon: '🏡',
      colorClass: 'card-pastel-peach',
    },
    {
      id: 'completed',
      title: 'Completed Activities',
      value: completedTotal,
      subtitle: `${completedTotal} of ${totalActivities} finished`,
      icon: '✅',
      colorClass: 'card-pastel-sky',
    },
  ];

  return (
    <div className="schedule-summary-grid">
      {cards.map((card) => (
        <div key={card.id} className={`schedule-summary-card glass-panel ${card.colorClass}`}>
          <div className="summary-card-icon-bubble">{card.icon}</div>
          <div className="summary-card-text">
            <span className="summary-card-title">{card.title}</span>
            <div className="summary-card-value">{card.value}</div>
            <span className="summary-card-subtitle">{card.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

