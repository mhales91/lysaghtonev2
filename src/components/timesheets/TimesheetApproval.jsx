import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Clock, User, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function TimesheetApproval({ currentUser, onApprove, onReject, onUnlock }) {
    const [pendingSubmissions, setPendingSubmissions] = useState([]);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadPendingSubmissions();
    }, []);

    const loadPendingSubmissions = async () => {
        setIsLoading(true);
        try {
            // This would load submissions based on user role
            // Managers see their team's submissions
            // Finance/Admins see all submissions
            const submissions = []; // Load from backend
            setPendingSubmissions(submissions);
        } catch (error) {
            console.error('Error loading submissions:', error);
        }
        setIsLoading(false);
    };

    const handleApprove = async (submissionId) => {
        try {
            await onApprove(submissionId);
            loadPendingSubmissions();
        } catch (error) {
            console.error('Error approving submission:', error);
        }
    };

    const handleReject = async (submissionId) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }

        try {
            await onReject(submissionId, rejectionReason);
            setRejectionReason('');
            setSelectedSubmission(null);
            loadPendingSubmissions();
        } catch (error) {
            console.error('Error rejecting submission:', error);
        }
    };

    const handleUnlock = async (submissionId) => {
        if (!confirm('Are you sure you want to unlock this timesheet for editing?')) {
            return;
        }

        try {
            await onUnlock(submissionId);
            loadPendingSubmissions();
        } catch (error) {
            console.error('Error unlocking submission:', error);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'submitted': 'bg-yellow-100 text-yellow-800',
            'approved': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800'
        };
        return colors[status] || colors['submitted'];
    };

    const canApprove = () => {
        const role = currentUser?.user_role?.toLowerCase();
        return ['manager', 'deptlead', 'director', 'admin'].includes(role);
    };

    if (!canApprove()) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Restricted</h3>
                    <p className="text-gray-600">You don't have permission to approve timesheets.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Timesheet Approvals
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-8">Loading submissions...</div>
                    ) : pendingSubmissions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Week</TableHead>
                                    <TableHead>Total Hours</TableHead>
                                    <TableHead>Billable Hours</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingSubmissions.map(submission => (
                                    <TableRow key={submission.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                {submission.user_email}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {submission.week_identifier}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {format(new Date(submission.week_start_date), 'MMM d')} - {format(new Date(submission.week_end_date), 'MMM d')}
                                            </div>
                                        </TableCell>
                                        <TableCell>{submission.total_hours}h</TableCell>
                                        <TableCell>{submission.billable_hours}h</TableCell>
                                        <TableCell>
                                            {format(new Date(submission.submitted_at), 'MMM d, HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(submission.status)}>
                                                {submission.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {submission.status === 'submitted' && (
                                                    <>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleApprove(submission.id)}
                                                            className="text-green-600 hover:text-green-700"
                                                        >
                                                            <Check className="w-4 h-4 mr-1" />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setSelectedSubmission(submission)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <X className="w-4 h-4 mr-1" />
                                                            Reject
                                                        </Button>
                                                    </>
                                                )}
                                                {submission.status === 'approved' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleUnlock(submission.id)}
                                                    >
                                                        Unlock
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8">
                            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Submissions</h3>
                            <p className="text-gray-600">All timesheets have been processed.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Rejection Modal */}
            {selectedSubmission && (
                <Card className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full">
                        <CardHeader>
                            <CardTitle>Reject Timesheet</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Rejecting timesheet for <strong>{selectedSubmission.user_email}</strong> 
                                    - Week {selectedSubmission.week_identifier}
                                </p>
                                <Textarea
                                    placeholder="Please provide a reason for rejection..."
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedSubmission(null);
                                        setRejectionReason('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => handleReject(selectedSubmission.id)}
                                >
                                    Reject Timesheet
                                </Button>
                            </div>
                        </CardContent>
                    </div>
                </Card>
            )}
        </div>
    );
}