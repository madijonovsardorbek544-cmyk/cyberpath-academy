import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AppShell } from '../components/AppShell';
import { Badge, Button, Card, Loader, SectionTitle } from '../components/ui';
import type { Plan, Subscription } from '../types';

type BillingPayload = {
  plans: Plan[];
  subscription: Subscription;
  plan: Plan;
  demoBillingEnabled: boolean;
};

type PlansResponse = { plans: Plan[]; billingIntegration?: { supportEmail?: string; providers?: string[]; securityNotice?: string } };

function BillingContent({ publicView = false }: { publicView?: boolean }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billing, setBilling] = useState<BillingPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [supportEmail, setSupportEmail] = useState('madijonovsardorbek544@gmail.com');
  const [securityNotice, setSecurityNotice] = useState('Use tokenized checkout only.');

  useEffect(() => {
    const load = async () => {
      try {
        const publicData = await api.get<PlansResponse>('/platform/plans');
        setPlans(publicData.plans);
        setSupportEmail(publicData.billingIntegration?.supportEmail || 'madijonovsardorbek544@gmail.com');
        setSecurityNotice(publicData.billingIntegration?.securityNotice || 'Use tokenized checkout only.');
        if (!publicView) {
          const authed = await api.get<BillingPayload>('/platform/subscription');
          setBilling(authed);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [publicView]);

  const activateDemoPlan = async (planId: string) => {
    const response = await api.post<{ message: string; subscription: Subscription }>('/platform/subscription/demo-checkout', { planId });
    setMessage(response.message);
    const refreshed = await api.get<BillingPayload>('/platform/subscription');
    setBilling(refreshed);
  };

  if (loading) return <Loader text="Loading pricing..." />;

  return (
    <div className="space-y-8">
      <SectionTitle eyebrow="Billing and launch strategy" title={publicView ? 'Pricing built for real launch architecture.' : 'Subscription status and launch pricing.'} subtitle="Premium is $3/month or 36,000 UZS after a 30-day free trial. Free gives around 50% access. Real charging must use processor-hosted, tokenized checkout for Payme and international cards." />
      {message ? <Card className="p-4 text-sm text-emerald-300">{message}</Card> : null}
      {!publicView && billing ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Current plan</h3>
              <p className="mt-1 text-sm text-slate-400">{billing.plan.name} · {billing.subscription.status}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge>{billing.subscription.billingCycle}</Badge>
              {billing.subscription.currentPeriodEnd ? <Badge>Renews {new Date(billing.subscription.currentPeriodEnd).toLocaleDateString()}</Badge> : null}
            </div>
          </div>
        </Card>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className="p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
              <Badge>{plan.priceMonthlyUsd ? `$${plan.priceMonthlyUsd}/mo · ${plan.priceMonthlyUzs?.toLocaleString?.() ?? plan.priceMonthlyUzs} UZS` : 'Free'}</Badge>
            </div>
            <p className="mt-3 text-sm text-slate-400">{plan.description}</p>
            {plan.trialDays ? <p className="mt-2 text-xs text-emerald-300">First {plan.trialDays} days free, then recurring billing starts.</p> : <p className="mt-2 text-xs text-slate-500">Includes approximately {plan.accessLevel ?? 50}% access.</p>}
            <div className="mt-4 space-y-2 text-sm text-slate-300">
              {plan.features.map((feature) => <div key={feature} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">{feature}</div>)}
              {plan.paymentMethods?.length ? <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-400">Payment methods: {plan.paymentMethods.join(' · ')}</div> : null}
            </div>
            {!publicView ? (
              <Button className="mt-5 bg-sky-400 text-slate-950" onClick={() => activateDemoPlan(plan.id)}>
                Start plan
              </Button>
            ) : (
              <Link to="/login"><Button className="mt-5 bg-sky-400 text-slate-950">Create account</Button></Link>
            )}
          </Card>
        ))}
      </div>
      <Card className="p-5 text-sm text-slate-300">
        <p className="font-medium text-white">Real checkout safety notice</p>
        <p className="mt-2">{securityNotice}</p>
        <p className="mt-2">Support email: <a className="text-sky-300" href={`mailto:${supportEmail}`}>{supportEmail}</a></p>
        <p className="mt-2">Before launch you still need processor credentials, webhook verification, invoice delivery, dispute handling, taxes, and legal review.</p>
      </Card>
    </div>
  );
}

export function BillingPage({ publicView = false }: { publicView?: boolean }) {
  if (publicView) {
    return <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><Link to="/" className="text-sm text-sky-300">← Back to landing</Link><div className="mt-6"><BillingContent publicView /></div></div></div>;
  }
  return <AppShell><BillingContent /></AppShell>;
}
