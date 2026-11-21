import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, ErrorMessage, FormField, Input } from '../ui';

export function DeleteAccountCard() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user?.role !== 'student') return null;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/auth/delete-account', { password, confirm });
      await refresh().catch(() => null);
      navigate('/', { replace: true });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-rose-500/30 p-6">
      <h2 className="text-lg font-semibold text-white">Delete account</h2>
      <p className="mt-2 text-sm text-slate-300">
        Permanently deletes your account, progress, lab work, portfolio, certificates and discussion posts. This cannot be undone.
        Accounts with payment records are deleted through support, because payment records have to be kept.
      </p>
      {!open ? (
        <Button type="button" className="mt-4 border border-rose-400/50 text-rose-200" onClick={() => setOpen(true)}>Delete my account…</Button>
      ) : (
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <FormField id="delete-password" label="Current password">
            <Input id="delete-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
          </FormField>
          <FormField id="delete-confirm" label="Type DELETE to confirm">
            <Input id="delete-confirm" autoComplete="off" required value={confirm} onChange={(event) => setConfirm(event.target.value)} />
          </FormField>
          {error ? <ErrorMessage>{error}</ErrorMessage> : null}
          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="bg-rose-500 text-white" disabled={busy || confirm !== 'DELETE' || !password}>{busy ? 'Deleting…' : 'Delete permanently'}</Button>
            <Button type="button" className="border border-slate-700 text-slate-200" onClick={() => { setOpen(false); setPassword(''); setConfirm(''); setError(''); }}>Cancel</Button>
          </div>
        </form>
      )}
    </Card>
  );
}
