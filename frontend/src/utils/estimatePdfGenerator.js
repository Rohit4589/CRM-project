import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate and download a PDF from a printable DOM element.
 * Splits content into logical chunks (header, rooms, summary, terms, etc.)
 * and places each chunk on pages so that no row/section is cut mid-content.
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
    // A4 dimensions in mm
    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN_X = 12; // mm left & right margin
    const MARGIN_Y = 12; // mm top & bottom margin
    const CONTENT_W = PAGE_W - MARGIN_X * 2;
    const CONTENT_H = PAGE_H - MARGIN_Y * 2;

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Gather all direct child sections of the printable sheet.
    // Each section is rendered separately to a canvas, then placed on pages
    // without splitting.
    const children = Array.from(element.children);

    // Group children into logical sections that should not be split.
    // We render each child separately to its own canvas.
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

    let currentY = MARGIN_Y; // current Y position on current page (mm)
    let isFirstPage = true;

    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const { canvas } = sections[sIdx];
      const sectionHeightMm = (canvas.height / pxPerMm);

      // If this section fits on current page, place it
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
        // Section fits on a fresh page
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
        // Section is taller than a full page — slice it carefully
        // (e.g. a very large room table)
        const imgData = canvas.toDataURL('image/png');
        const totalImgH = sectionHeightMm;
        let remainingH = totalImgH;
        let srcYOffset = 0;

        while (remainingH > 0) {
          const spaceOnPage = (PAGE_H - MARGIN_Y) - currentY;
          const sliceH = Math.min(spaceOnPage, remainingH);

          // We draw the full image but clip it via position offset
          // Since jsPDF addImage doesn't support clipping, we use sub-canvas
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

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('PDF generation error:', err);
    // Fallback to browser print if generation fails
    window.print();
    return false;
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
