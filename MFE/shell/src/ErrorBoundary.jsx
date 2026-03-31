import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Tag with MF name for observability
    console.error(`[MFE Error] ${this.props.name}:`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ border: '1px solid #f99', background: '#fff5f5', borderRadius: 8, padding: 24 }}>
          <strong style={{ color: '#c00' }}>⚠ {this.props.name} failed to load</strong>
          <p style={{ color: '#666', fontSize: 13, margin: '8px 0 12px' }}>
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            style={{ background: '#222', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
