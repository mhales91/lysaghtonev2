
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '../utils/formatter';
import { X, Plus, Trash2, Calculator, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { TaskTemplate, TOELibraryItem, CompanySettings } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import _isEqual from 'lodash/isEqual';

import CostCalculator from './CostCalculator';

// This component visually highlights changes between originalText and value for text areas.
const TrackedTextArea = ({ originalText, value, className, ...props }) => {
    const isChanged = originalText !== value;
    const combinedClassName = `w-full ${isChanged && !props.readOnly ? 'border-green-500 border-2' : ''} ${className || ''}`;

    return (
        <Textarea
            value={value}
            {...props}
            className={combinedClassName}
        />
    );
};

// This component visually highlights changes between originalValue and value for input fields.
const TrackedInput = ({ originalValue, value, className, ...props }) => {
    // Convert values to strings for consistent comparison and display, handling potential null/undefined
    const originalValueString = originalValue != null ? String(originalValue) : '';
    const valueString = value != null ? String(value) : '';

    const isChanged = originalValueString !== valueString;
    const combinedClassName = `${isChanged && !props.readOnly ? 'border-green-500 border-2' : ''} ${className || ''}`;

    const displayOriginal = props.type === 'number' ? formatCurrency(originalValue) : originalValueString;
    const displayValue = props.type === 'number' ? formatCurrency(value) : valueString;

    return (
        <div className="space-y-1">
            <Input
                value={value} // Keep value as its original type for input component
                {...props}
                className={combinedClassName}
            />
            {isChanged && originalValue != null && value != null && !props.readOnly && (
                <div className="text-xs">
                    <span className="text-green-600 line-through bg-green-50 px-1 rounded mr-2" style={{ color: '#16a34a', backgroundColor: '#dcfce7' }}>
                        {displayOriginal}
                    </span>
                    <span className="text-green-600 bg-green-50 px-1 rounded font-medium" style={{ color: '#16a34a', backgroundColor: '#dcfce7' }}>
                        {displayValue}
                    </span>
                </div>
            )}
        </div>
    );
};

// This component is imported in the outline but not directly used for display in the provided changes.
// Providing a minimal functional component for completeness.
const TrackedTextDisplay = ({ text, className, ...props }) => {
    return (
        <div className={className} {...props}>
            {text}
        </div>
    );
};
// End of new components for inline change tracking


export default function TOEReviewModal({ toe, client, review, onClose, onSubmit }) {
    const [reviewData, setReviewData] = useState({});
    const [originalData, setOriginalData] = useState({});
    const [comments, setComments] = useState('');
    const [changes, setChanges] = useState([]);
    const [showOriginalContent, setShowOriginalContent] = useState(false); // New state for global revision toggle

    // Supporting data states
    const [taskTemplates, setTaskTemplates] = useState([]);
    const [libraryItems, setLibraryItems] = useState([]);
    const [companySettings, setCompanySettings] = useState(null);
    const [showCostCalculator, setShowCostCalculator] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState(null);
    const [showAIReview, setShowAIReview] = useState(false);

    useEffect(() => {
        if (toe) {
            const initialData = {
                scope_of_work: toe.scope_of_work || '',
                fee_structure: JSON.parse(JSON.stringify(toe.fee_structure || [])), // Deep copy
                assumptions: toe.assumptions || '',
                exclusions: toe.exclusions || '',
            };
            setOriginalData(initialData);
            setReviewData(initialData);
        }
        loadSupportingData();
    }, [toe]);

    useEffect(() => {
        // Only generate summary if originalData is loaded (to avoid comparing empty states)
        if (Object.keys(originalData).length > 0) {
            generateChangeSummary();
        }
    }, [reviewData, originalData]); // Recalculate summary when reviewData or originalData changes

    const loadSupportingData = async () => {
        try {
            const [templates, library, settings] = await Promise.all([
                TaskTemplate.list(),
                TOELibraryItem.list(),
                CompanySettings.list()
            ]);
            setTaskTemplates(templates || []);
            setLibraryItems(library || []);
            setCompanySettings(settings[0] || {});
        } catch (error) {
            console.error('Error loading supporting data:', error);
        }
    };
    
    // Helper to check if a top-level field has changed
    const isFieldChanged = (field) => {
        return !_isEqual(originalData[field], reviewData[field]);
    };
    
    // Helper to check if a specific fee item has changed
    const isFeeItemChanged = (index) => {
        // If original fee structure doesn't have this index (newly added item)
        if (!originalData.fee_structure || index >= originalData.fee_structure.length) {
            return true;
        }
        return !_isEqual(originalData.fee_structure[index], reviewData.fee_structure[index]);
    }

    const generateChangeSummary = () => {
        const summary = [];
        
        if (isFieldChanged('scope_of_work')) {
            summary.push({ 
                id: 'scope', 
                text: 'Scope of Work was modified.',
                field: 'scope_of_work'
            });
        }
        
        if (isFieldChanged('assumptions')) {
            summary.push({ 
                id: 'assumptions', 
                text: 'Assumptions were modified.',
                field: 'assumptions'
            });
        }
        
        if (isFieldChanged('exclusions')) {
            summary.push({ 
                id: 'exclusions', 
                text: 'Exclusions were modified.',
                field: 'exclusions'
            });
        }

        // Fee structure changes
        const originalFees = originalData.fee_structure || [];
        const currentFees = reviewData.fee_structure || [];

        if (originalFees.length !== currentFees.length) {
            if (currentFees.length > originalFees.length) {
                summary.push({ 
                    id: 'fee_count_added', 
                    text: `${currentFees.length - originalFees.length} new fee item(s) added.`,
                    field: 'fee_structure'
                });
            } else {
                summary.push({ 
                    id: 'fee_count_removed', 
                    text: `${originalFees.length - currentFees.length} fee item(s) removed.`,
                    field: 'fee_structure'
                });
            }
        }
        
        currentFees.forEach((item, index) => {
            if (index < originalFees.length && isFeeItemChanged(index)) {
                summary.push({ 
                    id: `fee_mod_${index}`, 
                    text: `Fee item "${item.description || 'Untitled'}" was modified.`,
                    field: 'fee_structure'
                });
            }
        });

        setChanges(summary);
    };

    const handleInputChange = (field, value) => {
        setReviewData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFeeStructureChange = (index, field, value) => {
        const newFeeStructure = [...reviewData.fee_structure];
        
        newFeeStructure[index] = {
            ...newFeeStructure[index],
            [field]: field === 'cost' ? parseFloat(value) || 0 : value
        };

        setReviewData(prev => ({
            ...prev,
            fee_structure: newFeeStructure
        }));
    };

    const handleTaskTemplateLink = (feeIndex, templateId, isLinked) => {
        const newFeeStructure = [...reviewData.fee_structure];
        const currentLinks = newFeeStructure[feeIndex].linked_task_templates || [];
        
        newFeeStructure[feeIndex].linked_task_templates = isLinked
            ? [...currentLinks, templateId]
            : currentLinks.filter(id => id !== templateId);
        
        setReviewData(prev => ({
            ...prev,
            fee_structure: newFeeStructure
        }));
    };

    const addFeeItem = () => {
        setReviewData(prev => ({
            ...prev,
            fee_structure: [
                ...(prev.fee_structure || []),
                { description: '', cost: 0, time_estimate: '', staff_breakdown: [], linked_task_templates: [] }
            ]
        }));
    };

    const removeFeeItem = (index) => {
        setReviewData(prev => ({
            ...prev,
            fee_structure: (prev.fee_structure || []).filter((_, i) => i !== index)
        }));
    };

    const calculateTotals = (feeStructure) => {
        const subtotal = (feeStructure || []).reduce((sum, item) => sum + (item.cost || 0), 0);
        const gst = subtotal * (companySettings?.tax_rate || 0.15);
        const total = subtotal + gst;
        return { subtotal, gst, total };
    };

    const handleCostCalculation = (index, calculation) => {
        const newFeeStructure = [...reviewData.fee_structure];
        newFeeStructure[index] = {
            ...newFeeStructure[index],
            cost: calculation.totalCost,
            time_estimate: `${calculation.totalHours} hours`,
            staff_breakdown: calculation.breakdown
        };
        
        setReviewData(prev => ({
            ...prev,
            fee_structure: newFeeStructure
        }));
        setShowCostCalculator(false);
    };

    const addLibraryItemToField = (item, field) => {
        const currentText = reviewData[field] || '';
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

    const generateAIReview = async () => {
        if (!reviewData.scope_of_work || !client) {
            alert('Project scope and client information required for AI review');
            return;
        }

        setIsGeneratingAI(true);
        
        try {
            const prompt = `Please review this Terms of Engagement document and provide suggestions for improvement:

Project: ${toe.project_title}
Client: ${client?.name}
Client Type: ${client?.tags?.join(', ') || 'General'}

Scope of Work:
${reviewData.scope_of_work || 'Not defined'}

Fee Structure:
${reviewData.fee_structure?.map(item => `- ${item.description}: $${item.cost}`).join('\n') || 'Not defined'}

Assumptions:
${reviewData.assumptions || 'Not defined'}

Exclusions:
${reviewData.exclusions || 'Not defined'}

Please provide specific, actionable suggestions for:
1. Scope clarity and completeness
2. Risk mitigation through assumptions
3. Important exclusions that should be considered
4. Fee structure appropriateness
5. Overall document quality

Format your response as structured suggestions, not as replacement content.`;

            const response = await InvokeLLM({
                prompt,
                add_context_from_internet: false,
                response_json_schema: {
                    type: "object",
                    properties: {
                        scope_suggestions: {
                            type: "array",
                            items: { type: "string" }
                        },
                        assumption_suggestions: {
                            type: "array", 
                            items: { type: "string" }
                        },
                        exclusion_suggestions: {
                            type: "array",
                            items: { type: "string" }
                        },
                        fee_suggestions: {
                            type: "array",
                            items: { type: "string" }
                        },
                        general_suggestions: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            setAiSuggestions(response);
            setShowAIReview(true);
        } catch (error) {
            console.error('Error generating AI review:', error);
            alert('Error generating AI review. Please try again.');
        }
        
        setIsGeneratingAI(false);
    };

    const handleSubmit = () => {
        const totals = calculateTotals(reviewData.fee_structure);
        const finalReviewData = { 
            ...reviewData,
            total_fee: totals.subtotal,
            total_fee_with_gst: totals.total
        };

        const reviewSubmission = {
            original_data: originalData, // Still send original data for context
            reviewed_data: finalReviewData,
            changes: changes, // Now sends the summarized changes
            comments: comments,
            has_changes: changes.length > 0
        };
        onSubmit(review, reviewSubmission);
    };

    const hasChanges = changes.length > 0;
    
    // Calculate both sets of totals
    const reviewedTotals = calculateTotals(reviewData.fee_structure);
    const originalTotals = calculateTotals(originalData.fee_structure);

    // Determine which totals to display
    const displaySubtotal = showOriginalContent ? originalTotals.subtotal : reviewedTotals.subtotal;
    const displayTotal = showOriginalContent ? originalTotals.total : reviewedTotals.total;

    if (!toe) return null;

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col">
                <DialogHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <DialogTitle>Review TOE: {toe.project_title}</DialogTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                For client: {client?.name || 'N/A'}. Please review the details and provide your feedback.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowOriginalContent(!showOriginalContent)}
                                className="flex items-center gap-2"
                            >
                                {showOriginalContent ? 'Show Reviewed Version' : 'Show Original Version'}
                            </Button>
                            <Button
                                onClick={generateAIReview}
                                disabled={isGeneratingAI}
                                variant="outline"
                                className="flex items-center gap-2"
                            >
                                {isGeneratingAI ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                {isGeneratingAI ? 'Reviewing...' : 'AI Review'}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto">
                    <Tabs defaultValue="scope" className="h-full">
                        <TabsList className="grid w-full grid-cols-6">
                            <TabsTrigger value="scope">Scope</TabsTrigger>
                            <TabsTrigger value="fees">Fees</TabsTrigger>
                            <TabsTrigger value="assumptions">Assumptions</TabsTrigger>
                            <TabsTrigger value="exclusions">Exclusions</TabsTrigger>
                            <TabsTrigger value="changes">
                                Changes
                                {hasChanges && <Badge className="ml-2 bg-green-500 text-white text-xs">{changes.length}</Badge>}
                            </TabsTrigger>
                            <TabsTrigger value="comments">Comments</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="scope" className="mt-4">
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="scope">Scope Description</Label>
                                        <TrackedTextArea
                                            id="scope"
                                            originalText={originalData.scope_of_work}
                                            value={showOriginalContent ? originalData.scope_of_work : reviewData.scope_of_work}
                                            onChange={showOriginalContent ? undefined : (e) => handleInputChange('scope_of_work', e.target.value)}
                                            placeholder="Describe the scope of work to be performed..."
                                            rows={12}
                                            readOnly={showOriginalContent}
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
                                                    className={`p-3 border rounded-lg ${showOriginalContent ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`} 
                                                    onClick={showOriginalContent ? undefined : () => addLibraryItemToField(item, 'scope_of_work')}>
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
                        </TabsContent>
                        
                        <TabsContent value="fees" className="mt-4">
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Fee Structure</h3>
                                        <p className="text-sm text-gray-600">Break down the project costs and link to task templates</p>
                                    </div>
                                    <Button onClick={addFeeItem} variant="outline" disabled={showOriginalContent}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Item
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {/* Show either original or current fee structure based on toggle */}
                                    {(showOriginalContent ? originalData.fee_structure || [] : reviewData.fee_structure || []).map((item, index) => {
                                        const originalItem = originalData.fee_structure?.[index];
                                        const currentItem = reviewData.fee_structure?.[index];
                                        const itemChanged = isFeeItemChanged(index);
                                        
                                        // When showing original content, skip items that don't exist in original (i.e., newly added items)
                                        if (showOriginalContent && !originalItem) {
                                            return null;
                                        }
                                        
                                        return (
                                            <Card key={index} className={`p-4 ${itemChanged && !showOriginalContent ? 'border-green-500 border-2' : ''}`}>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-medium">Fee Item {index + 1}</h4>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setShowCostCalculator(index)}
                                                                disabled={showOriginalContent}
                                                            >
                                                                <Calculator className="w-4 h-4 mr-2" />
                                                                Calculate Cost
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeFeeItem(index)}
                                                                className="text-red-600"
                                                                disabled={showOriginalContent}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid md:grid-cols-12 gap-4">
                                                        <div className="md:col-span-6">
                                                            <Label>Description</Label>
                                                            <TrackedTextArea
                                                                originalText={originalItem?.description || ''}
                                                                value={showOriginalContent ? originalItem?.description || '' : item.description}
                                                                onChange={showOriginalContent ? undefined : (e) => handleFeeStructureChange(index, 'description', e.target.value)}
                                                                placeholder="e.g. Project Administration"
                                                                rows={3}
                                                                readOnly={showOriginalContent}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-2">
                                                            <Label>Cost ($)</Label>
                                                            <TrackedInput
                                                                type="number"
                                                                originalValue={originalItem?.cost || 0}
                                                                value={showOriginalContent ? originalItem?.cost : item.cost}
                                                                onChange={showOriginalContent ? undefined : (e) => handleFeeStructureChange(index, 'cost', e.target.value)}
                                                                placeholder="0"
                                                                readOnly={showOriginalContent}
                                                            />
                                                        </div>
                                                        <div className="md:col-span-4">
                                                            <Label>Time Estimate</Label>
                                                            <TrackedInput
                                                                originalValue={originalItem?.time_estimate || ''}
                                                                value={showOriginalContent ? originalItem?.time_estimate || '' : item.time_estimate}
                                                                onChange={showOriginalContent ? undefined : (e) => handleFeeStructureChange(index, 'time_estimate', e.target.value)}
                                                                placeholder="e.g. 2 weeks"
                                                                readOnly={showOriginalContent}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Staff breakdown and Task Template Linking */}
                                                    {item.staff_breakdown && item.staff_breakdown.length > 0 && (
                                                        <div className="bg-gray-50 p-3 rounded">
                                                            <h5 className="font-medium mb-2">Staff Breakdown:</h5>
                                                            <div className="space-y-1 text-sm">
                                                                {item.staff_breakdown.map((staff, i) => (
                                                                    <div key={i} className="flex justify-between">
                                                                        <span>{staff.role} - {staff.hours} hours</span>
                                                                        <span>{formatCurrency(staff.cost)}</span>
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
                                                                // `item` refers to the currently displayed fee item (original or reviewed)
                                                                // The checkbox state should reflect the `linked_task_templates` of the *currently rendered* `item`.
                                                                const isLinked = (item.linked_task_templates || []).includes(template.id);
                                                                return (
                                                                    <div key={template.id} className={`flex items-center space-x-2 p-2 border rounded ${showOriginalContent ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}`}>
                                                                        <Checkbox
                                                                            id={`review-fee-${index}-template-${template.id}`}
                                                                            checked={isLinked}
                                                                            onCheckedChange={(checked) => handleTaskTemplateLink(index, template.id, checked)}
                                                                            disabled={showOriginalContent}
                                                                        />
                                                                        <Label 
                                                                            htmlFor={`review-fee-${index}-template-${template.id}`}
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
                                        );
                                    })}
                                </div>

                                {/* Fee Summary */}
                                <Card className="bg-gray-50">
                                    <CardContent className="p-4">
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(displaySubtotal)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>GST ({((companySettings?.tax_rate || 0.15) * 100)}%):</span>
                                                <span>{formatCurrency(displayTotal - displaySubtotal)}</span>
                                            </div>
                                            <div className="flex justify-between font-semibold text-lg border-t pt-2">
                                                <span>Total (incl. GST):</span>
                                                <span>{formatCurrency(displayTotal)}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="assumptions" className="mt-4">
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="assumptions">Assumptions</Label>
                                        <TrackedTextArea
                                            id="assumptions"
                                            originalText={originalData.assumptions}
                                            value={showOriginalContent ? originalData.assumptions : reviewData.assumptions}
                                            onChange={showOriginalContent ? undefined : (e) => handleInputChange('assumptions', e.target.value)}
                                            placeholder="List key assumptions for this project..."
                                            rows={8}
                                            readOnly={showOriginalContent}
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
                                                    className={`p-2 border rounded ${showOriginalContent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}`} 
                                                    onClick={showOriginalContent ? undefined : () => addLibraryItemToField(item, 'assumptions')}>
                                                    <p className="text-sm font-medium">{item.name}</p>
                                                    <p className="text-xs text-gray-600">{item.content.substring(0, 60)}{item.content.length > 60 ? '...' : ''}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="exclusions" className="mt-4">
                            <div className="grid lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="exclusions">Exclusions</Label>
                                        <TrackedTextArea
                                            id="exclusions"
                                            originalText={originalData.exclusions}
                                            value={showOriginalContent ? originalData.exclusions : reviewData.exclusions}
                                            onChange={showOriginalContent ? undefined : (e) => handleInputChange('exclusions', e.target.value)}
                                            placeholder="List what is excluded from this engagement..."
                                            rows={8}
                                            readOnly={showOriginalContent}
                                        />
                                    </div>
                                </div>

                                <div className="lg:col-span-1 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="font-medium">Exclusions Library</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {libraryItems.filter(item => item.category === 'exclusion').map(item => (
                                                <div 
                                                    key={item.id} 
                                                    className={`p-2 border rounded ${showOriginalContent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'}`} 
                                                    onClick={showOriginalContent ? undefined : () => addLibraryItemToField(item, 'exclusions')}>
                                                    <p className="text-sm font-medium">{item.name}</p>
                                                    <p className="text-xs text-gray-600">{item.content.substring(0, 60)}{item.content.length > 60 ? '...' : ''}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="changes" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <AlertCircle className="w-5 h-5 mr-2" />
                                        Change Summary
                                        {hasChanges && <Badge className="ml-2 bg-green-500">{changes.length}</Badge>}
                                    </CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Summary of modifications made during this review.
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {changes.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No changes have been made yet.</p>
                                    ) : (
                                        <ul className="space-y-3 max-h-96 overflow-y-auto">
                                            {changes.map((change) => (
                                                <li key={change.id} className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 text-sm">
                                                    {change.text}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        
                        <TabsContent value="comments" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Review Comments</CardTitle>
                                    <p className="text-sm text-gray-600">
                                        Provide feedback that will be visible to the original creator.
                                        {hasChanges && " Your changes above will also be included in the review."}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={comments}
                                        onChange={(e) => setComments(e.target.value)}
                                        placeholder="Provide your feedback here. This will be visible to the original creator."
                                        rows={8}
                                        className="w-full"
                                        readOnly={showOriginalContent}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="border-t pt-4">
                    <div className="flex justify-between items-center w-full">
                        <div className="text-sm text-gray-600">
                            {hasChanges && (
                                <span className="flex items-center text-green-600">
                                    <AlertCircle className="w-4 h-4 mr-1" />
                                    {changes.length} {changes.length === 1 ? 'change' : 'changes'} will be included in your review
                                </span>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button 
                                onClick={handleSubmit} 
                                style={{ backgroundColor: '#5E0F68' }} 
                                className="hover:bg-purple-700"
                            >
                                Submit Review
                            </Button>
                        </div>
                    </div>
                </DialogFooter>

                {/* Cost Calculator Modal */}
                {showCostCalculator !== false && (
                    <CostCalculator
                        companySettings={companySettings}
                        onCalculate={(calculation) => handleCostCalculation(showCostCalculator, calculation)}
                        onClose={() => setShowCostCalculator(false)}
                    />
                )}

                {/* AI Review Modal */}
                {showAIReview && aiSuggestions && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
                        <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle>AI Review Suggestions</CardTitle>
                                    <Button variant="ghost" size="icon" onClick={() => setShowAIReview(false)}>
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
            </DialogContent>
        </Dialog>
    );
}
