import React from "react";
import { Button, Card } from "./ui";

const isMockMode = import.meta.env.VITE_API_MODE === "mock";
const isDevMode = import.meta.env.DEV;

function resetDemoData() {
  const keysToClear: string[] = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (key && key.startsWith("cyberpath-demo-db-v")) keysToClear.push(key);
  }
  keysToClear.forEach((key) => window.localStorage.removeItem(key));
  window.location.reload();
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
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
              <p className="mt-3 text-sm text-slate-300">
                Reload the page to recover. If this is the public demo, stale demo data from an older build may be the cause.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button className="bg-sky-400 text-slate-950" onClick={() => window.location.reload()}>Reload</Button>
                {isMockMode ? <Button className="border border-amber-400/40 bg-amber-400/10 text-amber-100" onClick={resetDemoData}>Reset demo data</Button> : null}
                <Button className="border border-slate-700 bg-slate-900 text-slate-100" onClick={() => (window.location.hash = '#/support')}>Go to support</Button>
              </div>
              {isDevMode && this.state.error ? (
                <pre className="mt-6 max-h-48 overflow-auto rounded-2xl border border-slate-800 bg-slate-950 p-4 text-left text-xs text-rose-200">
                  {this.state.error.name}: {this.state.error.message}
                  {this.state.error.stack ? `\n${this.state.error.stack}` : ''}
                </pre>
              ) : null}
            </Card>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
