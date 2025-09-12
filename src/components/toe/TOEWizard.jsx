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
import { X, Save, Plus, Trash2, Sparkles, Loader2, Calculator, Share, Edit2, UserCheck } from "lucide-react";
import { toast } from 'sonner';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
  const [librarySearch, setLibrarySearch] = useState({
    query: '',
    department: 'all', // Changed from '' to 'all'
    category: 'scope'
  });
  const [currentScopeItem, setCurrentScopeItem] = useState(null);
  const [currentStageIndex, setCurrentStageIndex] = useState(null);
  const [currentItemIndex, setCurrentItemIndex] = useState(null);

  const [formData, setFormData] = useState({
    client_id: toe?.client_id || '',
    project_title: toe?.project_title || '',
    scope_of_work: toe?.scope_of_work || '',
    staged_scope: toe?.staged_scope || [
      {
        stage_number: 1,
        stage_name: "Main Stage",
        scope_items: [
          {
            id: crypto.randomUUID(),
            description: '',
            department: 'Planning',
            time_estimate_weeks: 0,
            source: 'manual'
          }
        ]
      }
    ],
    use_staged_scope: true, // Always use staged scope
    third_party_fees: toe?.third_party_fees || [
      {
        id: crypto.randomUUID(),
        description: '',
        third_party_entity: '',
        fee_amount: 0,
        source: 'manual'
      }
    ],
    assumptions: toe?.assumptions || '',
    exclusions: toe?.exclusions || '',
    version: toe?.version || '1.0',
    ai_tags: toe?.ai_tags || [],
    project_summary: toe?.project_summary || '',
    client_name: toe?.client_name || '',
    site_address: toe?.site_address || ''
  });

  useEffect(() => {
    loadData();
    if (toe?.id) {
      loadSignatureRecord(toe.id);
    } else {
      setLysaghtSignatureRecord(null);
    }
  }, [toe]);

  // Update library search category based on current step
  useEffect(() => {
    if (currentStep === 2) {
      setLibrarySearch(prev => ({ ...prev, category: 'scope' }));
    } else if (currentStep === 3) {
      setLibrarySearch(prev => ({ ...prev, category: 'third_party_fee' }));
    } else if (currentStep === 4) {
      setLibrarySearch(prev => ({ ...prev, category: 'assumption' }));
    }
  }, [currentStep]);

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

  const handleThirdPartyFeeChange = (index, field, value) => {
    const newThirdPartyFees = [...formData.third_party_fees];
    newThirdPartyFees[index] = {
      ...newThirdPartyFees[index],
      [field]: field === 'fee_amount' ? parseFloat(value) || 0 : value
    };
    setFormData(prev => ({
      ...prev,
      third_party_fees: newThirdPartyFees
    }));
  };

  const addThirdPartyFeeItem = () => {
    setFormData(prev => ({
      ...prev,
      third_party_fees: [
        ...prev.third_party_fees,
        {
          id: crypto.randomUUID(),
          description: '',
          third_party_entity: '',
          fee_amount: 0,
          source: 'manual'
        }
      ]
    }));
  };

  const removeThirdPartyFeeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      third_party_fees: prev.third_party_fees.filter((_, i) => i !== index)
    }));
  };

  const addLibraryItemToThirdPartyFees = (item) => {
    const newItem = {
      id: crypto.randomUUID(),
      description: item.content,
      third_party_entity: item.third_party_entity || '',
      fee_amount: item.fee_amount || 0,
      source: 'library'
    };
    
    setFormData(prev => ({
      ...prev,
      third_party_fees: [...prev.third_party_fees, newItem]
    }));
    
    // Update usage count
    try {
      TOELibraryItem.update(item.id, { 
        usage_count: (item.usage_count || 0) + 1 
      });
    } catch (error) {
      console.error('Error updating item usage:', error);
    }
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

  // Migration function for legacy scope
  const migrateLegacyScope = (legacyScope) => {
    if (typeof legacyScope === 'string' && legacyScope.trim()) {
      return [{
        stage_number: 1,
        stage_name: "Main Stage",
        scope_items: [{
          id: crypto.randomUUID(),
          description: legacyScope,
          department: 'Planning',
          time_estimate_weeks: 0,
          source: 'legacy'
        }]
      }];
    }
    return formData.staged_scope; // Already in new format
  };

  // Staged scope management functions
  const addNewStage = () => {
    const newStage = {
      stage_number: formData.staged_scope.length + 1,
      stage_name: `Stage ${formData.staged_scope.length + 1}`,
      scope_items: [{
        id: crypto.randomUUID(),
        description: '',
        department: 'Planning',
        time_estimate_weeks: 0,
        source: 'manual'
      }]
    };
    
    setFormData(prev => ({
      ...prev,
      staged_scope: [...prev.staged_scope, newStage]
    }));
  };

  const updateStage = (stageIndex, updates) => {
    setFormData(prev => ({
      ...prev,
      staged_scope: prev.staged_scope.map((stage, index) => 
        index === stageIndex ? { ...stage, ...updates } : stage
      )
    }));
  };

  const deleteStage = (stageIndex) => {
    if (formData.staged_scope.length <= 1) return; // Don't delete the last stage
    
    setFormData(prev => ({
      ...prev,
      staged_scope: prev.staged_scope.filter((_, index) => index !== stageIndex)
        .map((stage, index) => ({ ...stage, stage_number: index + 1 }))
    }));
  };

  const addScopeItem = (stageIndex) => {
    const newItem = {
      id: crypto.randomUUID(),
      description: '',
      department: 'Planning',
      time_estimate_weeks: 0,
      source: 'manual'
    };
    
    updateStage(stageIndex, {
      scope_items: [...formData.staged_scope[stageIndex].scope_items, newItem]
    });
  };

  const updateScopeItem = (stageIndex, itemIndex, updates) => {
    const updatedItems = formData.staged_scope[stageIndex].scope_items.map((item, index) =>
      index === itemIndex ? { ...item, ...updates } : item
    );
    
    updateStage(stageIndex, { scope_items: updatedItems });
  };

  const deleteScopeItem = (stageIndex, itemIndex) => {
    const updatedItems = formData.staged_scope[stageIndex].scope_items.filter((_, index) => index !== itemIndex);
    updateStage(stageIndex, { scope_items: updatedItems });
  };

  const addLibraryItemToStage = (item, stageIndex) => {
    const newItem = {
      id: crypto.randomUUID(),
      description: item.content,
      department: item.department || 'Planning',
      time_estimate_weeks: 0,
      source: 'library'
    };
    
    updateStage(stageIndex, {
      scope_items: [...formData.staged_scope[stageIndex].scope_items, newItem]
    });
    
    // Update usage count
    try {
      TOELibraryItem.update(item.id, { 
        usage_count: (item.usage_count || 0) + 1 
      });
    } catch (error) {
      console.error('Error updating item usage:', error);
    }
  };

  // Filter library items based on search
  const filteredLibraryItems = libraryItems.filter(item => {
    const matchesQuery = !librarySearch.query || 
      item.name.toLowerCase().includes(librarySearch.query.toLowerCase()) ||
      item.content.toLowerCase().includes(librarySearch.query.toLowerCase());
    
    const matchesDepartment = !librarySearch.department || 
      librarySearch.department === 'all' ||
      item.department === librarySearch.department;
    
    const matchesCategory = item.category === librarySearch.category;
    
    // Debug logging
    console.log('Filtering item:', {
      name: item.name,
      department: item.department,
      searchDepartment: librarySearch.department,
      matchesDepartment,
      matchesCategory,
      category: item.category,
      searchCategory: librarySearch.category
    });
    
    return matchesQuery && matchesDepartment && matchesCategory;
  });

  // Get unique departments from library items
  const libraryDepartments = [...new Set(libraryItems
    .filter(item => item.department)
    .map(item => item.department)
  )].sort();
  
  // Always include default departments, plus any additional ones from library items
  const defaultDepartments = ['Planning', 'Engineering', 'Surveying', 'Project Management'];
  const availableDepartments = [...new Set([...defaultDepartments, ...libraryDepartments])].sort();

  const calculateTotals = () => {
    const subtotal = formData.third_party_fees.reduce((sum, item) => sum + (item.fee_amount || 0), 0);
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
${formData.third_party_fees?.map(item => `- ${item.description}: $${item.fee_amount}`).join('\n') || 'Not defined'}

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
      
      // Only validate project summary if we're not saving as draft
      // Project summary validation should only be required when finalizing
      // const summaryValidation = validateProjectSummary();
      // if (!summaryValidation.isValid) {
      //   toast.error(summaryValidation.message);
      //   setIsSaving(false);
      //   return;
      // }
      
      // Clean and validate the data before sending
      const submitData = {
        client_id: formData.client_id,
        project_title: formData.project_title?.trim(),
        client_name: formData.client_name?.trim(),
        site_address: formData.site_address?.trim(),
        scope_of_work: formData.scope_of_work?.trim(),
        staged_scope: formData.staged_scope,
        use_staged_scope: formData.use_staged_scope,
        third_party_fees: formData.third_party_fees.filter(item => 
          item.description?.trim() || item.fee_amount > 0
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
    { number: 3, title: 'Third Party Fees', description: 'Add third party fees and costs' },
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

  const getDisplayedThirdPartyFees = () => {
    return showPreReviewVersion && hasPreReviewVersion
      ? toe.pre_review_version.third_party_fees || []
      : formData.third_party_fees;
  }

  const calculateDisplayedTotals = () => {
    const displayedThirdPartyFees = getDisplayedThirdPartyFees();
    const subtotal = displayedThirdPartyFees.reduce((sum, item) => sum + (item.fee_amount || 0), 0);
    const gst = subtotal * (companySettings?.tax_rate || 0.15);
    const total = subtotal + gst;
    return { subtotal, gst, total };
  }

  // Add these reordering functions after the existing stage management functions
  const reorderStages = (startIndex, endIndex) => {
    const result = Array.from(formData.staged_scope);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    // Update stage numbers
    const updatedStages = result.map((stage, index) => ({
      ...stage,
      stage_number: index + 1
    }));
    
    setFormData(prev => ({
      ...prev,
      staged_scope: updatedStages
    }));
  };

  const reorderScopeItems = (stageIndex, startIndex, endIndex) => {
    const stage = formData.staged_scope[stageIndex];
    const result = Array.from(stage.scope_items);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    updateStage(stageIndex, { scope_items: result });
  };

  const reorderThirdPartyFees = (startIndex, endIndex) => {
    const result = Array.from(formData.third_party_fees);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    
    setFormData(prev => ({
      ...prev,
      third_party_fees: result
    }));
  };

  const onDragEnd = (result) => {
    const { destination, source, type } = result;
    
    if (!destination) return;
    
    if (type === 'stage') {
      reorderStages(source.index, destination.index);
    } else if (type === 'scope-item') {
      const stageIndex = parseInt(source.droppableId.split('-')[1]);
      reorderScopeItems(stageIndex, source.index, destination.index);
    } else if (type === 'third-party-fee') {
      reorderThirdPartyFees(source.index, destination.index);
    }
  };

  const openCostCalculator = (stageIndex, itemIndex) => {
    const item = formData.staged_scope[stageIndex].scope_items[itemIndex];
    setCurrentStageIndex(stageIndex);
    setCurrentItemIndex(itemIndex);
    setCurrentScopeItem(item);
    setShowCostCalculator(true);
  };

  const handleScopeItemCostCalculation = (calculation) => {
    updateScopeItem(currentStageIndex, currentItemIndex, {
      staffBreakdown: calculation.breakdown,
      totalHours: calculation.totalHours,
      totalCost: calculation.totalCost,
      linkedTaskTemplates: calculation.linkedTaskTemplates || []
    });
    setShowCostCalculator(false);
    setCurrentScopeItem(null);
    setCurrentStageIndex(null);
    setCurrentItemIndex(null);
  };

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
              {/* Always show Save button, but with different text for new vs existing TOEs */}
              <Button 
                onClick={handleSubmit} 
                disabled={isSaving || showPreReviewVersion}
                style={{ backgroundColor: '#5E0F68' }}
                className="hover:bg-purple-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {toe ? 'Save TOE' : 'Create TOE'}
                  </>
                )}
              </Button>
              
              {/* Only show Share button for existing TOEs */}
              {toe && (
                <Button variant="outline" onClick={generateShareLink}>
                  <Share className="w-4 h-4 mr-2" />
                  Share for Signature
                </Button>
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
                        value={formData.client_name || getSelectedClient().contact_person || ''}
                        onChange={(e) => handleInputChange('client_name', e.target.value)}
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
                        value={formData.site_address || (getSelectedClient().address ? 
                          `${getSelectedClient().address.street || ''}, ${getSelectedClient().address.city || ''} ${getSelectedClient().address.postcode || ''}`.trim() : 
                          '')}
                        onChange={(e) => handleInputChange('site_address', e.target.value)}
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

              {/* Staged Scope Method (Only Option) */}
              <div className="space-y-6">
                {/* Stages Container */}
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="stages" type="stage">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-6">
                        {formData.staged_scope.map((stage, stageIndex) => (
                          <Draggable key={stage.stage_number} draggableId={`stage-${stageIndex}`} index={stageIndex}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps}>
                                <Card className={`p-4 ${snapshot.isDragging ? 'shadow-lg' : ''}`}>
                                  <div className="space-y-4">
                                    {/* Stage Header */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div 
                                          {...provided.dragHandleProps}
                                          className="cursor-move p-1 hover:bg-gray-200 rounded"
                                        >
                                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                                          </svg>
                                        </div>
                                        <Badge variant="outline" className="text-sm">
                                          Stage {stage.stage_number}
                                        </Badge>
                                        <Input
                                          value={stage.stage_name}
                                          onChange={(e) => updateStage(stageIndex, { stage_name: e.target.value })}
                                          placeholder="Stage name (e.g., Phase 1: Design)"
                                          className="flex-1"
                                          readOnly={showPreReviewVersion}
                                        />
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          onClick={() => addScopeItem(stageIndex)}
                                          variant="outline"
                                          size="sm"
                                          disabled={showPreReviewVersion}
                                        >
                                          <Plus className="w-4 h-4 mr-1" />
                                          Add Item
                                        </Button>
                                        {formData.staged_scope.length > 1 && (
                                          <Button
                                            onClick={() => deleteStage(stageIndex)}
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            disabled={showPreReviewVersion}
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    {/* Scope Items */}
                                    <Droppable droppableId={`scope-items-${stageIndex}`} type="scope-item">
                                      {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                                          {stage.scope_items.map((item, itemIndex) => (
                                            <Draggable key={item.id} draggableId={item.id} index={itemIndex}>
                                              {(provided, snapshot) => (
                                                <Card 
                                                  ref={provided.innerRef}
                                                  {...provided.draggableProps}
                                                  className={`p-3 bg-gray-50 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                                >
                                                  <div className="grid md:grid-cols-12 gap-3">
                                                    <div className="md:col-span-1 flex items-center">
                                                      <div 
                                                        {...provided.dragHandleProps}
                                                        className="cursor-move p-2 hover:bg-gray-200 rounded"
                                                      >
                                                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                                                        </svg>
                                                      </div>
                                                    </div>
                                                    <div className="md:col-span-4">
                                                      <Label className="text-xs text-gray-600">Description</Label>
                    <Textarea
                                                        value={item.description}
                                                        onChange={(e) => updateScopeItem(stageIndex, itemIndex, { description: e.target.value })}
                                                        placeholder="Describe this scope item..."
                                                        rows={2}
                      readOnly={showPreReviewVersion}
                                                        className="text-sm"
                    />
                  </div>
                                                    <div className="md:col-span-2">
                                                      <Label className="text-xs text-gray-600">Department</Label>
                                                      <Select
                                                        value={item.department}
                                                        onValueChange={(value) => updateScopeItem(stageIndex, itemIndex, { department: value })}
                                                        disabled={showPreReviewVersion}
                                                      >
                                                        <SelectTrigger className="text-sm">
                                                          <SelectValue placeholder="Select department" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                          {availableDepartments.length > 0 ? availableDepartments.map(dept => (
                                                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                          )) : null}
                                                          <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                      </Select>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                      <Label className="text-xs text-gray-600">Time (weeks)</Label>
                                                      <Input
                                                        type="number"
                                                        value={item.time_estimate_weeks}
                                                        onChange={(e) => updateScopeItem(stageIndex, itemIndex, { time_estimate_weeks: parseInt(e.target.value) || 0 })}
                                                        placeholder="0"
                                                        min="0"
                                                        readOnly={showPreReviewVersion}
                                                        className="text-sm"
                                                      />
                                                    </div>
                                                    <div className="md:col-span-2">
                                                      <Label className="text-xs text-gray-600">Total Cost</Label>
                                                      <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-50 px-3 py-2 rounded text-sm font-medium">
                                                          {item.totalCost ? `$${item.totalCost.toLocaleString()}` : 'Not calculated'}
                                                        </div>
                                                        <Button
                                                          onClick={() => openCostCalculator(stageIndex, itemIndex)}
                                                          variant="outline"
                                                          size="sm"
                                                          className="text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                                                          disabled={showPreReviewVersion}
                                                        >
                                                          <Calculator className="w-4 h-4" />
                                                        </Button>
                                                      </div>
                                                      {item.totalHours && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                          {item.totalHours} hours
                                                        </p>
                                                      )}
                                                    </div>
                                                    <div className="md:col-span-1 flex items-end">
                                                      <Button
                                                        onClick={() => deleteScopeItem(stageIndex, itemIndex)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700 p-1"
                                                        disabled={showPreReviewVersion}
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </Button>
                                                    </div>
                </div>

                                                  {/* Show linked task templates if any */}
                                                  {item.linkedTaskTemplates && item.linkedTaskTemplates.length > 0 && (
                                                    <div className="mt-2">
                                                      <div className="flex flex-wrap gap-1">
                                                        {item.linkedTaskTemplates.map((templateId, idx) => {
                                                          const template = taskTemplates.find(t => t.id === templateId);
                                                          return (
                                                            <Badge key={idx} variant="outline" className="text-xs">
                                                              {template?.name || 'Unknown Template'}
                                                            </Badge>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  )}
                                                </Card>
                                              )}
                                            </Draggable>
                                          ))}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  </div>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Add Stage Button */}
                <Button
                  onClick={addNewStage}
                  variant="outline"
                  className="w-full"
                  disabled={showPreReviewVersion}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Stage
                </Button>

                {/* Enhanced Library Search */}
                <Card className="p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium">Scope Library</h4>
                    
                    {/* Search Controls */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Search Library</Label>
                        <Input
                          value={librarySearch.query}
                          onChange={(e) => setLibrarySearch(prev => ({ ...prev, query: e.target.value }))}
                          placeholder="Search scope items..."
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Filter by Department</Label>
                        <Select
                          value={librarySearch.department}
                          onValueChange={(value) => setLibrarySearch(prev => ({ ...prev, department: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All departments" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All departments</SelectItem>
                            {availableDepartments.length > 0 ? availableDepartments.map(dept => (
                              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                            )) : null}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Library Items */}
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {filteredLibraryItems.map(item => (
                        <div 
                          key={item.id} 
                          className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            // Add to first stage by default, or let user choose
                            addLibraryItemToStage(item, 0);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-sm">{item.title || item.name}</h5>
                          <p className="text-xs text-gray-600 mt-1">{item.content.substring(0, 100)}{item.content.length > 100 ? '...' : ''}</p>
                              <div className="flex gap-2 mt-2">
                                {item.department && (
                                  <Badge variant="outline" className="text-xs">{item.department}</Badge>
                                )}
                                {item.tags && item.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                        </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                    </div>
                  </div>
                      ))}
                      {filteredLibraryItems.length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No library items found. Try adjusting your search criteria.
                        </p>
                      )}
                </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Step 3: Third Party Fees */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Third Party Fees</h3>
                  <p className="text-sm text-gray-600">Add third party fees and costs from the library or manually. Drag to reorder items.</p>
                </div>
                <Button onClick={addThirdPartyFeeItem} variant="outline" disabled={showPreReviewVersion}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="third-party-fees" type="third-party-fee">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                      {getDisplayedThirdPartyFees().map((item, index) => (
                        <Draggable key={item.id || index} draggableId={item.id || `third-party-fee-${index}`} index={index}>
                          {(provided, snapshot) => (
                            <Card 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`p-4 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            >
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div 
                                      {...provided.dragHandleProps}
                                      className="cursor-move p-1 hover:bg-gray-200 rounded"
                                    >
                                      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                                      </svg>
                                    </div>
                                    <h4 className="font-medium">Third Party Fee {index + 1}</h4>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeThirdPartyFeeItem(index)}
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
                            onChange={showPreReviewVersion ? undefined : (e) => handleThirdPartyFeeChange(index, 'description', e.target.value)}
                            placeholder="e.g. Council consent fees"
                            rows={3}
                            readOnly={showPreReviewVersion}
                            className={showPreReviewVersion ? 'bg-gray-50' : ''}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Label>Third Party Entity</Label>
                          <Input
                            value={item.third_party_entity}
                            onChange={showPreReviewVersion ? undefined : (e) => handleThirdPartyFeeChange(index, 'third_party_entity', e.target.value)}
                            placeholder="e.g. Tauranga City Council"
                            readOnly={showPreReviewVersion}
                            className={showPreReviewVersion ? 'bg-gray-50' : ''}
                          />
                        </div>
                        <div className="md:col-span-3">
                          <Label>Fee Amount ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={item.fee_amount}
                            onChange={showPreReviewVersion ? undefined : (e) => handleThirdPartyFeeChange(index, 'fee_amount', e.target.value)}
                            placeholder="0.00"
                            readOnly={showPreReviewVersion}
                            className={showPreReviewVersion ? 'bg-gray-50' : ''}
                          />
                        </div>
                      </div>

                                {item.source === 'library' && (
                                  <div className="bg-blue-50 p-2 rounded text-sm text-blue-800">
                                    <span className="font-medium">From Library:</span> This item was added from the Third Party Fees library
                                  </div>
                                )}
                              </div>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* Third Party Fees Library */}
              <Card className="p-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Third Party Fees Library</h4>
                  
                  {/* Search Controls */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Search Library</Label>
                      <Input
                        value={librarySearch.query}
                        onChange={(e) => setLibrarySearch(prev => ({ ...prev, query: e.target.value }))}
                        placeholder="Search third party fees..."
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Filter by Department</Label>
                      <Select
                        value={librarySearch.department}
                        onValueChange={(value) => setLibrarySearch(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All departments</SelectItem>
                          {availableDepartments.length > 0 ? availableDepartments.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          )) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Library Items */}
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {filteredLibraryItems.map(item => (
                      <div 
                        key={item.id} 
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => addLibraryItemToThirdPartyFees(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{item.title || item.name}</h5>
                            <p className="text-xs text-gray-600 mt-1">{item.content.substring(0, 100)}{item.content.length > 100 ? '...' : ''}</p>
                            <div className="flex gap-2 mt-2">
                              {item.third_party_entity && (
                                <Badge variant="outline" className="text-xs">{item.third_party_entity}</Badge>
                              )}
                              {item.fee_amount && (
                                <Badge variant="outline" className="text-xs">${parseFloat(item.fee_amount).toFixed(2)}</Badge>
                              )}
                              {item.tags && item.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {filteredLibraryItems.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No third party fee items found. Try adjusting your search criteria or create some in Admin → TOE Content Library.
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Third Party Fees Summary */}
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

          {/* Step 6: Review & Finalize */}
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
                        <span className="text-gray-600">Third Party Fee Items:</span>
                        <span>{getDisplayedThirdPartyFees().length}</span>
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
                  <TabsTrigger value="fees">Third Party Fees</TabsTrigger>
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
                      <h4 className="font-semibold mb-3">Third Party Fees</h4>
                      <div className="space-y-3">
                        {getDisplayedThirdPartyFees().map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{item.description}</span>
                            <span className="font-medium">${item.fee_amount.toLocaleString()}</span>
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
        </CardContent>
      </Card>

      {/* Signature Modal */}
      {showSignatureModal && lysaghtSignatureRecord && (
        <SignatureModal
          isOpen={showSignatureModal}
          onClose={() => setShowSignatureModal(false)}
          signatureRecord={lysaghtSignatureRecord}
          onSave={handleSaveLysaghtSignature}
          isLoading={isSignatureLoading}
        />
      )}

      {/* Cost Calculator */}
      {showCostCalculator && currentScopeItem && (
        <CostCalculator
          isOpen={showCostCalculator}
          onClose={() => setShowCostCalculator(false)}
          item={currentScopeItem}
          onCalculate={handleScopeItemCostCalculation}
          taskTemplates={taskTemplates}
          companySettings={companySettings}
        />
      )}

      {/* Client Form */}
      {showClientForm && (
          <ClientForm
          isOpen={showClientForm}
          onClose={() => setShowClientForm(false)}
            onSave={handleSaveNewClient}
          clients={allClients}
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

Third Party Fees:
${toeData.third_party_fees?.map(item => `- ${item.description}: $${item.fee_amount}`).join('\n') || 'Not defined'}

Assumptions:
${toeData.assumptions || 'Not defined'}

Exclusions:
${toeData.exclusions || 'Not defined'}

Please provide specific, actionable suggestions for:
1. Scope clarity and completeness
2. Risk mitigation through assumptions
3. Important exclusions that should be considered
4. Third party fees completeness and accuracy
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
                  <h4 className="font-semibold mb-2">Third Party Fees Suggestions</h4>
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


