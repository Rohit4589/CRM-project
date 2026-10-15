import React from 'react';

const EstimateFilterBar = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  typeFilter,
  setTypeFilter,
  onCreateNew
}) => {
  return (
    <div className="estimate-filter-bar">
      <div className="estimate-filter-left">
        <div className="estimate-search-input">
          <i className="fa-solid fa-magnifying-glass"></i>
          <input
            type="text"
            placeholder="Search by customer, estimate #, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="estimate-select"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="All">All Types</option>
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      <button className="btn-create-estimate" onClick={onCreateNew}>
        <i className="fa-solid fa-plus"></i>
        <span>Create Estimate</span>
      </button>
    </div>
  );
};

export default EstimateFilterBar;
