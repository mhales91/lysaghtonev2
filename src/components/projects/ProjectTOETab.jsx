
import React, { useState, useEffect } from 'react';
import { TOE, Client } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { handleApiError } from '@/components/utils/errorHandler'; // Keep this as it's not explicitly removed, just console.error added for TOE loading
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '../utils/formatter';

export default function ProjectTOETab({ project }) {
    const [toe, setToe] = useState(null);
    const [client, setClient] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (project?.toe_id) {
            loadToeData();
        } else {
            setIsLoading(false);
        }
    }, [project]);

    const loadToeData = async () => {
        setIsLoading(true);
        try {
            const toeData = await TOE.get(project.toe_id);
            setToe(toeData);
            if (toeData.client_id) { // Changed toeData?.client_id to toeData.client_id
                const clientData = await Client.get(toeData.client_id);
                setClient(clientData);
            }
        } catch (error) {
            console.error("Failed to load TOE data:", error); // Changed error handling
            // Potentially re-add handleApiError here if it's desired for user feedback
            // handleApiError(error, "loading TOE data"); 
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div>Loading TOE details...</div>; // Changed loading state message
    }

    if (!toe) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-gray-500">
                    No Terms of Engagement document is linked to this project.
                </CardContent>
            </Card>
        );
    }
    
    // InfoField component is removed as it's no longer used

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-3">Project Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Client:</span>
                        <span className="ml-2 font-medium">
                          {client?.name || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Project:</span>
                        <span className="ml-2 font-medium">{toe.project_title || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Version:</span>
                        <span className="ml-2 font-medium">{toe.version || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className="ml-2 font-medium capitalize">{toe.status || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Signed Date:</span>
                        <span className="ml-2 font-medium">{toe.signed_date ? new Date(toe.signed_date).toLocaleDateString() : 'N/A'}</span>
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
                        <span>{(toe.fee_structure?.length || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>{formatCurrency(toe.total_fee)}</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span>Total (incl. GST):</span>
                        <span>{formatCurrency(toe.total_fee_with_gst)}</span>
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
                    <CardHeader><CardTitle className="text-base">Scope of Work</CardTitle></CardHeader>
                    <CardContent className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {toe.scope_of_work || 'No scope defined'}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="fees" className="mt-4">
                   <Card>
                    <CardHeader><CardTitle className="text-base">Fee Structure</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        {(toe.fee_structure || []).length > 0 ? (
                            (toe.fee_structure || []).map((item, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                    <span className="text-sm">{item.description}</span>
                                    <span className="font-medium">{formatCurrency(item.cost)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">No fee items defined.</p>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="assumptions" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Assumptions</CardTitle></CardHeader>
                    <CardContent className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {toe.assumptions || 'No assumptions defined'}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="exclusions" className="mt-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">Exclusions</CardTitle></CardHeader>
                    <CardContent className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-48 overflow-y-auto whitespace-pre-wrap">
                        {toe.exclusions || 'No exclusions defined'}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              {toe.signed_document_url && (
                <div className="text-center mt-6">
                    <Button asChild>
                        <a href={toe.signed_document_url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download Signed TOE
                        </a>
                    </Button>
                </div>
              )}
        </div>
    );
}
