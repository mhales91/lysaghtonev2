
export const generateTOEHTMLForPrint = (toe, client, signatureRecord = null, companySettings = null, includeStandardTerms = false) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount || 0);
  };

  const standardTermsHTML = includeStandardTerms ? `
    <div class="page-break">
      <h2 style="color: #5E0F68; border-bottom: 2px solid #5E0F68; padding-bottom: 10px; margin-top: 30px;">
        SCHEDULE 2 – STANDARD TERMS
      </h2>
      
      <h3 style="color: #333; margin-top: 20px;">1. Standard Terms</h3>
      <p><strong>1.1</strong> These Standard Terms apply to all services provided by the Firm to the Client, unless separate terms of engagement have been agreed by both parties.</p>
      <p><strong>1.2</strong> These Standard Terms may only be changed with the written agreement of both parties.</p>
      <p><strong>1.3</strong> If the Construction Contracts Act 2002 applies to the Services undertaken, then these Standard Terms are subject to that Act.</p>
      
      <h3 style="color: #333; margin-top: 20px;">2. Provision of Services</h3>
      <p><strong>2.1</strong> The Firm will provide the Services as described in Schedule 1.</p>
      <p><strong>2.2</strong> In providing the Services the Firm will use the degree of skill, care and diligence reasonably expected of a professional consultant providing services similar to the Services.</p>
      <p><strong>2.3</strong> Provision of the Services is subject to any financial, physical, time or other restraints imposed by the Client or a Regulatory Authority, or necessarily resulting from the nature of the project.</p>
      <p><strong>2.4</strong> The Firm may subcontract parts of the Services without the prior written consent of the Client, but if it does it will oversee the duties and responsibilities of the sub-contractor.</p>
      <p><strong>2.5</strong> Provision of the Services is subject to the Client providing all information and services required by the Firm as set out in Schedule 1.</p>
      <p><strong>2.6</strong> The Client must co-operate with the Firm and not obstruct the proper performance of the Services, including allowing the Firm reasonable access to the Site and other locations associated with the Services.</p>
      <p><strong>2.7</strong> As soon as the Client becomes aware of anything that will materially affect the scope or timing of the Services, the Client must inform the Firm in writing.</p>
      <p><strong>2.8</strong> The Firm may suspend the Services if it is unable to perform the Services due to an event or circumstance which is beyond its reasonable control including, but not limited to, act of God, work stoppage or other labour hindrance, public mains electrical supply failure, fire, flood, storm, explosion, earthquake, landslide, epidemic and quarantine restriction.</p>
      
      <h3 style="color: #333; margin-top: 20px;">3. Fees and other amounts to be paid</h3>
      <p><strong>3.1</strong> The fees for all services provided by the Firm to the Client will be calculated in the manner set out in the engagement letter to which these Standard Terms are attached. If no basis of charging has been agreed, the Firm may charge the Client a fair and reasonable fee.</p>
      <p><strong>3.2</strong> All fee estimates supplied to the Client by the Firm are based on the request by the Client for the work to be carried out and subject to any matters set out in the engagement letter to which these Standard Terms are attached and Schedule 1. Fee estimates are indicative only and the actual fee will be determined in accordance with clause 3.1.</p>
      <p><strong>3.3</strong> The Firm reserves the right to alter its fee (and revise any fee estimate) where the Services are affected as a result of:</p>
      <ul>
        <li><strong>3.3.1</strong> a lack of precision in the Client's instructions, or the Client provides more detailed instructions after a fee estimate is given;</li>
        <li><strong>3.3.2</strong> if the Client requires any changes which affect the scope of the project or the proposed program for the Service;</li>
        <li><strong>3.3.3</strong> an unforeseen matter arising affecting the effort required to complete the project or provide the Services or the project extends beyond the original proposed timeframe;</li>
        <li><strong>3.3.4</strong> where an assumption set out in Schedule 1 is not correct;</li>
        <li><strong>3.3.5</strong> where the Client fails to comply with its obligations under the Contract;</li>
        <li><strong>3.3.6</strong> where changes are made to any legislation (including subordinate laws) which affects the provision of Services; or</li>
        <li><strong>3.3.7</strong> where any other change occurs which affects the supply of the Services by the Firm.</li>
      </ul>
      <p><strong>3.4</strong> The Firm will give the Client notice of any material change to its fee (and any fee estimate) within a reasonable time of it becoming aware of a matter set out in clause 3.3.</p>
      <p><strong>3.5</strong> The Client shall pay to the Firm all disbursements, external expenses, and administrative fees reasonably incurred, paid or payable by the Firm in relation to the project or on behalf of the Client.</p>
      <p><strong>3.6</strong> Goods and services tax (GST) chargeable pursuant to the Goods and Services Tax Act 1985 (GST Act) will be added to the fees in relation to any part of the fees that is for a taxable supply under the GST Act.</p>
      
      <h3 style="color: #333; margin-top: 20px;">4. Payments</h3>
      <p><strong>4.1</strong> Where the Client is a joint venture, each party to the joint venture shall be jointly and severally liable for all payments of fees in relation to the Contract.</p>
      <p><strong>4.2</strong> The Firm may issue monthly payment claims under the Contract.</p>
      <p><strong>4.3</strong> The Firm's payment claims shall:</p>
      <ul>
        <li><strong>4.3.1</strong> Identify the Contract and relevant period to which the claim relates;</li>
        <li><strong>4.3.2</strong> Identify the services to which the claim relates;</li>
        <li><strong>4.3.3</strong> State the amount claimed and the manner in which the claimed amount has been calculated; and,</li>
        <li><strong>4.3.4</strong> State the due date for payment which shall be 14 days from the date the invoice was issued.</li>
      </ul>
      
      <h4 style="color: #333; margin-top: 15px;">Payment Schedules</h4>
      <p><strong>4.4</strong> If any payment claim is disputed, then the Client must, within seven days of receiving the payment claim, provide a notice to the Firm setting out the nature of the dispute. Any undisputed amount must be paid by the due date for payment.</p>
      <p><strong>4.5</strong> If the Construction Contracts Act 2002 applies to the Services, the Client must send the Firm a written Payment Schedule which complies with section 21 of the Construction Contracts Act 2002, within seven days of receiving the invoice and, include the following information:</p>
      <ul>
        <li><strong>4.5.1</strong> the undisputed amount to be paid; and,</li>
        <li><strong>4.5.2</strong> the reasons for not paying the full amount.</li>
      </ul>
      <p><strong>4.6</strong> Disputed payment claims shall be resolved in accordance with clause 12.</p>
      
      <h4 style="color: #333; margin-top: 15px;">Overdue payments</h4>
      <p><strong>4.7</strong> Interest may be charged by the Firm on all overdue payments at the rate of 1.5% per month of the total amount owing.</p>
      <p><strong>4.8</strong> The Client will indemnify the Firm against any costs, expenses and charges incurred or suffered by the Firm in recovering any unpaid amounts, including costs on a solicitor client basis.</p>
      
      <!-- Continue with additional standard terms sections as needed -->
      <p style="margin-top: 30px; font-size: 12px; color: #666;">
        This is a condensed version of the complete standard terms. The full terms and conditions are available upon request.
      </p>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Terms of Engagement - ${toe.project_title}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background: white;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #5E0F68;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #5E0F68;
          margin-bottom: 5px;
        }
        .document-title {
          font-size: 20px;
          color: #333;
          margin-top: 10px;
        }
        .project-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #5E0F68;
          font-size: 18px;
          border-bottom: 2px solid #5E0F68;
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        .fee-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .fee-table th,
        .fee-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .fee-table th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .fee-summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          page-break-inside: avoid;
        }
        .signature-box {
          width: 45%;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
        }
        .signature-image {
          max-height: 60px; /* Use max-height to ensure image fits */
          height: auto; /* Allow auto height based on aspect ratio */
          width: auto; /* Allow auto width based on aspect ratio */
          max-width: 100%; /* Ensure image doesn't overflow its container */
          margin: 10px 0;
        }
        .page-break {
          page-break-before: always;
        }
        @media print {
          body {
            margin: 0;
            padding: 15px;
          }
          .page-break {
            page-break-before: always;
          }
          .page-break-inside-avoid { /* New class for print */
            page-break-inside: avoid;
          }
        }
        ul, ol {
          padding-left: 20px;
        }
        li {
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">Lysaght Consultants Limited</div>
        <div class="document-title">Terms of Engagement</div>
        <div style="margin-top: 15px; font-size: 14px; color: #666;">
          Version ${toe.version} | ${new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>

      <div class="project-info">
        <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 280px; margin-right: 20px;">
            <h3 style="margin-top: 0; color: #5E0F68;">Project Details</h3>
            <p><strong>Project:</strong> ${toe.project_title}</p>
            <p><strong>Client:</strong> ${client?.name || 'Unknown Client'}</p>
            <p><strong>Contact:</strong> ${client?.contact_person || ''}</p>
            <p><strong>Email:</strong> ${client?.email || ''}</p>
          </div>
          <div style="flex: 1; min-width: 280px;">
            <h3 style="margin-top: 0; color: #5E0F68;">Engagement Summary</h3>
            <p><strong>Total Fee:</strong> ${formatCurrency(toe.total_fee_with_gst)}</p>
            <p><strong>Status:</strong> ${toe.status || 'Draft'}</p>
            ${toe.sent_date ? `<p><strong>Sent:</strong> ${new Date(toe.sent_date).toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' })}</p>` : ''}
            ${toe.signed_date ? `<p><strong>Signed:</strong> ${new Date(toe.signed_date).toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' })}</p>` : ''}
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Scope of Work</h2>
        <div style="white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 8px;">
          ${toe.scope_of_work || 'Not specified'}
        </div>
      </div>

      <div class="section">
        <h2>Fee Structure</h2>
        <table class="fee-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Time Estimate</th>
              <th style="text-align: right;">Fee (excl. GST)</th>
            </tr>
          </thead>
          <tbody>
            ${toe.fee_structure?.map(item => `
              <tr>
                <td>
                  <strong>${item.description || 'Unnamed Item'}</strong>
                  ${item.staff_breakdown && item.staff_breakdown.length > 0 ? `
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">
                      ${item.staff_breakdown.map(staff => `${staff.role}: ${staff.hours}h @ $${staff.rate}/h`).join('<br>')}
                    </div>
                  ` : ''}
                </td>
                <td>${item.time_estimate || 'TBC'}</td>
                <td style="text-align: right;">${formatCurrency(item.cost || 0)}</td>
              </tr>
            `).join('') || '<tr><td colspan="3">No fee items specified</td></tr>'}
          </tbody>
        </table>
        
        <div class="fee-summary">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <strong>Subtotal:</strong>
            <strong>${formatCurrency(toe.total_fee || 0)}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span>GST (15%):</span>
            <span>${formatCurrency((toe.total_fee_with_gst || 0) - (toe.total_fee || 0))}</span>
          </div>
          <hr style="margin: 10px 0; border: none; border-top: 2px solid #5E0F68;">
          <div style="display: flex; justify-content: space-between; font-size: 18px;">
            <strong>Total (incl. GST):</strong>
            <strong>${formatCurrency(toe.total_fee_with_gst || 0)}</strong>
          </div>
        </div>
      </div>

      ${toe.assumptions ? `
        <div class="section">
          <h2>Assumptions</h2>
          <div style="white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 8px;">
            ${toe.assumptions}
          </div>
        </div>
      ` : ''}

      ${toe.exclusions ? `
        <div class="section">
          <h2>Exclusions</h2>
          <div style="white-space: pre-wrap; background: #f8f9fa; padding: 15px; border-radius: 8px;">
            ${toe.exclusions}
          </div>
        </div>
      ` : ''}

      ${standardTermsHTML}

      <div class="signatures page-break-inside-avoid">
        <div class="signature-box">
          <h3 style="color: #5E0F68; margin-top: 0;">Lysaght Consultants Limited</h3>
          ${signatureRecord?.lysaght_signature ? `
            <img src="${signatureRecord.lysaght_signature}" alt="Lysaght Signature" class="signature-image" />
            <div style="border-top: 1px solid #333; margin-top: 20px; padding-top: 10px;">
              <strong>Signature</strong><br>
              <small>Date: ${signatureRecord.lysaght_signed_date ? new Date(signatureRecord.lysaght_signed_date).toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</small>
            </div>
          ` : `
            <div style="height: 60px; border: 1px dashed #ccc; margin: 20px 0; display: flex; align-items: center; justify-content: center; color: #999;">
              Signature Required
            </div>
            <div style="border-top: 1px solid #333; margin-top: 20px; padding-top: 10px;">
              <strong>Signature</strong><br>
              <small>Date: _______________</small>
            </div>
          `}
        </div>

        <div class="signature-box">
          <h3 style="color: #5E0F68; margin-top: 0;">${client?.name || 'Client'}</h3>
          ${signatureRecord?.client_signature ? `
            <img src="${signatureRecord.client_signature}" alt="Client Signature" class="signature-image" />
            <div style="border-top: 1px solid #333; margin-top: 20px; padding-top: 10px;">
              <strong>Signature</strong><br>
              <small>Date: ${signatureRecord.client_signed_date ? new Date(signatureRecord.client_signed_date).toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}</small>
            </div>
          ` : `
            <div style="height: 60px; border: 1px dashed #ccc; margin: 20px 0; display: flex; align-items: center; justify-content: center; color: #999;">
              Signature Required
            </div>
            <div style="border-top: 1px solid #333; margin-top: 20px; padding-top: 10px;">
              <strong>Signature</strong><br>
              <small>Date: _______________</small>
            </div>
          `}
        </div>
      </div>

      <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px;">
        <p>© ${new Date().getFullYear()} Lysaght Consultants Limited. All rights reserved.</p>
        <p>This document is confidential and intended solely for the named client.</p>
      </div>
    </body>
    </html>
  `;
};
