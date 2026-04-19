import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const BRAND = 'Plinth';
const MONO = 'courier';

function header(doc, title, subtitle) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(BRAND, 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Construction Account Book', 14, 22);
  doc.setTextColor(0);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 32);
  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(subtitle, 14, 38);
    doc.setTextColor(0);
  }
  doc.setDrawColor(200);
  doc.line(14, 42, doc.internal.pageSize.width - 14, 42);
}

function footer(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont(MONO, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `Page ${i} of ${pageCount}  ·  Generated ${new Date().toLocaleDateString('en-IN')}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }
}

export function exportExpensesPDF({ expenses, vendors, clients, filterLabel = 'All entries' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const subtitle = `Vendor Expenses  ·  ${filterLabel}  ·  ${expenses.length} entries`;
  header(doc, 'Expense Journal', subtitle);

  const total = expenses.reduce((a, b) => a + Number(b.amount), 0);

  autoTable(doc, {
    startY: 46,
    head: [['Date', 'Vendor', 'Client', 'Description', 'Amount (₹)']],
    body: expenses.map((e) => {
      const v = vendors.find((x) => x.id === e.vendor_id);
      const c = clients.find((x) => x.id === e.client_id);
      return [
        e.date,
        v?.name || '—',
        c?.short || '—',
        e.description || '—',
        Math.round(Number(e.amount)).toLocaleString('en-IN'),
      ];
    }),
    foot: [['', '', '', 'Total', Math.round(total).toLocaleString('en-IN')]],
    headStyles: { fillColor: [31, 60, 110], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right', font: MONO } },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`expenses_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportGeneralExpensesPDF({ expenses, clients, filterLabel = 'All entries' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const subtitle = `Overhead Expenses  ·  ${filterLabel}  ·  ${expenses.length} entries`;
  header(doc, 'General Expenses', subtitle);

  const total = expenses.reduce((a, b) => a + Number(b.amount), 0);

  autoTable(doc, {
    startY: 46,
    head: [['Date', 'Category', 'Client', 'Description', 'Amount (₹)']],
    body: expenses.map((e) => {
      const c = clients.find((x) => x.id === e.client_id);
      return [
        e.date,
        e.category,
        c?.short || 'Site-wide',
        e.description || '—',
        Math.round(Number(e.amount)).toLocaleString('en-IN'),
      ];
    }),
    foot: [['', '', '', 'Total', Math.round(total).toLocaleString('en-IN')]],
    headStyles: { fillColor: [31, 60, 110], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right', font: MONO } },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`overhead_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportPaymentsPDF({ payments, vendors, clients, filterLabel = 'All entries' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const subtitle = `Vendor Payments  ·  ${filterLabel}  ·  ${payments.length} entries`;
  header(doc, 'Vendor Payments', subtitle);

  const total = payments.reduce((a, b) => a + Number(b.amount), 0);

  autoTable(doc, {
    startY: 46,
    head: [['Date', 'Vendor', 'Client', 'Note', 'Amount (₹)']],
    body: payments.map((p) => {
      const v = vendors.find((x) => x.id === p.vendor_id);
      const c = clients.find((x) => x.id === p.client_id);
      return [
        p.date,
        v?.name || '—',
        c?.short || '—',
        p.note || '—',
        Math.round(Number(p.amount)).toLocaleString('en-IN'),
      ];
    }),
    foot: [['', '', '', 'Total', Math.round(total).toLocaleString('en-IN')]],
    headStyles: { fillColor: [31, 60, 110], fontSize: 8, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 4: { halign: 'right', font: MONO } },
    alternateRowStyles: { fillColor: [250, 248, 244] },
    margin: { left: 14, right: 14 },
  });

  footer(doc);
  doc.save(`payments_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportVendorPDF({ vendor, expenses, payments, clients, periodLabel, companyName = '', userEmail = '' }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;

  // ── Header ────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Plinth', 14, 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text('Vendor Statement · Folio 06', 14, 22);
  doc.setTextColor(0);

  if (companyName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80);
    doc.text(companyName, pageW - 14, 14, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(140);
    doc.setFontSize(7.5);
    doc.text(userEmail, pageW - 14, 20, { align: 'right' });
    doc.setTextColor(0);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(vendor ? vendor.name : 'All Vendors', 14, 32);

  if (vendor) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(`${vendor.trade || ''}  ·  ${vendor.contact || ''}`, 14, 38);
    doc.setTextColor(0);
  }

  doc.setFontSize(8.5);
  doc.setTextColor(120);
  doc.text(periodLabel, 14, vendor ? 44 : 40);
  doc.setTextColor(0);

  doc.setDrawColor(200);
  doc.line(14, vendor ? 48 : 44, pageW - 14, vendor ? 48 : 44);

  let curY = vendor ? 52 : 48;

  // ── Supplies table ────────────────────────────────────────
  if (expenses.length > 0) {
    const totalGiven = expenses.reduce((a, b) => a + Number(b.amount), 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text('SUPPLIES & WORK GIVEN', 14, curY);
    doc.setTextColor(0);
    curY += 3;

    autoTable(doc, {
      startY: curY,
      head: [['Date', 'Client', 'Description', 'Amount (₹)']],
      body: expenses.map((e) => {
        const c = clients.find((x) => x.id === e.client_id);
        return [e.date, c?.short || '—', e.description || '—', Math.round(Number(e.amount)).toLocaleString('en-IN')];
      }),
      foot: [['', '', 'Total supplied', Math.round(totalGiven).toLocaleString('en-IN')]],
      headStyles: { fillColor: [31, 60, 110], fontSize: 8, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right', font: MONO } },
      alternateRowStyles: { fillColor: [250, 248, 244] },
      margin: { left: 14, right: 14 },
    });
    curY = doc.lastAutoTable.finalY + 8;
  }

  // ── Payments table ────────────────────────────────────────
  if (payments.length > 0) {
    const totalPaid = payments.reduce((a, b) => a + Number(b.amount), 0);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(90);
    doc.text('PAYMENTS MADE', 14, curY);
    doc.setTextColor(0);
    curY += 3;

    autoTable(doc, {
      startY: curY,
      head: [['Date', 'Client', 'Note', 'Amount (₹)']],
      body: payments.map((p) => {
        const c = clients.find((x) => x.id === p.client_id);
        return [p.date, c?.short || '—', p.note || '—', Math.round(Number(p.amount)).toLocaleString('en-IN')];
      }),
      foot: [['', '', 'Total paid', Math.round(totalPaid).toLocaleString('en-IN')]],
      headStyles: { fillColor: [47, 122, 58], fontSize: 8, fontStyle: 'bold' },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 8.5 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right', font: MONO } },
      alternateRowStyles: { fillColor: [244, 250, 244] },
      margin: { left: 14, right: 14 },
    });
    curY = doc.lastAutoTable.finalY + 8;
  }

  // ── Balance summary ───────────────────────────────────────
  const totalGiven = expenses.reduce((a, b) => a + Number(b.amount), 0);
  const totalPaid = payments.reduce((a, b) => a + Number(b.amount), 0);
  const balance = totalGiven - totalPaid;

  const summaryY = Math.min(curY, doc.internal.pageSize.height - 40);
  doc.setDrawColor(200);
  doc.line(14, summaryY, pageW - 14, summaryY);

  const cols = [
    { label: 'Total Supplied', value: `\u20B9 ${Math.round(totalGiven).toLocaleString('en-IN')}` },
    { label: 'Total Paid', value: `\u20B9 ${Math.round(totalPaid).toLocaleString('en-IN')}` },
    { label: balance > 0 ? 'Still Owed' : balance < 0 ? 'Overpaid' : 'Settled', value: `\u20B9 ${Math.round(Math.abs(balance)).toLocaleString('en-IN')}` },
  ];
  const colW = (pageW - 28) / 3;
  cols.forEach((col, i) => {
    const x = 14 + i * colW;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120);
    doc.text(col.label.toUpperCase(), x, summaryY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(balance > 0 && i === 2 ? 180 : balance < 0 && i === 2 ? 60 : 0, balance < 0 && i === 2 ? 100 : 0, 0);
    doc.text(col.value, x, summaryY + 13);
    doc.setTextColor(0);
  });

  footer(doc);

  const safeName = (vendor?.name || 'all-vendors').replace(/\s+/g, '-').toLowerCase();
  doc.save(`${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
