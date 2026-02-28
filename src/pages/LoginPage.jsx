import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message === 'Invalid login credentials'
        ? 'Email ou mot de passe incorrect'
        : err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setError('Veuillez saisir votre email pour réinitialiser le mot de passe');
      return;
    }
    setResetLoading(true);
    setError('');
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (resetError) throw resetError;
      setResetSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#faf6f5] to-[#f0e6e4] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#8B3A43] rounded-xl flex items-center justify-center mx-auto mb-4 p-2.5">
            <img src="/monogram-white.svg" alt="MF" className="w-full h-full" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-brand">Maison Félicien</h1>
          <p className="text-gray-500 text-sm mt-1">Connexion à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg">
              Un email de réinitialisation a été envoyé à {email}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8B3A43] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={resetLoading}
              className="text-xs text-[#8B3A43] hover:underline disabled:opacity-50"
            >
              {resetLoading ? 'Envoi...' : 'Mot de passe oublié ?'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#8B3A43] text-white text-sm font-medium rounded-lg hover:bg-[#7a3039] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <div className="text-center">
            <Link to="/" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Retour à l'accueil
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
