import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-mf-blanc-casse flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] border border-mf-border p-8 max-w-md text-center space-y-4">
            <h1 className="font-display text-[24px] italic text-mf-rose">
              Oups, une erreur est survenue
            </h1>
            <p className="font-body text-[14px] text-mf-muted">
              Veuillez rafraîchir la page. Si le problème persiste, contactez-nous.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center font-body text-[13px] uppercase tracking-wider bg-mf-rose text-mf-blanc-casse rounded-full px-6 py-3 cursor-pointer border-none"
            >
              Rafraîchir la page
            </button>
            {this.state.error && (
              <details className="text-left">
                <summary className="font-body text-[11px] text-mf-muted cursor-pointer">
                  Détails techniques
                </summary>
                <pre className="mt-2 p-3 bg-mf-blanc-casse rounded-lg text-[10px] text-mf-marron-glace overflow-auto max-h-40">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
