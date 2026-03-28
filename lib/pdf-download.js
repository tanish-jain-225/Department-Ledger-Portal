const HTML2CANVAS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

export function sanitiseFilename(name) {
  if (!name) return '';
  return name.replace(/ /g, '_').replace(/[/\\:*?"<>|]/g, '');
}

export function buildFilename(type, name) {
  const safeName = name ? sanitiseFilename(name) || 'Unknown' : 'Unknown';
  const date = new Date().toISOString().slice(0, 10);
  return `${type}_${safeName}_${date}.pdf`;
}

function loadScript(src, check) {
  if (check()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.head.appendChild(script);
  });
}

async function loadLibraries() {
  await loadScript(HTML2CANVAS_CDN, () => typeof window.html2canvas === 'function');
  await loadScript(JSPDF_CDN, () => typeof window.jspdf !== 'undefined');
  if (typeof window.html2canvas !== 'function') {
    throw new Error('PDF library failed to load. Check your internet connection.');
  }
}

/**
 * Universal PDF export — renders element via html2canvas then places the
 * image into jsPDF with exact dimensions so nothing is ever clipped.
 * Multi-page content is sliced into page-height chunks automatically.
 */
export async function downloadElementAsPdf(element, options = {}) {
  if (element == null) {
    throw new Error('No element provided for PDF export.');
  }

  await loadLibraries();

  const {
    filename = 'download.pdf',
    orientation = 'portrait',
    scale = 2,
    windowWidth = 794,
  } = options;

  // Clone into an off-screen container at the exact capture width
  const clone = element.cloneNode(true);
  clone.style.cssText +=
    `;width:${windowWidth}px;max-width:${windowWidth}px;box-sizing:border-box;overflow:visible;`;

  const container = document.createElement('div');
  container.style.cssText =
    `position:absolute;top:0;left:-9999px;width:${windowWidth}px;` +
    `max-width:${windowWidth}px;background:#ffffff;overflow:visible;box-sizing:border-box;`;
  container.appendChild(clone);
  document.body.appendChild(container);

  // One frame for layout
  await new Promise(r => requestAnimationFrame(r));

  try {
    const canvas = await window.html2canvas(clone, {
      scale,
      useCORS: true,
      letterRendering: true,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      windowWidth,
      width: windowWidth,
      backgroundColor: '#ffffff',
    });

    // A4 dimensions in mm
    const pageW = orientation === 'landscape' ? 297 : 210;
    const pageH = orientation === 'landscape' ? 210 : 297;

    // Pixels → mm ratio (fit width exactly, no clipping)
    const pxToMm = pageW / canvas.width;
    const imgH = canvas.height * pxToMm;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    if (imgH <= pageH) {
      // Fits on one page
      pdf.addImage(imgData, 'JPEG', 0, 0, pageW, imgH);
    } else {
      // Slice into pages
      const pageH_px = Math.floor(pageH / pxToMm);
      let offsetY = 0;
      let first = true;

      while (offsetY < canvas.height) {
        const sliceH = Math.min(pageH_px, canvas.height - offsetY);
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = sliceH;
        const ctx = slice.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, slice.width, sliceH);
        ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

        if (!first) pdf.addPage();
        pdf.addImage(slice.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, sliceH * pxToMm);

        offsetY += sliceH;
        first = false;
      }
    }

    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
