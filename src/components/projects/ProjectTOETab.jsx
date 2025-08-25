import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink } from "lucide-react";
import { TOE, TOESignature, Client } from "@/api/entities";

export default function ProjectTOETab({ project }) {
  const [toe, setToe] = useState(null);
  const [client, setClient] = useState(null);
  const [signatureRecord, setSignatureRecord] = useState(null);
  const [signingUrl, setSigningUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTOEData();
  }, [project.toe_id]);

  const loadTOEData = async () => {
    if (!project.toe_id) return;
    
    setIsLoading(true);
    try {
      const toeData = await TOE.get(project.toe_id);
      setToe(toeData);
      
      // Get client data
      if (toeData.client_id) {
        const clientData = await Client.get(toeData.client_id);
        setClient(clientData);
      }
      
      // Get signature record to build the signing URL
      const signatures = await TOESignature.filter({ toe_id: project.toe_id });
      if (signatures.length > 0) {
        const sigRecord = signatures[0];
        setSignatureRecord(sigRecord);
        const url = `${window.location.origin}/TOESign?token=${sigRecord.share_token}`;
        setSigningUrl(url);
      }
    } catch (error) {
      console.error('Error loading TOE data:', error);
    }
    setIsLoading(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(signingUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = signingUrl;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  const calculateTotals = () => {
    if (!toe?.fee_structure) return { subtotal: 0, gst: 0, total: 0 };
    const subtotal = toe.fee_structure.reduce((sum, item) => sum + (item.cost || 0), 0);
    const gst = subtotal * 0.15; // 15% GST
    const total = subtotal + gst;
    return { subtotal, gst, total };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading TOE...</p>
        </div>
      </div>
    );
  }

  if (!toe) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No TOE found for this project.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project and Financial Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Project Details</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Client:</span>
                <span className="ml-2 font-medium">
                  {client?.company_name || 'Unknown Client'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Project:</span>
                <span className="ml-2 font-medium">{toe.project_title}</span>
              </div>
              <div>
                <span className="text-gray-600">Version:</span>
                <span className="ml-2 font-medium">{toe.version}</span>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className="ml-2 font-medium capitalize">{toe.status}</span>
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
                <span>{toe.fee_structure?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${calculateTotals().subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST (15%):</span>
                <span>${calculateTotals().gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total (incl. GST):</span>
                <span>${calculateTotals().total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TOE Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Terms of Engagement Content</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {toe.scope_of_work || 'No scope defined'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="fees" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Fee Structure</h4>
                  <div className="space-y-3">
                    {toe.fee_structure?.map((item, index) => (
                      <div key={index} className="flex justify-between items-start p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{item.description}</div>
                          {item.time_estimate && (
                            <div className="text-xs text-gray-500 mt-1">
                              Estimate: {item.time_estimate}
                            </div>
                          )}
                        </div>
                        <div className="font-medium ml-4">${item.cost?.toLocaleString() || '0'}</div>
                      </div>
                    )) || (
                      <div className="text-gray-500 text-sm">No fee structure defined</div>
                    )}
                    
                    {toe.fee_structure?.length > 0 && (
                      <div className="border-t pt-3 mt-4">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal:</span>
                          <span>${calculateTotals().subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>GST (15%):</span>
                          <span>${calculateTotals().gst.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t">
                          <span>Total:</span>
                          <span>${calculateTotals().total.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="assumptions" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Assumptions</h4>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {toe.assumptions || 'No assumptions defined'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="exclusions" className="mt-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Exclusions</h4>
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {toe.exclusions || 'No exclusions defined'}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Client Signing Link */}
      <Card>
        <CardHeader>
          <CardTitle>Client Signing Link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Use this link to have the client sign or re-sign the Terms of Engagement.
          </p>
          <div className="flex gap-2">
            <Input
              value={signingUrl}
              readOnly
              className="flex-1"
            />
            <Button variant="outline" onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open(signingUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}