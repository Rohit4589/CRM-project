import React from 'react';

const EstimateTable = ({
  estimates = [],
  loading = false,
  onView,
  onEdit,
  onRevision,
  onDownload,
  onShare,
  onDelete,
  onStatusChange
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
        <h3 style={{ fontSize: '16px', color: '#2B2520', margin: '0 0 6px 0' }}>No Estimates Found in this Folder</h3>
        <p style={{ fontSize: '13px', color: '#8C827A', margin: 0 }}>Create a new estimate or move existing orders between Running & Quotation folders.</p>
      </div>
    );
  }

  return (
    <div className="estimate-table-card">
      <div className="estimate-table-wrap">
        <table className="estimate-table">
          <thead>
            <tr>
              <th style={{ width: '85px', minWidth: '85px' }}>Order No</th>
              <th style={{ minWidth: '180px' }}>Customer Name</th>
              <th style={{ width: '130px', minWidth: '120px' }}>Phone / Site</th>
              <th style={{ width: '110px', minWidth: '100px' }}>Project Type</th>
              <th style={{ width: '100px', minWidth: '95px' }}>Date</th>
              <th style={{ width: '125px', minWidth: '120px' }}>Folder Status</th>
              <th style={{ width: '130px', minWidth: '125px', whiteSpace: 'nowrap' }}>Final Total</th>
              <th style={{ width: '220px', minWidth: '220px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
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

              const currentStatus = est.order_status || est.site_status || est.status || 'Running';
              const isRunning = currentStatus === 'Running' || currentStatus === 'Draft' || currentStatus === 'Quotation';
              const isCompleted = currentStatus === 'Completed' || currentStatus === 'Complete';
              const isOnHold = currentStatus === 'On Hold' || currentStatus === 'Hold / Cancelled' || currentStatus === 'Hold';

              return (
                <tr key={est.id}>
                  <td>
                    <span className="estimate-num-badge">#{baseOrder}</span>
                    {revNumber ? (
                      <div style={{ marginTop: '3px' }}>
                        <span className="estimate-rev-badge">Bill #{parseInt(revNumber, 10) || revNumber}</span>
                      </div>
                    ) : null}
                  </td>
                  <td>
                    <strong
                      style={{
                        color: '#2B2520',
                        fontSize: '13.5px',
                        cursor: onEdit ? 'pointer' : 'default',
                        transition: 'color 0.15s ease'
                      }}
                      onClick={() => onEdit && onEdit(est)}
                      title={onEdit ? 'Click to Edit Estimate' : ''}
                      onMouseOver={(e) => { if (onEdit) e.currentTarget.style.color = '#8A5D3B'; }}
                      onMouseOut={(e) => { if (onEdit) e.currentTarget.style.color = '#2B2520'; }}
                    >
                      {cleanCustomerName}
                    </strong>
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
                  
                  {/* Status Dropdown: 3 Categories (Running, Completed, On Hold) */}
                  <td>
                    <select
                      value={isCompleted ? 'Completed' : (isOnHold ? 'On Hold' : 'Running')}
                      onChange={(e) => onStatusChange && onStatusChange(est.id, e.target.value)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11.5px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        outline: 'none',
                        border: '1.5px solid',
                        background: isRunning ? '#ECFDF5' : (isCompleted ? '#F3F4F6' : '#FEF3C7'),
                        color: isRunning ? '#065F46' : (isCompleted ? '#4B5563' : '#92400E'),
                        borderColor: isRunning ? '#A7F3D0' : (isCompleted ? '#D1D5DB' : '#FCD34D'),
                        transition: 'all 0.15s ease'
                      }}
                      title="Move Order Status (Running / Completed / On Hold)"
                    >
                      <option value="Running">● Running</option>
                      <option value="Completed">● Completed</option>
                      <option value="On Hold">● On Hold</option>
                    </select>
                  </td>

                  <td style={{ whiteSpace: 'nowrap', width: '130px', minWidth: '125px' }}>
                    <strong style={{ fontSize: '14px', color: '#2E7D32' }}>{formattedTotal}</strong>
                  </td>
                  <td style={{ textAlign: 'right', width: '220px', minWidth: '220px', whiteSpace: 'nowrap' }}>
                    <div className="estimate-actions" style={{ justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                      {onEdit && (
                        <button
                          className="btn-action-icon edit"
                          title="Edit Estimate"
                          onClick={() => onEdit(est)}
                        >
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                      )}

                      <button
                        className="btn-action-icon"
                        title="Preview & Print"
                        onClick={() => onView(est)}
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>

                      <button
                        className="btn-action-icon"
                        title="Download / Print Bill"
                        onClick={() => (onDownload ? onDownload(est) : onView(est))}
                      >
                        <i className="fa-solid fa-download"></i>
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
