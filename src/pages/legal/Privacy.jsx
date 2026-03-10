import ClientHeader from '@/components/layout/ClientHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-mf-blanc-casse flex flex-col">
      <ClientHeader />

      <main className="flex-1 max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display italic text-[28px] text-mf-rose mb-8">Politique de confidentialité</h1>

        <div className="space-y-8 font-body text-[14px] text-mf-marron-glace leading-relaxed">
          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Responsable du traitement</h2>
            <p>
              <strong>Maison Félicien</strong><br />
              101 rue de Sèvres, 75006 Paris, France<br />
              Email : <a href="mailto:contact@maison-felicien.com" className="underline text-mf-vieux-rose hover:text-mf-rose">contact@maison-felicien.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Données collectées</h2>
            <p>Dans le cadre de la prise de commande, nous collectons les données suivantes :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Prénom et nom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Numéro de stand</li>
              <li>Nom de société (facultatif)</li>
              <li>Adresse de facturation (facultatif)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Finalités du traitement</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Traitement et suivi de votre commande de repas</li>
              <li>Communication liée à l'événement et à la livraison</li>
              <li>Facturation et gestion comptable</li>
              <li>Envoi de la confirmation de commande par email</li>
            </ul>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Base juridique</h2>
            <p>
              Le traitement de vos données repose sur l'exécution du contrat (votre commande)
              et votre consentement explicite donné lors de la validation de commande.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Durée de conservation</h2>
            <p>
              Vos données de commande sont conservées pendant la durée nécessaire au traitement
              de votre commande et aux obligations légales de conservation comptable (10 ans pour
              les documents comptables).
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Partage des données</h2>
            <p>Vos données sont transmises exclusivement aux prestataires suivants, nécessaires au fonctionnement du service :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Stripe</strong> — traitement sécurisé des paiements</li>
              <li><strong>Resend</strong> — envoi des emails de confirmation</li>
              <li><strong>Supabase</strong> — hébergement de la base de données</li>
              <li><strong>Vercel</strong> — hébergement de l'application web</li>
            </ul>
            <p className="mt-2">Vos données ne sont jamais vendues ni transmises à des tiers à des fins commerciales.</p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Vos droits</h2>
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Droit d'accès à vos données personnelles</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement (« droit à l'oubli »)</li>
              <li>Droit à la portabilité de vos données</li>
              <li>Droit d'opposition au traitement</li>
              <li>Droit de retirer votre consentement à tout moment</li>
            </ul>
            <p className="mt-2">
              Pour exercer ces droits, contactez-nous à{' '}
              <a href="mailto:contact@maison-felicien.com" className="underline text-mf-vieux-rose hover:text-mf-rose">
                contact@maison-felicien.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Cookies</h2>
            <p>
              Ce site n'utilise aucun cookie publicitaire ni cookie tiers à des fins de suivi.
              Seuls des cookies techniques essentiels au fonctionnement du service (authentification,
              session) peuvent être déposés.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Réclamation</h2>
            <p>
              Si vous estimez que le traitement de vos données ne respecte pas la réglementation,
              vous pouvez adresser une réclamation à la CNIL :{' '}
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="underline text-mf-vieux-rose hover:text-mf-rose">
                www.cnil.fr
              </a>.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
