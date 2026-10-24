import React from 'react';

const SitesFilterBar = ({ statusFilter, setStatusFilter, counts, searchTerm, setSearchTerm }) => {
  const filterTabs = [
    { key: 'Running', label: 'Running', count: counts.running },
    { key: 'Complete', label: 'Completed', count: counts.completed },
    { key: 'Hold / Cancelled', label: 'On Hold', count: counts.onHold },
    { key: 'All', label: 'All', count: counts.all }
  ];

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '12px 12px 0 0',
      padding: '12px 16px',
      border: '1px solid #D1C2AF',
      borderBottom: '1px solid #E4D9CC',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      boxShadow: '0 2px 8px rgba(100, 70, 40, 0.03)'
    }}>
      {/* Filter tabs */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        background: '#F3EDE6',
        border: '1px solid #D1C2AF',
        padding: '4px 6px',
        borderRadius: '8px',
        maxWidth: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        flexWrap: 'nowrap'
      }}>
        {filterTabs.map((item) => {
          const isActive = 
            statusFilter === item.key || 
            (item.key === 'Complete' && statusFilter === 'Completed') || 
            (item.key === 'Hold / Cancelled' && (statusFilter === 'On Hold' || statusFilter === 'Cancelled'));

          return (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              style={{
                border: 'none',
                borderRadius: '6px',
                background: isActive ? 'var(--gold, #4A2C17)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#5C4E43',
                fontWeight: '600',
                padding: '7px 14px',
                cursor: 'pointer',
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: isActive ? '0 2px 8px rgba(74, 44, 23, 0.28)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseOver={(e) => {
                if (isActive) {
                  e.currentTarget.style.background = 'var(--gold-light, #61391E)';
                } else {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
                }
              }}
              onMouseOut={(e) => {
                if (isActive) {
                  e.currentTarget.style.background = 'var(--gold, #4A2C17)';
                } else {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{item.label} ({item.count})</span>
            </button>
          );
        })}
      </div>

      {/* Search Box */}
      <div className="search-box" style={{position: 'relative', width: '270px', maxWidth: '100%', minWidth: '220px', flex: '1 1 220px'}}>
        <input
          type="text"
          placeholder="Search sites..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 34px 9px 36px',
            border: '1px solid #D1C2AF',
            borderRadius: '8px',
            outline: 'none',
            fontSize: '13px',
            background: '#FAF8F5',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--gold, #A56A30)';
            e.target.style.boxShadow = '0 0 0 3px rgba(165, 106, 48, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D1C2AF';
            e.target.style.boxShadow = 'none';
          }}
        />
        <i
          className="fa-solid fa-magnifying-glass"
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#8C7B6D',
            fontSize: '13px'
          }}
        ></i>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#8C7B6D',
              cursor: 'pointer',
              fontSize: '12px',
              padding: 0
            }}
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default SitesFilterBar;
