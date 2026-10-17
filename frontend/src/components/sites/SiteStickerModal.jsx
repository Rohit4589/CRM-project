import React, { useState, useEffect } from 'react';
import { API_BASE } from '../../config/api';

const SiteStickerModal = ({ site, onClose }) => {
  // Step 1: 'ask_qty' (prompts for options: quantity, supervision, site head, status, date)
  // Step 2: 'preview' (shows live 6x4 sheets matching exact quantity)
  const [step, setStep] = useState('ask_qty');
  const [quantity, setQuantity] = useState(1);
  const [quantityStr, setQuantityStr] = useState('1');
  const [bwLogo, setBwLogo] = useState('');

  // Form fields for sticker execution
  const [refName, setRefName] = useState(site?.refName || '');
  const [supervisionBy, setSupervisionBy] = useState(''); // '' means handwritten pen line
  const [siteHead, setSiteHead] = useState(''); // '' means handwritten pen line
  const [completeStatus, setCompleteStatus] = useState(''); // '' means handwritten pen line
  const [completeDateOption, setCompleteDateOption] = useState('handwritten'); // 'handwritten' | 'today' | 'custom'
  const [customCompleteDate, setCustomCompleteDate] = useState('');

  // Active employees list
  const [employees, setEmployees] = useState([]);

  if (!site) return null;

  const siteCode = site.siteCode || site.siteRef || site.id || '---';
  const displayCode = String(siteCode).replace(/[^0-9]/g, '');
  const formattedCode = displayCode && !isNaN(parseInt(displayCode, 10))
    ? (parseInt(displayCode, 10) < 1000 ? displayCode.padStart(3, '0') : displayCode)
    : siteCode;

  // Format date helper: returns DD-MM-YYYY
  const formatDateToDMY = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateStr;
    }
  };

  const todayDMY = formatDateToDMY(new Date().toISOString());
  const siteCreatedDMY = formatDateToDMY(site.startDate) || todayDMY;

  // Compute final complete date string
  const resolvedCompleteDate = completeDateOption === 'today'
    ? todayDMY
    : (completeDateOption === 'custom' ? formatDateToDMY(customCompleteDate) : '');

  // Generate pure 1-bit crisp black & white logo on mount
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/logo.png';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] > 20) {
            d[i] = 0;
            d[i + 1] = 0;
            d[i + 2] = 0;
            d[i + 3] = d[i + 3] > 80 ? 255 : 0;
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setBwLogo(canvas.toDataURL('image/png'));
      } catch (err) {
        console.warn('Canvas B&W logo conversion fallback:', err);
        setBwLogo('/logo.png');
      }
    };
    img.onerror = () => {
      setBwLogo('/logo.png');
    };
  }, []);

  // Fetch employees for Supervision By & Site Head dropdowns
  useEffect(() => {
    fetch(`${API_BASE}/employees`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.employees)) {
          setEmployees(data.employees);
        }
      })
      .catch(err => {
        console.warn('Unable to fetch employees for sticker dropdown:', err);
      });
  }, []);

  const effectiveLogo = bwLogo || '/logo.png';
  const totalSheets = Math.max(1, Math.ceil(quantity / 2));
  const effectiveRefName = (refName || site.refName || '').trim();

  // Print execution: prints all sheets on 150mm x 100mm landscape roll
  const handlePrint = () => {
    const renderSingleStickerHTML = () => `
      <div class="sticker">
        <!-- 1. Header with Black & White Logo + Clean Order Number (No Outline Box) -->
        <div class="sticker-header">
          <img src="${effectiveLogo}" alt="Modern Interior" class="bw-logo" />
          <div class="order-header-number">${formattedCode}</div>
        </div>

        <!-- 2. Customer & Site Details -->
        <div class="sticker-body">
          <div class="sticker-sec-top">
            <div class="field-row">
              <span class="field-label">Date:-</span>
              <span class="field-val">${siteCreatedDMY}</span>
            </div>

            <div class="field-row">
              <span class="field-label">Cus. Name:-</span>
              <span class="field-val cus-name-highlight">${site.customerName || '-'}</span>
            </div>

            ${effectiveRefName ? `
              <div class="field-row">
                <span class="field-label">Ref. Name:-</span>
                <span class="field-val">${effectiveRefName}</span>
              </div>
            ` : ''}

            <div class="field-row">
              <span class="field-label">Contact No. :-</span>
              <span class="field-val phone-highlight">${site.phone || '-'}</span>
            </div>

            <div class="field-row">
              <span class="field-label">Address:-</span>
              <span class="field-val addr-val">${site.fullAddress || site.location || '-'}</span>
            </div>
          </div>

          <!-- Divider -->
          <div class="section-divider"></div>

          <!-- 3. Supervision & Handover Section -->
          <div class="sticker-sec-bottom">
            <div class="field-row">
              <span class="field-label">Supervision By:-</span>
              ${supervisionBy ? `<span class="field-val">${supervisionBy}</span>` : `<div class="pen-line"></div>`}
            </div>

            <div class="field-row">
              <span class="field-label">Site Head:-</span>
              ${siteHead ? `<span class="field-val">${siteHead}</span>` : `<div class="pen-line"></div>`}
            </div>

            <div class="field-row">
              <span class="field-label">Complete Status:-</span>
              ${completeStatus ? `<span class="field-val">${completeStatus}</span>` : `<div class="pen-line"></div>`}
            </div>

            <div class="field-row">
              <span class="field-label">Complete Date:-</span>
              ${resolvedCompleteDate ? `<span class="field-val">${resolvedCompleteDate}</span>` : `<div class="pen-line"></div>`}
            </div>
          </div>
        </div>
      </div>
    `;

    // Multi-sheet HTML: each 6x4 sheet (150mm x 100mm) has 2 stickers or 1 sticker on left
    let allSheetsHTML = '';
    for (let s = 0; s < totalSheets; s++) {
      const leftStickerNum = s * 2 + 1;
      const rightStickerNum = s * 2 + 2;
      const hasRight = rightStickerNum <= quantity;

      allSheetsHTML += `
        <div class="sheet-page">
          <div class="half">
            ${renderSingleStickerHTML(leftStickerNum)}
          </div>
          ${hasRight ? `
            <div class="cut-guide-vertical">
              <span class="cut-scissor">✂</span>
              <div class="cut-line-v"></div>
              <span class="cut-text-v">CUT</span>
              <div class="cut-line-v"></div>
              <span class="cut-scissor">✂</span>
            </div>
            <div class="half">
              ${renderSingleStickerHTML(rightStickerNum)}
            </div>
          ` : `
            <div style="width: 3.5mm;"></div>
            <div class="empty"></div>
          `}
        </div>
      `;
    }

    const printHtmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>Order ${formattedCode} - Sticker</title>
        <style>
          @page {
            size: 150mm 100mm;
            margin: 0mm !important;
          }
          @media print {
            html, body {
              width: 150mm !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              overflow: visible !important;
              font-size: 0 !important;
              line-height: 0 !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .sheet-page {
              box-shadow: none !important;
              margin: 0 !important;
              padding: 1.5mm 2mm !important;
              border: none !important;
              width: 150mm !important;
              height: 98mm !important;
              max-height: 98mm !important;
              font-size: 13px !important;
              line-height: normal !important;
              display: flex !important;
              flex-direction: row !important;
              justify-content: space-between !important;
              align-items: stretch !important;
              gap: 1.5mm !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              box-sizing: border-box !important;
            }
            .sheet-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            .half {
              flex: 1 !important;
              min-width: 0 !important;
              height: 95mm !important;
              max-height: 95mm !important;
              display: flex !important;
              box-sizing: border-box !important;
            }
            .empty {
              flex: 1 !important;
              min-width: 0 !important;
              height: 95mm !important;
              max-height: 95mm !important;
              border: none !important;
              visibility: hidden !important;
              box-sizing: border-box !important;
            }
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sheet-page {
            width: 150mm;
            height: 98mm;
            max-height: 98mm;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: stretch;
            padding: 1.5mm 2mm;
            gap: 1.5mm;
            box-sizing: border-box;
            background: #ffffff;
            page-break-after: always;
            break-after: page;
          }
          .sheet-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
          .half {
            flex: 1;
            min-width: 0;
            height: 95mm;
            max-height: 95mm;
            display: flex;
            align-items: stretch;
            box-sizing: border-box;
          }
          .empty {
            flex: 1;
            min-width: 0;
            height: 95mm;
            max-height: 95mm;
            background: transparent;
            visibility: hidden;
            border: none;
          }
          .cut-guide-vertical {
            width: 3.5mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            color: #94a3b8;
            padding: 3mm 0;
            box-sizing: border-box;
            user-select: none;
          }
          .cut-line-v {
            flex: 1;
            border-left: 1px dashed #cbd5e1;
            margin: 2mm 0;
            width: 0;
          }
          .cut-text-v {
            writing-mode: vertical-rl;
            text-orientation: upright;
            font-size: 7px;
            font-weight: 800;
            letter-spacing: 2px;
            color: #94a3b8;
          }
          .cut-scissor {
            font-size: 9px;
            color: #94a3b8;
          }
          .sticker {
            width: 100%;
            height: 100%;
            border: 1px solid #94a3b8;
            border-radius: 4px;
            display: flex;
            flex-direction: column;
            background: #ffffff;
            overflow: hidden;
            box-sizing: border-box;
          }
          .sticker-header {
            padding: 6px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #94a3b8;
            background: #ffffff;
            min-height: 44px;
            box-sizing: border-box;
          }
          .bw-logo {
            max-height: 36px;
            max-width: 130px;
            object-fit: contain;
            display: block;
            filter: brightness(0);
          }
          .order-header-number {
            font-size: 32px;
            font-weight: 900;
            color: #000000;
            line-height: 1;
            white-space: nowrap;
            font-family: Arial, sans-serif;
            letter-spacing: 0.5px;
          }
          .sticker-body {
            padding: 12px 14px 14px;
            display: flex;
            flex-direction: column;
            flex: 1;
            justify-content: space-between;
            box-sizing: border-box;
          }
          .sticker-sec-top {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .sticker-sec-bottom {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .field-row {
            display: flex;
            align-items: flex-start;
            line-height: 1.35;
          }
          .field-label {
            font-size: 13px;
            font-weight: 700;
            color: #111111;
            white-space: nowrap;
            width: 120px;
            min-width: 120px;
            flex-shrink: 0;
            letter-spacing: 0.2px;
          }
          .field-val {
            font-size: 13.5px;
            font-weight: 600;
            color: #000000;
            word-break: break-word;
            flex: 1;
          }
          .cus-name-highlight {
            font-size: 16px;
            font-weight: 900;
          }
          .phone-highlight {
            font-size: 14px;
            font-weight: 700;
          }
          .addr-val {
            font-size: 12.5px;
            font-weight: 600;
            line-height: 1.35;
          }
          .section-divider {
            border-top: 1px solid #94a3b8;
            margin: 6px 0;
            width: 100%;
          }
          .pen-line {
            flex: 1;
            border-bottom: 1px solid #94a3b8;
            height: 16px;
            min-width: 70px;
            margin-bottom: 2px;
          }
        </style>
      </head>
      <body>
        ${allSheetsHTML}
      </body>
      </html>
    `;

    // Hidden iframe print method matching Maheswara
    try {
      let iframe = document.getElementById('sticker-print-iframe');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'sticker-print-iframe';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(printHtmlContent);
        doc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 280);
        return;
      }
    } catch (err) {
      console.warn('Iframe print failed, falling back to window.open', err);
    }

    // Fallback if iframe fails: window.open
    const printWindow = window.open('', '_blank', 'width=920,height=650');
    if (!printWindow) {
      alert('Please allow pop-ups to print the folder sticker.');
      return;
    }
    printWindow.document.open();
    printWindow.document.write(printHtmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 350);
  };

  // Reusable Single Sticker Component for the Modal Preview
  const renderStickerPreview = () => (
    <div style={{
      width: '100%',
      height: '100%',
      border: '1px solid #94a3b8',
      borderRadius: '4px',
      display: 'flex',
      flexDirection: 'column',
      background: '#ffffff',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* 1. Header with Logo + ONLY Order Number */}
      <div style={{
        padding: '6px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #94a3b8',
        background: '#ffffff',
        minHeight: '44px',
        boxSizing: 'border-box'
      }}>
        <img
          src={effectiveLogo}
          alt="Modern Interior"
          style={{
            maxHeight: '36px',
            maxWidth: '130px',
            objectFit: 'contain',
            display: 'block',
            filter: 'brightness(0)'
          }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <div style={{
          fontSize: '32px',
          fontWeight: '900',
          color: '#000',
          lineHeight: 1,
          letterSpacing: '0.5px',
          whiteSpace: 'nowrap',
          fontFamily: 'Arial, sans-serif'
        }}>
          {formattedCode}
        </div>
      </div>

      {/* 2. Body: Customer Info + Supervision Details */}
      <div style={{
        padding: '12px 14px 14px',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        {/* Top Section: Customer Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Date:-
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#000', flex: 1 }}>
              {siteCreatedDMY}
            </span>
          </div>

          {/* Customer Name */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Cus. Name:-
            </span>
            <span style={{ fontSize: '16px', fontWeight: '900', color: '#000', wordBreak: 'break-word', flex: 1 }}>
              {site.customerName || '-'}
            </span>
          </div>

          {/* Reference Name (Only if entered during form filling) */}
          {effectiveRefName && (
            <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
                Ref. Name:-
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: '600', color: '#000', wordBreak: 'break-word', flex: 1 }}>
                {effectiveRefName}
              </span>
            </div>
          )}

          {/* Contact No */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Contact No. :-
            </span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#000', flex: 1 }}>
              {site.phone || '-'}
            </span>
          </div>

          {/* Address */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Address:-
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: '600', color: '#000', lineHeight: '1.35', wordBreak: 'break-word', flex: 1 }}>
              {site.fullAddress || site.location || '-'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid #94a3b8', margin: '6px 0', width: '100%' }} />

        {/* Bottom Section: Supervision & Completion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Supervision By */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Supervision By:-
            </span>
            {supervisionBy ? (
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#000', flex: 1 }}>{supervisionBy}</span>
            ) : (
              <div style={{ flex: 1, borderBottom: '1px solid #94a3b8', height: '16px', minWidth: '70px', marginBottom: '2px' }} />
            )}
          </div>

          {/* Site Head */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Site Head:-
            </span>
            {siteHead ? (
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#000', flex: 1 }}>{siteHead}</span>
            ) : (
              <div style={{ flex: 1, borderBottom: '1px solid #94a3b8', height: '16px', minWidth: '70px', marginBottom: '2px' }} />
            )}
          </div>

          {/* Complete Status */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Complete Status:-
            </span>
            {completeStatus ? (
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#000', flex: 1 }}>{completeStatus}</span>
            ) : (
              <div style={{ flex: 1, borderBottom: '1px solid #94a3b8', height: '16px', minWidth: '70px', marginBottom: '2px' }} />
            )}
          </div>

          {/* Complete Date */}
          <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '1.35' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: '#111', width: '120px', minWidth: '120px', flexShrink: 0, letterSpacing: '0.2px' }}>
              Complete Date:-
            </span>
            {resolvedCompleteDate ? (
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: '#000', flex: 1 }}>{resolvedCompleteDate}</span>
            ) : (
              <div style={{ flex: 1, borderBottom: '1px solid #94a3b8', height: '16px', minWidth: '70px', marginBottom: '2px' }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ==========================================
  // STEP 1: CONFIGURE STICKER MODAL
  // ==========================================
  if (step === 'ask_qty') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1300,
        backdropFilter: 'blur(3px)',
        padding: '16px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                background: '#083344',
                color: '#ffffff',
                padding: '4px 8px',
                borderRadius: '6px',
                fontWeight: '900',
                fontSize: '13px'
              }}>
                #{formattedCode}
              </div>
              <h3 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: '800',
                color: '#0f172a'
              }}>
                Customer Info Sticker - {site.customerName || 'Customer'}
              </h3>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                lineHeight: '1',
                cursor: 'pointer',
                color: '#64748b',
                fontWeight: '600',
                padding: '2px 6px'
              }}
            >
              &times;
            </button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const parsed = parseInt(quantityStr, 10);
              const safeQty = !isNaN(parsed) && parsed > 0 ? Math.min(100, parsed) : 1;
              setQuantity(safeQty);
              setQuantityStr(String(safeQty));
              setStep('preview');
            }}
            style={{ padding: '20px 22px', overflowY: 'auto' }}
          >
            {/* Quantity */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' }}>
                Total Number of Stickers *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={quantityStr}
                autoFocus
                onFocus={(e) => e.target.select()}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuantityStr(val);
                  const parsed = parseInt(val, 10);
                  if (!isNaN(parsed) && parsed > 0) {
                    setQuantity(Math.min(100, parsed));
                  }
                }}
                onBlur={() => {
                  if (!quantityStr || parseInt(quantityStr, 10) < 1) {
                    setQuantity(1);
                    setQuantityStr('1');
                  }
                }}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 12px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              />
            </div>

            {/* Reference Name (Optional, pre-filled if already entered) */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12.5px', fontWeight: '700', color: '#1e293b' }}>
                  Reference Name
                </label>
                <span style={{ fontSize: '11px', color: '#64748b' }}>(Optional - printed only if entered)</span>
              </div>
              <input
                type="text"
                placeholder="Enter Name"
                value={refName}
                onChange={(e) => setRefName(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 12px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13.5px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              />
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '16px 0 14px' }} />

            <div style={{ fontSize: '12px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Supervision & Completion (Select Employee or Leave Blank for Pen Line)
            </div>

            {/* Supervision By */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                Supervision By
              </label>
              <select
                value={supervisionBy}
                onChange={(e) => setSupervisionBy(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 10px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              >
                <option value="">✍️ Handwritten (Draw line to write by pen)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.role || 'Employee'})
                  </option>
                ))}
              </select>
            </div>

            {/* Site Head */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                Site Head
              </label>
              <select
                value={siteHead}
                onChange={(e) => setSiteHead(e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '6px 10px',
                  border: '1.5px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: '#ffffff'
                }}
              >
                <option value="">✍️ Handwritten (Draw line to write by pen)</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.name}>
                    {emp.name} ({emp.role || 'Employee'})
                  </option>
                ))}
              </select>
            </div>

            {/* Complete Status & Date (2 columns) */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                  Complete Status
                </label>
                <select
                  value={completeStatus}
                  onChange={(e) => setCompleteStatus(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 10px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff'
                  }}
                >
                  <option value="">✍️ Handwritten (Draw line)</option>
                  <option value="Running">Running</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#1e293b', marginBottom: '5px' }}>
                  Complete Date
                </label>
                <select
                  value={completeDateOption}
                  onChange={(e) => setCompleteDateOption(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '6px 10px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    background: '#ffffff'
                  }}
                >
                  <option value="handwritten">✍️ Handwritten (Draw line)</option>
                  <option value="today">Today ({todayDMY})</option>
                  <option value="custom">Pick Custom Date...</option>
                </select>
                {completeDateOption === 'custom' && (
                  <input
                    type="date"
                    value={customCompleteDate}
                    onChange={(e) => setCustomCompleteDate(e.target.value)}
                    style={{
                      width: '100%',
                      marginTop: '6px',
                      height: '34px',
                      padding: '4px 8px',
                      border: '1.5px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      boxSizing: 'border-box'
                    }}
                  />
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              marginTop: '22px'
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontWeight: '600',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#083344',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
                }}
              >
                Preview Stickers →
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // STEP 2: PREVIEW & PRINT MODAL
  // ==========================================
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1300,
      backdropFilter: 'blur(3px)',
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '14.5px',
              fontWeight: '800',
              color: '#0f172a'
            }}>
              Customer Info Sticker Preview (Landscape 6×4 / Two 3×4 Stickers)
            </h3>
            <span style={{ fontSize: '11.5px', color: '#64748b' }}>
              Order #{formattedCode} • Total Stickers: {quantity}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '20px',
              lineHeight: '1',
              cursor: 'pointer',
              color: '#64748b',
              fontWeight: '600',
              padding: '2px 6px'
            }}
          >
            &times;
          </button>
        </div>

        {/* Scrollable Preview Body showing ALL sheets stacked vertically */}
        <div style={{
          padding: '20px 24px',
          background: '#edf2f7',
          maxHeight: '72vh',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          {Array.from({ length: totalSheets }).map((_, s) => {
            const leftStickerNum = s * 2 + 1;
            const rightStickerNum = s * 2 + 2;
            const hasRight = rightStickerNum <= quantity;

            return (
              <div
                key={s}
                style={{
                  width: '580px',
                  height: '386px',
                  background: '#ffffff',
                  borderRadius: '4px',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
                  display: 'flex',
                  padding: '8px 10px',
                  gap: '6px',
                  boxSizing: 'border-box',
                  flexShrink: 0
                }}
              >
                {/* Left Sticker */}
                <div style={{ flex: 1, height: '100%', display: 'flex', boxSizing: 'border-box' }}>
                  {renderStickerPreview(leftStickerNum)}
                </div>

                {/* Center Cut Line or Spacer */}
                {hasRight ? (
                  <>
                    <div style={{
                      width: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 0',
                      userSelect: 'none'
                    }}>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>✂</span>
                      <div style={{ flex: 1, borderLeft: '1px dashed #cbd5e1', margin: '4px 0', width: 0 }} />
                      <span style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'upright',
                        fontSize: '8px',
                        fontWeight: 800,
                        letterSpacing: '2px',
                        color: '#94a3b8'
                      }}>
                        CUT
                      </span>
                      <div style={{ flex: 1, borderLeft: '1px dashed #cbd5e1', margin: '4px 0', width: 0 }} />
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>✂</span>
                    </div>

                    {/* Right Sticker */}
                    <div style={{ flex: 1, height: '100%', display: 'flex', boxSizing: 'border-box' }}>
                      {renderStickerPreview(rightStickerNum)}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '18px' }} />
                    <div style={{ flex: 1, height: '100%', background: '#ffffff', boxSizing: 'border-box' }} />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer with Tip, Back and Print Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          borderTop: '1px solid #e2e8f0',
          background: '#ffffff',
          flexShrink: 0
        }}>
          <button
            onClick={() => setStep('ask_qty')}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: '600',
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            ← Change Details
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              style={{
                padding: '8px 22px',
                borderRadius: '6px',
                border: 'none',
                background: '#083344',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)'
              }}
            >
              <i className="fa-solid fa-download"></i>
              Download / Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SiteStickerModal;
