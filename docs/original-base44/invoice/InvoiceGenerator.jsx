import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function InvoiceGenerator({ order, orderItems, menuItems, event }) {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Maison Félicien', 105, 28, { align: 'center' });
    doc.text('Service traiteur événementiel', 105, 33, { align: 'center' });
    
    // Ligne de séparation
    doc.line(20, 38, 190, 38);
    
    // Informations commande
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Informations commande', 20, 48);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`N° Commande : ${order.order_number}`, 20, 55);
    doc.text(`Date : ${format(new Date(order.created_date), 'dd/MM/yyyy', { locale: fr })}`, 20, 60);
    doc.text(`Événement : ${event.name}`, 20, 65);
    
    // Informations client
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Client', 120, 48);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${order.first_name} ${order.last_name}`, 120, 55);
    doc.text(`Stand : ${order.stand}`, 120, 60);
    doc.text(`Email : ${order.email}`, 120, 65);
    doc.text(`Tél : ${order.phone}`, 120, 70);
    
    // Tableau des commandes
    let yPos = 85;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Détail des commandes', 20, yPos);
    
    yPos += 8;
    
    orderItems.forEach((item, index) => {
      // Date du jour
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 4, 170, 8, 'F');
      doc.text(format(new Date(item.day_date), 'EEEE dd MMMM yyyy', { locale: fr }), 22, yPos + 1);
      yPos += 10;
      
      // Articles
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      
      if (item.entree_id) {
        const menuItem = menuItems.find(m => m.id === item.entree_id);
        doc.text(`Entrée : ${item.entree_name}`, 25, yPos);
        doc.text(`${menuItem?.price.toFixed(2) || '0.00'} €`, 180, yPos, { align: 'right' });
        yPos += 5;
      }
      
      if (item.plat_id) {
        const menuItem = menuItems.find(m => m.id === item.plat_id);
        doc.text(`Plat : ${item.plat_name}`, 25, yPos);
        doc.text(`${menuItem?.price.toFixed(2) || '0.00'} €`, 180, yPos, { align: 'right' });
        yPos += 5;
      }
      
      if (item.dessert_id) {
        const menuItem = menuItems.find(m => m.id === item.dessert_id);
        doc.text(`Dessert : ${item.dessert_name}`, 25, yPos);
        doc.text(`${menuItem?.price.toFixed(2) || '0.00'} €`, 180, yPos, { align: 'right' });
        yPos += 5;
      }
      
      if (item.boisson_id) {
        const menuItem = menuItems.find(m => m.id === item.boisson_id);
        doc.text(`Boisson : ${item.boisson_name}`, 25, yPos);
        doc.text(`${menuItem?.price.toFixed(2) || '0.00'} €`, 180, yPos, { align: 'right' });
        yPos += 5;
      }
      
      // Sous-total du jour
      doc.setFont('helvetica', 'bold');
      doc.text(`Sous-total :`, 140, yPos);
      doc.text(`${item.day_total.toFixed(2)} €`, 180, yPos, { align: 'right' });
      yPos += 8;
      
      // Nouvelle page si nécessaire
      if (yPos > 250 && index < orderItems.length - 1) {
        doc.addPage();
        yPos = 20;
      }
    });
    
    // Total général
    yPos += 5;
    doc.setDrawColor(0, 0, 0);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL TTC', 140, yPos);
    doc.text(`${order.total_amount.toFixed(2)} €`, 180, yPos, { align: 'right' });
    
    // Pied de page
    const pageCount = doc.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text('Maison Félicien - Service traiteur', 105, 285, { align: 'center' });
      doc.text(`Page ${i}/${pageCount}`, 105, 290, { align: 'center' });
    }
    
    // Télécharger
    doc.save(`facture-${order.order_number}.pdf`);
  };

  return (
    <Button onClick={generatePDF} variant="outline" className="w-full">
      <FileText className="w-4 h-4 mr-2" />
      Télécharger la facture PDF
    </Button>
  );
}