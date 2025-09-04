// TOE PDF Generation Function for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    
    // Inputs
    const project_title = payload.project_title
    const scope_of_work = payload.scope_of_work
    const assumptions = payload.assumptions
    const exclusions = payload.exclusions
    const client = payload.client || {}
    const fee_structure = payload.fee_structure || []
    const total_fee_with_gst = Number(payload.total_fee_with_gst || 0)
    const total_fee = Number(payload.total_fee || 0)
    const signatureRecord = payload.signatureRecord || null
    const includeSignatures = payload.includeSignatures || 
      Boolean(signatureRecord && (signatureRecord.client_signature || signatureRecord.lysaght_signature))

    // Utility functions
    function cleanText(text: string) {
      if (typeof text !== 'string') return ''
      return text.replace(/[^\x00-\x7F]/g, '')
    }

    // Standard Terms content (Schedule 2)
    const STANDARD_TERMS = `SCHEDULE 2 - STANDARD TERMS

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
Payment Schedules
4.4 If any payment claim is disputed, then the Client must, within seven days of receiving the payment claim, provide a notice to the Firm setting out the nature of the dispute. Any undisputed amount must be paid by the due date for payment.
4.5 If the Construction Contracts Act 2002 applies to the Services, the Client must send the Firm a written Payment Schedule which complies with section 21 of the Construction Contracts Act 2002, within seven days of receiving the invoice and, include the following information:
    4.5.1 the undisputed amount to be paid; and,
    4.5.2 the reasons for not paying the full amount.
4.6 Disputed payment claims shall be resolved in accordance with clause 12.
Overdue payments
4.7 Interest may be charged by the Firm on all overdue payments at the rate of 1.5% per month of the total amount owing.
4.8 The Client will indemnify the Firm against any costs, expenses and charges incurred or suffered by the Firm in recovering any unpaid amounts, including costs on a solicitor client basis.

5. Variations
5.1 The Client may vary the Services by giving written notice to the Firm or may request the Firm to propose a variation to the Services. The Firm may also propose variations to the Services by giving written notice. The written notice must include the particulars of the variation.
5.2 On receiving a request to propose a variation from the Client, or where it wishes to propose a variation, the Firm will notify the Client of:
    5.2.1 the estimated fees or change to the existing estimated fees or the basis on which the fee is to be calculated in order to accommodate the variation;
    5.2.2 any impact on the Services; and,
    5.2.3 the new estimated completion date for the Services.
5.3 The Client will then have 10 Business Days' to notify the Firm if it wishes to proceed with the proposed variation. If no notice is given in that time period the Client is deemed to have rejected the proposed variation. If the Client accepts the proposed variation, the Contract is deemed to be varied accordingly.
5.4 Where an instruction or direction is given to the Firm by the Client which is not in writing or is not expressly stated to be a variation and the Firm considers that the instruction or direction involves a variation to the services, then the Firm will treat the instruction as a variation request to which this clause applies.

6. Termination
6.1 The Client may terminate the Contract for any reason by notice in writing to the Firm. A notice of termination, received by either Party, will result in the Firm ceasing to provide the Services. Where the Client terminates the Contract under this clause the Client shall pay the amounts as specified in clause 6.4 together with any other amounts specified in Schedule 1 as payable on such a termination.
6.2 Either party may terminate the Contract by notice in writing to the other if:
    6.2.1 that other party breaches the contract and does not remedy the breach within 10 Business Days of the party notifying that other party of the nature of the breach; or,
    6.2.2 that other party suspends, or threatens to suspend, payment of its debts or is, or is deemed to be, insolvent or bankrupt, unable to pay its debts as they fall due for payment or admits inability to pay its debts.
6.3 The Firm may terminate the Contract if the Services have been suspended by the Firm under the Contract and the Services are not recommenced within 10 Business Days' of the suspension.
6.4 The Firm will cease providing the Services on termination of the Contract. In the event of a termination of the Contract, the Client shall pay all outstanding fees, all fees for work done up to the date of the termination and any actual and reasonable costs and expenses associated with or incurred in relation to the Contract until the date of termination.
6.5 Termination shall not prejudice or affect accrued rights or claims and liabilities of the parties up to the effective date of termination.

7. Intellectual Property
7.1 All intellectual property (including copyright) in the Documents or any other works produced or resulting from the Firm's services, is owned by, and belongs to, the Firm. In particular, the Firm retains all its rights to use any Images for advertisement, display or promotional purposes.
7.2 The Firm maintains control of all Documents until full payment of the fees has been made by the Client, at which point the Firm grants the Client a limited licence to use the Documents for the project and the Client's business. The license will not extend to any of the Client's affiliates unless written express permission is granted by the Firm. Without prior written consent, the Firm does not authorise the Client (nor does it grant a licence thereof to allow the Client or any affiliate) to distribute the Images nationally or internationally for promotional purposes.
7.3 Any publication of the Images outside of the Client's business may only be undertaken with the prior written consent of the Firm and any licence granted will not allow the Client to tamper with, edit or manipulate the Images in anyway.
7.4 The ownership of data and factual information collected by the Firm and paid for by the Client, shall, after payment by the Client, vest in the Client.

8. Privacy Act 1993
8.1 Subject to the Privacy Act 1993, the Client authorises the Firm:
    8.1.1 to retain and record any personal information ascertained in connection with the Contract;
    8.1.2 to collect, store, use, and disclose information about the Client and its staff for any purpose relating to the Contact, including but not limited to, assessing the Client's credit worthiness, enforcing these Standard Terms, marketing to the Client, research and performing the Services, and any other purpose notified to the Client at the time the information is collected or which is authorised by the Privacy Act 1993.
8.2 Failure to provide information required may affect the Firm's ability to provide the Services.
8.3 Any personal information collected and held by the Firm will be kept at the Firm's premises or such other places as the Firm holds its Client information, which may include the use of cloud storage (which may be in New Zealand or overseas). The Firm may use a third party (including an overseas provider) to store and process personal information on behalf of the Firm.
8.4 Where the Client is an individual; the Client has rights of access to, and correction of, its personal information as provided for in the Privacy Act 1993. Where the Client is a body corporate or employs staff the Client will ensure that its staff are aware of (and, if requested by the Privacy Act 1993, agree to) the collection of personal information contemplated by this clause and of the access and correction rights available under the Privacy Act 1993.

9. Consumer Guarantees Act 1993
9.1 Nothing in these Standard Terms affects the Client's rights under the Consumer Guarantees Act 1993.
9.2 If, however, the Client acquires services for the purposes of trade or business, then the Client acknowledges that, to the maximum extent permitted by law, the provisions of the Consumer Guarantees Act 1993 do not apply to the Contract.

10. Health and Safety
10.1 Each party will comply with its obligations under relevant health & safety legislation, including the Health and Safety at Work Act 2015, all regulations, by-laws, codes of practice and any other standards which are applicable to workplace health and safety.
10.2 In particular, the Client will take reasonably practical steps within its control to ensure that the Site is safe and free of hazards The Firm will report to the Client any hazards identified by the Firm that could give rise to reasonably foreseeable risks to health and safety. The Client will take appropriate action to, where reasonably practicable, eliminate or, if not possible, mitigate, risk from such hazards.
10.3 In addition, the Client will consult, co-operate and co-ordinate its activities with the Firm and any other contractors on the Site, so far as is reasonably practicable, in relation to health and safety.

11. Liabilities and Insurance
Limits of Liability
11.1 Notwithstanding any other provision of the Contract, and to the maximum extent permitted by law, the total aggregate liability of the Firm to the Client for damages or losses (in contract, tort or otherwise, including negligence) in any way connected with the Services or the project is limited to the lesser of five times the amount of the fees or $100,000. In addition, to the maximum extent permitted by law, in no event will the Firm be liable for any indirect, consequential or special loss or damage (including loss of profit), or for any loss of savings, opportunities or data.
11.2 If either party is found liable to the other (whether in contract, tort or otherwise) and the claiming party and / or a third party has contributed to the loss or damage, the liable party shall only be liable to the extent of its own contribution.
11.3 To the maximum extent permitted by law, the Firm will not be liable to the Client for any loss or damage resulting from or connected with the Services or the project occurring after six years from the earlier of the date the Services were completed or termination of the Contract.
11.4 If the Client has engaged the Firm to perform Services which the Client has contracted to provide to a third party (the Principal) the Firm's liability to the Principal is likewise limited and the Client warrants that it is the Principal's agent for the purpose of the Contract.
Insurance
11.5 The Firm must effect and maintain for the duration of the Services:
    11.5.1 professional indemnity insurance for the minimum amount of cover specified in Schedule 1 in respect of any single occurrence and in the aggregate for liability arising from a breach of professional duty whether owed in contract, tort or otherwise or by reason of any act or omission by the Firm; and
    11.5.2 public liability insurance for the minimum amount of cover specified in Schedule 1.
11.6 The Firm must use reasonable endeavours to keep the professional indemnity cover required by the Contract in force for six years after the completion of the Services or termination of the Contract.
11.7 If required by the Client, the Firm must provide certificates evidencing the insurance cover required by these Standard Terms.

12. Dispute Resolution
12.1 If there is a dispute between the parties, then the parties agree to meet in good faith in the first instance in order to use their best endeavours to resolve the dispute.
12.2 If the parties are unable to reach agreement, then the parties will pursue mediation. The parties will agree on a suitable person to act as mediator.
12.3 If the parties fail to agree on the identity of the mediator within 10 Business Days of the dispute being referred to mediation, the mediator will be appointed by the President of the Arbitrators' and Mediators' Institute of New Zealand Inc (Institute), upon the application of any party.
12.4 If the Dispute is not resolved by mediation in accordance with the above provisions 10 Business Days' after a mediation conference, then the Dispute will be referred to and finally resolved by arbitration.
12.5 The arbitration will be conducted in accordance with the Arbitration Protocol of the Institute, the tribunal of which will consist of one arbitrator agreed to by the parties. If the parties fail to agree on the identity of the arbitrator within 10 Business Days from the date upon which the Dispute is referred to arbitration then the arbitrator will be appointed by the Institute. The place of the arbitration will be in held in the geographical location of the Firm's the principal place of business.
12.6 Each party will bear its own costs in relation to any dispute resolution and the parties agree that they will continue to perform their obligations under this Agreement.
12.7 Pending final resolution of any Dispute, neither of the parties will make any press release, public announcement or statement concerning the subject matter of the Dispute to any person (except as expressly or by implication authorised in this Agreement).
12.8 This clause 12 does not restrict or limit the right of either party from taking immediate steps to obtain relief before an appropriate court, or to terminate the Contract where the Contract provides such a right.
12.9 If the Construction Contracts Act 2002 applies to the Contract then either party may refer the dispute to adjudication. The parties may agree to suspend the dispute resolution process under clause 12 at any stage due to any adjudication proceedings, but in the absence of such agreement the provisions of clause 12 will continue to apply.

13. General Provisions
13.1 In the Contract, unless the context otherwise requires:
Business Day means a day other than a Saturday, a Sunday, a national public holiday or the regional anniversary day in the place where the Firm has its principal place of business;
Contract means the engagement letter to which these Standard Terms are attached, together with Schedule 1, and, if any Specialist Services are provided, then it will include the Specialist Services Schedule;
Documents means any drawings, specifications, reports and other technical information provided to the Client by the Firm or any of its Related Companies, and includes any Images;
Images means photographic images, video images, videography and any other images captured by the Firm;
Regulated Authority means any regulator, authority or regulatory body which includes: any local authorities, national authorities, and any other bodies which have a regulatory function;
Services means the services described in Schedule 1 and in any variation under clause 5;
Site means the site described in Schedule 1;
Specialist Services means the provision of services using specialist equipment or services that may require specialist skills to be provided;
Specialist Services Schedule means a schedule described as a Specialist Service Schedule provided by the Firm to the Client setting out the terms of which are provided by the Firm;
Standard Terms means these standard terms contained in this Schedule 2.
13.2 The terms Payment Claim, Payment Schedule and Progress Payment have the meanings given to them in section 5 of the Construction Contracts Act 2002.
13.3 In this Contract, a reference to a Schedule is to a schedule of the engagement letter to which these Standard Terms are attached or a schedule provided as part of a variation under clause 5.
13.4 Each party to the Contract will do all things reasonably required by any other party to effectively carry out and give effect to the terms and intentions of the Contract.
13.5 Any notice or other communication to be given under the Contract must be in writing, in English, and delivered by hand (including by courier), or sent by post or email to the relevant address noted in Schedule 1. All notices given in accordance with the Contract will be deemed to have been delivered as follows:
    13.5.1 if it is delivered by hand (including by courier), at the time of delivery to a person authorised or reasonably appearing to be authorised to accept deliveries on behalf of the receiving Party;
    13.5.2 if posted, at the expiration of seven Business Days after the pre-paid envelope containing the same was delivered into the custody of the postal authorities; or
    13.5.3 if communicated by email, at the time the sender's email system records that the email was successfully dispatched to the named recipient and provided that the sender's computer system has not received an automated response that the email has not been delivered,
provided that where any such delivery or transmission occurs after 5.00 pm on a Business Day or on a day which is not a Business Day, delivery will be deemed to occur at 9.00 am on the next following Business Day.
13.6 Neither the Firm nor the Client will be liable for any act, omission or failure under the Contract (except failure to meet an obligation to pay money) if that act, omission or failure arises directly from an event or circumstances beyond the reasonable control of the party concerned, including, without limitation, extreme weather conditions, civil disruption or industry wide industrial action.
13.7 The Contract is binding on and will ensure to the benefit of the parties and their respective successors. The parties must not assign or transfer all or part of their rights or obligations under the Contract without the prior written consent of the other party.
13.8 Failure by a party to enforce at any time any one or more of the terms or conditions of the Contract is not a waiver of that party's right to subsequently enforce at any time any one or more of the terms or conditions of the Contract.
13.9 Confidential information supplied to a party to the Contract, or of which a party becomes aware as a result of that party's dealings in connection with the operation of the Contract, remains the property of the originating party. The parties agree to treat confidential information as strictly confidential and not to use or attempt to use any of the confidential information in any manner or for any purpose other than to fulfil its obligations described in the Contract. A party may disclose confidential information of the other party to its related entities and personnel, but only where they have a need to know the confidential information for the purpose of fulfilling that party's obligations under the Contract or to obtain the full intended benefit of the Contract and before doing so must ensure that they are made aware of the confidentiality obligations under the Contract and are bound by a corresponding confidentiality obligation. A party may also disclose the other party's confidential information to its professional advisors, bankers and insurers, provided it first obtains a similar confidentiality undertaking.
13.10 This Agreement is to be governed by and construed in accordance with the laws of New Zealand.`

    const pdfData = {
      project_title: cleanText(project_title),
      client: {
        company_name: cleanText(client.company_name || 'Client'),
        contact_person: cleanText(client.contact_person || ''),
        email: client.email || '',
        phone: cleanText(client.phone || ''),
        address: client.address || {}
      },
      scope_of_work: cleanText(scope_of_work || ''),
      fee_structure: fee_structure.map((item: any) => ({
        description: cleanText(item.description || ''),
        cost: Number(item.cost || 0)
      })),
      total_fee: total_fee,
      total_fee_with_gst: total_fee_with_gst,
      assumptions: cleanText(assumptions || ''),
      exclusions: cleanText(exclusions || ''),
      standard_terms: STANDARD_TERMS,
      include_signatures: includeSignatures,
      signature_record: signatureRecord ? {
        client_signature: signatureRecord.client_signature ? 'Present' : 'Not provided',
        lysaght_signature: signatureRecord.lysaght_signature ? 'Present' : 'Not provided',
        client_signer_name: signatureRecord.client_signer_name || '',
        client_signed_date: signatureRecord.client_signed_date || '',
        lysaght_signed_date: signatureRecord.lysaght_signed_date || ''
      } : null
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'TOE PDF data prepared successfully',
        data: pdfData,
        note: 'This is a simplified version. In production, use pdf-lib to generate actual PDF'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in generateTOEPDF:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        stack: error.stack 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
