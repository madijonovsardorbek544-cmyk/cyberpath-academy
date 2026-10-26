import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Button, Card, ErrorMessage, FormField, Input } from '../ui';
import type { ProfileSettings } from '../../types';
import { linkedInShareUrl, publicProfileUrl } from './profileLinks';

export function ProfileSettingsCard() {
  const [settings, setSettings] = useState<ProfileSettings | null>(null);
  const [handle, setHandle] = useState('');
  const [headline, setHeadline] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<{ settings: ProfileSettings }>('/profile/me').then(({ settings: loaded }) => {
      setSettings(loaded);
      setHandle(loaded.handle ?? '');
      setHeadline(loaded.headline);
    }).catch((err: Error) => setError(err.message));
  }, []);

  const save = async (patch: Partial<ProfileSettings>, message: string) => {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const { settings: saved } = await api.patch<{ settings: ProfileSettings }>('/profile/me', patch);
      setSettings(saved);
      setHandle(saved.handle ?? '');
      setStatus(message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setStatus('Link copied.');
    } catch {
      setStatus(url);
    }
  };

  if (!settings) return error ? <Card className="p-5"><ErrorMessage>{error}</ErrorMessage></Card> : null;
  const url = settings.handle ? publicProfileUrl(settings.handle) : '';

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="text-lg font-semibold text-white">Public profile</h2>
        <p className="mt-1 text-sm text-slate-400">Share your level, badges, closed cases and published portfolio work. Your profile shows your name, but never your email or league. It stays private until you publish it.</p>
      </div>
      <form className="grid gap-4 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void save({ handle: handle.trim().toLowerCase(), headline }, 'Profile saved.'); }}>
        <FormField id="profile-handle" label="Handle" hint="3-30 lowercase letters, numbers or dashes.">
          <Input id="profile-handle" value={handle} onChange={(event) => setHandle(event.target.value)} placeholder="blue-team-amina" autoComplete="off" />
        </FormField>
        <FormField id="profile-headline" label="Headline" hint="Optional, up to 120 characters.">
          <Input id="profile-headline" value={headline} maxLength={120} onChange={(event) => setHeadline(event.target.value)} placeholder="Aspiring SOC analyst" />
        </FormField>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <Button type="submit" disabled={busy || !handle.trim()} className="border border-slate-700 text-slate-100">Save</Button>
          {settings.isPublic ? (
            <Button type="button" disabled={busy} onClick={() => void save({ isPublic: false }, 'Your profile is private again.')} className="border border-rose-400/40 text-rose-100">Make private</Button>
          ) : (
            <Button type="button" disabled={busy || !settings.handle} onClick={() => void save({ isPublic: true }, 'Your profile is public.')} className="bg-sky-400 text-slate-950">Publish profile</Button>
          )}
        </div>
      </form>
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      {status ? <p role="status" className="break-all text-sm text-emerald-300">{status}</p> : null}
      {settings.isPublic && url ? (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link to={`/u/${settings.handle}`} className="text-sky-300 hover:text-sky-200">View public profile</Link>
          <Button type="button" onClick={() => void copy(url)} className="border border-slate-700 text-slate-100">Copy link</Button>
          <a href={linkedInShareUrl(url)} target="_blank" rel="noreferrer" className="rounded-2xl border border-sky-400/40 px-4 py-3 text-sky-100 hover:bg-sky-400/10">Share on LinkedIn</a>
        </div>
      ) : null}
    </Card>
  );
}
