import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-6">
          <div className="card max-w-md p-8 text-center">
            <h1 className="font-display text-2xl text-ink">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted">
              Please refresh the page. If the problem continues, try again later.
            </p>
            <button className="btn-primary mt-6" onClick={() => window.location.assign('/')}>
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
