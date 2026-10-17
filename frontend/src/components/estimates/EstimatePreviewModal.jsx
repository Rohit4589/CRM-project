import React, { useRef, useEffect } from 'react';
import modernLogo from '../../assets/logo.png';
import { downloadEstimatePdf, printEstimateSheet } from '../../utils/estimatePdfGenerator';

const EstimatePreviewModal = ({
  estimate,
  onClose,
  onShare
}) => {
  const printSheetRef = useRef(null);

  if (!estimate) return null;

  const rooms = estimate.rooms_data || [];
  const bank = estimate.bank_details || {};
  const formattedDate = estimate.date
    ? new Date(estimate.date).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  // Split Terms & Conditions into 4 & 4 groups
  const termsList = (estimate.terms_conditions || '')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const half = Math.ceil(termsList.length / 2);
  const termsCol1 = termsList.slice(0, half);
  const termsCol2 = termsList.slice(half);

  // Clean Order Number (e.g. 183, 102, 202, 001)
  const orderNumber = (() => {
    if (estimate.site_ref) {
      const m = String(estimate.site_ref).match(/\d+/);
      if (m) {
        const num = parseInt(m[0], 10);
        return num < 1000 ? String(num).padStart(3, '0') : String(num);
      }
      return String(estimate.site_ref).replace(/^SITE-/i, '');
    }
    if (estimate.order_no) {
      const m = String(estimate.order_no).match(/\d+/);
      if (m) {
        const num = parseInt(m[0], 10);
        return num < 1000 ? String(num).padStart(3, '0') : String(num);
      }
      return String(estimate.order_no);
    }
    const m = String(estimate.estimate_number || '').match(/\d+$/);
    if (m) {
      const num = parseInt(m[0], 10);
      return num < 1000 ? String(num).padStart(3, '0') : String(num);
    }
    return estimate.estimate_number || '001';
  })();

  // Sanitize illegal Windows filename characters: \ / : * ? " < > |
  const sanitize = (str) => String(str || '').replace(/[\\/:*?"<>|]/g, '').trim();

  // 1. Order Number
  const cleanOrder = sanitize(orderNumber);

  // 2. Customer Name
  const cleanCustomer = sanitize(estimate.customer_name || 'Client');

  // 3. Reference Name (from site location, site name, address society, or site_ref)
  const cleanRef = sanitize(
    estimate.site_location ||
    estimate.location ||
    estimate.site_name ||
    (estimate.address ? estimate.address.split(',')[0].trim() : '') ||
    (estimate.site_ref ? String(estimate.site_ref).replace(/^SITE-/i, '') : '') ||
    ''
  );

  // 4. Date formatted as DD-MM-YYYY (safe for file names)
  const fileDate = (() => {
    const d = estimate.date ? new Date(estimate.date) : new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  })();

  // Format: order number - name - refrance name - date
  const pdfFileName = [cleanOrder, cleanCustomer, cleanRef, fileDate]
    .filter(Boolean)
    .join(' - ');

  useEffect(() => {
    document.body.classList.add('estimate-preview-modal-open');
    const originalTitle = document.title;
    if (pdfFileName) {
      document.title = pdfFileName;
    }
    return () => {
      document.body.classList.remove('estimate-preview-modal-open');
      document.title = originalTitle;
    };
  }, [pdfFileName]);

  const handleDownloadPreview = () => {
    if (pdfFileName) {
      document.title = pdfFileName;
    }
    // Opens native browser Print / Save as PDF preview dialog with full multi-page layout
    printEstimateSheet();
  };

  const handleDownloadPdf = async () => {
    if (printSheetRef.current) {
      const filename = `${pdfFileName}.pdf`;
      await downloadEstimatePdf(printSheetRef.current, filename);
    }
  };

  return (
    <div className="estimate-modal-overlay estimate-preview-modal-overlay">
      <div className="estimate-modal modal-large estimate-preview-modal-card">
        <div className="estimate-modal-header no-print">
          <h2>
            <i className="fa-solid fa-file-invoice" style={{ color: '#4A2C17' }}></i>
            Estimate Preview: Order #{orderNumber}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="btn-create-estimate"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#4A2C17',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onClick={handleDownloadPreview}
              title="Download / Save as PDF (opens preview to download)"
            >
              <i className="fa-solid fa-download"></i>
            </button>
            <button
              className="btn-create-estimate"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: '15px',
                background: '#2E7D32',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onClick={() => onShare(estimate)}
              title="Send to Client (WhatsApp)"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </button>
            <button
              className="btn-action-icon"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: '14px',
                background: '#FAF8F5',
                border: '1px solid #DCD4CA',
                color: '#4A2C17',
                cursor: 'pointer'
              }}
              onClick={printEstimateSheet}
              title="Print Sheet"
            >
              <i className="fa-solid fa-print"></i>
            </button>
            <button
              className="modal-close-btn"
              style={{
                width: '36px',
                height: '36px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                fontSize: '18px',
                cursor: 'pointer'
              }}
              onClick={onClose}
              title="Close"
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <div className="estimate-modal-body estimate-preview-body">
          {/* Exact Excel Format Printable Sheet */}
          <div ref={printSheetRef} className="estimate-printable-sheet">
            {/* Header Brand with Logo on Left and Customer Info on Right */}
            <div className="print-brand-header">
              <div className="print-logo-box">
                <img
                  src={modernLogo}
                  alt="Modern Interior"
                  style={{ height: '58px', objectFit: 'contain' }}
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                />
              </div>

              {/* Customer & Order Details Box Pattern */}
              <div className="print-customer-box-card">
                <table className="print-customer-box-table">
                  <tbody>
                    <tr>
                      <td className="box-field" style={{ width: '50%' }}>
                        <span className="box-field-label">ORDER NO:</span>
                        <span className="box-field-value order-highlight">{orderNumber}</span>
                      </td>
                      <td className="box-field" style={{ width: '50%' }}>
                        <span className="box-field-label">DATE:</span>
                        <span className="box-field-value">{formattedDate}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="box-field">
                        <span className="box-field-label">CUSTOMER:</span>
                        <span className="box-field-value">{estimate.customer_name?.toUpperCase()}</span>
                      </td>
                      <td className="box-field">
                        <span className="box-field-label">MOBILE:</span>
                        <span className="box-field-value">{estimate.phone || '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="box-field" colSpan="2">
                        <span className="box-field-label">ADDRESS:</span>
                        <span className="box-field-value">{estimate.address || '-'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Room-wise Tables (Matching Excel) */}
            {rooms.map((room, rIdx) => (
              <table key={rIdx} className="print-room-table">
                <thead className="print-room-thead" style={{ display: 'table-row-group' }}>
                  <tr className="print-room-title-row">
                    <td colSpan="8" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {room.roomName}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ width: '22%' }}>PRODUCT NAME</th>
                    <th style={{ width: '30%' }}>DISCRIPTION</th>
                    <th style={{ width: '9%', textAlign: 'center' }}>WIDTH (MM)</th>
                    <th style={{ width: '9%', textAlign: 'center' }}>HEIGHT (MM)</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>TOTAL AREA</th>
                    <th style={{ width: '7%', textAlign: 'center' }}>UNIT</th>
                    <th style={{ width: '7%', textAlign: 'right' }}>RATE</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {(room.items || []).map((it, iIdx) => (
                    <tr key={iIdx}>
                      <td style={{ fontWeight: '600' }}>{it.productName}</td>
                      <td style={{ fontSize: '10px', color: '#444' }}>{it.description}</td>
                      <td style={{ textAlign: 'center' }}>{it.widthMm || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{it.heightMm || '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: '600' }}>{it.totalArea ?? '-'}</td>
                      <td style={{ textAlign: 'center' }}>{it.unit || 'Sq.Ft.'}</td>
                      <td style={{ textAlign: 'right' }}>₹{(Number(it.rate) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700' }}>
                        ₹{(Number(it.amount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="print-room-total-row">
                    <td colSpan="6" style={{ textAlign: 'right', fontWeight: '700' }}>
                      {room.roomName} TOTAL:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '700', color: '#4A2C17' }}>
                      ₹{(Number(room.roomTotal) || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}

            {/* Totals Summary Table - Full Width matching tables above */}
            <table className="print-room-table print-summary-table" style={{ width: '100%', marginBottom: '20px' }}>
              <tbody>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '700', padding: '8px 16px', background: '#FAF8F5' }}>
                    SUB TOTAL:
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '700', padding: '8px 12px', background: '#FAF8F5', color: '#2B2520' }}>
                    ₹{Number(estimate.sub_total || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '600', padding: '8px 16px', background: '#FFFFFF' }}>
                    DESIGNING AND CONSULTING FEE ({estimate.design_fee_pct || 10}%):
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '600', padding: '8px 12px', background: '#FFFFFF' }}>
                    ₹{Number(estimate.design_fee_amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                {Number(estimate.gst_pct) > 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'left', fontWeight: '600', padding: '8px 16px', background: '#FAF8F5' }}>
                      GST {estimate.gst_pct}% EXTRA:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '600', padding: '8px 12px', background: '#FAF8F5' }}>
                      ₹{Number(estimate.gst_amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                {Number(estimate.round_off) > 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'left', fontWeight: '600', padding: '8px 16px', background: '#FFFFFF' }}>
                      ROUND OFF / DISCOUNT:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '600', padding: '8px 12px', background: '#FFFFFF' }}>
                      - ₹{Number(estimate.round_off).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className="print-grand-total-row">
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '800', fontSize: '13px', background: '#4A2C17', color: '#FFFFFF', padding: '10px 16px', border: '1px solid #4A2C17' }}>
                    FINAL TOTAL:
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', fontSize: '14px', background: '#4A2C17', color: '#FFFFFF', padding: '10px 12px', border: '1px solid #4A2C17' }}>
                    ₹{Number(estimate.final_total || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Note from Excel */}
            {estimate.notes && (
              <div className="print-note-section" style={{ fontSize: '11px', fontWeight: '600', color: '#4A2C17', marginBottom: '14px', background: '#F8F5F1', padding: '8px 12px', borderRadius: '4px' }}>
                {estimate.notes}
              </div>
            )}

            {/* 1. Terms & Conditions: 4 & 4 split across left and right */}
            <div className="print-terms-section">
              <h5 className="print-section-h5">
                Terms & Conditions:
              </h5>
              <div className="print-terms-grid">
                <div className="print-terms-col">
                  {termsCol1.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
                <div className="print-terms-col">
                  {termsCol2.map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* UNBREAKABLE CLOSING BLOCK:
                Bank Details + Payment Terms + Signatures stay together.
                If they don't fit at the page bottom, they push cleanly to the next page. */}
            <div className="print-closing-block">
              {/* 2. Bank Details at 1 side and Mode of Payment at 1 side */}
              <div className="print-payment-section">
                {/* Bank Account Details */}
                <div className="print-payment-col">
                  <h5 className="print-section-h5">
                    Bank Account Details for Payment:
                  </h5>
                  <div className="print-bank-card">
                    <div><strong>Account Name:</strong> {bank.accountName || 'MODERN INTERIOR'}</div>
                    <div style={{ marginTop: '2px' }}><strong>Bank Name:</strong> {bank.bankName || 'HDFC BANK'}</div>
                    <div style={{ marginTop: '2px' }}><strong>Account No:</strong> {bank.accountNo || '50200088923412'}</div>
                    <div style={{ marginTop: '2px' }}><strong>IFSC Code:</strong> {bank.ifscCode || 'HDFC0001824'}</div>
                    <div style={{ marginTop: '2px' }}><strong>GST No:</strong> {bank.gstNo || '27AAOFM1234F1Z8'}</div>
                  </div>
                </div>

                {/* Mode of Payment */}
                <div className="print-payment-col">
                  <h5 className="print-section-h5">
                    Mode Of Payment:
                  </h5>
                  <div className="print-bank-card">
                    <pre style={{ margin: 0, fontFamily: 'inherit', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                      {estimate.payment_terms}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 3. Below that: Signatures */}
              <div className="print-signature-section">
                <div className="print-sig-col">
                  <div className="print-sig-line">
                    Customer Sign
                  </div>
                </div>
                <div className="print-sig-col">
                  <div className="print-sig-line">
                    For Modern Interior
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstimatePreviewModal;
