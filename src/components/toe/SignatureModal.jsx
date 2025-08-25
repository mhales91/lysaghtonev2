
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

export default function SignatureModal({ onSave, onClose, title }) {
    const [typedName, setTypedName] = useState('');
    
    // The explicit font loading via Javascript is removed to prevent network errors.
    // The CSS @import below is more reliable and will be used instead.

    const handleSave = async () => {
        if (!typedName.trim()) {
            alert('Please enter your name to sign.');
            return;
        }

        // Create a signature image from the typed name with Alex Brush font
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // White background to prevent transparency issues in PDF
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Style the signature text with Alex Brush font
        ctx.fillStyle = '#000000';
        ctx.font = '60px "Alex Brush", cursive';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName.trim(), canvas.width / 2, canvas.height / 2);
        
        // Convert to a non-transparent JPEG image
        const signatureData = canvas.toDataURL('image/jpeg', 0.95);
        
        onSave(signatureData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[60]">
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap');
              `}
            </style>
            <Card className="w-full max-w-lg bg-white">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{title || 'Provide Signature'}</CardTitle>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="typed-name">Enter your full name to sign:</Label>
                        <Input
                            id="typed-name"
                            value={typedName}
                            onChange={(e) => setTypedName(e.target.value)}
                            placeholder="e.g., John Smith"
                            className="text-lg"
                            autoFocus
                        />
                    </div>
                    {typedName.trim() && (
                        <div className="space-y-2">
                            <Label>Signature preview:</Label>
                            <div className="p-6 border rounded bg-gray-50 text-center">
                                <div 
                                    style={{ 
                                        fontFamily: '"Alex Brush", cursive, serif',
                                        fontSize: '60px',
                                        color: '#000000',
                                        lineHeight: '1'
                                    }}
                                >
                                    {typedName.trim()}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSave} 
                            style={{ backgroundColor: '#5E0F68' }}
                            className="hover:bg-purple-700"
                        >
                            Save Signature
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
