import ClientHeader from '@/components/layout/ClientHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export default function CGV() {
  return (
    <div className="min-h-screen bg-mf-blanc-casse flex flex-col">
      <ClientHeader />

      <main className="flex-1 max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display italic text-[28px] text-mf-rose mb-8">Conditions Générales de Vente</h1>

        <div className="space-y-8 font-body text-[14px] text-mf-marron-glace leading-relaxed">
          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 1 — Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent la vente de prestations
              de restauration événementielle proposées par Maison Félicien via le site
              reservation.maison-felicien.com.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 2 — Identité du vendeur</h2>
            <p>
              <strong>Maison Félicien</strong><br />
              SIRET : 808 374 086<br />
              101 rue de Sèvres, 75006 Paris, France<br />
              Email : <a href="mailto:contact@maison-felicien.com" className="underline text-mf-vieux-rose hover:text-mf-rose">contact@maison-felicien.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 3 — Commandes</h2>
            <p>
              Le client passe commande en ligne via le site. La commande est validée après
              paiement intégral par carte bancaire via la plateforme sécurisée Stripe.
              Un email de confirmation est envoyé au client après validation du paiement.
            </p>
            <p className="mt-2">
              Le numéro de commande fait office de justificatif et doit être présenté lors
              du retrait des repas sur le lieu de l'événement.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 4 — Prix</h2>
            <p>
              Les prix sont indiqués en euros TTC. Maison Félicien se réserve le droit de
              modifier ses prix à tout moment, étant entendu que le prix applicable est celui
              en vigueur au moment de la validation de la commande.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 5 — Paiement</h2>
            <p>
              Le paiement s'effectue en ligne par carte bancaire via Stripe. Le paiement est
              sécurisé et les données bancaires ne sont ni stockées ni accessibles par Maison Félicien.
              Le montant est débité au moment de la validation de la commande.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 6 — Livraison / Retrait</h2>
            <p>
              Les repas sont servis sur le lieu de l'événement, aux créneaux horaires sélectionnés
              lors de la commande (midi et/ou soir). Selon l'option choisie, les repas peuvent être
              livrés au stand du client ou retirés au point de retrait indiqué.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 7 — Annulation et remboursement</h2>
            <p>
              Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation
              ne s'applique pas aux prestations de services de restauration pour une date déterminée.
            </p>
            <p className="mt-2">
              Toutefois, en cas de circonstances exceptionnelles (annulation de l'événement par
              l'organisateur), Maison Félicien procédera au remboursement intégral des commandes
              concernées.
            </p>
            <p className="mt-2">
              Pour toute demande d'annulation, contactez-nous à{' '}
              <a href="mailto:contact@maison-felicien.com" className="underline text-mf-vieux-rose hover:text-mf-rose">
                contact@maison-felicien.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 8 — Responsabilité</h2>
            <p>
              Maison Félicien s'engage à fournir les prestations commandées avec le plus grand soin.
              En cas de rupture de stock ou d'indisponibilité d'un produit, le client sera informé
              et une alternative lui sera proposée.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 9 — Données personnelles</h2>
            <p>
              Les données personnelles collectées font l'objet d'un traitement conforme au RGPD.
              Pour plus d'informations, consultez notre{' '}
              <a href="/privacy" className="underline text-mf-vieux-rose hover:text-mf-rose">
                politique de confidentialité
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Article 10 — Droit applicable</h2>
            <p>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties
              s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents
              de Paris seront seuls compétents.
            </p>
          </section>

          <p className="text-[12px] text-mf-muted mt-8">
            Dernière mise à jour : mars 2026
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
