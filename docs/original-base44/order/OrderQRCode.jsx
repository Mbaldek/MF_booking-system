import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Download } from "lucide-react";

export default function OrderQRCode({ orderId, orderNumber }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && orderId) {
      QRCode.toCanvas(canvasRef.current, orderId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff'
        }
      });
    }
  }, [orderId]);

  const downloadQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `commande-${orderNumber}.png`;
      link.href = url;
      link.click();
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Votre QR Code de commande
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <canvas ref={canvasRef} className="border-4 border-blue-100 rounded-lg" />
        </div>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Numéro de commande : <span className="font-bold text-gray-900">{orderNumber}</span>
          </p>
          <p className="text-xs text-gray-500">
            Présentez ce QR code au staff pour une livraison rapide
          </p>
        </div>
        <Button onClick={downloadQR} variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Télécharger le QR Code
        </Button>
      </CardContent>
    </Card>
  );
}