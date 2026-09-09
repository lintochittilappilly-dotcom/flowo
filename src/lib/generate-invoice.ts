/**
 * Generates a beautiful branded HTML invoice and opens it in a new tab for printing/downloading.
 */

interface InvoiceData {
  invoiceId: string;
  invoiceDate: string;
  plan: string;
  amount: number; // in cents
  currency: string;
  status: string;
  customer: {
    name: string;
    email: string;
    businessName?: string;
  };
}

const COMPANY = {
  name: "Flowo",
  tagline: "AI-Powered Social Media Management",
  email: "billing@flowo.com",
  website: "flowo.com",
  address: "123 Innovation Drive, Suite 400\nSan Francisco, CA 94107, USA",
};

export function generateInvoiceHTML(data: InvoiceData): string {
  const amountFormatted = `$${(data.amount / 100).toFixed(2)}`;
  const dateFormatted = new Date(data.invoiceDate).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const invoiceNumber = `INV-${data.invoiceId.slice(0, 8).toUpperCase()}`;
  const planName = data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : "Pro";
  const isPaid = data.status === "paid";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoiceNumber} — ${COMPANY.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8f9fb;
      color: #1a1a2e;
      padding: 40px 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .invoice-container {
      max-width: 680px;
      margin: 0 auto;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04);
      overflow: hidden;
    }

    /* Header gradient band */
    .header-band {
      background: linear-gradient(135deg, #6D28D9 0%, #EC4899 100%);
      padding: 36px 40px 32px;
      color: #fff;
    }

    .header-band .logo-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .header-band .brand {
      font-size: 28px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }

    .header-band .brand-sub {
      font-size: 11px;
      font-weight: 500;
      opacity: 0.8;
      margin-top: 2px;
    }

    .header-band .invoice-label {
      text-align: right;
    }

    .header-band .invoice-label h2 {
      font-size: 13px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      opacity: 0.85;
    }

    .header-band .invoice-label .inv-number {
      font-size: 16px;
      font-weight: 700;
      margin-top: 4px;
    }

    /* Status badge */
    .status-badge {
      display: inline-block;
      margin-top: 20px;
      padding: 5px 16px;
      border-radius: 50px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-paid {
      background: rgba(255,255,255,0.2);
      color: #fff;
      backdrop-filter: blur(4px);
    }

    .status-unpaid {
      background: rgba(255,100,100,0.3);
      color: #fff;
    }

    /* Body */
    .invoice-body {
      padding: 36px 40px 40px;
    }

    /* Details grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-bottom: 36px;
    }

    .detail-block label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #9ca3af;
      margin-bottom: 8px;
    }

    .detail-block p {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a2e;
      line-height: 1.6;
    }

    .detail-block p.muted {
      color: #6b7280;
      font-size: 12px;
    }

    /* Divider */
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
      margin: 4px 0 28px;
    }

    /* Line items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }

    .items-table thead th {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #9ca3af;
      padding: 0 0 12px;
      text-align: left;
    }

    .items-table thead th:last-child {
      text-align: right;
    }

    .items-table tbody td {
      padding: 16px 0;
      border-top: 1px solid #f3f4f6;
      font-size: 13px;
      font-weight: 500;
      color: #1a1a2e;
    }

    .items-table tbody td:last-child {
      text-align: right;
      font-weight: 600;
    }

    .item-desc {
      color: #6b7280;
      font-size: 11px;
      font-weight: 400;
      margin-top: 2px;
    }

    /* Totals */
    .totals {
      margin-top: 24px;
      border-top: 2px solid #1a1a2e;
      padding-top: 16px;
      display: flex;
      justify-content: flex-end;
    }

    .totals-table {
      min-width: 240px;
    }

    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: #6b7280;
    }

    .totals-row.total {
      font-size: 18px;
      font-weight: 800;
      color: #1a1a2e;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      margin-top: 6px;
    }

    /* Footer */
    .invoice-footer {
      margin-top: 40px;
      padding: 24px 0 0;
      border-top: 1px solid #f3f4f6;
      text-align: center;
    }

    .invoice-footer p {
      font-size: 11px;
      color: #9ca3af;
      line-height: 1.6;
    }

    .invoice-footer a {
      color: #6D28D9;
      text-decoration: none;
      font-weight: 600;
    }

    .thank-you {
      display: inline-block;
      margin-bottom: 12px;
      padding: 8px 24px;
      border-radius: 50px;
      background: linear-gradient(135deg, #6D28D9 0%, #EC4899 100%);
      color: #fff;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Print styles */
    @media print {
      body { 
        padding: 0; 
        background: #fff; 
      }
      .invoice-container { 
        box-shadow: none; 
        border-radius: 0; 
      }
      .no-print { display: none !important; }
    }

    /* Print button */
    .print-bar {
      max-width: 680px;
      margin: 0 auto 20px;
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .print-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.15s;
    }

    .print-btn-primary {
      background: linear-gradient(135deg, #6D28D9, #EC4899);
      color: #fff;
    }

    .print-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

    .print-btn-secondary {
      background: #f3f4f6;
      color: #374151;
    }

    .print-btn-secondary:hover { background: #e5e7eb; }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <button class="print-btn print-btn-secondary" onclick="window.close()">← Back</button>
    <button class="print-btn print-btn-primary" onclick="window.print()">
      <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      Download / Print
    </button>
  </div>

  <div class="invoice-container">
    <div class="header-band">
      <div class="logo-row">
        <div>
          <div class="brand">✦ ${COMPANY.name}</div>
          <div class="brand-sub">${COMPANY.tagline}</div>
        </div>
        <div class="invoice-label">
          <h2>Invoice</h2>
          <div class="inv-number">${invoiceNumber}</div>
        </div>
      </div>
      <span class="status-badge ${isPaid ? "status-paid" : "status-unpaid"}">
        ${isPaid ? "✓ Paid" : "⏳ Pending"}
      </span>
    </div>

    <div class="invoice-body">
      <div class="details-grid">
        <div class="detail-block">
          <label>Bill To</label>
          <p>${data.customer.name || "Customer"}</p>
          ${data.customer.businessName ? `<p>${data.customer.businessName}</p>` : ""}
          <p class="muted">${data.customer.email || ""}</p>
        </div>
        <div class="detail-block" style="text-align:right;">
          <label>From</label>
          <p>${COMPANY.name}</p>
          <p class="muted">${COMPANY.address.replace("\n", "<br>")}</p>
          <p class="muted">${COMPANY.email}</p>
        </div>
      </div>

      <div class="details-grid">
        <div class="detail-block">
          <label>Invoice Date</label>
          <p>${dateFormatted}</p>
        </div>
        <div class="detail-block" style="text-align:right;">
          <label>Payment Method</label>
          <p>Credit Card (Stripe)</p>
        </div>
      </div>

      <div class="divider"></div>

      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              ${COMPANY.name} ${planName} Plan — Monthly Subscription
              <div class="item-desc">Full access to ${planName}-tier features for 1 month</div>
            </td>
            <td>${amountFormatted}</td>
          </tr>
        </tbody>
      </table>

      <div class="totals">
        <div class="totals-table">
          <div class="totals-row">
            <span>Subtotal</span>
            <span>${amountFormatted}</span>
          </div>
          <div class="totals-row">
            <span>Tax</span>
            <span>$0.00</span>
          </div>
          <div class="totals-row total">
            <span>Total</span>
            <span>${amountFormatted} ${(data.currency || "usd").toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div class="invoice-footer">
        <span class="thank-you">Thank you for your business!</span>
        <p>
          Questions about this invoice? Contact us at <a href="mailto:${COMPANY.email}">${COMPANY.email}</a>
        </p>
        <p style="margin-top:6px;">
          ${COMPANY.name} · <a href="https://${COMPANY.website}" target="_blank">${COMPANY.website}</a>
        </p>
      </div>
    </div>
  </div>

</body>
</html>`;
}

export function openInvoice(invoice: any, customerName: string, customerEmail: string, businessName?: string) {
  const html = generateInvoiceHTML({
    invoiceId: invoice.id || invoice.stripe_invoice_id || "000000",
    invoiceDate: invoice.created_at || new Date().toISOString(),
    plan: invoice.plan || "pro",
    amount: invoice.amount ?? 0,
    currency: invoice.currency || "usd",
    status: invoice.status || "paid",
    customer: {
      name: customerName,
      email: customerEmail,
      businessName,
    },
  });

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
