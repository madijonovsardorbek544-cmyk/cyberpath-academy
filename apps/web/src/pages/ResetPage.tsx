import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { Button, Card, Input, SectionTitle } from "../components/ui";

export function ResetPage() {
  const [email, setEmail] = useState("student@cyberpath.local");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("Student123!");
  const [devToken, setDevToken] = useState("");
  const [message, setMessage] = useState("");

  const requestToken = async (event: FormEvent) => {
    event.preventDefault();
    const data = await api.post<{ message: string; devResetToken?: string }>("/auth/request-password-reset", { email });
    setDevToken(data.devResetToken || "");
    setMessage(data.message);
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    const data = await api.post<{ message: string }>("/auth/reset-password", { token, password });
    setMessage(data.message);
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <Link to="/login" className="text-sm text-sky-300">← Back to login</Link>
        <SectionTitle title="Password reset" subtitle="In development mode the API returns a reset token so you can test the flow locally without email infrastructure." />
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">1. Request reset token</h3>
            <form className="mt-4 space-y-4" onSubmit={requestToken}>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              <Button className="bg-sky-400 text-slate-950">Request token</Button>
            </form>
            {devToken ? <p className="mt-4 rounded-2xl bg-slate-950/60 p-3 text-sm text-emerald-200">Dev token: {devToken}</p> : null}
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-white">2. Set a new password</h3>
            <form className="mt-4 space-y-4" onSubmit={resetPassword}>
              <Input placeholder="Reset token" value={token} onChange={(e) => setToken(e.target.value)} />
              <Input placeholder="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button className="bg-sky-400 text-slate-950">Update password</Button>
            </form>
          </Card>
        </div>
        {message ? <Card className="p-5 text-sm text-slate-300">{message}</Card> : null}
      </div>
    </div>
  );
}
