
import React, { useState, useEffect } from "react";
import { TOE, Client, TOESignature, CompanySettings, Project, Task, TaskTemplate, TOEReview, User } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Plus, List, ShieldQuestion } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

import TOEList from "../components/toe/TOEList";
import TOEWizard from "../components/toe/TOEWizard";
import TOEPreview from "../components/toe/TOEPreview";
import SignatureModal from "../components/toe/SignatureModal";
import TOEReviewModal from "../components/toe/TOEReviewModal";
import TOEReviewList from "../components/toe/TOEReviewList";
import ReviewFeedbackModal from "../components/toe/ReviewFeedbackModal";
import { generateTOEPDF } from '@/api/functions';
import { useLocation } from "react-router-dom";

export default function TOEManager() {
  const [toes, setToes] = useState([]);
  const [clients, setClients] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [showWizard, setShowWizard] = useState(false);
  const [editingTOE, setEditingTOE] = useState(null);
  const [previewTOE, setPreviewTOE] = useState(null);
  const [reviewingTOE, setReviewingTOE] = useState(null);
  const [currentReview, setCurrentReview] = useState(null);
  const [viewingFeedbackForTOE, setViewingFeedbackForTOE] = useState(null);
  const [completedReviewsForTOE, setCompletedReviewsForTOE] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for signature modal
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signingToe, setSigningToe] = useState(null);
  const [postSignatureCallback, setPostSignatureCallback] = useState(null);
  const location = useLocation();

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    const handleUrlParams = async () => {
      const params = new URLSearchParams(location.search);
      const toeId = params.get('toeId');
      if (toeId && toes.length > 0) {
        const toeToEdit = toes.find(t => t.id === toeId);
        if (toeToEdit) {
          setEditingTOE(toeToEdit);
          setShowWizard(true);
        }
      }
    };
    handleUrlParams();
  }, [location.search, toes]);

  const loadData = async () => {
    setIsLoading(true);
    
    // Check if we're on localhost and have a localStorage user
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    let me;
    
    if (isLocalhost) {
      const localUser = localStorage.getItem('currentUser');
      if (localUser) {
        me = JSON.parse(localUser);
      } else {
        // Fallback to Supabase authentication for database users
        me = await User.me();
      }
    } else {
      // Production: Use Supabase authentication
      me = await User.me();
    }
    
    const [toeData, clientData, reviewData, userData] = await Promise.all([
      TOE.list('-created_date'),
      Client.list(),
      TOEReview.list(),
      User.list()
    ]);
    setToes(toeData);
    setClients(clientData);
    setReviews(reviewData);
    setUsers(userData);
    setCurrentUser(me);
    setIsLoading(false);
  };
  
  const myReviews = reviews.filter(r => r.reviewer_email === currentUser?.email && r.status === 'pending');

  const handleSaveTOE = async (toeData, reviewData) => {
    try {
        let savedToe;
        let historyEntry = {
            timestamp: new Date().toISOString(),
            user_email: currentUser.email,
        };

        if (editingTOE) {
            console.log('Updating TOE with ID:', editingTOE.id);
            console.log('TOE data being saved:', toeData);
            savedToe = await TOE.update(editingTOE.id, toeData);
            historyEntry.action = "Updated";
        } else {
            console.log('Creating new TOE with data:', toeData);
            savedToe = await TOE.create(toeData);
            historyEntry.action = "Created";
        }
        
        // Add history
        if (!savedToe) {
            throw new Error("Failed to save TOE - no data returned");
        }
        const updatedHistory = [...(savedToe.history || []), historyEntry];
        
        // Handle reviews
        if (reviewData?.reviewers && reviewData.reviewers.length > 0) {
            const reviewHistory = { ...historyEntry, action: "Sent for Review", details: `Review requested from: ${reviewData.reviewers.join(', ')}`};
            updatedHistory.push(reviewHistory);
            
            // Set status to internal_review when reviewers are selected
            await TOE.update(savedToe.id, { status: 'internal_review', history: updatedHistory });
            
            // Create review requests for each reviewer
            for (const reviewerEmail of reviewData.reviewers) {
                await TOEReview.create({
                    toe_id: savedToe.id,
                    requester_email: currentUser.email,
                    reviewer_email: reviewerEmail,
                    status: 'pending',
                    requested_at: new Date().toISOString(),
                });
            }
            toast.success("TOE saved and sent for internal review.");
        } else {
            // If no reviewers selected, keep as draft
            await TOE.update(savedToe.id, { status: 'draft', history: updatedHistory });
            toast.success(`TOE ${editingTOE ? 'updated' : 'created'} successfully.`);
        }

        setShowWizard(false);
        setEditingTOE(null);
        loadData();
    } catch (e) {
        console.error("Failed to save TOE:", e);
        toast.error("Failed to save TOE.");
    }
  };
  
  const handleReviewSubmit = async (review, reviewSubmission) => {
      try {
          // Save the review with enhanced data
          await TOEReview.update(review.id, {
              status: 'completed',
              comments: reviewSubmission.comments,
              review_data: reviewSubmission.reviewed_data,
              changes_made: reviewSubmission.changes,
              has_changes: reviewSubmission.has_changes,
              completed_at: new Date().toISOString()
          });

          const toe = await TOE.get(review.toe_id);
          
          // Create detailed history entry
          const historyEntry = {
              timestamp: new Date().toISOString(),
              user_email: currentUser.email,
              action: "Review Completed",
              details: `Review by ${currentUser.full_name} completed${reviewSubmission.has_changes ? ` with ${reviewSubmission.changes.length} changes` : ' with no changes'}.${reviewSubmission.comments ? ` Comments: ${reviewSubmission.comments.substring(0, 100)}${reviewSubmission.comments.length > 100 ? '...' : ''}` : ''}`
          };
          
          const updates = {
              history: [...(toe.history || []), historyEntry]
          };

          // Check if all reviews for this TOE are complete
          const remainingReviews = await TOEReview.filter({ toe_id: toe.id, status: 'pending' });
          if (remainingReviews.length === 0) {
              // All reviews completed - store original version and move to review_completed status
              
              // Get all completed reviews to check for changes
              const completedReviews = await TOEReview.filter({ toe_id: toe.id, status: 'completed' });
              
              // Check if any reviews have changes
              const reviewsWithChanges = completedReviews.filter(r => r.has_changes && r.review_data);
              
              if (reviewsWithChanges.length > 0) {
                  // Store the original version before applying changes
                  const originalVersion = {
                      scope_of_work: toe.scope_of_work,
                      fee_structure: toe.fee_structure,
                      assumptions: toe.assumptions,
                      exclusions: toe.exclusions,
                      total_fee: toe.total_fee,
                      total_fee_with_gst: toe.total_fee_with_gst,
                      saved_at: new Date().toISOString(),
                      saved_by: currentUser.email
                  };
                  
                  // Store original version and move to review_completed status (not ready_to_send yet)
                  updates.pre_review_version = originalVersion;
                  updates.status = 'review_completed';
                  
                  updates.history.push({
                      timestamp: new Date().toISOString(),
                      user_email: currentUser.email,
                      action: "Reviews Completed with Changes",
                      details: `${reviewsWithChanges.length} review(s) contain changes. Original version saved. Please review and accept changes.`
                  });
              } else {
                  // No changes made, move directly to ready_to_send
                  updates.status = 'ready_to_send';
                  updates.history.push({
                      timestamp: new Date().toISOString(),
                      user_email: currentUser.email,
                      action: "All Reviews Completed",
                      details: "All internal reviews completed with no changes. TOE is ready to send to client."
                  });
              }
          }
          
          await TOE.update(toe.id, updates);

          toast.success("Review submitted successfully.");
          setReviewingTOE(null);
          setCurrentReview(null);
          loadData();
      } catch (e) {
          console.error("Failed to submit review:", e);
          toast.error("Failed to submit review.");
      }
  };

  const handleEditTOE = (toe) => {
    setEditingTOE(toe);
    setShowWizard(true);
  };

  const handleDeleteTOE = async (toeId) => {
    if (confirm("Are you sure you want to delete this TOE? This cannot be undone.")) {
        try {
            await TOE.delete(toeId);
            toast.success("TOE deleted successfully.");
            loadData();
        } catch (e) {
            console.error("Failed to delete TOE:", e);
            toast.error("Failed to delete TOE.");
        }
    }
  };

  const handleSendTOE = async (toeId) => {
    try {
        const toe = await TOE.get(toeId);
        
        // Check if TOE is ready to send
        if (toe.status !== 'ready_to_send') {
            toast.error(`TOE must be in 'Ready to Send' status before sending. Current status: ${toe.status}`);
            return;
        }
        
        // Update status to sent with history
        const historyEntry = {
            timestamp: new Date().toISOString(),
            user_email: currentUser.email,
            action: "TOE Sent to Client",
            details: "TOE has been sent to client for signature."
        };
        
        await TOE.update(toeId, { 
            status: 'sent', 
            sent_date: new Date().toISOString(),
            history: [...(toe.history || []), historyEntry]
        });
        
        toast.success("TOE status marked as sent to client.");
        loadData();
    } catch (e) {
        console.error("Failed to mark TOE as sent:", e);
        toast.error("Failed to mark TOE as sent.");
    }
  };

  const handlePreview = (toe) => {
    setPreviewTOE(toe);
  };

  const handleCreateProject = async (toe) => {
    if (!toe.signed_date) {
        toast.error("Cannot create a project from an unsigned TOE.");
        return;
    }
    
    try {
        const projectData = {
            project_name: toe.project_title,
            client_id: toe.client_id,
            status: 'not_started',
            budget_hours: 0, 
            budget_fees: toe.total_fee_with_gst || 0,
            billing_model: 'time_and_materials', // Valid value based on existing projects
            toe_id: toe.id
        };

        const newProject = await Project.create(projectData);
        
        // Link task templates
        const allLinkedTemplates = (toe.fee_structure || []).flatMap(item => item.linked_task_templates || []);
        const uniqueTemplateIds = [...new Set(allLinkedTemplates)];

        if (uniqueTemplateIds.length > 0) {
            const templates = await TaskTemplate.filter({ id: { in: uniqueTemplateIds } });
            const newTasks = templates.map(template => ({
                task_name: template.name,
                project_id: newProject.id,
                status: 'not_started',
                priority: template.priority || 'medium',
                estimated_hours: template.default_hours || 0,
                section: template.dept || 'General',
            }));
            if (newTasks.length > 0) {
                // Create tasks individually since bulkCreate doesn't exist
                for (const taskData of newTasks) {
                    await Task.create(taskData);
                }
            }
        }

        await TOE.update(toe.id, { project_created: true });

        toast.success("Project created successfully from TOE!");
        loadData();
    } catch (e) {
        console.error("Failed to create project from TOE:", e);
        toast.error("Failed to create project.");
    }
  };
  
  const handleDownloadSignedTOE = async (toe) => {
    // This function was an empty placeholder in the original code,
    // and the outline didn't provide specific implementation.
    // So, it remains an empty function.
  };
  
  const handleDuplicateTOE = async (toe) => {
    try {
        const { id, created_date, updated_date, history, status, ...duplicableData } = toe;
        const duplicatedTOE = await TOE.create({
            ...duplicableData,
            project_title: `${toe.project_title} (Copy)`,
            status: 'draft',
            version: `${parseFloat(toe.version || 1) + 0.1}`
        });
        toast.success("TOE duplicated successfully.");
        loadData();
    } catch (e) {
        console.error("Failed to duplicate TOE:", e);
        toast.error("Failed to duplicate TOE.");
    }
  };

  const handleViewFeedback = async (toe) => {
    const completedReviews = await TOEReview.filter({ toe_id: toe.id, status: 'completed' });
    if (completedReviews.length > 0) {
      setCompletedReviewsForTOE(completedReviews);
      setViewingFeedbackForTOE(toe);
    } else {
      toast.info("No completed reviews found for this TOE.");
    }
  };

  const handleAcceptChanges = async (toe, review) => {
    try {
      // Get the most recent review with changes
      const completedReviews = await TOEReview.filter({ toe_id: toe.id, status: 'completed' });
      const reviewWithChanges = completedReviews
          .filter(r => r.has_changes && r.review_data)
          .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0];

      if (!reviewWithChanges) {
        toast.error("No review changes found to accept.");
        return;
      }

      // Apply the review changes to the TOE
      const reviewData = reviewWithChanges.review_data;
      const updates = {
        scope_of_work: reviewData.scope_of_work || toe.scope_of_work,
        fee_structure: reviewData.fee_structure || toe.fee_structure,
        assumptions: reviewData.assumptions || toe.assumptions,
        exclusions: reviewData.exclusions || toe.exclusions,
        total_fee: reviewData.total_fee || toe.total_fee,
        total_fee_with_gst: reviewData.total_fee_with_gst || toe.total_fee_with_gst,
        status: 'ready_to_send', // Ready to sign and send
        history: [
          ...(toe.history || []),
          {
            timestamp: new Date().toISOString(),
            user_email: currentUser.email,
            action: "Review Changes Accepted",
            details: `Changes from review by ${reviewWithChanges.reviewer_email} were accepted. TOE is ready to sign and send.`
          }
        ]
      };
      
      await TOE.update(toe.id, updates);
      
      // Archive all completed reviews for this TOE
      for (const completedReview of completedReviews) {
        await TOEReview.update(completedReview.id, { status: 'archived' });
      }
      
      toast.success("Review changes accepted! TOE is ready to sign and send.");
      
      // Close the feedback modal
      setViewingFeedbackForTOE(null);
      
      // Reload data to get the updated TOE
      await loadData();
      
    } catch (e) {
      console.error("Failed to accept changes:", e);
      toast.error(`Failed to accept changes: ${e.message}`);
    }
  };

  const handleDiscardChanges = async (toe) => {
    try {
      // Archive all completed reviews for this TOE
      const completedReviews = await TOEReview.filter({ toe_id: toe.id, status: 'completed' });
      for (const review of completedReviews) {
        await TOEReview.update(review.id, { status: 'archived' });
      }

      await TOE.update(toe.id, {
        status: 'draft',
        history: [
          ...(toe.history || []),
          {
            timestamp: new Date().toISOString(),
            user_email: currentUser.email,
            action: "Review Changes Discarded",
            details: "Changes from reviewers were discarded. TOE reverted to draft."
          }
        ]
      });
      toast.info("Review changes discarded. TOE is now in draft status.");
      setViewingFeedbackForTOE(null);
      loadData();
    } catch (e) {
      console.error("Failed to discard changes:", e);
      toast.error("Failed to discard changes.");
    }
  };

  const getOrCreateShareToken = async (toe) => {
    let signatureRecord = (await TOESignature.filter({ toe_id: toe.id }))[0];
    if (!signatureRecord || !signatureRecord.share_token) {
        const shareToken = Math.random().toString(36).substring(2, 15);
        if (signatureRecord) {
            await TOESignature.update(signatureRecord.id, { share_token: shareToken });
        } else {
            await TOESignature.create({ toe_id: toe.id, share_token: shareToken });
        }
        return shareToken;
    }
    return signatureRecord.share_token;
  };

  const generateShareLink = async (toe) => {
    try {
        const token = await getOrCreateShareToken(toe);
        const shareUrl = `${window.location.origin}/TOESign?token=${token}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Client signature link copied to clipboard!");
    } catch (error) {
        console.error("Failed to create share link:", error);
        toast.error("Could not create share link.");
    }
  };

  const handleSaveSignature = async (signatureData) => {
    if (!signingToe) return;
    try {
        let signatureRecord = (await TOESignature.filter({ toe_id: signingToe.id }))[0];
        if (signatureRecord) {
            await TOESignature.update(signatureRecord.id, { lysaght_signature: signatureData, lysaght_signed_date: new Date().toISOString() });
        } else {
            const shareToken = Math.random().toString(36).substring(2, 15);
            await TOESignature.create({
                toe_id: signingToe.id,
                lysaght_signature: signatureData,
                lysaght_signed_date: new Date().toISOString(),
                share_token: shareToken,
            });
        }
        setShowSignatureModal(false);
        setSigningToe(null);
        if (postSignatureCallback) postSignatureCallback();
        toast.success("Signature saved successfully.");
        loadData();
    } catch (e) {
        console.error("Failed to save signature:", e);
        toast.error("Failed to save signature.");
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">TOE Manager</h1>
            <p className="text-gray-600">Create, review, and manage Terms of Engagement documents</p>
          </div>
          <Button 
            onClick={() => { setEditingTOE(null); setShowWizard(true); }}
            style={{ backgroundColor: '#5E0F68' }}
            className="hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New TOE
          </Button>
        </div>

        <Tabs defaultValue="my_toes">
            <TabsList>
                <TabsTrigger value="my_toes">
                    <List className="w-4 h-4 mr-2" />
                    My TOEs
                </TabsTrigger>
                <TabsTrigger value="for_review">
                    <ShieldQuestion className="w-4 h-4 mr-2" />
                    Awaiting My Review
                    {myReviews.length > 0 && (
                        <Badge className="ml-2 bg-purple-600 text-white">{myReviews.length}</Badge>
                    )}
                </TabsTrigger>
            </TabsList>
            <TabsContent value="my_toes" className="mt-6">
                <TOEList 
                  toes={toes}
                  clients={clients}
                  reviews={reviews}
                  isLoading={isLoading}
                  onEdit={handleEditTOE}
                  onSend={handleSendTOE}
                  onPreview={handlePreview}
                  onCreateProject={handleCreateProject}
                  onDuplicate={handleDuplicateTOE}
                  onGenerateLink={generateShareLink}
                  onDelete={handleDeleteTOE}
                  onViewFeedback={handleViewFeedback}
                />
            </TabsContent>
            <TabsContent value="for_review" className="mt-6">
                <TOEReviewList 
                    reviews={myReviews}
                    toes={toes}
                    clients={clients}
                    isLoading={isLoading}
                    onReview={(review) => {
                        const toeToReview = toes.find(t => t.id === review.toe_id);
                        setReviewingTOE(toeToReview);
                        setCurrentReview(review);
                    }}
                />
            </TabsContent>
        </Tabs>
        
        {showWizard && (
          <TOEWizard
            toe={editingTOE}
            clients={clients}
            users={users}
            onSave={handleSaveTOE}
            onCancel={() => {
              setShowWizard(false);
              setEditingTOE(null);
            }}
          />
        )}

        {previewTOE && (
          <TOEPreview
            toe={previewTOE}
            clients={clients}
            onClose={() => setPreviewTOE(null)}
          />
        )}

        {showSignatureModal && (
            <SignatureModal 
                onClose={() => { setShowSignatureModal(false); setSigningToe(null); }}
                onSave={handleSaveSignature}
            />
        )}
        
        {reviewingTOE && (
            <TOEReviewModal 
                toe={reviewingTOE}
                client={clients.find(c => c.id === reviewingTOE.client_id)}
                review={currentReview}
                onClose={() => { setReviewingTOE(null); setCurrentReview(null); }}
                onSubmit={handleReviewSubmit}
            />
        )}

        {viewingFeedbackForTOE && (
          <ReviewFeedbackModal
            toe={viewingFeedbackForTOE}
            reviews={completedReviewsForTOE}
            onClose={() => setViewingFeedbackForTOE(null)}
            onAccept={handleAcceptChanges}
            onDiscard={handleDiscardChanges}
          />
        )}
      </div>
    </div>
  );
}
