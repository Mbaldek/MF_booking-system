import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabase';
import MfButton from '@/components/ui/MfButton';
import MfInput from '@/components/ui/MfInput';
import MfCard from '@/components/ui/MfCard';

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
      setError('Veuillez saisir votre email pour reinitialiser le mot de passe');
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
    <div className="min-h-screen flex items-center justify-center bg-mf-blanc-casse px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/brand/Logo_Rose.svg" alt="Maison Felicien" className="h-12 mx-auto mb-5" />
          </Link>
          <p className="font-body text-[10px] uppercase tracking-[0.2em] text-mf-muted">
            Espace equipe
          </p>
        </div>

        <MfCard>
          <h1 className="font-serif text-[24px] italic text-mf-rose text-center mb-6">
            Connexion
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="bg-status-red/10 text-status-red font-body text-[13px] p-3 rounded-xl">
                {error}
              </div>
            )}

            {resetSent && (
              <div className="bg-mf-vert-olive/10 text-mf-vert-olive font-body text-[13px] p-3 rounded-xl">
                Un email de reinitialisation a ete envoye a {email}
              </div>
            )}

            <MfInput
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />

            <MfInput
              label="Mot de passe"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            <div className="text-right">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="font-body text-[12px] text-mf-vieux-rose hover:text-mf-rose transition-colors bg-transparent border-none cursor-pointer disabled:opacity-50"
              >
                {resetLoading ? 'Envoi...' : 'Mot de passe oublie ?'}
              </button>
            </div>

            <MfButton type="submit" fullWidth disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </MfButton>
          </form>
        </MfCard>

        <div className="text-center mt-6">
          <Link to="/" className="font-body text-[12px] text-mf-muted hover:text-mf-rose transition-colors">
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
