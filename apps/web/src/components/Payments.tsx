import { FormEvent, useEffect, useState } from 'react';
import { api } from '../api/client';
import { Badge, Button, Card, FormField, Input, Select } from './ui';

type Payment = {
  id: string;
  planId: string;
  amountUzs: number;
  method: string;
  reference: string | null;
  status: 'paid' | 'refunded';
  accessUntil: string;
  createdAt: string;
  userEmail?: string;
  userName?: string;
};

const uzs = (value: number) => `${value.toLocaleString('uz-UZ')} UZS`;
const day = (iso: string) => new Date(iso).toLocaleDateString();
const methods = [
  ['payme_invoice', 'Payme invoice'],
  ['click_invoice', 'Click invoice'],
  ['bank_transfer', 'Bank transfer'],
  ['cash', 'Cash'],
  ['other', 'Other']
];

const emptyForm = { email: '', planId: 'premium', amountUzs: '', method: 'payme_invoice', reference: '', accessDays: '30' };

/** Admin ledger: record a payment only after the money has arrived; it grants access for the chosen days. */
export function PaymentsAdminCard() {
  const [payments, setPayments] = useState<Payment[] | null>(null);
  const [totals, setTotals] = useState({ paidCount: 0, paidUzs: 0, refundedCount: 0 });
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const data = await api.get<{ payments: Payment[]; totals: typeof totals }>('/admin/payments');
      setPayments(data.payments);
      setTotals(data.totals);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load payments.');
      setPayments([]);
    }
  };
  useEffect(() => { load(); }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      await api.post('/admin/payments', {
        email: form.email,
        planId: form.planId,
        amountUzs: Number(form.amountUzs),
        method: form.method,
        reference: form.reference || null,
        accessDays: Number(form.accessDays)
      });
      setMessage(`Payment recorded. ${form.email} now has ${form.planId} access.`);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the payment.');
    } finally {
      setBusy(false);
    }
  };

  const refund = async (payment: Payment) => {
    if (!window.confirm(`Mark ${uzs(payment.amountUzs)} from ${payment.userEmail} as refunded? Their access from this payment ends now.`)) return;
    setError(''); setMessage('');
    try {
      await api.post(`/admin/payments/${payment.id}/refund`);
      setMessage('Refund recorded and access updated.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record the refund.');
    }
  };

  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-white">Payments and access</h3>
      <p className="mt-1 text-sm text-slate-400">Record a payment only after you have confirmed the money arrived. Access starts now, or extends an open period.</p>
      <p className="mt-3 text-sm text-slate-300">{totals.paidCount} paid · {uzs(totals.paidUzs)} · {totals.refundedCount} refunded</p>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
        <FormField id="pay-email" label="Learner account email">
          <Input id="pay-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField id="pay-amount" label="Amount received (UZS)">
          <Input id="pay-amount" type="number" min="0" required value={form.amountUzs} onChange={(e) => setForm({ ...form, amountUzs: e.target.value })} />
        </FormField>
        <FormField id="pay-method" label="Method">
          <Select id="pay-method" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
            {methods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </FormField>
        <FormField id="pay-ref" label="Receipt or invoice number" hint="Optional, helps you match bank records">
          <Input id="pay-ref" maxLength={120} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </FormField>
        <FormField id="pay-plan" label="Plan">
          <Select id="pay-plan" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
            <option value="premium">Premium (learner)</option>
            <option value="school">School / cohort</option>
          </Select>
        </FormField>
        <FormField id="pay-days" label="Access length (days)">
          <Input id="pay-days" type="number" min="1" max="366" required value={form.accessDays} onChange={(e) => setForm({ ...form, accessDays: e.target.value })} />
        </FormField>
        <div className="sm:col-span-2">
          <Button disabled={busy} className="bg-sky-400 text-slate-950">{busy ? 'Saving…' : 'Record payment and grant access'}</Button>
        </div>
      </form>
      <div aria-live="polite">
        {message ? <p className="mt-3 text-sm text-emerald-300">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </div>
      <div className="mt-5 space-y-2">
        {payments === null ? <p className="text-sm text-slate-400">Loading payments…</p> : null}
        {payments?.length === 0 ? <p className="text-sm text-slate-400">No payments recorded yet.</p> : null}
        {payments?.map((payment) => (
          <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-sm">
            <div className="text-slate-300">
              <span className="font-medium text-white">{payment.userEmail}</span> · {uzs(payment.amountUzs)} · {payment.method.replace('_', ' ')}
              {payment.reference ? ` · ${payment.reference}` : ''} · {day(payment.createdAt)} · access until {day(payment.accessUntil)}
            </div>
            {payment.status === 'refunded'
              ? <Badge className="border-slate-700 text-slate-400">Refunded</Badge>
              : <Button type="button" onClick={() => refund(payment)} className="border border-slate-700 bg-slate-900 text-white">Mark refunded</Button>}
          </div>
        ))}
      </div>
    </Card>
  );
}

/** A learner's own purchase history. Renders nothing until there is at least one payment. */
export function PaymentHistoryCard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  useEffect(() => {
    api.get<{ payments: Payment[] }>('/platform/payments').then((data) => setPayments(data.payments)).catch(() => setPayments([]));
  }, []);
  if (!payments.length) return null;
  return (
    <Card className="p-5">
      <h3 className="text-lg font-semibold text-white">Your payments</h3>
      <ul className="mt-3 space-y-2 text-sm text-slate-300">
        {payments.map((payment) => (
          <li key={payment.id} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
            {day(payment.createdAt)} · {uzs(payment.amountUzs)} · {payment.planId} access until {day(payment.accessUntil)}
            {payment.status === 'refunded' ? ' · refunded' : ''}
          </li>
        ))}
      </ul>
    </Card>
  );
}
