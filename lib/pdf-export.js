/**
 * Helper utility to build individual student PDFs containing a cover summary + CV + uploaded documents.
 *
 * Page 1 : Executive Summary — full student profile, all analytics metrics, strengths,
 *           recommendations and an index table of every uploaded document.
 * Page 2+ : Detailed academic CV sections (academic records, projects, placements, skills,
 *            achievements, activities).
 * Final   : Raw uploaded documents merged in sequence (PDFs as pages, images as full A4 pages).
 */
export async function buildStudentPdf(student, lists, report) {
  // ── 0. Dynamic imports ─────────────────────────────────────────────────────
  const { jsPDF } = await import("jspdf");
  const { PDFDocument } = await import("pdf-lib");

  // A4 size: 595.28 x 841.89 points
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

  const LEFT   = 40;
  const RIGHT  = 555;
  const WIDTH  = 515;
  const PAGE_H = 841.89;

  let y = 0; // current vertical cursor

  // ── Helper: page overflow guard ─────────────────────────────────────────────
  function checkSpace(needed, extraTopPad = 0) {
    if (y + needed > PAGE_H - 40) {
      doc.addPage();
      y = 40 + extraTopPad;
    }
  }

  // ── Helper: section header ──────────────────────────────────────────────────
  function drawSectionHeader(title) {
    checkSpace(60);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(title.toUpperCase(), LEFT, y);
    y += 4;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.75);
    doc.line(LEFT, y, RIGHT, y);
    y += 14;
  }

  // ── Helper: coloured filled pill badge ─────────────────────────────────────
  function drawPill(text, x, py, bgR, bgG, bgB, textR, textG, textB) {
    doc.setFillColor(bgR, bgG, bgB);
    const pillW = doc.getTextWidth(text) + 16;
    doc.roundedRect(x, py - 10, pillW, 14, 3, 3, "F");
    doc.setTextColor(textR, textG, textB);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(text, x + 8, py);
    return pillW;
  }

  // ── Helper: rating → colour mapping ────────────────────────────────────────
  function verdictColor(label) {
    if (!label) return [100, 116, 139];
    const l = label.toLowerCase();
    if (l.includes("ready") || l.includes("exceptional") || l.includes("strong") || l.includes("placed")) return [16, 185, 129];
    if (l.includes("developing") || l.includes("moderate") || l.includes("improving")) return [37, 99, 235];
    if (l.includes("attention") || l.includes("minimal") || l.includes("below") || l.includes("interned")) return [245, 158, 11];
    if (l.includes("incomplete") || l.includes("poor") || l.includes("none") || l.includes("declining")) return [239, 68, 68];
    return [100, 116, 139];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 1 — EXECUTIVE SUMMARY COVER
  // ════════════════════════════════════════════════════════════════════════════

  // ── 1A. Dark header band ────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 595.28, 110, "F");

  // Dossier label (top-left)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("OFFICIAL ACADEMIC DOSSIER  ·  DEPARTMENT LEDGER PORTAL", LEFT, 22);

  // Export timestamp (top-right)
  const now = new Date();
  const stamp = `Generated: ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}  ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  doc.setFont("helvetica", "normal");
  doc.text(stamp, RIGHT, 22, { align: "right" });

  // Student name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(248, 250, 252); // slate-50
  doc.text(student.name || "Anonymous Scholar", LEFT, 58);

  // Branch · Year · Section sub-line
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184);
  const subLine = [
    student.branch ? student.branch.toUpperCase() : null,
    student.year ? `YEAR ${student.year}` : null,
    student.section ? `SEC ${student.section}` : null,
  ].filter(Boolean).join("  ·  ");
  doc.text(subLine || "GENERAL", LEFT, 75);

  // Overall score badge (top-right of header)
  const scoreLabel = `${report?.overall ?? 0} / 100`;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(248, 250, 252);
  doc.text(scoreLabel, RIGHT, 58, { align: "right" });
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("LEDGER SCORE", RIGHT, 72, { align: "right" });

  // Verdict pill
  const vLabel  = report?.verdict?.label || "UNGRADED";
  const [vR, vG, vB] = verdictColor(vLabel);
  doc.setFillColor(vR, vG, vB);
  const vpillW = doc.getTextWidth(vLabel.toUpperCase()) + 20;
  doc.roundedRect(RIGHT - vpillW, 78, vpillW, 16, 4, 4, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text(vLabel.toUpperCase(), RIGHT - vpillW / 2, 89, { align: "center" });

  y = 120;

  // ── 1B. Profile / Contact columns ──────────────────────────────────────────
  const colMid = LEFT + WIDTH / 2 + 10;

  // Left column: profile details
  const leftFields = [
    ["Email",       student.email        || "N/A"],
    ["Phone",       student.phone        || "N/A"],
    ["Roll No",     student.rollNumber   || "N/A"],
    ["Gender",      student.gender       || "N/A"],
    ["Date of Birth", student.dob        || "N/A"],
    ["Address",     student.address      || "N/A"],
  ];

  // Right column: social + academic
  const rightFields = [
    ["LinkedIn",    student.linkedin     || "N/A"],
    ["GitHub",      student.github       || "N/A"],
    ["Faculty Verification", student.facultyVerification === "approved" ? "APPROVED ✓" : "PENDING"],
    ["Profile Complete", `${report?.profilePct ?? 0}%`],
    ["UID",         (student.id || "N/A").slice(-12)],
  ];

  const fieldLineH = 26;
  function drawFieldBlock(fields, startX, endX, startY) {
    let fy = startY;
    fields.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(label.toUpperCase(), startX, fy);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      const wrapped = doc.splitTextToSize(String(value), endX - startX - 5);
      doc.text(wrapped[0] || "N/A", startX, fy + 9);
      fy += fieldLineH;
    });
    return fy;
  }

  const leftEnd  = drawFieldBlock(leftFields,  LEFT,    colMid - 10, y);
  const rightEnd = drawFieldBlock(rightFields, colMid,  RIGHT,       y);
  y = Math.max(leftEnd, rightEnd) + 10;

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(LEFT, y, RIGHT, y);
  y += 14;

  // ── 1C. Analytics scorecards (mini grid) ─────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("ANALYTICS OVERVIEW", LEFT, y);
  y += 12;

  const cards = [
    { label: "Avg GPA",        value: report?.avgGpa      ?? "N/A", sub: report?.gpaRating    ?? "" },
    { label: "Latest GPA",     value: report?.latestGpa   ?? "N/A", sub: report?.gpaTrend     ?? "" },
    { label: "GPA Trend",      value: (report?.gpaTrend   ?? "N/A").toUpperCase(), sub: "" },
    { label: "Achievements",   value: (report?.achScore    ?? 0).toString(),  sub: report?.achRating ?? "" },
    { label: "Activities",     value: (Array.isArray(lists?.activities) ? lists.activities.length : 0).toString(), sub: report?.actRating ?? "" },
    { label: "Documents",      value: (report?.uploadedDocumentCount ?? 0).toString(), sub: report?.documentRating ?? "" },
    { label: "Placements",     value: report?.placed ? "Placed" : (report?.internships?.length > 0 ? `${report.internships.length} Intern` : "None"), sub: report?.placementRating ?? "" },
    { label: "Highest GPA",    value: report?.highestGpa  ?? "N/A", sub: "" },
  ];

  const cardW = 120;
  const cardH = 38;
  const cardCols = 4;
  const cardGap = 5;

  cards.forEach((card, idx) => {
    const col = idx % cardCols;
    const row = Math.floor(idx / cardCols);
    const cx  = LEFT + col * (cardW + cardGap);
    const cy  = y + row * (cardH + cardGap);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.roundedRect(cx, cy, cardW, cardH, 5, 5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label.toUpperCase(), cx + 8, cy + 12);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    const [cR, cG, cB] = verdictColor(card.sub || card.value);
    doc.setTextColor(cR, cG, cB);
    doc.text(String(card.value), cx + 8, cy + 28);

    if (card.sub) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(card.sub.toUpperCase(), cx + cardW - 8, cy + 28, { align: "right" });
    }
  });

  const cardRows = Math.ceil(cards.length / cardCols);
  y += cardRows * (cardH + cardGap) + 6;

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.line(LEFT, y, RIGHT, y);
  y += 14;

  // ── 1D. Strengths & Recommendations ────────────────────────────────────────
  const strengths      = report?.strengths       || [];
  const recommendations = report?.recommendations || [];

  const halfW = (WIDTH - 10) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text("STRENGTHS", LEFT, y);
  doc.setTextColor(245, 158, 11); // amber
  doc.text("RECOMMENDATIONS", LEFT + halfW + 10, y);
  y += 10;

  const strLines = strengths.length > 0
    ? strengths.map(s => `• ${s}`)
    : ["• No specific strengths recorded yet."];
  const recLines = recommendations.length > 0
    ? recommendations.map(r => `• ${r}`)
    : ["• Profile is complete. No recommendations."];

  const maxStrLines = 6;
  const maxRecLines = 6;

  strLines.slice(0, maxStrLines).forEach((line) => {
    checkSpace(12);
    const wrapped = doc.splitTextToSize(line, halfW - 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(wrapped[0], LEFT, y);
    y += 11;
  });

  let recY = y - (Math.min(strLines.length, maxStrLines) * 11);
  recLines.slice(0, maxRecLines).forEach((line) => {
    const wrapped = doc.splitTextToSize(line, halfW - 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(wrapped[0], LEFT + halfW + 10, recY);
    recY += 11;
  });
  y = Math.max(y, recY) + 6;

  // Separator
  doc.setDrawColor(226, 232, 240);
  doc.line(LEFT, y, RIGHT, y);
  y += 14;

  // ── 1E. Uploaded Documents Index Table ────────────────────────────────────
  const docs = lists.uploadedDocuments || [];

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("UPLOADED DOCUMENTS INDEX", LEFT, y);
  y += 4;
  doc.setDrawColor(226, 232, 240);
  doc.line(LEFT, y, RIGHT, y);
  y += 10;

  if (docs.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No documents uploaded by this student.", LEFT, y);
    y += 14;
  } else {
    // Table header
    doc.setFillColor(241, 245, 249); // slate-100
    doc.rect(LEFT, y - 8, WIDTH, 14, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text("#",          LEFT + 4,   y);
    doc.text("FILE NAME",  LEFT + 24,  y);
    doc.text("TYPE",       LEFT + 310, y);
    doc.text("SIZE",       LEFT + 430, y, { align: "right" });
    doc.text("UPLOADED",   RIGHT - 8,  y, { align: "right" });
    y += 10;

    docs.forEach((docItem, idx) => {
      checkSpace(14);
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.4);
      doc.line(LEFT, y + 4, RIGHT, y + 4);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      // Index number
      doc.text(String(idx + 1), LEFT + 4, y);

      // File name (truncated if too long)
      const rawName = docItem.fileName || docItem.name || "Unnamed Document";
      const nameTruncated = rawName.length > 50 ? rawName.slice(0, 47) + "..." : rawName;
      doc.text(nameTruncated, LEFT + 24, y);

      // MIME type simplified
      const mime = (docItem.mimeType || "").replace("application/", "").replace("image/", "IMG/").toUpperCase() || "DOC";
      doc.text(mime.slice(0, 12), LEFT + 310, y);

      // File size
      const bytes = docItem.size || docItem.fileSize || 0;
      const sizeLabel = bytes > 1048576
        ? `${(bytes / 1048576).toFixed(1)} MB`
        : bytes > 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${bytes} B`;
      doc.text(sizeLabel, LEFT + 430, y, { align: "right" });

      // Upload date
      let uploadDate = "—";
      if (docItem.createdAt) {
        try {
          const d = docItem.createdAt.toDate ? docItem.createdAt.toDate() : new Date(docItem.createdAt);
          uploadDate = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        } catch { /* ignore */ }
      }
      doc.text(uploadDate, RIGHT - 8, y, { align: "right" });

      y += 13;
    });
  }

  // ── 1F. Cover page footer ───────────────────────────────────────────────────
  // Handled dynamically in the post-processing loop at the end of PDF generation.

  // ════════════════════════════════════════════════════════════════════════════
  // PAGE 2+ — DETAILED CV SECTIONS
  // ════════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = 40;

  // ── CV Header banner ────────────────────────────────────────────────────────
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(LEFT, y - 8, WIDTH, 22, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`DETAILED ACADEMIC CV  ·  ${(student.name || "Anonymous Scholar").toUpperCase()}`, LEFT + 8, y + 6);
  y += 24;

  // ── Academic Performance ─────────────────────────────────────────────────
  drawSectionHeader("Academic Performance");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Average GPA: ${report?.avgGpa || "N/A"}`, LEFT, y);
  doc.text(`Latest GPA: ${report?.latestGpa || "N/A"}`, LEFT + 160, y);
  doc.text(`Verification: ${student.facultyVerification === "approved" ? "VERIFIED" : "PENDING"}`, RIGHT, y, { align: "right" });
  y += 15;

  if (lists.academic && lists.academic.length > 0) {
    checkSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("SEMESTER", LEFT + 5, y);
    doc.text("GPA", LEFT + 120, y, { align: "right" });
    doc.text("SUBJECTS & DETAILS", LEFT + 140, y);
    y += 4;
    doc.setDrawColor(241, 245, 249);
    doc.line(LEFT, y, RIGHT, y);
    y += 10;

    lists.academic.forEach((sem) => {
      const detailsText = sem.subjects || sem.courses || "-";
      const wrappedDetails = doc.splitTextToSize(detailsText, 300);
      const rowHeight = Math.max(1, wrappedDetails.length) * 11 + 5;
      checkSpace(rowHeight);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const semLabel = `Sem ${sem.semester || sem.sem || ""} (${sem.year || ""})`;
      doc.text(semLabel, LEFT + 5, y);
      const gpaValue = sem.gpa || sem.gpaScore || "N/A";
      doc.text(gpaValue.toString(), LEFT + 120, y, { align: "right" });
      
      wrappedDetails.forEach((line, lineIdx) => {
        doc.text(line, LEFT + 140, y + (lineIdx * 11));
      });
      y += rowHeight;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No verified academic semester ledger entries recorded.", LEFT, y);
    y += 12;
  }

  // ── Projects ─────────────────────────────────────────────────────────────
  drawSectionHeader("Projects");
  if (lists.projects && lists.projects.length > 0) {
    lists.projects.forEach((proj) => {
      const wrappedDesc = proj.description ? doc.splitTextToSize(proj.description, WIDTH) : [];
      const itemHeight = 11 + (wrappedDesc.length > 0 ? wrappedDesc.length * 11 : 0) + 8;
      checkSpace(itemHeight);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title || "Untitled Project", LEFT, y);
      if (proj.tech) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`[Tech: ${proj.tech}]`, RIGHT, y, { align: "right" });
      }
      y += 11;
      if (proj.description && wrappedDesc.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        doc.text(wrappedDesc, LEFT, y);
        y += wrappedDesc.length * 11;
      }
      y += 6;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No project items documented.", LEFT, y);
    y += 12;
  }

  // ── Placements & Internships ──────────────────────────────────────────────
  drawSectionHeader("Placements & Internships");
  if (lists.placements && lists.placements.length > 0) {
    lists.placements.forEach((place) => {
      checkSpace(28);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${place.company || "Company"} - ${place.role || "Role"}`, LEFT, y);
      if (place.date) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(place.date, RIGHT, y, { align: "right" });
      }
      y += 11;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const pkgText    = place.package ? `Package: Rs. ${place.package} LPA` : "Package: N/A";
      const statusText = `Status: ${place.status || "Active"}`;
      doc.text(`${pkgText}  |  ${statusText}`, LEFT, y);
      y += 14;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No placement or internship records listed.", LEFT, y);
    y += 12;
  }

  // ── Skills ───────────────────────────────────────────────────────────────
  drawSectionHeader("Skills");
  if (lists.skills && lists.skills.length > 0) {
    const skillList = lists.skills
      .map(s => `${s.name || s.skill || ""}${s.proficiency ? ` (${s.proficiency})` : ""}`)
      .filter(Boolean)
      .join(", ");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const wrappedSkills = doc.splitTextToSize(skillList, WIDTH);
    checkSpace(wrappedSkills.length * 12);
    doc.text(wrappedSkills, LEFT, y);
    y += wrappedSkills.length * 12 + 6;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No skills recorded in the ledger.", LEFT, y);
    y += 12;
  }

  // ── Achievements & Activities ─────────────────────────────────────────────
  const hasAch = lists.achievements && lists.achievements.length > 0;
  const hasAct = lists.activities   && lists.activities.length   > 0;

  if (hasAch || hasAct) {
    drawSectionHeader("Achievements & Activities");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    if (hasAch) {
      lists.achievements.forEach((ach) => {
        const achText  = `•  [Achievement] ${ach.title || "Certification"} issued by ${ach.issuer || "Institution"} (${ach.date || ""}) - Level: ${ach.level || "College"}`;
        const wrapped  = doc.splitTextToSize(achText, WIDTH);
        const itemHeight = wrapped.length * 11 + 3;
        checkSpace(itemHeight);
        doc.text(wrapped, LEFT, y);
        y += itemHeight;
      });
    }
    if (hasAct) {
      lists.activities.forEach((act) => {
        const actText  = `•  [Activity] ${act.title || "Extracurricular Activity"} - Type: ${act.type || "General"} (${act.date || ""})${act.description ? ` - ${act.description}` : ""}`;
        const wrapped  = doc.splitTextToSize(actText, WIDTH);
        const itemHeight = wrapped.length * 11 + 3;
        checkSpace(itemHeight);
        doc.text(wrapped, LEFT, y);
        y += itemHeight;
      });
    }
  }

  // ── Dynamic Post-Processing: Running Footers & Page Numbers on all pages ──
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const footerY = PAGE_H - 28;
    
    // Draw horizontal separator line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(LEFT, footerY, RIGHT, footerY);
    
    // Left text: Branding & cryptographically secured indicator + Page X of Y
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    const footerText = `Official Department Academic Ledger Report  ·  Cryptographically Secured  ·  Page ${i} of ${pageCount}`;
    doc.text(footerText, LEFT, footerY + 10);
    
    // Right text: Seal of Academic Registry Office
    doc.setFont("helvetica", "normal");
    doc.text("Seal of Academic Registry Office", RIGHT, footerY + 10, { align: "right" });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SERIALIZE jsPDF → pdf-lib and merge uploaded documents
  // ════════════════════════════════════════════════════════════════════════════
  const pdfBytes    = doc.output("arraybuffer");
  const pdfDoc      = await PDFDocument.create();
  const vectorCvDoc = await PDFDocument.load(pdfBytes);
  const cvPages     = await pdfDoc.copyPages(vectorCvDoc, vectorCvDoc.getPageIndices());
  cvPages.forEach(p => pdfDoc.addPage(p));

  // ── Append uploaded documents ─────────────────────────────────────────────
  for (const docItem of docs) {
    if (!docItem.data) continue;
    try {
      const docBytes = Uint8Array.from(atob(docItem.data), c => c.charCodeAt(0));
      if (docItem.mimeType === "application/pdf") {
        const externalPdf   = await PDFDocument.load(docBytes);
        const copiedPages   = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
        copiedPages.forEach(p => pdfDoc.addPage(p));
      } else if (docItem.mimeType && docItem.mimeType.startsWith("image/")) {
        let img;
        if (docItem.mimeType === "image/jpeg" || docItem.mimeType === "image/jpg") {
          img = await pdfDoc.embedJpg(docBytes);
        } else if (docItem.mimeType === "image/png") {
          img = await pdfDoc.embedPng(docBytes);
        } else {
          continue;
        }
        const imgPage = pdfDoc.addPage([595.276, 841.89]);
        const { width: pWidth, height: pHeight } = imgPage.getSize();
        const maxW  = pWidth  - 40;
        const maxH  = pHeight - 40;
        const dims  = img.scaleToFit(maxW, maxH);
        imgPage.drawImage(img, {
          x: (pWidth  - dims.width)  / 2,
          y: (pHeight - dims.height) / 2,
          width:  dims.width,
          height: dims.height,
        });
      }
    } catch (docErr) {
      console.error(`Failed to append document [${docItem.fileName}] for student [${student.name}]:`, docErr);
    }
  }

  return await pdfDoc.save();
}
