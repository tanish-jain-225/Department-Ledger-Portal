const HTML2PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.9.3/html2pdf.bundle.min.js';

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

async function loadHtml2Pdf() {
  await loadScript(HTML2PDF_CDN, () => typeof window.html2pdf !== 'undefined');
  if (typeof window.html2pdf === 'undefined') {
    throw new Error('PDF library failed to load.');
  }
}

function createOffscreenContainer(width) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '0';
  container.style.width = `${width}px`;
  container.style.maxWidth = `${width}px`;
  container.style.background = '#ffffff';
  container.style.overflow = 'visible';
  container.style.boxSizing = 'border-box';
  return container;
}

/**
 * Universal PDF export using html2pdf.
 */
export async function downloadElementAsPdf(element, options = {}) {
  if (!element) {
    throw new Error('No element provided for PDF export.');
  }

  await loadHtml2Pdf();

  const {
    filename = 'download.pdf',
    orientation = 'portrait',
    scale = 2,
    windowWidth = 794,
  } = options;

  const clone = element.cloneNode(true);
  clone.style.width = `${windowWidth}px`;
  clone.style.maxWidth = `${windowWidth}px`;
  clone.style.boxSizing = 'border-box';
  clone.style.overflow = 'visible';

  const container = createOffscreenContainer(windowWidth);
  container.appendChild(clone);
  document.body.appendChild(container);

  await new Promise((resolve) => requestAnimationFrame(resolve));

  try {
    await window.html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          windowWidth,
          width: windowWidth,
          logging: false,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation,
        },
      })
      .from(clone)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}
