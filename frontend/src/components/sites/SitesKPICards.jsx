import React from 'react';

const SitesKPICards = ({ counts }) => {
  const cards = [
    { label: 'Total Sites', value: counts.all, sub: 'All registered projects' },
    { label: 'Running', value: counts.running, sub: 'Active work sites' },
    { label: 'Completed', value: counts.completed, sub: 'Finished client projects' },
    { label: 'On Hold', value: counts.onHold, sub: 'Temporarily paused work' }
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '14px',
      marginBottom: '22px'
    }}>
      {cards.map((card, idx) => (
        <div key={idx} style={{
          background: '#FFFFFF',
          borderRadius: '10px',
          padding: '16px 20px',
          border: '1px solid #D1C2AF',
          borderLeft: '4px solid #4A2C17',
          boxShadow: '0 3px 12px rgba(74, 44, 23, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{fontSize: '11px', fontWeight: '700', color: '#5C4433', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px'}}>
            {card.label}
          </div>
          <div style={{fontSize: '26px', fontWeight: '800', color: '#1F1A17', lineHeight: '1.2'}}>
            {card.value}
          </div>
          <div style={{fontSize: '11px', color: '#8A7565', marginTop: '4px'}}>
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SitesKPICards;
