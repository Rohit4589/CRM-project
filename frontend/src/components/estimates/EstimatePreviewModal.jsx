import React, { useRef, useEffect } from 'react';
import modernLogo from '../../assets/logo.png';
import scannerImg from '../../assets/scanner.jpg';
import { getMaterialSpecsForCollection } from '../../data/collectionSpecs';
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
  const isOldHdfc = !bank.bankName || bank.bankName === 'HDFC BANK' || bank.bankName === 'HDFC Bank';
  const bankName = isOldHdfc ? 'IndusInd Bank' : bank.bankName;
  const accountName = isOldHdfc ? 'Modern Interior' : (bank.accountName || 'Modern Interior');
  const accountNo = isOldHdfc ? '251000000789' : (bank.accountNo || '251000000789');
  const branch = bank.branch || 'Katraj Pune';
  const ifscCode = isOldHdfc ? 'INDB0001665' : (bank.ifscCode || 'INDB0001665');
  const accountType = bank.accountType || 'Current A/C';
  const gpay = bank.gpay || '9552527801';
  const gstNo = (bank.gstNo && bank.gstNo !== '27AAOFM1234F1Z8') ? bank.gstNo : '27BIPPS2002G1ZA';
  const formattedDate = estimate.date
    ? new Date(estimate.date).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  // Resolve collection-wise Material Specifications
  const resolveCollectionTier = (tier, level) => {
    const raw = String(tier || level || '').trim();
    if (raw === 'Modern' || raw.toLowerCase().includes('essential')) {
      return 'Essential Collection';
    }
    if (raw === 'Luxury' || raw.toLowerCase().includes('elite')) {
      return 'Elite Collection';
    }
    return 'Signature Collection';
  };

  const activeTier = resolveCollectionTier(estimate.collection_tier, estimate.furniture_level);
  const materialSpecs = getMaterialSpecsForCollection(activeTier);

  // Parse Terms & Conditions into structured clauses
  const parseTerms = (text) => {
    let cleanText = (text || '').trim();
    if (!cleanText || cleanText.includes('Laminate Used In Medium Range')) {
      cleanText = `1. Taxes & Additional Charges\nGST @ 18%, transportation, loading/unloading and applicable local charges (including Mathadi) shall be charged extra at actuals.\n\n2. Maintenance & Service\nComplimentary maintenance for 12 months from work completion, covering workmanship-related issues only. Physical damage, misuse, water damage and normal wear and tear are excluded. Thereafter, service charges shall apply at actuals. Hardware and accessories are subject to their respective manufacturers' warranties.\n\n3. Estimation & Price Variation\nThis quotation is based on approximate measurements and specified materials. Final billing may vary by ±5–10% depending on actual site measurements, material requirements and work executed.\n\n4. Quotation Validity & Price Revision\nThis quotation is valid for 7 days from the date of issue. Prices are subject to revision after the validity period due to fluctuations in market rates, material costs or other applicable charges. Revised rates shall be confirmed before order acceptance.`;
    }

    const blocks = cleanText
      .split(/\n\s*\n/)
      .map(b => b.trim())
      .filter(Boolean);

    if (blocks.length > 1) {
      return blocks.map(block => {
        const lines = block.split('\n').map(l => l.trim().replace(/^\*+|\*+$/g, '')).filter(Boolean);
        if (lines.length >= 2 && /^(\d+[\.\)]|\*+\d+)/.test(lines[0])) {
          return { title: lines[0], desc: lines.slice(1).join(' ') };
        } else if (lines.length === 1 && /^(\d+[\.\)]\s*[^:]+):\s*(.+)$/.test(lines[0])) {
          const m = lines[0].match(/^(\d+[\.\)]\s*[^:]+):\s*(.+)$/);
          return { title: m[1], desc: m[2] };
        } else {
          return { title: '', desc: lines.join(' ') };
        }
      });
    }

    const lines = cleanText.split('\n').map(l => l.trim().replace(/^\*+|\*+$/g, '')).filter(Boolean);
    return lines.map(line => ({ title: '', desc: line }));
  };

  const termsClauses = parseTerms(estimate.terms_conditions);
  const half = Math.ceil(termsClauses.length / 2);
  const termsCol1 = termsClauses.slice(0, half);
  const termsCol2 = termsClauses.slice(half);

  // Parse Payment Terms into structured list
  const paymentTermsList = (estimate.payment_terms || '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, idx) => {
      const m = line.match(/^(\d+[\)\.]|\*+\d+[\)\.]\*?)\s*(.+)$/);
      if (m) {
        return { num: m[1].replace(/\*/g, ''), text: m[2].replace(/\*/g, '') };
      }
      return { num: `${idx + 1})`, text: line.replace(/\*/g, '') };
    });

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
            {/* Unified Creative Estimate Header matching Cardboard Sketch */}
            <div className="print-unified-header">
              {/* 1. Logo Section */}
              <div className="print-unified-col print-col-logo">
                <img
                  src={modernLogo}
                  alt="Modern Interior"
                  onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                />
              </div>

              {/* 2. Company GST & Address Section */}
              <div className="print-unified-col print-col-company">
                <div className="print-company-gst">
                  <strong>GSTIN:</strong> <span>27BIPPS2002G1ZA</span>
                </div>
                <div className="print-company-address">
                  <strong>Registered Address:</strong><br />
                  Sr. No. 5/3/3, Pawar Nagar, Gujarwadi Road, Katraj, Pune, Maharashtra – 411046.
                </div>
              </div>

              {/* 3. Customer & Order Details (2x3 Grid matching Sketch) */}
              <div className="print-unified-col print-col-details">
                <table className="print-details-table">
                  <tbody>
                    <tr>
                      <td>
                        <span className="print-field-label">ORDER NO:</span>
                        <span className="print-field-value highlight-order">{orderNumber}</span>
                      </td>
                      <td>
                        <span className="print-field-label">DATE:</span>
                        <span className="print-field-value">{formattedDate}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="print-field-label">CUSTOMER:</span>
                        <span className="print-field-value">{estimate.customer_name?.toUpperCase() || '-'}</span>
                      </td>
                      <td>
                        <span className="print-field-label">REF NAME:</span>
                        <span className="print-field-value">{estimate.reference_name || cleanRef || '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="print-field-label">MOBILE:</span>
                        <span className="print-field-value">{estimate.phone || '-'}</span>
                      </td>
                      <td>
                        <span className="print-field-label">ADDRESS:</span>
                        <span className="print-field-value">{estimate.address || '-'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Package Vertical Accent Strip */}
              <div className="print-unified-col print-col-package">
                <div className="print-pkg-title">
                  {activeTier}
                </div>
                <div
                  className="print-pkg-subtitle"
                  style={{
                    fontSize: '7px',
                    fontWeight: '600',
                    color: '#E8D5C4',
                    letterSpacing: '0.2px',
                    lineHeight: '1.2',
                    marginTop: '4px',
                    paddingTop: '3px',
                    borderTop: '1px solid rgba(232, 213, 196, 0.4)',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  Furniture &amp; Interior Quotation
                </div>
              </div>
            </div>

            {/* Room-wise Tables (Matching Excel) */}
            {rooms.map((room, rIdx) => (
              <table key={rIdx} className="print-room-table">
                <thead className="print-room-thead" style={{ display: 'table-row-group' }}>
                  <tr className="print-room-title-row">
                    <td colSpan="8" style={{ textAlign: 'left', paddingLeft: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {room.roomName}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ width: '22%', textAlign: 'left' }}>PRODUCT NAME</th>
                    <th style={{ width: '30%', textAlign: 'center' }}>DISCRIPTION</th>
                    <th style={{ width: '9%', textAlign: 'center' }}>WIDTH</th>
                    <th style={{ width: '9%', textAlign: 'center' }}>HEIGHT</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>AREA</th>
                    <th style={{ width: '7%', textAlign: 'center' }}>UNIT</th>
                    <th style={{ width: '7%', textAlign: 'center' }}>RATE</th>
                    <th style={{ width: '8%', textAlign: 'right' }}>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {(room.items || []).map((it, iIdx) => (
                    <tr key={iIdx}>
                      <td style={{ textAlign: 'left', fontWeight: '700', color: '#000000' }}>{it.productName}</td>
                      <td style={{ fontSize: '10.5px', color: '#000000', fontWeight: '600', textAlign: 'center' }}>{it.description}</td>
                      <td style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}>{it.widthMm || '-'}</td>
                      <td style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}>{it.heightMm || '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: '700', color: '#000000' }}>{it.totalArea ?? '-'}</td>
                      <td style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}>{it.unit || 'Sq.Ft.'}</td>
                      <td style={{ textAlign: 'center', color: '#000000', fontWeight: '600' }}>₹{(Number(it.rate) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: '800', color: '#000000' }}>
                        ₹{(Number(it.amount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="print-room-total-row">
                    <td colSpan="6" style={{ textAlign: 'right', fontWeight: '700', color: '#000000' }}>
                      {room.roomName} TOTAL:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', color: '#000000' }}>
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
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '700', padding: '8px 16px', background: '#FAF8F5', color: '#000000' }}>
                    SUB TOTAL:
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', padding: '8px 12px', background: '#FAF8F5', color: '#000000' }}>
                    ₹{Number(estimate.sub_total || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '700', padding: '8px 16px', background: '#FFFFFF', color: '#000000' }}>
                    DESIGNING AND CONSULTING FEE ({estimate.design_fee_pct || 10}%):
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', padding: '8px 12px', background: '#FFFFFF', color: '#000000' }}>
                    ₹{Number(estimate.design_fee_amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                {Number(estimate.gst_pct) > 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'left', fontWeight: '700', padding: '8px 16px', background: '#FAF8F5', color: '#000000' }}>
                      GST {estimate.gst_pct}% EXTRA:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', padding: '8px 12px', background: '#FAF8F5', color: '#000000' }}>
                      ₹{Number(estimate.gst_amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                {Number(estimate.round_off) > 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'left', fontWeight: '700', padding: '8px 16px', background: '#FFFFFF', color: '#000000' }}>
                      ROUND OFF / DISCOUNT:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', padding: '8px 12px', background: '#FFFFFF', color: '#000000' }}>
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

            {/* Side-by-side 50/50 Section: Material Specifications (Left) & Terms & Conditions (Right) */}
            {/* 1. Dedicated Header Row (Both titles aligned to the same horizontal line) */}
            <div className="print-specs-terms-header-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '6px', width: '100%', alignItems: 'end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <h5 className="print-section-h5" style={{ color: '#000000', fontWeight: '800', fontSize: '12px', margin: 0, lineHeight: '1.35', letterSpacing: '0.2px' }}>
                  {materialSpecs ? materialSpecs.title : 'Material Specifications'}:
                </h5>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <h5 className="print-section-h5" style={{ color: '#000000', fontWeight: '800', fontSize: '12px', margin: 0, lineHeight: '1.35', letterSpacing: '0.2px' }}>
                  Terms &amp; Conditions:
                </h5>
              </div>
            </div>

            {/* 2. Dedicated Cards Row (Both cards start at the exact same level & end at the exact same level) */}
            <div className="print-specs-terms-cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%', alignItems: 'stretch' }}>
              {/* Left Card: Material Specifications */}
              <div
                className="print-bank-card print-specs-card"
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #DCD4CA',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '10px',
                  color: '#000000',
                  lineHeight: '1.45',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%'
                }}
              >
                {materialSpecs && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {materialSpecs.items.map((it, idx) => (
                      <div key={idx}>
                        <strong style={{ color: '#000000', fontWeight: '800' }}>{it.label} </strong>
                        <span style={{ color: '#000000', fontWeight: '600' }}>{it.text}</span>
                      </div>
                    ))}

                    {materialSpecs.note && (
                      <div style={{ marginTop: '5px', paddingTop: '5px', borderTop: '1px dashed #DCD4CA' }}>
                        <strong style={{ color: '#000000', fontWeight: '800' }}>Exclusions: </strong>
                        <span style={{ color: '#000000', fontWeight: '600' }}>{materialSpecs.note}</span>
                      </div>
                    )}

                    {materialSpecs.additionalCharges && (
                      <div style={{ marginTop: '3px' }}>
                        <strong style={{ color: '#000000', fontWeight: '800' }}>Note / Additional Charges: </strong>
                        <span style={{ color: '#000000', fontWeight: '600' }}>{materialSpecs.additionalCharges}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right Card: Terms & Conditions */}
              <div
                className="print-bank-card print-terms-card"
                style={{
                  background: '#FAF8F5',
                  border: '1px solid #DCD4CA',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  fontSize: '10px',
                  color: '#000000',
                  lineHeight: '1.45',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {termsClauses.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: idx < termsClauses.length - 1 ? '3px' : '0' }}>
                      {item.title && (
                        <div style={{ color: '#000000', fontWeight: '800', fontSize: '10.5px', marginBottom: '1px' }}>
                          {item.title}
                        </div>
                      )}
                      <div style={{ color: '#000000', fontWeight: '600' }}>
                        {item.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* UNBREAKABLE CLOSING BLOCK:
                Bank Details + Payment Terms + Signatures stay together.
                If they don't fit at the page bottom, they push cleanly to the next page. */}
            <div className="print-closing-block">
              {/* 1. Header Row for Bank Details & Mode of Payment (Aligned Baseline) */}
              <div className="print-payment-header-row" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px', marginBottom: '6px', width: '100%', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #E5D9C5', alignItems: 'end' }}>
                <div>
                  <h5 className="print-section-h5" style={{ color: '#000000', fontWeight: '800', fontSize: '12px', margin: 0, lineHeight: '1.35', letterSpacing: '0.2px' }}>
                    Bank Account Details for Payment:
                  </h5>
                </div>
                <div>
                  <h5 className="print-section-h5" style={{ color: '#000000', fontWeight: '800', fontSize: '12px', margin: 0, lineHeight: '1.35', letterSpacing: '0.2px' }}>
                    Mode Of Payment:
                  </h5>
                </div>
              </div>

              {/* 2. Cards Row (Both cards start at the same level & end at the same level) */}
              <div className="print-payment-cards-row" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px', width: '100%', alignItems: 'stretch' }}>
                {/* Bank Account Details Card */}
                <div
                  className="print-bank-card print-bank-details-card"
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid #DCD4CA',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    color: '#000000',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 8px', flex: 1, minWidth: 0, fontSize: '10.5px', lineHeight: '1.45' }}>
                      {/* First 4 lines */}
                      <div>
                        <div><strong style={{ color: '#000000', fontWeight: '800' }}>Bank Name:</strong> {bankName}</div>
                        <div style={{ marginTop: '3px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Account Name:</strong> {accountName}</div>
                        <div style={{ marginTop: '3px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Account No.:</strong> {accountNo}</div>
                        <div style={{ marginTop: '3px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Branch:</strong> {branch}</div>
                      </div>

                      {/* Next 4 lines */}
                      <div>
                        <div><strong style={{ color: '#000000', fontWeight: '800' }}>IFSC Code:</strong> {ifscCode}</div>
                        <div style={{ marginTop: '3px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Account Type:</strong> {accountType}</div>
                        <div style={{ marginTop: '3px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>G-Pay:</strong> {gpay}</div>
                        <div style={{ marginTop: '3px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>GSTIN:</strong> {gstNo}</div>
                      </div>
                    </div>

                    {/* Clean UPI QR Scanner (No Overlap) */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flexShrink: 0,
                        textAlign: 'center',
                        padding: '4px',
                        background: '#FFFFFF',
                        border: '1.5px solid #000000',
                        borderRadius: '6px'
                      }}
                    >
                      <img
                        src={scannerImg}
                        alt="UPI QR Scanner"
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.currentTarget.src = '/scanner.jpg';
                        }}
                      />
                      <span
                        style={{
                          fontSize: '8px',
                          fontWeight: '800',
                          color: '#000000',
                          marginTop: '2px',
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase'
                        }}
                      >
                        Scan &amp; Pay (UPI)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mode of Payment Card */}
                <div
                  className="print-bank-card print-payment-terms-card"
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid #DCD4CA',
                    borderRadius: '6px',
                    padding: '9px 12px',
                    color: '#000000',
                    fontWeight: '600',
                    boxSizing: 'border-box',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px', lineHeight: '1.5' }}>
                    {paymentTermsList.map((term, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <span style={{ color: '#000000', fontWeight: '800', flexShrink: 0 }}>
                          {term.num}
                        </span>
                        <span style={{ color: '#000000', fontWeight: '600' }}>
                          {term.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Below that: Signatures */}
              <div className="print-signature-section" style={{ paddingTop: '38px', marginTop: '16px' }}>
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
