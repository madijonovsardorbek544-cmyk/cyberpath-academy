import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Button, Card, FormField, Input, Select, Textarea } from '../components/ui';

// Set these when the first group is scheduled; until then the page says they will be announced.
const COHORT = {
  priceUzs: null as number | null,
  startDate: null as string | null,
  seats: 15
};

const weeks = [
  ['1-hafta', 'Kiberxavfsizlik nima? Parollar, MFA va akkauntni himoya qilish'],
  ['2-hafta', 'Fishingni tanish. Tarmoq asoslari: IP, port, DNS, HTTPS'],
  ['3-hafta', 'Linux asoslari va terminal bilan ishlash'],
  ['4-hafta', 'Veb qanday ishlaydi, keng tarqalgan zaifliklar, loglarni oʻqish'],
  ['5-hafta', 'SOC tahlilchisining ishi va SIEM asoslari'],
  ['6-hafta', 'Insidentga javob berish va yakuniy amaliy baholash']
];

const initialForm = { name: '', contact: '', email: '', ageGroup: '18_24', experience: 'none', goal: 'career', message: '' };

export function CohortPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = 'uz';
    document.title = 'Kiberxavfsizlik asoslari: 6 haftalik kurs · CyberPath';
    return () => { document.documentElement.lang = previous; };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await api.post('/platform/cohort-applications', { ...form, email: form.email || null, message: form.message || null });
      setStatus('sent');
    } catch {
      setStatus('error');
      setError('Ariza yuborilmadi. Maʼlumotlarni tekshirib, qayta urinib koʻring.');
    }
  };

  const set = (key: keyof typeof initialForm) => (event: { target: { value: string } }) => setForm({ ...form, [key]: event.target.value });

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-10">
        <Link to="/" className="text-sm text-sky-300">← CyberPath bosh sahifasi</Link>

        <header className="space-y-4">
          <p className="text-sm font-medium text-sky-300">Onlayn kurs · oʻzbek tilida · 6 hafta</p>
          <h1 className="text-3xl font-semibold leading-tight text-white sm:text-4xl">Kiberxavfsizlikni noldan oʻrganing: mentor bilan, amaliyot bilan</h1>
          <p className="max-w-2xl text-base text-slate-300">
            Haftasiga 2 ta jonli dars, platformada amaliy mashqlar va har hafta yozma topshirigʻingizga mentor fikri.
            Dasturlash yoki tarmoq boʻyicha oldindan bilim shart emas.
          </p>
          <dl className="grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 p-4"><dt className="text-slate-400">Narx</dt><dd className="mt-1 font-medium text-white">{COHORT.priceUzs ? `${COHORT.priceUzs.toLocaleString('uz-UZ')} soʻm` : 'Ariza topshirganlarga yuboriladi'}</dd></div>
            <div className="rounded-2xl border border-slate-800 p-4"><dt className="text-slate-400">Boshlanishi</dt><dd className="mt-1 font-medium text-white">{COHORT.startDate ?? 'Guruh yigʻilgach eʼlon qilinadi'}</dd></div>
            <div className="rounded-2xl border border-slate-800 p-4"><dt className="text-slate-400">Guruhda</dt><dd className="mt-1 font-medium text-white">{COHORT.seats} kishigacha</dd></div>
          </dl>
          <a href="#ariza" className="inline-flex min-h-11 items-center rounded-2xl bg-sky-400 px-5 py-2 font-medium text-slate-950">Ariza topshirish</a>
        </header>

        <section aria-labelledby="dastur" className="space-y-4">
          <h2 id="dastur" className="text-2xl font-semibold text-white">Dastur</h2>
          <ol className="space-y-2">
            {weeks.map(([week, topic]) => (
              <li key={week} className="flex gap-4 rounded-2xl border border-slate-800 p-4 text-sm">
                <span className="w-16 shrink-0 font-medium text-sky-300">{week}</span>
                <span className="text-slate-200">{topic}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="qanday" className="grid gap-4 sm:grid-cols-2">
          <h2 id="qanday" className="text-2xl font-semibold text-white sm:col-span-2">Qanday oʻqiysiz</h2>
          <Card className="p-5 text-sm text-slate-300"><h3 className="font-semibold text-white">Jonli darslar</h3><p className="mt-2">Haftasiga 2 marta, 60–75 daqiqa, onlayn. Har bir dars yozib olinadi, qoldirsangiz keyin koʻrasiz.</p></Card>
          <Card className="p-5 text-sm text-slate-300"><h3 className="font-semibold text-white">Amaliyot telefonda ham</h3><p className="mt-2">Tergovlar, SOC simulyatori va terminal mashqlari brauzerda ishlaydi. Hamma maʼlumotlar oʻylab topilgan, real tizimlar ishlatilmaydi.</p></Card>
          <Card className="p-5 text-sm text-slate-300"><h3 className="font-semibold text-white">Mentor fikri</h3><p className="mt-2">Har hafta bitta yozma topshiriq. Mentor nimani yaxshi qilganingiz va nimani tuzatish kerakligini yozadi.</p></Card>
          <Card className="p-5 text-sm text-slate-300"><h3 className="font-semibold text-white">Sertifikat</h3><p className="mt-2">Yakuniy amaliy baholashdan oʻtsangiz, kursni tugatganlik haqida sertifikat olasiz. U akkreditatsiyaga ega emas va ish kafolati bermaydi: u siz nimani oʻrganib, nimani bajarganingizni koʻrsatadi.</p></Card>
        </section>

        <section aria-labelledby="qoidalar" className="space-y-2 text-sm text-slate-300">
          <h2 id="qoidalar" className="text-2xl font-semibold text-white">Muhim qoidalar</h2>
          <p>Kursda faqat himoyani oʻrganamiz. Begona saytlar, tarmoqlar yoki akkauntlarni "sinab koʻrish" taqiqlanadi.</p>
          <p>Toʻlov guruh tasdiqlangandan keyin Payme yoki Click hisob-fakturasi yoki bank oʻtkazmasi orqali qilinadi. Karta raqamingizni hech qachon soʻramaymiz.</p>
          <p>16 yoshdan kichiklar faqat ota-ona yoki vasiy roziligi bilan qatnashadi.</p>
        </section>

        <Card className="p-6" >
          <section id="ariza" aria-labelledby="ariza-title">
            <h2 id="ariza-title" className="text-2xl font-semibold text-white">Ariza</h2>
            <p className="mt-1 text-sm text-slate-400">Ariza bepul va hech qanday majburiyat yuklamaydi. Siz bilan bogʻlanib, narx, jadval va keyingi qadamlarni aytamiz.</p>
            {status === 'sent' ? (
              <p role="status" className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-100">Rahmat! Arizangiz qabul qilindi. Tez orada siz koʻrsatgan raqam yoki Telegram orqali bogʻlanamiz.</p>
            ) : (
              <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
                <FormField id="c-name" label="Ismingiz"><Input id="c-name" required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={set('name')} /></FormField>
                <FormField id="c-contact" label="Telefon yoki Telegram" hint="Masalan: +998 90 123 45 67 yoki @username"><Input id="c-contact" required minLength={5} maxLength={80} value={form.contact} onChange={set('contact')} /></FormField>
                <FormField id="c-email" label="Email (ixtiyoriy)"><Input id="c-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} /></FormField>
                <FormField id="c-age" label="Yoshingiz">
                  <Select id="c-age" value={form.ageGroup} onChange={set('ageGroup')}>
                    <option value="under_16">16 yoshdan kichik</option>
                    <option value="16_17">16–17</option>
                    <option value="18_24">18–24</option>
                    <option value="25_plus">25 va undan katta</option>
                  </Select>
                </FormField>
                <FormField id="c-exp" label="Tajribangiz">
                  <Select id="c-exp" value={form.experience} onChange={set('experience')}>
                    <option value="none">Hech qanday, noldan boshlayman</option>
                    <option value="some_it">IT boʻyicha biroz bilaman</option>
                    <option value="some_security">Kiberxavfsizlikni biroz oʻrganganman</option>
                  </Select>
                </FormField>
                <FormField id="c-goal" label="Maqsadingiz">
                  <Select id="c-goal" value={form.goal} onChange={set('goal')}>
                    <option value="career">Shu sohada ishlash</option>
                    <option value="university">Universitet yoki olimpiadaga tayyorlanish</option>
                    <option value="current_job">Hozirgi ishimda kerak</option>
                    <option value="curiosity">Qiziqish</option>
                  </Select>
                </FormField>
                <div className="sm:col-span-2">
                  <FormField id="c-msg" label="Savol yoki izoh (ixtiyoriy)"><Textarea id="c-msg" maxLength={1000} value={form.message} onChange={set('message')} /></FormField>
                </div>
                {error ? <p role="alert" className="text-sm text-rose-300 sm:col-span-2">{error}</p> : null}
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={status === 'sending'} className="bg-sky-400 text-slate-950">{status === 'sending' ? 'Yuborilmoqda…' : 'Ariza yuborish'}</Button>
                  <p className="mt-3 text-xs text-slate-400">Maʼlumotlaringiz faqat siz bilan bogʻlanish uchun ishlatiladi. <Link to="/privacy" className="text-sky-300">Maxfiylik</Link></p>
                </div>
              </form>
            )}
          </section>
        </Card>
      </div>
    </div>
  );
}
