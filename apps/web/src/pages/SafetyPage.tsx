import { Link } from 'react-router-dom';
import { Card, SectionTitle } from '../components/ui';

export function SafetyPage() {
  return (
    <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/" className="text-sm text-sky-300">← Back to landing</Link>
        <SectionTitle eyebrow="Safety model" title="Why CyberPath Academy avoids unsafe offensive instruction" subtitle="A real cyber learning product should draw hard lines, not hide behind vague wording." />
        <Card className="p-6 text-sm text-slate-300">
          <p>The labs use fictional logs, toy apps, mock dashboards, and authorized defensive simulations only.</p>
          <ul className="mt-4 space-y-2 list-disc pl-5">
            <li>No live-target exploitation workflows</li>
            <li>No credential theft instructions</li>
            <li>No persistence or malware deployment guidance</li>
            <li>No evasion or destructive post-compromise playbooks</li>
          </ul>
          <p className="mt-4">The AI tutor is expected to refuse unsafe requests and redirect toward legal, sandboxed defensive learning.</p>
        </Card>
      </div>
    </div>
  );
}
