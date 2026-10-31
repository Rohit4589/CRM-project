import React, { useRef, useEffect, useState } from 'react';
import { API_BASE } from '../../config/api';
import modernLogo from '../../assets/logo.png';
import LOGO_BASE64 from '../../assets/logoDataUri';
import scannerImg from '../../assets/scanner.jpg';
import SCANNER_QR_BASE64 from '../../assets/scannerDataUri';
import { getMaterialSpecsForCollection } from '../../data/collectionSpecs';
import { downloadEstimatePdf, printEstimateSheet, shareEstimatePdfOnWhatsApp } from '../../utils/estimatePdfGenerator';
import { toTitleCase } from '../../utils/autoCapitalize';

const EstimatePreviewModal = ({
  estimate,
  onClose,
  onShare
}) => {
  const printSheetRef = useRef(null);
  const [isSharingWp, setIsSharingWp] = useState(false);
  const [shareToast, setShareToast] = useState('');

  const handleSharePdfWhatsApp = async () => {
    if (isSharingWp) return;
    if (!printSheetRef.current) return;

    try {
      setIsSharingWp(true);
      const filename = `${pdfFileName}.pdf`;
      const res = await shareEstimatePdfOnWhatsApp(printSheetRef.current, filename);

      if (estimate?.id) {
        fetch(`${API_BASE}/estimates/${estimate.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: 'whatsapp' })
        }).catch(() => {});
      }

      if (res && res.method === 'download_fallback') {
        setShareToast('PDF downloaded! Drag & drop it into the WhatsApp chat to send.');
        setTimeout(() => setShareToast(''), 7000);
      }
    } catch (err) {
      console.error('Error sharing estimate on WhatsApp:', err);
    } finally {
      setIsSharingWp(false);
    }
  };

  // Close preview modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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
  const materialSpecs = (() => {
    if (estimate.material_specs) {
      if (typeof estimate.material_specs === 'string') {
        try {
          return JSON.parse(estimate.material_specs);
        } catch (e) {}
      } else if (typeof estimate.material_specs === 'object') {
        return estimate.material_specs;
      }
    }
    return getMaterialSpecsForCollection(activeTier);
  })();

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
    const estNum = String(estimate.estimate_number || '').trim();
    if (estNum) {
      // Split off revision suffix (e.g. 187-03 -> base order 187)
      const basePart = estNum.split('-')[0];
      const m = basePart.match(/\d+/);
      if (m) {
        const num = parseInt(m[0], 10);
        return num < 1000 ? String(num).padStart(3, '0') : String(num);
      }
      return basePart;
    }
    return '001';
  })();

  // Sanitize illegal Windows filename characters: \ / : * ? " < > |
  const sanitize = (str) => String(str || '').replace(/[\\/:*?"<>|]/g, '').trim();

  // 1. Order Number
  const cleanOrder = sanitize(orderNumber);

  // 2. Customer Name
  const cleanCustomer = sanitize(estimate.customer_name || 'Client');

  // 3. Reference Name (from explicit reference_name, site location, or site name)
  const cleanRef = sanitize(
    estimate.reference_name ||
    estimate.site_location ||
    estimate.location ||
    estimate.site_name ||
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
        {shareToast && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            background: '#065F46',
            color: '#FFFFFF',
            padding: '11px 20px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 99999
          }}>
            <i className="fa-solid fa-circle-check" style={{ color: '#A7F3D0', fontSize: '16px' }}></i>
            <span>{shareToast}</span>
          </div>
        )}
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
                cursor: isSharingWp ? 'wait' : 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                opacity: isSharingWp ? 0.75 : 1
              }}
              onClick={handleSharePdfWhatsApp}
              disabled={isSharingWp}
              title={isSharingWp ? "Preparing PDF Document..." : "Send PDF via WhatsApp"}
            >
              {isSharingWp ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-brands fa-whatsapp"></i>
              )}
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
              {/* Left Brand Block: Top Row (Logo + GST/Address) + Bottom Banner (Collection Name spanning across both) */}
              <div className="print-header-brand-block">
                <div className="print-brand-top-row">
                  {/* Box 1: Logo */}
                  <div className="print-col-logo-box">
                    <img
                      src={LOGO_BASE64 || modernLogo}
                      alt="Modern Interior"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = LOGO_BASE64 || '/logo.png';
                      }}
                    />
                  </div>

                  {/* Box 2: Company GST & Address */}
                  <div className="print-col-company-box">
                    <div className="print-company-gst">
                      <strong>GSTIN:</strong> <span>27BIPPS2002G1ZA</span>
                    </div>
                    <div className="print-company-address">
                      <strong>Registered Address:</strong><br />
                      Sr. No. 5/3/3, Pawar Nagar, Gujarwadi Road, Katraj, Pune, Maharashtra – 411046.
                    </div>
                  </div>
                </div>

                {/* Collection Name Banner Spanning Across Both Logo and Company Details */}
                <div className="print-col-pkg-bottom">
                  <div className="print-pkg-title">
                    {activeTier}
                  </div>
                  <div className="print-pkg-subtitle">
                    Furniture &amp; Interior Quotation
                  </div>
                </div>
              </div>

              {/* 3. Customer & Order Details (Expanded across remaining space) */}
              <div className="print-unified-col print-col-details">
                <table className="print-details-table">
                  <tbody>
                    <tr>
                      <td>
                        <span className="print-field-label">Order No:</span>
                        <span className="print-field-value highlight-order">{orderNumber}</span>
                      </td>
                      <td>
                        <span className="print-field-label">Date:</span>
                        <span className="print-field-value">{formattedDate}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="print-field-label">Customer:</span>
                        <span className="print-field-value">{toTitleCase(estimate.customer_name) || '-'}</span>
                      </td>
                      <td>
                        <span className="print-field-label">Ref Name:</span>
                        <span className="print-field-value">{toTitleCase(estimate.reference_name || cleanRef) || '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <span className="print-field-label">Mobile:</span>
                        <span className="print-field-value">{estimate.phone || '-'}</span>
                      </td>
                      <td>
                        <span className="print-field-label">Address:</span>
                        <span className="print-field-value">{toTitleCase(estimate.address) || '-'}</span>
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
                    <td colSpan="8" style={{ textAlign: 'left', paddingLeft: '10px', letterSpacing: '0.5px', color: '#4A2C17', fontWeight: '800', fontSize: '12px' }}>
                      {toTitleCase(room.roomName)}
                    </td>
                  </tr>
                  <tr>
                    <th style={{ width: '18%', textAlign: 'left' }}>Product Name</th>
                    <th style={{ width: '38%', textAlign: 'center' }}>Description</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Width</th>
                    <th style={{ width: '8%', textAlign: 'center' }}>Height</th>
                    <th style={{ width: '7%', textAlign: 'center' }}>Area</th>
                    <th style={{ width: '7%', textAlign: 'center' }}>Unit</th>
                    <th style={{ width: '7%', textAlign: 'center' }}>Rate</th>
                    <th style={{ width: '7%', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(room.items || []).map((it, iIdx) => (
                    <tr key={iIdx}>
                      <td style={{ textAlign: 'left', fontWeight: '700', color: '#111827', wordBreak: 'normal', overflowWrap: 'normal', whiteSpace: 'normal', lineHeight: '1.25' }}>{toTitleCase(it.productName)}</td>
                      <td style={{ fontSize: '10px', color: '#374151', fontWeight: '400', textAlign: 'center', lineHeight: '1.3', textTransform: 'capitalize' }}>{it.description}</td>
                      <td style={{ textAlign: 'center', color: '#4B5563', fontWeight: '400' }}>{it.widthMm || '-'}</td>
                      <td style={{ textAlign: 'center', color: '#4B5563', fontWeight: '400' }}>{it.heightMm || '-'}</td>
                      <td style={{ textAlign: 'center', fontWeight: '500', color: '#1F2937' }}>{it.totalArea ?? '-'}</td>
                      <td style={{ textAlign: 'center', color: '#4B5563', fontWeight: '400' }}>{it.unit || 'Sq.Ft.'}</td>
                      <td style={{ textAlign: 'center', color: '#374151', fontWeight: '500' }}>₹{(Number(it.rate) || 0).toLocaleString('en-IN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#111827' }}>
                        ₹{(Number(it.amount) || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  <tr className="print-room-total-row">
                    <td colSpan="6" style={{ textAlign: 'right', fontWeight: '800', color: '#4A2C17', padding: '9px 12px', verticalAlign: 'middle', letterSpacing: '0.4px', fontSize: '13.5px' }}>
                      <span style={{ fontSize: '13.5px', fontWeight: '800', color: '#4A2C17' }}>{toTitleCase(room.roomName)} Total:</span>
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '900', color: '#4A2C17', fontSize: '16px', padding: '9px 12px', verticalAlign: 'middle', letterSpacing: '0.3px' }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#4A2C17' }}>₹{(Number(room.roomTotal) || 0).toLocaleString('en-IN')}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            ))}

            {/* Totals Summary Table - Full Width matching tables above */}
            <table className="print-room-table print-summary-table" style={{ width: '100%', marginBottom: '20px' }}>
              <tbody>
                <tr className="print-sub-total-row">
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '800', fontSize: '14px', padding: '10px 16px', background: '#F5EBE1', color: '#4A2C17', letterSpacing: '0.4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '800', color: '#4A2C17' }}>Sub Total:</span>
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '900', fontSize: '17px', padding: '10px 12px', background: '#F5EBE1', color: '#4A2C17', letterSpacing: '0.3px' }}>
                    <span style={{ fontSize: '17px', fontWeight: '900', color: '#4A2C17' }}>₹{Number(estimate.sub_total || 0).toLocaleString('en-IN')}</span>
                  </td>
                </tr>
                <tr>
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '800', fontSize: '12px', padding: '8px 16px', background: '#FFFFFF', color: '#4A2C17' }}>
                    Designing And Consulting Fee ({Number(estimate.design_fee_pct ?? 10)}%):
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', fontSize: '13.5px', padding: '8px 12px', background: '#FFFFFF', color: '#4A2C17' }}>
                    ₹{Number(estimate.design_fee_amount || 0).toLocaleString('en-IN')}
                  </td>
                </tr>
                {Number(estimate.gst_pct) > 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'left', fontWeight: '800', fontSize: '12px', padding: '8px 16px', background: '#F5EBE1', color: '#4A2C17' }}>
                      GST {Number(estimate.gst_pct)}% EXTRA:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', fontSize: '13.5px', padding: '8px 12px', background: '#F5EBE1', color: '#4A2C17' }}>
                      ₹{Number(estimate.gst_amount || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                {Number(estimate.round_off) > 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'left', fontWeight: '800', fontSize: '12px', padding: '8px 16px', background: '#FFFFFF', color: '#4A2C17' }}>
                      Round Off / Discount:
                    </td>
                    <td colSpan="2" style={{ textAlign: 'right', fontWeight: '800', fontSize: '13.5px', padding: '8px 12px', background: '#FFFFFF', color: '#4A2C17' }}>
                      - ₹{Number(estimate.round_off).toLocaleString('en-IN')}
                    </td>
                  </tr>
                )}
                <tr className="print-grand-total-row">
                  <td colSpan="6" style={{ textAlign: 'left', fontWeight: '900', fontSize: '15px', background: '#4A2C17', color: '#FFFFFF', padding: '11px 16px', border: '1px solid #4A2C17', letterSpacing: '0.6px' }}>
                    <span style={{ color: '#FFFFFF', fontWeight: '900', fontSize: '15px' }}>Final Total:</span>
                  </td>
                  <td colSpan="2" style={{ textAlign: 'right', fontWeight: '900', fontSize: '18px', background: '#4A2C17', color: '#FFFFFF', padding: '11px 12px', border: '1px solid #4A2C17', letterSpacing: '0.4px' }}>
                    <span style={{ color: '#FFFFFF', fontWeight: '900', fontSize: '18px' }}>₹{Number(estimate.final_total || 0).toLocaleString('en-IN')}</span>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Material Specifications & Terms & Conditions Section (Conditional on include_material_specs) */}
            {estimate.include_material_specs !== false ? (
              <>
                {/* 1. Dedicated Header Row (Both titles aligned to the same horizontal line) */}
                <div className="print-specs-terms-header-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '6px', width: '100%', alignItems: 'end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <h5 className="print-section-h5" style={{ color: '#4A2C17', fontWeight: '800', fontSize: '12px', margin: 0, lineHeight: '1.35', letterSpacing: '0.2px' }}>
                      {materialSpecs ? materialSpecs.title : 'Material Specifications'}:
                    </h5>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <h5 className="print-section-h5" style={{ color: '#4A2C17', fontWeight: '800', fontSize: '12px', margin: 0, lineHeight: '1.35', letterSpacing: '0.2px' }}>
                      Terms &amp; Conditions:
                    </h5>
                  </div>
                </div>

                {/* 2. Dedicated Cards Row (50/50 side-by-side) */}
                <div className="print-specs-terms-cards-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', width: '100%', alignItems: 'stretch' }}>
                  {/* Left Card: Material Specifications */}
                  <div
                    className="print-bank-card print-specs-card"
                    style={{
                      background: '#FAF8F5',
                      border: '1px solid #DCD4CA',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      fontSize: '10px',
                      color: '#000000',
                      lineHeight: '1.28',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%'
                    }}
                  >
                    {materialSpecs && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {materialSpecs.items.map((it, idx) => (
                          <div key={idx} style={{ lineHeight: '1.28' }}>
                            <strong style={{ color: '#000000', fontWeight: '800' }}>{it.label} </strong>
                            <span style={{ color: '#000000', fontWeight: '600' }}>{it.text}</span>
                          </div>
                        ))}

                        {materialSpecs.note && (
                          <div style={{ marginTop: '3px', paddingTop: '3px', borderTop: '1px dashed #DCD4CA', lineHeight: '1.28' }}>
                            <strong style={{ color: '#000000', fontWeight: '800' }}>Exclusions: </strong>
                            <span style={{ color: '#000000', fontWeight: '600' }}>{materialSpecs.note}</span>
                          </div>
                        )}

                        {materialSpecs.additionalCharges && (
                          <div style={{ marginTop: '2px', lineHeight: '1.28' }}>
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
                      padding: '8px 10px',
                      fontSize: '10px',
                      color: '#000000',
                      lineHeight: '1.28',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5px' }}>
                      {termsClauses.map((item, idx) => (
                        <div key={idx} style={{ marginBottom: '0px', lineHeight: '1.28' }}>
                          {item.title && (
                            <div style={{ color: '#000000', fontWeight: '800', fontSize: '10px', marginBottom: '1px', lineHeight: '1.25' }}>
                              {item.title}
                            </div>
                          )}
                          <div style={{ color: '#000000', fontWeight: '600', lineHeight: '1.28' }}>
                            {item.desc}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* When Material Specifications is OFF -> Terms & Conditions expands across the full width */
              <div style={{ width: '100%', marginTop: '6px' }}>
                <h5 className="print-section-h5" style={{ color: '#4A2C17', fontWeight: '800', fontSize: '12px', margin: '0 0 6px 0', lineHeight: '1.35', letterSpacing: '0.2px' }}>
                  Terms &amp; Conditions:
                </h5>
                <div
                  className="print-bank-card print-terms-card"
                  style={{
                    background: '#FAF8F5',
                    border: '1px solid #DCD4CA',
                    borderRadius: '6px',
                    padding: '10px 14px',
                    fontSize: '10px',
                    color: '#000000',
                    lineHeight: '1.32',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
                    {termsClauses.map((item, idx) => (
                      <div key={idx} style={{ marginBottom: '0px', lineHeight: '1.3' }}>
                        {item.title && (
                          <div style={{ color: '#000000', fontWeight: '800', fontSize: '10px', marginBottom: '2px', lineHeight: '1.25' }}>
                            {item.title}
                          </div>
                        )}
                        <div style={{ color: '#000000', fontWeight: '600', lineHeight: '1.3' }}>
                          {item.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* UNBREAKABLE CLOSING BLOCK:
                Bank Details + Payment Terms + Signatures stay together.
                If they don't fit at the page bottom, they push cleanly to the next page. */}
            <div className="print-closing-block">
              {/* 1. Header Row for Bank Details & Mode of Payment (Aligned Baseline) */}
              <div className="print-payment-header-row" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '14px', marginBottom: '6px', width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5D9C5', alignItems: 'end' }}>
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
                    padding: '8px 10px',
                    color: '#000000',
                    fontWeight: '600',
                    fontSize: '10px',
                    boxSizing: 'border-box',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px', flex: 1, minWidth: 0, fontSize: '10px', lineHeight: '1.28' }}>
                      {/* First 4 lines */}
                      <div>
                        <div><strong style={{ color: '#000000', fontWeight: '800' }}>Bank Name:</strong> {bankName}</div>
                        <div style={{ marginTop: '2px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Account Name:</strong> {accountName}</div>
                        <div style={{ marginTop: '2px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Account No.:</strong> {accountNo}</div>
                        <div style={{ marginTop: '2px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Branch:</strong> {branch}</div>
                      </div>

                      {/* Next lines */}
                      <div>
                        <div><strong style={{ color: '#000000', fontWeight: '800' }}>IFSC Code:</strong> {ifscCode}</div>
                        <div style={{ marginTop: '2px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>Account Type:</strong> {accountType}</div>
                        <div style={{ marginTop: '2px' }}><strong style={{ color: '#000000', fontWeight: '800' }}>G-Pay:</strong> {gpay}</div>
                      </div>
                    </div>

                    {/* Clean UPI QR Scanner (No Overlap) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        padding: '2px',
                        background: '#FFFFFF',
                        border: '0.8px solid #888888',
                        borderRadius: '4px'
                      }}
                    >
                      <img
                        src={SCANNER_QR_BASE64 || scannerImg}
                        alt="UPI QR Scanner"
                        style={{
                          width: '74px',
                          height: '74px',
                          objectFit: 'contain',
                          display: 'block'
                        }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = SCANNER_QR_BASE64 || '/scanner.jpg';
                        }}
                      />
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
                    padding: '8px 10px',
                    color: '#000000',
                    fontWeight: '600',
                    fontSize: '10px',
                    boxSizing: 'border-box',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5px', fontSize: '10px', lineHeight: '1.28' }}>
                    {paymentTermsList.map((term, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
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
