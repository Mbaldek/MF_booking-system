import ClientHeader from '@/components/layout/ClientHeader';
import PublicFooter from '@/components/layout/PublicFooter';

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-mf-blanc-casse flex flex-col">
      <ClientHeader />

      <main className="flex-1 max-w-2xl mx-auto px-5 py-10">
        <h1 className="font-display italic text-[28px] text-mf-rose mb-8">Mentions légales</h1>

        <div className="space-y-8 font-body text-[14px] text-mf-marron-glace leading-relaxed">
          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Éditeur du site</h2>
            <p>
              <strong>Maison Félicien</strong><br />
              SIRET : 808 374 086<br />
              101 rue de Sèvres, 75006 Paris, France<br />
              Email : <a href="mailto:contact@maison-felicien.com" className="underline text-mf-vieux-rose hover:text-mf-rose">contact@maison-felicien.com</a>
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Directrice de la publication</h2>
            <p>Anne-Pascale Guillaume</p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Hébergement</h2>
            <p>
              <strong>Application web :</strong> Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
              <strong>Base de données :</strong> Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site (textes, images, logo, marque) est la propriété exclusive
              de Maison Félicien. Toute reproduction, même partielle, est interdite sans autorisation
              préalable écrite.
            </p>
          </section>

          <section>
            <h2 className="font-body text-[12px] uppercase tracking-[0.15em] text-mf-vieux-rose mb-3">Données personnelles</h2>
            <p>
              Pour toute information relative à la collecte et au traitement de vos données personnelles,
              consultez notre{' '}
              <a href="/privacy" className="underline text-mf-vieux-rose hover:text-mf-rose">
                politique de confidentialité
              </a>.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
