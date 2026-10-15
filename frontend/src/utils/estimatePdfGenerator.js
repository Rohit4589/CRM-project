import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generate and download a PDF from a printable DOM element
 * @param {HTMLElement} element - The DOM element containing the estimate sheet
 * @param {string} filename - Desired PDF filename
 */
export async function downloadEstimatePdf(element, filename = 'Modern_Interior_Estimate.pdf') {
  if (!element) {
    console.error('Element not found for PDF generation');
    return false;
  }

  try {
    // Clone or capture high resolution canvas
    const canvas = await html2canvas(element, {
      scale: 2, // 2x resolution for retina-crisp text
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Calculate height keeping aspect ratio
    const imgHeight = (canvasHeight * pdfWidth) / canvasWidth;

    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    // Handle multi-page documents
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('PDF generation error:', err);
    // Fallback to browser print if canvas fails
    window.print();
    return false;
  }
}

/**
 * Trigger native browser print dialog with styling
 */
export function printEstimateSheet() {
  window.print();
}
