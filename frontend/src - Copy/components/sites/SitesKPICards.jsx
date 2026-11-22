import React from 'react';

const SitesKPICards = ({ counts }) => {
  const cards = [
    { label: 'Total Sites', value: counts.all, sub: 'All registered projects' },
    { label: 'Running', value: counts.running, sub: 'Active work sites' },
    { label: 'Quotations', value: counts.quotation || 0, sub: 'Estimating & Proposal' },
    { label: 'Completed', value: counts.completed, sub: 'Finished client projects' },
    { label: 'On Hold', value: counts.onHold, sub: 'Temporarily paused work' }
  ];

  return (
    <div className="sites-kpi-grid" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
      gap: '8px',
      marginBottom: '14px'
    }}>
      {cards.map((card, idx) => (
        <div key={idx} style={{
          background: '#FFFFFF',
          borderRadius: '8px',
          padding: '10px 12px',
          border: '1px solid #D1C2AF',
          borderLeft: '3px solid #4A2C17',
          boxShadow: '0 1px 4px rgba(74, 44, 23, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{fontSize: '10px', fontWeight: '700', color: '#5C4433', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px'}}>
            {card.label}
          </div>
          <div style={{fontSize: '20px', fontWeight: '800', color: '#1F1A17', lineHeight: '1.2'}}>
            {card.value}
          </div>
          <div className="kpi-sub-text" style={{fontSize: '10px', color: '#8A7565', marginTop: '2px'}}>
            {card.sub}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SitesKPICards;
