import React from 'react';

const EstimateTable = ({
  estimates = [],
  loading = false,
  onView,
  onEdit,
  onRevision,
  onDownload,
  onShare,
  onDelete
}) => {
  if (loading) {
    return (
      <div className="estimate-table-card" style={{ padding: '40px', textAlign: 'center', color: '#7A6F66' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '10px' }}></i>
        <p>Loading estimates...</p>
      </div>
    );
  }

  if (estimates.length === 0) {
    return (
      <div className="estimate-table-card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <i className="fa-solid fa-file-invoice" style={{ fontSize: '40px', color: '#DCD4CA', marginBottom: '14px' }}></i>
        <h3 style={{ fontSize: '16px', color: '#2B2520', margin: '0 0 6px 0' }}>No Estimates Found</h3>
        <p style={{ fontSize: '13px', color: '#8C827A', margin: 0 }}>Create a new estimate with 1-click default tiers or custom room items.</p>
      </div>
    );
  }

  return (
    <div className="estimate-table-card">
      <div className="estimate-table-wrap">
        <table className="estimate-table">
          <thead>
            <tr>
              <th style={{ width: '11%' }}>Order No</th>
              <th style={{ width: '27%' }}>Customer Name</th>
              <th style={{ width: '14%' }}>Phone / Site</th>
              <th style={{ width: '12%' }}>Project Type</th>
              <th style={{ width: '11%' }}>Date</th>
              <th style={{ width: '11%' }}>Final Total</th>
              <th style={{ width: '14%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {estimates.map((est) => {
              const formattedTotal = Number(est.final_total || 0).toLocaleString('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0
              });

              const dateStr = est.date
                ? new Date(est.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : '-';

              // Parse base order number and revision
              const rawNum = String(est.estimate_number || '');
              const revMatch = rawNum.match(/^(\d+)-(\d+)$/);
              let baseOrder = '';
              let revNumber = '';

              if (revMatch) {
                const bNum = parseInt(revMatch[1], 10);
                baseOrder = bNum < 1000 ? String(bNum).padStart(3, '0') : String(bNum);
                revNumber = revMatch[2];
              } else {
                const match = rawNum.match(/\d+/);
                if (match) {
                  const num = parseInt(match[0], 10);
                  baseOrder = num < 1000 ? String(num).padStart(3, '0') : String(num);
                } else {
                  baseOrder = est.site_ref || rawNum || '-';
                }
              }

              // Strip manual -01, -02 from customer name if user had typed it
              const cleanCustomerName = String(est.customer_name || '').replace(/-\d+$/, '').trim();

              return (
                <tr key={est.id}>
                  <td>
                    <span className="estimate-num-badge">Order #{baseOrder}</span>
                    {revNumber ? (
                      <div style={{ marginTop: '3px' }}>
                        <span className="estimate-rev-badge">Bill #{parseInt(revNumber, 10) || revNumber}</span>
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <strong style={{ color: '#2B2520', fontSize: '13.5px' }}>{cleanCustomerName}</strong>
                    {est.address && (
                      <div style={{ fontSize: '11.5px', color: '#8C827A', marginTop: '3px', lineHeight: '1.4', wordBreak: 'break-word' }}>
                        {est.address}
                      </div>
                    )}
                  </td>
                  <td>
                    <div>{est.phone || '-'}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#4A2C17' }}>
                      {est.project_type || 'Residential'}
                    </div>
                  </td>
                  <td>{dateStr}</td>
                  <td>
                    <strong style={{ fontSize: '14px', color: '#2E7D32' }}>{formattedTotal}</strong>
                  </td>
                  <td>
                    <div className="estimate-actions" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="btn-action-icon"
                        title="Preview & Print"
                        onClick={() => onView(est)}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>

                      <button
                        className="btn-action-icon"
                        title="Edit Estimate"
                        onClick={() => onEdit(est)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>

                      {onRevision && (
                        <button
                          className="btn-action-icon revision"
                          title="Create Next Revision / Copy Bill"
                          onClick={() => onRevision(est)}
                        >
                          <i className="fa-solid fa-copy"></i>
                        </button>
                      )}

                      <button
                        className="btn-action-icon"
                        title="Download PDF"
                        onClick={() => onDownload(est)}
                      >
                        <i className="fa-solid fa-file-pdf"></i>
                      </button>

                      <button
                        className="btn-action-icon whatsapp"
                        title="Send via WhatsApp"
                        onClick={() => onShare(est)}
                      >
                        <i className="fa-brands fa-whatsapp"></i>
                      </button>

                      <button
                        className="btn-action-icon delete"
                        title="Delete"
                        onClick={() => onDelete(est)}
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EstimateTable;
