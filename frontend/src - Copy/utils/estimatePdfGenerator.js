import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Builds a jsPDF instance from a printable DOM element.
 * Splits content into logical chunks (header, rooms, summary, terms, etc.)
 * and places each chunk on pages so that no row/section is cut mid-content.
 *
 * @param {HTMLElement} element - The DOM element containing the estimate sheet
 * @returns {Promise<jsPDF|null>} - The configured jsPDF instance
 */
export async function buildEstimatePdf(element) {
  if (!element) {
    console.error('Element not found for PDF generation');
    return null;
  }

  try {
    // A4 dimensions in mm
    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN_X = 12; // mm left & right margin
    const MARGIN_Y = 12; // mm top & bottom margin
    const CONTENT_W = PAGE_W - MARGIN_X * 2;
    const CONTENT_H = PAGE_H - MARGIN_Y * 2;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Gather all direct child sections of the printable sheet.
    const children = Array.from(element.children);

    const sections = [];
    for (const child of children) {
      const canvas = await html2canvas(child, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: element.offsetWidth,
        windowWidth: element.offsetWidth
      });
      sections.push({ canvas, child });
    }

    // The full element width in pixels is used to compute mm scale factor
    const elementWidthPx = element.offsetWidth * 2; // scale factor is 2
    const pxPerMm = elementWidthPx / CONTENT_W;

    let currentY = MARGIN_Y;
    let isFirstPage = true;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const { canvas } = sections[sIdx];
      const sectionHeightMm = (canvas.height / pxPerMm);

      if (currentY + sectionHeightMm <= PAGE_H - MARGIN_Y) {
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          MARGIN_X,
          currentY,
          CONTENT_W,
          sectionHeightMm
        );
        currentY += sectionHeightMm;
      } else if (sectionHeightMm <= CONTENT_H) {
        if (!isFirstPage || currentY > MARGIN_Y) {
          pdf.addPage();
        }
        currentY = MARGIN_Y;
        pdf.addImage(
          canvas.toDataURL('image/png'),
          'PNG',
          MARGIN_X,
          currentY,
          CONTENT_W,
          sectionHeightMm
        );
        currentY += sectionHeightMm;
        isFirstPage = false;
      } else {
        const totalImgH = sectionHeightMm;
        let remainingH = totalImgH;
        let srcYOffset = 0;

        while (remainingH > 0) {
          const spaceOnPage = (PAGE_H - MARGIN_Y) - currentY;
          const sliceH = Math.min(spaceOnPage, remainingH);

          const sliceHeightPx = (sliceH / totalImgH) * canvas.height;
          const srcYPx = (srcYOffset / totalImgH) * canvas.height;

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.ceil(sliceHeightPx);
          const ctx = sliceCanvas.getContext('2d');
          ctx.drawImage(
            canvas,
            0, Math.floor(srcYPx), canvas.width, Math.ceil(sliceHeightPx),
            0, 0, canvas.width, Math.ceil(sliceHeightPx)
          );

          pdf.addImage(
            sliceCanvas.toDataURL('image/png'),
            'PNG',
            MARGIN_X,
            currentY,
            CONTENT_W,
            sliceH
          );

          remainingH -= sliceH;
          srcYOffset += sliceH;
          currentY += sliceH;

          if (remainingH > 0) {
            pdf.addPage();
            currentY = MARGIN_Y;
          }
        }
        isFirstPage = false;
      }
    }

    return pdf;
  } catch (err) {
    console.error('PDF building error:', err);
    return null;
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
