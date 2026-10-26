import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Award, Flame, SearchCheck, Siren, Zap } from 'lucide-react';
import { api } from '../api/client';
import { Badge, Card, Loader } from '../components/ui';
import type { PublicProfile } from '../types';
import { certificateVerifyUrl, linkedInCertificationUrl, publicProfileUrl } from '../components/progress/profileLinks';

export function PublicProfilePage() {
  const { handle } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!handle) return;
    api.get<{ profile: PublicProfile }>(`/profile/public/${handle}`).then((data) => setProfile(data.profile)).catch((err: Error) => setError(err.message));
  }, [handle]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 bg-glow px-4 py-16 text-center text-slate-100">
        <h1 className="text-2xl font-semibold text-white">Profile not available</h1>
        <p className="mt-2 text-slate-400">{error}</p>
        <Link to="/" className="mt-6 inline-block text-sky-300">Go to CyberPath Academy</Link>
      </div>
    );
  }
  if (!profile) return <div className="min-h-screen bg-slate-950 p-8 text-slate-100"><Loader text="Loading profile..." /></div>;
  const url = publicProfileUrl(profile.handle ?? '');

  return (
    <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100">
      <main className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">CyberPath Academy learner</p>
          <h1 className="text-3xl font-semibold text-white">{profile.name}</h1>
          {profile.headline ? <p className="text-lg text-slate-300">{profile.headline}</p> : null}
          <p className="text-sm text-slate-500">@{profile.handle} · learning since {new Date(profile.memberSince).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-5"><p className="flex items-center gap-2 text-sm text-slate-400"><Zap size={16} className="text-sky-300" aria-hidden="true" /> Level</p><p className="mt-2 text-3xl font-semibold text-white">{profile.level}</p><p className="text-xs text-slate-400">{profile.totalXp} XP</p></Card>
          <Card className="p-5"><p className="flex items-center gap-2 text-sm text-slate-400"><Flame size={16} className="text-orange-300" aria-hidden="true" /> Current streak</p><p className="mt-2 text-3xl font-semibold text-white">{profile.streak}</p><p className="text-xs text-slate-400">days</p></Card>
          <Card className="p-5"><p className="flex items-center gap-2 text-sm text-slate-400"><Award size={16} className="text-amber-300" aria-hidden="true" /> Badges</p><p className="mt-2 text-3xl font-semibold text-white">{profile.badges.length}</p><p className="text-xs text-slate-400">earned</p></Card>
        </div>

        {profile.badges.length ? (
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white">Badges</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {profile.badges.map((badge) => (
                <li key={badge.id} className="rounded-2xl border border-amber-300/30 p-4">
                  <p className="font-medium text-white">{badge.name}</p>
                  <p className="text-xs text-slate-400">{badge.description}</p>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {profile.cases.length ? (
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><SearchCheck size={18} aria-hidden="true" /> Investigations closed</h2>
            <ul className="mt-3 space-y-2">
              {profile.cases.map((item) => <li key={item.slug} className="flex flex-wrap items-center gap-2 text-sm text-slate-200">{item.title}<Badge>{item.category}</Badge><Badge>{item.difficulty}</Badge></li>)}
            </ul>
          </Card>
        ) : null}

        {profile.soc.length ? (
          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Siren size={18} aria-hidden="true" /> SOC simulator</h2>
            <ul className="mt-3 space-y-2">{profile.soc.map((shift) => <li key={shift.slug} className="text-sm text-slate-200">{shift.title}: best {shift.bestScore} / {shift.maxScore}</li>)}</ul>
          </Card>
        ) : null}

        {profile.certificates.length ? (
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white">Certificates</h2>
            <ul className="mt-3 space-y-2">
              {profile.certificates.map((certificate) => (
                <li key={certificate.title} className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-200">
                  <span>{certificate.title} · {new Date(certificate.issuedAt).toLocaleDateString()}</span>
                  <span className="flex gap-3">
                    {certificate.verifyCode ? <a href={certificateVerifyUrl(certificate.verifyCode)} className="text-sky-300 hover:text-sky-200">Verify {certificate.verifyCode}</a> : null}
                    <a href={linkedInCertificationUrl(certificate.title, certificate.verifyCode ? certificateVerifyUrl(certificate.verifyCode) : url, certificate.issuedAt, certificate.verifyCode ?? undefined)} target="_blank" rel="noreferrer" className="text-sky-300 hover:text-sky-200">Add to LinkedIn</a>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {profile.artifacts.length ? (
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white">Published portfolio work</h2>
            <ul className="mt-3 space-y-2">{profile.artifacts.map((artifact) => <li key={artifact.shareId}><Link to={`/public/artifacts/${artifact.shareId}`} className="text-sm text-sky-300 hover:text-sky-200">{artifact.title}</Link> <span className="text-xs text-slate-500">{artifact.type}</span></li>)}</ul>
          </Card>
        ) : null}

        <p className="text-xs text-slate-500">CyberPath Academy teaches defensive security with fictional evidence. <Link to="/" className="text-sky-300">Start learning for free</Link>.</p>
      </main>
    </div>
  );
}
