const CDN_ID = "html2pdf-cdn-script";
const CDN_URL = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";

/**
 * Loads html2pdf from CDN (once) then calls the callback.
 */
function loadHtml2Pdf(callback, onError) {
  if (document.getElementById(CDN_ID)) {
    callback();
    return;
  }
  const script = document.createElement("script");
  script.id = CDN_ID;
  script.src = CDN_URL;
  script.onload = callback;
  script.onerror = onError;
  document.body.appendChild(script);
}

/**
 * Downloads an element as a single-page PDF that fits all content
 * without cutting or splitting through margins.
 *
 * @param {HTMLElement} element - The DOM element to capture
 * @param {string} filename - Output filename (without .pdf)
 * @param {Function} onSuccess - Called when download completes
 * @param {Function} onError - Called with error message string on failure
 */
export function downloadAsPDF(element, filename, onSuccess, onError) {
  if (!element) { onError("Element not found"); return; }

  const run = () => {
    // Measure the actual rendered pixel dimensions
    const pxW = element.scrollWidth || element.offsetWidth || 794;
    const pxH = element.scrollHeight || element.offsetHeight || 1123;

    // Convert to mm — A4 width = 210mm, height scales proportionally
    // Add 10mm buffer so nothing clips at the bottom
    const mmW = 210;
    const mmH = Math.ceil((pxH / pxW) * mmW) + 10;

    window.html2pdf()
      .set({
        margin: 0,
        filename: `${filename}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: "#ffffff",
          width: pxW,
          height: pxH,
          windowWidth: pxW,
          scrollX: 0,
          scrollY: 0,
        },
        jsPDF: {
          unit: "mm",
          format: [mmW, mmH],
          orientation: "portrait",
        },
      })
      .from(element)
      .save()
      .then(onSuccess)
      .catch(() => onError("PDF export failed. Please try again."));
  };

  loadHtml2Pdf(run, () => onError("PDF library failed to load. Check your connection."));
}
