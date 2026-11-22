import React from 'react';

const EstimateKPICards = ({ estimates = [] }) => {
  const totalCount = estimates.length;
  const totalValue = estimates.reduce((sum, est) => sum + (Number(est.final_total) || 0), 0);
  const sentCount = estimates.filter(est => est.status === 'Sent' || est.status === 'Approved').length;
  const draftCount = estimates.filter(est => est.status === 'Draft').length;

  const formattedValue = totalValue >= 100000
    ? `₹${(totalValue / 100000).toFixed(2)} L`
    : `₹${totalValue.toLocaleString('en-IN')}`;

  return (
    <div className="estimate-kpis">
      <div className="estimate-kpi-card">
        <div className="estimate-kpi-icon primary">
          <i className="fa-solid fa-file-invoice-dollar"></i>
        </div>
        <div className="estimate-kpi-info">
          <h3>{totalCount}</h3>
          <p>Total Estimates</p>
        </div>
      </div>

      <div className="estimate-kpi-card">
        <div className="estimate-kpi-icon success">
          <i className="fa-solid fa-indian-rupee-sign"></i>
        </div>
        <div className="estimate-kpi-info">
          <h3>{formattedValue}</h3>
          <p>Estimated Pipeline</p>
        </div>
      </div>
    </div>
  );
};

export default EstimateKPICards;
