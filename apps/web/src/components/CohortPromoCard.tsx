import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, isMockApiMode } from '../api/client';
import { COHORT, formatUzs } from '../cohort';
import { Card } from './ui';

/** Invites free learners to the paid Uzbek cohort; hidden once they have a recorded payment. */
export function CohortPromoCard() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (isMockApiMode) return;
    api.get<{ payments: Array<{ status: string }> }>('/platform/payments')
      .then(({ payments }) => setShow(!payments.some((payment) => payment.status === 'paid')))
      .catch(() => setShow(false));
  }, []);
  if (!show) return null;
  return (
    <Card className="border-sky-400/30 bg-sky-400/5 p-5" >
      <div lang="uz" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-300">Mentor bilan 6 haftalik kurs · oʻzbek tilida</p>
          <p className="mt-1 text-lg font-semibold text-white">Birinchi guruh {COHORT.startDate.replace(', dushanba', '')} boshlanadi</p>
          <p className="mt-1 text-sm text-slate-300">Jonli darslar, har hafta yozma topshiriqqa mentor fikri va yakuniy amaliy imtihon. {formatUzs(COHORT.priceUzs)} soʻm, {COHORT.seats} oʻrin.</p>
        </div>
        <Link to="/kurs" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-2xl bg-sky-400 px-5 font-medium text-slate-950">Batafsil va ariza</Link>
      </div>
    </Card>
  );
}
