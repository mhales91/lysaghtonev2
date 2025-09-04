import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format, formatDistanceToNow } from 'date-fns';
import { ShieldCheck } from 'lucide-react';

export default function TOEReviewList({ reviews, toes, clients, isLoading, onReview }) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                ))}
            </div>
        );
    }
    
    if (reviews.length === 0) {
        return (
            <Card>
                <CardContent className="p-10 text-center">
                    <ShieldCheck className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-600">All clear!</p>
                    <p className="text-gray-500">You have no TOEs awaiting your review.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {reviews.map(review => {
                const toe = toes.find(t => t.id === review.toe_id);
                if (!toe) return null;
                
                const client = clients.find(c => c.id === toe.client_id);
                const requestedAt = new Date(review.requested_at);
                
                return (
                    <Card key={review.id}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex-1">
                                <p className="font-semibold">{toe.project_title}</p>
                                <p className="text-sm text-gray-600">For: {client?.name || 'N/A'}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Requested by {review.requester_email} &bull; {formatDistanceToNow(requestedAt, { addSuffix: true })}
                                </p>
                            </div>
                            <Button onClick={() => onReview(review)}>
                                Review Now
                            </Button>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}