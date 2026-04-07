/**
 * Universal PDF export utility using the browser's inbuilt print-to-pdf method.
 *
 * All PDF downloads in this project go through downloadElementAsPdf().
 * This provides 100% layout fidelity and perfect font rendering.
 */

// ── Filename helpers ──────────────────────────────────────────────────────────

export function sanitiseFilename(name) {
  if (!name) return '';
  return name.replace(/ /g, '_').replace(/[/\\:*?"<>|]/g, '');
}

export function buildFilename(type, name) {
  const safeName = name ? sanitiseFilename(name) || 'Unknown' : 'Unknown';
  const date = new Date().toISOString().slice(0, 10);
  return `${type}_${safeName}_${date}.pdf`;
}

// ── Wait for images ───────────────────────────────────────────────────────────

function waitForImages(element) {
  const imgs = Array.from(element.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();
  return Promise.all(
    imgs.map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) { resolve(); return; }
          img.onload = resolve;
          img.onerror = resolve;
        })
    )
  );
}

// ── Core export function ──────────────────────────────────────────────────────

/**
 * Isolates a DOM element and opens the native print dialog.
 *
 * @param {HTMLElement} element - The element to print.
 * @param {Object} options
 * @param {number}  options.windowWidth - Render width target in px (default: 1122)
 */
export async function downloadElementAsPdf(element, options = {}) {
  if (!element) throw new Error('No element provided for PDF export.');

  const {
    windowWidth = 800, // Target A4 Portrait width for zero-loss print capture
  } = options;

  // 1. Create a dedicated print container
  const container = document.createElement('div');
  container.className = 'print-container';

  // 2. Clone the content
  const clone = element.cloneNode(true);

  // Force expansion on the clone for print
  clone.style.cssText += `
    width: ${windowWidth}px !important;
    max-width: ${windowWidth}px !important;
    margin-left: auto !important;
    margin-right: auto !important;
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
    box-sizing: border-box !important;
  `;

  container.appendChild(clone);
  document.body.appendChild(container);

  // 3. Wait for assets to be ready
  await Promise.all([
    waitForImages(clone),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]);

  // Small delay to ensure paint
  await new Promise((r) => setTimeout(r, 250));

  // 4. Enter Isolation Mode
  const originalTitle = document.title;
  if (options.filename) {
    // Some browsers use the document title as the default filename in print
    document.title = options.filename.replace('.pdf', '');
  }

  document.body.classList.add('isolate-print');

  // 5. Trigger Print
  try {
    window.print();
  } finally {
    // 6. Cleanup
    document.body.classList.remove('isolate-print');
    document.title = originalTitle;
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
