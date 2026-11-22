import React from 'react';

const CustomerBillsModal = ({ site, bills = [], onSelectBill, onClose, onNewBill }) => {
  if (!site) return null;

  const siteRef = site.siteCode ? `SITE-${site.siteCode}` : (site.siteRef || `SITE-${site.id}`);

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
          maxWidth: '680px',
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
                background: 'rgba(165, 106, 48, 0.12)',
                color: 'var(--gold, #A56A30)',
                padding: '2px 8px',
                borderRadius: '5px',
                fontSize: '11px',
                fontWeight: '800',
                fontFamily: 'monospace'
              }}>
                {siteRef}
              </span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>
                {site.customerName}
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '2px' }}>
              <i className="fa-solid fa-file-invoice" style={{ color: 'var(--gold, #A56A30)', marginRight: '5px' }}></i>
              <strong>{bills.length} Quotation{bills.length === 1 ? '' : 's'} / Bill{bills.length === 1 ? '' : 's'} on Record</strong> · {site.location || 'Site Location'}
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
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#4B5563' }}>No bills found for this customer</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Click the button below to create a new quotation for {site.customerName}.</div>
            </div>
          ) : (
            bills.map((bill, index) => {
              // Extract revision or bill number from estimate_number (e.g. "187-03" -> "BILL #3")
              const rawNum = String(bill.estimate_number || '');
              const revMatch = rawNum.match(/-0*(\d+)$/);
              const billTag = revMatch ? `BILL #${revMatch[1]}` : (rawNum ? `#${rawNum}` : `BILL #${index + 1}`);
              const orderNo = `#${rawNum.replace(/-\d+$/, '') || bill.id}`;
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{
                        background: '#FAF4EE',
                        color: 'var(--gold, #8C5521)',
                        fontWeight: '800',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid #EAD8C7',
                        letterSpacing: '0.5px'
                      }}>
                        {billTag}
                      </span>
                      <span style={{ fontWeight: '800', color: '#111827', fontSize: '14px' }}>
                        Order {orderNo}
                      </span>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '2px 8px',
                        borderRadius: '10px',
                        fontWeight: '700',
                        background: status === 'Completed' ? '#DCFCE7' : (status === 'On Hold' ? '#FEF2F2' : '#EFF6FF'),
                        color: status === 'Completed' ? '#15803D' : (status === 'On Hold' ? '#DC2626' : '#2563EB')
                      }}>
                        ● {status}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: '#6B7280', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span>
                        <i className="fa-regular fa-calendar" style={{ marginRight: '4px', color: 'var(--gold, #A56A30)' }}></i>
                        {formatDate(bill.created_at || bill.date)}
                      </span>
                      {bill.project_type && (
                        <span>
                          <i className="fa-solid fa-shapes" style={{ marginRight: '4px', color: 'var(--gold, #A56A30)' }}></i>
                          {bill.project_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Bill Amount & View Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: '#78716C', fontWeight: '700', textTransform: 'uppercase' }}>Final Total</div>
                      <div style={{ fontSize: '16px', fontWeight: '800', color: '#4A2C17', marginTop: '1px' }}>
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
                        padding: '7px 12px',
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
                background: '#fff',
                border: '1px solid #D1C2AF',
                color: 'var(--gold, #8C5521)',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <i className="fa-solid fa-plus"></i>
              <span>Create New Bill for {site.customerName}</span>
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
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
