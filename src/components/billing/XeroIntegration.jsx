import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ExternalLink, Settings } from 'lucide-react';
import { xeroIntegration } from '@/api/functions';

export default function XeroIntegration({ invoice, onSuccess, onError }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('unknown');

    useEffect(() => {
        checkConnectionStatus();
    }, []);

    const checkConnectionStatus = async () => {
        try {
            const response = await xeroIntegration({ action: 'get_connection_status' });
            setIsConnected(response.data.connected);
            setConnectionStatus(response.data.message);
        } catch (error) {
            console.error('Error checking Xero connection:', error);
            setConnectionStatus('Error checking connection');
        }
    };

    const connectToXero = async () => {
        try {
            // Open Xero auth in popup
            const authUrl = `${window.location.origin}/functions/xeroIntegration?action=auth`;
            const popup = window.open(authUrl, 'xero-auth', 'width=600,height=700');
            
            // Listen for popup close
            const checkClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(checkClosed);
                    checkConnectionStatus(); // Refresh status
                }
            }, 1000);
        } catch (error) {
            console.error('Error connecting to Xero:', error);
            onError?.('Failed to connect to Xero');
        }
    };

    const pushToXero = async () => {
        if (!invoice?.id) return;
        
        setIsLoading(true);
        try {
            const response = await xeroIntegration({
                action: 'push_invoice',
                invoiceId: invoice.id
            });

            if (response.data.success) {
                onSuccess?.(`Invoice ${invoice.invoice_number} sent to Xero successfully!`);
            } else {
                onError?.(response.data.error || 'Failed to send invoice to Xero');
            }
        } catch (error) {
            console.error('Error pushing to Xero:', error);
            onError?.('Failed to send invoice to Xero');
        }
        setIsLoading(false);
    };

    return (
        <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-800">
                    <ExternalLink className="w-5 h-5" />
                    Xero Integration
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-orange-600" />
                        )}
                        <span className="text-sm text-gray-700">
                            Status: {connectionStatus}
                        </span>
                    </div>
                    <Badge variant={isConnected ? "default" : "secondary"}>
                        {isConnected ? "Connected" : "Disconnected"}
                    </Badge>
                </div>

                <div className="flex gap-2">
                    {!isConnected ? (
                        <Button 
                            onClick={connectToXero}
                            variant="outline"
                            className="flex items-center gap-2"
                        >
                            <Settings className="w-4 h-4" />
                            Connect to Xero
                        </Button>
                    ) : (
                        <Button 
                            onClick={pushToXero}
                            disabled={isLoading || !invoice || invoice.status !== 'approved'}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {isLoading ? 'Sending...' : 'Send to Xero'}
                        </Button>
                    )}
                </div>

                <div className="text-xs text-gray-600">
                    {invoice?.status !== 'approved' && (
                        <p>Invoice must be approved before sending to Xero.</p>
                    )}
                    {invoice?.xero_id && (
                        <p>Already sent to Xero (ID: {invoice.xero_id})</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}