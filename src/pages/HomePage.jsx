import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function HomePage() {
  const { isAuthenticated, isLoading, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">MF</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Maison Félicien</h1>
              <p className="text-xs text-gray-500">Traiteur événementiel</p>
            </div>
          </div>
          <div>
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {profile?.display_name || profile?.email}
                </span>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Déconnexion
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Commandez vos repas pour l'événement
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Service traiteur midi et soir — Salons, foires et congrès
        </p>

        <Link
          to="/order"
          className="inline-flex items-center px-8 py-3 bg-blue-600 text-white text-base font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg"
        >
          Commander maintenant
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🍽️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Choisissez vos repas</h3>
            <p className="text-sm text-gray-500">
              Entrées, plats, desserts et boissons pour chaque créneau
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 mb-2">Midi et soir</h3>
            <p className="text-sm text-gray-500">
              Commandez pour plusieurs jours en une seule fois
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-3xl mb-3">🚚</div>
            <h3 className="font-semibold text-gray-900 mb-2">Livré à votre stand</h3>
            <p className="text-sm text-gray-500">
              Suivi en temps réel de la préparation et livraison
            </p>
          </div>
        </div>

        {isAuthenticated && (profile?.role === 'admin' || profile?.role === 'staff') && (
          <div className="mt-12 p-6 bg-white rounded-xl shadow-sm">
            <p className="text-sm text-gray-500 mb-3">Espace personnel</p>
            <div className="flex flex-wrap justify-center gap-3">
              {profile?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Administration
                </Link>
              )}
              <Link
                to="/staff/kitchen"
                className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Espace staff
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
