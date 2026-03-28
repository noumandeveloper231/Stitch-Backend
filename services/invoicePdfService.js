const PDFDocument = require("pdfkit");

function shopInfo() {
  return {
    name: process.env.SHOP_NAME || "Stitch Tailor",
    address: process.env.SHOP_ADDRESS || "",
    phone: process.env.SHOP_PHONE || "",
  };
}

function money(n) {
  const x = Number(n) || 0;
  return `Rs ${x.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function renderInvoicePdf(order) {
  const shop = shopInfo();
  const customer = order.customerId || {};
  const snap = order.measurementSnapshot;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48, size: "A4" });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const invId = String(order._id).slice(-8).toUpperCase();

    doc.fontSize(18).text(shop.name, { align: "center" });
    doc.moveDown(0.25);
    doc.fontSize(9).fillColor("#444");
    if (shop.address) doc.text(shop.address, { align: "center" });
    if (shop.phone) doc.text(shop.phone, { align: "center" });
    doc.fillColor("#000");
    doc.moveDown(1);

    doc.fontSize(14).text("Invoice", { continued: false });
    doc.fontSize(10).text(`Invoice #: INV-${invId}`);
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString()}`);
    doc.text(`Status: ${order.status || ""}`);
    doc.moveDown(1);

    doc.fontSize(11).text("Bill to", { underline: true });
    doc.fontSize(10);
    doc.text(customer.name || "—");
    if (customer.phone) doc.text(`Phone: ${customer.phone}`);
    if (customer.email) doc.text(`Email: ${customer.email}`);
    if (customer.address) doc.text(`Address: ${customer.address}`);
    doc.moveDown(1);

    if (snap && (snap.label || (snap.values && Object.keys(snap.values).length))) {
      doc.fontSize(11).text("Measurements (order snapshot)", { underline: true });
      doc.fontSize(10);
      if (snap.label) doc.text(`Label: ${snap.label}`);
      const vals = snap.values && typeof snap.values === "object" ? snap.values : {};
      Object.entries(vals).forEach(([k, v]) => {
        doc.text(`${k}: ${v === undefined || v === null ? "—" : String(v)}`);
      });
      doc.moveDown(1);
    }

    doc.fontSize(11).text("Order summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    const y0 = doc.y;
    doc.text("Total", 48, y0);
    doc.text(money(order.totalAmount), 400, y0, { width: 100, align: "right" });
    doc.moveDown(0.6);
    const y1 = doc.y;
    doc.text("Advance paid", 48, y1);
    doc.text(money(order.advance), 400, y1, { width: 100, align: "right" });
    doc.moveDown(0.6);
    const y2 = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("Balance due", 48, y2);
    doc.text(money(order.remaining), 400, y2, { width: 100, align: "right" });
    doc.font("Helvetica");
    doc.moveDown(1);

    if (order.deliveryDate) {
      doc.fontSize(10).text(
        `Delivery date: ${new Date(order.deliveryDate).toLocaleDateString()}`,
      );
    }
    if (order.notes) {
      doc.moveDown(0.5);
      doc.fontSize(10).text("Notes:", { underline: true });
      doc.text(order.notes, { width: 500 });
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#666").text("Thank you for your business.", { align: "center" });

    doc.end();
  });
}

module.exports = { renderInvoicePdf };
