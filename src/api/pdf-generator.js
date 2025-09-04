// Professional PDF generation for TOE documents using pdf-lib
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Standard Terms content (Schedule 2) - Complete legal text
const STANDARD_TERMS = `SCHEDULE 2 – STANDARD TERMS

1. Standard Terms
1.1 These Standard Terms apply to all services provided by the Firm to the Client, unless separate terms of engagement have been agreed by both parties.
1.2 These Standard Terms may only be changed with the written agreement of both parties.
1.3 If the Construction Contracts Act 2002 applies to the Services undertaken, then these Standard Terms are subject to that Act.

2. Provision of Services
2.1 The Firm will provide the Services as described in Schedule 1.
2.2 In providing the Services the Firm will use the degree of skill, care and diligence reasonably expected of a professional consultant providing services similar to the Services.
2.3 Provision of the Services is subject to any financial, physical, time or other restraints imposed by the Client or a Regulatory Authority, or necessarily resulting from the nature of the project.
2.4 The Firm may subcontract parts of the Services without the prior written consent of the Client, but if it does it will oversee the duties and responsibilities of the sub-contractor.
2.5 Provision of the Services is subject to the Client providing all information and services required by the Firm as set out in Schedule 1.
2.6 The Client must co-operate with the Firm and not obstruct the proper performance of the Services, including allowing the Firm reasonable access to the Site and other locations associated with the Services.
2.7 As soon as the Client becomes aware of anything that will materially affect the scope or timing of the Services, the Client must inform the Firm in writing.
2.8 The Firm may suspend the Services if it is unable to perform the Services due to an event or circumstance which is beyond its reasonable control including, but not limited to, act of God, work stoppage or other labour hindrance, public mains electrical supply failure, fire, flood, storm, explosion, earthquake, landslide, epidemic and quarantine restriction.

3. Fees and other amounts to be paid
3.1 The fees for all services provided by the Firm to the Client will be calculated in the manner set out in the engagement letter to which these Standard Terms are attached. If no basis of charging has been agreed, the Firm may charge the Client a fair and reasonable fee.
3.2 All fee estimates supplied to the Client by the Firm are based on the request by the Client for the work to be carried out and subject to any matters set out in the engagement letter to which these Standard Terms are attached and Schedule 1. Fee estimates are indicative only and the actual fee will be determined in accordance with clause 3.1.
3.3 The Firm reserves the right to alter its fee (and revise any fee estimate) where the Services are affected as a result of:
3.3.1 a lack of precision in the Client's instructions, or the Client provides more detailed instructions after a fee estimate is given;
3.3.2 if the Client requires any changes which affect the scope of the project or the proposed program for the Service;
3.3.3 an unforeseen matter arising affecting the effort required to complete the project or provide the Services or the project extends beyond the original proposed timeframe;
3.3.4 where an assumption set out in Schedule 1 is not correct;
3.3.5 where the Client fails to comply with its obligations under the Contract;
3.3.6 where changes are made to any legislation (including subordinate laws) which affects the provision of Services; or
3.3.7 where any other change occurs which affects the supply of the Services by the Firm.
3.4 The Firm will give the Client notice of any material change to its fee (and any fee estimate) within a reasonable time of it becoming aware of a matter set out in clause 3.3.
3.5 The Client shall pay to the Firm all disbursements, external expenses, and administrative fees reasonably incurred, paid or payable by the Firm in relation to the project or on behalf of the Client.
3.6 Goods and services tax (GST) chargeable pursuant to the Goods and Services Tax Act 1985 (GST Act) will be added to the fees in relation to any part of the fees that is for a taxable supply under the GST Act.

4. Payments
4.1 Where the Client is a joint venture, each party to the joint venture shall be jointly and severally liable for all payments of fees in relation to the Contract.
4.2 The Firm may issue monthly payment claims under the Contract.
4.3 The Firm's payment claims shall:
4.3.1 Identify the Contract and relevant period to which the claim relates;
4.3.2 Identify the services to which the claim relates;
4.3.3 State the amount claimed and the manner in which the claimed amount has been calculated; and,
4.3.4 State the due date for payment which shall be 14 days from the date the invoice was issued.
4.4 If any payment claim is disputed, then the Client must, within seven days of receiving the payment claim, provide a notice to the Firm setting out the nature of the dispute. Any undisputed amount must be paid by the due date for payment.
4.5 Where the Client is required to send a Payment Schedule under the Construction Contracts Act 2002, the Client must send the Payment Schedule to the Firm within seven days of receiving the payment claim. The Payment Schedule must identify the payment claim to which it relates and state the amount (if any) that the Client proposes to pay and the manner in which the Client calculated that amount. If the amount proposed to be paid is less than the amount claimed, the Payment Schedule must state the reason for the difference and the reason for withholding payment.
4.6 If the Client disputes the payment claim, the dispute will be resolved in accordance with clause 12.
4.7 The Firm may charge the Client interest at the rate of 1.5% per month on any amount that is overdue for payment.
4.8 The Client must indemnify the Firm for all costs incurred by the Firm in recovering any unpaid amount, including solicitor client costs.

5. Variations
5.1 The Client may propose or request variations to the Services by giving written notice to the Firm setting out the particulars of the proposed variation. The Firm may also propose variations to the Services by giving written notice to the Client setting out the particulars of the proposed variation.
5.2 If the Firm receives a request for a variation from the Client, or if the Firm proposes a variation, the Firm must notify the Client in writing of:
5.2.1 the estimated fees for the variation;
5.2.2 the effect of the variation on the Services; and
5.2.3 the new estimated completion date for the Services.
5.3 The Client must respond to the Firm's notification within 10 Business Days. If the Client does not respond within that time, the Client is deemed to have rejected the proposed variation. If the Client accepts the proposed variation, the Contract is varied accordingly.
5.4 Any instruction given by the Client to the Firm that the Firm considers to be a variation will be treated as a request for a variation under this clause.

6. Termination
6.1 The Client may terminate the Contract by giving written notice to the Firm. If the Client terminates the Contract, the Client must pay the Firm the amounts specified in clause 6.4 and Schedule 1.
6.2 Either party may terminate the Contract by giving written notice to the other party if:
6.2.1 the other party breaches the Contract and fails to remedy the breach within 10 Business Days of receiving written notice requiring it to do so; or
6.2.2 the other party becomes insolvent, bankrupt, or is unable to pay its debts as they fall due.
6.3 The Firm may terminate the Contract by giving written notice to the Client if the Services are suspended and not recommenced within 10 Business Days.
6.4 Upon termination of the Contract, the Client must pay the Firm:
6.4.1 all outstanding fees for Services provided up to the date of termination;
6.4.2 all work done and materials supplied up to the date of termination; and
6.4.3 all costs and expenses incurred by the Firm in connection with the termination.
6.5 Termination of the Contract does not affect any rights, claims, or liabilities that have accrued before the date of termination.

7. Intellectual Property
7.1 All intellectual property (including copyright) in all documents and works produced by the Firm in connection with the Services remains the property of the Firm. The Firm retains the right to use any images, drawings, or other works produced in connection with the Services for promotional purposes.
7.2 The Firm retains control of all documents until all fees and other amounts payable under the Contract have been paid in full. After payment in full, the Firm grants to the Client a non-exclusive, non-transferable license to use the documents for the purposes of the project and the Client's business, but not for any other purpose. The Client may not sublicense or assign this license without the Firm's prior written consent. The Client may not use any images, drawings, or other works for promotional purposes without the Firm's prior written consent.
7.3 The Client may not publish any images, drawings, or other works outside the Client's business without the Firm's prior written consent. If the Firm grants such consent, the Client may not tamper with or manipulate the images, drawings, or other works in any way.
7.4 Ownership of any data and factual information collected and paid for by the Client vests in the Client after payment in full.

8. Privacy Act 1993
8.1 Subject to the Privacy Act 1993, the Client authorizes the Firm to collect, store, use, and disclose personal information about the Client and the Client's staff for the purposes of:
8.1.1 providing the Services;
8.1.2 assessing the Client's creditworthiness;
8.1.3 enforcing these Standard Terms;
8.1.4 marketing the Firm's services; and
8.1.5 conducting research and analysis.
8.2 The Client acknowledges that if the Client does not provide the information requested by the Firm, the Firm may not be able to provide the Services.
8.3 The Client acknowledges that personal information collected by the Firm will be held at the Firm's premises or in cloud storage (which may be located overseas). The Firm may use third parties (including overseas providers) to store and process personal information.
8.4 The Client has the right to access and correct personal information held by the Firm in accordance with the Privacy Act 1993. If the Client is a corporate entity, the Client must ensure that its staff are aware of these rights and the collection of personal information.

9. Consumer Guarantees Act 1993
9.1 These Standard Terms do not affect the Client's rights under the Consumer Guarantees Act 1993.
9.2 If the Client acquires the Services for the purposes of a trade or business, the provisions of the Consumer Guarantees Act 1993 do not apply to the Contract to the maximum extent permitted by law.

10. Health and Safety
10.1 Each party must comply with all applicable health and safety legislation, including the Health and Safety at Work Act 2015, regulations, by-laws, codes of practice, and other applicable workplace health and safety standards.
10.2 The Client must take all practicable steps to ensure that the Site is safe and free from hazards. The Firm will report any hazards identified to the Client, and the Client must take appropriate action to eliminate or mitigate the risks.
10.3 The Client must consult, co-operate, and co-ordinate activities with the Firm and other contractors on the Site regarding health and safety.

11. Liabilities and Insurance
Limits of Liability
11.1 The Firm's total aggregate liability for any damages or losses (whether in contract, tort, negligence, or otherwise) arising out of or in connection with the Services or the project is limited to the lesser of five times the fees payable under the Contract or $100,000. The Firm is not liable for any indirect, consequential, or special loss or damage, including loss of profit, savings, opportunities, or data.
11.2 If both parties or a third party contribute to any loss or damage, the liable party is only liable to the extent of its own contribution.
11.3 The Firm is not liable for any loss or damage that occurs more than six years after the earlier of the completion of the Services or the termination of the Contract.
11.4 If the Client engages the Firm to perform services for a third party (the Principal), the Firm's liability to the Principal is limited in the same way as its liability to the Client, and the Client warrants that it is acting as the Principal's agent.

Insurance
11.5 The Firm must maintain the following insurance for the duration of the Services:
11.5.1 Professional indemnity insurance with a minimum cover of $1,000,000; and
11.5.2 Public liability insurance with a minimum cover of $2,000,000.
11.6 The Firm must use reasonable endeavors to keep professional indemnity insurance in force for six years after the completion or termination of the Services.
11.7 The Firm must provide certificates of insurance to the Client if requested.

12. Dispute Resolution
12.1 If a dispute arises between the parties, they must meet in good faith to resolve the dispute.
12.2 If the parties cannot resolve the dispute by meeting, they must attempt to resolve it by mediation.
12.3 If the parties cannot agree on a mediator within 10 Business Days, the mediator will be appointed by the President of the Arbitrators' and Mediators' Institute of New Zealand Inc.
12.4 If mediation is unsuccessful, the dispute will be referred to arbitration.
12.5 The arbitration will be conducted by a single arbitrator appointed by the President of the Arbitrators' and Mediators' Institute of New Zealand Inc. The arbitration will be conducted in accordance with the Arbitration Act 1996 and will be held in Auckland.
12.6 Each party must bear its own costs of the dispute resolution process, and the parties must continue to perform their obligations under the Contract during the dispute resolution process.
12.7 Neither party may make any public announcement about the dispute without the other party's prior written consent.
12.8 Nothing in this clause prevents either party from seeking immediate relief from a court of competent jurisdiction or from terminating the Contract in accordance with clause 6.
12.9 If the Construction Contracts Act 2002 applies to the Services, either party may refer a dispute to adjudication under that Act. If a dispute is referred to adjudication, the dispute resolution process under this clause will be suspended until the adjudication is complete.

13. General Provisions
13.1 Definitions
In these Standard Terms:
"Business Day" means a day other than Saturday, Sunday, a public holiday, or a regional anniversary day.
"Contract" means the engagement letter, these Standard Terms, Schedule 1, and any Specialist Services Schedule.
"Documents" means all drawings, specifications, reports, technical information, and Images produced by the Firm in connection with the Services.
"Images" means all photographic, video, and other images captured by the Firm in connection with the Services.
"Regulatory Authority" means any regulator, authority, or body that has a regulatory function in relation to the Services or the project.
"Services" means the services described in Schedule 1.
"Site" means the site described in Schedule 1.
"Specialist Services" means services that require specialist equipment or skills.
"Specialist Services Schedule" means a schedule provided by the Firm setting out the terms and conditions for Specialist Services.
"Standard Terms" means these standard terms contained in Schedule 2.

13.2 References to "Payment Claim," "Payment Schedule," and "Progress Payment" have the meanings given to them in section 5 of the Construction Contracts Act 2002.

13.3 References to "Schedule" in these Standard Terms refer to the relevant schedule to the Contract.

13.4 Each party must do all things reasonably required to give effect to the terms of the Contract.

13.5 Notice or other communication
Any notice or other communication required or permitted to be given under the Contract must be:
13.5.1 in writing;
13.5.2 in English;
13.5.3 given by hand, post, or email; and
13.5.4 deemed to be received:
(a) if given by hand, when delivered;
(b) if given by post, on the third Business Day after posting;
(c) if given by email, when the email is sent (unless the sender receives a delivery failure notification).

13.6 Liability
Neither party is liable for any act, omission, or failure arising from any event or circumstance beyond its reasonable control, including but not limited to act of God, war, terrorism, civil commotion, industrial action, or extreme weather conditions. This clause does not apply to the Client's obligation to pay fees.

13.7 Binding
The Contract is binding on the parties and their successors and assigns. Neither party may assign the Contract without the other party's prior written consent.

13.8 Waiver
A failure by either party to enforce any term of the Contract does not constitute a waiver of that term or any other term.

13.9 Confidential Information
Confidential information supplied to a party to the Contract, or of which a party becomes aware as a result of that party's dealings in connection with the operation of the Contract, remains the property of the originating party. Each party must keep confidential all confidential information of the other party and must not disclose it to any third party without the other party's prior written consent. This clause does not apply to information that is publicly available or that a party is required to disclose by law.

13.10 Governing Law
This Agreement is to be governed by and construed in accordance with the laws of New Zealand.`;

