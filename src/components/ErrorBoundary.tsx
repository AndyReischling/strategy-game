import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

// Without this, any render-time exception blanks the entire app (a cream void).
// The boundary catches it, shows the actual message, and offers a reload so the
// player is never stranded on a blank screen.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash-screen">
          <div className="crash-card card offset c-orange">
            <h2>Something broke</h2>
            <p className="tiny muted">The screen hit an unexpected error. Reloading usually clears it.</p>
            <pre className="crash-msg">{this.state.error.message || String(this.state.error)}</pre>
            <button className="btn btn-go" onClick={() => location.reload()}>Reload</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
