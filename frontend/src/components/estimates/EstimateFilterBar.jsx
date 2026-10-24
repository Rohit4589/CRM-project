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
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: '#F3EDE6',
        border: '1px solid #D1C2AF',
        padding: '3px 4px',
        borderRadius: '8px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        maxWidth: '100%',
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
              type="button"
              onClick={() => setStatusFilter(item.key)}
              style={{
                border: 'none',
                borderRadius: '6px',
                background: isActive ? 'var(--gold, #4A2C17)' : 'transparent',
                color: isActive ? '#FFFFFF' : '#5C4E43',
                fontWeight: '600',
                padding: '5px 10px',
                cursor: 'pointer',
                fontSize: '11.5px',
                display: 'inline-flex',
                alignItems: 'center',
                boxShadow: isActive ? '0 2px 6px rgba(74, 44, 23, 0.22)' : 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <span>{item.label} ({item.count})</span>
            </button>
          );
        })}
      </div>

      {/* Right: Search, Type Select & Create Button */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        width: '100%'
      }}>
        <div className="estimate-search-input" style={{ flex: '1 1 180px', minWidth: '140px', margin: 0 }}>
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search estimates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '6px 12px 6px 32px', fontSize: '12px', height: '34px', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <select
          className="estimate-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          style={{ width: 'auto', padding: '6px 8px', fontSize: '12px', height: '34px' }}
        >
          <option value="All">All Types</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
        </select>

        <button
          className="btn-create-estimate"
          onClick={onCreateNew}
          style={{ padding: '6px 12px', fontSize: '12px', whiteSpace: 'nowrap', height: '34px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
        >
          <i className="fa-solid fa-plus"></i>
          <span>Create Estimate</span>
        </button>
      </div>
    </div>
  );
};

export default EstimateFilterBar;
