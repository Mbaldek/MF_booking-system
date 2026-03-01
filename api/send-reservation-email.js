import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, guestName, serviceName, tourStart, tableNumber, seats, date } = req.body;

  if (!email || !guestName) {
    return res.status(400).json({ error: 'Missing required fields: email, guestName' });
  }

  try {
    const response = await resend.emails.send({
      // Domaine de test Resend — fonctionne sans vérification, emails reçus uniquement sur l'adresse du compte Resend
      // Remplacer par votre domaine vérifié quand disponible : 'Maison Félicien <reservations@votre-domaine.com>'
      from: 'Maison Félicien <onboarding@resend.dev>',
      to: email,
      subject: 'Confirmation de réservation — Maison Félicien',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDFAF6; color: #392D31;">

          <!-- Header -->
          <div style="text-align: center; padding: 36px 24px 24px; border-bottom: 1px solid #D4A088;">
            <p style="font-family: Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #8B6A5A; margin: 0 0 4px 0;">Maison</p>
            <h1 style="font-style: italic; color: #8B3A43; margin: 0; font-size: 28px; font-weight: normal;">Félicien</h1>
          </div>

          <!-- Body -->
          <div style="padding: 36px 32px; color: #392D31;">
            <h2 style="font-weight: normal; font-size: 20px; color: #8B3A43; margin: 0 0 16px 0;">
              Réservation confirmée ✓
            </h2>

            <p style="margin: 0 0 24px 0; line-height: 1.7; font-size: 15px;">
              Chère <strong>${guestName}</strong>,<br><br>
              Nous avons bien enregistré votre réservation et sommes ravis de vous accueillir.
            </p>

            <!-- Détails -->
            <div style="background: #F5EDE8; border-left: 3px solid #8B3A43; padding: 20px 24px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
              ${date ? `<div style="margin-bottom: 14px;"><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Date</span><br><strong style="font-size: 15px;">${date}</strong></div>` : ''}
              ${serviceName || tourStart ? `<div style="margin-bottom: 14px;"><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Service</span><br><strong style="font-size: 15px;">${serviceName ?? ''}${tourStart ? ` — ${tourStart}` : ''}</strong></div>` : ''}
              ${tableNumber != null ? `<div style="margin-bottom: 14px;"><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Table</span><br><strong style="font-size: 15px;">Table ${tableNumber}</strong></div>` : ''}
              <div><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Couverts</span><br><strong style="font-size: 15px;">${seats} personne${seats > 1 ? 's' : ''}</strong></div>
            </div>

            <!-- Note -->
            <div style="background: #EDE0D8; border-radius: 8px; padding: 16px 20px; margin: 0 0 32px 0; font-size: 13px; color: #5C3D2E; line-height: 1.6;">
              <strong>À noter :</strong> Merci d'arriver 10 minutes avant votre réservation. En cas d'annulation, merci de nous prévenir au moins 24h à l'avance.
            </div>

            <p style="font-size: 13px; color: #8B6A5A; line-height: 1.6; margin: 0;">
              Des questions ? Contactez-nous à <a href="mailto:contact@maisonfélicien.com" style="color: #8B3A43;">contact@maisonfélicien.com</a>
            </p>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding: 20px 24px; border-top: 1px solid #D4A088; font-size: 11px; color: #B09080;">
            Maison Félicien &copy; ${new Date().getFullYear()} &mdash; Tous droits réservés
          </div>

        </div>
      `,
    });

    return res.status(200).json({ success: true, id: response.data?.id });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
