
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, Loader2 } from 'lucide-react';
import { TOE, TOESignature } from '@/api/entities';
import { generateTOEPDF } from '@/api/functions';

export default function TOEPreview({ toe, clients, onClose }) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const client = clients.find(c => c.id === toe.client_id);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const signatureRecords = await TOESignature.filter({ toe_id: toe.id });
      const signatureRecord = signatureRecords[0] || null;

      const pdfPayload = {
        project_title: toe.project_title,
        status: toe.status,
        scope_of_work: toe.scope_of_work,
        fee_structure: toe.fee_structure,
        total_fee: toe.total_fee,
        total_fee_with_gst: toe.total_fee_with_gst,
        assumptions: toe.assumptions,
        exclusions: toe.exclusions,
        client: {
          company_name: client.company_name,
          contact_person: client.contact_person,
          email: client.email,
          phone: client.phone,
        },
        signatureRecord: signatureRecord
          ? {
              client_signature: signatureRecord.client_signature,
              client_signed_date: signatureRecord.client_signed_date,
              lysaght_signature: signatureRecord.lysaght_signature,
              lysaght_signed_date: signatureRecord.lysaght_signed_date,
            }
          : null,
        includeSignatures: !!signatureRecord,
      };

      const response = await generateTOEPDF(pdfPayload);

      if (response.status === 200 && response.data) {
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${toe.project_title || 'TOE'}-${toe.status}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate PDF');
      }
    } catch (e) {
      console.error("Failed to generate PDF for download", e);
      alert("Could not generate PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD'
    }).format(amount || 0);
  };

  if (!toe || !client) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Preview: {toe.project_title}</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownload} disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Download PDF
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-6 border-t border-b">
            <h3 className="text-lg font-semibold">Scope of Work</h3>
            <p className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{toe.scope_of_work}</p>

            <h3 className="text-lg font-semibold mt-4">Fee Structure</h3>
            <div className="border rounded-md">
                {toe.fee_structure.map((item, index) => (
                    <div key={index} className={`flex justify-between p-3 text-sm ${index < toe.fee_structure.length - 1 ? 'border-b' : ''}`}>
                        <span>{item.description}</span>
                        <span className="font-mono">{formatCurrency(item.cost)}</span>
                    </div>
                ))}
            </div>

            <div className="flex justify-end mt-4 text-right">
              <div className="w-64">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(toe.total_fee)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST (15%):</span>
                  <span>{formatCurrency(toe.total_fee_with_gst - toe.total_fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base mt-2 pt-2 border-t">
                  <span>Total:</span>
                  <span>{formatCurrency(toe.total_fee_with_gst)}</span>
                </div>
              </div>
            </div>

            {toe.assumptions && (
                <>
                    <h3 className="text-lg font-semibold mt-4">Assumptions</h3>
                    <p className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{toe.assumptions}</p>
                </>
            )}
            {toe.exclusions && (
                <>
                    <h3 className="text-lg font-semibold mt-4">Exclusions</h3>
                    <p className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{toe.exclusions}</p>
                </>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
