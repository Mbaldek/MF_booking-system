/**
 * RESERVATION MODULE — Integration Guide
 * Resend Setup + Email Template
 */

// ============================================================
// 1. INSTALL RESEND (if not already done)
// ============================================================
// npm install resend

// ============================================================
// 2. ADD RESEND API KEY TO ENV
// ============================================================
// .env.local (or Vercel settings)
// VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx

// ============================================================
// 3. CREATE API ROUTE FOR EMAIL (if Vite + Vercel)
// ============================================================
// Option A: Use Vercel Functions
// Create: api/send-reservation-email.js

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, guestName, serviceName, tourStart, tableNumber, seats, date } =
    req.body;

  try {
    const response = await resend.emails.send({
      from: 'reservations@maisonfélicien.com', // adjust domain
      to: email,
      subject: 'Confirmation de réservation - Maison Félicien',
      html: `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="text-align: center; padding: 30px 0; border-bottom: 2px solid #D4A574;">
            <h1 style="font-style: italic; color: #8B1538; margin: 0; font-size: 24px;">
              Maison Félicien
            </h1>
            <p style="color: #6B4423; font-size: 12px; margin: 5px 0 0 0; letter-spacing: 2px;">
              RESTAURANT
            </p>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px; color: #3D2817;">
            <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #8B1538;">
              Réservation confirmée ✓
            </h2>
            
            <p style="margin: 20px 0; line-height: 1.6; font-size: 14px;">
              Chère <strong>${guestName}</strong>,<br><br>
              Merci pour votre réservation ! Nous sommes ravis de vous accueillir.
            </p>

            <!-- Details Box -->
            <div style="
              background: #F5F0E8;
              border-left: 4px solid #D4A574;
              padding: 20px;
              margin: 20px 0;
              font-size: 14px;
            ">
              <div style="margin-bottom: 12px;">
                <strong>Date & Heure :</strong><br>
                ${date} à ${tourStart}
              </div>
              <div style="margin-bottom: 12px;">
                <strong>Service :</strong><br>
                ${serviceName}
              </div>
              <div style="margin-bottom: 12px;">
                <strong>Table :</strong><br>
                Table ${tableNumber}
              </div>
              <div>
                <strong>Couverts :</strong><br>
                ${seats} personne${seats > 1 ? 's' : ''}
              </div>
            </div>

            <!-- Important info -->
            <div style="
              background: #F5E6D3;
              border-radius: 4px;
              padding: 15px;
              margin: 20px 0;
              font-size: 13px;
              color: #6B4423;
            ">
              <strong>Important :</strong> Merci d'arriver 10 minutes avant votre réservation.
              Si vous devez annuler, contactez-nous au moins 24h à l'avance.
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://maisonfélicien.com" style="
                display: inline-block;
                background: #8B1538;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: bold;
                font-size: 14px;
              ">
                Voir nos détails
              </a>
            </div>

            <!-- Footer message -->
            <p style="
              margin-top: 30px;
              font-size: 12px;
              color: #8B8B8B;
              line-height: 1.6;
            ">
              Des questions ? Contactez-nous à contact@maisonfélicien.com<br>
              Téléphone : +33 X XX XX XX XX
            </p>
          </div>

          <!-- Footer -->
          <div style="
            text-align: center;
            padding: 20px;
            border-top: 2px solid #D4A574;
            font-size: 11px;
            color: #999;
          ">
            Maison Félicien © 2026 | Tous droits réservés
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      id: response.id,
    });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message,
    });
  }
}

// ============================================================
// 4. CALL API FROM RESERVATION PAGE (after form submit)
// ============================================================
// In ReservationPage.jsx, modify handleSubmit:

const handleSubmit = async () => {
  if (!chosenTour || !guest.name || !guest.email) {
    alert('Veuillez remplir tous les champs');
    return;
  }

  // Save reservation to DB
  createReservation.mutate(
    {
      tour_id: chosenTour.id,
      table_id: chosenTable?.id,
      guest_name: guest.name,
      guest_email: guest.email,
      seats: guest.seats,
    },
    {
      onSuccess: async (reservation) => {
        // Send email via API
        try {
          const response = await fetch('/api/send-reservation-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: guest.email,
              guestName: guest.name,
              serviceName: chosenShift?.name,
              tourStart: chosenTour?.start_time.slice(0, 5),
              tableNumber: chosenTable?.number,
              seats: guest.seats,
              date: new Date().toLocaleDateString('fr-FR'),
            }),
          });

          if (!response.ok) throw new Error('Email send failed');

          setStep(3); // Show confirmation screen
        } catch (err) {
          console.error('Email error:', err);
          setStep(3); // Still show confirmation but log error
          // TODO: send to Sentry or log service
        }
      },
    }
  );
};

// ============================================================
// 5. ALTERNATIVE: Use Edge Function (Vercel Edge Runtime)
// ============================================================
// Create: api/send-reservation-email.js with edge runtime
/*
export const runtime = 'edge';

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { email, guestName, ... } = await req.json();

  const response = await resend.emails.send({
    from: 'reservations@maisonfélicien.com',
    to: email,
    // ... rest of config
  });

  return new Response(JSON.stringify({ success: true, id: response.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
*/

// ============================================================
// 6. DATABASE TRIGGER (Optional: Automatic email on insert)
// ============================================================
// Add this to Supabase to trigger email automation
/*
CREATE FUNCTION notify_reservation()
RETURNS TRIGGER AS $$
BEGIN
  -- Call HTTP endpoint to send email
  PERFORM net.http_post(
    url := current_setting('app.resend_webhook_url'),
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'email', (SELECT guest_email FROM reservations WHERE id = NEW.id),
      'guestName', (SELECT guest_name FROM reservations WHERE id = NEW.id)
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_reservation_created
  AFTER INSERT ON reservations
  FOR EACH ROW
  EXECUTE FUNCTION notify_reservation();
*/

// ============================================================
// 7. TEST RESEND (Development)
// ============================================================
// Run in Node REPL or test file:
/*
import { Resend } from 'resend';

const resend = new Resend('re_test_key...');

const response = await resend.emails.send({
  from: 'onboarding@resend.dev', // test domain
  to: 'your-email@example.com',
  subject: 'Test',
  html: '<h1>Test Email</h1>',
});

console.log(response);
*/

// ============================================================
// RESEND DOCS / REFERENCES
// ============================================================
// https://resend.com/docs
// Setup domain: https://resend.com/domains
// Email templates: https://react.email/

export default {
  notes:
    'Follow steps 1-4 to integrate email. See Alternative/DB Trigger for advanced setups.',
};
