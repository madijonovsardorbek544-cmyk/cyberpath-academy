import { Link } from 'react-router-dom';
import { Card, SectionTitle } from '../components/ui';

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link to="/" className="text-sm text-sky-300">← Back to landing</Link>
        <SectionTitle eyebrow="Privacy" title="Privacy notice for a beta product" subtitle="This is a real page, not a fake footer link. Replace it with counsel-reviewed text before a broad public launch." />
        <Card className="p-6 text-sm text-slate-300">
          <p className="font-medium text-white">What we store</p>
          <p className="mt-2">Account data, progress, quiz attempts, mistake notes, support feedback, and operational logs needed to run the platform safely.</p>
          <p className="mt-4 font-medium text-white">Why we store it</p>
          <p className="mt-2">To authenticate users, personalize learning, diagnose problems, review mentor/admin actions, and improve content quality.</p>
          <p className="mt-4 font-medium text-white">Beta warning</p>
          <p className="mt-2">Before a wider launch you still need counsel-reviewed policy language, data retention periods, processor disclosures, and region-specific compliance handling.</p>
        </Card>
      </div>
    </div>
  );
}
