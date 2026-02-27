import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gradient-to-r from-amber-600 to-amber-500 text-white py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Event Eats</h1>
          <p className="text-amber-100">Maison Félicien - System de Réservation de Repas</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">✅ Setup Completed!</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 border-2 border-green-200 rounded p-4">
              <h3 className="font-bold text-green-900 mb-2">✅ GitHub Ready</h3>
              <p className="text-sm text-gray-600">Repository configured and linked</p>
            </div>
            
            <div className="bg-green-50 border-2 border-green-200 rounded p-4">
              <h3 className="font-bold text-green-900 mb-2">✅ Supabase Ready</h3>
              <p className="text-sm text-gray-600">Database schema prepared</p>
            </div>
            
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded p-4">
              <h3 className="font-bold text-yellow-900 mb-2">⏳ Vercel Pending</h3>
              <p className="text-sm text-gray-600">Ready to create & deploy</p>
            </div>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded p-4 mb-6">
            <h3 className="font-bold text-blue-900 mb-2">📚 Next Steps</h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-2">
              <li>Apply Supabase schema from SETUP_DEPLOYMENT.md</li>
              <li>Add GitHub Secrets (see GITHUB_SECRETS.md)</li>
              <li>Create Vercel project and deploy</li>
              <li>Start migrating Base44 code to Supabase</li>
            </ol>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 rounded p-4">
            <h3 className="font-bold text-gray-900 mb-3">📖 Documentation</h3>
            <ul className="space-y-1 text-sm">
              <li><code className="bg-gray-200 px-2 py-1">SETUP_DEPLOYMENT.md</code> - Complete setup guide</li>
              <li><code className="bg-gray-200 px-2 py-1">GITHUB_SECRETS.md</code> - GitHub Secrets configuration</li>
              <li><code className="bg-gray-200 px-2 py-1">CLAUDE.md</code> - Project context and architecture</li>
              <li><code className="bg-gray-200 px-2 py-1">MIGRATION_CHEATSHEET.md</code> - Base44 → Supabase patterns</li>
            </ul>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            Development mode • React 18 + Vite 6 + Tailwind CSS
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
