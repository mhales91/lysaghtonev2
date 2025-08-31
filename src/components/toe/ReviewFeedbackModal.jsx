import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Check, XIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import TrackedTextDisplay from './TrackedTextDisplay'; // Assuming this component exists and works
import { formatCurrency } from '../utils/formatter';

export default function ReviewFeedbackModal({ toe, reviews, onClose, onAccept, onDiscard }) {
  if (!toe || !reviews || reviews.length === 0) return null;
  
  // For simplicity, we'll work with the first completed review. 
  // A more complex implementation could merge or tabulate multiple reviews.
  const review = reviews[0]; 
  const originalData = {
    scope_of_work: toe.scope_of_work || '',
    assumptions: toe.assumptions || '',
    exclusions: toe.exclusions || '',
    fee_structure: toe.fee_structure || [],
    total_fee_with_gst: toe.total_fee_with_gst || 0
  };
  const reviewedData = review.review_data || {};

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Review Feedback for: {toe.project_title}</DialogTitle>
          <p className="text-sm text-gray-500">
            Feedback from: {review.reviewer_email}. Review the changes below and choose to accept or discard them.
          </p>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {/* Change Summary */}
          {review.changes_made && review.changes_made.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Change Summary</h3>
                <ul className="space-y-2">
                  {review.changes_made.map(change => (
                    <li key={change.id} className="text-sm flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                      {change.text}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          {review.comments && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Reviewer's Comments</h3>
                <p className="text-sm p-3 bg-gray-50 rounded whitespace-pre-wrap">{review.comments}</p>
              </CardContent>
            </Card>
          )}

          {/* Detailed Changes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Detailed Changes</h3>
            
            {/* Scope */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Scope of Work</h4>
                <TrackedTextDisplay 
                  originalText={originalData.scope_of_work}
                  modifiedText={reviewedData.scope_of_work}
                  className="whitespace-pre-wrap text-sm p-3 bg-gray-50 rounded"
                />
              </CardContent>
            </Card>

            {/* Assumptions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Assumptions</h4>
                <TrackedTextDisplay 
                  originalText={originalData.assumptions}
                  modifiedText={reviewedData.assumptions}
                  className="whitespace-pre-wrap text-sm p-3 bg-gray-50 rounded"
                />
              </CardContent>
            </Card>

            {/* Exclusions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Exclusions</h4>
                <TrackedTextDisplay 
                  originalText={originalData.exclusions}
                  modifiedText={reviewedData.exclusions}
                  className="whitespace-pre-wrap text-sm p-3 bg-gray-50 rounded"
                />
              </CardContent>
            </Card>
            
            {/* Fees */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">Fee Structure</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-center mb-2">Original Version</h5>
                    {originalData.fee_structure.map((item, index) => (
                      <div key={index} className="flex justify-between p-2 border-b">
                        <span>{item.description}</span>
                        <span>{formatCurrency(item.cost)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold p-2 mt-2">
                        <span>TOTAL</span>
                        <span>{formatCurrency(originalData.total_fee_with_gst)}</span>
                    </div>
                  </div>
                  <div className="border-l pl-4">
                    <h5 className="font-medium text-center mb-2">Reviewed Version</h5>
                     {reviewedData.fee_structure.map((item, index) => (
                      <div key={index} className="flex justify-between p-2 border-b">
                        <span>{item.description}</span>
                        <span>{formatCurrency(item.cost)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between font-bold p-2 mt-2">
                        <span>TOTAL</span>
                        <span>{formatCurrency(reviewedData.total_fee_with_gst)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        <DialogFooter className="border-t pt-4 flex justify-between items-center">
           <p className="text-sm text-gray-600">
             Accepting changes will update the TOE. Discarding will revert it to a draft.
           </p>
           <div className="flex gap-3">
             <Button variant="outline" onClick={() => onDiscard(toe)}>
               <XIcon className="w-4 h-4 mr-2" />
               Discard Changes & Re-edit
             </Button>
             <Button 
                style={{ backgroundColor: '#16a34a' }} 
                className="hover:bg-green-700 text-white"
                onClick={() => onAccept(toe, review)}
             >
               <Check className="w-4 h-4 mr-2" />
               Accept Changes
             </Button>
           </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}