import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export const sendOrderConfirmationEmail = async (order, orderItems, event) => {
  const itemsList = orderItems.map(item => {
    const items = [];
    if (item.entree_name) items.push(`Entrée: ${item.entree_name}`);
    if (item.plat_name) items.push(`Plat: ${item.plat_name}`);
    if (item.dessert_name) items.push(`Dessert: ${item.dessert_name}`);
    if (item.boisson_name) items.push(`Boisson: ${item.boisson_name}`);
    
    return `
      <div style="margin: 20px 0; padding: 15px; background: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px;">
        <h3 style="margin: 0 0 10px 0; color: #1e40af; font-size: 16px;">
          ${format(new Date(item.day_date), "EEEE d MMMM yyyy", { locale: fr })}
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #475569;">
          ${items.map(i => `<li>${i}</li>`).join('')}
        </ul>
        <p style="margin: 10px 0 0 0; font-weight: bold; color: #059669;">
          Sous-total: ${item.day_total.toFixed(2)}€
        </p>
      </div>
    `;
  }).join('');

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Maison Félicien</h1>
        <p style="color: #e0e7ff; margin: 10px 0 0 0;">Confirmation de commande</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #dcfce7; border: 2px solid #86efac; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #166534; font-size: 18px; font-weight: bold; text-align: center;">
            ✓ Votre commande est confirmée !
          </p>
        </div>
        
        <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
          Bonjour <strong>${order.first_name} ${order.last_name}</strong>,
        </p>
        
        <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
          Nous avons bien reçu votre commande pour <strong>${event.name}</strong>. 
          Voici le récapitulatif de votre commande :
        </p>
        
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;">
            <strong>Numéro de commande:</strong> ${order.order_number}
          </p>
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;">
            <strong>Stand:</strong> ${order.stand}
          </p>
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;">
            <strong>Téléphone:</strong> ${order.phone}
          </p>
        </div>
        
        <h2 style="color: #1e293b; font-size: 20px; margin: 30px 0 15px 0;">
          Détail de votre commande
        </h2>
        
        ${itemsList}
        
        <div style="margin: 30px 0; padding: 20px; background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); border-radius: 8px;">
          <p style="margin: 0; font-size: 24px; color: #166534; text-align: center;">
            <strong>Total: ${order.total_amount.toFixed(2)}€</strong>
          </p>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #fbbf24; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> Présentez votre QR code ou indiquez votre numéro de commande lors de la livraison.
          </p>
        </div>
        
        <p style="color: #475569; margin: 30px 0 0 0; line-height: 1.6;">
          Merci de votre confiance !<br>
          <strong>L'équipe Maison Félicien</strong>
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          Maison Félicien - Service traiteur événementiel
        </p>
      </div>
    </div>
  `;

  try {
    await base44.integrations.Core.SendEmail({
      to: order.email,
      subject: `Confirmation de commande ${order.order_number} - Maison Félicien`,
      body: emailBody
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error };
  }
};

export const sendDeliveryReminderEmail = async (order, orderItem, event) => {
  const items = [];
  if (orderItem.entree_name) items.push(`• Entrée: ${orderItem.entree_name}`);
  if (orderItem.plat_name) items.push(`• Plat: ${orderItem.plat_name}`);
  if (orderItem.dessert_name) items.push(`• Dessert: ${orderItem.dessert_name}`);
  if (orderItem.boisson_name) items.push(`• Boisson: ${orderItem.boisson_name}`);

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Maison Félicien</h1>
        <p style="color: #fed7aa; margin: 10px 0 0 0;">Rappel de livraison</p>
      </div>
      
      <div style="padding: 30px;">
        <div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 18px; font-weight: bold; text-align: center;">
            📦 Votre repas sera livré aujourd'hui !
          </p>
        </div>
        
        <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
          Bonjour <strong>${order.first_name} ${order.last_name}</strong>,
        </p>
        
        <p style="color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
          Votre commande pour <strong>${format(new Date(orderItem.day_date), "EEEE d MMMM yyyy", { locale: fr })}</strong> 
          sera livrée aujourd'hui au stand <strong>${order.stand}</strong>.
        </p>
        
        <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;">
            <strong>Numéro de commande:</strong> ${order.order_number}
          </p>
          <p style="margin: 0 0 5px 0; color: #64748b; font-size: 14px;">
            <strong>Stand:</strong> ${order.stand}
          </p>
        </div>
        
        <h2 style="color: #1e293b; font-size: 18px; margin: 30px 0 15px 0;">
          Votre menu du jour
        </h2>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          ${items.map(i => `<p style="margin: 5px 0; color: #92400e; font-size: 14px;">${i}</p>`).join('')}
        </div>
        
        <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
          <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
            <strong>Astuce:</strong> Ayez votre QR code à portée de main pour un retrait rapide.
          </p>
        </div>
        
        <p style="color: #475569; margin: 30px 0 0 0; line-height: 1.6;">
          Bon appétit !<br>
          <strong>L'équipe Maison Félicien</strong>
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          Maison Félicien - Service traiteur événementiel
        </p>
      </div>
    </div>
  `;

  try {
    await base44.integrations.Core.SendEmail({
      to: order.email,
      subject: `📦 Livraison aujourd'hui - ${order.order_number}`,
      body: emailBody
    });
    return { success: true };
  } catch (error) {
    console.error('Erreur envoi email:', error);
    return { success: false, error };
  }
};