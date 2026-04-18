import React from "react";
import { Button, Card } from "./ui";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("cyberpath.web_error_boundary", { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
          <div className="mx-auto max-w-xl">
            <Card className="p-8 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-300">Application error</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Something broke in the interface.</h1>
              <p className="mt-3 text-sm text-slate-300">Reload the page to recover. If the problem continues, use the Support page so it can be fixed properly.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button className="bg-sky-400 text-slate-950" onClick={() => window.location.reload()}>Reload</Button>
                <Button className="border border-slate-700 bg-slate-900 text-slate-100" onClick={() => (window.location.hash = '#/support')}>Go to support</Button>
              </div>
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