export async function generateTOEPDFClient(payload) {
  try {
    // Inputs
    const project_title = payload.project_title;
    const scope_of_work = payload.scope_of_work;
    const assumptions = payload.assumptions;
    const exclusions = payload.exclusions;
    const client = payload.client || {};
    const fee_structure = payload.fee_structure || [];
    const total_fee_with_gst = Number(payload.total_fee_with_gst || 0);
    const total_fee = Number(payload.total_fee || 0);
    const signatureRecord = payload.signatureRecord || null;
    const includeSignatures = payload.includeSignatures || 
      Boolean(signatureRecord && (signatureRecord.client_signature || signatureRecord.lysaght_signature));
    


    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const width = 595.28; // A4 width
    const height = 841.89; // A4 height

    // Load fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Define colors - matching your reference
    const purple = rgb(0.4, 0.2, 0.6); // Purple for headings
    const black = rgb(0, 0, 0);
    const darkGray = rgb(0.3, 0.3, 0.3);
    const lightGray = rgb(0.8, 0.8, 0.8);

    // Helper function to wrap text
    const wrapText = (text, maxWidth, fontSize, font = helvetica) => {
      if (!text) return [];
      
      const words = text.split(' ');
      const lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // Word is too long, force break it
            lines.push(word);
            currentLine = '';
          }
        }
      }
      
      if (currentLine) {
        lines.push(currentLine);
      }
      
      return lines;
    };

    // Helper function to draw text with wrapping
    const drawWrappedText = (page, text, x, y, maxWidth, fontSize, font = helvetica, color = black) => {
      const lines = wrapText(text, maxWidth, fontSize, font);
      let currentY = y;
      
      for (const line of lines) {
        page.drawText(line, {
          x,
          y: currentY,
          size: fontSize,
          font,
          color,
        });
        currentY -= fontSize + 2;
      }
      
      return currentY;
    };

    // Helper function to draw bullet points with proper indentation
    const drawBulletPoint = (page, text, x, y, maxWidth, fontSize, font = helvetica, color = black) => {
      // Remove existing bullet if present
      const cleanText = text.replace(/^•\s*/, '');
      
      // Calculate bullet width for proper indentation
      const bulletWidth = font.widthOfTextAtSize('• ', fontSize);
      const indentX = x + bulletWidth;
      const indentMaxWidth = maxWidth - bulletWidth;
      
      // Draw the bullet
      page.drawText('• ', {
        x,
        y,
        size: fontSize,
        font,
        color,
      });
      
      // Draw the text with proper indentation - all lines aligned with start of text
      const lines = wrapText(cleanText, indentMaxWidth, fontSize, font);
      let currentY = y;
      
      for (const line of lines) {
        page.drawText(line, {
          x: indentX, // All lines aligned with start of text (after bullet)
          y: currentY,
          size: fontSize,
          font,
          color,
        });
        currentY -= fontSize + 2;
      }
      
      return currentY;
    };

    // Helper function to add footer
    const addFooter = async (page, pageNumber) => {
      // Add LYSAGHT logo to bottom-left corner (only on first page)
      if (pageNumber === 1) {
        try {
          // Fetch the logo image from the provided URL
          const logoResponse = await fetch('https://i.postimg.cc/3JZQkPCD/Untitled-design-1-1.png');
          const logoArrayBuffer = await logoResponse.arrayBuffer();
          const logoImage = await pdfDoc.embedPng(logoArrayBuffer);
          
          // Calculate logo dimensions - make it 3 times bigger
          const logoMaxWidth = 450; // 3x bigger width for logo (150 * 3)
          const logoMaxHeight = 240; // 3x bigger height for logo (80 * 3)
          const { width: logoWidth, height: logoHeight } = logoImage;
          
          // Scale logo to fit in corner while maintaining aspect ratio
          const scaleX = logoMaxWidth / logoWidth;
          const scaleY = logoMaxHeight / logoHeight;
          const scale = Math.min(scaleX, scaleY);
          
          const scaledLogoWidth = logoWidth * scale;
          const scaledLogoHeight = logoHeight * scale;
          
          // Position logo right in the corner with no white space
          const logoX = 0; // No margin from left edge
          const logoY = 0; // No margin from bottom edge
          
          page.drawImage(logoImage, {
            x: logoX,
            y: logoY,
            width: scaledLogoWidth,
            height: scaledLogoHeight,
          });
        } catch (error) {
          console.log('Error embedding logo:', error);
          // Fallback: no logo if image fails to load
        }
      }

      // Page number
      page.drawText(pageNumber.toString(), {
        x: width - 50,
        y: 50,
        size: 10,
        font: helvetica,
        color: black,
      });
    };

    // Helper function to add section heading
    const addSectionHeading = (page, text, x, y, fontSize = 16) => {
      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font: helveticaBold,
        color: purple,
      });
      return y - (fontSize + 10);
    };

    let pageNumber = 1;

    // PAGE 1: Cover Page - Fixed layout with better margins
    let page = pdfDoc.addPage([width, height]);
    let currentY = height - 100;

    // LYSAGHT header (top-left) - Better positioning
    page.drawText('LYSAGHT', {
      x: 60,
      y: currentY,
      size: 20,
      font: helveticaBold,
      color: black,
    });
    currentY -= 30;

    // PROPOSAL (smaller, purple)
    page.drawText('PROPOSAL', {
      x: 60,
      y: currentY,
      size: 12,
      font: helvetica,
      color: purple,
    });
    currentY -= 50;

    // Project Title (large, purple, left-aligned)
    const titleText = project_title || 'TERMS OF ENGAGEMENT';
    // Use smaller font size and left alignment
    const titleSize = 20;
    const titleLines = wrapText(titleText, width - 120, titleSize, helveticaBold);
    
    for (const line of titleLines) {
      page.drawText(line, {
        x: 60, // Left-aligned instead of centered
        y: currentY,
        size: titleSize,
        font: helveticaBold,
        color: purple,
      });
      currentY -= (titleSize + 5);
    }

    // Project metadata (bottom-right) - Better positioning and margins
    const metadataY = 180;
    const metadataX = width - 200;
    
    page.drawText(new Date().toLocaleDateString('en-GB'), {
      x: metadataX,
      y: metadataY,
      size: 12,
      font: helvetica,
      color: black,
    });

    page.drawText('PROJECT NAME:', {
      x: metadataX,
      y: metadataY - 25,
      size: 10,
      font: helvetica,
      color: black,
    });

    const projectName = project_title || 'Not specified';
    const projectNameLines = wrapText(projectName, 150, 12, helveticaBold);
    let projectNameY = metadataY - 40;
    for (const line of projectNameLines) {
      page.drawText(line, {
        x: metadataX,
        y: projectNameY,
        size: 12,
        font: helveticaBold,
        color: black,
      });
      projectNameY -= 15;
    }

    page.drawText('PREPARED FOR:', {
      x: metadataX,
      y: projectNameY - 10,
      size: 10,
      font: helvetica,
      color: black,
    });

    const clientName = client.company_name || 'Not specified';
    const clientNameLines = wrapText(clientName, 150, 12, helveticaBold);
    let clientNameY = projectNameY - 25;
    for (const line of clientNameLines) {
      page.drawText(line, {
        x: metadataX,
        y: clientNameY,
        size: 12,
        font: helveticaBold,
        color: black,
      });
      clientNameY -= 15;
    }

    await addFooter(page, pageNumber++);

    // PAGE 2: Project Details, Client Info, Scope, Fee Structure - Better margins
    page = pdfDoc.addPage([width, height]);
    currentY = height - 100;

    // PROJECT ADDRESS
    currentY = addSectionHeading(page, 'PROJECT ADDRESS', 60, currentY);
    currentY -= 10;
    
    if (client.address) {
      const addressText = `${client.address.street || ''}, ${client.address.city || ''} ${client.address.postcode || ''}`.trim();
      if (addressText) {
        currentY = drawWrappedText(page, addressText, 60, currentY, width - 120, 12);
      } else {
        currentY = drawWrappedText(page, 'Address not specified', 60, currentY, width - 120, 12);
      }
    } else {
      currentY = drawWrappedText(page, 'Address not specified', 60, currentY, width - 120, 12);
    }
    currentY -= 20;

    // CLIENT INFORMATION
    currentY = addSectionHeading(page, 'CLIENT INFORMATION', 60, currentY);
    currentY -= 10;

    const clientInfo = [
      `Company: ${client.company_name || 'Not specified'}`,
      `Contact: ${client.contact_person || 'Not specified'}`,
      `Email: ${client.email || 'Not specified'}`,
      `Phone: ${client.phone || 'Not specified'}`
    ];

    for (const info of clientInfo) {
      page.drawText(info, {
        x: 60,
        y: currentY,
        size: 12,
        font: helvetica,
        color: black,
      });
      currentY -= 18;
    }
    currentY -= 10;

    // SCOPE OF WORK
    currentY = addSectionHeading(page, 'SCOPE OF WORK', 60, currentY);
    currentY -= 10;

    if (scope_of_work) {
      // Split scope into bullet points
      const scopeLines = scope_of_work.split('\n').filter(line => line.trim());
      for (const line of scopeLines) {
        const bulletText = line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`;
        currentY = drawBulletPoint(page, bulletText, 60, currentY, width - 120, 12);
        currentY -= 5;
      }
    } else {
      currentY = drawWrappedText(page, 'No scope of work defined.', 60, currentY, width - 120, 12);
    }
    currentY -= 20;

    // FEE STRUCTURE - Perfect table layout
    currentY = addSectionHeading(page, 'FEE STRUCTURE', 60, currentY);
    currentY -= 40; // Even more space between heading and table

    if (fee_structure.length > 0) {
      // Table header with purple background - Match text width
      const tableWidth = width - 120; // Match the text width (same as content)
      const tableX = 60; // Align with text content
      
      page.drawRectangle({
        x: tableX,
        y: currentY - 25,
        width: tableWidth,
        height: 25,
        color: purple,
      });

      // Header text - properly positioned
      page.drawText('DESCRIPTION', {
        x: tableX + 15,
        y: currentY - 18,
        size: 12,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      page.drawText('ESTIMATE', {
        x: tableX + tableWidth - 80,
        y: currentY - 18,
        size: 12,
        font: helveticaBold,
        color: rgb(1, 1, 1),
      });

      currentY -= 40; // More space between header and first data row

      // Fee items - Clean layout with proper multi-line handling
      const processedItems = new Set(); // Track processed items to prevent duplicates
      for (const item of fee_structure) {
        const description = item.description || 'Service';
        const cost = `$${Number(item.cost || 0).toFixed(2)}`;
        
        // Create a unique key for this item to prevent duplicates
        const itemKey = `${description}-${cost}`;
        if (processedItems.has(itemKey)) {
          continue; // Skip duplicate items
        }
        processedItems.add(itemKey);
        
        // Handle multi-line descriptions by splitting on newlines
        const descriptionLines = description.split('\n').filter(line => line.trim());
        
        // Draw each description line with proper spacing
        for (let i = 0; i < descriptionLines.length; i++) {
          const line = descriptionLines[i].trim();
          page.drawText(line, {
            x: tableX + 15,
            y: currentY,
            size: 12,
            font: helvetica,
            color: black,
          });
          
          // Only draw cost on the first line of multi-line descriptions
          if (i === 0) {
            page.drawText(cost, {
              x: tableX + tableWidth - 80,
              y: currentY,
              size: 12,
              font: helvetica,
              color: black,
            });
          }
          
          // Move to next line with proper spacing
          currentY -= 16; // Increased spacing between lines
        }
        
        // Add extra space after each fee item
        currentY -= 4;
      }

      // Total row - Bold and properly aligned
      page.drawText('TOTAL', {
        x: tableX + 15,
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: black,
      });

      page.drawText(`$${total_fee.toFixed(2)} + GST`, {
        x: tableX + tableWidth - 80,
        y: currentY,
        size: 12,
        font: helveticaBold,
        color: black,
      });

      currentY -= 30;
    } else {
      currentY = drawWrappedText(page, 'No fee structure defined.', 60, currentY, width - 120, 12);
      currentY -= 20;
    }

    await addFooter(page, pageNumber++);

    // PAGE 3: Assumptions and Exclusions
    page = pdfDoc.addPage([width, height]);
    currentY = height - 80;

    // ASSUMPTIONS
    if (assumptions) {
      currentY = addSectionHeading(page, 'ASSUMPTIONS', 50, currentY);
      currentY -= 10;

      const assumptionLines = assumptions.split('\n').filter(line => line.trim());
      for (const line of assumptionLines) {
        const bulletText = line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`;
        currentY = drawBulletPoint(page, bulletText, 50, currentY, width - 100, 12);
        currentY -= 5;
      }
      currentY -= 20;
    }

    // EXCLUSIONS
    if (exclusions) {
      currentY = addSectionHeading(page, 'EXCLUSIONS', 50, currentY);
      currentY -= 10;

      const exclusionLines = exclusions.split('\n').filter(line => line.trim());
      for (const line of exclusionLines) {
        const bulletText = line.trim().startsWith('•') ? line.trim() : `• ${line.trim()}`;
        currentY = drawBulletPoint(page, bulletText, 50, currentY, width - 100, 12);
        currentY -= 5;
      }
    }

    await addFooter(page, pageNumber++);

    // PAGES 4-8: Standard Terms
    const standardTermsLines = STANDARD_TERMS.split('\n');
    let termsPage = pdfDoc.addPage([width, height]);
    let termsY = height - 80;
    let currentTermsPage = pageNumber++;

    for (const line of standardTermsLines) {
      if (termsY < 100) {
        // Need new page
        await addFooter(termsPage, currentTermsPage++);
        termsPage = pdfDoc.addPage([width, height]);
        termsY = height - 80;
      }

      if (line.trim()) {
        termsY = drawWrappedText(termsPage, line, 50, termsY, width - 100, 10);
        termsY -= 3;
      } else {
        termsY -= 10;
      }
    }

    await addFooter(termsPage, currentTermsPage);

    // FINAL PAGE: Signatures - Fixed layout and signature display
    if (includeSignatures && signatureRecord) {
      page = pdfDoc.addPage([width, height]);
      currentY = height - 100;

      currentY = addSectionHeading(page, 'Signatures', 60, currentY);
      currentY -= 30;

      // Client Signature
      if (signatureRecord.client_signature) {
        page.drawText('Client Signature:', {
          x: 60,
          y: currentY,
          size: 12,
          font: helveticaBold,
          color: black,
        });
        currentY -= 20;

        // Signature area - No border, left-aligned
        const sigBoxWidth = 400;
        const sigBoxHeight = 60;
        const sigBoxX = 60;

        // Try to embed actual signature image
        try {
          if (signatureRecord.client_signature && signatureRecord.client_signature.startsWith('data:image/')) {
            const base64Data = signatureRecord.client_signature.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Try PNG first, then JPEG
            let signatureImage;
            try {
              signatureImage = await pdfDoc.embedPng(imageBytes);
            } catch (pngError) {
              try {
                signatureImage = await pdfDoc.embedJpg(imageBytes);
              } catch (jpgError) {
                console.log('Could not embed signature as PNG or JPEG:', pngError, jpgError);
                throw new Error('Unsupported image format');
              }
            }
            
            // Calculate image dimensions to fit in signature box
            const maxWidth = sigBoxWidth - 10;
            const maxHeight = sigBoxHeight - 10;
            const { width: imgWidth, height: imgHeight } = signatureImage;
            
            // Scale image to fit in signature box while maintaining aspect ratio
            const scaleX = maxWidth / imgWidth;
            const scaleY = maxHeight / imgHeight;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            // Left-align the image in the signature area
            const imageX = sigBoxX;
            const imageY = currentY - sigBoxHeight + (sigBoxHeight - scaledHeight) / 2;
            
            page.drawImage(signatureImage, {
              x: imageX,
              y: imageY,
              width: scaledWidth,
              height: scaledHeight,
            });
          } else {
            // Fallback text
            page.drawText('[Client Signature]', {
              x: sigBoxX,
              y: currentY - 35,
              size: 12,
              font: helvetica,
              color: darkGray,
            });
          }
        } catch (error) {
          console.log('Error embedding client signature:', error);
          // Fallback text if image embedding fails
          page.drawText('[Client Signature]', {
            x: sigBoxX,
            y: currentY - 35,
            size: 12,
            font: helvetica,
            color: darkGray,
          });
        }

        currentY -= (sigBoxHeight + 20);

        if (signatureRecord.client_signer_name) {
          page.drawText(`Signed by: ${signatureRecord.client_signer_name}`, {
            x: 60,
            y: currentY,
            size: 10,
            font: helvetica,
            color: black,
          });
          currentY -= 15;
        }

        if (signatureRecord.client_signed_date) {
          page.drawText(`Date: ${new Date(signatureRecord.client_signed_date).toLocaleDateString()}`, {
            x: 60,
            y: currentY,
            size: 10,
            font: helvetica,
            color: black,
          });
          currentY -= 25;
        }
      }

      // Lysaght Signature
      if (signatureRecord.lysaght_signature) {
        page.drawText('Lysaght Consultants Limited:', {
          x: 60,
          y: currentY,
          size: 12,
          font: helveticaBold,
          color: black,
        });
        currentY -= 20;

        // Signature area - No border, left-aligned
        const sigBoxWidth = 400;
        const sigBoxHeight = 60;
        const sigBoxX = 60;

        // Try to embed actual signature image
        try {
          if (signatureRecord.lysaght_signature && signatureRecord.lysaght_signature.startsWith('data:image/')) {
            const base64Data = signatureRecord.lysaght_signature.split(',')[1];
            const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
            
            // Try PNG first, then JPEG
            let signatureImage;
            try {
              signatureImage = await pdfDoc.embedPng(imageBytes);
            } catch (pngError) {
              try {
                signatureImage = await pdfDoc.embedJpg(imageBytes);
              } catch (jpgError) {
                console.log('Could not embed signature as PNG or JPEG:', pngError, jpgError);
                throw new Error('Unsupported image format');
              }
            }
            
            // Calculate image dimensions to fit in signature box
            const maxWidth = sigBoxWidth - 10;
            const maxHeight = sigBoxHeight - 10;
            const { width: imgWidth, height: imgHeight } = signatureImage;
            
            // Scale image to fit in signature box while maintaining aspect ratio
            const scaleX = maxWidth / imgWidth;
            const scaleY = maxHeight / imgHeight;
            const scale = Math.min(scaleX, scaleY);
            
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            
            // Left-align the image in the signature area
            const imageX = sigBoxX;
            const imageY = currentY - sigBoxHeight + (sigBoxHeight - scaledHeight) / 2;
            
            page.drawImage(signatureImage, {
              x: imageX,
              y: imageY,
              width: scaledWidth,
              height: scaledHeight,
            });
          } else {
            // Fallback text
            page.drawText('[Lysaght Signature]', {
              x: sigBoxX,
              y: currentY - 35,
              size: 12,
              font: helvetica,
              color: darkGray,
            });
          }
        } catch (error) {
          console.log('Error embedding lysaght signature:', error);
          // Fallback text if image embedding fails
          page.drawText('[Lysaght Signature]', {
            x: sigBoxX,
            y: currentY - 35,
            size: 12,
            font: helvetica,
            color: darkGray,
          });
        }

        currentY -= (sigBoxHeight + 20);

        page.drawText('Signed by: Lysaght Representative', {
          x: 60,
          y: currentY,
          size: 10,
          font: helvetica,
          color: black,
        });
        currentY -= 15;

        if (signatureRecord.lysaght_signed_date) {
          page.drawText(`Date: ${new Date(signatureRecord.lysaght_signed_date).toLocaleDateString()}`, {
            x: 60,
            y: currentY,
            size: 10,
            font: helvetica,
            color: black,
          });
        }
      }

      await addFooter(page, currentTermsPage);
    }

    // Generate PDF bytes
    const pdfBytes = await pdfDoc.save();
    
    // Create a blob from the PDF bytes
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    return blob;

  } catch (error) {
    console.error('Error generating TOE PDF:', error);
    throw error;
  }
}