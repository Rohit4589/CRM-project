import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    localStorage.removeItem('mi_crm_user');
    localStorage.removeItem('mi_crm_tab');
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F8F9FA',
          padding: '20px',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '16px',
            padding: '36px',
            maxWidth: '540px',
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
            textAlign: 'center',
            border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 20px'
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>

            <h2 style={{fontSize: '22px', fontWeight: '800', color: '#0F172A', margin: '0 0 8px'}}>
              Something went wrong
            </h2>
            <p style={{fontSize: '14px', color: '#64748B', margin: '0 0 24px', lineHeight: 1.5}}>
              A rendering issue occurred. You can reload the page or reset your active session.
            </p>

            {this.state.error && (
              <div style={{
                background: '#F1F5F9',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '24px',
                textAlign: 'left',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#334155',
                overflowX: 'auto',
                maxHeight: '120px'
              }}>
                <strong>Error:</strong> {this.state.error.toString()}
              </div>
            )}

            <div style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'var(--gold, #B47B3B)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-rotate-right"></i> Reload Page
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#fff',
                  color: '#64748B',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '11px 22px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <i className="fa-solid fa-arrow-right-to-bracket"></i> Back to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
