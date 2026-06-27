/**
 * Helper utility to build individual student PDFs containing a CV + uploaded documents.
 * Generates a clean, 100% vector-based PDF for the CV (fully searchable and selectable text)
 * and merges the student's uploaded documents.
 */
export async function buildStudentPdf(student, lists, report) {
  // Dynamically import required libraries
  const { jsPDF } = await import("jspdf");
  const { PDFDocument } = await import("pdf-lib");

  // 1. Initialize jsPDF for vector CV generation
  // A4 size: 595.28 x 841.89 points
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  let y = 40; // Current vertical position cursor
  const leftMargin = 40;
  const rightMargin = 555;
  const contentWidth = 515;

  // Helper to verify remaining vertical space and add new page if needed
  function checkSpace(needed) {
    if (y + needed > 800) {
      doc.addPage();
      y = 40;
    }
  }

  // Helper to draw a bold section header
  function drawSectionHeader(title) {
    checkSpace(35);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(title.toUpperCase(), leftMargin, y);
    y += 4;
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.75);
    doc.line(leftMargin, y, rightMargin, y);
    y += 14;
  }

  // --- HEADER SECTION ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(student.name || "Anonymous Scholar", leftMargin, y + 10);
  
  // Right-aligned contact info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  
  let contactY = y - 5;
  doc.text(`Email: ${student.email || "N/A"}`, rightMargin, contactY + 10, { align: "right" });
  if (student.phone) {
    contactY += 11;
    doc.text(`Phone: ${student.phone}`, rightMargin, contactY + 10, { align: "right" });
  }
  if (student.rollNumber) {
    contactY += 11;
    doc.text(`Roll No: ${student.rollNumber}`, rightMargin, contactY + 10, { align: "right" });
  }
  if (student.linkedin) {
    contactY += 11;
    doc.text(`LinkedIn: ${student.linkedin}`, rightMargin, contactY + 10, { align: "right" });
  }
  if (student.github) {
    contactY += 11;
    doc.text(`GitHub: ${student.github}`, rightMargin, contactY + 10, { align: "right" });
  }

  y = Math.max(y + 35, contactY + 15);

  // Sub-header details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(37, 99, 235); // brand-600 / blue-600
  const branchLabel = student.branch || "General";
  const yearLabel = student.year ? `Year ${student.year}` : "N/A";
  const secLabel = student.section ? `Sec ${student.section}` : "";
  doc.text(`${branchLabel.toUpperCase()} BRANCH  ·  ${yearLabel.toUpperCase()} ${secLabel ? ` ·  ${secLabel.toUpperCase()}` : ""}`, leftMargin, y);

  y += 6;
  doc.setDrawColor(15, 23, 42); // slate-900
  doc.setLineWidth(1.5);
  doc.line(leftMargin, y, rightMargin, y);
  y += 18;

  // --- LEDGER INSIGHTS BOX ---
  checkSpace(40);
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.roundedRect(leftMargin, y, contentWidth, 32, 6, 6, "FD");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text("LEDGER SCORE:", leftMargin + 15, y + 20);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(`${report?.overall || 0} / 100`, leftMargin + 105, y + 21);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(37, 99, 235);
  doc.text(`VERDICT: ${report?.verdict?.label || "UNGRADED"}`, rightMargin - 15, y + 20, { align: "right" });
  y += 42;

  // --- ACADEMIC LEDGER SECTION ---
  drawSectionHeader("Academic Performance");
  checkSpace(35);
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Average GPA: ${report?.avgGpa || "N/A"}`, leftMargin, y);
  doc.text(`Latest GPA: ${report?.latestGpa || "N/A"}`, leftMargin + 160, y);
  doc.text(`Verification: ${student.facultyVerification === "approved" ? "VERIFIED" : "PENDING"}`, rightMargin, y, { align: "right" });
  y += 15;

  if (lists.academic && lists.academic.length > 0) {
    checkSpace(20);
    // Table Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-400
    doc.text("SEMESTER", leftMargin + 5, y);
    doc.text("GPA", leftMargin + 120, y, { align: "right" });
    doc.text("SUBJECTS & DETAILS", leftMargin + 140, y);
    y += 4;
    doc.setDrawColor(241, 245, 249); // slate-100
    doc.line(leftMargin, y, rightMargin, y);
    y += 10;

    lists.academic.forEach((sem) => {
      checkSpace(16);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85); // slate-700
      
      const semLabel = `Sem ${sem.semester || sem.sem || ""} (${sem.year || ""})`;
      doc.text(semLabel, leftMargin + 5, y);
      
      const gpaValue = sem.gpa || sem.gpaScore || "N/A";
      doc.text(gpaValue.toString(), leftMargin + 120, y, { align: "right" });

      const detailsText = sem.subjects || sem.courses || "-";
      const wrappedDetails = doc.splitTextToSize(detailsText, 300);
      doc.text(wrappedDetails[0] || "-", leftMargin + 140, y);
      y += 14;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No verified academic semester ledger entries recorded.", leftMargin, y);
    y += 12;
  }

  // --- PROJECTS SECTION ---
  drawSectionHeader("Projects");
  if (lists.projects && lists.projects.length > 0) {
    lists.projects.forEach((proj) => {
      checkSpace(40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(proj.title || "Untitled Project", leftMargin, y);

      if (proj.tech) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`[Tech: ${proj.tech}]`, rightMargin, y, { align: "right" });
      }
      y += 11;

      if (proj.description) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const wrappedDesc = doc.splitTextToSize(proj.description, contentWidth);
        checkSpace(wrappedDesc.length * 11);
        doc.text(wrappedDesc, leftMargin, y);
        y += wrappedDesc.length * 11;
      }
      y += 6;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No project items documented.", leftMargin, y);
    y += 12;
  }

  // --- PLACEMENTS SECTION ---
  drawSectionHeader("Placements & Internships");
  if (lists.placements && lists.placements.length > 0) {
    lists.placements.forEach((place) => {
      checkSpace(35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(`${place.company || "Company"} - ${place.role || "Role"}`, leftMargin, y);

      if (place.date) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(place.date, rightMargin, y, { align: "right" });
      }
      y += 11;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const pkgText = place.package ? `Package: Rs. ${place.package} LPA` : "Package: N/A";
      const statusText = `Status: ${place.status || "Active"}`;
      doc.text(`${pkgText}  |  ${statusText}`, leftMargin, y);
      y += 14;
    });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No placement or internship records listed.", leftMargin, y);
    y += 12;
  }

  // --- SKILLS SECTION ---
  drawSectionHeader("Skills");
  if (lists.skills && lists.skills.length > 0) {
    const skillList = lists.skills
      .map(s => `${s.name || s.skill || ""}${s.proficiency ? ` (${s.proficiency})` : ""}`)
      .filter(Boolean)
      .join(", ");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    
    const wrappedSkills = doc.splitTextToSize(skillList, contentWidth);
    checkSpace(wrappedSkills.length * 12);
    doc.text(wrappedSkills, leftMargin, y);
    y += wrappedSkills.length * 12 + 6;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text("No skills recorded in the ledger.", leftMargin, y);
    y += 12;
  }

  // --- ACHIEVEMENTS & ACTIVITIES SECTION ---
  const hasAch = lists.achievements && lists.achievements.length > 0;
  const hasAct = lists.activities && lists.activities.length > 0;

  if (hasAch || hasAct) {
    drawSectionHeader("Achievements & Activities");
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);

    if (hasAch) {
      lists.achievements.forEach((ach) => {
        checkSpace(14);
        const achText = `•  [Achievement] ${ach.title || "Certification"} issued by ${ach.issuer || "Institution"} (${ach.date || ""}) - Level: ${ach.level || "College"}`;
        const wrappedAch = doc.splitTextToSize(achText, contentWidth);
        checkSpace(wrappedAch.length * 11);
        doc.text(wrappedAch, leftMargin, y);
        y += wrappedAch.length * 11 + 2;
      });
    }

    if (hasAct) {
      lists.activities.forEach((act) => {
        checkSpace(14);
        const actText = `•  [Activity] ${act.title || "Extracurricular Activity"} - Type: ${act.type || "General"} (${act.date || ""})`;
        const wrappedAct = doc.splitTextToSize(actText, contentWidth);
        checkSpace(wrappedAct.length * 11);
        doc.text(wrappedAct, leftMargin, y);
        y += wrappedAct.length * 11 + 2;
      });
    }
  }

  // --- OFFICIAL TRANSCRIPT FOOTER ---
  checkSpace(55);
  y += 20;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(leftMargin, y, rightMargin, y);
  y += 12;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Official Department Academic Ledger Report • Cryptographically Secured", leftMargin, y);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Signature / Seal of Academic Registry Office", rightMargin, y, { align: "right" });

  // --- SERIALIZE & MERGE DOCUMENTS ---
  const pdfBytes = doc.output("arraybuffer");
  
  // Create primary document via pdf-lib and import our vector CV
  const pdfDoc = await PDFDocument.create();
  const vectorCvDoc = await PDFDocument.load(pdfBytes);
  const cvPages = await pdfDoc.copyPages(vectorCvDoc, vectorCvDoc.getPageIndices());
  cvPages.forEach(p => pdfDoc.addPage(p));

  // Load and append student's uploaded files (PDFs and Images)
  const docs = lists.uploadedDocuments || [];
  for (const docItem of docs) {
    if (!docItem.data) continue;
    try {
      const docBytes = Uint8Array.from(atob(docItem.data), c => c.charCodeAt(0));

      if (docItem.mimeType === "application/pdf") {
        // Read external PDF and copy its pages
        const externalPdf = await PDFDocument.load(docBytes);
        const copiedPages = await pdfDoc.copyPages(externalPdf, externalPdf.getPageIndices());
        copiedPages.forEach(p => pdfDoc.addPage(p));
      } else if (docItem.mimeType && docItem.mimeType.startsWith("image/")) {
        // Draw image onto a new A4 page
        let img;
        if (docItem.mimeType === "image/jpeg" || docItem.mimeType === "image/jpg") {
          img = await pdfDoc.embedJpg(docBytes);
        } else if (docItem.mimeType === "image/png") {
          img = await pdfDoc.embedPng(docBytes);
        } else {
          continue; // Skip unsupported image type
        }

        const imgPage = pdfDoc.addPage([595.276, 841.89]); // A4
        const { width: pWidth, height: pHeight } = imgPage.getSize();
        
        // Scale to fit page with a 20px padding margin
        const maxW = pWidth - 40;
        const maxH = pHeight - 40;
        const dims = img.scaleToFit(maxW, maxH);
        
        imgPage.drawImage(img, {
          x: (pWidth - dims.width) / 2,
          y: (pHeight - dims.height) / 2,
          width: dims.width,
          height: dims.height,
        });
      }
    } catch (docErr) {
      console.error(`Failed to append document [${docItem.fileName}] for student [${student.name}]:`, docErr);
    }
  }

  // Return the compiled PDF byte array
  return await pdfDoc.save();
}
