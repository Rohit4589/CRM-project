import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Builds a jsPDF instance from a printable DOM element.
 * Uses an isolated, resolution-independent Virtual A4 Stage (794px international standard)
 * so that whether the PDF is generated or opened on a Mobile Phone, Laptop, Tablet, or TV,
 * the layout, aspect ratio, sharpness, and margins are 100% consistent and perfect.
 *
 * @param {HTMLElement} element - The DOM element containing the estimate sheet
 * @returns {Promise<jsPDF|null>} - The configured jsPDF instance
 */
export async function buildEstimatePdf(element) {
  if (!element) {
    console.error('Element not found for PDF generation');
    return null;
  }

  // Virtual A4 Stage dimensions (Standard international A4: 210mm x 297mm at 96 DPI = 794px x 1123px)
  const STAGE_WIDTH_PX = 794;
  const PAGE_W_MM = 210;
  const PAGE_H_MM = 297;
  const MARGIN_X_MM = 8; // Clean professional 8mm margins
  const MARGIN_Y_MM = 8;
  const CONTENT_W_MM = PAGE_W_MM - (MARGIN_X_MM * 2); // 194mm
  const CONTENT_H_MM = PAGE_H_MM - (MARGIN_Y_MM * 2); // 281mm

  let stageWrapper = null;

  try {
    // 1. Create an isolated off-screen stage with fixed A4 width
    // This completely decouples PDF generation from the user's device screen resolution (phone, laptop, TV)
    stageWrapper = document.createElement('div');
    stageWrapper.style.position = 'fixed';
    stageWrapper.style.top = '-99999px';
    stageWrapper.style.left = '-99999px';
    stageWrapper.style.width = `${STAGE_WIDTH_PX}px`;
    stageWrapper.style.minWidth = `${STAGE_WIDTH_PX}px`;
    stageWrapper.style.maxWidth = `${STAGE_WIDTH_PX}px`;
    stageWrapper.style.background = '#FFFFFF';
    stageWrapper.style.zIndex = '-99999';
    stageWrapper.style.boxSizing = 'border-box';
    stageWrapper.style.overflow = 'visible';

    // 2. Clone the printable sheet into this stage
    const clone = element.cloneNode(true);
    clone.style.width = `${STAGE_WIDTH_PX}px`;
    clone.style.minWidth = `${STAGE_WIDTH_PX}px`;
    clone.style.maxWidth = `${STAGE_WIDTH_PX}px`;
    clone.style.boxSizing = 'border-box';
    clone.style.padding = '12px 14px'; // Proportional document padding
    clone.style.background = '#FFFFFF';
    clone.style.margin = '0';
    clone.style.boxShadow = 'none';
    clone.style.borderRadius = '0';
    clone.style.transform = 'none';

    // Ensure all tables and full-width containers expand to 100% of the A4 stage
    const tables = clone.querySelectorAll('table');
    tables.forEach((t) => {
      t.style.width = '100%';
      t.style.maxWidth = '100%';
      t.style.boxSizing = 'border-box';
    });

    stageWrapper.appendChild(clone);
    document.body.appendChild(stageWrapper);

    // 3. Capture with html2canvas at 2x Retina resolution for razor-sharp text and graphics
    const canvas = await html2canvas(clone, {
      scale: 2, // 2x high-DPI (1588px wide canvas)
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: STAGE_WIDTH_PX,
      windowWidth: STAGE_WIDTH_PX
    });

    // 4. Build jsPDF A4 document
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Calculate total height in mm based on standard A4 width
    const totalHeightMm = (canvas.height / canvas.width) * CONTENT_W_MM;

    // If it fits on 1 page (like standard 1-room or 2-room estimates), fit cleanly on 1 full A4 page
    if (totalHeightMm <= CONTENT_H_MM) {
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        MARGIN_X_MM,
        MARGIN_Y_MM,
        CONTENT_W_MM,
        totalHeightMm
      );
    } else {
      // Clean multi-page slicing for multi-room estimates
      let remainingHeightMm = totalHeightMm;
      let srcYPx = 0;
      let isFirstPage = true;

      while (remainingHeightMm > 0) {
        if (!isFirstPage) {
          pdf.addPage();
        }

        const pageSliceHeightMm = Math.min(CONTENT_H_MM, remainingHeightMm);
        const sliceHeightPx = Math.round((pageSliceHeightMm / totalHeightMm) * canvas.height);

        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const ctx = pageCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        ctx.drawImage(
          canvas,
          0, Math.round(srcYPx), canvas.width, sliceHeightPx,
          0, 0, canvas.width, sliceHeightPx
        );

        pdf.addImage(
          pageCanvas.toDataURL('image/png'),
          'PNG',
          MARGIN_X_MM,
          MARGIN_Y_MM,
          CONTENT_W_MM,
          pageSliceHeightMm
        );

        srcYPx += sliceHeightPx;
        remainingHeightMm -= pageSliceHeightMm;
        isFirstPage = false;
      }
    }

    return pdf;
  } catch (err) {
    console.error('PDF building error:', err);
    return null;
  } finally {
    if (stageWrapper && stageWrapper.parentNode) {
      stageWrapper.parentNode.removeChild(stageWrapper);
    }
  }
}

/**
 * Generate and download a PDF from a printable DOM element.
 *
 * @param {HTMLElement} element - The DOM element containing the estimate sheet
 * @param {string} filename - Desired PDF filename
 */
export async function downloadEstimatePdf(element, filename = 'Modern_Interior_Estimate.pdf') {
  if (!element) {
    console.error('Element not found for PDF generation');
    return false;
  }

  try {
    const pdf = await buildEstimatePdf(element);
    if (!pdf) {
      window.print();
      return false;
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('PDF download error:', err);
    window.print();
    return false;
  }
}

/**
 * Direct WhatsApp Share: Generates the PDF and triggers native file sharing.
 * Sends ONLY the PDF file without any text message or captions.
 *
 * @param {HTMLElement} element - The printable DOM element
 * @param {string} filename - Desired PDF filename (e.g. Modern_Interior_Estimate_187.pdf)
 * @returns {Promise<{ success: boolean, method: string }>}
 */
export async function shareEstimatePdfOnWhatsApp(element, filename = 'Modern_Interior_Estimate.pdf') {
  if (!element) {
    console.error('Element not found for WhatsApp share');
    return { success: false, method: 'no_element' };
  }

  try {
    const pdf = await buildEstimatePdf(element);
    if (!pdf) {
      return { success: false, method: 'build_failed' };
    }

    const blob = pdf.output('blob');
    const pdfFile = new File([blob], filename, { type: 'application/pdf' });

    // 1. Direct Native File Sharing via Web Share API Level 2 (Mobile / Tablet / Supported PC)
    if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      await navigator.share({
        files: [pdfFile]
        // Strictly NO text and NO message — user wants only the PDF document sent
      });
      return { success: true, method: 'native' };
    }

    // 2. Desktop Fallback (for PC browsers where direct OS file injection is not supported)
    // Download the PDF immediately so user has it ready
    pdf.save(filename);

    // Open WhatsApp Web
    window.open('https://web.whatsapp.com', '_blank');

    return { success: true, method: 'download_fallback' };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      return { success: true, method: 'cancelled' };
    }
    console.error('WhatsApp PDF share error:', err);
    return { success: false, method: 'error' };
  }
}

/**
 * Trigger native browser print dialog with styling
 */
export function printEstimateSheet() {
  setTimeout(() => {
    window.print();
  }, 50);
}
