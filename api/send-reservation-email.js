import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use verified domain address if set, otherwise fall back to Resend test domain.
// IMPORTANT: onboarding@resend.dev only delivers to the Resend account owner's email.
// Set EMAIL_FROM in Vercel env vars once your domain is verified in Resend:
//   e.g.  Maison Félicien <reservations@maisonfélicien.com>
const FROM = process.env.EMAIL_FROM ?? 'Maison Félicien <onboarding@resend.dev>';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    type = 'confirmation', // 'request' | 'confirmation'
    email, guestName,
    serviceName, tourStart,
    tableCode, tableNumber, // tableCode preferred (e.g. "O3"); tableNumber fallback
    floorName, seats, date,
  } = req.body;

  if (!email || !guestName) {
    return res.status(400).json({ error: 'Missing required fields: email, guestName' });
  }

  const displayTable = tableCode ?? (tableNumber != null ? `T${tableNumber}` : null);
  const isRequest = type === 'request';

  const subject = isRequest
    ? 'Demande de réservation reçue — Maison Félicien'
    : 'Votre réservation est confirmée — Maison Félicien';

  const headerTitle = isRequest
    ? 'Demande reçue ✓'
    : 'Réservation confirmée ✓';

  const introText = isRequest
    ? `Chère <strong>${guestName}</strong>,<br><br>
       Nous avons bien reçu votre demande de réservation. Notre équipe vous attribuera une table et vous enverra un email de confirmation dans les plus brefs délais.`
    : `Chère <strong>${guestName}</strong>,<br><br>
       Votre réservation est confirmée ! Nous avons le plaisir de vous accueillir à Maison Félicien.`;

  const noteText = isRequest
    ? `Vous recevrez un second email dès que votre table sera attribuée. En cas de question, contactez-nous directement.`
    : `Merci d'arriver 10 minutes avant votre réservation. En cas d'annulation, merci de nous prévenir au moins 24h à l'avance.`;

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FDFAF6; color: #392D31;">

      <!-- Header -->
      <div style="text-align: center; padding: 36px 24px 24px; border-bottom: 1px solid #D4A088;">
        <p style="font-family: Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #8B6A5A; margin: 0 0 4px 0;">Maison</p>
        <h1 style="font-style: italic; color: #8B3A43; margin: 0; font-size: 28px; font-weight: normal;">Félicien</h1>
      </div>

      <!-- Body -->
      <div style="padding: 36px 32px; color: #392D31;">
        <h2 style="font-weight: normal; font-size: 20px; color: #8B3A43; margin: 0 0 16px 0;">
          ${headerTitle}
        </h2>

        <p style="margin: 0 0 24px 0; line-height: 1.7; font-size: 15px;">
          ${introText}
        </p>

        <!-- Détails -->
        <div style="background: #F5EDE8; border-left: 3px solid #8B3A43; padding: 20px 24px; margin: 0 0 24px 0; border-radius: 0 8px 8px 0;">
          ${date ? `<div style="margin-bottom: 14px;"><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Date</span><br><strong style="font-size: 15px;">${date}</strong></div>` : ''}
          ${serviceName || tourStart ? `<div style="margin-bottom: 14px;"><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Service</span><br><strong style="font-size: 15px;">${serviceName ?? ''}${tourStart ? ` — ${tourStart}` : ''}</strong></div>` : ''}
          ${displayTable != null ? `<div style="margin-bottom: 14px;"><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Table</span><br><strong style="font-size: 15px;">${displayTable}${floorName ? ` &mdash; ${floorName}` : ''}</strong></div>` : ''}
          ${!displayTable && floorName ? `<div style="margin-bottom: 14px;"><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Salle préférée</span><br><strong style="font-size: 15px;">${floorName}</strong></div>` : ''}
          <div><span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #8B6A5A;">Couverts</span><br><strong style="font-size: 15px;">${seats} personne${seats > 1 ? 's' : ''}</strong></div>
        </div>

        <!-- Note -->
        <div style="background: #EDE0D8; border-radius: 8px; padding: 16px 20px; margin: 0 0 32px 0; font-size: 13px; color: #5C3D2E; line-height: 1.6;">
          <strong>À noter :</strong> ${noteText}
        </div>

        <p style="font-size: 13px; color: #8B6A5A; line-height: 1.6; margin: 0;">
          Des questions ? Contactez-nous à <a href="mailto:contact@maisonfelicien.com" style="color: #8B3A43;">contact@maisonfelicien.com</a>
        </p>
      </div>

      <!-- Boutique promo -->
      <div style="margin: 0 32px 24px; background: #F5EDE8; border-radius: 12px; padding: 20px 24px; text-align: center;">
        <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #8B6A5A; margin: 0 0 8px;">Découvrez aussi</p>
        <p style="font-style: italic; color: #8B3A43; font-size: 17px; margin: 0 0 8px;">La boutique Maison Félicien</p>
        <p style="font-size: 13px; color: #5C3D2E; margin: 0 0 14px; line-height: 1.5;">Foie gras, terrines, conserves & épicerie fine — livraison à domicile.</p>
        <a href="https://maisonfelicien.com" style="display: inline-block; background: #8B3A43; color: white; text-decoration: none; padding: 10px 24px; border-radius: 50px; font-size: 13px; font-family: Arial, sans-serif; letter-spacing: 0.05em;">
          Visiter la boutique
        </a>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding: 20px 24px; border-top: 1px solid #D4A088; font-size: 11px; color: #B09080;">
        Maison Félicien &copy; ${new Date().getFullYear()} &mdash; Tous droits réservés
      </div>

    </div>
  `;

  try {
    const response = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
    });

    return res.status(200).json({ success: true, id: response.data?.id });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
}
