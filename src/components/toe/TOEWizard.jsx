
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { TagLibrary, CompanySettings, TOESignature, TaskTemplate, Client, User, TOELibraryItem } from "@/api/entities";
import { handleSignature } from "@/api/signature-functions";
import { X, Save, Plus, Trash2, Sparkles, Loader2, Calculator, FileDown, Share, Edit2, UserCheck } from "lucide-react";
import { toast } from 'sonner';

import CostCalculator from "./CostCalculator";
import TagSelector from "./TagSelector"; // This component might still be useful for general tags, but its specific uses in Scope/Assumptions/Exclusions steps are replaced by library items.
import SignatureModal from "./SignatureModal";
import ClientForm from "../crm/ClientForm";

export default function TOEWizard({ toe, clients, users, onSave, onCancel }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false); // This state is no longer strictly needed but is left for now.
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [showCostCalculator, setShowCostCalculator] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [lysaghtSignatureRecord, setLysaghtSignatureRecord] = useState(null);
  const [isSignatureLoading, setIsSignatureLoading] = useState(false);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [allClients, setAllClients] = useState(clients);
  const [allUsers, setAllUsers] = useState(users);
  const [libraryItems, setLibraryItems] = useState([]); // New state for library items
  const [reviewers, setReviewers] = useState([]); // For internal review step
  const [showPreReviewVersion, setShowPreReviewVersion] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [formData, setFormData] = useState({
    client_id: toe?.client_id || '',
    project_title: toe?.project_title || '',
    scope_of_work: toe?.scope_of_work || '',
    fee_structure: toe?.fee_structure || [
      { description: '', cost: 0, time_estimate: '', staff_breakdown: [], linked_task_templates: [] }
    ],
    assumptions: toe?.assumptions || '',
    exclusions: toe?.exclusions || '',
    version: toe?.version || '1.0',
    ai_tags: toe?.ai_tags || [],
    project_summary: toe?.project_summary || ''
  });

  useEffect(() => {
    loadData();
    if (toe?.id) {
      loadSignatureRecord(toe.id);
    } else {
      setLysaghtSignatureRecord(null);
    }
  }, [toe]);

  // Check if this TOE has a pre-review version
  const hasPreReviewVersion = !!toe?.pre_review_version;

  const loadData = async () => {
    try {
      const [tags, settings, templates, usersData, library, clientsData] = await Promise.all([
        TagLibrary.list(),
        CompanySettings.list(),
        TaskTemplate.list(),
        User.list(),
        TOELibraryItem.list(), // Load library items
        Client.list() // Load clients
      ]);
      setSuggestedTags(tags.slice(0, 10));
      setCompanySettings(settings[0] || {});
      setTaskTemplates(templates || []);
      setAllUsers(usersData || []);
      setLibraryItems(library || []);
      setAllClients(clientsData || []); // Set clients from database
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSaveNewClient = async (clientData) => {
      try {
          const newClient = await Client.create(clientData);
          setShowClientForm(false);
          const updatedClients = [...allClients, newClient];
          setAllClients(updatedClients);
          handleInputChange('client_id', newClient.id);
          alert("New client created and selected.");
      } catch (error) {
          console.error("Failed to create new client:", error);
          alert("Error creating new client.");
      }
  };

  const loadSignatureRecord = async (toeId) => {
    setIsSignatureLoading(true);
    try {
      const result = await handleSignature('get', { toe_id: toeId });
      setLysaghtSignatureRecord(result.signature);
    } catch (error) {
      console.error("Failed to load Lysaght signature record:", error);
      setLysaghtSignatureRecord(null);
    } finally {
      setIsSignatureLoading(false);
    }
  };
  
  const handleSaveLysaghtSignature = async (signatureData) => {
    try {
      const result = await handleSignature('create', {
        toe_id: toe.id,
        signature_data: signatureData,
        signer_name: 'Lysaght Staff', // You might want to get this from the current user
        signer_type: 'lysaght'
      });
      
      setShowSignatureModal(false);
      loadSignatureRecord(toe.id);
    } catch (error) {
      console.error("Failed to save Lysaght signature:", error);
      alert("Failed to save signature.");
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFeeStructureChange = (index, field, value) => {
    const newFeeStructure = [...formData.fee_structure];
    newFeeStructure[index] = {
      ...newFeeStructure[index],
      [field]: field === 'cost' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      fee_structure: newFeeStructure
    }));
  };

  const handleTaskTemplateLink = (feeIndex, templateId, isLinked) => {
    const newFeeStructure = [...formData.fee_structure];
    const currentLinks = newFeeStructure[feeIndex].linked_task_templates || [];
    
    if (isLinked) {
      newFeeStructure[feeIndex].linked_task_templates = [...currentLinks, templateId];
    } else {
      newFeeStructure[feeIndex].linked_task_templates = currentLinks.filter(id => id !== templateId);
    }
    
    setFormData(prev => ({
      ...prev,
      fee_structure: newFeeStructure
    }));
  };

  const addFeeItem = () => {
    setFormData(prev => ({
      ...prev,
      fee_structure: [
        ...prev.fee_structure,
        { description: '', cost: 0, time_estimate: '', staff_breakdown: [], linked_task_templates: [] }
      ]
    }));
  };

  const removeFeeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      fee_structure: prev.fee_structure.filter((_, i) => i !== index)
    }));
  };

  const handleCostCalculation = (index, calculation) => {
    const newFeeStructure = [...formData.fee_structure];
    newFeeStructure[index] = {
      ...newFeeStructure[index],
      cost: calculation.totalCost,
      time_estimate: `${calculation.totalHours} hours`,
      staff_breakdown: calculation.breakdown
    };
    setFormData(prev => ({
      ...prev,
      fee_structure: newFeeStructure
    }));
    setShowCostCalculator(false);
  };

  // Removed generateAISuggestions function from here as per outline.
  // AI review is now handled by the new AIReviewButton component.

  const addTagToField = (tag, field) => {
    const currentText = formData[field] || '';
    const newText = currentText ? `${currentText}\n• ${tag.suggested_text}` : `• ${tag.suggested_text}`;
    handleInputChange(field, newText);
    
    // Update tag usage
    try {
      TagLibrary.update(tag.id, { 
        usage_frequency: (tag.usage_frequency || 0) + 1 
      });
    } catch (error) {
      console.error('Error updating tag usage:', error);
    }
  };

  const addLibraryItemToField = (item, field) => {
    const currentText = formData[field] || '';
    const newText = currentText ? `${currentText}\n• ${item.content}` : `• ${item.content}`;
    handleInputChange(field, newText);
    
    // Update usage count
    try {
      TOELibraryItem.update(item.id, { 
        usage_count: (item.usage_count || 0) + 1 
      });
    } catch (error) {
      console.error('Error updating item usage:', error);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.fee_structure.reduce((sum, item) => sum + (item.cost || 0), 0);
    const gst = subtotal * (companySettings?.tax_rate || 0.15);
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };
  
  const handleReviewerChange = (email, isChecked) => {
    setReviewers(prev => 
      isChecked ? [...prev, email] : prev.filter(r => r !== email)
    );
  };

  // AI Project Summary Generation
  const generateProjectSummary = async () => {
    if (!formData.project_title || !getSelectedClient()) {
      toast.error('Project title and client selection required for AI summary generation');
      return;
    }

    setIsGeneratingSummary(true);
    
    try {
      const prompt = `Generate a professional project summary for a Terms of Engagement document based on the following information:

PROJECT DETAILS:
- Project Title: ${formData.project_title}
- Client: ${getSelectedClient()?.company_name || getSelectedClient()?.name}
- Contact Person: ${getSelectedClient()?.contact_person || 'Not specified'}
- Project Location: ${getSelectedClient()?.address ? 
  `${getSelectedClient().address.street || ''}, ${getSelectedClient().address.city || ''} ${getSelectedClient().address.postcode || ''}`.trim() : 
  'Not specified'}

SCOPE OF WORK:
${formData.scope_of_work || 'Not defined'}

FEE STRUCTURE:
${formData.fee_structure?.map(item => `- ${item.description}: $${item.cost}`).join('\n') || 'Not defined'}

ASSUMPTIONS:
${formData.assumptions || 'Not defined'}

EXCLUSIONS:
${formData.exclusions || 'Not defined'}

Please generate a comprehensive project summary that:
1. Provides a clear overview of the project scope and objectives
2. Highlights key deliverables and outcomes
3. Mentions the project location and client context
4. Summarizes the professional services to be provided
5. Is written in a professional, client-facing tone
6. Is suitable for inclusion in a formal Terms of Engagement document
7. Should be 2-3 paragraphs in length
8. Focuses on the value and outcomes for the client

The summary should be compelling and help the client understand exactly what they will receive from this engagement.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          prompt,
          model: 'gpt-4o',
          systemPrompt: 'You are a professional business consultant specializing in creating clear, compelling project summaries for Terms of Engagement documents. Focus on client value and professional outcomes.'
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && (data.reply || data.response)) {
        handleInputChange('project_summary', data.reply || data.response);
        toast.success('Project summary generated successfully!');
      } else {
        throw new Error(data.error || 'No summary generated');
      }
    } catch (error) {
      console.error('Error generating project summary:', error);
      toast.error(`Error generating project summary: ${error.message}`);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Project Summary Validation
  const validateProjectSummary = () => {
    if (!formData.project_summary?.trim()) {
      return { isValid: false, message: 'Project summary is required for the introductory letter' };
    }
    
    if (formData.project_summary.length < 50) {
      return { isValid: false, message: 'Project summary should be at least 50 characters long' };
    }
    
    if (formData.project_summary.length > 2000) {
      return { isValid: false, message: 'Project summary should be less than 2000 characters' };
    }
    
    return { isValid: true, message: 'Project summary looks good!' };
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    
    try {
      const { subtotal, total } = calculateTotals();
      
      // Validate project summary
      const summaryValidation = validateProjectSummary();
      if (!summaryValidation.isValid) {
        toast.error(summaryValidation.message);
        setIsSaving(false);
        return;
      }
      
      // Clean and validate the data before sending
      const submitData = {
        client_id: formData.client_id,
        project_title: formData.project_title?.trim(),
        scope_of_work: formData.scope_of_work?.trim(),
        fee_structure: formData.fee_structure.filter(item => 
          item.description?.trim() || item.cost > 0
        ),
        assumptions: formData.assumptions?.trim(),
        exclusions: formData.exclusions?.trim(),
        version: formData.version,
        ai_tags: formData.ai_tags || [],
        project_summary: formData.project_summary?.trim(),
        total_fee: subtotal,
        total_fee_with_gst: total,
        status: 'draft'
      };

      // Validate required fields
      if (!submitData.client_id || !submitData.project_title) {
        toast.error('Please fill in all required fields (Client and Project Title)');
        setIsSaving(false);
        return;
      }

      await onSave(submitData, { reviewers });
    } catch (error) {
      console.error('Error saving TOE:', error);
      toast.error('Error saving TOE. Please try again.');
    }
    
    setIsSaving(false);
  };

  const exportToWord = async () => {
    // This would integrate with a Word export service
    alert('Word export functionality would be implemented here');
  };

  const generateShareLink = async () => {
    if (!toe || !toe.id) {
        alert("Please save the TOE before generating a share link.");
        return;
    }

    // Re-fetch latest signature record to ensure we have the most up-to-date data
    try {
      const result = await handleSignature('get', { toe_id: toe.id });
      const currentSigRecord = result.signature;

      if (!currentSigRecord?.lysaght_signature) {
        alert("Lysaght signature is required before generating a share link. Please provide a signature in the 'Review' step.");
        setCurrentStep(6);
        return;
      }
      
      // Generate or get share token
      let shareToken = currentSigRecord.share_token;
      if (!shareToken) {
        // Create a new share token
        shareToken = crypto.randomUUID();
        await handleSignature('create', {
          toe_id: toe.id,
          signature_data: currentSigRecord.lysaght_signature,
          signer_name: currentSigRecord.lysaght_signer_name || 'Lysaght Staff',
          signer_type: 'lysaght',
          share_token: shareToken
        });
      }
      
      const shareUrl = `${window.location.origin}/TOESign?token=${shareToken}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error("Failed to create share link:", error);
      alert("Could not create share link. Please try again.");
    }
  };

  const steps = [
    { number: 1, title: 'Project Details', description: 'Basic project information' },
    { number: 2, title: 'Scope of Work', description: 'Define project scope' },
    { number: 3, title: 'Fee Structure', description: 'Set pricing and fees' },
    { number: 4, title: 'Assumptions & Exclusions', description: 'Add conditions' },
    { number: 5, title: 'Internal Review', description: 'Request peer review' },
    { number: 6, title: 'Review & Finalize', description: 'Final review and save' }
  ];

  const getSelectedClient = () => {
    return allClients.find(c => c.id === formData.client_id);
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return !!(formData.client_id && formData.project_title?.trim());
      case 2:
        return !!(formData.scope_of_work?.trim());
      case 3:
      case 4:
      case 5:
        return true; // No strict validation for these steps
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length && canProceedToNext()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getDisplayedFeeStructure = () => {
    return showPreReviewVersion && hasPreReviewVersion
      ? toe.pre_review_version.fee_structure || []
      : formData.fee_structure;
  }

  const calculateDisplayedTotals = () => {
    const displayedFeeStructure = getDisplayedFeeStructure();
    const subtotal = displayedFeeStructure.reduce((sum, item) => sum + (item.cost || 0), 0);
    const gst = subtotal * (companySettings?.tax_rate || 0.15);
    const total = subtotal + gst;
    return { subtotal, gst, total };
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">
                {toe ? 'Edit Terms of Engagement' : 'Create New Terms of Engagement'}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
              </p>
              {hasPreReviewVersion && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Review Changes Applied
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreReviewVersion(!showPreReviewVersion)}
                    className="text-xs"
                  >
                    {showPreReviewVersion ? 'Show Current Version' : 'Show Pre-Review Version'}
                  </Button>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {toe && (
                <>
                  <Button variant="outline" onClick={exportToWord}>
                    <FileDown className="w-4 h-4 mr-2" />
                    Export Word
                  </Button>
                  <Button variant="outline" onClick={generateShareLink}>
                    <Share className="w-4 h-4 mr-2" />
                    Share for Signature
                  </Button>
                </>
              )}
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto">
            {steps.map((step) => (
              <div 
                key={step.number} 
                className={`flex items-center min-w-0 cursor-pointer`}
                onClick={() => setCurrentStep(step.number)}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  currentStep === step.number 
                    ? 'bg-purple-600 text-white' 
                    : currentStep > step.number
                    ? 'bg-purple-200 text-purple-800'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}>
                  {step.number}
                </div>
                <div className="ml-2 hidden md:block">
                  <p className="text-sm font-medium whitespace-nowrap">{step.title}</p>
                  <p className="text-xs text-gray-500 whitespace-nowrap">{step.description}</p>
                </div>
                {step.number < steps.length && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    currentStep > step.number ? 'bg-purple-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {/* Show pre-review version notice */}
          {hasPreReviewVersion && showPreReviewVersion && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Viewing Pre-Review Version:</strong> This is how the TOE looked before review changes were applied on {toe.pre_review_version?.saved_at ? new Date(toe.pre_review_version.saved_at).toLocaleDateString() : 'an unknown date'}.
              </p>
            </div>
          )}

          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="project_title">Project Title *</Label>
                  <Input
                    id="project_title"
                    value={formData.project_title}
                    onChange={(e) => handleInputChange('project_title', e.target.value)}
                    placeholder="Enter project title"
                    required
                    readOnly={showPreReviewVersion}
                    className={showPreReviewVersion ? 'bg-gray-50' : ''}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="client">Client *</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.client_id}
                      onValueChange={(value) => handleInputChange('client_id', value)}
                      disabled={showPreReviewVersion}
                    >
                      <SelectTrigger className={showPreReviewVersion ? 'bg-gray-50' : ''}>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {allClients.map(client => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name || client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" onClick={() => setShowClientForm(true)} disabled={showPreReviewVersion}>
                      <Plus className="w-4 h-4 mr-2" /> New
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => handleInputChange('version', e.target.value)}
                  readOnly={showPreReviewVersion}
                  className={showPreReviewVersion ? 'bg-gray-50' : ''}
                />
              </div>

              {/* Client Name and Site Address Section */}
              {getSelectedClient() && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="client_name">Client Name *</Label>
                      <Input
                        id="client_name"
                        value={getSelectedClient().contact_person || ''}
                        placeholder="Enter client contact name"
                        readOnly={showPreReviewVersion}
                        className={showPreReviewVersion ? 'bg-gray-50' : ''}
                      />
                      <p className="text-xs text-gray-500">This will be used in the introductory letter salutation</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="site_address">Site Address *</Label>
                      <Textarea
                        id="site_address"
                        value={getSelectedClient().address ? 
                          `${getSelectedClient().address.street || ''}, ${getSelectedClient().address.city || ''} ${getSelectedClient().address.postcode || ''}`.trim() : 
                          ''}
                        placeholder="Enter project site address"
                        rows={3}
                        readOnly={showPreReviewVersion}
                        className={showPreReviewVersion ? 'bg-gray-50' : ''}
                      />
                      <p className="text-xs text-gray-500">This will be used in the introductory letter</p>
                    </div>
                  </div>
                </div>
              )}

              {getSelectedClient() && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Selected Client</h4>
                    <div className="text-sm text-blue-800">
                      <p><strong>{getSelectedClient().company_name || getSelectedClient().name}</strong></p>
                      <p>{getSelectedClient().contact_person}</p>
                      <p>{getSelectedClient().email}</p>
                      {getSelectedClient().tags && (
                        <div className="flex gap-2 mt-2">
                          {getSelectedClient().tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Step 2: Scope of Work */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Scope of Work</h3>
                  <p className="text-sm text-gray-600">Define what work will be performed</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="space-y-2">
                    <Label htmlFor="scope">Scope Description *</Label>
                    <Textarea
                      id="scope"
                      value={showPreReviewVersion && hasPreReviewVersion ? 
                        toe.pre_review_version.scope_of_work : 
                        formData.scope_of_work}
                      onChange={showPreReviewVersion ? undefined : (e) => handleInputChange('scope_of_work', e.target.value)}
                      placeholder="Describe the scope of work to be performed..."
                      rows={8}
                      readOnly={showPreReviewVersion}
                      className={showPreReviewVersion ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="space-y-4">
                    <h4 className="font-medium">Scope Library</h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {libraryItems.filter(item => item.category === 'scope').map(item => (
                        <div 
                          key={item.id} 
                          className={`p-3 border rounded-lg ${showPreReviewVersion ? 'cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50 cursor-pointer'}`} 
                          onClick={showPreReviewVersion ? undefined : () => addLibraryItemToField(item, 'scope_of_work')}
                        >
                          <h5 className="font-medium text-sm">{item.name}</h5>
                          <p className="text-xs text-gray-600 mt-1">{item.content.substring(0, 100)}{item.content.length > 100 ? '...' : ''}</p>
                          {item.tags && item.tags.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {item.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Fee Structure */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Fee Structure</h3>
                  <p className="text-sm text-gray-600">Break down the project costs and link to task templates</p>
                </div>
                <Button onClick={addFeeItem} variant="outline" disabled={showPreReviewVersion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {getDisplayedFeeStructure().map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Fee Item {index + 1}</h4>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCostCalculator(index)}
                            disabled={showPreReviewVersion}
                          >
                            <Calculator className="w-4 h-4 mr-2" />
                            Calculate Cost
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFeeItem(index)}
                            className="text-red-600"
                            disabled={showPreReviewVersion}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-12 gap-4">
                        <div className="md:col-span-6">
                          <Label>Description</Label>
                          <Textarea
                            value={item.description}
                            onChange={showPreReviewVersion ? undefined : (e) => handleFeeStructureChange(index, 'description', e.target.value)}
                            placeholder="e.g. Project Administration"
                            rows={3}
                            readOnly={showPreReviewVersion}
                            className={showPreReviewVersion ? 'bg-gray-50' : ''}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Cost ($)</Label>
                          <Input
                            type="number"
                            value={item.cost}
                            onChange={showPreReviewVersion ? undefined : (e) => handleFeeStructureChange(index, 'cost', e.target.value)}
                            placeholder="0"
                            readOnly={showPreReviewVersion}
                            className={showPreReviewVersion ? 'bg-gray-50' : ''}
                          />
                        </div>
                        <div className="md:col-span-4">
                          <Label>Time Estimate</Label>
                          <Input
                            value={item.time_estimate}
                            onChange={showPreReviewVersion ? undefined : (e) => handleFeeStructureChange(index, 'time_estimate', e.target.value)}
                            placeholder="e.g. 2 weeks"
                            readOnly={showPreReviewVersion}
                            className={showPreReviewVersion ? 'bg-gray-50' : ''}
                          />
                        </div>
                      </div>

                      {item.staff_breakdown && item.staff_breakdown.length > 0 && (
                        <div className="bg-gray-50 p-3 rounded">
                          <h5 className="font-medium mb-2">Staff Breakdown:</h5>
                          <div className="space-y-1 text-sm">
                            {item.staff_breakdown.map((staff, i) => (
                              <div key={i} className="flex justify-between">
                                <span>{staff.role} - {staff.hours} hours</span>
                                <span>${staff.cost.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Task Template Linking */}
                      <div className="border-t pt-4">
                        <Label className="text-sm font-medium">Link Task Templates</Label>
                        <p className="text-xs text-gray-500 mb-3">
                          Select task templates that correspond to this fee item. When a project is created from this TOE, these tasks will be automatically added.
                        </p>
                        <div className="grid md:grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                          {taskTemplates.map(template => {
                            const isLinked = (item.linked_task_templates || []).includes(template.id);
                            return (
                              <div key={template.id} className={`flex items-center space-x-2 p-2 border rounded ${showPreReviewVersion ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                                <Checkbox
                                  id={`fee-${index}-template-${template.id}`}
                                  checked={isLinked}
                                  onCheckedChange={showPreReviewVersion ? undefined : (checked) => handleTaskTemplateLink(index, template.id, checked)}
                                  disabled={showPreReviewVersion}
                                />
                                <Label 
                                  htmlFor={`fee-${index}-template-${template.id}`}
                                  className="text-sm cursor-pointer flex-1"
                                >
                                  {template.name}
                                </Label>
                                <Badge variant="outline" className="text-xs">
                                  {template.dept}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                        {taskTemplates.length === 0 && (
                          <p className="text-sm text-gray-500 italic">
                            No task templates available. Create some in Admin → Task Templates.
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Fee Summary */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${calculateDisplayedTotals().subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({((companySettings?.tax_rate || 0.15) * 100)}%):</span>
                      <span>${calculateDisplayedTotals().gst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg border-t pt-2">
                      <span>Total (incl. GST):</span>
                      <span>${calculateDisplayedTotals().total.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Assumptions & Exclusions */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Assumptions & Exclusions</h3>
              
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="assumptions">Assumptions</Label>
                    <Textarea
                      id="assumptions"
                      value={showPreReviewVersion && hasPreReviewVersion ?
                        toe.pre_review_version.assumptions :
                        formData.assumptions}
                      onChange={showPreReviewVersion ? undefined : (e) => handleInputChange('assumptions', e.target.value)}
                      placeholder="List key assumptions for this project..."
                      rows={6}
                      readOnly={showPreReviewVersion}
                      className={showPreReviewVersion ? 'bg-gray-50' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exclusions">Exclusions</Label>
                    <Textarea
                      id="exclusions"
                      value={showPreReviewVersion && hasPreReviewVersion ?
                        toe.pre_review_version.exclusions :
                        formData.exclusions}
                      onChange={showPreReviewVersion ? undefined : (e) => handleInputChange('exclusions', e.target.value)}
                      placeholder="List what is excluded from this engagement..."
                      rows={6}
                      readOnly={showPreReviewVersion}
                      className={showPreReviewVersion ? 'bg-gray-50' : ''}
                    />
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Assumptions Library</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {libraryItems.filter(item => item.category === 'assumption').map(item => (
                        <div 
                          key={item.id} 
                          className={`p-2 border rounded ${showPreReviewVersion ? 'cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50 cursor-pointer'}`} 
                          onClick={showPreReviewVersion ? undefined : () => addLibraryItemToField(item, 'assumptions')}
                        >
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-600">{item.content.substring(0, 60)}{item.content.length > 60 ? '...' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-medium">Exclusions Library</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {libraryItems.filter(item => item.category === 'exclusion').map(item => (
                        <div 
                          key={item.id} 
                          className={`p-2 border rounded ${showPreReviewVersion ? 'cursor-not-allowed bg-gray-100' : 'hover:bg-gray-50 cursor-pointer'}`} 
                          onClick={showPreReviewVersion ? undefined : () => addLibraryItemToField(item, 'exclusions')}
                        >
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-gray-600">{item.content.substring(0, 60)}{item.content.length > 60 ? '...' : ''}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Internal Review */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                  <h3 className="text-lg font-semibold">Internal Review</h3>
                  <p className="text-sm text-gray-600">Select one or more team members to review this TOE before it's sent.</p>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                    {allUsers.map(user => (
                      <div key={user.id} className={`flex items-center space-x-2 p-3 border rounded-lg ${showPreReviewVersion ? 'bg-gray-100' : 'hover:bg-gray-50'}`}>
                        <Checkbox
                          id={`reviewer-${user.id}`}
                          checked={reviewers.includes(user.email)}
                          onCheckedChange={showPreReviewVersion ? undefined : (checked) => handleReviewerChange(user.email, checked)}
                          disabled={showPreReviewVersion}
                        />
                        <Label 
                          htmlFor={`reviewer-${user.id}`}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {user.full_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-sm text-blue-800">
                <p>Selected Reviewers: {reviewers.length > 0 ? reviewers.join(', ') : 'None'}</p>
                <p className="mt-2">When you save, the selected reviewers will be notified and this TOE will be locked for editing until the review is complete.</p>
              </div>
            </div>
          )}

          {/* Step 6: Review */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Review & Finalize</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={generateProjectSummary}
                    disabled={isGeneratingSummary || !formData.project_title || !getSelectedClient()}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {isGeneratingSummary ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {isGeneratingSummary ? 'Generating...' : 'AI Generate Summary'}
                  </Button>
                  {/* AI Review button temporarily hidden */}
                  {/* <AIReviewButton 
                    toeData={showPreReviewVersion && hasPreReviewVersion ? toe.pre_review_version : formData} 
                    client={getSelectedClient()}
                  /> */}
                </div>
              </div>

              {/* Project Summary Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Project Summary for Introductory Letter</CardTitle>
                      <p className="text-sm text-gray-600">
                        This summary will be used in the introductory letter sent to the client.
                      </p>
                    </div>
                    {formData.project_summary && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleInputChange('project_summary', '')}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          disabled={showPreReviewVersion}
                        >
                          Clear
                        </Button>
                        <Button
                          onClick={generateProjectSummary}
                          variant="outline"
                          size="sm"
                          disabled={isGeneratingSummary || showPreReviewVersion}
                        >
                          Regenerate
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="project_summary">Project Summary</Label>
                      {formData.project_summary && (
                        <span className="text-xs text-gray-500">
                          {formData.project_summary.length} characters
                        </span>
                      )}
                    </div>
                    <Textarea
                      id="project_summary"
                      value={formData.project_summary}
                      onChange={(e) => handleInputChange('project_summary', e.target.value)}
                      placeholder="Click 'AI Generate Summary' to automatically create a professional project summary, or enter manually..."
                      rows={8}
                      readOnly={showPreReviewVersion}
                      className={`${showPreReviewVersion ? 'bg-gray-50' : ''} resize-y`}
                    />
                    {!formData.project_summary && (
                      <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded border">
                        <p>No project summary provided. This will be required for the introductory letter.</p>
                        <p className="mt-1">Click "AI Generate Summary" to create one automatically, or type your own summary above.</p>
                      </div>
                    )}
                    {formData.project_summary && (
                      <div className={`text-xs p-2 rounded border ${
                        validateProjectSummary().isValid 
                          ? 'text-green-700 bg-green-50 border-green-200' 
                          : 'text-red-700 bg-red-50 border-red-200'
                      }`}>
                        {validateProjectSummary().message}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Project Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Client:</span>
                        <span className="ml-2 font-medium">
                          {getSelectedClient()?.company_name || getSelectedClient()?.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Project:</span>
                        <span className="ml-2 font-medium">
                          {showPreReviewVersion && hasPreReviewVersion ? toe.pre_review_version.project_title : formData.project_title}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Version:</span>
                        <span className="ml-2 font-medium">
                          {showPreReviewVersion && hasPreReviewVersion ? toe.pre_review_version.version : formData.version}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Financial Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fee Items:</span>
                        <span>{getDisplayedFeeStructure().length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>${calculateDisplayedTotals().subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total (incl. GST):</span>
                        <span>${calculateDisplayedTotals().total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="scope" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="scope">Scope</TabsTrigger>
                  <TabsTrigger value="fees">Fees</TabsTrigger>
                  <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
                  <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="scope" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Scope of Work</h4>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {(showPreReviewVersion && hasPreReviewVersion ? toe.pre_review_version.scope_of_work : formData.scope_of_work) || 'No scope defined'}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="fees" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Fee Structure</h4>
                      <div className="space-y-3">
                        {getDisplayedFeeStructure().map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{item.description}</span>
                            <span className="font-medium">${item.cost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="assumptions" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Assumptions</h4>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {(showPreReviewVersion && hasPreReviewVersion ? toe.pre_review_version.assumptions : formData.assumptions) || 'No assumptions defined'}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="exclusions" className="mt-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-3">Exclusions</h4>
                      <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                        {(showPreReviewVersion && hasPreReviewVersion ? toe.pre_review_version.exclusions : formData.exclusions) || 'No exclusions defined'}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Signatures</CardTitle>
                </CardHeader>
                <CardContent>
                  <h4 className="font-semibold mb-3 text-gray-800">Lysaght Signature</h4>
                  {isSignatureLoading ? (
                    <p>Loading signature...</p>
                  ) : lysaghtSignatureRecord?.lysaght_signature ? (
                    <div className="flex items-center gap-4">
                      <img 
                        src={lysaghtSignatureRecord.lysaght_signature} 
                        alt="Lysaght Signature" 
                        className="h-24 border rounded bg-gray-50 p-2" 
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowSignatureModal(true)}
                        disabled={showPreReviewVersion}
                      >
                        <Edit2 className="w-3 h-3 mr-2" /> 
                        Change Signature
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setShowSignatureModal(true)} 
                      disabled={!toe?.id || showPreReviewVersion}
                      style={{ backgroundColor: '#5E0F68' }}
                      className="hover:bg-purple-700"
                    >
                      {toe?.id ? 'Sign' : 'Save TOE to Enable Signing'}
                    </Button>
                  )}
                </CardContent>
              </Card>

            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || showPreReviewVersion}
            >
              Previous
            </Button>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              
              {currentStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceedToNext() || showPreReviewVersion}
                  style={{ backgroundColor: '#5E0F68' }}
                  className="hover:bg-purple-700"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || showPreReviewVersion}
                  style={{ backgroundColor: '#5E0F68' }}
                  className="hover:bg-purple-700"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {isSaving ? 'Saving...' : 'Save TOE'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Calculator Modal */}
      {showCostCalculator !== false && (
        <CostCalculator
          companySettings={companySettings}
          onCalculate={(calculation) => handleCostCalculation(showCostCalculator, calculation)}
          onClose={() => setShowCostCalculator(false)}
        />
      )}
      
      {/* Lysaght Signature Modal */}
      {showSignatureModal && (
        <SignatureModal
          onClose={() => setShowSignatureModal(false)}
          onSave={handleSaveLysaghtSignature}
          title="Provide Lysaght Signature"
        />
      )}

      {/* Client Form Modal */}
      {showClientForm && (
          <ClientForm
            users={allUsers}
            onSave={handleSaveNewClient}
            onCancel={() => setShowClientForm(false)}
          />
      )}
    </div>
  );
}

// New AI Review component
const AIReviewButton = ({ toeData, client }) => {
  const [showReview, setShowReview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState(null);

  const generateAIReview = async () => {
    if (!toeData.project_title || !client) {
      alert('Project title and client selection required for AI review');
      return;
    }

    setIsGenerating(true);
    
    try {
      const prompt = `Please review this Terms of Engagement document and provide suggestions for improvement:

Project: ${toeData.project_title}
Client: ${client?.name}
Client Type: ${client?.tags?.join(', ') || 'General'}

Scope of Work:
${toeData.scope_of_work || 'Not defined'}

Fee Structure:
${toeData.fee_structure?.map(item => `- ${item.description}: $${item.cost}`).join('\n') || 'Not defined'}

Assumptions:
${toeData.assumptions || 'Not defined'}

Exclusions:
${toeData.exclusions || 'Not defined'}

Please provide specific, actionable suggestions for:
1. Scope clarity and completeness
2. Risk mitigation through assumptions
3. Important exclusions that should be considered
4. Fee structure appropriateness
5. Overall document quality

Format your response as structured suggestions, not as replacement content.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          prompt,
          model: 'gpt-4o-mini',
          systemPrompt: 'You are a professional business consultant specializing in reviewing Terms of Engagement documents. Provide structured, actionable suggestions for improvement.'
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.response) {
        // Parse the response into structured suggestions
        const suggestions = parseAIReviewResponse(data.response);
        setAiSuggestions(suggestions);
        setShowReview(true);
      } else {
        throw new Error(data.error || 'No suggestions generated');
      }
    } catch (error) {
      console.error('Error generating AI review:', error);
      alert('Error generating AI review. Please try again.');
    }
    
    setIsGenerating(false);
  };

  // Helper function to parse AI response into structured format
  const parseAIReviewResponse = (response) => {
    // Simple parsing - you might want to make this more sophisticated
    const lines = response.split('\n').filter(line => line.trim());
    const suggestions = {
      scope_suggestions: [],
      assumption_suggestions: [],
      exclusion_suggestions: [],
      fee_suggestions: [],
      general_suggestions: []
    };

    let currentCategory = 'general_suggestions';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.includes('Scope') || trimmed.includes('scope')) {
        currentCategory = 'scope_suggestions';
      } else if (trimmed.includes('Assumption') || trimmed.includes('assumption')) {
        currentCategory = 'assumption_suggestions';
      } else if (trimmed.includes('Exclusion') || trimmed.includes('exclusion')) {
        currentCategory = 'exclusion_suggestions';
      } else if (trimmed.includes('Fee') || trimmed.includes('fee')) {
        currentCategory = 'fee_suggestions';
      } else if (trimmed.match(/^\d+\./) || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        // This looks like a suggestion
        const cleanSuggestion = trimmed.replace(/^[\d\.\-\•\s]+/, '').trim();
        if (cleanSuggestion) {
          suggestions[currentCategory].push(cleanSuggestion);
        }
      }
    });

    return suggestions;
  };

  return (
    <>
      <Button
        onClick={generateAIReview}
        disabled={isGenerating}
        variant="outline"
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isGenerating ? 'Reviewing...' : 'AI Review'}
      </Button>

      {showReview && aiSuggestions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>AI Review Suggestions</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowReview(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {aiSuggestions.scope_suggestions?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Scope of Work Suggestions</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.scope_suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.assumption_suggestions?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Assumptions Suggestions</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.assumption_suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.exclusion_suggestions?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Exclusions Suggestions</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.exclusion_suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.fee_suggestions?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Fee Structure Suggestions</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.fee_suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {aiSuggestions.general_suggestions?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">General Suggestions</h4>
                  <ul className="space-y-2">
                    {aiSuggestions.general_suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  These are suggestions only. Review and apply as appropriate for your specific project requirements.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
