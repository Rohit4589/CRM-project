import React from 'react';

const EstimateFilterBar = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  counts = {},
  typeFilter,
  setTypeFilter,
  onCreateNew
}) => {
  const filterTabs = [
    { key: 'Running', label: 'Running', count: counts.running || 0 },
    { key: 'Complete', label: 'Completed', count: counts.completed || 0 },
    { key: 'Hold / Cancelled', label: 'On Hold', count: counts.onHold || 0 },
    { key: 'All', label: 'All', count: counts.all || 0 }
  ];

  return (
    <div className="estimate-filter-bar" style={{
      background: '#FFFFFF',
      borderRadius: '12px',
      padding: '12px 18px',
      border: '1px solid #D1C2AF',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      flexWrap: 'wrap',
      boxShadow: '0 2px 8px rgba(100, 70, 40, 0.03)'
    }}>
      {/* Left: Status Folder Tabs */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        background: '#F3EDE6',
        border: '1px solid #D1C2AF',
        padding: '3px 4px',
        borderRadius: '8px',
        flexShrink: 0
      }}>
        {filterTabs.map((item) => {
          const isActive =
            statusFilter === item.key ||
            (item.key === 'Complete' && statusFilter === 'Completed') ||
            (item.key === 'Hold / Cancelled' && (statusFilter === 'On Hold' || statusFilter === 'Cancelled'));

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              style={{
                border: 'none',
                borderRadius: '6px',
                background: isActive ? 'var(--gold, #4A2C17)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#5C4E43',
                fontWeight: '600',
                padding: '6px 14px',
                cursor: 'pointer',
                fontSize: '12.5px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: isActive ? '0 2px 8px rgba(74, 44, 23, 0.28)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              <span>{item.label} ({item.count})</span>
            </button>
          );
        })}
      </div>

      {/* Right: Search, Type Select & Create Button (All in 1 Line) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexWrap: 'nowrap'
      }}>
        <div className="estimate-search-input" style={{ width: '220px', minWidth: '170px', margin: 0 }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search estimates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px 8px 34px', fontSize: '12.5px' }}
          />
        </div>

        <select
          className="estimate-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ minWidth: '110px', padding: '8px 10px', fontSize: '12.5px' }}
        >
          <option value="All">All Types</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
        </select>

        <button
          className="btn-create-estimate"
          onClick={onCreateNew}
          style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}
        >
          <i className="fa-solid fa-plus"></i>
          <span>Create Estimate</span>
        </button>
      </div>
    </div>
  );
};

export default EstimateFilterBar;
