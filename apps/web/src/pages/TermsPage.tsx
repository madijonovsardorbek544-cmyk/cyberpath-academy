import { Link } from 'react-router-dom';
import { Card, SectionTitle } from '../components/ui';

export function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/" className="text-sm text-sky-300">← Back to landing</Link>
        <SectionTitle eyebrow="Terms" title="Terms for authorized, defensive learning only" subtitle="These terms are here because a cybersecurity product without boundaries is reckless." />
        <Card className="p-6 text-sm text-slate-300">
          <p className="font-medium text-white">Authorized use only</p>
          <p className="mt-2">The platform is for defensive education, toy environments, and authorized simulation only. No live-target misuse, credential theft, malware deployment, or harmful attack workflows.</p>
          <p className="mt-4 font-medium text-white">Beta limitations</p>
          <p className="mt-2">The app is offered as an early product and may change. Do not rely on it as your only security training source for regulated environments.</p>
          <p className="mt-4 font-medium text-white">Account responsibility</p>
          <p className="mt-2">Users must keep their account secure, avoid abusive usage, and report material bugs responsibly.</p>
        </Card>
      </div>
    </div>
  );
}
