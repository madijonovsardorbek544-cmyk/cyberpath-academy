import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { api } from "../api/client";
import { Button, Card, Input, Loader } from "../components/ui";
import type { ExamCertificate } from "../types";

/** Public page: anyone can confirm that a certificate code belongs to a passed exam. */
export function VerifyCertificatePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? "");
  const [certificate, setCertificate] = useState<ExamCertificate | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCertificate(null);
    setError("");
    if (!code) return;
    setLoading(true);
    api.get<{ certificate: ExamCertificate }>(`/exams/verify/${encodeURIComponent(code)}`)
      .then((data) => setCertificate(data.certificate))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  return (
    <div className="min-h-screen bg-slate-950 bg-glow px-4 py-10 text-slate-100">
      <main className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-sky-300">CyberPath Academy</p>
          <h1 className="text-3xl font-semibold text-white">Verify a certificate</h1>
          <p className="text-slate-400">Enter the code printed on the candidate's certificate or profile.</p>
        </header>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={(event) => { event.preventDefault(); if (input.trim()) navigate(`/verify/${encodeURIComponent(input.trim().toUpperCase())}`); }}>
          <label htmlFor="verify-code" className="sr-only">Certificate code</label>
          <Input id="verify-code" value={input} onChange={(event) => setInput(event.target.value)} placeholder="CPA1-XXXXX-XXXXX" className="font-mono" autoComplete="off" />
          <Button type="submit" className="shrink-0 bg-sky-400 text-slate-950">Check</Button>
        </form>
        {loading ? <Loader text="Checking..." /> : null}
        <div aria-live="polite">
        {certificate ? (
          <Card className="space-y-2 border-emerald-400/40 p-6">
            <p className="flex items-center gap-2 font-semibold text-emerald-200"><CheckCircle2 size={18} aria-hidden="true" /> Valid certificate</p>
            <p className="text-2xl font-semibold text-white">{certificate.name}</p>
            <p className="text-slate-300">passed <span className="font-medium">{certificate.exam}</span> on {new Date(certificate.passedAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })} with {certificate.score} / 100.</p>
            <p className="font-mono text-sm text-slate-400">{certificate.code}</p>
          </Card>
        ) : null}
        {error ? (
          <Card className="border-rose-400/40 p-6">
            <p className="flex items-center gap-2 font-semibold text-rose-200"><XCircle size={18} aria-hidden="true" /> Not found</p>
            <p className="mt-1 text-sm text-slate-300">{error} Check the code for typos.</p>
          </Card>
        ) : null}
        </div>
        <p className="text-sm text-slate-500">The exam is a 3-hour practical: three evidence investigations plus a written incident report graded by a mentor. <Link to="/" className="text-sky-300">About CyberPath Academy</Link></p>
      </main>
    </div>
  );
}
