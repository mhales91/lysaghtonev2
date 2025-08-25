
import React, { useState, useEffect } from "react";
import { TOE, Client, TagLibrary, Project, TOESignature, CompanySettings, Task, TaskTemplate } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Send, Eye } from "lucide-react";

import TOEList from "../components/toe/TOEList";
import TOEWizard from "../components/toe/TOEWizard";
import TOEPreview from "../components/toe/TOEPreview";
import SignatureModal from "../components/toe/SignatureModal";
import { generateTOEPDF } from '@/api/functions';
import { generateSignedDocument } from '@/api/functions';

export default function TOEBuilder() {
  const [toes, setToes] = useState([]);
  const [clients, setClients] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingTOE, setEditingTOE] = useState(null);
  const [previewTOE, setPreviewTOE] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for signature modal
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingToe, setSigningToe] = useState(null);
  const [postSignatureCallback, setPostSignatureCallback] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [toeData, clientData] = await Promise.all([
      TOE.list('-created_date'),
      Client.list()
    ]);
    setToes(toeData);
    setClients(clientData);
    setIsLoading(false);
  };

  const handleSaveTOE = async (toeData) => {
    if (editingTOE) {
      await TOE.update(editingTOE.id, toeData);
    } else {
      await TOE.create(toeData);
    }
    setShowWizard(false);
    setEditingTOE(null);
    loadData();
  };

  const handleEditTOE = (toe) => {
    setEditingTOE(toe);
    setShowWizard(true);
  };

  const handleDeleteTOE = async (toeId) => {
    if (confirm('Are you sure you want to delete this TOE? This action cannot be undone.')) {
        try {
            await TOE.delete(toeId);
            await loadData();
        } catch (error) {
            console.error('Failed to delete TOE:', error);
            alert('There was an error deleting the TOE.');
        }
    }
  };

  const handleSendTOE = async (toeId) => {
    // Update status and set sent date
    await TOE.update(toeId, {
      status: 'sent',
      sent_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days
    });
    loadData();
  };

  const handlePreview = (toe) => {
    setPreviewTOE(toe);
  };

  const handleCreateProject = async (toe) => {
    try {
      let signedToeUrl = null;

      // Automatically generate, upload, and attach the signed TOE PDF
      if (toe.status === 'signed') {
        const signatureRecords = await TOESignature.filter({ toe_id: toe.id });
        const client = clients.find(c => c.id === toe.client_id);
        
        if (signatureRecords.length > 0 && client) {
          const signatureRecord = signatureRecords[0];
          const pdfPayload = {
            project_title: toe.project_title,
            status: toe.status,
            scope_of_work: toe.scope_of_work,
            fee_structure: toe.fee_structure,
            total_fee: toe.total_fee,
            total_fee_with_gst: toe.total_fee_with_gst,
            assumptions: toe.assumptions,
            exclusions: toe.exclusions,
            client: {
                company_name: client.company_name,
                contact_person: client.contact_person,
                email: client.email,
                phone: client.phone,
            },
            signatureRecord: signatureRecord,
            includeSignatures: true,
          };
          
          const pdfResponse = await generateTOEPDF(pdfPayload);

          if (pdfResponse.status === 200 && pdfResponse.data?.pdfBase64) {
            // Decode Base64 and create a Blob
            const byteCharacters = atob(pdfResponse.data.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const pdfBlob = new Blob([byteArray], { type: 'application/pdf' });

            const pdfFile = new File([pdfBlob], `${toe.project_title}-signed.pdf`, { type: 'application/pdf' });
            
            const uploadResponse = await UploadFile({ file: pdfFile });
            if (uploadResponse.file_url) {
              signedToeUrl = uploadResponse.file_url;
            } else {
              console.warn("PDF upload successful, but no file URL was returned.");
            }
          } else {
             console.error('Failed to generate signed TOE PDF for project creation.');
          }
        }
      }

      let projectData = {
        toe_id: toe.id,
        client_id: toe.client_id,
        project_name: toe.project_title,
        budget_fees: toe.total_fee_with_gst,
        status: 'not_started',
        billing_model: 'fixed_fee',
        signed_toe_url: signedToeUrl, // Attach the generated PDF URL
      };
      
      const settingsList = await CompanySettings.list();
      if (settingsList.length > 0) {
        const settings = settingsList[0];
        projectData.job_number = settings.job_seed;
        
        const createdProject = await Project.create(projectData);
        
        await CompanySettings.update(settings.id, { 
          job_seed: settings.job_seed + 1 
        });

        // Create tasks from linked task templates in fee structure
        if (toe.fee_structure && toe.fee_structure.length > 0) {
          for (const feeItem of toe.fee_structure) {
            if (feeItem.linked_task_templates && feeItem.linked_task_templates.length > 0) {
              for (const templateId of feeItem.linked_task_templates) {
                try {
                  const template = await TaskTemplate.get(templateId);
                  if (template) {
                    await Task.create({
                      project_id: createdProject.id,
                      task_name: template.name,
                      section: template.dept,
                      estimated_hours: parseFloat(feeItem.time_estimate) || template.default_hours,
                      is_billable: template.is_billable,
                      template_id: template.id,
                      assignee_email: '', // Will be assigned later
                      status: 'not_started',
                      completion_percentage: 0,
                      priority: 'medium'
                    });
                  }
                } catch (taskError) {
                  console.error(`Error creating task from template ${templateId}:`, taskError);
                }
              }
            }
          }
        }
        
      } else {
        // Fallback if no settings exist
        projectData.job_number = 10000;
        await Project.create(projectData);
        await CompanySettings.create({ job_seed: 10001 });
      }

      // Mark TOE as having project created
      await TOE.update(toe.id, { project_created: true });
      
      alert(`Project created successfully with linked tasks! You can now manage it in the Projects section.`);
      loadData();
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    }
  };

  const handleDownloadSignedTOE = async (toe) => {
    try {
        const signatureRecords = await TOESignature.filter({ toe_id: toe.id });
        const signatureRecord = signatureRecords[0];
        const client = clients.find(c => c.id === toe.client_id);

        if (!signatureRecord || !client) {
            alert("Signature or client data not found for this TOE.");
            return;
        }

        const pdfPayload = {
            project_title: toe.project_title,
            status: toe.status,
            scope_of_work: toe.scope_of_work,
            fee_structure: toe.fee_structure,
            total_fee: toe.total_fee,
            total_fee_with_gst: toe.total_fee_with_gst,
            assumptions: toe.assumptions,
            exclusions: toe.exclusions,
            client: {
                company_name: client.company_name,
                contact_person: client.contact_person,
                email: client.email,
                phone: client.phone,
            },
            signatureRecord: signatureRecord,
            includeSignatures: true,
        };

        const response = await generateTOEPDF(pdfPayload);

        if (response.status === 200 && response.data) {
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${toe.project_title || 'TOE'}-Signed.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } else {
            throw new Error('Failed to generate signed PDF.');
        }
    } catch (error) {
        console.error('Error downloading signed TOE:', error);
        alert('Could not download the signed TOE PDF. Please try again.');
    }
  };

  const handleDownloadSignedTOETest = async (toe) => {
    try {
        const client = clients.find(c => c.id === toe.client_id);
        if (!client) {
            alert("Client data not found for this TOE.");
            return;
        }

        alert("Starting complete signing process test...");

        // Step 1: Create/Get signature record with share token (simulating "Get Share Link")
        let signatureRecord = (await TOESignature.filter({ toe_id: toe.id }))[0];
        let shareToken;
        
        if (!signatureRecord) {
            shareToken = Math.random().toString(36).substring(2, 15);
            signatureRecord = await TOESignature.create({
                toe_id: toe.id,
                share_token: shareToken,
                // Add Lysaght signature if it doesn't exist
                lysaght_signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/atS6VwAAAAASUVORK5CYII=",
                lysaght_signed_date: new Date().toISOString(),
            });
        } else {
            shareToken = signatureRecord.share_token;
            // Ensure Lysaght signature exists
            if (!signatureRecord.lysaght_signature) {
                await TOESignature.update(signatureRecord.id, {
                    lysaght_signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/atS6VwAAAAASUVORK5CYII=",
                    lysaght_signed_date: new Date().toISOString(),
                });
            }
        }

        console.log("Share token created/retrieved:", shareToken);

        // Step 2: Simulate client signing process
        alert("Simulating client signing process...");
        
        // Update signature record with client signature (simulating what happens when client signs)
        const updatedSignatureRecord = await TOESignature.update(signatureRecord.id, {
            client_signature: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/atS6VwAAAAASUVORK5CYII=",
            client_signer_name: `${client.contact_person} (TEST)`,
            client_signer_title: "Authorized Representative",
            client_signed_date: new Date().toISOString(),
            fully_executed: true,
        });

        // Step 3: Update TOE status to signed
        await TOE.update(toe.id, {
            status: 'signed',
            signed_date: new Date().toISOString().split('T')[0]
        });

        alert("Client signature simulation complete. Now generating final signed PDF...");

        // Step 4: Fetch the updated signature record and generate final PDF
        const finalSignatureRecord = await TOESignature.get(signatureRecord.id);
        
        const pdfPayload = {
            project_title: toe.project_title,
            scope_of_work: toe.scope_of_work,
            fee_structure: toe.fee_structure,
            total_fee: toe.total_fee,
            total_fee_with_gst: toe.total_fee_with_gst,
            assumptions: toe.assumptions,
            exclusions: toe.exclusions,
            client: {
                company_name: client.company_name,
                contact_person: client.contact_person,
                email: client.email,
                phone: client.phone,
            },
            signatureRecord: {
                client_signature: finalSignatureRecord.client_signature,
                client_signer_name: finalSignatureRecord.client_signer_name,
                client_signer_title: finalSignatureRecord.client_signer_title,
                client_signed_date: finalSignatureRecord.client_signed_date,
                lysaght_signature: finalSignatureRecord.lysaght_signature,
                lysaght_signed_date: finalSignatureRecord.lysaght_signed_date,
            },
            includeSignatures: true,
        };

        // Step 5: Generate and download the signed PDF
        const response = await generateSignedDocument(pdfPayload);

        if (response.status === 200 && response.data) {
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${toe.project_title || 'TOE'}-COMPLETE-PROCESS-TEST.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            
            alert("Complete signing process test successful! Check the downloaded PDF for signatures.");
            
            // Refresh the data to show updated status
            loadData();
        } else {
            throw new Error('Failed to generate signed PDF from complete process test.');
        }
    } catch (error) {
        console.error('Error in complete signing process test:', error);
        alert('Complete signing process test failed: ' + error.message);
    }
  };

  const handleDuplicateTOE = async (toe) => {
    try {
      const { id, created_date, updated_date, created_by, ...restOfToe } = toe;
      const newToeData = {
          ...restOfToe,
          project_title: `${toe.project_title} (Copy)`,
          status: 'draft',
          version: '1.0',
          sent_date: null,
          signed_date: null,
          expiry_date: null,
          project_created: false,
          signed_document_url: null,
          signed_document_content: null,
          signature_status: 'pending',
      };
      
      await TOE.create(newToeData);
      alert('TOE duplicated successfully.');
      loadData();
    } catch (error) {
      console.error('Error duplicating TOE:', error);
      alert('Failed to duplicate TOE.');
    }
  };

  const getOrCreateShareToken = async (toe, lysaghtSignature = null) => {
    let sigRecord = (await TOESignature.filter({ toe_id: toe.id }))[0];
    if (sigRecord) {
        if (lysaghtSignature && !sigRecord.lysaght_signature) {
            // Use NZ timezone for the signed date
            const nzDate = new Date().toLocaleString("sv-SE", {timeZone: "Pacific/Auckland"});
            await TOESignature.update(sigRecord.id, { 
                lysaght_signature: lysaghtSignature,
                lysaght_signed_date: nzDate,
            });
        }
        return sigRecord.share_token;
    } else {
        const shareToken = Math.random().toString(36).substring(2, 15);
        const createData = {
            toe_id: toe.id,
            share_token: shareToken,
        };
        if (lysaghtSignature) {
            // Use NZ timezone for the signed date
            const nzDate = new Date().toLocaleString("sv-SE", {timeZone: "Pacific/Auckland"});
            createData.lysaght_signature = lysaghtSignature;
            createData.lysaght_signed_date = nzDate;
        }
        await TOESignature.create(createData);
        return shareToken;
    }
  };

  const generateShareLink = async (toe) => {
    const proceed = async (signature = null) => {
        const token = await getOrCreateShareToken(toe, signature);
        const url = `${window.location.origin}/TOESign?token=${token}`;
        
        // Copy to clipboard and show success message
        try {
          await navigator.clipboard.writeText(url);
          alert('Signing link copied to clipboard!\n\nShare this link with your client - no login required.');
        } catch (error) {
          // Fallback for browsers that don't support clipboard API
          const textArea = document.createElement('textarea');
          textArea.value = url;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          alert('Signing link copied to clipboard!\n\nShare this link with your client - no login required.');
        }
    };

    const sigRecord = (await TOESignature.filter({ toe_id: toe.id }))[0];
    if (sigRecord && sigRecord.lysaght_signature) {
        await proceed();
    } else {
        setSigningToe(toe);
        setPostSignatureCallback(() => proceed);
        setShowSignatureModal(true);
    }
  };

  const handleSaveSignature = async (signatureData) => {
      if (postSignatureCallback) {
          await postSignatureCallback(signatureData);
      }
      setShowSignatureModal(false);
      setSigningToe(null);
      setPostSignatureCallback(null);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TOE Builder</h1>
            <p className="text-gray-600">Create and manage Terms of Engagement documents</p>
          </div>
          <Button 
            onClick={() => setShowWizard(true)}
            style={{ backgroundColor: '#5E0F68' }}
            className="hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New TOE
          </Button>
        </div>

        {/* TOE List */}
        <TOEList 
          toes={toes}
          clients={clients}
          isLoading={isLoading}
          onEdit={handleEditTOE}
          onSend={handleSendTOE}
          onPreview={handlePreview}
          onCreateProject={handleCreateProject}
          onDuplicate={handleDuplicateTOE}
          onGenerateLink={generateShareLink}
          onDelete={handleDeleteTOE}
          onDownloadSigned={handleDownloadSignedTOE}
          onDownloadSignedTest={handleDownloadSignedTOETest}
        />

        {/* TOE Wizard Modal */}
        {showWizard && (
          <TOEWizard
            toe={editingTOE}
            clients={clients}
            onSave={handleSaveTOE}
            onCancel={() => {
              setShowWizard(false);
              setEditingTOE(null);
            }}
          />
        )}

        {/* TOE Preview Modal */}
        {previewTOE && (
          <TOEPreview
            toe={previewTOE}
            clients={clients}
            onClose={() => setPreviewTOE(null)}
          />
        )}

        {/* Lysaght Signature Modal */}
        {showSignatureModal && (
          <SignatureModal
            onClose={() => setShowSignatureModal(false)}
            onSave={handleSaveSignature}
            title={`Provide Signature for: ${signingToe?.project_title}`}
          />
        )}
      </div>
    </div>
  );
}
