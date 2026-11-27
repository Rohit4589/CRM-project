import React from 'react';

const CustomerBillsModal = ({ site, bills = [], onSelectBill, onClose, onNewBill }) => {
  if (!site) return null;

  const rawNum = String(site.siteCode || site.siteRef || site.id || '').replace(/[^0-9]/g, '');
  const orderBadge = rawNum ? (rawNum.length < 3 ? rawNum.padStart(3, '0') : rawNum) : (site.siteRef || site.id);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(26, 17, 10, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1350,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '650px',
          maxHeight: '88vh',
          boxShadow: '0 20px 40px rgba(74, 44, 23, 0.25)',
          border: '1.5px solid #D1C2AF',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          background: '#FAF8F5',
          borderBottom: '1.5px solid #EAE3DA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{
                background: '#FAF4EE',
                color: '#8C5521',
                border: '1px solid #EAD8C7',
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '800'
              }}>
                {orderBadge}
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                {site.customerName}
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{site.location || site.siteRef || 'Site Location'}</span>
              <span>•</span>
              <span>{bills.length} {bills.length === 1 ? 'Quotation' : 'Quotations'} on Record</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              color: '#9CA3AF',
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Bills List Body */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', background: '#FAF8F5', borderRadius: '10px', border: '1px dashed #D1C2AF' }}>
              <i className="fa-regular fa-file-excel" style={{ fontSize: '32px', color: '#D1C2AF', marginBottom: '8px', display: 'block' }}></i>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#4B5563' }}>No estimates found for this customer</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Click the button below to create a new quotation for {site.customerName}.</div>
            </div>
          ) : (
            bills.map((bill, index) => {
              const rawNum = String(bill.estimate_number || '');
              const revMatch = rawNum.match(/-0*(\d+)$/);
              const quotationTitle = revMatch 
                ? `Quotation #${parseInt(revMatch[1], 10)}` 
                : (bills.length > 1 ? `Quotation #${bills.length - index}` : 'Quotation');
              const amount = Number(bill.grand_total || bill.final_total || bill.total_amount || 0);
              const status = bill.order_status || bill.site_status || bill.status || 'Running';

              return (
                <div
                  key={bill.id || index}
                  onClick={() => onSelectBill(bill)}
                  style={{
                    background: '#fff',
                    border: '1.5px solid #EAE3DA',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 6px rgba(74, 44, 23, 0.04)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--gold, #A56A30)';
                    e.currentTarget.style.backgroundColor = '#FAF8F5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#EAE3DA';
                    e.currentTarget.style.backgroundColor = '#fff';
                  }}
                >
                  {/* Left: Bill Identification & Date */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '800', color: '#111827', fontSize: '15px' }}>
                        {quotationTitle}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        background: status === 'Completed' ? '#DCFCE7' : (status === 'On Hold' ? '#FEF2F2' : '#EFF6FF'),
                        color: status === 'Completed' ? '#15803D' : (status === 'On Hold' ? '#DC2626' : '#2563EB')
                      }}>
                        ● {status}
                      </span>
                    </div>

                    <div style={{ fontSize: '12px', color: '#6B7280', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span>
                        <i className="fa-regular fa-calendar" style={{ marginRight: '5px', color: 'var(--gold, #A56A30)' }}></i>
                        {formatDate(bill.created_at || bill.date)}
                      </span>
                      {bill.project_type && (
                        <span>
                          <i className="fa-solid fa-shapes" style={{ marginRight: '5px', color: 'var(--gold, #A56A30)' }}></i>
                          {bill.project_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Bill Amount & View Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#78716C', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Final Total</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#4A2C17', marginTop: '1px' }}>
                        ₹{amount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBill(bill);
                      }}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        background: 'var(--gold, #4A2C17)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(74, 44, 23, 0.15)'
                      }}
                    >
                      <i className="fa-solid fa-eye"></i>
                      <span>View Bill</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px',
          background: '#FAF8F5',
          borderTop: '1px solid #EAE3DA',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          {onNewBill ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewBill(site);
              }}
              style={{
                background: '#FAF8F5',
                border: '1px solid #D1C2AF',
                color: 'var(--gold, #8C5521)',
                padding: '7px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Create New Estimate</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              border: '1px solid #D1C2AF',
              background: '#fff',
              color: '#374151',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default CustomerBillsModal;
